import type { CSSProperties } from "react";

const STEPS = [
  { n: "01", title: "상담", desc: "전화·문자로 시공 범위(등박스·가벽·히든도어·단열 등)와 일정을 협의합니다" },
  { n: "02", title: "실측", desc: "현장 방문 실측 후 자재·공정을 함께 정합니다" },
  { n: "03", title: "견적", desc: "실측 기반의 명확한 견적서 발행 · 사후 추가청구 없음" },
  { n: "04", title: "시공", desc: "20년 경력 대표와 목공팀이 직접 목공·단열 부분시공 진행" },
  { n: "05", title: "A/S", desc: "시공 후 마감 하자·미세 조정 A/S 대응" },
];

export function HomeProcess() {
  return (
    <section id="process" className="gp-section" style={{ background: "#f5f5f5" }}>
      <div className="gp-inner">
        <div className="reveal gp-section-header">
          <p className="gp-label">PROCESS</p>
          <h2 className="gp-h2">작업 진행 과정</h2>
          <p className="gp-sub">상담 → 실측 → 견적 → 시공 → A/S, 5단계로 진행됩니다</p>
        </div>
        <div className="ty-steps">
          <span className="ty-steps__line reveal" aria-hidden />
          {STEPS.map((s, i) => (
            <div key={s.n} className="ty-step reveal" style={{ "--reveal-delay": `${i * 110}ms` } as CSSProperties}>
              <div className="ty-step__badge">{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121212", margin: 0 }}>{s.title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: "#737373", lineHeight: 1.6, wordBreak: "keep-all" }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 40, fontSize: 15, fontWeight: 600, color: "#1B5BD8" }}>
          부분시공 범위·현장 상황에 따라 반나절~며칠 소요
        </p>
      </div>
    </section>
  );
}
