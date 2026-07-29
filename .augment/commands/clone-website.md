---
description: "Reverse-engineer and clone any website as a pixel-perfect replica"
argument-hint: "<url>"
---
<!-- AUTO-GENERATED from .claude/skills/clone-website/SKILL.md — do not edit directly.
     Run `node scripts/sync-skills.mjs` to regenerate. -->


# Clone Website

You are about to reverse-engineer and rebuild **$ARGUMENTS**. **REVRUN 파이프라인 기본 = Phase 1.5 divergence**: 콘텐츠·정보구조는 원본과 1:1 충실하되 시각 표현(히어로·색·폰트)은 REVRUN 고유로 재구성한다(저작권 구조베낌 원천제거). 순수 1:1 픽셀복제가 목적이면 fidelity=pixel-perfect로 지정해 divergence를 끈다.

When multiple URLs are provided, process them independently and in parallel where possible, while keeping each site's extraction artifacts isolated in dedicated folders (for example, `docs/research/<hostname>/`).

This is not a two-phase process (inspect then build). You are a **foreman walking the job site** — as you inspect each section of the page, you write a detailed specification to a file, then hand that file to a specialist builder agent with everything they need. Extraction and construction happen in parallel, but extraction is meticulous and produces auditable artifacts.

## Scope Defaults

The target is whatever page `$ARGUMENTS` resolves to. Clone exactly what's visible at that URL. Unless the user specifies otherwise, use these defaults:

- **Fidelity (이원화 — REVRUN 기본):** **정보구조·콘텐츠·에셋은 원본과 1:1 충실**(라우트·정보 슬롯·verbatim 텍스트·사진). **시각 표현(히어로 레이아웃·색/그림자 톤·타이포)은 REVRUN 고유로 재구성**(Phase 1.5 Divergence Brief). 원본이 대부분 시판 빌더 템플릿이라 "1:1 리스킨" 인상을 없애 저작권 리스크를 낮춘다.
  - *예외 — 순수 픽셀복제*: 외부용 등 1:1 복제가 목적이면 fidelity=pixel-perfect로 지정해 Phase 1.5를 건너뛴다(colors/spacing/typography exact match).
- **In scope:** Visual layout and styling, component structure and interactions, responsive design, mock data for demo purposes
- **Out of scope:** Real backend / database, authentication, real-time features, SEO optimization, accessibility audit
- **Customization:** REVRUN 하우스 시각 아이덴티티 적용(Phase 1.5). 콘텐츠·정보구조는 보존, 표현만 변주.

If the user provides additional instructions (specific fidelity level, customizations, extra context), honor those over the defaults.

## Pre-Flight

1. **Browser automation is required.** Check for available browser MCP tools (Chrome MCP, Playwright MCP, Browserbase MCP, Puppeteer MCP, etc.). Use whichever is available — if multiple exist, prefer Chrome MCP. If none are detected, ask the user which browser tool they have and how to connect it. This skill cannot work without browser automation.
2. Parse `$ARGUMENTS` as one or more URLs. Normalize and validate each URL; if any are invalid, ask the user to correct them before proceeding. For each valid URL, verify it is accessible via your browser MCP tool.
3. Verify the base project builds: `npm run build`. The Next.js + shadcn/ui + Tailwind v4 scaffold should already be in place. If not, tell the user to set it up first.
4. Create the output directories if they don't exist: `docs/research/`, `docs/research/components/`, `docs/design-references/`, `scripts/`. For multiple clones, also prepare per-site folders like `docs/research/<hostname>/` and `docs/design-references/<hostname>/`.
5. When working with multiple sites in one command, optionally confirm whether to run them in parallel (recommended, if resources allow) or sequentially to avoid overload.

## Guiding Principles

These are the truths that separate a successful clone from a "close enough" mess. Internalize them — they should inform every decision you make.

### 1. Completeness Beats Speed

Every builder agent must receive **everything** it needs to do its job perfectly: screenshot, exact CSS values, downloaded assets with local paths, real text content, component structure. If a builder has to guess anything — a color, a font size, a padding value — you have failed at extraction. Take the extra minute to extract one more property rather than shipping an incomplete brief.

### 2. Small Tasks, Perfect Results

When an agent gets "build the entire features section," it glosses over details — it approximates spacing, guesses font sizes, and produces something "close enough" but clearly wrong. When it gets a single focused component with exact CSS values, it nails it every time.

Look at each section and judge its complexity. A simple banner with a heading and a button? One agent. A complex section with 3 different card variants, each with unique hover states and internal layouts? One agent per card variant plus one for the section wrapper. When in doubt, make it smaller.

**Complexity budget rule:** If a builder prompt exceeds ~150 lines of spec content, the section is too complex for one agent. Break it into smaller pieces. This is a mechanical check — don't override it with "but it's all related."

### 3. Real Content, Real Assets

Extract the actual text, images, videos, and SVGs from the live site. This is a clone, not a mockup. Use `element.textContent`, download every `<img>` and `<video>`, extract inline `<svg>` elements as React components. The only time you generate content is when something is clearly server-generated and unique per session.

**Layered assets matter.** A section that looks like one image is often multiple layers — a background watercolor/gradient, a foreground UI mockup PNG, an overlay icon. Inspect each container's full DOM tree and enumerate ALL `<img>` elements and background images within it, including absolutely-positioned overlays. Missing an overlay image makes the clone look empty even if the background is correct.

**Baked-text originals (image-builder sites — cafe24, 이미지빌더).** When a target's sections are whole JPGs with the copy baked into the image (few real text nodes, many full-width `<img>` like `img-pc-01..06.jpg`; `extract-tokens` finds little typography because the text isn't in the DOM), you MUST **faithfully reconstruct each section-image's layout in real HTML** — photo hero with overlay text, portrait-profile two-column, dark testimonial cards with avatars, photo-background form. **NEVER re-interpret it into a generic icon+text template** (flat solid hero, text-only profile) — that is the #1 fidelity failure (2026-07-01 탕감: a photo-driven law-firm landing got rebuilt as a flat template; full rework required). Download each section image to `docs/design-references/`, Read them directly, and mirror the composition. For rebrands where the original photos carry brand residue (logos, a specific person's face) and can't be reused, **generate replacement imagery of the same composition** (nano-banana-pro / Gemini `gemini-3-pro-image-preview`): hero background props, a generic professional (framed as "상담팀", never impersonating a named person), background photos, avatars — then optimize with `sharp` (hero ~1600px q80, avatars ~200px). Stripping all photos to icons-only = failure.

### 4. Foundation First

Nothing can be built until the foundation exists: global CSS with the target site's design tokens (colors, fonts, spacing), TypeScript types for the content structures, and global assets (fonts, favicons). This is sequential and non-negotiable. Everything after this can be parallel.

### 5. Extract How It Looks AND How It Behaves

A website is not a screenshot — it's a living thing. Elements move, change, appear, and disappear in response to scrolling, hovering, clicking, resizing, and time. If you only extract the static CSS of each element, your clone will look right in a screenshot but feel dead when someone actually uses it.

For every element, extract its **appearance** (exact computed CSS via `getComputedStyle()`) AND its **behavior** (what changes, what triggers the change, and how the transition happens). Not "it looks like 16px" — extract the actual computed value. Not "the nav changes on scroll" — document the exact trigger (scroll position, IntersectionObserver threshold, viewport intersection), the before and after states (both sets of CSS values), and the transition (duration, easing, CSS transition vs. JS-driven vs. CSS `animation-timeline`).

Examples of behaviors to watch for — these are illustrative, not exhaustive. The page may do things not on this list, and you must catch those too:
- A navbar that shrinks, changes background, or gains a shadow after scrolling past a threshold
- Elements that animate into view when they enter the viewport (fade-up, slide-in, stagger delays)
- Sections that snap into place on scroll (`scroll-snap-type`)
- Parallax layers that move at different rates than the scroll
- Hover states that animate (not just change — the transition duration and easing matter)
- Dropdowns, modals, accordions with enter/exit animations
- Scroll-driven progress indicators or opacity transitions
- Auto-playing carousels or cycling content
- Dark-to-light (or any theme) transitions between page sections
- **Tabbed/pill content that cycles** — buttons that switch visible card sets with transitions
- **Scroll-driven tab/accordion switching** — sidebars where the active item auto-changes as content scrolls past (IntersectionObserver, NOT click handlers)
- **Smooth scroll libraries** (Lenis, Locomotive Scroll) — check for `.lenis` class or scroll container wrappers

### 6. Identify the Interaction Model Before Building

This is the single most expensive mistake in cloning: building a click-based UI when the original is scroll-driven, or vice versa. Before writing any builder prompt for an interactive section, you must definitively answer: **Is this section driven by clicks, scrolls, hovers, time, or some combination?**

How to determine this:
1. **Don't click first.** Scroll through the section slowly and observe if things change on their own as you scroll.
2. If they do, it's scroll-driven. Extract the mechanism: `IntersectionObserver`, `scroll-snap`, `position: sticky`, `animation-timeline`, or JS scroll listeners.
3. If nothing changes on scroll, THEN click/hover to test for click/hover-driven interactivity.
4. Document the interaction model explicitly in the component spec: "INTERACTION MODEL: scroll-driven with IntersectionObserver" or "INTERACTION MODEL: click-to-switch with opacity transition."

A section with a sticky sidebar and scrolling content panels is fundamentally different from a tabbed interface where clicking switches content. Getting this wrong means a complete rewrite, not a CSS tweak.

### 7. Extract Every State, Not Just the Default

Many components have multiple visual states — a tab bar shows different cards per tab, a header looks different at scroll position 0 vs 100, a card has hover effects. You must extract ALL states, not just whatever is visible on page load.

For tabbed/stateful content:
- Click each tab/button via browser MCP
- Extract the content, images, and card data for EACH state
- Record which content belongs to which state
- Note the transition animation between states (opacity, slide, fade, etc.)

For scroll-dependent elements:
- Capture computed styles at scroll position 0 (initial state)
- Scroll past the trigger threshold and capture computed styles again (scrolled state)
- Diff the two to identify exactly which CSS properties change
- Record the transition CSS (duration, easing, properties)
- Record the exact trigger threshold (scroll position in px, or viewport intersection ratio)

### 8. Spec Files Are the Source of Truth

Every component gets a specification file in `docs/research/components/` BEFORE any builder is dispatched. This file is the contract between your extraction work and the builder agent. The builder receives the spec file contents inline in its prompt — the file also persists as an auditable artifact that the user (or you) can review if something looks wrong.

The spec file is not optional. It is not a nice-to-have. If you dispatch a builder without first writing a spec file, you are shipping incomplete instructions based on whatever you can remember from a browser MCP session, and the builder will guess to fill gaps.

### 9. Build Must Always Compile

Every builder agent must verify `npx tsc --noEmit` passes before finishing. After merging worktrees, you verify `npm run build` passes. A broken build is never acceptable, even temporarily.

## Phase 1: Reconnaissance

Navigate to the target URL with browser MCP.

### Site Map Enumeration (FIRST — before screenshots)

**Do not assume the site is one page.** Many targets are multi-page (separate `about.html`, `rooms.html`, `room.html?id=N`, `reserve.html`, `notice.html`, etc.) reached through the nav. Cloning only the landing page and collapsing everything into anchors (`#stay`, `#facilities`) is a **structural infidelity** — a past clone shipped 1 of 8 pages this way.

Enumerate the full site map before anything else:
1. Extract **every nav/menu/footer link** and every internal `href` on the entry page:
   ```bash
   curl -sL <URL> | grep -oiE 'href="[^"]+"' | grep -viE '\\.(css|js|png|jpe?g|gif|svg|ico|woff2?)' | sort -u
   ```
2. Group them into **page templates** (e.g. `rooms.html` = list template) vs **detail routes** (`room.html?id=1..N` = one template, N instances) vs **in-page anchors** (`#section`).
3. Visit each distinct template once, screenshot it, and note whether it is its own scrolling page or a one-pager. Detail routes (`?id=`) share a template — clone the template + drive content by route param (Next.js `app/room/[id]/page.tsx`).
4. Record the result as a **route map** at the top of `PAGE_TOPOLOGY.md`:

   | Original URL | Clone route | Template | Instances | Nav label |
   |---|---|---|---|---|
   | index.html | `/` | home (one-pager) | 1 | 홈 |
   | rooms.html | `/rooms` | room-list | 1 | 객실안내 |
   | room.html?id=N | `/rooms/[id]` | room-detail | 8 | (from list) |
   | reserve.html | `/reserve` | reserve | 1 | 예약안내 |

5. **Decide IA fidelity with the user if the site is multi-page** — full parity (every template + detail route) vs. consolidated (details as modals). Default to **full parity**; never silently collapse multi-page → single-page.

Then run the rest of Phase 1 (screenshots, extraction, behavior sweep, topology) **per template**, not just for the home page.

### Screenshots
- Take **full-page screenshots** at desktop (1440px) and mobile (390px) viewports
- Save to `docs/design-references/` with descriptive names
- These are your master reference — builders will receive section-specific crops/screenshots later

### Global Extraction

**★ 토큰 자동 실측 먼저 (필수, 2026-06-29 ① — No Guessing):** 색·폰트·간격을 눈대중하지 말고 **스크립트로 실측**한다:
```bash
node scripts/extract-tokens.mjs <원본URL> [<원본URL2> ...]
# → docs/research/design-tokens.json  (빈도순 팔레트·폰트스케일·간격 히스토그램·radius·shadow)
# → docs/research/design-tokens.css   (globals.css 로 옮길 @theme/:root 후보 스캐폴드)
```
이 산출물이 **Phase 2 Foundation 토큰의 측정 근거**다. 멀티페이지면 대표 URL 여러 개를 한 번에 넘겨 합산 측정. 그 다음 아래 폰트/색 항목을 design-tokens 결과에 근거해 작성한다(추측 금지).

**Fonts** — `design-tokens.json`의 `typography.families`(빈도순)/`page.bodyFont` + `<link>` 태그(Google/self-hosted)를 교차확인. heading/body/label 별 family·weight·style을 `src/app/layout.tsx`에 `next/font/google`|`next/font/local`(또는 CDN `@font-face`)로 구성. ⚠️ **측정한 폰트를 반드시 적용하라 — 템플릿 기본 폰트(Noto/Geist) 잔존 금지.** (2026-07-01 탕감 사고: Pretendard를 측정해놓고 Noto로 빌드해 원본과 어긋남. `lint-pipeline.mjs`가 측정↔적용 폰트 드리프트를 경고하지만, 리브랜딩으로 일부러 바꾼 게 아니면 원본 폰트를 그대로 써야 한다. Pretendard는 GFonts에 없음 → `@font-face` src `cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2` format("woff2").)
> **★REVRUN divergence 오버라이드 (variation.config.json 존재 시 — Phase 1.5 경로)**: 위 "원본 폰트를 그대로"는 **순수 픽셀복제 모드에만 적용**. divergence 모드에선 폰트를 **`variation.config.json.fontPair`**로 구성한다(원본 폰트 아님). 라틴=`fontPair.latin`(source=google→`next/font/google`), 한글=`fontPair.korean`(source=cdn=Pretendard→`@font-face` CDN 위 레시피, next/font 불가). `--font-heading`/`--font-sans` @theme 매핑. 원본 폰트는 참고만.

**Colors** — `design-tokens.json`의 `palette`(textColors·backgroundColors·borderColors, 빈도/면적 가중)와 `design-tokens.css` 스캐폴드를 근거로 `src/app/globals.css`의 `:root`/`.dark` 토큰을 작성. shadcn 토큰명(background/foreground/primary/muted…)에 매핑하되, **토큰명·최종값은 브랜드 의도 반영해 확정**(스캐폴드는 후보일 뿐). 매핑 안 되는 색은 커스텀 프로퍼티로.
> **★REVRUN divergence 오버라이드 (variation.config.json 존재 시)**: **주조색(`--primary` 및 파생·`--polish-shadow-rgb`)은 원본 팔레트가 아니라 `variation.config.json.palette`로 설정한다**(brand=고객색 / industry·neutral). `:root` **와 `.dark` 양쪽** `--primary`를 갱신(다크 섹션 브랜드색 누락 방지). palette.primary는 hex — CSS 유효하나 베이스가 oklch면 oklch로 변환해 스타일 일관성 유지(선택). 원본 배경/보조색은 대비·구조 참고용으로만.

**Favicons & Meta** — Download favicons, apple-touch-icons, OG images, webmanifest to `public/seo/`. Update `layout.tsx` metadata.

**Global UI patterns** — Identify any site-wide CSS or JS: custom scrollbar hiding, scroll-snap on the page container, global keyframe animations, backdrop filters, gradients used as overlays, **smooth scroll libraries** (Lenis, Locomotive Scroll — check for `.lenis`, `.locomotive-scroll`, or custom scroll container classes). Add these to `globals.css` and note any libraries that need to be installed.

### Mandatory Interaction Sweep

This is a dedicated pass AFTER screenshots and BEFORE anything else. Its purpose is to discover every behavior on the page — many of which are invisible in a static screenshot.

**Scroll sweep:** Scroll the page slowly from top to bottom via browser MCP. At each section, pause and observe:
- Does the header change appearance? Record the scroll position where it triggers.
- Do elements animate into view? Record which ones and the animation type.
- Does a sidebar or tab indicator auto-switch as you scroll? Record the mechanism.
- Are there scroll-snap points? Record which containers.
- Is there a smooth scroll library active? Check for non-native scroll behavior.

**Click sweep:** Click every element that looks interactive:
- Every button, tab, pill, link, card
- Record what happens: does content change? Does a modal open? Does a dropdown appear?
- For tabs/pills: click EACH ONE and record the content that appears for each state

**Hover sweep:** Hover over every element that might have hover states:
- Buttons, cards, links, images, nav items
- Record what changes: color, scale, shadow, underline, opacity

**Responsive sweep:** Test at 3 viewport widths via browser MCP:
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px
- At each width, note which sections change layout (column → stack, sidebar disappears, etc.) and at approximately which breakpoint the change occurs.

Save all findings to `docs/research/BEHAVIORS.md`. This is your behavior bible — reference it when writing every component spec.

### Page Topology
Map out every distinct section of the page from top to bottom. Give each a working name. Document:
- Their visual order
- Which are fixed/sticky overlays vs. flow content
- The overall page layout (scroll container, column structure, z-index layers)
- Dependencies between sections (e.g., a floating nav that overlays everything)
- **The interaction model** of each section (static, click-driven, scroll-driven, time-driven)

Save this as `docs/research/PAGE_TOPOLOGY.md` — it becomes your assembly blueprint.

## Phase 1.5: Divergence Brief (REVRUN 차별화 레이어 — 저작권 구조베낌 원천제거)

> **목적**: 원본을 **콘텐츠·정보구조의 소스로만** 쓰고, **시각 표현(히어로 레이아웃·톤=색/그림자·타이포)은 REVRUN 고유로 재구성**한다. 원본이 대부분 시판 빌더 템플릿(einet/make24 등)이라 골격 자체는 공용물이지만, "우리 클론이 그 원본을 1:1로 리스킨했다"는 인상을 없애 편집저작권·브랜드 리스크를 낮춘다.
>
> **적용 범위**: REVRUN 파이프라인(`/clone-site`·`/build-site`)에서는 **기본 ON**. 순수 1:1 픽셀복제가 목적이면(외부용 등) 이 Phase를 건너뛰고 기존 fidelity=pixel-perfect로 진행.
>
> **불가침(변형 금지)**: `PAGE_TOPOLOGY.md`의 라우트/페이지/정보 슬롯, verbatim 텍스트·콘텐츠 사진, 객실/시설 정보 완전성, 기능 도달성(모바일 내비). **변형 대상**: globals.css/layout.tsx 토큰(색·폰트·간격)·히어로 아키타입·(향후)섹션 시각순서.

### 1.5-a. 차별화 값 생성 (결정론)
```bash
# 사이트명으로 seed를 굳혀 히어로 아키타입·폰트페어·팔레트를 결정 → variation.config.json 스냅샷
node scripts/variation.mjs <sitename> [--brand=#hex] [--industry=lodging|legal|construction|lifestyle]
#  - build-site 경로: --brand=<intake theme_color> (고객 브랜드색 최우선)
#  - clone-site 경로: --industry=<업종> (브랜드색 없으면 업종 중립 팔레트)
#  - 둘 다 없으면 seed 기반 중립 팔레트. ★같은 사이트=항상 같은 결과(config 있으면 seed 재사용=리네임 안전)
```
산출 `variation.config.json`의 `heroArchetype`·`fontPair`·`palette`·`motion`·`apply`를 아래 Foundation에서 그대로 소비한다.

### 1.5-b. Foundation 반영 (Phase 2에서)
- **히어로**: `page.tsx`에서 원본 히어로를 그대로 베끼지 말고 `HERO_ARCHETYPES[config.heroArchetype]`(`@/components/heroes`, 계약 `HeroProps`)를 사용. 원본에서 뽑은 **슬라이드 이미지·카피는 그대로 주입**(콘텐츠 보존), 표현(아키타입)만 우리 것.
- **팔레트/톤**: `globals.css :root`의 `--primary`(및 `--polish-shadow-rgb`)를 `config.palette`로. **원본 원색을 그대로 재사용하지 말 것**(brand 있으면 브랜드색, 없으면 업종/중립).
- **타이포**: `layout.tsx`의 `next/font`를 `config.fontPair`(라틴+한글)로 구성 후 `globals.css @theme --font-heading/--font-sans` 매핑. 원본 폰트를 그대로 답습하지 않는다.
- **모션(2026-07-27)**: `layout.tsx`의 `<html>`에 `data-motion="config.motion.presetId"`를 부여 → globals.css `[data-motion]` 토큰이 등장·stagger·hover를 전 컴포넌트에 자동 적용(추가 편집 없음). 히어로 배경 모션은 `config.motion.hero`대로 히어로 media 요소(`hero-media`)에 클래스 적용(ken-burns→`hero-ken`, gradient-drift→`hero-gradient-drift`, parallax→`hero-parallax`). 장식은 `config.motion.decorative`(marquee→`tg-marquee`, rotate→`tg-rotate`, none이면 생략). **★클론 충실도 우선**: 원본이 고유 모션(마퀴·before/after 슬라이더·GSAP 스크롤·특유 히어로 연출)을 쓰면 Phase 6대로 그 원본을 충실 재현하고 프리셋으로 덮지 말 것 — 프리셋은 원본에 특별 모션이 없을 때의 기본 베이스다.
- **섹션 순서**: (현 단계) 원본 정보구조는 보존하되, 향후 섹션 시각순서 재배열이 도입되면 그 지시도 브리프에 포함(별도 Wave). **순서를 흔든 경우 Phase 5.5 디자인 검수 필수.**
- **C-lite(구멍 차단 — 필수)**: Phase 3 빌더 spec의 "Computed Styles"에서 **색은 `var(--primary)`/전경·배경 토큰, 폰트는 `var(--font-heading)`/`var(--font-sans)` 토큰 참조로 적는다**(원본 raw hex·원본 font-family 인라인 금지). 추출한 원본 색/폰트 값은 **레이아웃·간격·구조 참고용으로만** 라벨하고 빌더에게 "색·폰트는 토큰, 원색 재현 금지"를 명시. (안 그러면 spec의 `color:#원본` 을 빌더가 충실 재현해 컴포넌트에 원본 팔레트가 부활한다.)

## Phase 2: Foundation Build

This is sequential. Do it yourself (not delegated to an agent) since it touches many files:

1. **Update fonts** in `layout.tsx`:
   - **divergence 모드(variation.config.json 존재)**: 폰트 = `config.fontPair`(라틴 next/font/google + 한글 Pretendard @font-face). **원본 폰트 아님.**
   - 순수 픽셀복제 모드: 원본 실측 폰트.
2. **Update globals.css**:
   - **divergence 모드**: `--primary`(및 `--polish-shadow-rgb`)를 **`config.palette`**로(`:root`+`.dark` 양쪽). 히어로는 `HERO_ARCHETYPES[config.heroArchetype]` 사용(§Phase 1.5-b). 간격·keyframe·글로벌 스크롤(Lenis 등)·유틸은 원본 참고로 구성하되 **색·폰트·히어로는 config가 정본**.
   - 순수 픽셀복제 모드: 원본 color 토큰 그대로.
3. **Create TypeScript interfaces** in `src/types/` for the content structures you've observed
4. **Extract SVG icons** — find all inline `<svg>` elements on the page, deduplicate them, and save as named React components in `src/components/icons.tsx`. Name them by visual function (e.g., `SearchIcon`, `ArrowRightIcon`, `LogoIcon`).
5. **Download global assets** — write and run a Node.js script (`scripts/download-assets.mjs`) that downloads all images, videos, and other binary assets from the page to `public/`. Preserve meaningful directory structure.
6. **Premium polish 기본팩 (2026-07-01 탕감 — 밋밋한 클론 방지)** — globals.css에 이미 포함된 폴리시 유틸(`reveal`/`.in-view`, `shadow-brand-*`, `tg-lift`, `tg-glow`, `tg-marquee`, reduced-motion)을 실제로 **적용**하라. 최소: ① `<ScrollReveal />`(components/scroll-reveal.tsx) 마운트 + 섹션/카드에 `reveal`(+stagger `--reveal-delay: calc(i * var(--stagger-step))`) ② `<noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>` 폴백 ③ **스크롤 인식 nav**(투명→스크롤 시 solid+shadow, 클라이언트 헤더에서 scrollY 토글) ④ 카드 `tg-lift`, CTA 그라데이션+그림자. `--polish-shadow-rgb`를 브랜드 색으로 오버라이드. 기능만 되고 모션·깊이 0인 클론은 미완성으로 본다.
   - ★**모션 프리셋(divergence 모드)**: 위 §1.5-b "모션"대로 `<html data-motion="config.motion.presetId">`를 반드시 세팅 → `reveal`/`tg-lift`가 프리셋 성격(calm/modern/aurora/punchy)을 자동 반영한다. 히어로 media에는 `config.motion.hero` 클래스(`hero-ken`/`hero-gradient-drift`/`hero-parallax`) 적용. data-motion 미설정 시 calm 기본값으로만 동작(무해하나 프리셋 다양성 손실).
7. Verify: `npm run build` passes

### Asset Discovery Script Pattern

Use browser MCP to enumerate all assets on the page:

```javascript
// Run this via browser MCP to discover all assets
JSON.stringify({
  images: [...document.querySelectorAll('img')].map(img => ({
    src: img.src || img.currentSrc,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
    // Include parent info to detect layered compositions
    parentClasses: img.parentElement?.className,
    siblings: img.parentElement ? [...img.parentElement.querySelectorAll('img')].length : 0,
    position: getComputedStyle(img).position,
    zIndex: getComputedStyle(img).zIndex
  })),
  videos: [...document.querySelectorAll('video')].map(v => ({
    src: v.src || v.querySelector('source')?.src,
    poster: v.poster,
    autoplay: v.autoplay,
    loop: v.loop,
    muted: v.muted
  })),
  backgroundImages: [...document.querySelectorAll('*')].filter(el => {
    const bg = getComputedStyle(el).backgroundImage;
    return bg && bg !== 'none';
  }).map(el => ({
    url: getComputedStyle(el).backgroundImage,
    element: el.tagName + '.' + el.className?.split(' ')[0]
  })),
  svgCount: document.querySelectorAll('svg').length,
  fonts: [...new Set([...document.querySelectorAll('*')].slice(0, 200).map(el => getComputedStyle(el).fontFamily))],
  favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() }))
});
```

Then write a download script that fetches everything to `public/`. Use batched parallel downloads (4 at a time) with proper error handling.

## Phase 3: Component Specification & Dispatch

This is the core loop. For each section in your page topology (top to bottom), you do THREE things: **extract**, **write the spec file**, then **dispatch builders**.

### Step 1: Extract

For each section, use browser MCP to extract everything:

1. **Screenshot** the section in isolation (scroll to it, screenshot the viewport). Save to `docs/design-references/`.

2. **Extract CSS** for every element in the section. Use the extraction script below — don't hand-measure individual properties. Run it once per component container and capture the full output:

```javascript
// Per-component extraction — run via browser MCP
// Replace SELECTOR with the actual CSS selector for the component
(function(selector) {
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Element not found: ' + selector });
  const props = [
    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
    'textTransform','textDecoration','backgroundColor','background',
    'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'margin','marginTop','marginRight','marginBottom','marginLeft',
    'width','height','maxWidth','minWidth','maxHeight','minHeight',
    'display','flexDirection','justifyContent','alignItems','gap',
    'gridTemplateColumns','gridTemplateRows',
    'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
    'boxShadow','overflow','overflowX','overflowY',
    'position','top','right','bottom','left','zIndex',
    'opacity','transform','transition','cursor',
    'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
    'whiteSpace','textOverflow','WebkitLineClamp'
  ];
  function extractStyles(element) {
    const cs = getComputedStyle(element);
    const styles = {};
    props.forEach(p => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v; });
    return styles;
  }
  function walk(element, depth) {
    if (depth > 4) return null;
    const children = [...element.children];
    return {
      tag: element.tagName.toLowerCase(),
      classes: element.className?.toString().split(' ').slice(0, 5).join(' '),
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 200) : null,
      styles: extractStyles(element),
      images: element.tagName === 'IMG' ? { src: element.src, alt: element.alt, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight } : null,
      childCount: children.length,
      children: children.slice(0, 20).map(c => walk(c, depth + 1)).filter(Boolean)
    };
  }
  return JSON.stringify(walk(el, 0), null, 2);
})('SELECTOR');
```

3. **Extract multi-state styles** — for any element with multiple states (scroll-triggered, hover, active tab), capture BOTH states:

```javascript
// State A: capture styles at current state (e.g., scroll position 0)
// Then trigger the state change (scroll, click, hover via browser MCP)
// State B: re-run the extraction script on the same element
// The diff between A and B IS the behavior specification
```

Record the diff explicitly: "Property X changes from VALUE_A to VALUE_B, triggered by TRIGGER, with transition: TRANSITION_CSS."

4. **Extract real content** — all text, alt attributes, aria labels, placeholder text. Use `element.textContent` for each text node. For tabbed/stateful content, **click each tab and extract content per state**.

5. **Identify assets** this section uses — which downloaded images/videos from `public/`, which icon components from `icons.tsx`. Check for **layered images** (multiple `<img>` or background-images stacked in the same container).

6. **Assess complexity** — how many distinct sub-components does this section contain? A distinct sub-component is an element with its own unique styling, structure, and behavior (e.g., a card, a nav item, a search panel).

### Step 2: Write the Component Spec File

For each section (or sub-component, if you're breaking it up), create a spec file in `docs/research/components/`. This is NOT optional — every builder must have a corresponding spec file.

**File path:** `docs/research/components/<component-name>.spec.md`

**Template:**

```markdown
# <ComponentName> Specification

## Overview
- **Target file:** `src/components/<ComponentName>.tsx`
- **Screenshot:** `docs/design-references/<screenshot-name>.png`
- **Interaction model:** <static | click-driven | scroll-driven | time-driven>

## DOM Structure
<Describe the element hierarchy — what contains what>

## Computed Styles (exact values from getComputedStyle)

### Container
- display: ...
- padding: ...
- maxWidth: ...
- (every relevant property with exact values)

### <Child element 1>
- fontSize: ...
- color: ...
- (every relevant property)

### <Child element N>
...

## States & Behaviors

### <Behavior name, e.g., "Scroll-triggered floating mode">
- **Trigger:** <exact mechanism — scroll position 50px, IntersectionObserver rootMargin "-30% 0px", click on .tab-button, hover>
- **State A (before):** maxWidth: 100vw, boxShadow: none, borderRadius: 0
- **State B (after):** maxWidth: 1200px, boxShadow: 0 4px 20px rgba(0,0,0,0.1), borderRadius: 16px
- **Transition:** transition: all 0.3s ease
- **Implementation approach:** <CSS transition + scroll listener | IntersectionObserver | CSS animation-timeline | etc.>

### Hover states
- **<Element>:** <property>: <before> → <after>, transition: <value>

## Per-State Content (if applicable)

### State: "Featured"
- Title: "..."
- Subtitle: "..."
- Cards: [{ title, description, image, link }, ...]

### State: "Productivity"
- Title: "..."
- Cards: [...]

## Assets
- Background image: `public/images/<file>.webp`
- Overlay image: `public/images/<file>.png`
- Icons used: <ArrowIcon>, <SearchIcon> from icons.tsx

## Text Content (verbatim)
<All text content, copy-pasted from the live site>

## Responsive Behavior
- **Desktop (1440px):** <layout description>
- **Tablet (768px):** <what changes — e.g., "maintains 2-column, gap reduces to 16px">
- **Mobile (390px):** <what changes — e.g., "stacks to single column, images full-width">
- **Breakpoint:** layout switches at ~<N>px
```

Fill every section. If a section doesn't apply (e.g., no states for a static footer), write "N/A" — but think twice before marking States & Behaviors as N/A. Even a footer might have hover states on links.

### Step 3: Dispatch Builders

**★ worktree 격리 표준 (2026-06-29 ② — 헬퍼로 통일):** 빌더를 병렬로 띄울 땐 섹션마다 격리 worktree를 **헬퍼로** 만든다(에이전트마다 제각각 `git worktree add` 하지 않게):
```bash
bash scripts/section-worktree.sh add <section>      # ../wt-<section> + 브랜치 sec/<section> 생성
# … 빌더가 그 worktree 안에서만 작업 → npx tsc --noEmit 통과 …
bash scripts/section-worktree.sh merge <section>    # 병합 + worktree/브랜치 정리 (충돌 시 exit 2 → 오케스트레이터 해소)
```
- **규칙**: 섹션 ≥2개를 병렬로 만들 때는 worktree 격리 **필수**. 섹션 1개뿐이면 격리 없이 단일 빌드 허용.
- 빌더는 자기 worktree 경로 안에서만 파일을 만지고, 끝나면 `npx tsc --noEmit` 통과 후 종료. 통합은 오케스트레이터가 `merge`로 순차 수행.

Based on complexity, dispatch builder agent(s) in worktree(s):

**Simple section** (1-2 sub-components): One builder agent gets the entire section.

**Complex section** (3+ distinct sub-components): Break it up. One agent per sub-component, plus one agent for the section wrapper that imports them. Sub-component builders go first since the wrapper depends on them.

**What every builder agent receives:**
- The full contents of its component spec file (inline in the prompt — don't say "go read the spec file")
- Path to the section screenshot in `docs/design-references/`
- Which shared components to import (`icons.tsx`, `cn()`, shadcn primitives)
- The target file path (e.g., `src/components/HeroSection.tsx`)
- Instruction to verify with `npx tsc --noEmit` before finishing
- For responsive behavior: the specific breakpoint values and what changes

**Don't wait.** As soon as you've dispatched the builder(s) for one section, move to extracting the next section. Builders work in parallel in their worktrees while you continue extraction.

### Step 4: Merge

As builder agents complete their work:
- `bash scripts/section-worktree.sh merge <section>` 로 각 worktree 브랜치를 통합(헬퍼가 병합+정리)
- You have full context on what each agent built, so resolve any conflicts intelligently (충돌 시 헬퍼는 exit 2 — 해소 후 `git merge --continue`)
- After each merge, verify the build still passes: `npm run build`
- If a merge introduces type errors, fix them immediately
- 전부 통합되면 `bash scripts/section-worktree.sh cleanup` 으로 잔여 worktree 정리

The extract → spec → dispatch → merge cycle continues until all sections are built.

## Phase 4: Page Assembly

After all sections are built and merged, wire everything together in `src/app/page.tsx`:

- Import all section components
- Implement the page-level layout from your topology doc (scroll containers, column structures, sticky positioning, z-index layering)
- Connect real content to component props
- Implement page-level behaviors: scroll snap, scroll-driven animations, dark-to-light transitions, intersection observers, smooth scroll (Lenis etc.)
- Verify: `npm run build` passes clean

## Phase 5: Visual QA Diff

After assembly, do NOT declare the clone complete.

**★ side-by-side 자동 합성 + AI 판정 먼저 (필수, 2026-06-29 ③):** 눈대중 스샷 대신 **스크립트로 3뷰포트 합성**하고 판정한다:
```bash
# 클론 dev 서버를 먼저 띄운다: npm run dev (예: http://localhost:3000)
node scripts/visual-diff.mjs <원본URL> <클론URL>
# → docs/research/visual-diff/compare-{1440,768,390}.png  (좌 원본 | 우 클론 합성)
# → docs/research/visual-diff/report.md
```
- **자동 점검 2-모드**: `ANTHROPIC_API_KEY`가 있으면 Claude Haiku가 닮음%·P1/P2를 자동 플래그(cost.json 적재). 없으면(=오케스트레이터 컨텍스트) → **너(오케스트레이터 Claude)가 `compare-*.png` 3장을 `Read`로 직접 보고** report.md 체크리스트(누락 섹션·깨진 레이아웃·회전사진·라벨불일치·저대비 nav)를 P1/P2로 판정한다.
- **★divergence 모드(variation.config.json 존재) 예외**: 이때 visual-diff는 **콘텐츠·섹션 존재/누락·정보 완전성만** 비교한다. **색/폰트/히어로 아키타입/톤이 원본과 다른 것은 P1/P2 결함이 아니라 의도된 차별화 → 무시(원본 쪽으로 되돌리지 말 것).** "닮음%"는 divergence에선 오히려 낮아야 정상. 시각 품질은 원본 대조가 아니라 **Phase 5.5 디자인 검수**로 판정한다.
- **P1(누락·깨짐)은 spec 재추출/수정 후 visual-diff 재실행.** 이 합성·판정은 세 진입점(clone-website/clone-site/build-site) 모두 동일하게 거친다.

그런 다음 섹션별 정밀 대조:

1. compare-*.png(또는 동일 뷰포트 스샷)로 원본과 클론을 나란히 본다
2. Compare section by section, top to bottom, at desktop (1440px)
3. Compare again at mobile (390px)
4. For each discrepancy found:
   - Check the component spec file — was the value extracted correctly?
   - If the spec was wrong: re-extract from browser MCP, update the spec, fix the component
   - If the spec was right but the builder got it wrong: fix the component to match the spec
5. Test all interactive behaviors: scroll through the page, click every button/tab, hover over interactive elements
6. Verify smooth scroll feels right, header transitions work, tab switching works, animations play

> ⚠️ Screenshots prove layout, **not function**. A dead button looks identical to a working one. Manual clicking here is a first pass — the machine-checked gate is **Phase 7** (interaction audit). Do not declare done on visual QA alone.

Only after this visual QA pass do you proceed to Phase 5.5 (divergence design review), Phase 6 (animation), and Phase 7 (interaction).

## Phase 5.5: Divergence Design Review (차별화 디자인 검수 게이트 — 2026-07-14 kk 지시)

> **왜**: Phase 1.5 차별화(히어로 아키타입 교체·톤·폰트, 그리고 향후 섹션 시각순서 재배열)가 조립을 흔들면 **위계·여백 리듬·섹션 전환 흐름·모바일 가독성**이 어긋날 수 있다. "차별화가 곧 품질저하"가 되지 않도록, 차별화 산출 직후 **두 전문 렌즈로 자동 검수**한다.
>
> **언제**: **divergence 모드(variation.config.json 존재)면 필수** — 히어로/톤/폰트가 바뀌므로 REVRUN 경로에선 항상 이 게이트를 통과해야 완료. 섹션 순서 재배열이 도입되면 더욱 필수. (순수 픽셀복제 모드였으면 스킵.)

### 검수 (2 렌즈 병렬 — 서브에이전트)
Phase 5 `visual-diff.mjs`가 만든 3뷰포트 `docs/research/visual-diff/compare-*.png`(또는 클론 단독 스샷 1440/768/390 + 홈·대표 서브페이지)를 아래 두 렌즈에 전달:

1. **`design-master`** (legendary-designer 시선 — Rams·Vignelli·Müller-Brockmann): 시각 위계·여백 리듬·**섹션 전환 흐름이 서사적으로 말이 되는가**(재배열이 어색하지 않은가)·모바일 가독성·CTA 위치·hero 배경 대비(흰 글자 묻힘). P0/P1/P2.
2. **`ui-ux-pro-max`**: 레이아웃·타이포·간격 스케일·색 시스템·상태·접근성. 차별화로 **깨진 간격 스케일·폰트페어 부조화·팔레트 대비(WCAG AA) 미달**을 P0/P1.

### 판정·클로징
- **P0(위계 붕괴·섹션 흐름 어색·모바일 잘림·대비 미달) = GATE BLOCK** → 브리프 값 조정으로 수정 후 재검:
  - 히어로 아키타입이 이 콘텐츠에 안 맞으면 → `variation.config.json`의 `heroArchetype`를 다른 아키타입으로(수동 오버라이드) 재적용.
  - 섹션 재배열이 흐름을 깨면 → 그 구간만 원본 순서로 롤백.
  - 팔레트 대비 미달 → `--primary`/전경색 대비 보정(브랜드색은 유지하되 명도 조정).
- **P1**은 기록 후 진행 허용. `docs/research/divergence-design-review.md`에 두 렌즈 결과 저장.
- 기존 `qa-site`의 `design_eye`(build-site 인수검수 최종관문)와 **이중이지만 시점이 다름**: 여기는 **클론 단계 조기 관문**(문제를 초기에 잡아 인수검수까지 안 끌고 감).

## Phase 6: Animation Audit (mandatory after Phase 5)

Visual QA catches static differences. **Phase 6 catches the moving parts** — marquees, image comparison sliders, infinite loops, hover transitions, scroll-driven progress bars. These are invisible in screenshots and easily missed by both extraction and visual QA.

### When to run
- After Phase 5 visual QA when the static layout matches.
- After any major animation change to verify nothing regressed.
- Before declaring the clone "done".

### Tooling: `scripts/animation-audit.mjs`

The template includes a self-contained Playwright script that crawls both sites, extracts every CSS animation/keyframe/transition/marquee, and produces a diff report with auto-prioritized P1/P2/P3.

```bash
node scripts/animation-audit.mjs <원본URL> <클론URL>
# 예: node scripts/animation-audit.mjs https://xn--9w3ba16pf1i.com/ https://hanoi.revrun.kr/
```

Outputs to `docs/research/animation-audit/`:
- `original.json` — every animated element + keyframe metadata from the original
- `clone.json` — same for the clone
- `diff.md` — human-readable diff with priorities

### What the audit catches (common patterns)

| Pattern | Original CSS marker | Why it's easy to miss |
|---|---|---|
| **Horizontal marquee bar** (gold band, ticker, brand strip) | `.marquee.solo` / `flowAni 48s infinite` | Looks empty in static screenshot — only motion reveals it |
| **Image comparison slider** (before/after, competitor vs ours) | 2× `<img>` absolute at top:0 left:0, same size, `transition: Ns` | Both images look identical; need mouse drag to expose |
| **Bouncing arrow / pulse ring** | `keyframes bound` / `circle 2s infinite` | Tiny element, easy to miss visually |
| **Infinite rotation** (logo, food, badge) | `keyframes rotate 30s linear infinite` | Slow rotation almost invisible in 1s snapshot |
| **Scroll-driven graph bar grow** | `transition: 0.6s; transform: scaleY()` triggered on intersection | Need to scroll past then back to see |
| **Hover overlay panels** (sns_slide hover, card flip) | `.group .child:hover { opacity: 1 }` | Static screenshot shows only resting state |
| **Vertical/dual marquees** (side decoration) | `flowAniVertical` / `flowAniReverse` | Often opacity 0.2-0.3 so easy to dismiss as background |

### Interpreting the diff

The audit auto-assigns priorities:
- **🔴 P1** — image-slider missing OR ≥2 marquees missing (high visual impact)
- **🟠 P2** — fast infinite animations (<5s) missing (energy/feel)
- **🟡 P3** — slow / non-infinite missing (polish)

For each P1/P2 item, the diff lists the exact original `top` position so you can scroll there in the live original site to inspect.

### Manual cross-check (when audit is unsure)

Open both sites in two tabs. In each console, run:
```javascript
copy(JSON.stringify({
  url: location.href,
  animations: document.getAnimations().map(a => ({
    target: a.effect?.target?.tagName + '.' + (a.effect?.target?.className?.toString().slice(0,40) || ''),
    duration: a.effect?.getTiming?.().duration,
    easing: a.effect?.getTiming?.().easing,
    delay: a.effect?.getTiming?.().delay,
    iterations: a.effect?.getTiming?.().iterations,
    keyframes: a.effect?.getKeyframes?.(),
  })),
  transitions: [...document.querySelectorAll('*')].flatMap(el => {
    const cs = getComputedStyle(el);
    if (!cs.transitionProperty || cs.transitionDuration === '0s') return [];
    return [{ tag: el.tagName, class: el.className?.toString().slice(0,40), property: cs.transitionProperty, duration: cs.transitionDuration, timing: cs.transitionTimingFunction }];
  }).slice(0, 100),
}, null, 2));
```
Paste both outputs into the conversation — the diff between two JSONs gives exact timing/easing/keyframe values, more precise than visual inspection.

### Closing the loop

For every P1/P2 item in `diff.md`:
1. Identify the section it belongs to (use the original `top` coord).
2. Add a keyframe to `globals.css` (or pick existing).
3. Apply it to the matching element in the clone.
4. Re-run the audit to verify the diff shrinks.

When `diff.md` shows zero P1/P2 items, the animation layer is complete. **Do not stop here — run Phase 7.**

## Phase 7: Interaction & Mobile Functionality Audit (mandatory after Phase 6)

Phase 5 (visual) and Phase 6 (animation) both verify what the page **looks like**. Neither verifies that buttons actually **do** something. A dead `<button>` with no `onClick`, or a mobile hamburger that opens nothing, is pixel-identical to a working one in every screenshot — so it sails through Phases 5–6. This is exactly how a non-functional mobile menu shipped to production on a past clone.

**The #1 silent failure: the mobile hamburger.** Templates often render the desktop nav as `hidden lg:flex` and leave a hamburger `<button>` with no handler. On a 390px phone the result is a header with a logo and a dead icon — navigation is completely impossible — yet it looks perfect in screenshots.

### When to run
- After Phase 6, before declaring the clone done.
- After any change to `Header`, nav, menus, modals, tabs, or buttons.

### Tooling: `scripts/interaction-audit.mjs`

Self-contained Playwright script. At mobile (390px) **and** desktop (1280px) it clicks every interactive element and measures the reaction (DOM mutations, scroll, URL/hash, `aria-expanded`, overlay open-count), then runs a **mobile-nav-reachability gate**.

```bash
node scripts/interaction-audit.mjs <클론URL> [원본URL]
# 예: node scripts/interaction-audit.mjs https://almecsland.vercel.app/ http://almecsland.com/
```

Outputs to `docs/research/interaction-audit/`:
- `clone.json` — per-element click reaction (both viewports) + nav-gate result
- `original.json` — (optional) original's mobile-nav reachability for parity
- `report.md` — auto-prioritized P1/P2/P3

### What it catches

| Priority | Finding | Why it matters |
|---|---|---|
| 🔴 **P1** | Mobile nav unreachable — nav links hidden AND (no hamburger/menu toggle, OR toggle click reveals no nav) | Site is unnavigable on phones. **The dead-hamburger bug.** |
| 🟠 **P2** | Dead button — `<button>`/`role=button` whose click produces zero observable change | Looks interactive, does nothing |
| 🟠 **P2** | JS runtime error on the page | Broken handler |
| 🟡 **P3** | `href="#"` / empty-href anchor with no effect | Placeholder link (often legit, e.g. footer 약관 stubs) |

The nav gate is ancestor-aware: it does not count links inside a closed (opacity-0 / pointer-events-none) drawer as "visible", and verifies the toggle **actually reveals** hidden nav.

### Closing the loop

For every **P1**: implement the missing behavior (e.g. a real drawer — `useState` open/close, hamburger `onClick={() => setOpen(true)}`, a slide-in panel with the NAV links, close on link-click / backdrop / Escape / X, body scroll-lock). For every **P2**: wire the handler or remove the dead control. Re-run until `report.md` shows **zero P1/P2** (the script exits non-zero while any P1 remains, so it can gate CI).

### 산출물 계약 게이트 (필수 — 2026-06-29)

마지막으로 **산출물 계약**을 자동 검증한다(세 진입점이 같은 산출물을 내도록 강제):
```bash
node scripts/lint-pipeline.mjs
# 필수 산출물(design-tokens.json·visual-diff/compare-*.png+report.md·animation diff.md·interaction report.md)
# 존재 + 기계검증 P1 0건이면 PASS(exit 0). 누락=exit 1, P1 잔존=exit 2.
```

**완료 선언 금지 규칙 (필수, 명령형):** `node scripts/lint-pipeline.mjs`가 **exit 0(PASS)이 아니면 "완료"를 선언하지 마라.** 누락(exit 1)이면 해당 스크립트를 돌리고, P1(exit 2)이면 수정 후 재검한다. A clone is only **truly done** when: Phase 5 visual-diff(① 토큰 + ③ side-by-side) 판정 완료 **AND** Phase 6 diff.md **AND** Phase 7 report.md 가 P1/P2-clean **AND** `lint-pipeline.mjs` exit 0. (정본 단계·산출물 표 = `PIPELINE.md`)

## Phase 8: SEO/GEO + Blog wiring (growth layer — do before declaring "site ready")

> **범위 경계 (2026-06-29 통일)**: Phase 8은 **`/clone-website`를 raw 단독 실행할 때만** 수행한다. db_mkt 파이프라인(`/clone-site`·`/build-site`)으로 호출되면 **이 Phase는 건너뛴다** — SEO/GEO·블로그·도메인·배포는 `/attach-growth`(SEO/blog/sites SSOT)와 `/onboard-site`(도메인·배포·active)가 정본이라 이중 소유를 피한다. 호출 컨텍스트가 db_mkt 클론 폴더(`site-cloner/clones/<name>`)이면 Phase 7에서 멈추고 "다음: /attach-growth → /onboard-site"를 안내하라.

A visually-perfect clone is not a *launch-ready* site. Before handoff, add the invisible growth layer. **None of this may change the existing visual design** — SEO is invisible; blog pages REUSE the clone's own components (PageShell/PageHero/card styles), they don't introduce a new look.

### 8a. SEO/GEO (always — zero visual change)
Add, driven by the site's real data (NAP, geo, rooms/services, nearby):
- `src/lib/seo.ts` — `SITE_URL` (env `NEXT_PUBLIC_SITE_URL` → final domain), NAP/geo constants, and JSON-LD builders. Pick the schema.org `@type` by industry: **LodgingBusiness** (숙박/캠핑/펜션/글램핑), **LocalBusiness** (시공/생활서비스), etc. Include address, geo, telephone, priceRange, image, and offers/amenities when available.
- `src/app/sitemap.ts` (+ blog URLs if 8b), `src/app/robots.ts` (allow general crawlers **and** AI/answer engines: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended).
- `src/app/layout.tsx` — `metadataBase`, `openGraph`, `twitter`, canonical `alternates`, and inject the JSON-LD `<script type="application/ld+json">`. Per-page `generateMetadata` for titles/canonical.
- `src/app/.well-known/llms.txt/route.ts` — markdown brief for generative engines (intro, location, rooms/services, contact, site structure). Industry-aware (lodging adds checkin/checkout/nearby).
- OG image (static `/images/hero.jpg` as `openGraph.images`, or a dynamic `next/og` route).

### 8b. Blog (opt-in per site — REVRUN `blog_posts`, design-matched)
REVRUN auto-generates SEO blog posts into the shared Supabase `blog_posts` table. To surface them in a clone **without changing its look**:
- `src/lib/blog.ts` — anon REST reader. **CRITICAL: every query MUST filter `site_id=eq.<NEXT_PUBLIC_SITE_ID>` AND `status=eq.published`** — `blog_posts` is multi-tenant; an unfiltered query leaks other sites' posts. Returns `[]` when env unset (graceful).
- `src/app/blog/page.tsx` + `src/app/blog/[slug]/page.tsx` — **reuse the clone's own `PageShell`/`PageHero`/card components** so the blog list looks like the rooms/services list and the post looks like a detail page. `blog_posts.content` is **inline-styled HTML** → render via `dangerouslySetInnerHTML` after stripping the leading `<title>` and unreplaced `{{markers}}`.
- Add a "블로그/Blog" item to NAV (header + mobile drawer) and `/blog/*` to the sitemap.
- **Connect data**: register the site in REVRUN (admin: `sites` with `status='active'`, `plan_tier` in {blog, full} (NOT landing), `link-camfit` if applicable, `site_plans`+keywords) so the auto-gen cron targets it; then set the clone's `NEXT_PUBLIC_SITE_ID` env. Requires admin/service-role — flag for the operator if unavailable.
- **Blog is opt-in.** If a site shouldn't have a blog, omit 8b entirely (no `/blog` route, no NAV item, no sitemap blog entries).

### 8c. Footer attribution
Add a subtle `powered by revrun` link in the footer (muted, right-aligned next to copyright) — must not disturb the existing footer design.

### 8d. Domain
Map the final `*.revrun.kr` subdomain (or custom domain) to the project. `*.revrun.kr` subdomains live on the same Vercel team as the wildcard — a specific subdomain assigned to the clone project overrides the site-template wildcard. DNS/SSL auto (wildcard CNAME → cname.vercel-dns.com). See `construction-factory/DOMAIN_CHANGE_GUIDE.md`.

### 8e. IP / copyright hygiene (sweep before handoff)
- Grep source + public for the ORIGINAL site's brand/owner/address/builder strings — remove residue (incl. code comments like "<Original> tokens", "mirrors <builder>").
- **Replace the favicon** — a favicon copied from the original is its trademark. Generate a neutral/brand favicon.
- Use the new business's own assets; don't ship the original's images/logo. Scraped recon JSON under `docs/research/<original>/` is internal (not deployed) but holds the original's content — note it.
- The cloned layout itself mirrors the original's template; when it's a common commercial builder template (e.g. einet), risk is lower, but flag design-copy to the operator honestly.

## Pre-Dispatch Checklist

Before dispatching ANY builder agent, verify you can check every box. If you can't, go back and extract more.

- [ ] Spec file written to `docs/research/components/<name>.spec.md` with ALL sections filled
- [ ] Every CSS value in the spec is from `getComputedStyle()`, not estimated
- [ ] Interaction model is identified and documented (static / click / scroll / time)
- [ ] For stateful components: every state's content and styles are captured
- [ ] For scroll-driven components: trigger threshold, before/after styles, and transition are recorded
- [ ] For hover states: before/after values and transition timing are recorded
- [ ] All images in the section are identified (including overlays and layered compositions)
- [ ] Responsive behavior is documented for at least desktop and mobile
- [ ] Text content is verbatim from the site, not paraphrased
- [ ] The builder prompt is under ~150 lines of spec; if over, the section needs to be split

## What NOT to Do

These are lessons from previous failed clones — each one cost hours of rework:

- **Don't clone only the landing page of a multi-page site.** Enumerate the site map FIRST (Phase 1). If the original has `about.html`, `rooms.html`, `room.html?id=N`, `reserve.html`, etc., build the matching routes (`/about`, `/rooms`, `/rooms/[id]`, `/reserve`). Collapsing 8 pages into one anchor-scroll page is a structural infidelity, not a simplification.
- **Don't build click-based tabs when the original is scroll-driven (or vice versa).** Determine the interaction model FIRST by scrolling before clicking. This is the #1 most expensive mistake — it requires a complete rewrite, not a CSS fix.
- **Don't extract only the default state.** If there are tabs showing "Featured" on load, click Productivity, Creative, Lifestyle and extract each one's cards/content. If the header changes on scroll, capture styles at position 0 AND position 100+.
- **Don't miss overlay/layered images.** A background watercolor + foreground UI mockup = 2 images. Check every container's DOM tree for multiple `<img>` elements and positioned overlays.
- **Don't build mockup components for content that's actually videos/animations.** Check if a section uses `<video>`, Lottie, or canvas before building elaborate HTML mockups of what the video shows.
- **Don't approximate CSS classes.** "It looks like `text-lg`" is wrong if the computed value is `18px` and `text-lg` is `18px/28px` but the actual line-height is `24px`. Extract exact values.
- **Don't build everything in one monolithic commit.** The whole point of this pipeline is incremental progress with verified builds at each step.
- **Don't reference docs from builder prompts.** Each builder gets the CSS spec inline in its prompt — never "see DESIGN_TOKENS.md for colors." The builder should have zero need to read external docs.
- **Don't skip asset extraction.** Without real images, videos, and fonts, the clone will always look fake regardless of how perfect the CSS is.
- **Don't give a builder agent too much scope.** If you're writing a builder prompt and it's getting long because the section is complex, that's a signal to break it into smaller tasks.
- **Don't bundle unrelated sections into one agent.** A CTA section and a footer are different components with different designs — don't hand them both to one agent and hope for the best.
- **Don't skip responsive extraction.** If you only inspect at desktop width, the clone will break at tablet and mobile. Test at 1440, 768, and 390 during extraction.
- **Don't forget smooth scroll libraries.** Check for Lenis (`.lenis` class), Locomotive Scroll, or similar. Default browser scrolling feels noticeably different and the user will spot it immediately.
- **Don't dispatch builders without a spec file.** The spec file forces exhaustive extraction and creates an auditable artifact. Skipping it means the builder gets whatever you can fit in a prompt from memory.

## Completion

When done, report:
- Total sections built
- Total components created
- Total spec files written (should match components)
- Total assets downloaded (images, videos, SVGs, fonts)
- Build status (`npm run build` result)
- Visual QA results (any remaining discrepancies)
- Any known gaps or limitations
