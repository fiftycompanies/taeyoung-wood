// 로컬 dev(3222) 전 섹션 슬라이스 캡처 — 데스크탑/태블릿/모바일
import { chromium } from 'playwright';
import { mkdir, rm } from 'fs/promises';
import path from 'path';

const BASE = process.env.BASE || 'http://localhost:3222';
const OUT = path.join(process.cwd(), 'audit-shots', 'local');

async function revealAll(page, totalH) {
  for (let y = 0; y < totalH; y += 400) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(160);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function shoot(browser, { w, h, tag, url = '/' }) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 60000 });
  const totalH = await page.evaluate(() => document.body.scrollHeight);
  await revealAll(page, totalH);
  let i = 0;
  for (let y = 0; y < totalH; y += h) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(280);
    const clipH = Math.min(h, totalH - y);
    if (clipH <= 40) break;
    await page.screenshot({ path: path.join(OUT, `${tag}_${String(i).padStart(2, '0')}.png`), clip: { x: 0, y: 0, width: w, height: clipH } });
    i++;
  }
  console.log(`${tag}: ${i} slices (totalH=${totalH})`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await shoot(browser, { w: 1440, h: 900, tag: 'd' });
  await shoot(browser, { w: 768, h: 1024, tag: 't' });
  await shoot(browser, { w: 390, h: 844, tag: 'm' });
} finally {
  await browser.close();
}
