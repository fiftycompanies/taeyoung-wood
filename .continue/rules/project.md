<!-- AUTO-GENERATED from AGENTS.md — do not edit directly.
     Run `bash scripts/sync-agent-rules.sh` to regenerate. -->

---
description: Project conventions for AI Website Clone Template
alwaysApply: true
---
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles (REVRUN 이원화 — 2026-07-14)
- **Content & information architecture: faithful 1:1** — routes, info slots, verbatim text, and real photos match the source exactly.
- **Visual expression: REVRUN-own (Phase 1.5 Divergence)** — hero archetype, tone (colors/shadow), and typography are re-composed per `variation.config.json`, NOT copied from the source. This removes the "1:1 reskin" impression (copyright hygiene). Pixel-perfect emulation applies ONLY when fidelity=pixel-perfect is explicitly requested (external/raw clone).
- **Real content** — use actual text and assets from the target site, not placeholders.
- **Beauty-first** — every pixel matters; divergence must pass Phase 5.5 design review (design-master · ui-ux-pro-max).

## Project Structure
```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target site
  videos/           # Downloaded videos from target site
  seo/              # Favicons, OG images, webmanifest
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
```

## 정본 파이프라인 = PIPELINE.md (SSOT, 2026-06-29)
단계·스크립트·필수 산출물의 단일 정본은 **`PIPELINE.md`** 다. 결정론 스크립트(`scripts/`):
- `extract-tokens.mjs` (Phase 1/2 ①) — 색·폰트·간격 getComputedStyle 실측 → `design-tokens.json/.css`
- `section-worktree.sh` (Phase 3 ②) — 섹션 빌더 worktree `add`/`merge` 격리
- `visual-diff.mjs` (Phase 5 ③) — 원본↔클론 side-by-side 합성 + (Haiku 또는 오케스트레이터 Read) 판정
- `animation-audit.mjs` (Phase 6) · `interaction-audit.mjs` (Phase 7) · `smoke.mjs`(배포 후)
- `lint-pipeline.mjs` — **산출물 계약 게이트**(완료 선언 전 PASS 필수)

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, ALWAYS have each teammate work in their own worktree branch and merge everyone's work at the end, resolving any merge conflicts smartly since you are basically serving the orchestrator role and have full context to our goals, work given, work achieved, and desired outcomes. **worktree 생성·병합은 `bash scripts/section-worktree.sh add|merge <section>` 헬퍼로 통일**(제각각 만들지 말 것).
- After editing `AGENTS.md`, run `bash scripts/sync-agent-rules.sh` to regenerate platform-specific instruction files.
- After editing `.claude/skills/clone-website/SKILL.md`, run `node scripts/sync-skills.mjs` to regenerate the skill for all platforms.

## Animation Audit (Phase 6 of /clone-website)

After visual QA, run an animation diff to catch moving parts that static screenshots miss (marquees, image comparison sliders, infinite rotations, hover overlays):

```bash
# Playwright-based auto-comparison → docs/research/animation-audit/diff.md
node scripts/animation-audit.mjs <originalUrl> <cloneUrl>
```

See `docs/research/INSPECTION_GUIDE.md` § Phase 6 Animation Patterns for the catalog (gold marquee bars, before/after sliders, bouncing arrows, scroll-driven graph bars, hover panels, etc.).

## Interaction & Mobile Functionality Audit (Phase 7 of /clone-website)

After the animation audit, verify interactive elements actually **work** — screenshots can't catch a dead button or a mobile hamburger that opens nothing (the #1 silent clone failure):

```bash
# Playwright clicks every button/link at 390px + 1280px, runs a mobile-nav-reachability gate
# → docs/research/interaction-audit/report.md  (P1 dead-nav / P2 dead-button / P3 placeholder)
node scripts/interaction-audit.mjs <cloneUrl> [originalUrl]
```

The clone is **truly done** only when BOTH `animation-audit/diff.md` (Phase 6) AND `interaction-audit/report.md` (Phase 7) are P1/P2-clean. The interaction script exits non-zero while any P1 remains, so it can gate CI.

# Website Inspection Guide

## How to Reverse-Engineer Any Website

This guide outlines what to capture when inspecting a target website via Chrome MCP or browser DevTools.

## Phase 1: Visual Audit

### Screenshots to Capture
- [ ] Every distinct page — desktop, tablet, mobile
- [ ] Dark mode variants (if applicable)
- [ ] Light mode variants (if applicable)
- [ ] Key interaction states (hover, active, open menus, modals)
- [ ] Loading/skeleton states
- [ ] Empty states
- [ ] Error states

### Design Tokens to Extract
- [ ] **Colors** — background, text (primary/secondary/muted), accent, border, hover, error, success, warning
- [ ] **Typography** — font family, sizes (h1-h6, body, caption, label), weights, line heights, letter spacing
- [ ] **Spacing** — padding/margin patterns (look for a scale: 4px, 8px, 12px, 16px, 24px, 32px, etc.)
- [ ] **Border radius** — buttons, cards, avatars, inputs
- [ ] **Shadows/elevation** — card shadows, dropdown shadows, modal overlay
- [ ] **Breakpoints** — when does the layout shift? (inspect with DevTools responsive mode)
- [ ] **Icons** — which icon library? custom SVGs? sizes?
- [ ] **Avatars** — sizes, shapes, fallback behavior
- [ ] **Buttons** — all variants (primary, secondary, ghost, icon-only, danger)
- [ ] **Inputs** — text fields, textareas, selects, checkboxes, toggles

## Phase 2: Component Inventory

For each distinct UI component, document:
1. **Name** — what would you call this component?
2. **Structure** — what HTML elements / child components does it contain?
3. **Variants** — does it have different sizes, colors, or states?
4. **States** — default, hover, active, disabled, loading, error, empty
5. **Responsive behavior** — how does it change at different breakpoints?
6. **Interactions** — click, hover, focus, keyboard navigation
7. **Animations** — transitions, entrance/exit animations, micro-interactions

### Common Components to Look For
- Navigation (top bar, sidebar, bottom bar)
- Cards / list items
- Buttons and links
- Forms and inputs
- Modals and dialogs
- Dropdowns and menus
- Tabs and segmented controls
- Avatars and user badges
- Loading skeletons
- Toast notifications
- Tooltips and popovers

## Phase 3: Layout Architecture

- [ ] **Grid system** — CSS Grid? Flexbox? Fixed widths?
- [ ] **Column layout** — how many columns at each breakpoint?
- [ ] **Max-width** — main content area max-width
- [ ] **Sticky elements** — header, sidebar, floating buttons
- [ ] **Z-index layers** — navigation, modals, tooltips, overlays
- [ ] **Scroll behavior** — infinite scroll, pagination, virtual scrolling

## Phase 4: Technical Stack Analysis

- [ ] **Framework** — React? Vue? Angular? Check `__NEXT_DATA__`, `__NUXT__`, `ng-version`
- [ ] **CSS approach** — Tailwind (utility classes), CSS Modules, Styled Components, Emotion, vanilla CSS
- [ ] **State management** — Redux (check DevTools), React Query, Zustand, Pinia
- [ ] **API patterns** — REST, GraphQL (check network tab for `/graphql` requests)
- [ ] **Font loading** — Google Fonts, self-hosted, system fonts
- [ ] **Image strategy** — CDN, lazy loading, srcset, WebP/AVIF
- [ ] **Animation library** — Framer Motion, GSAP, CSS transitions only

## Phase 5: Documentation Output

After inspection, create these files in `docs/research/`:
1. `DESIGN_TOKENS.md` — All extracted colors, typography, spacing
2. `COMPONENT_INVENTORY.md` — Every component with structure notes
3. `LAYOUT_ARCHITECTURE.md` — Page layouts, grid system, responsive behavior
4. `INTERACTION_PATTERNS.md` — Animations, transitions, hover states
5. `TECH_STACK_ANALYSIS.md` — What the site uses and our chosen equivalents

## Phase 6: Animation Patterns Catalog (run audit after Phase 5)

Static screenshots and naive CSS extraction will miss these. Walk through the list against the original site **after** the static clone matches.

### High-impact patterns (P1 — almost always present, easy to miss)

- **Horizontal marquee/ticker bar** — gold/dark band right after hero, ~70-100px tall, infinite horizontal flow of brand text, slogans, or product names. Usually `.marquee` or `flow-ani-wrap` + 48s linear loop.
- **Image comparison slider (before/after, competitor vs us)** — two `<img>` absolutely positioned at the same coords, one with `clip-path` or sibling `transform: translateX()` driven by mouse position. Center handle with bouncing arrows.
- **Dual marquees (top + bottom)** — same as horizontal but stacked at section top/bottom, often as decorative band behind hero copy.

### Medium-impact patterns (P2 — energy/feel)

- **Infinite rotation** on logos, badges, food/product circles. Usually `rotate 30s linear infinite`.
- **Pulse rings / circle wave** around CTA buttons or count-up pills. Concentric `scale(1) → scale(1.8)` with opacity fade, 2s infinite, staggered delays.
- **Bouncing arrows** (`bound`, `bounceArrowH`) — center indicator between comparison cards. 2s ease-in-out infinite.
- **Star blink / sparkle decorations** — 1-1.6s ease-in-out infinite opacity + scale.
- **Vertical side marquees** — left/right edge text strips, often opacity 0.2-0.3.

### Scroll-driven patterns (P2 — easy to forget the trigger)

- **Graph bar grow** — `transform-origin: bottom; scaleY(0 → 1)` triggered by IntersectionObserver. 0.6-1.2s.
- **Highlight bar reveal** — red/colored background expanding behind emphasized phrase (`scaleX(0 → 1)`).
- **Sticky / shrinking header** — navbar reduces height + gains shadow past scroll threshold.

### Interactive patterns (P3 — hover/click)

- **`group hover` reveal panels** — review/card hover shows colored overlay with extra metadata.
- **Tab pill switching** with sliding underline (`width: 0 → 100%`).
- **Smooth-scroll nav with active section underline** that animates as section enters viewport.

### Library tells

When the original ships these libraries, you can predict the pattern:
- **Swiper** present → at least one carousel + likely a `.marquee` Swiper instance with `freeMode: true, autoplay.delay: 0` (= horizontal infinite ticker)
- **GSAP + ScrollTrigger** → scroll-driven pinning, parallax, progress bars
- **AOS** → fade-up + highlight expansion on enter-viewport (`data-aos="highlight"`)
- **Lenis / Locomotive** → momentum-scroll smoothing (subtle but users notice)

### Auto-audit command

```bash
node scripts/animation-audit.mjs <originalUrl> <cloneUrl>
# → docs/research/animation-audit/diff.md (auto-prioritized P1/P2/P3)
```

### Manual cross-check (when audit is unsure)

Paste this into both browser consoles, copy the output, and feed both JSONs to the assembler agent for diff:
```javascript
copy(JSON.stringify({
  animations: document.getAnimations().map(a => ({
    target: a.effect?.target?.tagName + '.' + (a.effect?.target?.className?.toString().slice(0,40) || ''),
    duration: a.effect?.getTiming?.().duration,
    easing: a.effect?.getTiming?.().easing,
    iterations: a.effect?.getTiming?.().iterations,
    keyframes: a.effect?.getKeyframes?.(),
  })),
}, null, 2));
```

The diff between two `document.getAnimations()` JSON snapshots gives exact duration/easing/keyframe values — more precise than visual inspection.
