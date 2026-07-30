import Image from "next/image";
import type { CSSProperties } from "react";
import { SERVICES } from "@/lib/portfolio";

export function HomeServices() {
  return (
    <section id="services" className="gp-section" style={{ background: "#f5f5f5" }}>
      <div className="gp-inner">
        <div className="reveal gp-section-header">
          <p className="gp-label">SERVICES</p>
          <h2 className="gp-h2">시공 가능한 목공·단열 항목</h2>
          <p className="gp-sub">아파트 홈인테리어 부분시공부터 주택·상업공간 내장목공까지</p>
        </div>
        <div className="ty-grid ty-grid--3">
          {SERVICES.map((s, i) => (
            <article
              key={s.subtitle}
              className="gp-card reveal tg-lift ty-photo-card"
              style={{ "--reveal-delay": `${(i % 3) * 90}ms`, padding: 0, overflow: "hidden" } as CSSProperties}
            >
              <div className="ty-zoom" style={{ position: "relative", aspectRatio: "4/3", background: "#e5e5e5" }}>
                <Image src={s.img} alt={`${s.subtitle} 시공 현장`} fill sizes="(min-width: 1024px) 33vw, 50vw" />
                <span className="ty-photo-card__tag">{s.title}</span>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#121212", margin: 0, lineHeight: 1.4, wordBreak: "keep-all" }}>{s.subtitle}</h3>
                <p style={{ marginTop: 10, fontSize: 14, color: "#737373", lineHeight: 1.7, wordBreak: "keep-all" }}>{s.desc}</p>
                <ul style={{ marginTop: 18, padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {s.features.map((f) => (
                    <li key={f} style={{ padding: "5px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 12, fontWeight: 600, borderRadius: 999 }}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
