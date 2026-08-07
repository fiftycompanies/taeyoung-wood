"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

function track(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, { page_path: window.location.pathname, ...params });
  } catch {
    /* silent */
  }
}

export function CtaTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!el) return;
      const href = el.getAttribute("href") || "";
      const label = (el.textContent || "").trim().slice(0, 50);
      if (href.startsWith("tel:")) track("phone_click", { cta_label: label });
      else if (/booking|reserv|ddnayo|naver\.me|map\.naver/.test(href))
        track("reservation_click", { cta_label: label, cta_url: href.slice(0, 100) });
      else if (/kakao/i.test(href) || /카톡|카카오/.test(label))
        track("kakao_click", { cta_label: label, cta_url: href.slice(0, 100) });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
