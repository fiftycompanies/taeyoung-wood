#!/usr/bin/env node
/**
 * Interaction & Mobile Functionality Audit
 * ─────────────────────────────────────────
 * Phase 5/6은 "보이는 것"(스크린샷·애니메이션)만 검증한다. 죽은 버튼/작동 안 하는
 * 모바일 햄버거 메뉴는 스크린샷상 멀쩡해 보이므로 그대로 통과한다. 이 감사는
 * 클론의 **인터랙티브 요소가 클릭 시 실제로 동작하는지**를 기계적으로 검증한다.
 *
 * 사용법:
 *   node scripts/interaction-audit.mjs <클론URL> [원본URL]
 *   # 예: node scripts/interaction-audit.mjs https://almecsland.vercel.app/ http://almecsland.com/
 *
 * 출력:
 *   docs/research/interaction-audit/
 *     clone.json        ← 요소별 클릭 반응 원자료(mobile/desktop)
 *     report.md         ← P1/P2/P3 우선순위 보고서
 *
 * 검사 항목:
 *   🔴 P1  모바일(390px)에서 내비게이션 도달 불가
 *          (내비 링크가 숨겨졌는데 햄버거/메뉴 토글이 없거나, 토글을 눌러도 메뉴가 안 열림)
 *   🟠 P2  죽은 버튼 — <button>/role=button 인데 클릭해도 DOM변화·스크롤·aria·네비 무반응
 *   🟡 P3  href="#" / 빈 href 앵커가 아무 동작도 안 함 (마이너)
 *
 * 의존성: playwright (chromium 헤드리스 자동 실행).
 */

import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];

// ── 페이지 내부에서 실행: 인터랙티브 요소를 클릭하며 반응을 측정 ──
const PROBE = `async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 클릭 테스트 동안 실제 페이지 이동을 막는다(핸들러는 그대로 실행됨).
  const blockNav = (e) => e.preventDefault();
  document.addEventListener("click", blockNav, true);

  // 조상까지 거슬러 올라가며 실제로 보이고 클릭 가능한지 판정한다.
  // (닫힌 드로어처럼 조상이 opacity:0 / pointer-events:none 인 요소는 "안 보임"으로 처리)
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    let node = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (+cs.opacity === 0) return false;
      if (cs.pointerEvents === "none") return false;
      node = node.parentElement;
    }
    return true;
  };

  const label = (el) =>
    (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "")
      .replace(/\\s+/g, " ").trim().slice(0, 40);

  // ── ① 모바일 내비 도달성 게이트 (클릭 루프 이전, 깨끗한 DOM 상태에서 먼저 측정) ──
  // 내비 링크는 앵커(#)일 수도 라우트(/about)일 수도, 드로어가 header 안/밖일 수도 있다.
  // 위치·href 형식에 무관하게 nav/header/role=navigation 안의 링크를 모두 후보로 본다.
  // 토글 패널(aria-controls)이 있으면 그 패널 내부 링크도 포함한다(드로어가 header 밖일 때).
  const navLinkSel = "header a, nav a, [role=navigation] a";
  const navLinkEls = () => {
    const set = new Set([...document.querySelectorAll(navLinkSel)]);
    const pid = document.querySelector('[aria-controls]')?.getAttribute("aria-controls");
    const panel = pid ? document.getElementById(pid) : null;
    if (panel) panel.querySelectorAll("a").forEach((a) => set.add(a));
    return [...set];
  };
  const countVisibleNav = () => navLinkEls().filter(isVisible).length;

  const toggleBtns = [...document.querySelectorAll('button,[role="button"]')].filter((b) => {
    if (!isVisible(b)) return false;
    const t = (b.getAttribute("aria-label") || b.textContent || "").toLowerCase();
    const byText = /menu|메뉴|nav|햄버거|hamburger|전체|드롭|toggle/.test(t);
    const lineCount = b.querySelectorAll("svg line").length;
    const hasHamburgerSvg = !!b.querySelector("svg") && lineCount >= 2; // 3선 아이콘 추정
    const hasAria = b.hasAttribute("aria-controls") || b.hasAttribute("aria-expanded");
    // 닫기(X) 버튼은 토글 후보에서 제외
    const isClose = /닫기|close|×|✕/.test(t);
    return (byText || hasHamburgerSvg || hasAria) && !isClose;
  });

  // 토글이 여는 패널(aria-controls 우선) — 노출된 링크가 이 패널 박스 안에 실제로
  // 들어있는지 검사한다. backdrop-filter 컨테이닝블록 붕괴 등으로 패널이 잘리면
  // 링크는 DOM상 "보이지만"(rect>0) 패널 밖(히어로 위)에 떠서 사용자에겐 안 보인다.
  const panelId = toggleBtns[0]?.getAttribute("aria-controls");
  const withinPanel = (el, panel) => {
    if (!panel) return true;
    const a = el.getBoundingClientRect(), p = panel.getBoundingClientRect();
    return a.top >= p.top - 2 && a.bottom <= p.bottom + 2 && a.left >= p.left - 2 && a.right <= p.right + 2;
  };
  const inViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.top >= -2 && r.bottom <= window.innerHeight + 2;
  };

  const navBefore = countVisibleNav();
  let navAfterToggle = navBefore;
  let toggleWorked = false;
  let revealedOutsidePanel = 0; // 열렸는데 패널/뷰포트 밖으로 새는 링크 수
  if (navBefore < 2 && toggleBtns.length) {
    try { toggleBtns[0].click(); } catch (_) {}
    await sleep(400);
    const panel = panelId ? document.getElementById(panelId) : null;
    const revealed = navLinkEls().filter(isVisible);
    const onScreen = revealed.filter((a) => withinPanel(a, panel) && inViewport(a));
    revealedOutsidePanel = revealed.length - onScreen.length;
    navAfterToggle = onScreen.length;
    toggleWorked = navAfterToggle > navBefore; // 패널 안에 실제로 보이는 내비가 늘어야 동작
    try { toggleBtns[0].click(); } catch (_) {}
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(200);
  }
  const navResult = {
    visibleNavLinks: navBefore,
    toggleCount: toggleBtns.length,
    toggleLabel: toggleBtns[0] ? (toggleBtns[0].getAttribute("aria-label") || toggleBtns[0].textContent || "").trim().slice(0, 30) : null,
    navAfterToggle,
    toggleWorked,
    revealedOutsidePanel,
  };

  // ── ② 죽은 요소 탐지: button / role=button / a / summary / [onclick] ──
  const candidates = [...document.querySelectorAll(
    'button, [role="button"], a, summary, [onclick]'
  )].filter(isVisible);

  const results = [];
  for (const el of candidates) {
    const tag = el.tagName.toLowerCase();
    const href = el.getAttribute("href");
    const hashOnly = href === "#" || href === "" || href === "javascript:void(0)" || (href && href.startsWith("javascript:"));
    const inPageAnchor = href && href.startsWith("#") && href.length > 1;

    // 클릭 전 상태 시그니처
    const before = {
      scrollY: window.scrollY,
      url: location.href,
      aria: el.getAttribute("aria-expanded"),
      // 문서 전체 마크업 길이 — 메뉴 토글로 클래스/노드가 바뀌면 변한다
      domLen: document.documentElement.outerHTML.length,
      openOverlays: document.querySelectorAll('[aria-expanded="true"],[data-state="open"],dialog[open],.open').length,
    };

    // 클릭 중 DOM mutation 카운트
    let mutations = 0;
    const mo = new MutationObserver((list) => { mutations += list.length; });
    mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true });

    try { el.click(); } catch (_) {}
    await sleep(120);
    mo.disconnect();

    const after = {
      scrollY: window.scrollY,
      url: location.href,
      aria: el.getAttribute("aria-expanded"),
      domLen: document.documentElement.outerHTML.length,
      openOverlays: document.querySelectorAll('[aria-expanded="true"],[data-state="open"],dialog[open],.open').length,
    };

    const changed =
      mutations > 0 ||
      after.scrollY !== before.scrollY ||
      after.url !== before.url ||
      after.aria !== before.aria ||
      Math.abs(after.domLen - before.domLen) > 8 ||
      after.openOverlays !== before.openOverlays;

    // 정상으로 간주: 클릭 반응 있음 OR 정상 외부/내부 링크(href가 실제 목적지)
    const validLink = tag === "a" && href && !hashOnly && (href.startsWith("http") || href.startsWith("/") || inPageAnchor);

    results.push({
      tag, label: label(el), href: href ?? null,
      isButton: tag === "button" || el.getAttribute("role") === "button",
      hashOnly: !!hashOnly,
      reacted: changed,
      validLink,
      mutations,
      // 결과 판정
      dead: !changed && !validLink,
    });

    // 오버레이가 열렸으면 닫아 다음 테스트 오염 방지
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.scrollTo(0, 0);
    await sleep(40);
  }

  document.removeEventListener("click", blockNav, true);

  // ── ③ 장식 버튼 탐지: 버튼처럼 보이지만 a/button이 아니고 인터랙티브 조상도 없는 span/div ──
  // (예: "More" 라벨 <span> 인데 Link로 감싸지 않아 클릭해도 아무 동작 없음)
  const FAKE_RE = /^(more|view\s*more|더보기|자세히( ?보기)?|바로가기|예약하기|상세보기|자세히보기)$/i;
  const fakeButtons = [...document.querySelectorAll("span, div")]
    .filter((el) => {
      if (!isVisible(el)) return false;
      const txt = (el.textContent || "").trim();
      if (txt.length > 14 || el.children.length > 2) return false;
      const cs = getComputedStyle(el);
      const looksBtn = FAKE_RE.test(txt) || (cs.cursor === "pointer" && txt.length > 0);
      if (!looksBtn) return false;
      // 인터랙티브 조상이 있으면 그 조상이 클릭을 처리하므로 정상
      if (el.closest("a, button, [role=button], summary, label")) return false;
      if (el.querySelector("a, button")) return false;
      return true;
    })
    .slice(0, 30)
    .map((el) => ({ tag: el.tagName.toLowerCase(), txt: (el.textContent || "").trim().slice(0, 20) }));

  return { elements: results, nav: navResult, fakeButtons };
}`;

async function auditUrl(url) {
  const browser = await chromium.launch();
  const out = {};
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message)));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    // PROBE는 async 함수 "문자열" → 반드시 (PROBE)() 형태로 호출해야 실행됨
    const data = await page.evaluate(`(${PROBE})()`);
    out[vp.name] = { ...data, jsErrors: errors };
    await page.close();
  }
  await browser.close();
  return out;
}

function report(clone, orig, cloneUrl) {
  const p1 = [], p2 = [], p3 = [];
  const lines = [`# Interaction Audit — ${cloneUrl}`, ""];

  // ── 모바일 내비 게이트 ──
  const m = clone.mobile?.nav;
  if (m) {
    if (m.visibleNavLinks < 2 && m.toggleCount === 0) {
      p1.push(`모바일(390px): 내비 링크가 숨겨졌는데 햄버거/메뉴 토글 자체가 없음 → 모바일에서 네비게이션 불가.`);
    } else if (m.visibleNavLinks < 2 && m.toggleCount > 0 && !m.toggleWorked) {
      if (m.revealedOutsidePanel > 0) {
        p1.push(`모바일(390px): 메뉴 토글("${m.toggleLabel}")을 누르면 링크 ${m.revealedOutsidePanel}개가 DOM엔 나타나지만 **패널 박스 밖(뷰포트/패널 영역 이탈)에 렌더**됨 → 화면엔 안 보임. 원인 1순위: 토글 패널의 조상에 backdrop-filter/filter/transform이 있어 fixed 컨테이닝블록이 붕괴(패널이 헤더 높이로 잘림). 드로어를 backdrop-filter 요소 밖으로 분리할 것.`);
      } else {
        p1.push(`모바일(390px): 메뉴 토글("${m.toggleLabel}")을 눌러도 내비가 노출되지 않음(before ${m.visibleNavLinks} → after ${m.navAfterToggle}) → **죽은 햄버거**. 드로어/메뉴 핸들러 누락 의심.`);
      }
    }
  }
  // 원본과의 대조(있으면)
  if (orig?.mobile?.nav) {
    const om = orig.mobile.nav;
    const origReachable = om.visibleNavLinks >= 2 || om.toggleWorked;
    const cloneReachable = (m?.visibleNavLinks ?? 0) >= 2 || m?.toggleWorked;
    if (origReachable && !cloneReachable) {
      p1.push(`원본은 모바일 내비 도달 가능(visible ${om.visibleNavLinks}, toggleWorked ${om.toggleWorked})하지만 클론은 불가 → 패리티 위반.`);
    }
  }

  // ── 죽은 요소 ──
  for (const vp of ["mobile", "desktop"]) {
    const els = clone[vp]?.elements || [];
    const deadButtons = els.filter((e) => e.dead && e.isButton);
    const deadHashAnchors = els.filter((e) => e.dead && !e.isButton && e.hashOnly);
    for (const e of deadButtons) {
      p2.push(`[${vp}] 죽은 버튼: "${e.label || "(무라벨)"}" — 클릭해도 DOM/스크롤/aria/네비 변화 없음(mutations ${e.mutations}).`);
    }
    for (const e of deadHashAnchors) {
      p3.push(`[${vp}] 동작 없는 앵커: "${e.label || "(무라벨)"}" href="${e.href}" — placeholder 링크 가능성.`);
    }
    const errs = clone[vp]?.jsErrors || [];
    for (const er of errs) p2.push(`[${vp}] JS 런타임 에러: ${er}`);
    const fakes = clone[vp]?.fakeButtons || [];
    for (const fb of fakes) {
      p2.push(`[${vp}] 장식 버튼(클릭 불가): <${fb.tag}> "${fb.txt}" — 버튼처럼 보이지만 a/button이 아니고 인터랙티브 조상도 없음. Link/button으로 감쌀 것.`);
    }
  }

  // ── 요약 ──
  const total = (clone.mobile?.elements?.length || 0);
  lines.push(`## 요약`, "");
  lines.push(`- 모바일 인터랙티브 요소: ${total}개`);
  lines.push(`- 모바일 내비: 보이는 링크 ${m?.visibleNavLinks ?? "?"}개 · 토글 ${m?.toggleCount ?? "?"}개 · 토글동작 ${m?.toggleWorked ? "✅" : "❌"}`);
  lines.push(`- 판정: P1 ${p1.length} · P2 ${p2.length} · P3 ${p3.length}`, "");

  if (!p1.length && !p2.length) {
    lines.push(`✅ **P1/P2 없음** — 인터랙션·모바일 기능 검증 통과.`, "");
  }
  if (p1.length) lines.push(`### 🔴 P1 (반드시 수정)\n${p1.map((s) => "- " + s).join("\n")}\n`);
  if (p2.length) lines.push(`### 🟠 P2 (죽은 버튼/에러)\n${p2.map((s) => "- " + s).join("\n")}\n`);
  if (p3.length) lines.push(`### 🟡 P3 (마이너)\n${p3.map((s) => "- " + s).join("\n")}\n`);

  return { md: lines.join("\n"), counts: { p1: p1.length, p2: p2.length, p3: p3.length } };
}

async function main() {
  const [cloneUrl, origUrl] = process.argv.slice(2);
  if (!cloneUrl) {
    console.error("Usage: node scripts/interaction-audit.mjs <클론URL> [원본URL]");
    process.exit(1);
  }
  console.log("→ 클론 인터랙션 분석:", cloneUrl);
  const clone = await auditUrl(cloneUrl);
  let orig = null;
  if (origUrl) {
    console.log("→ 원본 내비 대조:", origUrl);
    try { orig = await auditUrl(origUrl); } catch (e) { console.warn("원본 분석 실패(무시):", e.message); }
  }

  const outDir = "docs/research/interaction-audit";
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "clone.json"), JSON.stringify(clone, null, 2));
  if (orig) await fs.writeFile(path.join(outDir, "original.json"), JSON.stringify(orig, null, 2));
  const { md, counts } = report(clone, orig, cloneUrl);
  await fs.writeFile(path.join(outDir, "report.md"), md);
  console.log("✓ 보고서:", path.join(outDir, "report.md"));
  console.log("\n" + md);

  // P1 있으면 비정상 종료 → CI/게이트에서 차단 가능
  if (counts.p1 > 0) process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
