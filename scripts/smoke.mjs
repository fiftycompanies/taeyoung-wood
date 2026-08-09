// 비파괴 스모크 — 리디자인이 '전환 배선·SEO'를 안 깼는지 검증 (리드 생성 안 함)
import { chromium } from "playwright";
const URL = process.argv[2];
if (!URL) { console.error("usage: node scripts/smoke.mjs <url>"); process.exit(2); }
const fails = [], warns = [];
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";
// 미리보기 보호 우회 = 쿠키 방식. URL에 토큰 1회 부착 → Set-Cookie 로 authorize.
// (헤더를 모든 요청에 붙이면 유튜브/폰트 등 외부요청에서 CORS 에러 유발하므로 쿠키 방식 사용)
// ★ 토큰은 /robots.txt 에서만 붙인다(2026-08-07). 홈에 붙이면 페이지 주소에 토큰이 남아
//   GTM·GA 가 그 주소를 page_location/Referer 로 구글에 그대로 전송한다. robots.txt 는 스크립트가 없다.
const bypassHop = BYPASS
  ? URL.replace(/\/$/, "") + `/robots.txt?x-vercel-protection-bypass=${BYPASS}&x-vercel-set-bypass-cookie=true`
  : null;
const browser = await chromium.launch();
const page = await browser.newContext({ viewport: { width: 1280, height: 900 } }).then(c => c.newPage());
if (bypassHop) {
  try { await page.goto(bypassHop, { waitUntil: "domcontentloaded", timeout: 30000 }); }
  catch (e) { console.error("SMOKE FAIL: 미리보기 보호 우회 쿠키 발급 실패 " + e); await browser.close(); process.exit(1); }
}
const GOTO = URL;
const jsErrors = [], resErrors = [];
page.on("pageerror", e => jsErrors.push(String(e)));          // 진짜 JS 예외(=리디자인 깨짐) → 실패
page.on("console", m => { if (m.type() === "error") resErrors.push(m.text()); }); // 리소스/네트워크 → 경고
let resp;
try { resp = await page.goto(GOTO, { waitUntil: "domcontentloaded", timeout: 45000 }); }
catch (e) { console.error("SMOKE FAIL: 홈 로드 실패 " + e); await browser.close(); process.exit(1); }
// ★도착한 곳이 검사 대상이 맞는지 먼저 본다.
//   실사고: 우회 열쇠가 없는 저장소(33곳 중 19곳)에서 보호 화면으로 302 되고,
//   그 로그인 페이지에 <form> 과 제목이 있어 **모든 단정이 통과**했다.
//   `SMOKE PASS … (제목: Login – Vercel)` — 사이트를 한 글자도 안 보고 초록불이었다.
{
  const landed = new URL(page.url()).host, want = new URL(URL).host;
  if (landed !== want) {
    console.error(`SMOKE FAIL: ${want} 를 검사해야 하는데 ${landed} 로 튕겼다 ` +
      `(미리보기 보호 우회 실패 — VERCEL_AUTOMATION_BYPASS_SECRET 미등록/만료 의심)`);
    await browser.close(); process.exit(1);
  }
}
try { await page.waitForLoadState("load", { timeout: 15000 }); } catch {}
await page.waitForTimeout(1500);
if (!resp || resp.status() >= 400) fails.push(`홈 응답 ${resp && resp.status()}`);
const title = await page.title();
if (!title || title.trim().length < 3) fails.push("빈 <title> (SEO)");
if (!(await page.locator('meta[property="og:title"]').count())) warns.push("og:title 없음");
if (!(await page.locator('script[type="application/ld+json"]').count())) warns.push("JSON-LD 없음(SEO 구조화데이터)");
const forms = await page.locator("form").count();
const tel = await page.locator('a[href^="tel:"]').count();
const cta = await page.locator('button:has-text("상담"), button:has-text("문의"), button:has-text("예약"), a:has-text("상담"), a:has-text("문의"), a:has-text("예약")').count();
if (forms === 0 && tel === 0 && cta === 0) fails.push("전환 배선 사라짐 의심: <form>·tel:·상담/문의/예약 CTA 모두 없음");
const IGNORE = /favicon|gtag|analytics|google|facebook|hotjar|clarity|third-?party|ResizeObserver|cors|x-vercel|youtube|gstatic|fonts\.|net::ERR|preflight|401|403|Failed to load resource/i;
const severeJs = jsErrors.filter(e => !IGNORE.test(e));   // 미필터 JS 예외만 실패
if (severeJs.length) fails.push("JS 예외(리디자인 파손 의심): " + severeJs.slice(0, 3).join(" | "));
const severeRes = resErrors.filter(e => !IGNORE.test(e));
if (severeRes.length) warns.push("리소스 에러(참고): " + severeRes.slice(0, 2).join(" | "));

// ── 시각 검증 ── 렌더 결과 캡처(PC+모바일) + 백지/붕괴 가드
const OUT = process.env.SHOT_DIR || "/tmp/smoke";
// 지연 로드 트리거: 끝까지 스크롤 후 상단 복귀
try { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); }); } catch {}
await page.waitForTimeout(800);
const metrics = await page.evaluate(() => ({ h: document.body ? document.body.scrollHeight : 0, text: (document.body ? document.body.innerText : "").replace(/\s+/g, " ").trim().length }));
// 백지/붕괴 가드 (리디자인은 의도된 변경이라 픽셀차는 안 봄 — '거의 빈 화면'만 실패)
if (metrics.h < 600 || metrics.text < 200) fails.push(`화면 렌더 붕괴 의심(높이 ${metrics.h}px·본문 ${metrics.text}자) — 백지/깨짐`);
try { await page.screenshot({ path: `${OUT}/shot-pc.png`, fullPage: true }); } catch (e) { warns.push("PC 스크린샷 실패"); }
try {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/shot-mobile.png`, fullPage: true });
} catch (e) { warns.push("모바일 스크린샷 실패"); }

await browser.close();
if (warns.length) console.log("WARN:\n- " + warns.join("\n- "));
if (fails.length) { console.error("\nSMOKE FAIL:\n- " + fails.join("\n- ")); process.exit(1); }
console.log("\nSMOKE PASS — title·전환배선(form/tel/CTA)·심각에러0 통과 (제목: " + title.slice(0,50) + ")");
