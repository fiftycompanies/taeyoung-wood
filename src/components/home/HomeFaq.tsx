"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "리모델링 전체가 아니라 가벽만, TV박스만 이런 부분시공도 되나요?",
    a: "네, 태영목공은 셀프 인테리어를 하시는 고객들에게 맞춘 부분시공이 주력입니다. '가벽 하나만', '천장 라인등만', '히든도어만' 같은 작은 범위도 편하게 상담 주세요.",
  },
  {
    q: "바닥공사도 함께 견적 낼 수 있나요?",
    a: "죄송하지만 바닥공사는 진행하지 않습니다. 벽·천장 목공, 그리고 일반 단열 시공에 집중하고 있어 사전에 안내드립니다. 바닥은 별도 업체를 통해 진행해 주셔야 합니다.",
  },
  {
    q: "단열 시공은 어떤 범위까지 가능한가요?",
    a: "일반 단열 시공(벽체·천장 등)을 진행합니다. 결로가 심한 벽면, 외기와 접한 방, 베란다 확장 후 냉기 이슈 등 부분 단열 보강에 적합합니다. 바닥 단열은 위와 같이 제외됩니다.",
  },
  {
    q: "서울·경기 어디까지 시공 가능한가요?",
    a: "본거지는 수원(경기 장안구)이지만 서울 전역, 경기 전역 모두 시공 상담 가능합니다. 지역·규모에 따라 시공 일정이 조정될 수 있어 먼저 전화로 상담 주세요.",
  },
  {
    q: "견적은 어떻게 진행되나요? 실측 없이도 가능한가요?",
    a: "정확한 견적을 위해서는 현장 실측이 원칙입니다. 다만 대략적인 참고 견적은 현장 사진과 원하는 시공 범위(예: '3.6m 가벽 1개', '거실 라인등 12m')를 문자로 보내주시면 안내드릴 수 있습니다.",
  },
  {
    q: "20년 경력이라고 하는데, 대표님이 직접 시공하시나요?",
    a: "네, 전동현 대표가 직접 현장에 나가 시공합니다. 큰 하청 없이 대표가 손대는 구조라, 셀프 인테리어 고객이 원하는 디테일을 그때그때 협의하며 진행할 수 있습니다.",
  },
];

export function HomeFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="gp-section" style={{ background: "#f5f5f5" }}>
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">FAQ</p>
          <h2 className="gp-h2">자주 묻는 질문</h2>
          <p className="gp-sub">고객님들이 가장 궁금해하시는 질문들</p>
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={f.q} className="reveal" style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #ebebeb" }}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  style={{ width: "100%", textAlign: "left", padding: "18px 22px", background: "transparent", border: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#121212", flex: 1 }}>Q. {f.q}</span>
                  <span style={{ color: "#1B5BD8", fontSize: 20, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} aria-hidden>⌄</span>
                </button>
                <div style={{ maxHeight: open ? 400 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                  <div style={{ padding: "0 22px 20px", color: "#555", fontSize: 14, lineHeight: 1.7 }}>
                    A. {f.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
