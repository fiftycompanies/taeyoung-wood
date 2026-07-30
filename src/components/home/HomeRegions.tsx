import type { CSSProperties } from "react";

const REGIONS = [
  // 서울 전역
  "강남구", "서초구", "송파구", "강동구", "용산구",
  "마포구", "성동구", "광진구", "종로구", "중구",
  "동대문구", "성북구", "은평구", "서대문구", "양천구",
  "강서구", "구로구", "영등포구", "동작구", "관악구",
  // 경기 주요
  "수원시", "성남시", "용인시", "고양시", "안양시",
  "부천시", "화성시", "안산시", "평택시", "의정부시",
];

export function HomeRegions() {
  return (
    <section id="regions" className="gp-section" style={{ background: "#111827", color: "#fff" }}>
      <div className="gp-inner">
        <div className="reveal gp-section-header">
          <p className="gp-label" style={{ color: "#93bbff" }}>SERVICE AREAS</p>
          <h2 className="gp-h2" style={{ color: "#fff" }}>서비스 가능 지역</h2>
          <p className="gp-sub" style={{ color: "rgba(255,255,255,0.75)" }}>서울 전역 · 경기 전역 아파트 홈인테리어 부분시공 상담</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, maxWidth: 960, margin: "0 auto" }}>
          {REGIONS.map((r, i) => (
            <div
              key={r}
              className="reveal ty-region"
              style={{ "--reveal-delay": `${i * 35}ms`, padding: "14px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: "center" } as CSSProperties}
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
