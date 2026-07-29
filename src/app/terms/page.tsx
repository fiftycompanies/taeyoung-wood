import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | 태영목공",
  description: "태영목공(태영 인테리어) 서비스 이용약관 — 서비스 이용 조건 및 절차 안내입니다.",
};

export default function TermsPage() {
  return (
    <div>
      <section style={{ padding: "140px 24px 40px", background: "#121212", color: "#fff", textAlign: "center" }}>
        <div className="gp-inner">
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>이용약관</h1>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>최종 개정일: 2026년 7월 1일</p>
        </div>
      </section>

      <section className="gp-section">
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", color: "#333", fontSize: 15, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제1조 (목적)</h2>
          <p>본 약관은 태영 인테리어(브랜드명: 태영목공, 이하 &quot;회사&quot;)가 제공하는 아파트 홈인테리어 목공·단열 부분시공 서비스의 이용 조건 및 절차를 규정합니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제2조 (용어의 정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ul>
            <li>&quot;서비스&quot;: 회사가 제공하는 아파트 홈인테리어 목공 시공(가벽·라인등·TV박스·히든도어·간접등 등)과 일반 단열 시공. (바닥공사는 제외)</li>
            <li>&quot;이용자&quot;: 본 약관에 따라 서비스를 이용하는 개인 또는 법인.</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제3조 (서비스의 제공)</h2>
          <p>회사는 다음의 서비스를 제공합니다: 아파트 홈인테리어 목공 부분시공(가벽, 라인등·간접등, TV박스·아트월, 히든도어, 몰딩·마감 등)과 일반 단열 시공(벽체·천장). 단, 바닥공사는 진행하지 않습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제4조 (요금 및 결제)</h2>
          <p>요금은 현장 실측 후 이용자에게 견적서 형태로 안내하며, 이용자의 동의 후에 시공을 진행합니다. 사후 추가 청구는 없습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제5조 (환불 및 A/S)</h2>
          <p>회사는 시공 완료 후 1년간 무상 A/S를 제공합니다. 시공 미해결 시에는 비용을 청구하지 않습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제6조 (책임의 제한)</h2>
          <p>회사는 이용자의 고의 또는 과실로 인한 손해에 대해서는 책임을 지지 않습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>제7조 (분쟁의 해결)</h2>
          <p>본 약관과 관련하여 분쟁이 발생한 경우 상호 협의로 해결하며, 협의가 이루어지지 않을 시 관할 법원에 제기합니다.</p>
        </div>
      </section>
    </div>
  );
}
