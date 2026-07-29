"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroProps } from "@/types/hero";

/**
 * 아키타입: carousel — 다중 배경 크로스페이드 + 분수 페이지네이션 + 좌우 화살표.
 * 참고 계보: seaofstar HeroCarousel. hover 색은 shadcn --primary(자급).
 */
export function HeroCarousel({
  slides,
  eyebrow,
  title,
  subtitle,
  scrollCue,
  scrollHref = "#main",
}: HeroProps) {
  const [idx, setIdx] = useState(0);
  const total = Math.max(slides.length, 1);

  const go = useCallback(
    (n: number) => setIdx((p) => (p + n + total) % total),
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    // 전정기관 민감 사용자: 자동전환 비활성(WCAG 2.2.2·prefers-reduced-motion)
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = setInterval(() => setIdx((p) => (p + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  const pad = (n: number) => ("0" + n).slice(-2);

  return (
    <section className="relative isolate h-[100svh] min-h-[600px] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== idx}
          className={`hero-media absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url('${slide.src}')` }}
        />
      ))}
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
        {eyebrow ? (
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/85">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-heading text-5xl tracking-wide md:text-7xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-base tracking-[0.2em] text-white/90">
            {subtitle}
          </p>
        ) : null}
      </div>

      {scrollCue ? (
        <a
          href={scrollHref}
          aria-label="아래로 스크롤"
          className="hero-arrow absolute bottom-8 left-1/2 -translate-x-1/2 text-white"
        >
          <span className="block h-10 w-px bg-white/70" />
        </a>
      ) : null}

      {total > 1 ? (
        <>
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 font-heading text-white md:flex">
            <span className="text-2xl">{pad(idx + 1)}</span>
            <span className="h-10 w-px bg-white/50" />
            <span className="text-sm text-white/70">{pad(total)}</span>
          </div>

          <div className="absolute bottom-8 right-6 flex gap-3">
            <button
              aria-label="이전 슬라이드"
              onClick={() => go(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 text-white transition-colors hover:bg-white hover:text-[var(--primary)]"
            >
              ‹
            </button>
            <button
              aria-label="다음 슬라이드"
              onClick={() => go(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 text-white transition-colors hover:bg-white hover:text-[var(--primary)]"
            >
              ›
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
