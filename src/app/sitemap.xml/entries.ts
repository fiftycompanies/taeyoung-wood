/**
 * ★이 파일은 원래 `src/app/sitemap.ts` 였다 (2026-08-10 W1 에서 그대로 옮겨 옴).
 *   본문은 손대지 않았다 — 이 사이트만의 경로·우선순위가 여기 들어 있다.
 *   XML 로 내보내는 일과 캐시 헤더는 옆의 `route.ts`(전 사이트 공통 정본)가 한다.
 *   아래에 `export const revalidate` 가 남아 있어도 **이 파일에서는 효력이 없다**
 *   (라우트 파일이 아니다). 신선도는 route.ts 의 `s-maxage=60` 이 정한다.
 */
import type { MetadataRoute } from "next";
import { SITE_URL, STATIC_ROUTES } from "@/lib/seo";
import { getBlogSlugs } from "@/lib/blog";

export const dynamic = "force-dynamic"; // 사이트맵은 요청 시 생성 — ISR 재생성이 라이브에서 안 돌아 옛 값이 굳었다(실측)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));

  // 블로그 — site_id 격리된 published 글만 (blog.ts 가 강제). 실패해도 sitemap 은 살린다.
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getBlogSlugs();
    blogEntries = slugs.map((s) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(s.slug)}`,
      lastModified: s.updated ? new Date(s.updated) : now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    blogEntries = [];
  }

  return [...staticEntries, ...blogEntries];
}
