import Image from "next/image";
import type { CSSProperties } from "react";
import { PROJECTS } from "@/lib/portfolio";

export function HomeCases() {
  return (
    <section id="cases" className="gp-section" style={{ background: "rgba(245,245,245,0.5)" }}>
      <div className="gp-inner">
        <div className="reveal gp-section-header">
          <p className="gp-label">CASE STUDIES</p>
          <h2 className="gp-h2">시공 사례</h2>
          <p className="gp-sub">태영목공이 직접 시공한 아파트·주택·상업공간 현장</p>
          <p style={{ marginTop: 8, fontSize: 14, color: "#737373" }}>20년 경력 · 서울·경기 전역 시공</p>
        </div>
        <div className="ty-grid ty-grid--3">
          {PROJECTS.map((c, i) => (
            <article
              key={c.img}
              className="gp-card reveal tg-lift ty-photo-card"
              style={{ "--reveal-delay": `${(i % 3) * 90}ms`, padding: 0, overflow: "hidden" } as CSSProperties}
            >
              <div className="ty-zoom" style={{ position: "relative", aspectRatio: "4/3", background: "#e5e5e5" }}>
                <Image src={c.img} alt={`${c.region} ${c.title}`} fill sizes="(min-width: 1024px) 33vw, 50vw" />
                <span className="ty-photo-card__tag">{c.tag}</span>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "#737373", marginBottom: 6 }}>{c.date}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#121212", margin: 0, lineHeight: 1.4, wordBreak: "keep-all" }}>{c.title}</h3>
                <p style={{ marginTop: 8, fontSize: 13, color: "#737373", wordBreak: "keep-all" }}>{c.region}</p>
              </div>
            </article>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 36, fontSize: 14, color: "#737373" }}>
          더 많은 현장 사진은{" "}
          <a href="https://blog.naver.com/woodty" target="_blank" rel="noopener noreferrer" style={{ color: "#03c75a", fontWeight: 700, textDecoration: "none" }}>
            네이버 블로그
          </a>
          에서 보실 수 있습니다.
        </p>
      </div>
    </section>
  );
}
