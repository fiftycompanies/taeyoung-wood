const WHY = [
  { title: "20년 경력 대표 직접 시공", desc: "협력업체 없이 전동현 대표가 현장에 직접 나가 목공·단열을 시공합니다.", icon: "🔨" },
  { title: "셀프 인테리어 부분시공 특화", desc: "리모델링 전체가 아닌 '이 부분만' 필요한 셀프 인테리어 고객에게 맞춘 견적·공정.", icon: "🧩" },
  { title: "목공 50% · 단열 50%", desc: "가벽·라인등·TV박스·히든도어 목공과 일반 단열을 한 팀에서 원스톱 진행.", icon: "🪵" },
  { title: "실측 후 명확한 견적", desc: "현장 실측 없이 견적을 확정하지 않습니다. 사후 추가 청구 없이 견적서대로.", icon: "📋" },
  { title: "서울·경기 전역", desc: "수원 본거지 · 서울과 경기 전 지역 시공 상담 가능.", icon: "📍" },
  { title: "바닥공사는 진행하지 않음", desc: "잘하는 것에만 집중합니다. 바닥공사는 정중히 사양드립니다 (사전 안내).", icon: "🙅" },
];

export function HomeWhyUs() {
  return (
    <section className="gp-section">
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">WHY US</p>
          <h2 className="gp-h2">태영목공을 선택하는 이유</h2>
          <p className="gp-sub">20년 경력 전동현 대표가 직접 시공하는 아파트 홈인테리어 부분시공</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {WHY.map((w) => (
            <div key={w.title} className="reveal tg-lift" style={{ padding: 32, background: "#fff", border: "1px solid #ebebeb", borderRadius: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{w.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#121212", margin: 0 }}>{w.title}</h3>
              <p style={{ marginTop: 8, fontSize: 14, color: "#737373", lineHeight: 1.6 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
