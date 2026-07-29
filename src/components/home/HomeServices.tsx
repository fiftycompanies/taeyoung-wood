const SERVICES = [
  {
    title: "아파트 홈인테리어",
    subtitle: "목공 · 가벽",
    desc: "20년 경력의 대표가 직접 시공. 공간을 나누는 가벽부터 마감까지, 셀프 인테리어 고객이 놓치기 쉬운 디테일을 잡아드립니다.",
    features: ["가벽 신설·철거", "몰딩·마감재", "실측 후 정확한 견적"],
  },
  {
    title: "TV박스 · 아트월 · 파티션",
    subtitle: "목공 · 조형",
    desc: "TV박스, 아트월, 붙박이 파티션 등 공간의 포인트가 되는 목공 조형물을 도면 없이도 현장 협의로 제작합니다.",
    features: ["TV박스 제작", "아트월·파티션", "붙박이 가구 협의"],
  },
  {
    title: "라인등 · 간접등 · 히든도어",
    subtitle: "목공 · 디테일 시공",
    desc: "천장 라인등, 벽 간접등, 벽면과 하나로 이어지는 히든도어 등 셀프 인테리어에서 가장 어려운 목공 마감을 대신 진행합니다.",
    features: ["라인등·간접등", "히든도어 제작", "천장·벽 마감"],
  },
  {
    title: "일반 단열 시공",
    subtitle: "단열 · 결로 대응",
    desc: "벽체·천장 등 일반 단열 시공을 진행합니다. (바닥공사는 진행하지 않습니다.) 결로·냉기 문제로 부분 시공이 필요한 세대에 적합합니다.",
    features: ["벽체 단열", "천장 단열", "바닥공사 제외"],
  },
];

export function HomeServices() {
  return (
    <section id="services" className="gp-section" style={{ background: "#f5f5f5" }}>
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">SERVICES</p>
          <h2 className="gp-h2">서비스 상세 안내</h2>
          <p className="gp-sub">목공 50% · 단열 50% — 아파트 홈인테리어 부분시공에 최적화</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
          {SERVICES.map((s) => (
            <article key={s.title} className="gp-card reveal tg-lift" style={{ padding: 28 }}>
              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #1B5BD8", display: "inline-block" }}>
                <p style={{ fontSize: 13, color: "#737373", margin: 0 }}>{s.title}</p>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#121212", margin: "4px 0 0" }}>{s.subtitle}</h3>
              </div>
              <p style={{ fontSize: 14, color: "#737373", lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              <ul style={{ marginTop: 20, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#121212" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1B5BD8" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
