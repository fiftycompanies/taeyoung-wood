#!/usr/bin/env node
/**
 * Visual Diff — 원본 vs 클론을 3개 뷰포트(1440/768/390)로 캡처 → side-by-side 합성 +
 *               (옵션) Claude Haiku 멀티모달 자동 점검. (Phase 5 ③ side-by-side + vision)
 *
 * 사용법:
 *   node scripts/visual-diff.mjs <원본URL> <클론URL>
 *   (클론URL은 보통 로컬 dev: http://localhost:3000 또는 라이브)
 *
 * 출력:
 *   docs/research/visual-diff/
 *     original-<vw>.png  clone-<vw>.png      ← 각 뷰포트 원본·클론 풀페이지
 *     compare-<vw>.png                       ← 원본|클론 나란히 합성(에이전트 Read 판정용)
 *     report.md                              ← 자동 점검 결과(또는 에이전트 판정 체크리스트)
 *     cost.json                              ← (Haiku 호출 시) 토큰·비용 로컬 적재
 *
 * 자동 점검 2-모드:
 *   A) ANTHROPIC_API_KEY 가 env에 있으면 → 합성 이미지를 Claude Haiku에 던져
 *      회전/라벨불일치/깨진레이아웃/저대비/플레이스홀더/누락섹션을 P1/P2 자동 플래그.
 *   B) 키가 없으면(=Claude Code 오케스트레이터 컨텍스트) → 합성 PNG + 체크리스트만 생성하고,
 *      **오케스트레이터 Claude가 compare-*.png 를 Read 로 직접 보고 판정**(SKILL.md Phase 5 지침).
 *   → 어느 경로든 "원본 닮음"을 사람 눈/AI 눈으로 강제. (sharp 등 추가 의존성 없음)
 *
 * 의존성: playwright(내장). 합성은 Playwright HTML 캡처로 처리(외부 이미지 라이브러리 불필요).
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];
const OUT = "docs/research/visual-diff";
const VISION_MODEL = "claude-haiku-4-5-20251001";

async function shoot(page, url, file) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  await page.waitForTimeout(2000);
  await page.evaluate(`document.querySelectorAll('.hd_pops, [id^="hd_pops_"], [class*="popup"]').forEach(el => el.style.display = 'none');`);
  await page.screenshot({ path: file, fullPage: true });
}

// 두 PNG를 좌(원본)|우(클론) 나란히 붙인 합성 이미지 — Playwright로 HTML 캡처(라이브러리 불필요)
async function compose(browser, origPng, clonePng, outPng, label) {
  const [a, b] = await Promise.all([fs.readFile(origPng), fs.readFile(clonePng)]);
  const html = `<!doctype html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a1a;font:13px ui-sans-serif,system-ui}
    .wrap{display:flex;gap:8px;padding:8px}
    .col{flex:1;min-width:0}
    .cap{color:#fff;padding:6px 8px;font-weight:600;background:#0f766e}
    .cap.clone{background:#7c3aed}
    img{width:100%;display:block;border:1px solid #333}
  </style></head><body>
    <div class="wrap">
      <div class="col"><div class="cap">원본 ORIGINAL — ${label}</div><img src="data:image/png;base64,${a.toString("base64")}"></div>
      <div class="col"><div class="cap clone">클론 CLONE — ${label}</div><img src="data:image/png;base64,${b.toString("base64")}"></div>
    </div>
  </body></html>`;
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPng, fullPage: true });
  await page.close();
}

// 옵션 A: Anthropic Messages API 직접 호출(SDK 불필요, fetch). 합성 이미지로 닮음 판정.
async function visionCheck(comparePngs) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  // ★ 외부 전송 명시 고지(원본/클론 풀페이지 스샷에 연락처·가격 등이 찍힐 수 있음 — 조용히 보내지 않음)
  console.log(`⚠️  ANTHROPIC_API_KEY 감지 → 원본·클론 합성 스크린샷 ${comparePngs.length}장을 Anthropic API(${VISION_MODEL})로 전송해 자동 점검합니다. (키 제거 시 오케스트레이터 Read 폴백)`);
  const content = [{
    type: "text",
    text: "각 이미지는 좌=원본 웹사이트, 우=클론이다. 클론이 원본을 얼마나 충실히 재현했는지 보고: " +
      "(1) 닮음 0~100%, (2) P1 결함(누락 섹션·깨진 레이아웃·회전/뒤집힌 사진·라벨 불일치·플레이스홀더/엑박), " +
      "(3) P2 결함(색/간격/폰트 편차·정렬). JSON {similarity, p1:[], p2:[]} 만 출력.",
  }];
  for (const p of comparePngs) {
    const buf = await fs.readFile(p.file);
    content.push({ type: "text", text: `[뷰포트 ${p.name}]` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: buf.toString("base64") } });
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: VISION_MODEL, max_tokens: 1024, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) { console.warn("⚠️ vision API", res.status, await res.text().catch(() => "")); return null; }
  const j = await res.json();
  const text = (j.content || []).map(c => c.text || "").join("");
  let parsed = null;
  try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "null"); } catch {}
  const usage = j.usage || {};
  // Haiku 4.5 대략 단가: in $1/Mtok, out $5/Mtok
  const costUsd = (usage.input_tokens || 0) / 1e6 * 1 + (usage.output_tokens || 0) / 1e6 * 5;
  await fs.writeFile(path.join(OUT, "cost.json"), JSON.stringify({ model: VISION_MODEL, usage, estCostUsd: Number(costUsd.toFixed(5)) }, null, 2));
  return { parsed, raw: text, usage, costUsd };
}

function buildReport({ origUrl, cloneUrl, vision }) {
  const L = ["# Visual Diff Report — 원본 vs 클론\n", `- 원본: ${origUrl}`, `- 클론: ${cloneUrl}`, `- 뷰포트: 1440 / 768 / 390`, ""];
  L.push("## 나란히 비교 이미지 (Read로 판정)");
  for (const v of VIEWPORTS) L.push(`- \`${OUT}/compare-${v.name}.png\` — 좌 원본 | 우 클론 (${v.name}px)`);
  L.push("");
  if (vision?.parsed) {
    const p = vision.parsed;
    L.push("## 🤖 AI 자동 점검 (Claude Haiku)\n");
    L.push(`- **닮음: ${p.similarity ?? "?"}%**`);
    L.push(`\n### 🔴 P1 (${(p.p1 || []).length})`); (p.p1 || []).forEach(x => L.push(`- ${x}`));
    L.push(`\n### 🟠 P2 (${(p.p2 || []).length})`); (p.p2 || []).forEach(x => L.push(`- ${x}`));
    L.push(`\n> 비용: $${(vision.costUsd || 0).toFixed(5)} (in ${vision.usage?.input_tokens}, out ${vision.usage?.output_tokens}). 상세 cost.json.`);
  } else {
    L.push("## 👁 사람/오케스트레이터 판정 (ANTHROPIC_API_KEY 없음 — 폴백 모드)\n");
    L.push("**오케스트레이터 Claude는 위 `compare-*.png` 3장을 Read로 직접 보고** 아래를 P1/P2로 판정하라:");
    L.push("- [ ] 누락 섹션/카드(원본엔 있고 클론엔 없음)");
    L.push("- [ ] 깨진 레이아웃·겹침·오버플로(특히 390px)");
    L.push("- [ ] 회전/뒤집힌 사진·라벨 불일치·플레이스홀더/엑박");
    L.push("- [ ] nav 글자가 hero 배경에 묻힘(저대비)");
    L.push("- [ ] (순수 픽셀복제 모드만) 색/간격/폰트 톤 편차(원본 대비)");
    L.push("\n> ★divergence 모드(variation.config.json 존재): **색/폰트/히어로/톤이 원본과 다른 것은 의도된 차별화 → 결함 아님(무시).** 콘텐츠·섹션 존재/누락·깨짐만 P1로. 시각 품질은 Phase 5.5 디자인 검수로.");
    L.push("\n> P1(누락·깨짐)은 수정 후 재실행. 스샷만으로 '완료' 선언 금지(기능은 Phase 6/7가 검증).");
  }
  return L.join("\n");
}

async function main() {
  const [origUrl, cloneUrl] = process.argv.slice(2);
  if (!origUrl || !cloneUrl) {
    console.error("Usage: node scripts/visual-diff.mjs <원본URL> <클론URL>");
    process.exit(1);
  }
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  const comparePngs = [];
  for (const v of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height } });
    const page = await ctx.newPage();
    const oPng = path.join(OUT, `original-${v.name}.png`);
    const cPng = path.join(OUT, `clone-${v.name}.png`);
    console.log(`→ [${v.name}] 원본 캡처`); await shoot(page, origUrl, oPng);
    console.log(`→ [${v.name}] 클론 캡처`); await shoot(page, cloneUrl, cPng);
    await ctx.close();
    const cmpPng = path.join(OUT, `compare-${v.name}.png`);
    await compose(browser, oPng, cPng, cmpPng, `${v.name}px`);
    comparePngs.push({ name: v.name, file: cmpPng });
  }
  await browser.close();

  console.log("→ AI 자동 점검 시도(ANTHROPIC_API_KEY 있으면 Haiku, 없으면 폴백)");
  const vision = await visionCheck(comparePngs);

  const report = buildReport({ origUrl, cloneUrl, vision });
  await fs.writeFile(path.join(OUT, "report.md"), report);
  console.log("✓ 생성: " + path.join(OUT, "report.md"));
  if (!vision) console.log("  (vision 폴백: compare-*.png 를 오케스트레이터가 Read로 판정)");
  console.log("\n" + report);
}

main().catch(e => { console.error(e); process.exit(1); });
