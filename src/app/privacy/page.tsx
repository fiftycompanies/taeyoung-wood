import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 태영목공",
  description: "태영목공(태영 인테리어) 개인정보처리방침 — 개인정보 수집 및 이용에 관한 안내입니다.",
};

export default function PrivacyPage() {
  return (
    <div>
      <section style={{ padding: "140px 24px 40px", background: "#121212", color: "#fff", textAlign: "center" }}>
        <div className="gp-inner">
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>개인정보처리방침</h1>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>최종 개정일: 2026년 7월 1일</p>
        </div>
      </section>

      <section className="gp-section">
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", color: "#333", fontSize: 15, lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>1. 수집하는 개인정보 항목</h2>
          <p>태영목공(태영 인테리어)은 상담 신청·견적 요청 시 다음의 개인정보를 수집합니다.</p>
          <ul>
            <li>필수: 성명, 연락처</li>
            <li>선택: 주소, 이메일, 시공 사진</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>2. 개인정보의 수집 및 이용 목적</h2>
          <p>수집된 개인정보는 상담 응대, 견적 안내, 시공 일정 협의, A/S 대응에 한해 이용됩니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>3. 개인정보의 보유 및 이용 기간</h2>
          <p>상담·시공 완료 후 3년간 보관 후 파기합니다. 다만 관련 법령이 정한 경우 해당 기간을 따릅니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>4. 개인정보 파기 절차 및 방법</h2>
          <p>보존 기간 경과 시 지체 없이 파기합니다. 전자 파일은 복구 불가한 방법으로 삭제하고 종이 문서는 파쇄합니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>5. 개인정보 제3자 제공</h2>
          <p>이용자의 동의 없이 제3자에게 개인정보를 제공하지 않습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>6. 이용자 및 법정대리인의 권리</h2>
          <p>이용자는 언제든지 자신의 개인정보 열람·수정·삭제·처리정지를 요청할 수 있습니다.</p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32 }}>7. 개인정보 보호 책임자</h2>
          <p>대표: 전동현 / 이메일: 문의 시 별도 안내 / 전화: {["010","8835","7775"].join("-")}</p>
        </div>
      </section>
    </div>
  );
}
