// 참고: 아래 사진은 사이트 초기 개통용 자리표시 이미지입니다. 실제 태영목공 시공 사진은 순차적으로 교체 예정.
const CASES = [
  { date: "준비 중", title: "아파트 거실 가벽 신설 · TV박스 마감 사례 (준비 중)", region: "수원시", tag: "목공 · 가벽", img: "https://bteilacnudezfwutirdm.supabase.co/storage/v1/object/public/site-images/d68f3e67-df02-4444-9e63-23f3bdc53353/1776079059-case-pipe-damage.jpg" },
  { date: "준비 중", title: "천장 라인등 · 간접등 목공 마감 사례 (준비 중)", region: "성남시", tag: "라인등·간접등", img: "https://bteilacnudezfwutirdm.supabase.co/storage/v1/object/public/site-images/d68f3e67-df02-4444-9e63-23f3bdc53353/1776079059-case-clog.jpg" },
  { date: "준비 중", title: "벽면 히든도어 제작 · 도색 사례 (준비 중)", region: "용인시", tag: "히든도어", img: "https://bteilacnudezfwutirdm.supabase.co/storage/v1/object/public/site-images/d68f3e67-df02-4444-9e63-23f3bdc53353/1776079059-case-manhole.jpg" },
  { date: "준비 중", title: "베란다 · 외벽 일반 단열 시공 사례 (준비 중)", region: "서울", tag: "단열 시공", img: "https://bteilacnudezfwutirdm.supabase.co/storage/v1/object/public/site-images/d68f3e67-df02-4444-9e63-23f3bdc53353/1776079059-case-endoscope.jpg" },
];

export function HomeCases() {
  return (
    <section id="cases" className="gp-section" style={{ background: "rgba(245,245,245,0.5)" }}>
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">CASE STUDIES</p>
          <h2 className="gp-h2">시공 사례</h2>
          <p className="gp-sub">아파트 홈인테리어 목공·단열 부분시공 현장 (실사진은 순차 교체 예정)</p>
          <p style={{ marginTop: 8, fontSize: 14, color: "#737373" }}>20년 경력 · 서울·경기 전역 시공</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
          {CASES.map((c) => (
            <article key={c.title} className="gp-card reveal">
              <div style={{ position: "relative", aspectRatio: "4/3", background: "#eee" }}>
                <img src={c.img} alt={c.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "rgba(255,255,255,0.95)", color: "#1B5BD8", fontSize: 12, fontWeight: 700, borderRadius: 999 }}>준비 중</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "#737373", marginBottom: 8 }}>{c.date}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#121212", margin: 0, lineHeight: 1.4 }}>{c.title}</h3>
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  <span style={{ padding: "3px 10px", background: "#f5f5f5", color: "#737373", fontSize: 11, borderRadius: 999 }}>{c.region}</span>
                  <span style={{ padding: "3px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 11, borderRadius: 999 }}>{c.tag}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
