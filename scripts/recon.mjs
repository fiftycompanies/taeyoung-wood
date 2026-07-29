import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const ORIGIN = process.argv[2] || 'https://ganaplumbing.revrun.kr/';
const OUT = process.argv[3] || 'docs/design-references';
mkdirSync(OUT, { recursive: true });

const routes = [
  { path: '/', name: 'home' },
  { path: '/blog', name: 'blog-list' },
  { path: '/calculator', name: 'calculator' },
  { path: '/guide', name: 'guide' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0; const step = 400;
      const id = setInterval(() => {
        window.scrollBy(0, step); total += step;
        if (total >= document.body.scrollHeight) { clearInterval(id); resolve(); }
      }, 120);
    });
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

for (const r of routes) {
  const url = new URL(r.path, ORIGIN).href;
  console.log(`→ ${url}`);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    await autoScroll(page);
    await page.screenshot({ path: `${OUT}/${r.name}-desktop-1440.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await autoScroll(page);
    await page.screenshot({ path: `${OUT}/${r.name}-mobile-390.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
  } catch (e) { console.error(r.name, e.message); }
}

// enumerate assets from home
await page.goto(new URL('/', ORIGIN).href, { waitUntil: 'load' });
await page.waitForTimeout(1500);
await autoScroll(page);
const assets = await page.evaluate(() => ({
  images: [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight })),
  bgImages: [...document.querySelectorAll('*')].filter(el => {
    const b = getComputedStyle(el).backgroundImage; return b && b !== 'none';
  }).map(el => ({ tag: el.tagName, cls: el.className?.toString().slice(0,60), bg: getComputedStyle(el).backgroundImage })).slice(0, 60),
  favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() })),
  navLinks: [...document.querySelectorAll('header a, nav a')].map(a => ({ text: a.textContent?.trim(), href: a.href })),
  footerLinks: [...document.querySelectorAll('footer a')].map(a => ({ text: a.textContent?.trim(), href: a.href })),
  h1s: [...document.querySelectorAll('h1')].map(h => h.textContent?.trim()),
  h2s: [...document.querySelectorAll('h2')].map(h => h.textContent?.trim()),
  h3s: [...document.querySelectorAll('h3')].map(h => h.textContent?.trim()),
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
}));

writeFileSync('docs/research/assets-recon.json', JSON.stringify(assets, null, 2));
console.log(`✓ ${assets.images.length} imgs · ${assets.bgImages.length} bg-imgs · ${assets.favicons.length} favicons`);

await browser.close();
