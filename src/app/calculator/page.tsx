import type { Metadata } from "next";
import { HomeCalculator } from "@/components/home/HomeCalculator";

export const metadata: Metadata = {
  title: "부분시공 견적 참고 계산기 | 아파트 목공·단열 | 태영목공",
  description:
    "가벽·라인등·TV박스·히든도어 목공과 일반 단열 부분시공의 참고 견적을 즉시 확인. 실측 후 확정 견적 안내. 바닥공사는 진행하지 않습니다. 태영목공(태영 인테리어).",
};

const FAQS = [
  { q: "참고 견적은 왜 미리 계산해두면 좋나요?", a: "현장 실측 전에 대략적인 예산 범위를 알면 셀프 인테리어 계획을 세우기 쉽습니다. 부담 없이 상담을 시작할 수 있는 첫 관문입니다." },
  { q: "견적은 어떻게 산정되나요?", a: "시공 종류(목공/단열)·시공 범위·평형에 따라 자재비와 인건비가 달라집니다. 계산기는 최근 시공 사례를 바탕으로 한 참고 범위이며, 확정 견적은 현장 실측 후에 안내드립니다." },
  { q: "계산 결과 그대로 청구되나요?", a: "아닙니다. 계산기는 어디까지나 참고값이고, 실제 청구는 반드시 현장 실측 후 동의받은 견적서 기준입니다. 사후 추가 청구는 없습니다." },
  { q: "현장 실측은 어떻게 진행되나요?", a: "전화·문자로 원하는 시공 범위와 일정을 알려주시면, 시공 예정지에 대표가 직접 방문해 실측합니다. 실측 후 자재·공정을 협의드립니다." },
  { q: "바닥공사도 포함되나요?", a: "죄송하지만 태영목공은 바닥공사를 진행하지 않습니다. 벽·천장 목공, 일반 단열 시공에 집중하고 있어 사전에 안내드립니다." },
];

export default function CalculatorPage() {
  return (
    <div>
      <section style={{ padding: "140px 24px 60px", textAlign: "center", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff" }}>
        <div className="gp-inner">
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.9 }}>COST CALCULATOR</p>
          <h1 style={{ fontSize: "clamp(28px,4.5vw,42px)", fontWeight: 800, margin: "12px 0 0", lineHeight: 1.3 }}>
            아파트 목공·단열 부분시공,<br />30초 만에 참고 견적 확인하세요
          </h1>
          <p style={{ marginTop: 16, fontSize: 15, opacity: 0.9, maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
            현장 사진 보내주시면 참고 견적 안내 · 확정 견적은 실측 후 · 바닥공사 제외
          </p>
        </div>
      </section>

      <HomeCalculator />

      <section className="gp-section">
        <div className="gp-inner">
          <div className="gp-section-header">
            <h2 className="gp-h2">자주 묻는 질문</h2>
          </div>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {FAQS.map((f) => (
              <div key={f.q} style={{ padding: 24, background: "#fff", border: "1px solid #ebebeb", borderRadius: 12 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#121212" }}>Q. {f.q}</h2>
                <p style={{ margin: "12px 0 0", color: "#555", fontSize: 14, lineHeight: 1.7 }}>A. {f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
