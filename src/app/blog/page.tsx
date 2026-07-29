import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/blog";
import { BLOG_POSTS as STATIC_POSTS } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "블로그 | 태영목공",
  description:
    "태영목공 블로그 - 아파트 홈인테리어 목공·단열 부분시공 노하우를 제공합니다.",
};

// ISR: Supabase 목록을 5분 주기로 재검증. 부하 최소화.
export const revalidate = 300;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default async function BlogListPage() {
  // 1순위: Supabase(site_id 격리·published 필터·최신 50).
  // env 미주입/사이트 라이브 전에는 빈 배열 → 클론 초기 프리뷰용 STATIC_POSTS 로 폴백.
  const supaPosts = await listBlogPosts();
  const useSupa = supaPosts.length > 0;

  return (
    <div>
      <section style={{ padding: "140px 24px 40px", textAlign: "center", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff" }}>
        <div className="gp-inner">
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", opacity: 0.9 }}>BLOG</p>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: "12px 0 0" }}>블로그</h1>
          <p style={{ marginTop: 12, fontSize: 15, opacity: 0.85 }}>태영목공 블로그 - 아파트 홈인테리어 목공·단열 부분시공 노하우를 제공합니다.</p>
        </div>
      </section>

      <section className="gp-section">
        <div className="gp-inner">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {useSupa
              ? supaPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="gp-card tg-lift"
                    style={{ padding: 24, textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <span style={{ display: "inline-block", padding: "4px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                      태영목공
                    </span>
                    <h2 style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: "#121212", lineHeight: 1.5 }}>{p.title}</h2>
                    {p.excerpt ? (
                      <p style={{ marginTop: 8, fontSize: 13, color: "#737373", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.excerpt}
                      </p>
                    ) : null}
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
                      <span>{fmtDate(p.published_at ?? p.created_at)}</span>
                    </div>
                  </Link>
                ))
              : STATIC_POSTS.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="gp-card tg-lift"
                    style={{ padding: 24, textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <span style={{ display: "inline-block", padding: "4px 10px", background: "#eef4ff", color: "#1B5BD8", fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                      {p.category}
                    </span>
                    <h2 style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: "#121212", lineHeight: 1.5 }}>{p.title}</h2>
                    <p style={{ marginTop: 8, fontSize: 13, color: "#737373", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.excerpt}</p>
                    <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
                      <span>{p.date}</span>
                      <span>{p.read}</span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}
