"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { label: "서비스", href: "/#services" },
  { label: "작업과정", href: "/#process" },
  { label: "시공사례", href: "/#cases" },
  { label: "견적문의", href: "/calculator" },
  { label: "블로그", href: "/blog" },
  { label: "문의", href: "/contact" },
  { label: "FAQ", href: "/#faq" },
  { label: "서비스지역", href: "/#regions" },
];

const PHONE = ["010", "8835", "7775"].join("-");
const PHONE_TEL = ["010", "8835", "7775"].join("");

function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={`gph ${solid ? "gph--solid" : "gph--transparent"}`}>
        <div className="gph__inner">
          <Link href="/" className="gph__logo">
            <span className="gph__logo-text">태영목공</span>
          </Link>
          <nav className="gph__nav" aria-label="주 메뉴">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="gph__link">
                {n.label}
              </Link>
            ))}
            <a href={`tel:${PHONE_TEL}`} className="gph__cta gph__cta-desktop">
              <PhoneIcon /> 즉시상담
            </a>
          </nav>
          <button
            type="button"
            className="gph__burger"
            aria-label="메뉴 열기"
            aria-expanded={open}
            aria-controls="gph-mobile-menu"
            onClick={() => setOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <div
        className={`gph__mobile-overlay ${open ? "gph__mobile-overlay--open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        id="gph-mobile-menu"
        className={`gph__mobile-menu ${open ? "gph__mobile-menu--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
      >
        <div className="gph__mobile-top">
          <span style={{ fontSize: 16, fontWeight: 700 }}>태영목공</span>
          <button
            type="button"
            className="gph__mobile-close"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="gph__mobile-links">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="gph__mobile-link" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="gph__mobile-cta">
          <a href={`tel:${PHONE_TEL}`}>
            <PhoneIcon /> {PHONE} 전화상담
          </a>
        </div>
      </div>
    </>
  );
}
