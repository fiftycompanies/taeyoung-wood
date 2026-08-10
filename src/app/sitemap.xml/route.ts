/**
 * sitemap.xml — Route Handler 정본 (2026-08-10, W1)
 *
 * 왜 `app/sitemap.ts`(metadata 규약)를 안 쓰나:
 *   metadata 라우트에서는 응답 헤더를 붙일 수 없다(실측 확정). 그래서 라이브 25곳이
 *   `cache-control: public, max-age=0, must-revalidate` 로 나갔고, 1회차·2회차 모두
 *   `x-vercel-cache: MISS` 였다 — **인증 없는 주소가 요청마다 45+ 사이트 공용 DB를 친다**(율제한 0).
 *   Route Handler 로 옮기면 헤더를 직접 붙일 수 있어 CDN 이 받아 준다.
 *
 * 신선도: `s-maxage=60` 이라 최대 60초 지연. 발행 직후 반영 요구(W4)와 충돌하지 않는다.
 *
 * ★사이트별 목록은 이 파일에 적지 않는다. 옆의 `entries.ts` 가 그 사이트의 원래
 *   `app/sitemap.ts` 본문을 **그대로 옮겨 온 것**이다(손으로 다시 쓰지 않는다 —
 *   다시 쓰면 그 사이트의 개별 경로·우선순위가 조용히 사라진다).
 */
import entries from "./entries";

export const runtime = "nodejs";
export const revalidate = 60;

type Entry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: string;
  priority?: number;
};

const XML_ESCAPE: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
};
const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPE[c]);

/**
 * 주소의 경로를 sitemaps.org 규격대로 퍼센트 인코딩한다.
 *
 * ★두 번 인코딩하지 않는 것이 핵심 — 25곳 중 4곳은 이미 `encodeURIComponent` 를 하고 있었고
 *   21곳은 한글 원문 그대로였다. 한 번 디코드한 뒤 다시 인코딩하면 두 경우가 같은 답으로 모인다.
 *   (같은 함정을 `lib/blog.ts` 조회 쪽에서 이미 겪었다: 이중 인코딩 → 0건 → 404)
 */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.pathname = u.pathname
      .split("/")
      .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
      .join("/");
    return u.toString();
  } catch {
    return raw;
  }
}

const iso = (v: Entry["lastModified"]): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export async function GET() {
  let items: Entry[] = [];
  try {
    items = (await entries()) as Entry[];
  } catch {
    // ★빈 사이트맵을 200 으로 내보내면 검색엔진이 "글이 없어졌다"로 읽는다.
    //   조회가 깨진 것과 글이 없는 것은 다르므로, 깨졌을 땐 503 으로 알린다(CDN 캐시 금지).
    return new Response("sitemap temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = items
    .map((e) => {
      const parts = [`    <loc>${escapeXml(normalizeUrl(e.url))}</loc>`];
      const lm = iso(e.lastModified);
      if (lm) parts.push(`    <lastmod>${lm}</lastmod>`);
      if (e.changeFrequency) parts.push(`    <changefreq>${escapeXml(e.changeFrequency)}</changefreq>`);
      if (typeof e.priority === "number") parts.push(`    <priority>${e.priority}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
