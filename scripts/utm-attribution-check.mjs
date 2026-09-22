// 유입 정보 보존 검사 — 다른 페이지로 UTM 달고 들어와 /contact 에서 문의해도 utm·최초 referrer 가 실리는가.
// ★리드 생성 안 함: /api/inquiry 를 가로채 페이로드만 본다(라이브에 돌려도 쓰기 0).
// 사용: node scripts/utm-attribution-check.mjs <baseUrl>
import { chromium } from "playwright";

const BASE = (process.argv[2] || "").replace(/\/$/, "");
if (!BASE) { console.error("usage: node scripts/utm-attribution-check.mjs <baseUrl>"); process.exit(2); }
const EXT_REF = "https://l.instagram.com/";

async function submitAndCapture(page) {
  let payload = null;
  await page.route("**/api/inquiry", async (route) => {
    payload = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
  });
  const form = page.locator("form").filter({ has: page.locator('input[name="phone"]') }).first();
  await form.locator('input[name="name"]').fill("유입검사");
  await form.locator('input[name="phone"]').fill("010-0000-0000");
  await form.locator('button[type="submit"]').click();
  for (let i = 0; i < 50 && !payload; i++) await page.waitForTimeout(100);
  return payload;
}

const cases = [
  {
    // 본 시나리오: 인스타 → /guide?utm… → (링크 클릭 = 새로고침 이동, referrer 는 자기 사이트) → /contact
    name: "/guide 진입 후 /contact 이동",
    run: async (page) => {
      await page.goto(`${BASE}/guide?utm_source=test&utm_content=x`, { referer: EXT_REF, waitUntil: "load" });
      await page.waitForTimeout(500);
      await page.goto(`${BASE}/contact`, { referer: `${BASE}/guide`, waitUntil: "load" });
      return submitAndCapture(page);
    },
    expect: (p) => p?.utm_source === "test" && p?.utm_content === "x" && p?.referrer === EXT_REF,
  },
  {
    // 대조군: /contact 직행·UTM 없음 → 아무것도 지어내면 안 된다
    name: "대조군: /contact 직행",
    run: async (page) => {
      await page.goto(`${BASE}/contact`, { waitUntil: "load" });
      return submitAndCapture(page);
    },
    expect: (p) => p && !p.utm_source && !p.utm_content && p.referrer == null,
  },
];

const browser = await chromium.launch();
let fail = 0;
for (const c of cases) {
  const ctx = await browser.newContext(); // 케이스마다 새 세션(sessionStorage 분리)
  const page = await ctx.newPage();
  let p = null;
  try { p = await c.run(page); } catch (e) { console.error(`  오류: ${e.message}`); }
  const ok = c.expect(p);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.name} → utm_source=${p?.utm_source ?? "-"} utm_content=${p?.utm_content ?? "-"} referrer=${p?.referrer ?? "-"}`);
  await ctx.close();
}
await browser.close();
process.exit(fail ? 1 : 0);
