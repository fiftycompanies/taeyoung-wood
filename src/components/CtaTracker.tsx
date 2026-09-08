"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

/**
 * 예약 목적지 — 어드민 정본(`site-template/src/lib/cta-classify.ts`)과 같은 8종.
 * ★`map.naver` 는 여기 없다. 그건 길찾기로도 쓰는 주소라 호스트만으로 예약이라 부르면 안 된다.
 */
const RESERVATION_RE =
  /camfit\.co\.kr|booking\.naver\.com|naver\.me\/|ddnayo\.com|bookingplay\.co\.kr|yanolja\.com|goodchoice\.kr|yeogi\.com|airbnb\.[a-z.]+|ttbkk\.com/i;
/** 네이버 지도의 **방 예약** 화면만 예약으로 센다(정본 `NAVER_PLACE_ROOM_RE` 와 같은 규칙). */
const NAVER_ROOM_RE = /(?:map|m|pcmap|place)\.naver\.com.*(?:placePath=(?:%2F|\/)room|\/room)/i;
/** 글 제목에 「예약」이 든 내부 링크가 예약으로 잡히던 것을 막는다. */
const INTERNAL_NON_RESERVATION_RE = /^\/(?:blog|guide|news|notice|article)(?:\/|$)/;
const RESERVATION_PATH_RE = /reserv|booking|\/book(?:ing)?(?:\/|$)/i;
const KAKAO_RE = /pf\.kakao\.com|open\.kakao\.com|kakao\.com\/_/i;

/** 목적지 이름 — GA4 맞춤 측정기준 `cta_dest`. 안 보내면 「어디로 보냈나」가 빈다(실측 86%가 (not set)). */
function destOf(href: string): string {
  if (/camfit\.co\.kr/i.test(href)) return "camfit";
  if (/booking\.naver\.com|naver\.me\/|naver\.com/i.test(href)) return "naver";
  if (/ddnayo\.com/i.test(href)) return "ddnayo";
  if (/bookingplay\.co\.kr/i.test(href)) return "bookingplay";
  if (/yanolja\.com/i.test(href)) return "yanolja";
  if (/goodchoice\.kr/i.test(href)) return "goodchoice";
  if (/yeogi\.com/i.test(href)) return "yeogi";
  if (/airbnb\./i.test(href)) return "airbnb";
  if (/ttbkk\.com/i.test(href)) return "ttbkk";
  return "기타";
}

/** 라벨이 전화번호 그대로인 자리가 많다 — 그대로 두면 번호가 구글 애널리틱스로 넘어간다. */
const maskPhone = (s: string) => s.replace(/\d[\d\-\s]{7,}\d/g, "(번호)").trim() || "전화";

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
      if (href.startsWith("tel:")) {
        track("phone_click", { cta_label: maskPhone(label) });
        return;
      }
      if (KAKAO_RE.test(href) || /카톡|카카오/.test(label)) {
        track("kakao_click", { cta_label: label, cta_url: href.slice(0, 100) });
        return;
      }
      // 사이트 안의 예약 페이지로 가는 것은 **예약이 아니라 예약 페이지를 본 것**이다.
      let internal = !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith("//");
      if (!internal) {
        try { internal = new URL(href, location.href).host === location.host; } catch { internal = false; }
      }
      if (internal) {
        if (!INTERNAL_NON_RESERVATION_RE.test(href) && RESERVATION_PATH_RE.test(href)) {
          track("reservation_view", { cta_label: label, cta_url: href.slice(0, 100) });
        }
        return;
      }
      if (RESERVATION_RE.test(href) || NAVER_ROOM_RE.test(href)) {
        track("reservation_click", { cta_label: label, cta_url: href.slice(0, 100), cta_dest: destOf(href) });
      }
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
