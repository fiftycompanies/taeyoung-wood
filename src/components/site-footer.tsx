"use client";

import Link from "next/link";

const REGIONS = ["서울 전역", "경기 전역", "수원시", "성남시", "용인시", "고양시", "안양시", "부천시"];
const SERVICES = ["아파트 홈인테리어", "가벽 시공", "라인등·간접등", "TV박스·아트월", "히든도어 제작", "일반 단열 시공"];

export function SiteFooter() {
  return (
    <footer className="gpf">
      <div className="gpf__inner">
        <div className="gpf__col--company">
          <div className="gpf__col-title" style={{ fontSize: 17, fontWeight: 800 }}>태영목공</div>
          <p className="gpf__desc">20년 경력의 목공·단열 전문가가 아파트 홈인테리어 부분시공을 셀프 인테리어 고객 눈높이에 맞춰 진행합니다. (정식 상호: 태영 인테리어)</p>
          <div className="gpf__info-row">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <a href={`tel:${["010","8835","7775"].join("")}`} style={{ color: "#1B5BD8", fontWeight: 600, textDecoration: "none" }}>{["010","8835","7775"].join("-")}</a>
          </div>
          <div className="gpf__info-row">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            평일 상담 · 예약 시공 (당일 상담 가능)
          </div>
          <div className="gpf__info-row">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            서울·경기 전역 시공
          </div>
        </div>

        <div>
          <div className="gpf__col-title">서비스</div>
          {SERVICES.map((s) => (
            <Link key={s} href="/#services" className="gpf__link">{s}</Link>
          ))}
          <Link href="/#services" className="gpf__link" style={{ color: "#1B5BD8", fontWeight: 600, marginTop: 4 }}>전체 서비스 →</Link>
        </div>

        <div>
          <div className="gpf__col-title">바로가기</div>
          <Link href="/#cases" className="gpf__link">시공사례</Link>
          <Link href="/#process" className="gpf__link">작업과정</Link>
          <Link href="/#calculator" className="gpf__link">견적문의</Link>
          <Link href="/#regions" className="gpf__link">서비스 지역</Link>
          <Link href="/guide" className="gpf__link">시공백과</Link>
          <Link href="/blog" className="gpf__link">블로그</Link>
          <a href="https://blog.naver.com/woodty" target="_blank" rel="noopener noreferrer" className="gpf__link">네이버 블로그 ↗</a>
          <Link href="/contact" className="gpf__link">상담문의</Link>
          <Link href="/#faq" className="gpf__link">FAQ</Link>
        </div>

        <div>
          <div className="gpf__col-title">회사정보</div>
          <div className="gpf__biz-info">
            상호: 태영 인테리어 (브랜드명: 태영목공)<br />
            대표: 전동현<br />
            사업자등록번호: 235-01-01000<br />
            주소: 경기도 수원시 장안구 장안로 232
          </div>
          <div className="gpf__col-title" style={{ marginTop: 20 }}>주요 지역</div>
          <div className="gpf__regions">
            {REGIONS.map((r) => <span key={r} className="gpf__region-tag">{r}</span>)}
          </div>
        </div>
      </div>

      <div className="gpf__bottom">
        <div className="gpf__copy">© 2026 태영 인테리어(태영목공). All rights reserved. · Powered by <a href="https://revrun.kr" target="_blank" rel="noopener noreferrer">REVRUN</a></div>
        <div className="gpf__legal">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </div>
      </div>
    </footer>
  );
}
