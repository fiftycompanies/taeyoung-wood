import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
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
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-YNQCYYYQ2S"} />
      </body>
    </html>
  );
}
