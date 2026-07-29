import Link from "next/link";

const TIPS = [
  { tag: "목공", title: "가벽 시공, 셀프 인테리어에서 놓치기 쉬운 3가지 포인트", date: "2026. 7. 29.", read: "3분" },
  { tag: "조명", title: "천장 라인등·간접등, 목공 마감이 예뻐지는 순서", date: "2026. 7. 28.", read: "3분" },
  { tag: "단열", title: "결로가 심한 벽, 부분 단열로 해결하는 방법", date: "2026. 7. 27.", read: "3분" },
  { tag: "목공", title: "히든도어, 실제 시공에서 확인해야 할 문틀·경첩 디테일", date: "2026. 7. 26.", read: "3분" },
];

export function HomeTips() {
  return (
    <section className="gp-section">
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">TIPS &amp; BLOG</p>
          <h2 className="gp-h2">전문가가 알려주는 시공 꿀팁</h2>
          <p className="gp-sub">아파트 목공·단열 부분시공에 대한 20년 현장 노하우를 확인하세요</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {TIPS.map((t) => (
            <Link
              key={t.title}
              href="/blog"
              className="gp-card reveal tg-lift"
              style={{ padding: 24, textDecoration: "none", color: "inherit", display: "block" }}
            >
              <span style={{ display: "inline-block", padding: "4px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                {t.tag}
              </span>
              <h3 style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: "#121212", lineHeight: 1.5 }}>{t.title}</h3>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
                <span>{t.date}</span>
                <span>{t.read}</span>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/blog" style={{ color: "#1B5BD8", fontWeight: 700, textDecoration: "none" }}>모든 팁 보기 →</Link>
        </div>
      </div>
    </section>
  );
}
