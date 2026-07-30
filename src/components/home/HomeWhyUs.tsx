import Image from "next/image";
import type { CSSProperties } from "react";

const WHY = [
  { title: "20년 경력 대표 직접 시공", desc: "전동현 대표와 유경험 목공팀이 현장에 직접 나가 목공·단열을 시공합니다." },
  { title: "셀프 인테리어 부분시공 특화", desc: "리모델링 전체가 아닌 '이 부분만' 필요한 고객에 맞춘 견적·공정. 실장님 대행 시공도 진행합니다." },
  { title: "목공 · 단열 원스톱", desc: "등박스·가벽·히든도어 목공과 확장부 아이소핑크 단열을 한 팀에서 이어서 진행합니다." },
  { title: "실측 후 명확한 견적", desc: "현장 실측 없이 견적을 확정하지 않습니다. 사후 추가 청구 없이 견적서대로." },
  { title: "수도권 전역 출장", desc: "서울·수원·분당·용인·동탄·화성·평택 등 수도권 전역 출장 시공." },
  { title: "바닥공사는 진행하지 않음", desc: "잘하는 것에만 집중합니다. 바닥공사는 정중히 사양드립니다 (사전 안내)." },
];

// 골조 → 자재 → 작업 중 → 완성 순서로, 한 팀이 끝까지 간다는 걸 사진으로 보여준다
const MOSAIC = [
  { src: "/images/svc-ceiling.jpg", alt: "천장 목공 골조를 잡는 현장" },
  { src: "/images/case-1.jpg", alt: "현장에 반입한 단열재 아이소핑크" },
  { src: "/images/case-weave.jpg", alt: "천장 목공 작업 중인 태영목공팀" },
  { src: "/images/case-cafe.jpg", alt: "원목 루바로 마감한 상업공간" },
];

export function HomeWhyUs() {
  return (
    <section className="gp-section">
      <div className="gp-inner">
        <div className="reveal gp-section-header">
          <p className="gp-label">WHY US</p>
          <h2 className="gp-h2">태영목공을 선택하는 이유</h2>
          <p className="gp-sub">20년 경력 전동현 대표가 직접 시공하는 아파트 홈인테리어 부분시공</p>
        </div>

        <div className="ty-why">
          <div className="ty-why__mosaic">
            {MOSAIC.map((m, i) => (
              <div
                key={m.src}
                className="ty-zoom reveal"
                style={{ "--reveal-delay": `${i * 100}ms`, position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "1/1", background: "#e5e5e5" } as CSSProperties}
              >
                <Image src={m.src} alt={m.alt} fill sizes="(min-width: 900px) 22vw, 45vw" />
              </div>
            ))}
          </div>

          <ol className="ty-why__list">
            {WHY.map((w, i) => (
              <li
                key={w.title}
                className="reveal ty-why__item"
                style={{ "--reveal-delay": `${i * 70}ms` } as CSSProperties}
              >
                <span className="ty-why__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#121212", margin: 0, wordBreak: "keep-all" }}>{w.title}</h3>
                  <p style={{ marginTop: 6, fontSize: 14, color: "#737373", lineHeight: 1.65, wordBreak: "keep-all" }}>{w.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
