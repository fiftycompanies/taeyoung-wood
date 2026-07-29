import { HomeCases } from "@/components/home/HomeCases";
import { HomeServices } from "@/components/home/HomeServices";
import { HomeProcess } from "@/components/home/HomeProcess";
import { HomeRegions } from "@/components/home/HomeRegions";
import { HomeCalculator } from "@/components/home/HomeCalculator";
import { HomeTips } from "@/components/home/HomeTips";
import { HomeFaq } from "@/components/home/HomeFaq";
import { HomeWhyUs } from "@/components/home/HomeWhyUs";

const PHONE_TEL = ["010", "8835", "7775"].join("");
const PHONE_DISPLAY = ["010", "8835", "7775"].join("-");

const HERO_BG = "https://bteilacnudezfwutirdm.supabase.co/storage/v1/object/public/site-images/intake/20260423/photo_358f3931-7d89-4823-8d6a-7d5467f2325e.jpg";

function PhoneIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const TRUST = ["20년 경력 전동현 대표 직접 시공", "셀프 인테리어 부분시공 특화", "실측 후 명확한 사전 견적", "목공·단열 원스톱", "서울·경기 전역"];

export default function Home() {
  return (
    <div className="gp-root">
      {/* Hero */}
      <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", alignItems: "center", background: "#1a1a1a" }}>
        <div
          className="hero-media hero-ken"
          style={{ position: "absolute", inset: 0, backgroundImage: `url('${HERO_BG}')`, backgroundSize: "cover", backgroundPosition: "center" }}
          aria-hidden
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(18,18,18,0.6), rgba(18,18,18,0.5) 50%, rgba(18,18,18,0.85))" }} aria-hidden />
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <div className="gp-hero-content">
            <div className="gp-hero-badge">
              <span className="gp-hero-pulse" />
              상담 가능 · 서울·경기 전역 시공
            </div>
            <h1 className="gp-hero-h1">
              아파트 홈인테리어<br />
              <span style={{ color: "#93bbff" }}>목공·단열 부분시공 전문</span>
            </h1>
            <p className="gp-hero-sub">
              20년 경력 전동현 대표가 직접, <strong>셀프 인테리어 고객</strong>에게 딱 맞는 부분시공
            </p>
            <div className="gp-hero-badges">
              <span className="gp-hero-badge-item">가벽·라인등·TV박스·히든도어</span>
              <span className="gp-hero-badge-item">일반 단열 시공</span>
              <span className="gp-hero-badge-item">서울·경기 전역</span>
            </div>
            <div className="gp-hero-ctas">
              <a href={`tel:${PHONE_TEL}`} className="gp-hero-cta-primary" aria-label={`전화 상담 ${PHONE_DISPLAY}`}>
                <PhoneIcon /> {PHONE_DISPLAY} 상담문의
              </a>
            </div>
            <div className="gp-hero-stats">
              <div style={{ textAlign: "center" }}>
                <div className="gp-hero-stat-num">20년</div>
                <div className="gp-hero-stat-label">현장 경력</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="gp-hero-stat-num">50 / 50</div>
                <div className="gp-hero-stat-label">목공·단열 비중</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="gp-hero-stat-num">부분시공</div>
                <div className="gp-hero-stat-label">셀프 인테리어 특화</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 24 }}>
              현장 사진 보내주시면 <strong>실측 견적</strong> 안내드립니다 · 바닥공사 제외
            </p>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="gp-trust">
        <div className="gp-trust-inner">
          {TRUST.map((t) => (
            <div key={t} className="gp-trust-item">
              <span className="gp-trust-check"><CheckIcon /></span>
              {t}
            </div>
          ))}
        </div>
      </div>

      <HomeCases />
      <BlogCallout />
      <HomeWhyUs />
      <HomeServices />
      <HomeProcess />
      <HomeRegions />
      <HomeCalculator />
      <HomeTips />
      <HomeFaq />
      <FinalCta />
    </div>
  );
}

function BlogCallout() {
  return (
    <section className="gp-section" style={{ background: "#f5f5f5" }}>
      <div className="gp-inner" style={{ textAlign: "center" }}>
        <h2 className="gp-h2">태영목공 네이버 블로그</h2>
        <p className="gp-sub">아파트 홈인테리어 시공 사례와 목공·단열 노하우를 확인하세요</p>
        <div style={{ marginTop: 24 }}>
          <a
            href="https://blog.naver.com/woodty"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#03c75a", color: "#fff", fontWeight: 700, borderRadius: 999, textDecoration: "none", boxShadow: "0 4px 20px rgba(3,199,90,0.35)" }}
          >
            네이버 블로그 바로가기 →
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="gp-cta-section" style={{ background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", padding: "96px 0", color: "#fff", textAlign: "center" }}>
      <div className="gp-inner">
        <h2 className="gp-h2" style={{ color: "#fff" }}>부분시공 상담 문의</h2>
        <p style={{ marginTop: 16, fontSize: 16, color: "rgba(255,255,255,0.85)" }}>대표가 직접 상담 · 실측 후 명확한 견적 안내</p>
        <div style={{ marginTop: 40 }}>
          <a
            href={`tel:${PHONE_TEL}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "20px 44px", background: "#fff", color: "#1B5BD8", fontSize: 22, fontWeight: 800, borderRadius: 999, textDecoration: "none", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
          >
            <PhoneIcon size={26} /> {PHONE_DISPLAY}
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
          현장 사진 보내주시면 실측 견적 안내드립니다 · 바닥공사는 진행하지 않습니다
        </p>
      </div>
    </section>
  );
}
