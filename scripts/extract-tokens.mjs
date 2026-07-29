#!/usr/bin/env node
/**
 * Extract Tokens — 원본 사이트의 색·폰트·간격·radius·shadow를 getComputedStyle 실측으로
 *                  자동 추출 → 디자인 토큰 + globals.css @theme 스캐폴드 생성. (Phase 1/2 ①)
 *
 * 사용법:
 *   node scripts/extract-tokens.mjs <원본URL> [<원본URL2> ...]
 *
 * 출력:
 *   docs/research/design-tokens.json   ← 측정 원자료(빈도순 팔레트·폰트 스케일·간격 히스토그램)
 *   docs/research/design-tokens.css    ← globals.css 에 옮길 @theme/:root 후보 스캐폴드(측정값 주석 포함)
 *
 * 철학(kref DaDgT3ZlOc8 "No Guessing"): 화면을 눈대중하지 않는다. 브라우저로 실제 계산값을 읽는다.
 *   ★ 측정은 자동, **최종 토큰명·매핑은 에이전트가 확정**(브랜드 의도 반영) — 이 스크립트는 후보만 제시.
 *
 * 의존성: playwright. chromium 헤드리스 자동 실행. (animation-audit.mjs 와 동일 패턴)
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

// 브라우저 안에서 실행될 추출기(문자열). getComputedStyle 실측 — 색/폰트/간격/radius/shadow.
const EXTRACTOR = `() => {
  const toHex = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    // CSS Color 4 퍼센트/공백구분(rgb(50% 20% 10%))·oklch 등은 0-255 정수가 아니라 오변환됨 → 후보에서 제외
    if (m[1].includes('%')) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(s => parseFloat(s.trim()));
    const [r, g, b, a = 1] = p;
    if (![r, g, b].every(n => Number.isFinite(n))) return null;
    if (a === 0) return null; // 완전 투명은 토큰 후보 제외
    const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + h(r) + h(g) + h(b);
  };
  const bump = (map, key) => { if (key == null) return; map[key] = (map[key] || 0) + 1; };
  const pxNum = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n) : null; };

  const els = [...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0; // 보이는 요소만
  }).slice(0, 4000);

  const colors = {};        // 텍스트 색 빈도
  const bgColors = {};      // 배경 색 빈도(면적 가중)
  const borderColors = {};  // 테두리 색
  const fontFamilies = {};  // 폰트 패밀리 빈도
  const fontScale = {};     // font-size(px) 빈도
  const weights = {};       // font-weight 빈도
  const lineHeights = {};   // line-height
  const spacing = {};       // padding/margin/gap(px) 빈도
  const radii = {};         // border-radius(px)
  const shadows = {};       // box-shadow(non-none)
  const headings = [];      // h1~h6 대표 타이포

  for (const el of els) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;

    // 색
    const fg = toHex(cs.color); if (fg) bump(colors, fg);
    const bg = toHex(cs.backgroundColor);
    if (bg) bgColors[bg] = (bgColors[bg] || 0) + Math.max(1, Math.round(area / 1000)); // 면적 가중(작은 칩도 최소 1 보장)
    if (cs.borderTopWidth && parseFloat(cs.borderTopWidth) > 0) {
      const bc = toHex(cs.borderTopColor); if (bc) bump(borderColors, bc);
    }

    // 타이포
    const fam = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
    if (fam) bump(fontFamilies, fam);
    const fsz = pxNum(cs.fontSize); if (fsz) bump(fontScale, fsz);
    if (cs.fontWeight) bump(weights, cs.fontWeight);
    if (cs.lineHeight && cs.lineHeight !== 'normal') bump(lineHeights, cs.lineHeight);

    // 간격(8의 배수 스케일 탐지용 원자료)
    for (const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','rowGap','columnGap','gap']) {
      const n = pxNum(cs[k]); if (n && n > 0 && n <= 200) bump(spacing, n);
    }

    // radius / shadow
    const rad = pxNum(cs.borderTopLeftRadius); if (rad && rad > 0) bump(radii, rad);
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow.slice(0, 120));

    // heading 대표값
    if (/^H[1-6]$/.test(el.tagName) && headings.length < 30) {
      headings.push({ tag: el.tagName, family: fam, size: fsz, weight: cs.fontWeight, lineHeight: cs.lineHeight, color: fg });
    }
  }

  const bodyCs = getComputedStyle(document.body);
  return {
    page: { bodyBg: toHex(bodyCs.backgroundColor), bodyColor: toHex(bodyCs.color), bodyFont: (bodyCs.fontFamily||'').split(',')[0].replace(/["']/g,'').trim() },
    colors, bgColors, borderColors, fontFamilies, fontScale, weights, lineHeights, spacing, radii, shadows, headings,
  };
}`;

async function extract(url) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  await page.waitForTimeout(2000);
  await page.evaluate(`document.querySelectorAll('.hd_pops, [id^="hd_pops_"], [class*="popup"]').forEach(el => el.style.display = 'none');`);
  const data = await page.evaluate(`(${EXTRACTOR})()`);
  await browser.close();
  return data;
}

// 여러 페이지 측정값을 합산(멀티페이지 클론 대응)
function mergeCounts(target, src) {
  for (const [k, v] of Object.entries(src || {})) target[k] = (target[k] || 0) + v;
}
function mergeAll(list) {
  const out = { page: list[0].page, colors: {}, bgColors: {}, borderColors: {}, fontFamilies: {}, fontScale: {}, weights: {}, lineHeights: {}, spacing: {}, radii: {}, shadows: {}, headings: [] };
  for (const d of list) {
    for (const key of ['colors','bgColors','borderColors','fontFamilies','fontScale','weights','lineHeights','spacing','radii','shadows']) mergeCounts(out[key], d[key]);
    out.headings.push(...(d.headings || []));
  }
  return out;
}

const topN = (obj, n = 12) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, n);

function buildReport(d) {
  const palette = topN(d.colors, 10);
  const bg = topN(d.bgColors, 10);
  const borders = topN(d.borderColors, 8);
  const fams = topN(d.fontFamilies, 6);
  const sizes = Object.keys(d.fontScale).map(Number).sort((a, b) => a - b);
  const spaceHist = topN(d.spacing, 14).map(([k]) => Number(k)).sort((a, b) => a - b);
  const rad = topN(d.radii, 6);
  const sh = topN(d.shadows, 4);

  const json = {
    measuredAt: "(stamp at save time)",
    page: d.page,
    palette: { textColors: palette, backgroundColors: bg, borderColors: borders },
    typography: { families: fams, sizeScalePx: sizes, weights: topN(d.weights, 8), lineHeights: topN(d.lineHeights, 8), headings: d.headings.slice(0, 12) },
    spacingHistogramPx: topN(d.spacing, 16),
    radiiPx: rad,
    shadows: sh,
    note: "측정 후보. 토큰명·매핑은 에이전트가 브랜드 의도 반영해 확정한다(자동매핑 과신 금지).",
  };

  // globals.css 스캐폴드 — 측정값을 주석으로, shadcn 토큰 슬롯에 후보를 박아 에이전트가 명명/조정
  const css = [
    "/* ───────────────────────────────────────────────────────────",
    "   design-tokens.css — extract-tokens.mjs 자동 측정 스캐폴드 (Phase 2 ①)",
    "   ⚠️ 이 파일을 그대로 쓰지 말 것. globals.css 의 @theme/:root 에 옮기며",
    "      브랜드 의도에 맞게 토큰명·값을 **에이전트가 확정**한다. 아래는 '측정된 후보'.",
    "   ─────────────────────────────────────────────────────────── */",
    "",
    `/* 페이지 기본: body bg=${d.page.bodyBg} / text=${d.page.bodyColor} / font=${d.page.bodyFont} */`,
    "",
    "/* 측정된 텍스트 색 (빈도순) — primary/foreground/muted 매핑 후보 */",
    ...palette.map(([c, n]) => `/*   ${c}  (${n}회) */`),
    "",
    "/* 측정된 배경 색 (면적 가중) — background/card/section 매핑 후보 */",
    ...bg.map(([c, n]) => `/*   ${c}  (가중 ${n}) */`),
    "",
    "@theme inline {",
    `  /* 색: 빈도 1~2위를 background/foreground 후보로 제시. 에이전트가 이름 확정 */`,
    `  --color-background: ${(bg[0] && bg[0][0]) || d.page.bodyBg || "#ffffff"};`,
    `  --color-foreground: ${(palette[0] && palette[0][0]) || d.page.bodyColor || "#0a0a0a"};`,
    `  --color-primary: ${(borders[0] && borders[0][0]) || (palette[1] && palette[1][0]) || "#0f766e"};   /* TODO: 브랜드 주조색 확인 */`,
    "",
    `  /* 폰트: 1순위 패밀리 = ${(fams[0] && fams[0][0]) || "?"} */`,
    `  --font-sans: ${(fams[0] && fams[0][0]) ? `"${fams[0][0]}", ui-sans-serif, system-ui` : "ui-sans-serif, system-ui"};`,
    "",
    `  /* 타이포 스케일(px, 측정 정렬): ${sizes.join(", ") || "?"} */`,
    `  /* 간격 스케일(px, 빈도순 정렬): ${spaceHist.join(", ") || "?"} — 4/8/12/16/24/32 정규화 권장 */`,
    `  /* radius 후보: ${rad.map(([k]) => k + "px").join(", ") || "0"} */`,
    "}",
    "",
    sh.length ? `/* box-shadow 후보:\n${sh.map(([s, n]) => `   ${s}  (${n}회)`).join("\n")}\n*/` : "/* box-shadow: 측정값 없음 */",
    "",
  ].join("\n");

  return { json, css };
}

async function main() {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error("Usage: node scripts/extract-tokens.mjs <원본URL> [<원본URL2> ...]");
    process.exit(1);
  }
  const measured = [];
  for (const u of urls) {
    console.log("→ 토큰 실측 중:", u);
    measured.push(await extract(u));
  }
  const merged = mergeAll(measured);
  const { json, css } = buildReport(merged);

  const outDir = "docs/research";
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "design-tokens.json"), JSON.stringify({ sources: urls, ...json }, null, 2));
  await fs.writeFile(path.join(outDir, "design-tokens.css"), css);
  console.log("✓ 생성: docs/research/design-tokens.json + design-tokens.css");
  console.log(`  텍스트색 ${Object.keys(merged.colors).length}종 · 배경색 ${Object.keys(merged.bgColors).length}종 · 폰트 ${Object.keys(merged.fontFamilies).length}종 · 간격 ${Object.keys(merged.spacing).length}종`);
}

main().catch(e => { console.error(e); process.exit(1); });
