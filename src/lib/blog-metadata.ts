import type { Metadata } from "next";

type MetadataPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  image?: string | null;
};

export function blogMetadata(post: MetadataPost, siteUrl: string): Metadata {
  const url = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ko_KR",
      siteName: "태영목공",
      title: `${post.title} | 태영목공`,
      description: post.excerpt ?? undefined,
      url,
      images: [{ url: post.image || "/images/hero.jpg", alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | 태영목공`,
      description: post.excerpt ?? undefined,
      images: [post.image || "/images/hero.jpg"],
    },
  };
}
