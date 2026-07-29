# Visual Diff Report — 원본 vs 클론

- 원본: https://ganaplumbing.revrun.kr/
- 클론: http://localhost:3000
- 뷰포트: 1440 / 768 / 390

## 나란히 비교 이미지 (Read로 판정)
- `docs/research/visual-diff/compare-1440.png` — 좌 원본 | 우 클론 (1440px)
- `docs/research/visual-diff/compare-768.png` — 좌 원본 | 우 클론 (768px)
- `docs/research/visual-diff/compare-390.png` — 좌 원본 | 우 클론 (390px)

## 👁 사람/오케스트레이터 판정 (ANTHROPIC_API_KEY 없음 — 폴백 모드)

**오케스트레이터 Claude는 위 `compare-*.png` 3장을 Read로 직접 보고** 아래를 P1/P2로 판정하라:
- [ ] 누락 섹션/카드(원본엔 있고 클론엔 없음)
- [ ] 깨진 레이아웃·겹침·오버플로(특히 390px)
- [ ] 회전/뒤집힌 사진·라벨 불일치·플레이스홀더/엑박
- [ ] nav 글자가 hero 배경에 묻힘(저대비)
- [ ] (순수 픽셀복제 모드만) 색/간격/폰트 톤 편차(원본 대비)

> ★divergence 모드(variation.config.json 존재): **색/폰트/히어로/톤이 원본과 다른 것은 의도된 차별화 → 결함 아님(무시).** 콘텐츠·섹션 존재/누락·깨짐만 P1로. 시각 품질은 Phase 5.5 디자인 검수로.

> P1(누락·깨짐)은 수정 후 재실행. 스샷만으로 '완료' 선언 금지(기능은 Phase 6/7가 검증).