import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "시공백과 | 태영목공",
  description: "태영목공의 아파트 홈인테리어 목공·단열 시공백과 — 자재 비교, 시공 순서, 셀프 인테리어 팁까지 20년 경력 대표가 알려드립니다.",
};

const GUIDES = [
  { slug: "enc-가벽-시공-가이드", title: "가벽 시공 완벽 가이드", desc: "자재·두께·전선 처리 총정리" },
  { slug: "enc-라인등-간접등", title: "천장 라인등·간접등 시공 가이드", desc: "조명 배치와 목공 마감 순서" },
  { slug: "enc-히든도어", title: "히든도어 제작 완벽 가이드", desc: "문틀·경첩·손잡이 선택 기준" },
  { slug: "enc-tv박스-아트월", title: "TV박스·아트월 설계 가이드", desc: "거실 배치·콘센트·조명 통합" },
  { slug: "enc-몰딩-마감재", title: "몰딩·마감재 선택 가이드", desc: "무몰딩 vs 심플몰딩 vs 웨인스코팅" },
  { slug: "enc-일반-단열-시공", title: "아파트 일반 단열 시공 완벽 가이드", desc: "벽체·천장 단열 자재 비교" },
  { slug: "enc-결로-대응", title: "결로가 심한 벽, 부분 단열 대응법", desc: "북향·외기 접면 벽 대응 순서" },
  { slug: "enc-베란다-확장-단열", title: "베란다 확장 후 단열 보강 가이드", desc: "창호 주변·냉기 이슈 잡기" },
  { slug: "enc-부분시공-견적", title: "인테리어 부분시공 견적 완벽 가이드", desc: "견적 항목 분해와 비교 팁" },
  { slug: "enc-셀프인테리어-체크리스트", title: "셀프 인테리어 체크리스트", desc: "어디까지 셀프·어디부터 업체" },
  { slug: "enc-아파트-리모델링-순서", title: "아파트 홈인테리어 시공 순서 가이드", desc: "철거·목공·전기·단열·마감 순서" },
  { slug: "enc-업체-선택-기준", title: "인테리어 부분시공 업체 선택 기준", desc: "견적서에서 확인해야 할 항목" },
];

export default function GuidePage() {
  return (
    <div>
      <section style={{ padding: "140px 24px 40px", textAlign: "center", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff" }}>
        <div className="gp-inner">
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.9 }}>ENCYCLOPEDIA</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: "12px 0 0" }}>시공백과</h1>
          <p style={{ marginTop: 12, fontSize: 15, opacity: 0.85 }}>
            아파트 홈인테리어 목공·단열 부분시공, 자재 비교, 업체 선택 기준까지 — 20년 경력 대표가 알려드립니다.
          </p>
        </div>
      </section>

      <section className="gp-section">
        <div className="gp-inner">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}`}
                className="gp-card tg-lift"
                style={{ padding: 24, textDecoration: "none", color: "inherit", display: "block" }}
              >
                <span style={{ display: "inline-block", padding: "4px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 12, fontWeight: 700, borderRadius: 999 }}>백과</span>
                <h2 style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: "#121212", lineHeight: 1.5 }}>{g.title}</h2>
                <p style={{ marginTop: 8, fontSize: 13, color: "#737373", lineHeight: 1.6 }}>{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
