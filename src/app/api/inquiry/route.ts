import { NextRequest, NextResponse } from "next/server";
import { isCompleteKrMobile } from "@/lib/phone-crypto";

/**
 * 문의 접수 — 어드민 공용 접수 창구로 넘긴다(문의봇 차단 V6, 2026-11-27).
 * 이 서버는 DB 에 직접 쓰지 않는다. 사이트 전용 열쇠(SITE_INTAKE_KEY)는 이 사이트에만 넣을 수 있고,
 * 전화 암호화·거르기·길이 상한·자동 스팸 판정은 어드민 창구가 한다.
 */

// env 는 .trim() — Vercel 주입 시 후행 개행/공백이 uuid/URL 캐스팅을 깨뜨림(방어).
const ADMIN_API_URL = process.env.ADMIN_API_URL?.trim();
const SITE_INTAKE_KEY = process.env.SITE_INTAKE_KEY?.trim();
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID?.trim();

function envReady(): boolean {
  return Boolean(ADMIN_API_URL && SITE_INTAKE_KEY && SITE_ID);
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

  const res = await fetch(`${ADMIN_API_URL}/api/public/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Site-Key": SITE_INTAKE_KEY as string },
    body: JSON.stringify({
      siteId: siteId,
      name,
      phone,
      message,
      sourceUrl: sourceUrl,
      referrer,
      formLocation: formLocation,
      utm_source: optString(body.utm_source),
      utm_medium: optString(body.utm_medium),
      utm_campaign: optString(body.utm_campaign),
      utm_content: optString(body.utm_content),
      utm_term: optString(body.utm_term),
      ref: optString(body.ref),
      extra_fields,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!res?.ok) {
    const detail = (await res?.text().catch(() => "")) ?? "";
    console.error("[inquiry] INSERT 실패:", res?.status, detail.slice(0, 200));
    return NextResponse.json(
      { error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
