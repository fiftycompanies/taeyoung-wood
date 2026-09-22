"use client";

/**
 * 유입 정보 캡처/복원 — 공통 레이아웃의 <AttributionCapture/> 가 **어느 페이지로 들어오든** 첫 진입 때 저장하고,
 * 폼 제출 시 함께 전송한다.
 *
 * ★폼 안에서만 캡처하던 때(~2026-09-22)는 /service·/blog 로 UTM 달고 들어와 /contact 로 옮겨 문의하면
 *   UTM 이 사라지고, referrer 도 폼 화면의 document.referrer(자기 사이트)로 덮여 전부 「직접 유입」이 됐다
 *   (thehanoi-renewal 에서 먼저 봉합·라이브 검증, 같은 방식 이식).
 */
const KEY = "tg_utm";
const REF_KEY = "tg_first_ref";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const;

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export function captureUtm(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: Utm = {};
    let has = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) {
        incoming[k] = v;
        has = true;
      }
    }
    if (has) sessionStorage.setItem(KEY, JSON.stringify(incoming));

    // 최초 외부 referrer — 세션의 첫 페이지에서 한 번만 적는다(빈 문자열 = 직접 진입).
    // 자기 사이트 referrer 는 적지 않는다: 내부 이동이 출처를 덮으면 안 된다.
    if (sessionStorage.getItem(REF_KEY) === null) {
      const r = document.referrer;
      let external = "";
      try {
        if (r && new URL(r).host !== window.location.host) external = r;
      } catch {
        /* 잘못된 referrer — 직접 진입으로 본다 */
      }
      sessionStorage.setItem(REF_KEY, external);
    }
  } catch {
    /* sessionStorage 불가 환경 — 무시 */
  }
}

export function getUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

/** 제출용 referrer — 저장된 최초 외부 referrer, 없으면 지금 화면의 document.referrer. */
export function getReferrer(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const first = sessionStorage.getItem(REF_KEY);
    if (first) return first;
  } catch {
    /* 무시 */
  }
  return document.referrer || null;
}
