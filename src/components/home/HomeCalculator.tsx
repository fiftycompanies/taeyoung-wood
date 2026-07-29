"use client";

import { useState } from "react";
import Link from "next/link";

const SERVICES = [
  { key: "partition", icon: "🧱", label: "가벽 시공" },
  { key: "tvbox", icon: "📺", label: "TV박스·아트월" },
  { key: "lineLight", icon: "💡", label: "라인등·간접등" },
  { key: "hiddenDoor", icon: "🚪", label: "히든도어" },
  { key: "molding", icon: "🪞", label: "몰딩·마감" },
  { key: "wall", icon: "🧊", label: "벽체 단열" },
  { key: "ceiling", icon: "☁️", label: "천장 단열" },
  { key: "veranda", icon: "🪟", label: "베란다 결로 단열" },
  { key: "etc", icon: "🛠", label: "기타 부분시공" },
];

const SEVERITY = [
  { key: "light", label: "소규모", desc: "한 벽/한 면 정도" },
  { key: "medium", label: "중규모", desc: "방 1~2개 부분시공" },
  { key: "heavy", label: "대규모", desc: "거실+주방 등 넓은 범위" },
];

const BUILDINGS = [
  { key: "apt_s", icon: "🏢", label: "아파트 24평 이하" },
  { key: "apt_m", icon: "🏬", label: "아파트 25~40평" },
  { key: "apt_l", icon: "🏛", label: "아파트 40평+ · 주택" },
];

// 아주 러프한 참고값 (반드시 현장 실측 후 확정 견적)
function estimate(svc: string, sev: string, bld: string): string {
  if (!svc || !sev || !bld) return "";
  const base: Record<string, [number, number]> = {
    partition: [40, 120], tvbox: [50, 180], lineLight: [30, 90], hiddenDoor: [60, 180],
    molding: [20, 80], wall: [40, 150], ceiling: [50, 180], veranda: [30, 100], etc: [20, 100],
  };
  const b = base[svc] || [30, 100];
  const sevMul = sev === "medium" ? 1.6 : sev === "heavy" ? 2.4 : 1;
  const bldMul = bld === "apt_m" ? 1.15 : bld === "apt_l" ? 1.35 : 1;
  const lo = Math.round(b[0] * sevMul * bldMul);
  const hi = Math.round(b[1] * sevMul * bldMul);
  return `${lo}만원 ~ ${hi}만원`;
}

export function HomeCalculator() {
  const [svc, setSvc] = useState("");
  const [sev, setSev] = useState("");
  const [bld, setBld] = useState("");
  const result = estimate(svc, sev, bld);

  return (
    <section id="calculator" className="gp-calc">
      <div className="gp-inner">
        <div className="gp-reveal gp-section-header">
          <p className="gp-label">COST CALCULATOR</p>
          <h2 className="gp-h2">예상 견적 참고 계산기</h2>
          <p className="gp-sub">시공 종류·범위·평형에 따른 참고 견적 범위입니다 (확정 견적은 실측 후)</p>
        </div>
        <div className="gp-calc-panel reveal">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>부분시공 참고 견적</h3>

          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <span className="gp-calc-step-num">1</span>
              <strong style={{ fontSize: 15 }}>시공 종류</strong>
            </div>
            <div className="gp-calc-grid">
              {SERVICES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSvc(s.key)}
                  className="gp-calc-chip"
                  style={svc === s.key ? { borderColor: "#1B5BD8", background: "#eef4ff" } : undefined}
                  aria-pressed={svc === s.key}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <span className="gp-calc-step-num">2</span>
              <strong style={{ fontSize: 15 }}>시공 범위</strong>
            </div>
            <div className="gp-calc-grid">
              {SEVERITY.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSev(s.key)}
                  className="gp-calc-chip"
                  style={sev === s.key ? { borderColor: "#1B5BD8", background: "#eef4ff" } : undefined}
                  aria-pressed={sev === s.key}
                >
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "#737373", marginTop: 4 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <span className="gp-calc-step-num">3</span>
              <strong style={{ fontSize: 15 }}>평형</strong>
            </div>
            <div className="gp-calc-grid">
              {BUILDINGS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBld(b.key)}
                  className="gp-calc-chip"
                  style={bld === b.key ? { borderColor: "#1B5BD8", background: "#eef4ff" } : undefined}
                  aria-pressed={bld === b.key}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{b.icon}</div>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32, padding: 24, background: "#eef4ff", borderRadius: 12, textAlign: "center" }}>
            {result ? (
              <>
                <div style={{ fontSize: 13, color: "#1B5BD8", fontWeight: 700 }}>참고 견적 범위</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#121212", marginTop: 4 }}>{result}</div>
                <div style={{ fontSize: 12, color: "#737373", marginTop: 8 }}>자재·현장 조건에 따라 변동됩니다. 확정 견적은 실측 후 안내.</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#737373" }}>세 가지 항목을 모두 선택하시면 참고 견적 범위가 표시됩니다.</div>
            )}
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Link
              href="/calculator"
              style={{ display: "inline-flex", padding: "14px 28px", background: "#1B5BD8", color: "#fff", fontWeight: 700, borderRadius: 999, textDecoration: "none" }}
            >
              상세 견적문의 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
