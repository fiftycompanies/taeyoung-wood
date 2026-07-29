"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroProps } from "@/types/hero";

const DURATION_MS = 3000;

/**
 * 아키타입: split — 다중 배경 크로스페이드 + 좌하단 카피 블록 + 진행바 + 불릿.
 * 참고 계보: punggyeong HeroSlider. 슬라이드/카피 하드코딩 제거, props로 주입.
 */
export function HeroSplit({ slides, title, subtitle, body }: HeroProps) {
  const list = slides.length ? slides : [{ src: "" }];
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (list.length <= 1) return;
    // 전정기관 민감 사용자: 자동전환 비활성(WCAG 2.2.2·prefers-reduced-motion)
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let lastIdx = idx;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      setProgress(Math.min(100, (elapsed / DURATION_MS) * 100));
      if (elapsed >= DURATION_MS) {
        startRef.current = now;
        lastIdx = (lastIdx + 1) % list.length;
        setIdx(lastIdx);
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, list.length]);

  return (
    <section
      className="relative w-full overflow-hidden text-white"
      style={{ height: "min(865px, 95vh)" }}
    >
      <div className="absolute inset-0">
        {list.map((slide, i) => (
          <div
            key={i}
            className="hero-media absolute inset-0 transition-opacity duration-[1000ms]"
            style={{
              opacity: i === idx ? 1 : 0,
              backgroundImage: slide.src ? `url(${slide.src})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-hidden={i !== idx}
          />
        ))}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="absolute left-6 top-1/2 z-10 max-w-[90%] -translate-y-1/2 lg:left-[60px] lg:top-[500px] lg:max-w-[640px] lg:translate-y-0">
        <p className="font-heading text-[28px] font-extrabold leading-tight lg:text-[41px]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-2 text-[15px] lg:text-[18px]">{subtitle}</p>
        ) : null}
        {body ? (
          <p className="mt-[40px] whitespace-pre-line text-[13px] leading-[1.7] text-white/[0.77] lg:mt-[90px] lg:text-[14px]">
            {body}
          </p>
        ) : null}
      </div>

      {list.length > 1 ? (
        <>
          <div className="absolute bottom-[40px] left-6 z-10 w-[180px] lg:bottom-[100px] lg:left-[60px] lg:w-[230px]">
            <div className="hero-progress-track" />
            <div
              className="hero-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute -right-[60px] bottom-[10px] font-heading text-[14px] tracking-[2px] text-white/90">
              <span className="opacity-100">{idx + 1}</span>
              <span className="opacity-60"> / {list.length}</span>
            </div>
          </div>

          <div className="absolute bottom-[40px] right-6 z-10 flex flex-col gap-2 lg:bottom-[100px] lg:right-[40px]">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIdx(i);
                  startRef.current = performance.now();
                  setProgress(0);
                }}
                aria-label={`슬라이드 ${i + 1}`}
                className="h-2 w-2 rounded-full transition-all"
                style={{
                  background: i === idx ? "#fff" : "rgba(255,255,255,.4)",
                  transform: i === idx ? "scale(1.4)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
