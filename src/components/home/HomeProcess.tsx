const STEPS = [
  { n: "01", title: "상담", desc: "전화·문자로 시공 범위(가벽·라인등·단열 등)와 일정 협의" },
  { n: "02", title: "실측", desc: "현장 방문 실측 후 자재·공정을 협의드립니다" },
  { n: "03", title: "견적", desc: "실측 기반의 명확한 견적서 발행 · 사후 추가청구 없음" },
  { n: "04", title: "시공", desc: "20년 경력 대표가 직접 목공·단열 부분시공 진행" },
  { n: "05", title: "A/S", desc: "시공 후 마감 하자·미세 조정 A/S 대응" },
];

export function HomeProcess() {
  return (
    <section id="process" className="gp-section">
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">PROCESS</p>
          <h2 className="gp-h2">작업 진행 과정</h2>
          <p className="gp-sub">상담 → 실측 → 견적 → 시공 → A/S, 5단계로 진행됩니다</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} className="reveal" style={{ textAlign: "center", position: "relative" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff", fontSize: 22, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 24px rgba(27,91,216,0.35)" }}>
                {s.n}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121212", margin: 0 }}>{s.title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: "#737373", lineHeight: 1.6 }}>{s.desc}</p>
              {i < STEPS.length - 1 ? (
                <span aria-hidden style={{ position: "absolute", top: 30, right: -12, color: "#d1d5db", fontSize: 20 }} className="hidden md:inline-block">
                  →
                </span>
              ) : null}
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
