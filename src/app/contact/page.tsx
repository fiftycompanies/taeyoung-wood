import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "상담문의 | 태영목공",
  description:
    "태영목공에 아파트 홈인테리어 목공·단열 부분시공 상담을 문의하세요. 서울·경기 전역 방문 실측 후 확정 견적을 안내드립니다.",
  alternates: { canonical: "/contact" },
};

const PHONE_TEL = ["010", "8835", "7775"].join("");
const PHONE_DISPLAY = ["010", "8835", "7775"].join("-");

export default function ContactPage() {
  return (
    <div>
      <section
        style={{
          padding: "140px 24px 40px",
          textAlign: "center",
          background: "linear-gradient(135deg, #1B5BD8, #0f3a99)",
          color: "#fff",
        }}
      >
        <div className="gp-inner">
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.9 }}>CONTACT</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: "12px 0 0" }}>상담문의</h1>
          <p style={{ marginTop: 12, fontSize: 15, opacity: 0.85 }}>
            시공 부위 사진과 원하시는 범위를 남겨주시면 참고 견적과 상담 일정을 안내드립니다.
          </p>
        </div>
      </section>

      <section className="gp-section">
        <div className="gp-inner" style={{ display: "grid", gap: 32, gridTemplateColumns: "minmax(0, 1fr)" }}>
          <div
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
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
              바로 통화 가능한 시간에는 전화가 더 빠릅니다.
            </div>
            <a
              href={`tel:${PHONE_TEL}`}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                padding: "14px 22px",
                background: "#1B5BD8",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              {PHONE_DISPLAY} 바로 전화
            </a>
          </div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}
