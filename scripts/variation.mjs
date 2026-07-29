#!/usr/bin/env node
/**
 * variation.mjs — REVRUN 차별화 레이어 결정론 생성기 (W1a)
 *
 * 클론이 원본 시각표현을 1:1로 베끼지 않도록, "사이트별로 다르지만 재실행해도 같은"
 * 히어로 아키타입·폰트 페어·팔레트를 seed로 골라 `variation.config.json`에 스냅샷한다.
 * 오케스트레이터가 Phase 1.5에서 이걸 돌려 그 값을 globals.css/layout.tsx/page.tsx에 반영.
 *
 * 사용:
 *   node scripts/variation.mjs <sitename> [--brand=#2b5c3f] [--industry=lodging] [--out=./variation.config.json]
 *   - <sitename>       : 클론 폴더명 등 안정 식별자(초기 seed 재료)
 *   - --brand=#hex     : build-site 경로 = 고객 신청서 theme_color(있으면 최우선)
 *   - --industry=<tag> : clone-site 경로 = 업종 태그(브랜드색 없을 때 중립팔레트 선택)
 *                        lodging | legal | construction | lifestyle
 *
 * ★ seed 불변화(C5): config가 이미 있으면 그 seed를 재사용한다 →
 *   폴더 리네임/재실행에도 디자인이 재추첨되지 않는다. seed를 새로 굳히려면 config 삭제.
 *
 * 순수 node 내장(fs/path)만 사용. 결정론 유지 위해 타임스탬프 등 가변값은 넣지 않는다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── 카탈로그 (SSOT) ───────────────────────────────────────────────
// 히어로 아키타입 id — components/heroes/index.ts HERO_ARCHETYPE_IDS와 순서·값 일치.
const HERO_ARCHETYPES = ["fullbleed", "carousel", "split"];

// 폰트 페어 — 한글 본문 + 라틴 디스플레이. 임의 조합에서도 안전하도록 큐레이션.
// latin.source: "google" | "cdn"(@font-face). korean 기본 Pretendard(cdn).
const FONT_PAIRS = [
  {
    id: "editorial-serif",
    latin: { family: "Cormorant Garamond", weights: [400, 600], source: "google" },
    korean: { family: "Pretendard Variable", source: "cdn" },
    note: "세리프 디스플레이 + 한글 산세 — 차분한 에디토리얼",
  },
  {
    id: "modern-geo",
    latin: { family: "Prompt", weights: [300, 500, 600], source: "google" },
    korean: { family: "Pretendard Variable", source: "cdn" },
    note: "지오메트릭 산세 + 한글 산세 — 모던·깔끔",
  },
  {
    id: "warm-humanist",
    latin: { family: "Mulish", weights: [400, 700, 800], source: "google" },
    korean: { family: "Nanum Gothic", weights: [400, 700, 800], source: "google" },
    note: "휴머니스트 산세 — 따뜻·친근",
  },
];

// 업종 중립 팔레트 — clone-site(신청서 없음) 경로용. 업종 톤에 맞는 primary.
// 값은 hex primary + 그림자 rgb(폴리시팩 --polish-shadow-rgb 오버라이드용).
const INDUSTRY_PALETTES = {
  lodging: { primary: "#2f6f5b", shadowRgb: "16, 64, 52", note: "숙박/캠핑 — 딥 그린" },
  legal: { primary: "#1f3a5f", shadowRgb: "18, 34, 58", note: "법률/전문 — 딥 네이비" },
  construction: { primary: "#b45c1e", shadowRgb: "90, 45, 15", note: "시공 — 번트 오렌지" },
  lifestyle: { primary: "#8a5cff", shadowRgb: "60, 40, 110", note: "생활서비스 — 바이올렛" },
};

// 업종·브랜드 둘 다 없을 때 seed로 고르는 중립 팔레트.
const NEUTRAL_PALETTES = [
  { primary: "#33604f", shadowRgb: "20, 45, 38", note: "포레스트" },
  { primary: "#2c4a6e", shadowRgb: "18, 34, 55", note: "슬레이트 블루" },
  { primary: "#7a5230", shadowRgb: "60, 42, 26", note: "테라코타 브라운" },
  { primary: "#4a4a52", shadowRgb: "30, 30, 36", note: "뉴트럴 차콜" },
];

// 모션 프리셋 (W1: 등장·스태거·hover) — globals.css의 [data-motion="<id>"] 블록과 값·id 일치.
// 스타일↔움직임 매핑 근거: thoughts/wiki/sources/refs/20260727_notion-aewon-ui-style-10-for-ai-sitebuilding.md
// (미니멀·에디토리얼=calm / 벤토·SaaS·다크=modern / 글래스·그라디언트=aurora / 브루탈·Y2K=punchy)
// hero: 히어로 배경 모션(ken-burns=사진 느린 확대 / gradient-drift=그라디언트 흐름 / parallax=스크롤 시차)
// decorative: 부수 장식(none / marquee=흐르는 띠 / rotate=회전 배지). ★둘 다 원본에 고유 모션 있으면 그게 우선.
const MOTION_PRESETS = {
  calm:   { reveal: "fade",     distancePx: 16, durationMs: 750, ease: "cubic-bezier(.22,1,.36,1)",  staggerMs: 110, hover: "lift-sm", hero: "ken-burns",      decorative: "none",    marqueeSec: 40, intensity: "calm" },
  modern: { reveal: "slide-up", distancePx: 28, durationMs: 560, ease: "cubic-bezier(.16,1,.3,1)",   staggerMs: 80,  hover: "lift",    hero: "ken-burns",      decorative: "none",    marqueeSec: 30, intensity: "standard" },
  aurora: { reveal: "blur-up",  distancePx: 22, durationMs: 680, ease: "cubic-bezier(.2,.7,.2,1)",   staggerMs: 90,  hover: "glow",    hero: "gradient-drift", decorative: "none",    marqueeSec: 34, intensity: "standard" },
  punchy: { reveal: "scale-in", distancePx: 40, durationMs: 460, ease: "cubic-bezier(.34,1.56,.64,1)", staggerMs: 60, hover: "tilt",  hero: "parallax",       decorative: "marquee", marqueeSec: 22, intensity: "punchy" },
};

// 업종/폰트 vibe → 어울리는 모션 후보(2개). seed로 그 안에서 하나 픽 → 일관성 + 다양성.
// ★법률에 punchy 같은 부조화(노션 카드 "법률사무소에 Y2K는 실패")를 원천 차단하려고 후보를 좁힌다.
const MOTION_BY_INDUSTRY = {
  legal: ["calm", "modern"],
  construction: ["modern", "punchy"],
  lodging: ["calm", "aurora"],
  lifestyle: ["aurora", "modern"],
};
const MOTION_BY_FONT = {
  "editorial-serif": ["calm", "modern"],
  "modern-geo": ["modern", "aurora"],
  "warm-humanist": ["aurora", "calm"],
};

function pickMotion(seed, industry, fontPairId) {
  const candidates =
    (industry && MOTION_BY_INDUSTRY[industry]) ||
    MOTION_BY_FONT[fontPairId] ||
    ["calm", "modern"];
  // ★상위 비트 사용(하위 비트 %len은 유사 사이트명에서 편중 → 업종 내 다양성 저하).
  //   전체 32비트를 [0,1)로 정규화해 균일 인덱싱.
  const idx = Math.floor((mix32(seed ^ 0x00c0ffee) / 4294967296) * candidates.length);
  const id = candidates[Math.min(idx, candidates.length - 1)];
  return { presetId: id, ...MOTION_PRESETS[id] };
}

// ── djb2 해시 (순수함수·안정) ─────────────────────────────────────
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// 정수 믹서(splitmix32 finalizer) — seed에서 knob별 독립·균일 인덱스 파생(상관 제거).
function mix32(x) {
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x45d9f3b) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x45d9f3b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

function parseArgs(argv) {
  const out = { sitename: null, brand: null, industry: null, out: null };
  for (const a of argv) {
    if (a.startsWith("--brand=")) out.brand = a.slice(8).trim() || null;
    else if (a.startsWith("--industry=")) out.industry = a.slice(11).trim() || null;
    else if (a.startsWith("--out=")) out.out = a.slice(6).trim() || null;
    else if (!a.startsWith("--") && !out.sitename) out.sitename = a.trim();
  }
  return out;
}

function isHex(s) {
  // 6자리 또는 3자리(#abc) 허용
  return typeof s === "string" && /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(s.trim());
}
function normHex(s) {
  let t = s.trim().toLowerCase();
  if (!t.startsWith("#")) t = "#" + t;
  // 3자리 → 6자리 확장(#abc → #aabbcc)
  if (t.length === 4) t = "#" + [...t.slice(1)].map((c) => c + c).join("");
  return t;
}

function pickPalette(seed, brand, industry) {
  if (brand && isHex(brand)) {
    return { source: "brand", primary: normHex(brand), shadowRgb: null, note: "고객 신청서 브랜드색" };
  }
  if (brand && !isHex(brand)) {
    // 브랜드값이 hex가 아니면 조용히 버리지 말고 경고(고객 브랜드색 소실 방지)
    console.warn(`⚠ --brand="${brand}"가 유효한 hex(#rrggbb/#rgb)가 아님 → 브랜드색 무시하고 ${industry ? "업종" : "중립"} 팔레트로 폴백. 신청서 theme_color 확인 필요.`);
  }
  if (industry && INDUSTRY_PALETTES[industry]) {
    return { source: "industry", ...INDUSTRY_PALETTES[industry] };
  }
  const p = NEUTRAL_PALETTES[mix32(seed ^ 0x85ebca6b) % NEUTRAL_PALETTES.length];
  return { source: "neutral", ...p };
}

function main() {
  const { sitename, brand, industry, out } = parseArgs(process.argv.slice(2));
  if (!sitename) {
    console.error("사용법: node scripts/variation.mjs <sitename> [--brand=#hex] [--industry=lodging|legal|construction|lifestyle]");
    process.exit(1);
  }
  const outPath = resolve(process.cwd(), out || "variation.config.json");

  // ★ seed 불변화: 기존 config에 seed가 있으면 재사용(리네임/재실행 안전).
  let seed = djb2(sitename);
  let locked = false;
  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, "utf8"));
      if (Number.isInteger(prev.seed)) {
        seed = prev.seed >>> 0;
        locked = true;
      }
    } catch {
      /* 손상 config면 무시하고 새로 굳힘 */
    }
  }

  // knob별 독립 인덱스(mix32로 상관 제거·균일 분포 — 특정 조합 편중 방지)
  const heroArchetype = HERO_ARCHETYPES[mix32(seed) % HERO_ARCHETYPES.length];
  const fontPair = FONT_PAIRS[mix32(seed ^ 0x9e3779b9) % FONT_PAIRS.length];
  const palette = pickPalette(seed, brand, industry);
  const motion = pickMotion(seed, industry, fontPair.id);

  const config = {
    _schema: "revrun.variation/2",
    sitename,
    seed,
    seedLocked: locked,
    heroArchetype,
    fontPair,
    palette,
    motion,
    // 오케스트레이터 적용 가이드(Phase 1.5 → Foundation).
    apply: {
      hero: `page.tsx에서 HERO_ARCHETYPES["${heroArchetype}"]를 히어로로 사용(components/heroes).`,
      font: `layout.tsx: 라틴="${fontPair.latin.family}"(${fontPair.latin.source}), 한글="${fontPair.korean.family}"(${fontPair.korean.source}). ★source=google는 next/font/google, source=cdn(예: Pretendard)는 globals.css @font-face CDN(next/font 불가). --font-heading/--font-sans @theme 매핑.`,
      palette:
        palette.source === "brand"
          ? `globals.css :root --primary를 ${palette.primary}로(고객 브랜드색). 원본 원색 재사용 금지.`
          : `globals.css :root --primary=${palette.primary}${palette.shadowRgb ? `, --polish-shadow-rgb: ${palette.shadowRgb}` : ""} (${palette.source}).`,
      motion: `layout.tsx의 <html>에 data-motion="${motion.presetId}" 추가 → 등장/hover/stagger는 [data-motion] 토큰을 전 컴포넌트가 자동 소비(추가 편집 불필요). 섹션/카드 class="reveal"(스태거 style --reveal-delay: calc(i * var(--stagger-step))), hover 카드 class="tg-lift". 히어로 배경 모션(hero="${motion.hero}")은 히어로 media 요소(class="hero-media")에 부여: ken-burns→class "hero-ken"(사진), gradient-drift→"hero-gradient-drift"(그라디언트/무사진 히어로), parallax→"hero-parallax"(사진, CSS scroll-timeline·JS0·미지원 자동무시). 장식(decorative="${motion.decorative}"): marquee→"tg-marquee", rotate→"tg-rotate"(none이면 생략). reduced-motion 자동 무력화. ★우선순위(클론 충실도 최우선): 원본이 고유 모션(마퀴·before/after 슬라이더·GSAP 스크롤·특유 히어로 연출 등)을 쓰면 Phase 6 Animation Audit대로 그 원본을 충실히 재현하고 이 프리셋으로 덮지 말 것. 프리셋은 원본에 특별 모션이 없을 때의 기본 베이스일 뿐이다.`,
    },
  };

  writeFileSync(outPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`✔ variation → ${outPath}`);
  console.log(`  seed=${seed}${locked ? " (locked·재사용)" : " (신규·굳힘)"}  hero=${heroArchetype}  font=${fontPair.id}  palette=${palette.source}:${palette.primary}  motion=${motion.presetId}`);
}

main();
