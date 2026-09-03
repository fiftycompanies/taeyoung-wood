import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, cleanBlogContent } from "@/lib/blog";
import { BLOG_POSTS as STATIC_POSTS } from "@/lib/blog-data";

type Props = { params: Promise<{ slug: string }> };

// Supabase 상세는 status 필터 없이 visibility 판정 → ISR 로 5분 재검증.
export const revalidate = 300;
// Supabase 발행 글은 사전 정적 파라미터 밖에서도 200 으로 열려야 함
export const dynamicParams = true;

const PHONE_TEL = ["010", "8835", "7775"].join("");
const PHONE_DISPLAY = ["010", "8835", "7775"].join("-");

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export async function generateStaticParams() {
  // 프리뷰용: 정적 목록만 프리렌더. Supabase 글은 dynamicParams=true 로 요청 시 렌더.
  return STATIC_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const supa = await getBlogPostBySlug(decoded);
  if (supa) {
    return {
      title: `${supa.title} | 태영목공`,
      description: supa.excerpt ?? undefined,
      ...(supa.visibility.index
        ? {}
        : { robots: { index: false, follow: supa.visibility.follow } }),
    };
  }
  const staticPost = STATIC_POSTS.find((p) => p.slug === decoded);
  if (!staticPost) return { title: "블로그 | 태영목공" };
  return { title: `${staticPost.title} | 태영목공`, description: staticPost.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const supa = await getBlogPostBySlug(decoded);

  // 1순위: Supabase 발행/보관글 → 실 콘텐츠 렌더(dangerouslySetInnerHTML + prose)
  if (supa) {
    const label = supa.visibility.archived ? "보관" : "블로그";
    return (
      <article>
        <section style={{ padding: "140px 24px 40px", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <Link href="/blog" style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textDecoration: "none" }}>← 블로그 목록으로</Link>
            <p style={{ marginTop: 20, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", opacity: 0.9 }}>{label}</p>
            <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 800, lineHeight: 1.3 }}>{supa.title}</h1>
            <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>{fmtDate(supa.published_at ?? supa.created_at)}</div>
          </div>
        </section>

        <section className="gp-section">
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
            <div className="prose" dangerouslySetInnerHTML={{ __html: cleanBlogContent(supa.content, supa.images ?? undefined) }} />
            <div style={{ marginTop: 40, padding: 24, background: "#f5f5f5", borderRadius: 12 }}>
              <strong>부분시공 견적이 필요하신가요?</strong>
              <p style={{ marginTop: 8, color: "#555" }}>현장 사진과 원하는 시공 범위를 문자로 보내주시면 참고 견적 안내드립니다. 확정 견적은 실측 후 진행.</p>
              <a href={`tel:${PHONE_TEL}`} style={{ display: "inline-flex", marginTop: 16, padding: "12px 24px", background: "#1B5BD8", color: "#fff", fontWeight: 700, borderRadius: 999, textDecoration: "none" }}>
                {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </article>
    );
  }

  // 2순위: Supabase 미주입/미발행 → 정적 프리뷰 목록에서 조회
  const staticPost = STATIC_POSTS.find((p) => p.slug === decoded);
  if (!staticPost) notFound();

  return (
    <article>
      <section style={{ padding: "140px 24px 40px", background: "linear-gradient(135deg, #1B5BD8, #0f3a99)", color: "#fff" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <Link href="/blog" style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textDecoration: "none" }}>← 블로그 목록으로</Link>
          <p style={{ marginTop: 20, fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", opacity: 0.9 }}>{staticPost.category}</p>
          <h1 style={{ marginTop: 12, fontSize: 32, fontWeight: 800, lineHeight: 1.3 }}>{staticPost.title}</h1>
          <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>{staticPost.date} · {staticPost.read}</div>
        </div>
      </section>

      <section className="gp-section">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px", fontSize: 16, lineHeight: 1.8, color: "#333" }}>
          <p>{staticPost.excerpt}</p>
          <p style={{ marginTop: 20 }}>
            이 글은 태영목공(태영 인테리어) 전동현 대표가 20년 현장 경험을 바탕으로 작성한 안내입니다.
            자세한 내용은 <a href={`tel:${PHONE_TEL}`} style={{ color: "#1B5BD8", fontWeight: 700 }}>{PHONE_DISPLAY}</a>으로 문의해 주세요.
          </p>
          <div style={{ marginTop: 40, padding: 24, background: "#f5f5f5", borderRadius: 12 }}>
            <strong>부분시공 견적이 필요하신가요?</strong>
            <p style={{ marginTop: 8, color: "#555" }}>현장 사진과 원하는 시공 범위를 문자로 보내주시면 참고 견적 안내드립니다. 확정 견적은 실측 후 진행.</p>
            <a href={`tel:${PHONE_TEL}`} style={{ display: "inline-flex", marginTop: 16, padding: "12px 24px", background: "#1B5BD8", color: "#fff", fontWeight: 700, borderRadius: 999, textDecoration: "none" }}>
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
