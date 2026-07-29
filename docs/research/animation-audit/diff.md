# Animation Audit Diff Report

## 🟥 누락된 keyframe (원본만, 1건)

- **gpPulse** — 2s, iter=infinite, on `SPAN.gp-hero-pulse` (top=167px)

## 🟩 클론에만 있는 keyframe (2건)

- **hero-ken** — 6s on `DIV.hero-media.hero-ken`
- **gp-pulse** — 1.6s on `SPAN.gp-hero-pulse`

## 📜 마키 / flow-ani 비교

- 원본: 0개
- 클론: 0개

## 🎚 Image Comparison Slider 가능성

- 원본 absolute 겹친 이미지: 0개
- 클론: 0개

## 📚 라이브러리 사용 비교

| 라이브러리 | 원본 | 클론 |
|---|---|---|
| gsap | false | false |
| scrollTrigger | false | false |
| swiper | false | false |
| aos | false | false |
| aosCount | 0 | 0 |

## 🎯 우선순위 제안 (자동)

### 🟠 P2
- gpPulse (2s infinite, SPAN.gp-hero-pulse)
