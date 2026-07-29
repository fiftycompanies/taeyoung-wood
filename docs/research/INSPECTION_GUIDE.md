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
