import { NextRequest, NextResponse } from "next/server";
import { encryptPhone, isCompleteKrMobile } from "@/lib/phone-crypto";

/**
 * 리드 수집 — REVRUN inquiries 파이프라인에 anon INSERT.
 * supabase-js 미설치 → anon REST fetch 로 동일 동작.
 *
 * PII: phone 은 AES-256-GCM 암호화 저장(평문 INSERT 금지). 실패 시 명시적 500.
 * 멀티테넌트: env NEXT_PUBLIC_SITE_ID 상수만. x-site-id 헤더 무시(크로스테넌트 봉합 · 2026-07-16).
 */

// env 는 .trim() — Vercel 주입 시 후행 개행/공백이 uuid/URL 캐스팅을 깨뜨림(방어).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID?.trim();

function envReady(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON && SITE_ID);
}

function optString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const siteId = SITE_ID;
  if (!envReady() || !siteId) {
    // env 미주입(온보딩 전) — 폼이 거짓 "접수완료"를 띄우지 않도록 503.
    return NextResponse.json(
      { error: "접수 채널이 아직 활성화되지 않았습니다. 전화로 문의해주세요." },
      { status: 503 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!name || !phone) {
    return NextResponse.json(
      { error: "이름과 연락처는 필수입니다." },
      { status: 400 },
    );
  }
  if (!isCompleteKrMobile(phone)) {
    return NextResponse.json(
      { error: "올바른 휴대폰 번호(010-XXXX-XXXX)를 입력해주세요." },
      { status: 400 },
    );
  }

  const message = typeof body.message === "string" ? body.message : null;
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl : null;
  const referrer = typeof body.referrer === "string" ? body.referrer : null;
  const formLocation = typeof body.formLocation === "string" ? body.formLocation : null;

  // 시공 특화 확장 필드(사장님이 원하는 세부질문 — 없어도 OK)
  const extra_fields: Record<string, string> = {};
  for (const k of ["service_type", "region", "budget", "schedule"] as const) {
    const v = body[k];
    if (typeof v === "string" && v.trim()) extra_fields[k] = v.trim();
  }

  // phone 암호화 — 실패 시 평문 저장 금지(명시적 500, 고객엔 일반 메시지).
  let encryptedPhone: string;
  try {
    encryptedPhone = encryptPhone(phone);
  } catch (e) {
    console.error("[inquiry] phone 암호화 실패:", e instanceof Error ? e.message : "unknown");
    return NextResponse.json(
      { error: "일시적 오류로 접수에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON as string,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      site_id: siteId,
      name,
      phone: encryptedPhone,
      message,
      source_url: sourceUrl,
      referrer,
      form_location: formLocation,
      utm_source: optString(body.utm_source),
      utm_medium: optString(body.utm_medium),
      utm_campaign: optString(body.utm_campaign),
      utm_content: optString(body.utm_content),
      utm_term: optString(body.utm_term),
      agency_ref: optString(body.ref),
      channel_code: "direct",
      extra_fields,
      status: "new",
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[inquiry] INSERT 실패:", res.status, detail.slice(0, 200));
    return NextResponse.json(
      { error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
