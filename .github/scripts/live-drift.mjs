#!/usr/bin/env node
/**
 * live-drift.mjs — 라이브(프로덕션) 배포본이 이 저장소 main 과 같은지 대조.
 *
 * 왜 이렇게 재나:
 *  · 커밋 번호 비교 불가 — CI 가 배포 직전 커밋을 재서명(amend)해서 배포된 번호가 저장소에 없다.
 *  · Vercel 배포 파일목록의 `uid` 는 **파일 내용의 SHA-1** 이다(실측 확인). 그래서 API 2번으로
 *    업로드된 전체 소스를 해시 대조할 수 있다 — 파일마다 내용을 받을 필요가 없다.
 *  · 사전빌드(prebuilt)로 올린 배포는 소스가 배포물에 없다 → 커밋 제목으로 물러선다.
 *
 * env: VERCEL_TOKEN · VERCEL_TEAM_ID · VERCEL_PROJECT_ID · SIMULATE_DRIFT(true 면 일부러 어긋나게)
 * 종료코드: 0=같음 · 2=어긋남 · 1=판정 불가(감시 공백이므로 침묵 금지)
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const SIMULATE = process.env.SIMULATE_DRIFT === "true";
const SKIP_DIRS = ["/node_modules/", "/.next/", "/.vercel/", "/out/", "/.git/"];

if (!TOKEN || !PROJECT) {
  console.error("VERCEL_TOKEN / VERCEL_PROJECT_ID 가 없다.");
  process.exit(1);
}

async function api(path, tries = 4) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${path}${TEAM ? `${sep}teamId=${encodeURIComponent(TEAM)}` : ""}`;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
      if (r.ok) return await r.json();
      if (r.status < 500 && r.status !== 429) throw new Error(`HTTP ${r.status} ${path}`);
      if (i === tries - 1) throw new Error(`HTTP ${r.status} ${path}`);
    } catch (err) {
      if (i === tries - 1) throw err;
    }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
}

function* walk(tree, prefix = "") {
  for (const n of tree) {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "directory") yield* walk(n.children || [], p);
    else yield [p, n.uid];
  }
}

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

let dep;
try {
  // 시험용 경로 — 저장소 variable 로 잘못 설정되면 감시가 옛 배포에 고정돼 조용히 눈먼다.
  //   수동 실행(workflow_dispatch)이나 로컬에서만 존중한다.
  const allowFixedId =
    !process.env.GITHUB_ACTIONS || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  if (process.env.DEPLOYMENT_ID && allowFixedId) {
    dep = await api(`/v13/deployments/${process.env.DEPLOYMENT_ID}`);
    dep.uid = dep.id || dep.uid;
  } else {
    // ★"가장 최근 프로덕션 배포"가 아니라 **지금 라이브 별칭이 가리키는 배포**를 대조해야 한다.
    //   최신 배포가 ERROR/BUILDING 이면 라이브는 그 앞의 배포를 계속 서빙하므로,
    //   최신만 보면 엉뚱한 대상과 비교해 오탐·미탐이 양쪽으로 난다(딥리뷰 퀴즈 지적).
    const proj = await api(`/v9/projects/${PROJECT}`);
    const liveId = proj?.targets?.production?.id;
    if (liveId) {
      dep = await api(`/v13/deployments/${liveId}`);
      dep.uid = dep.id || dep.uid;
    } else {
      const list = await api(`/v6/deployments?projectId=${PROJECT}&target=production&limit=10`);
      dep = (list.deployments || []).find((d) => d.readyState === "READY");
    }
  }
} catch (err) {
  console.error(`배포 조회 실패: ${err.message}`);
  process.exit(1);
}
if (!dep) {
  console.error("프로덕션 배포가 없다 — 판정 불가");
  process.exit(1);
}

// v6 목록은 `created`, v13 상세는 `createdAt` 을 준다(시험 경로에서 깨졌던 자리).
const createdMs = dep.created ?? dep.createdAt ?? dep.buildingAt;
const when = createdMs ? new Date(createdMs).toISOString() : "(시각 없음)";
const who = dep.creator?.username || "(알 수 없음)";
const msg = (dep.meta?.githubCommitMessage || "").split("\n")[0];
console.log(`라이브 배포: ${when} · ${who} · ${dep.readyState} · ${msg || "(커밋 제목 없음)"}`);

let deployed;
try {
  deployed = [...walk(await api(`/v6/deployments/${dep.uid}/files`))].filter(
    ([p]) => !SKIP_DIRS.some((s) => `/${p}`.includes(s)),
  );
} catch (err) {
  console.error(`배포 파일목록 조회 실패: ${err.message}`);
  process.exit(1);
}

// 업로드된 소스는 배포물 안에서 `src/` 아래에 들어간다 → 저장소 기준 경로로 되돌린다.
const repoPaths = new Map();
for (const [p, uid] of deployed) {
  if (!p.startsWith("src/")) continue;
  repoPaths.set(p.slice("src/".length), uid);
}

const tracked = new Set(
  // core.quotepath 기본값이면 한글 경로가 "src/\355…" 로 인용돼 대조에서 조용히 빠진다.
  execFileSync("git", ["-c", "core.quotepath=off", "ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

// 소스가 배포물에 없다(사전빌드) → 커밋 제목으로 물러선다.
const sourceLike = [...repoPaths.keys()].filter((p) => p.startsWith("src/"));
if (sourceLike.length === 0) {
  const titles = execFileSync("git", ["log", "--format=%s", "-50"], { encoding: "utf8" }).split("\n");
  if (!msg) {
    console.error("사전빌드 배포인데 커밋 제목도 없어 대조 불가");
    process.exit(1);
  }
  const ok = titles.includes(msg);
  console.log(`사전빌드 배포 — 커밋 제목으로 대조: ${ok ? "main 최근 50개에 있음" : "★main 에 없는 제목"}`);
  process.exit(ok ? 0 : 2);
}

const diff = [];
const untrackedExtra = [];
const extraSource = [];
let compared = 0;
for (const [p, uid] of repoPaths) {
  if (!tracked.has(p)) {
    // ★소스(src/)에 있는데 저장소에 없는 파일 = "푸시 안 한 새 파일을 로컬에서 배포"의 지문.
    //   이 통로를 정보로만 두면 이 감시자가 만들어진 이유의 절반이 새어 나간다.
    if (p.startsWith("src/")) extraSource.push(p);
    else untrackedExtra.push(p);
    continue;
  }
  if (!existsSync(p)) {
    diff.push(`${p} — 저장소에 없음(배포본에만 있음)`);
    continue;
  }
  let local = sha1(readFileSync(p));
  if (SIMULATE && compared === 0) local = "0".repeat(40); // 검출·알림 경로 시험용
  compared++;
  if (local !== uid) diff.push(`${p} — 내용 다름`);
}
// 배포본에 없는 소스 파일(라이브가 옛 트리라 파일이 아직 없는 경우)
const missing = [...tracked].filter((p) => p.startsWith("src/") && !repoPaths.has(p));

console.log(
  `대조 ${compared}개 · 다름 ${diff.length}개 · 배포본에 없는 소스 ${missing.length}개 · ` +
    `저장소에 없는 소스 ${extraSource.length}개 · 추적 밖(자산 등) ${untrackedExtra.length}개`,
);
for (const d of diff.slice(0, 10)) console.log(`  ✗ ${d}`);
for (const m of missing.slice(0, 10)) console.log(`  ✗ ${m} — 배포본에 없음`);
for (const e of extraSource.slice(0, 10)) console.log(`  ✗ ${e} — 배포본에만 있음(main 에 없는 소스)`);
if (untrackedExtra.length) console.log(`  · 추적 밖 파일(정보): ${untrackedExtra.slice(0, 5).join(", ")}`);

if (compared === 0) {
  console.error("대조한 파일이 0개 — 경로 가정이 틀렸을 수 있다(판정 불가)");
  process.exit(1);
}
if (diff.length || missing.length || extraSource.length) {
  console.log("판정: 라이브가 main 과 다르다");
  process.exit(2);
}
console.log("판정: 라이브 = main");
process.exit(0);
