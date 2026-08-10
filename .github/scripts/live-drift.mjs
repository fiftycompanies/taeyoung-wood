#!/usr/bin/env node
/**
 * live-drift.mjs — 라이브(프로덕션) 배포본이 이 저장소 main 과 같은지 대조.
 *
 * 왜 이렇게 재나:
 *  · 커밋 번호 비교 불가 — CI 가 배포 직전 커밋을 재서명(amend)해서 배포된 번호가 저장소에 없다.
 *  · Vercel 배포 파일목록의 `uid` 는 **파일 내용의 SHA-1** 이다(실측 확인). 그래서 API 2번으로
 *    업로드된 전체 소스를 해시 대조할 수 있다 — 파일마다 내용을 받을 필요가 없다.
 *  · 사전빌드(prebuilt)로 올린 배포는 소스가 배포물에 없다 → **판정 불가**(2026-08-10 강등).
 *    예전에는 커밋 제목이 최근 50개에 있는지로 물러섰는데, 그건 이 감시자가 겨냥한 사고
 *    (「푸시 안 한 로컬 코드를 배포」)에 **구조적으로 눈이 먼다** — 로컬에서 고친 파일을
 *    커밋만 하고 푸시 안 한 채 배포하면 제목은 그대로라 초록이 뜬다. 초록은 거짓말이므로 안 낸다.
 *
 * ★제외 목록의 정본은 **그 저장소 `deploy.yml` 의 `paths-ignore`** 다 (2026-08-10).
 *   배포가 안 도는 경로는 라이브에 옛 사본이 남는 게 **정상**이라 어긋남이 아니다.
 *   예전에는 이 목록을 스크립트에 베껴 적었는데, 저장소마다 목록이 달라(실측: 44곳 중 9곳이
 *   `scripts/**` 를 더 쓴다) 베낀 사본이 이미 어긋나 있었다 → 그 9곳은 상시 오탐 예정이었다.
 *   (2026-08-09 에는 반대 방향으로 같은 사고: 목록을 안 맞춰 25곳 중 18곳이 오탐, 이슈 19건)
 *
 * env: VERCEL_TOKEN · VERCEL_TEAM_ID · VERCEL_PROJECT_ID
 *      SIMULATE_DRIFT=true|content|missing|extra (검출·알림 경로 대조군)
 * 종료코드: 0=같음 · 2=어긋남 · 1=판정 불가(감시 공백이므로 침묵 금지)
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * 배포되는 트리가 저장소 루트가 아닐 때 쓴다(모노레포 안의 사이트).
 * 예: revrun 저장소가 `services/db_mkt/aceko/` 를 배포한다 → DRIFT_ROOT 로 그 폴더를 준다.
 * ★이 갈래가 없으면 그런 사이트는 「제 저장소가 아닌 낡은 사본」과 대조돼 영원히 어긋남이 뜬다.
 */
const ROOT = process.env.DRIFT_ROOT || ".";

/** 구조적으로 저장소에 대응이 없는 경로 — 어떤 저장소든 대조 대상이 아니다. */
export const STRUCTURAL_SKIP = ["/node_modules/", "/.next/", "/.vercel/", "/out/", "/.git/"];

/**
 * Vercel CLI 가 **애초에 올리지 않는** 파일들(클라이언트 기본 제외 목록).
 * 저장소에는 있지만 배포물엔 없는 게 정상이므로 「배포본에 없음」으로 부르면 전 함대 오탐이다.
 * ★실측(2026-08-10 시범 2곳): `.gitignore`·`.dockerignore` 가 218/310개 대조에서 유일한 불일치였다.
 *   목록을 넓게 잡아 두는 쪽이 안전하다 — 여기 걸리는 파일은 사이트 내용이 아니다.
 */
export const NEVER_UPLOADED = [
  "**/.git",
  "**/.gitignore",
  "**/.gitmodules",
  "**/.gitattributes",
  "**/.dockerignore",
  "**/.npmignore",
  "**/.vercelignore",
  "**/.DS_Store",
  "**/.hg",
  "**/.svn",
  "**/CVS",
  "**/npm-debug.log",
  "**/config.gypi",
  "**/.env.local",
  "**/.env.*.local",
  "**/.*.swp",
];

/**
 * deploy.yml 을 못 읽었을 때만 쓰는 최후 기본값.
 * ★이 값에 기대면 안 된다 — 저장소마다 다르다. 쓰였다면 실행 요약에 그 사실이 찍힌다.
 */
export const FALLBACK_IGNORE = [".github/**", "**/*.md", ".vercel/**"];

/** 깃허브 액션 경로 필터 글롭 → 정규식. `**`=슬래시 포함 아무거나 · `*`=슬래시 제외. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        // `**/foo` 는 최상위 `foo` 도 매치해야 한다 → 슬래시를 선택적으로 삼킨다
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

/**
 * 워크플로 yaml 에서 `paths-ignore` 항목을 뽑는다. 흐름형(`[a, b]`)·블록형(`- a`) 둘 다.
 * ★파일 전체 grep 으로 판정하지 않는다 — 2026-08-09 에 그렇게 해서 틀렸다. 그 **블록만** 읽는다.
 */
export function parsePathsIgnore(yamlText) {
  const globs = [];
  const re = /paths-ignore:[ \t]*(\[[^\]]*\]|\r?\n((?:[ \t]*-[ \t]*\S.*\r?\n?)+))/g;
  let m;
  while ((m = re.exec(yamlText))) {
    if (m[1].startsWith("[")) {
      for (const raw of m[1].slice(1, -1).split(",")) {
        const v = raw.trim().replace(/^["']|["']$/g, "");
        if (v) globs.push(v);
      }
    } else {
      for (const line of m[2].split(/\r?\n/)) {
        const v = line.trim();
        if (!v.startsWith("-")) continue;
        const g = v.slice(1).trim().replace(/^["']|["']$/g, "");
        if (g) globs.push(g);
      }
    }
  }
  return globs;
}

/** 저장소 기준 경로 하나를 대조에서 뺄지 판정. 배포본·저장소 **양쪽에** 같은 잣대를 쓴다. */
export function makeSkip(ignoreGlobs) {
  const res = [...ignoreGlobs, ...NEVER_UPLOADED].map(globToRegExp);
  return (p) => STRUCTURAL_SKIP.some((s) => `/${p}`.includes(s)) || res.some((r) => r.test(p));
}

/** 이 저장소의 제외 목록 정본을 읽는다. 못 읽으면 그 사실을 함께 돌려준다(조용한 폴백 금지). */
export function loadIgnoreGlobs(
  readFile = (p) => readFileSync(p, "utf8"),
  path = process.env.DRIFT_DEPLOY_WORKFLOW || ".github/workflows/deploy.yml",
) {
  let text;
  try {
    text = readFile(path);
  } catch {
    return { globs: FALLBACK_IGNORE, source: `기본값(${path} 를 못 읽었다)`, degraded: true };
  }
  const globs = parsePathsIgnore(text);
  if (globs.length === 0) {
    // paths-ignore 가 아예 없는 저장소는 모든 변경이 배포된다 → 뺄 것도 없다(haebit 실측).
    return { globs: [], source: `${path} (paths-ignore 없음 — 전부 대조)`, degraded: false };
  }
  return { globs, source: path, degraded: false };
}

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

function* walk(tree, prefix = "") {
  for (const n of tree) {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "directory") yield* walk(n.children || [], p);
    else yield [p, n.uid];
  }
}

/**
 * 무시 규칙에 걸리는 경로를 git 에게 물어 가려낸다.
 *
 * ★`.vercelignore` 를 **반드시** 함께 본다 — Vercel CLI 가 애초에 올리지 않는 목록이라,
 *   여기 걸린 파일이 배포물에 없는 건 정상이다. 안 보면 그 저장소는 상시 오탐이 된다.
 *   (2026-08-10 실측: 시범 6곳엔 없어서 「함대에 없다」고 단정했는데, 새로 감시를 켠 13곳 중
 *    3곳에 있었다 — junggamlaw 21줄·ostop 5줄·egdmcamp-gateway 20줄. 표본이 모집단이 아니다.)
 *
 * ★규칙 문법은 gitignore 와 같으므로 직접 구현하지 않고 git 에게 판정시킨다
 *   (`core.excludesFile`). 손으로 만든 글롭 해석기는 `.aider*`·`docs/` 같은 형태에서 어긋난다.
 */
export function ignoredPaths(paths, { noIndex = false, cwd } = {}) {
  if (paths.length === 0) return new Set();
  const args = ["-c", "core.excludesFile=.vercelignore", "check-ignore", "--stdin"];
  if (noIndex) args.push("--no-index"); // 추적 중인 파일도 규칙에 걸리는지 보려면 필요하다
  let out = "";
  try {
    out = execFileSync("git", args, { encoding: "utf8", input: paths.join("\n"), cwd });
  } catch (err) {
    // 일치가 0건이면 git 이 종료코드 **1** 로 끝난다 — 실패가 아니다.
    // ★그 밖의 종료코드(예: .git 이 없어 128)를 같이 삼키면 빌드 산출물이 전부
    //   「main 에 없는 파일」로 둔갑해 오탐이 된다 → 다시 던져 판정 불가로 보낸다.
    if (err.status !== 1) throw err;
    out = err.stdout ?? "";
  }
  return new Set(out.split("\n").filter(Boolean));
}

async function main() {
  const TOKEN = process.env.VERCEL_TOKEN;
  const TEAM = process.env.VERCEL_TEAM_ID;
  const PROJECT = process.env.VERCEL_PROJECT_ID;
  const SIM = (process.env.SIMULATE_DRIFT || "").toLowerCase();
  const SIM_MODE = SIM === "true" ? "content" : SIM; // 옛 호출부 호환

  if (!TOKEN || !PROJECT) {
    console.error("VERCEL_TOKEN / VERCEL_PROJECT_ID 가 없다.");
    process.exit(1);
  }

  async function api(path, tries = 4) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `https://api.vercel.com${path}${TEAM ? `${sep}teamId=${encodeURIComponent(TEAM)}` : ""}`;
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${TOKEN}` },
          signal: AbortSignal.timeout(20_000), // 매달리면 잡 타임아웃으로 죽어 알림이 아예 안 돈다
        });
        if (r.ok) return await r.json();
        if (r.status < 500 && r.status !== 429) throw new Error(`HTTP ${r.status} ${path}`);
        if (i === tries - 1) throw new Error(`HTTP ${r.status} ${path}`);
      } catch (err) {
        if (i === tries - 1) throw err;
      }
      await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
    }
  }

  const ignore = loadIgnoreGlobs();
  const skipped = makeSkip(ignore.globs);
  console.log(
    `제외 목록 정본: ${ignore.source}${ignore.globs.length ? ` → [${ignore.globs.join(", ")}]` : ""}`,
  );
  if (ignore.degraded) console.log("::warning::제외 목록을 저장소에서 못 읽어 기본값을 썼다 — 오탐이 날 수 있다");

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
      //   최신만 보면 엉뚱한 대상과 비교해 오탐·미탐이 양쪽으로 난다.
      // ★정본은 **별칭의 deploymentId** 다. `targets.production` 은 별칭고정(alias set) 계열에서
      //   별칭과 갈린다 — 2026-08-10 중앙 대조 실측 4곳(standardcare·staystone·admin·haebit).
      //   그 경우 `targets.production` 을 믿으면 **고객이 보지 않는 배포**와 대조하게 된다.
      let liveId = null;
      let via = "";
      try {
        const al = await api(`/v4/aliases?projectId=${PROJECT}&limit=100`);
        const aliases = al?.aliases || [];
        const custom = aliases.filter((a) => !String(a.alias).endsWith(".vercel.app"));
        const pool = custom.length ? custom : aliases;
        const live = pool.slice().sort((a, b) => String(a.alias).length - String(b.alias).length)[0];
        if (live?.deploymentId) {
          liveId = live.deploymentId;
          via = `별칭 ${live.alias}`;
        }
      } catch (err) {
        console.log(`::warning::별칭 조회 실패(${err.message}) — 프로젝트 프로덕션 포인터로 물러선다`);
      }
      const proj = await api(`/v9/projects/${PROJECT}`);
      if (!liveId && proj?.targets?.production?.id) {
        liveId = proj.targets.production.id;
        via = "프로젝트 프로덕션 포인터";
      }
      if (liveId) {
        console.log(`대조 대상: ${via}`);
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
    deployed = [...walk(await api(`/v6/deployments/${dep.uid}/files`))];
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

  // ★소스가 배포물에 아예 없다(사전빌드) → 대조 불가. **초록을 내지 않는다.**
  //   예전 조건은 `repoPaths` 키에서 `src/` 로 시작하는 것을 셌는데, 그 키는 이미 `src/` 가
  //   벗겨져 있어 사실상 "저장소에 최상위 src/ 폴더가 있나"를 물었다 — 루트 `app/` 구조
  //   저장소를 만나면 멀쩡한 배포를 조용히 약한 경로로 강등시켰다(2026-08-09 딥리뷰 지적).
  // ★개수는 **제외를 적용한 뒤** 센다. 사전빌드 배포물은 `.vercel/output/…` 만 담고 있어
  //   제외 전에는 비어 있지 않다 — 그대로 세면 사전빌드를 사전빌드로 못 알아본다(haebit 실측).
  const comparable = [...repoPaths.keys()].filter((p) => !skipped(p));
  if (comparable.length === 0) {
    console.error(
      "사전빌드 배포로 보인다(배포물에 소스 트리가 없다) — 내용 대조 불가.\n" +
        "  커밋 제목 대조는 「커밋은 했지만 푸시 안 한 배포」에 눈이 멀어 쓰지 않는다.\n" +
        "  이 저장소는 내용 감시가 되지 않는다 — 배포를 원격 빌드(`vercel deploy --prod`)로 바꿔야 감시된다.",
    );
    process.exit(1);
  }

  const trackedAll = execFileSync("git", ["-c", "core.quotepath=off", "ls-files"], {
    encoding: "utf8",
    cwd: ROOT,
  })
    .split("\n")
    .filter(Boolean);
  // ★무시 규칙 판정은 **배포본·저장소 양쪽에 한 번에, 같은 조건으로** 한다.
  //   한쪽만 `--no-index` 로 물으면 어긋난다: git 은 `--no-index` 없이는 **추적 중인 파일을
  //   아예 대답에서 뺀다**. 그래서 「.gitignore 에 적혀 있는데 커밋도 돼 있고 배포도 된」 파일이
  //   저장소 쪽에선 빠지고 배포 쪽에선 안 걸려 **「main 에 없는 파일」로 둔갑**했다.
  //   실측(2026-08-10): 그 한 줄 차이로 4곳이 오탐 — 그중 3곳의 파일은 38곳에 커밋된 소유확인 파일이었다.
  const ignored = ignoredPaths(
    [...new Set([...trackedAll, ...repoPaths.keys()])].filter((p) => !skipped(p)),
    { noIndex: true, cwd: ROOT },
  );
  const tracked = new Set(trackedAll.filter((p) => !skipped(p) && !ignored.has(p)));

  const diff = [];
  const extra = [];
  let compared = 0;
  const untrackedDeployed = [];
  for (const [p, uid] of repoPaths) {
    if (skipped(p) || ignored.has(p)) continue;
    if (!tracked.has(p)) {
      untrackedDeployed.push(p);
      continue;
    }
    if (!existsSync(join(ROOT, p))) {
      diff.push(`${p} — 작업트리에 없음`);
      continue;
    }
    let local = sha1(readFileSync(join(ROOT, p)));
    if (SIM_MODE === "content" && compared === 0) local = "0".repeat(40); // 검출·알림 경로 시험용
    compared++;
    if (local !== uid) diff.push(`${p} — 내용 다름`);
  }

  // ★배포됐는데 저장소에 없는 파일 = 「푸시 안 한 새 파일을 로컬에서 배포」의 지문.
  //   무시 규칙에 걸리는 것은 위에서 이미 걸러졌다(같은 잣대·같은 조건). 여기 남은 건 진짜다.
  //   예전에는 `src/` 로 시작하는 것만 경보로 쳐서 `public/` 사진·문구 추가가 통째로
  //   새어 나갔다(monti 기준 public/ 125개).
  extra.push(...untrackedDeployed);
  if (SIM_MODE === "extra") extra.push("__simulated__/새파일.txt");

  // 배포본에 없는 저장소 파일(라이브가 옛 트리라 파일이 아직 없는 경우)
  const missing = [...tracked].filter((p) => !repoPaths.has(p));
  if (SIM_MODE === "missing") missing.push("__simulated__/사라진파일.txt");

  console.log(
    `대조 ${compared}개 · 다름 ${diff.length}개 · 배포본에 없는 파일 ${missing.length}개 · ` +
      `저장소에 없는 파일 ${extra.length}개 · 무시 규칙 대상(정상) ${ignored.size}개`,
  );
  for (const d of diff.slice(0, 10)) console.log(`  ✗ ${d}`);
  for (const m of missing.slice(0, 10)) console.log(`  ✗ ${m} — 배포본에 없음`);
  for (const e of extra.slice(0, 10)) console.log(`  ✗ ${e} — 배포본에만 있음(main 에 없는 파일)`);
  // 조용한 절단 금지 — 잘렸으면 전체 개수를 밝힌다(위 요약 줄에 이미 있다).
  if (ignored.size) console.log(`  · 무시 규칙 대상(정보): ${[...ignored].slice(0, 5).join(", ")}`);

  if (compared === 0) {
    console.error("대조한 파일이 0개 — 경로 가정이 틀렸을 수 있다(판정 불가)");
    process.exit(1);
  }
  if (diff.length || missing.length || extra.length) {
    console.log("판정: 라이브가 main 과 다르다");
    process.exit(2);
  }
  console.log("판정: 라이브 = main");
  process.exit(0);
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await main();
