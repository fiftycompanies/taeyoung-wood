#!/usr/bin/env node
/**
 * Animation Audit — 원본 vs 클론 두 사이트의 모든 keyframe/transition을 추출 → diff 보고서 생성.
 *
 * 사용법:
 *   node scripts/animation-audit.mjs <원본URL> <클론URL>
 *
 * 출력:
 *   docs/research/animation-audit/
 *     original.json
 *     clone.json
 *     diff.md          ← 누락/추가 항목 + 우선순위
 *
 * 의존성: playwright (npm i -D playwright). chromium 헤드리스로 자동 실행.
 *
 * 핵심: 원본에는 있지만 클론에 없는 keyframe·marquee·hover·image-slider 패턴을
 *      자동으로 탐지해 P1/P2/P3 우선순위 분류.
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const EXTRACTOR = `() => {
  const all = [...document.querySelectorAll('*')];
  const animEls = all.filter(el => {
    const cs = getComputedStyle(el);
    return cs.animationName && cs.animationName !== 'none';
  }).slice(0, 200).map(el => ({
    tag: el.tagName + '.' + (el.className?.toString()?.split(' ').slice(0,3).join('.') || ''),
    text: (el.textContent || '').trim().slice(0, 40),
    rect: { top: el.getBoundingClientRect().top + window.scrollY, h: el.offsetHeight, w: el.offsetWidth },
    name: getComputedStyle(el).animationName,
    duration: getComputedStyle(el).animationDuration,
    iter: getComputedStyle(el).animationIterationCount,
    delay: getComputedStyle(el).animationDelay,
    timing: getComputedStyle(el).animationTimingFunction,
  }));

  // 마키 / image slider / hover 패턴
  const marquees = [...document.querySelectorAll('.marquee, .flow-ani-wrap, [class*="marquee"], [class*="flow"]')]
    .map(el => ({
      sel: el.tagName + '.' + el.className.toString().slice(0, 80),
      top: el.offsetTop, h: el.offsetHeight, w: el.offsetWidth,
      bg: getComputedStyle(el).backgroundColor,
    }));

  // 호버 효과 룰 추출
  const hoverRules = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.cssText && /:hover/.test(rule.cssText) && rule.cssText.length < 280) {
          hoverRules.push(rule.cssText.slice(0, 240));
        }
      }
    } catch(e) {}
  }

  // image comparison slider 패턴 (두 이미지 absolute 겹침 + transition)
  const overlappedImgs = [];
  document.querySelectorAll('img').forEach(img => {
    const cs = getComputedStyle(img);
    if (cs.position === 'absolute' && parseFloat(cs.top) <= 1 && parseFloat(cs.left) <= 1) {
      overlappedImgs.push({
        src: img.src.split('/').pop(),
        w: img.offsetWidth, h: img.offsetHeight,
        transition: cs.transition.slice(0, 80),
      });
    }
  });

  // GSAP / AOS / Swiper 라이브러리 사용 흔적
  const libs = {
    gsap: typeof window.gsap !== 'undefined',
    scrollTrigger: typeof window.ScrollTrigger !== 'undefined',
    swiper: typeof window.Swiper !== 'undefined',
    aos: !!document.querySelector('[data-aos]'),
    aosCount: document.querySelectorAll('[data-aos]').length,
  };

  return { animEls, marquees, hoverRules, overlappedImgs, libs };
}`;

async function audit(url) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // 무거운 원본 사이트는 networkidle에 도달하지 못함 → domcontentloaded로 폴백
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  await page.waitForTimeout(2500); // animations settle
  // 팝업 dismiss
  await page.evaluate(`document.querySelectorAll('.hd_pops, [id^="hd_pops_"], [class*="popup"]').forEach(el => el.style.display = 'none');`);
  // EXTRACTOR는 화살표함수 "문자열" — page.evaluate(string)은 표현식으로 평가해 함수 자체를
  // 반환(직렬화 불가→undefined)하므로 반드시 (EXTRACTOR)() 형태로 호출해야 한다.
  const data = await page.evaluate(`(${EXTRACTOR})()`);
  await browser.close();
  return data;
}

function diff(orig, clone) {
  const lines = ["# Animation Audit Diff Report\n"];
  // keyframe name 기준 비교
  const origNames = new Set(orig.animEls.map(a => a.name));
  const cloneNames = new Set(clone.animEls.map(a => a.name));
  const missingNames = [...origNames].filter(n => !cloneNames.has(n));
  const extraNames = [...cloneNames].filter(n => !origNames.has(n));

  lines.push(`## 🟥 누락된 keyframe (원본만, ${missingNames.length}건)\n`);
  for (const name of missingNames) {
    const sample = orig.animEls.find(a => a.name === name);
    lines.push(`- **${name}** — ${sample.duration}, iter=${sample.iter}, on \`${sample.tag}\` (top=${Math.round(sample.rect.top)}px)`);
  }
  lines.push(`\n## 🟩 클론에만 있는 keyframe (${extraNames.length}건)\n`);
  for (const name of extraNames) {
    const sample = clone.animEls.find(a => a.name === name);
    lines.push(`- **${name}** — ${sample.duration} on \`${sample.tag}\``);
  }

  // 마키 비교
  lines.push(`\n## 📜 마키 / flow-ani 비교\n`);
  lines.push(`- 원본: ${orig.marquees.length}개`);
  lines.push(`- 클론: ${clone.marquees.length}개`);
  if (orig.marquees.length > clone.marquees.length) {
    lines.push(`  ⚠️ 클론에 마키 ${orig.marquees.length - clone.marquees.length}개 누락 가능성`);
    orig.marquees.slice(0, 5).forEach(m => lines.push(`  - 원본 \`${m.sel}\` bg=${m.bg} h=${m.h} top=${m.top}`));
  }

  // image comparison slider
  lines.push(`\n## 🎚 Image Comparison Slider 가능성\n`);
  lines.push(`- 원본 absolute 겹친 이미지: ${orig.overlappedImgs.length}개`);
  lines.push(`- 클론: ${clone.overlappedImgs.length}개`);
  if (orig.overlappedImgs.length >= 2 && clone.overlappedImgs.length < 2) {
    lines.push(`  ⚠️ **원본에 image comparison slider 패턴 가능성** — 두 이미지 absolute 겹침 + transition`);
    orig.overlappedImgs.slice(0, 4).forEach(i => lines.push(`  - ${i.src} (${i.w}x${i.h}) transition=${i.transition}`));
  }

  // 라이브러리
  lines.push(`\n## 📚 라이브러리 사용 비교\n`);
  lines.push("| 라이브러리 | 원본 | 클론 |\n|---|---|---|");
  for (const k of Object.keys(orig.libs)) {
    lines.push(`| ${k} | ${orig.libs[k]} | ${clone.libs[k]} |`);
  }

  // 우선순위 자동 매핑
  lines.push(`\n## 🎯 우선순위 제안 (자동)\n`);
  const p1 = [], p2 = [], p3 = [];
  if (orig.overlappedImgs.length >= 2 && clone.overlappedImgs.length < 2) {
    p1.push("Image Comparison Slider (CostBubble 패턴 — 두 이미지 가로 슬라이드 비교)");
  }
  if (orig.marquees.length > clone.marquees.length + 1) {
    p1.push(`마키 ${orig.marquees.length - clone.marquees.length}개 추가 (가로 흐름 띠)`);
  }
  for (const name of missingNames) {
    const s = orig.animEls.find(a => a.name === name);
    if (!s) continue;
    if (s.iter === "infinite" && parseFloat(s.duration) < 5) p2.push(`${name} (${s.duration} infinite, ${s.tag})`);
    else p3.push(`${name} (${s.duration})`);
  }
  if (p1.length) lines.push(`### 🔴 P1\n${p1.map(s => "- " + s).join("\n")}\n`);
  if (p2.length) lines.push(`### 🟠 P2\n${p2.map(s => "- " + s).join("\n")}\n`);
  if (p3.length) lines.push(`### 🟡 P3\n${p3.map(s => "- " + s).join("\n")}\n`);

  return lines.join("\n");
}

async function main() {
  const [origUrl, cloneUrl] = process.argv.slice(2);
  if (!origUrl || !cloneUrl) {
    console.error("Usage: node scripts/animation-audit.mjs <원본URL> <클론URL>");
    process.exit(1);
  }
  console.log("→ 원본 분석 중:", origUrl);
  const orig = await audit(origUrl);
  console.log("→ 클론 분석 중:", cloneUrl);
  const clone = await audit(cloneUrl);

  const outDir = "docs/research/animation-audit";
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "original.json"), JSON.stringify(orig, null, 2));
  await fs.writeFile(path.join(outDir, "clone.json"), JSON.stringify(clone, null, 2));
  const report = diff(orig, clone);
  await fs.writeFile(path.join(outDir, "diff.md"), report);
  console.log("✓ 보고서 생성: " + path.join(outDir, "diff.md"));
  console.log("\n" + report);
}

main().catch(e => { console.error(e); process.exit(1); });
