#!/usr/bin/env node
/**
 * 개인 연락처 하드코딩 검사 — **클론 사이트판**.
 *
 * 정본은 revrun 저장소의 `scripts/pii-scan.mjs` 다. 클론은 **별도 저장소**라 그 파일을
 * 불러 쓸 수 없어 판정 부분을 그대로 옮겨 왔다(아래 「판정 — 정본과 같은 글자」 구간).
 * ★그 구간을 손으로 고치지 말 것. 두 잣대가 갈리면 어느 쪽이 맞는지 아무도 모르게 된다.
 *   revrun 의 `admin/src/lib/__tests__/clone-pii-scan-sync.test.ts` 가 두 글자가 같은지 본다.
 *
 * ── 클론판이 정본과 다른 점: 「전부 0건」이 아니라 **기준선 대비 늘었나**를 본다 ───────────
 * 클론에는 **그 업체 자신의 전화번호**가 반드시 들어 있다(화면에 띄워야 하니까). 그걸 지우면
 * 고객 사이트에서 전화가 사라진다. 그래서 「번호 금지」가 아니라 **「늘어나면 빨간불」** 이다.
 *
 *   · 기준선 `.pii-baseline.json` = 파일별 **개수만** 적는다. ★번호 자체는 적지 않는다.
 *   · 늘거나 새 파일에 생기면  → 빨간불(1)
 *   · 줄었는데 기준선이 그대로 → 빨간불(2) + 낮추는 명령 안내 (한 번 내려간 선은 다시 안 오른다)
 *
 * 쓰기:  node .github/scripts/pii-scan.mjs                  # 검사
 *        node .github/scripts/pii-scan.mjs --update-baseline # 기준선 다시 적기(지운 뒤 한 번)
 * 종료코드: 0 클린 · 1 늘어남 · 2 기준선/내부 문제(둘 다 차단해야 한다 — rc 를 뭉개지 말 것)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";

/**
 * ★검사기와 기준선을 둘 다 `.github/` 아래 둔다 — 그 경로가 `deploy.yml` 의 `paths-ignore` 라
 *   **고객 사이트 재배포를 깨우지 않는다.** 클론 40여 곳에 한꺼번에 깔아야 해서 중요하다
 *   (재배포는 공짜가 아니다 — 2026-10-22 에 재배포가 Server Action 번호를 바꿔 매장 장치가 21분 멈췄다).
 */
const BASELINE = ".github/pii-baseline.json";
const MAX_BYTES = 20 * 1024 * 1024;

// ── 판정 — 정본과 같은 글자 (SYNC-BEGIN) ─────────────────────────────────────
const MOBILE = /(?<![\d.])(01[016789])([-.\s]?)(\d{3,4})([-.\s]?)(\d{4})(?![\d.])/g;
const SAFE = /0507[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
/**
 * ★국제표기 — 나라번호를 붙여 적은 꼴(플러스·82·휴대폰앞자리가 이어지거나, 사이에 빈칸·붙임표·
 *   괄호 영을 끼운 것, `0082` 로 시작하는 것).  ※여기에 **보기 번호를 적지 않는다** — 적는 순간
 *   이 파일 자신이 검출 대상이 된다(실제로 두 번 그랬다).
 * ★나라번호는 **플러스나 0082 가 붙은 것만** 본다. 맨 「82」까지 보면 오탐이 난다 —
 *   실측으로 ①글 제목 안의 숫자열 ②UUID 의 한 토막이 걸렸다(둘 다 전화가 아니다).
 *   2026-11-06 실측: 위 MOBILE 은 앞이 `01` 이라야 보므로 **이 꼴을 한 건도 못 봤다.**
 *   `_base` 의 한 줄이 그래서 11-06 전수 정리에서 살아남았다(옆줄의 국내표기만 가려졌다).
 */
const INTL = /(?<![\d.])(?:\+82|0082)[-.\s]?\(?0?\)?[-.\s]?(1[016789])([-.\s]?)(\d{3,4})([-.\s]?)(\d{4})(?![\d.])/g;

function syntheticTail(tail) {
  if (new Set(tail).size === 1) return true;
  const diffs = new Set();
  for (let i = 1; i < tail.length; i++) diffs.add(Number(tail[i]) - Number(tail[i - 1]));
  return diffs.size === 1 && (diffs.has(1) || diffs.has(-1));
}

const isPlaceholder = (mid, last) =>
  /^0+$/.test(mid) ||                                   // 010-0000-NNNN (정리가 쓰는 예약 꼴)
  (new Set(mid).size === 1 && new Set(last).size === 1) || // 1111-2222 류(시험 지문에 흔하다)
  syntheticTail(mid + last);

function inHexRun(s, start, end) {
  let i = start;
  let j = end;
  while (i > 0 && /[0-9a-fA-F]/.test(s[i - 1])) i--;
  while (j < s.length && /[0-9a-fA-F]/.test(s[j])) j++;
  const run = s.slice(i, j);
  return run.length >= 12 && /[a-fA-F]/.test(run);
}

function inHost(s, start, end) {
  const left = s.slice(Math.max(0, start - 12), start);
  const right = s.slice(end, end + 12);
  return /(https?:\/\/|www\.|[a-z0-9-]\.)$/i.test(left) && /^\.(co\.kr|kr|com|net|org|io)\b/i.test(right);
}

const SPLIT = /["'](01[016789])["']\s*[,+]\s*["'](\d{3,4})["']\s*[,+]\s*["'](\d{4})["']/g;

export function findPhones(text) {
  const masked = text.replace(SAFE, (m) => "\u0000".repeat(m.length));
  const out = [];
  for (const m of masked.matchAll(MOBILE)) {
    if (isPlaceholder(m[3], m[5])) continue;
    if (inHexRun(text, m.index, m.index + m[0].length)) continue;
    if (inHost(text, m.index, m.index + m[0].length)) continue;
    out.push({ index: m.index, line: text.slice(0, m.index).split("\n").length });
  }
  for (const m of masked.matchAll(INTL)) {
    if (isPlaceholder(m[3], m[5])) continue;
    if (inHexRun(text, m.index, m.index + m[0].length)) continue;
    out.push({ index: m.index, line: text.slice(0, m.index).split("\n").length });
  }
  for (const m of text.matchAll(SPLIT)) {
    if (isPlaceholder(m[2], m[3])) continue;
    out.push({ index: m.index, line: text.slice(0, m.index).split("\n").length });
  }
  return out;
}

/** 추적 중인 파일별 검출 개수. */
export function scanTracked(cwd = process.cwd()) {
  const files = execFileSync("git", ["ls-files", "-z"], { cwd, encoding: "utf8", maxBuffer: 1 << 28 })
    .split("\0")
    .filter(Boolean);
  const counts = {};
  for (const f of files) {
    try {
      if (statSync(f).size > MAX_BYTES) continue;
      const n = findPhones(readFileSync(f, "utf8")).length;
      if (n) counts[f] = n;
    } catch {
      /* 바이너리·심링크·없는 파일 */
    }
  }
  return { fileCount: files.length, counts };
}

function main() {
  const update = process.argv.includes("--update-baseline");
  let scan;
  try {
    scan = scanTracked();
  } catch (e) {
    console.error(`[pii-scan] git ls-files 실패: ${e.message}`);
    process.exit(2);
  }
  // 0건을 훑고 초록불을 내지 않는다 — 엉뚱한 폴더에서 돌고 있을 수 있다.
  if (scan.fileCount < 20) {
    console.error(`[pii-scan] 추적 파일이 ${scan.fileCount}개뿐이다 — 저장소 루트에서 돌리고 있나?`);
    process.exit(2);
  }

  if (update) {
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          note:
            "파일별 전화번호 **개수**만 적는다(번호 자체는 절대 적지 않는다). " +
            "늘면 빨간불, 줄었는데 여기를 안 고쳐도 빨간불 — 한 번 내려간 선은 다시 안 오른다.",
          updated: new Date().toISOString().slice(0, 10),
          files: scan.counts,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`[pii-scan] 기준선 다시 적음 — 파일 ${Object.keys(scan.counts).length}개 · 자리 ${sum(scan.counts)}개`);
    return;
  }

  if (!existsSync(BASELINE)) {
    console.error(
      `[pii-scan] ${BASELINE} 이 없다. 설치 직후라면 한 번 만들어 커밋하세요:\n` +
        "  node .github/scripts/pii-scan.mjs --update-baseline",
    );
    process.exit(2);
  }

  let base;
  try {
    base = JSON.parse(readFileSync(BASELINE, "utf8")).files ?? {};
  } catch (e) {
    console.error(`[pii-scan] ${BASELINE} 을 읽지 못했다: ${e.message}`);
    process.exit(2);
  }

  const grew = [];
  const shrank = [];
  for (const [f, n] of Object.entries(scan.counts)) {
    const was = base[f] ?? 0;
    if (n > was) grew.push({ f, was, now: n });
  }
  for (const [f, was] of Object.entries(base)) {
    const now = scan.counts[f] ?? 0;
    if (now < was) shrank.push({ f, was, now });
  }

  console.log(
    `[pii-scan] 추적 파일 ${scan.fileCount}개 · 번호가 있는 파일 ${Object.keys(scan.counts).length}개 · ` +
      `자리 ${sum(scan.counts)}개(기준선 ${sum(base)}개)`,
  );
  // ★번호 자체는 찍지 않는다 — CI 로그에 다시 남기지 않는다.
  for (const g of grew) console.log(`  늘어남 ${g.f}  ${g.was} → ${g.now}`);
  for (const s of shrank) console.log(`  줄어듦 ${s.f}  ${s.was} → ${s.now}`);

  if (grew.length) {
    console.error(
      "\n[pii-scan] 전화번호가 **늘었습니다.**\n" +
        "  그 업체 자신의 번호가 아니면 지우세요(자료·기록은 `[전화번호 삭제]`, 코드·시험은 `010-0000-NNNN`).\n" +
        "  그 업체 자신의 번호라서 꼭 있어야 하면 기준선을 올립니다: node .github/scripts/pii-scan.mjs --update-baseline",
    );
    process.exit(1);
  }
  if (shrank.length) {
    console.error(
      "\n[pii-scan] 줄었는데 기준선이 그대로입니다 — 내려간 선을 적어 두세요(다시 못 오르게):\n" +
        "  node .github/scripts/pii-scan.mjs --update-baseline",
    );
    process.exit(2);
  }
  console.log("[pii-scan] 기준선과 같음 — 통과");
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

if (import.meta.url === `file://${process.argv[1]}`) main();
