import type { MetadataRoute } from "next";
import { SITE_URL, STATIC_ROUTES } from "@/lib/seo";
import { getBlogSlugs } from "@/lib/blog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
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
