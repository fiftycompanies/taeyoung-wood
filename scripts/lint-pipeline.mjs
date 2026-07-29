#!/usr/bin/env node
/**
 * Lint Pipeline — 클론이 PIPELINE.md "산출물 계약"을 만족하는지 검증하는 게이트.
 *                 세 진입점(clone-website/clone-site/build-site)이 같은 산출물을 내도록 강제한다.
 *
 * 사용법:
 *   node scripts/lint-pipeline.mjs           # 클론 폴더(cwd)에서 실행
 *
 * 검사:
 *   [존재] ① docs/research/design-tokens.json (+ .css)        — 토큰 자동실측
 *          ③ docs/research/visual-diff/report.md + compare-*.png — side-by-side 판정
 *            docs/research/animation-audit/diff.md            — Phase 6
 *            docs/research/interaction-audit/report.md        — Phase 7
 *   [P1-clean] interaction "판정: P1 N" == 0 · animation "### 🔴 P1" 없음 ·
 *              (Haiku 돌았으면) visual-diff "P1 (N)" == 0
 *
 * 종료코드: 0=PASS · 1=필수 산출물 누락 · 2=P1 잔존
 *   → clone-site/build-site 완료 게이트, CI에서 사용 가능.
 */

import fs from "node:fs";
import path from "node:path";

const R = "docs/research";
const problems = { missing: [], p1: [] };
const warnings = [];

const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, "utf8") : null);
const glob1 = (dir, re) => (exists(dir) ? fs.readdirSync(dir).some((f) => re.test(f)) : false);

// ★ divergence 모드 = variation.config.json 존재(REVRUN 차별화 경로). 순수 픽셀복제면 false.
const DIVERGENCE = exists("variation.config.json");

// ── 1. 필수 산출물 존재 ──────────────────────────────────────
const required = [
  { p: `${R}/design-tokens.json`, label: "① 토큰 실측 design-tokens.json (extract-tokens.mjs)" },
  { p: `${R}/design-tokens.css`, label: "① 토큰 스캐폴드 design-tokens.css (extract-tokens.mjs)" },
  { p: `${R}/visual-diff/report.md`, label: "③ visual-diff report.md (visual-diff.mjs)" },
  { p: `${R}/animation-audit/diff.md`, label: "Phase6 animation diff.md (animation-audit.mjs)" },
  { p: `${R}/interaction-audit/report.md`, label: "Phase7 interaction report.md (interaction-audit.mjs)" },
];
// ★divergence면 Phase 1.5 config + Phase 5.5 디자인검수 산출물을 추가 강제(안 하면 차별화가 선택사항이 됨)
if (DIVERGENCE) {
  required.push({ p: `${R}/divergence-design-review.md`, label: "Phase5.5 divergence-design-review.md (design-master·ui-ux-pro-max 검수)" });
}
for (const r of required) if (!exists(r.p)) problems.missing.push(r.label);

// ── 1.5 divergence 디자인검수 P0 게이트 ─────────────────────
// divergence-design-review.md에 미해결 P0(위계 붕괴·섹션 흐름 어색·모바일 잘림·대비 미달)이 있으면 GATE BLOCK.
// 포맷 계약: 파일에 "판정: PASS|BLOCK" 또는 "🔴 P0 (N)" 표기.
if (DIVERGENCE) {
  const dr = read(`${R}/divergence-design-review.md`);
  if (dr) {
    const p0 = dr.match(/🔴\s*P0\s*\((\d+)\)/);
    if (p0 && Number(p0[1]) > 0) problems.p1.push(`Phase5.5 디자인검수 P0 ${p0[1]}건 (위계/흐름/모바일/대비) — GATE BLOCK`);
    else if (/판정:\s*BLOCK/i.test(dr)) problems.p1.push("Phase5.5 디자인검수 판정=BLOCK — 수정 후 재검");
  }
}

// compare-*.png 최소 1장
if (!glob1(`${R}/visual-diff`, /^compare-.*\.png$/)) problems.missing.push("③ visual-diff/compare-*.png (side-by-side 합성)");

// ── 2. P1-clean (기계검증 가능한 것만) ───────────────────────
// interaction: "- 판정: P1 N · P2 N · P3 N"
const inter = read(`${R}/interaction-audit/report.md`);
if (inter) {
  const m = inter.match(/판정:\s*P1\s*(\d+)/);
  if (m && Number(m[1]) > 0) problems.p1.push(`Phase7 interaction P1 ${m[1]}건 (죽은 내비/햄버거)`);
}
// animation: P1 헤딩 존재 = 미반영 P1. ★divergence에선 "원본 마키/슬라이더 미매칭"은 의도된 차별화라 하드실패 아님 → 경고로 강등.
const anim = read(`${R}/animation-audit/diff.md`);
if (anim && /###\s*🔴\s*P1/.test(anim)) {
  if (DIVERGENCE) warnings.push("Phase6 animation P1(원본 마키/슬라이더 미매칭) — divergence에선 의도값이라 경고로 강등. 우리 모션(polish팩)은 Phase5.5에서 판정.");
  else problems.p1.push("Phase6 animation P1 잔존 (마키/슬라이더 누락)");
}
// visual-diff: Haiku 모드일 때만 P1 카운트 검증(폴백 체크리스트는 에이전트 책임 → 스킵)
const vd = read(`${R}/visual-diff/report.md`);
if (vd && /AI 자동 점검/.test(vd)) {
  const m = vd.match(/###\s*🔴\s*P1\s*\((\d+)\)/);
  if (m && Number(m[1]) > 0) problems.p1.push(`Phase5 visual-diff P1 ${m[1]}건 (누락 섹션/깨진 레이아웃)`);
}

// ── 3. 토큰 정합: 측정 폰트 ↔ 클론 적용 폰트 ──────────────────
// (2026-07-01 탕감 사고: extract-tokens가 Pretendard를 측정했는데 클론은 Noto를 씀 →
//  측정만 하고 적용 검증이 없어 조용히 드리프트. 여기서 실측 폰트 미적용을 표면화.)
const GENERIC_FONTS = new Set([
  "ui-sans-serif", "system-ui", "sans-serif", "-apple-system", "blinkmacsystemfont",
  "segoe ui", "ui-serif", "serif", "ui-monospace", "monospace", "inherit", "initial",
]);
// ★divergence면 폰트를 일부러 바꾸므로(variation.config.fontPair) 이 드리프트 검사는 건너뛴다.
try {
  const tokJson = DIVERGENCE ? null : read(`${R}/design-tokens.json`);
  if (tokJson) {
    const tok = JSON.parse(tokJson);
    const measuredFont = String(
      tok?.page?.bodyFont ??
        (Array.isArray(tok?.typography?.families) ? tok.typography.families[0]?.[0] : "") ??
        (tok?.fontFamilies ? Object.keys(tok.fontFamilies)[0] : "") ??
        "",
    ).replace(/["']/g, "").trim();
    const globalsCss = read("src/app/globals.css") ?? "";
    const fontSansLine = (globalsCss.match(/--font-sans:\s*([^;]+);/) || [])[1] || "";
    if (measuredFont && !GENERIC_FONTS.has(measuredFont.toLowerCase())) {
      const applied = fontSansLine.toLowerCase();
      if (applied && !applied.includes(measuredFont.toLowerCase())) {
        const firstApplied = (fontSansLine.split(",")[0] || "").replace(/["']/g, "").trim();
        warnings.push(
          `폰트 드리프트 — 원본 실측 폰트 "${measuredFont}"가 클론 --font-sans(현재 "${firstApplied}")에 없음. ` +
            `리브랜딩으로 폰트를 일부러 바꾼 게 아니면, 원본 폰트를 layout/globals에 적용하라 (@font-face 또는 next/font).`,
        );
      }
    }
  }
} catch {
  /* design-tokens.json 파싱 실패는 존재-체크(①)가 이미 잡음 */
}

// ── 결과 ─────────────────────────────────────────────────────
const ok = !problems.missing.length && !problems.p1.length;
console.log(`# lint-pipeline — 산출물 계약 검증  [${DIVERGENCE ? "divergence 모드(REVRUN 차별화)" : "pixel-perfect 모드"}]\n`);
if (DIVERGENCE) console.log("> divergence: variation.config.json + Phase5.5 디자인검수 필수 · 폰트/애니 원본매칭 검사 완화.\n");
if (problems.missing.length) {
  console.log(`## ❌ 필수 산출물 누락 (${problems.missing.length})`);
  problems.missing.forEach((s) => console.log(`- ${s}`));
  console.log("");
}
if (problems.p1.length) {
  console.log(`## ❌ P1 잔존 (${problems.p1.length}) — 수정 후 재검`);
  problems.p1.forEach((s) => console.log(`- ${s}`));
  console.log("");
}
if (warnings.length) {
  console.log(`## ⚠️ 경고 (${warnings.length}) — 게이트 통과는 되나 의도 확인 필요`);
  warnings.forEach((s) => console.log(`- ${s}`));
  console.log("");
}
if (ok) {
  console.log("✅ PASS — 필수 산출물 모두 존재 + 기계검증 P1 0건.");
  console.log("   (단, visual-diff 폴백 모드의 시각 판정은 오케스트레이터 Read 책임 — lint가 대체 못 함.)");
  process.exit(0);
}
console.log("→ PIPELINE.md '산출물 계약' 참조. 누락 스크립트를 돌리거나 P1을 수정하라.");
process.exit(problems.missing.length ? 1 : 2);
