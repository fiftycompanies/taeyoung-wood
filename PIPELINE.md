# PIPELINE.md — site-cloner 정본 파이프라인 (SSOT)

> **이 문서가 클론 파이프라인의 단일 정본이다.** clone-website(엔진) · clone-site · build-site · qa-site 는
> 모두 이 표를 따른다. 단계/스크립트/산출물이 문서마다 갈리지 않게 하려고 둔다(2026-06-29 통일).
> 세 진입점은 포함관계: `clone-website` ⊂ `clone-site` ⊂ `build-site`. **디자인 클론(Phase 1-7)은 세 경로 동일**해야 한다.

---

## 정본 단계 (clone-website 엔진, Phase 1-7 = 디자인 클론)

| Phase | 하는 일 | 결정론 스크립트 | 필수 산출물 |
|---|---|---|---|
| 1 Reconnaissance | 사이트맵·스크린샷·**토큰 실측**·Interaction Sweep·토폴로지 | `extract-tokens.mjs` (①) | `docs/research/design-tokens.json` · `design-tokens.css` · `PAGE_TOPOLOGY.md` |
| 2 Foundation | 폰트·색 토큰(globals.css)·타입·아이콘·에셋 | (Phase 1 토큰 산출물 사용) | `src/app/globals.css`(토큰 반영) |
| 3 Component Spec & Dispatch | 섹션별 추출→spec→**worktree 빌더 병렬**→merge | `section-worktree.sh` (②) | `docs/research/components/*.spec.md` |
| 4 Page Assembly | page.tsx 조립·페이지 동작 배선·build | — | `npm run build` 통과 |
| 5 Visual QA Diff | 원본↔클론 **side-by-side 합성 + AI 판정** | `visual-diff.mjs` (③) | `docs/research/visual-diff/compare-*.png` · `report.md` |
| 6 Animation Audit | keyframe/marquee/slider 자동 diff | `animation-audit.mjs` | `docs/research/animation-audit/diff.md` (P1/P2 clean) |
| 7 Interaction Audit | 죽은 버튼·모바일 햄버거 게이트 | `interaction-audit.mjs` | `docs/research/interaction-audit/report.md` (P1/P2 clean) |

**"디자인 클론 완료"의 정의** = Phase 5 visual-diff P1-clean **AND** Phase 6 diff.md P1/P2-clean **AND** Phase 7 report.md P1/P2-clean.
→ `node scripts/lint-pipeline.mjs` 로 산출물 계약을 자동 검증(게이트).

## Phase 8 이후 = db_mkt 성장/운영 레이어 (clone-website 단독 실행 시에만 엔진이 수행)

| 단계 | 스킬 | SSOT |
|---|---|---|
| SEO/GEO·블로그·`sites` 등록 | `/attach-growth` | ★SEO 단일 소유 = attach-growth (clone-site/build-site 경로에선 clone이 SEO 안 함) |
| 도메인 매핑·CI 배포·active 점화 | `/onboard-site` | ★배포 = git push→deploy.yml CI **로컬 `vercel --prod` 금지**(db_mkt 규칙1) |
| 라이브 9렌즈 인수검수 | `/qa-site` | 9렌즈: fidelity·text_diff·vision·a11y·interaction·button_link_full·consistency·design_eye·grounding |

## 진입점별 범위

| | clone-website | clone-site | build-site |
|---|---|---|---|
| Phase 1-7 (디자인) | ✅ | ✅(위임) | ✅(단계1) |
| Phase 8 SEO | ✅(단독시만) | ❌(attach-growth) | ❌→단계3 attach-growth |
| 실데이터 enrich | ❌ | ❌ | ✅ 단계2 |
| 도메인/배포/active | ❌ | ❌ | ✅ 단계5 onboard |
| HITL 게이트 | 0 | 0 | 4 |

## 결정론 스크립트 목록 (`scripts/`)
- `extract-tokens.mjs` — ① 색·폰트·간격 getComputedStyle 실측 → 토큰
- `section-worktree.sh` — ② 섹션 빌더 worktree 격리 add/merge
- `visual-diff.mjs` — ③ 원본↔클론 side-by-side 합성 + (Haiku 또는 오케스트레이터 Read) 판정
- `animation-audit.mjs` — Phase 6 애니메이션 diff
- `interaction-audit.mjs` — Phase 7 인터랙션/모바일 게이트
- `smoke.mjs` — 배포 후 비파괴 스모크(전환배선·SEO·백지가드)
- `lint-pipeline.mjs` — **산출물 계약 검증 게이트**(위 필수 산출물 존재+P1clean+**폰트 정합**: 측정 `page.bodyFont`가 클론 `--font-sans`에 없으면 드리프트 경고 — 2026-07-01 탕감 사고 방지)
