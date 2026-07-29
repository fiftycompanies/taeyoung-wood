"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 스크롤 진입 리빌 — `.reveal` 요소가 뷰포트에 들어오면 `.in-view` 부여(1회).
 * globals.css의 프리미엄 폴리시 기본팩과 함께 사용. 렌더 산출물 없음.
 *
 * 사용: 루트 레이아웃/페이지에 <ScrollReveal /> 한 번 마운트 + 섹션/카드에 className="reveal"
 * (stagger는 style={{ "--reveal-delay": `${i*60}ms` } as CSSProperties}).
 * ⚠️ 무JS 대비: layout에 <noscript><style>.reveal{opacity:1!important;transform:none!important}</style></noscript>.
 *
 * ★소프트 내비게이션 대응(2026-07-15): App Router는 페이지 이동 시 layout을 리마운트하지
 * 않으므로 `[]` deps면 최초 1회만 옵저버가 붙어, 이동한 페이지의 `.reveal`이 opacity:0으로
 * 영구 잔존(새로고침 전 빈 화면). `usePathname()`을 deps에 넣어 매 내비게이션마다 재관찰한다.
 */
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!els.length) return;
    // reduced-motion 또는 IntersectionObserver 미지원 → 전부 즉시 표시
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
