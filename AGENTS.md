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

@docs/research/INSPECTION_GUIDE.md
