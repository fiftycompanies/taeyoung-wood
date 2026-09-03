import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingCta } from "@/components/floating-cta";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  OG_IMAGE,
  localBusinessJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { CtaTracker } from "@/components/CtaTracker";

export const metadata: Metadata = {
  // ★네이버 서치어드바이저 소유확인 (2026-09-03 발급 · taeyoung-interior.revrun.kr).
  //   이 클론은 어드민 DB 를 안 읽으므로 값을 여기 직접 둔다.
  other: { "naver-site-verification": "5c8ef426a86328e73322cf14765b87007099fe50" },
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 20년 경력 아파트 홈인테리어 목공·단열 전문`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    title: `${SITE_NAME} — 20년 경력 아파트 홈인테리어 목공·단열 전문`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "ko_KR",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body className="tmpl-gana-pro min-h-full flex flex-col font-sans">
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important;filter:none!important}`}</style></noscript>
        <SiteHeader />
        <main style={{ flex: 1 }}>{children}</main>
        <CtaTracker />
        <SiteFooter />
        <FloatingCta />
        <ScrollReveal />
        {/* GA4 — 공유 property(hostname 별 분리 수집). 측정ID 정본 = admin/src/lib/analytics-config.ts.
            ★쿠키 범위를 자기 호스트로 고정 — 기본값(auto)은 `.revrun.kr` 에 심겨 다른 고객사 사이트와
            방문자·세션이 섞인다(2026-08-09 GA4 실측: 52곳에서 방문자 35.9% 중복). */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-YNQCYYYQ2S"}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID || "G-YNQCYYYQ2S"}',{cookie_domain:location.hostname})`}
        </Script>
      </body>
    </html>
  );
}
