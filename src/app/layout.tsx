import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Website Clone",
  description: "Pixel-perfect website clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* GA4 — 공유 property(hostname 분리 수집). site-template layout.tsx 패턴 이식 (2026-07-08 21클론 태그누락 재발방지)
            정본=admin/src/lib/analytics-config.ts. 빈문자열 폴백 위해 || 사용(?? 금지) */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-YNQCYYYQ2S"} />
      </body>
    </html>
  );
}
