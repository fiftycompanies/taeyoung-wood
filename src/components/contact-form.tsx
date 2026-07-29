"use client";

import { useState } from "react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "error"; message: string };

const SERVICE_OPTIONS = [
  "가벽 시공",
  "라인등·간접등",
  "TV박스·아트월",
  "히든도어 제작",
  "일반 단열 시공",
  "부분시공(복합)",
  "기타",
];

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
      service_type: String(data.get("service_type") ?? ""),
      region: String(data.get("region") ?? ""),
      sourceUrl: typeof window !== "undefined" ? window.location.href : null,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      formLocation: "/contact",
    };

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "error", message: json.error ?? "접수에 실패했습니다." });
        return;
      }
      setStatus({ kind: "ok" });
      form.reset();
    } catch {
      setStatus({ kind: "error", message: "네트워크 오류로 접수에 실패했습니다." });
    }
  }

  if (status.kind === "ok") {
    return (
      <div
        className="gp-card"
        style={{
          padding: 32,
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 44 }}>✅</div>
        <h2 style={{ marginTop: 12, fontSize: 22, fontWeight: 800, color: "#121212" }}>접수되었습니다</h2>
        <p style={{ marginTop: 8, color: "#555", lineHeight: 1.7 }}>
          영업일 기준 빠른 시간 내 대표 전동현이 직접 연락드립니다.
          <br />
          급하실 경우 <strong>010-8835-7775</strong> 로 전화 주세요.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="gp-card"
      style={{
        padding: 24,
        display: "grid",
        gap: 12,
        maxWidth: 640,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>이름 *</span>
        <input
          name="name"
          required
          autoComplete="name"
          maxLength={40}
          placeholder="홍길동"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>연락처 *</span>
        <input
          name="phone"
          required
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={14}
          placeholder="010-1234-5678"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>희망 시공</span>
        <select name="service_type" style={inputStyle} defaultValue="">
          <option value="" disabled>
            시공 종류를 선택해주세요
          </option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>시공 지역</span>
        <input
          name="region"
          maxLength={40}
          placeholder="예) 수원시 영통구 광교"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>상세 내용</span>
        <textarea
          name="message"
          rows={5}
          maxLength={2000}
          placeholder="시공 부위(예: 거실 가벽 · TV박스), 대략 크기, 원하시는 일정 등을 남겨주시면 상담이 빠릅니다."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        />
      </label>

      <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
        연락처는 상담 목적으로만 사용되며 <a href="/privacy" style={{ color: "#1B5BD8" }}>개인정보처리방침</a>에 따라 안전하게 보관됩니다.
      </p>

      <button
        type="submit"
        disabled={status.kind === "sending"}
        style={{
          padding: "14px 22px",
          background: "#1B5BD8",
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          borderRadius: 999,
          border: "none",
          cursor: status.kind === "sending" ? "wait" : "pointer",
          opacity: status.kind === "sending" ? 0.7 : 1,
        }}
      >
        {status.kind === "sending" ? "접수 중…" : "상담 접수"}
      </button>

      {status.kind === "error" ? (
        <p style={{ fontSize: 13, color: "#c1121f", marginTop: 4 }}>{status.message}</p>
      ) : null}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 15,
  border: "1px solid #d4d4d4",
  borderRadius: 10,
  outline: "none",
  color: "#121212",
  background: "#fff",
  fontFamily: "inherit",
};
