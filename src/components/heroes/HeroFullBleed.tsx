import type { HeroProps } from "@/types/hero";

/**
 * 아키타입: fullbleed — 단일 배경 이미지 + Ken-Burns 줌 + 중앙 카피.
 * 참고 계보: almecsland Hero. 자급 CSS(.hero-ken/.hero-arrow) 사용, 외부 토큰 의존 없음.
 *
 * ★ 배경은 CSS background-image로 렌더(next/image 아님) — 로컬/원격 URL 모두 안전,
 *   빈 src여도 크래시 없음(carousel/split와 동일 계약). LCP는 첫 이미지 preload로 보완.
 */
export function HeroFullBleed({
  slides,
  eyebrow,
  title,
  subtitle,
  scrollCue,
  scrollHref = "#main",
}: HeroProps) {
  const bg = slides.find((s) => s.src)?.src;
  return (
    <section
      id="hero"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-neutral-900"
    >
      {bg ? (
        <>
          {/* 첫 히어로 이미지 LCP preload */}
          <link rel="preload" as="image" href={bg} />
          <div
            className="hero-media hero-ken absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${bg}')` }}
          />
        </>
      ) : null}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        {eyebrow ? (
          <p className="mb-4 text-[15px] font-light tracking-wide opacity-90 sm:text-base">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-[28px] font-medium leading-tight sm:text-[40px] lg:text-[52px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {scrollCue ? (
        <a
          href={scrollHref}
          className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white"
          aria-label="아래로 스크롤"
        >
          <span className="text-[11px] uppercase tracking-[0.2em] opacity-80">
            {scrollCue}
          </span>
          <span className="hero-arrow text-lg">↓</span>
        </a>
      ) : null}
    </section>
  );
}
