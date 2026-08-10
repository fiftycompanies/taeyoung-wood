/**
 * sitemap.xml — Route Handler 정본 (2026-08-10, W1)
 *
 * 왜 `app/sitemap.ts`(metadata 규약)를 안 쓰나:
 *   metadata 라우트에서는 응답 헤더를 붙일 수 없다(실측 확정). 그래서 라이브 25곳이
 *   `cache-control: public, max-age=0, must-revalidate` 로 나갔고, 1회차·2회차 모두
 *   `x-vercel-cache: MISS` 였다 — **인증 없는 주소가 요청마다 45+ 사이트 공용 DB를 친다**(율제한 0).
 *   Route Handler 로 옮기면 헤더를 직접 붙일 수 있어 CDN 이 받아 준다.
 *
 * ★`force-dynamic` 이 반드시 있어야 한다 (2026-08-10 딥리뷰가 잡은 회귀).
 *   처음엔 `revalidate = 60` 만 뒀는데, 이 라우트는 요청 정보를 안 쓰므로 Next 가
 *   **빌드 시점에 통째로 정적 파일로 구워** 버렸다. 라이브 실측 —
 *     papershred: `age` 2,677→2,818초로 단조 증가, `last-modified` 가 배포시각에 고정
 *     monti     : 같은 증상 (age 2,545초)
 *     haebit    : `PRERENDER`→`HIT`, age 0 부터 다시 셈 (여기만 재검증이 돌았다)
 *   즉 클론마다 갈렸고, 대부분은 **다음 배포 전까지 사이트맵이 굳는다.**
 *   옮기기 전(metadata 규약)에는 매 요청 MISS 라 항상 최신이었으니 **신선도 회귀**였다.
 *   옮겨 온 `entries.ts` 에 `export const dynamic = "force-dynamic"` 이 적혀 있고
 *   그 옆 주석이 "ISR 재생성이 라이브에서 안 돌아 옛 값이 굳었다(실측)"인 사이트가 있는데,
 *   파일을 옮기면서 그 선언이 **효력을 잃은 것**이 원인이다. 여기서 되살린다.
 *
 * 신선도: 핸들러는 요청마다 돌되 CDN 이 `s-maxage=60` 으로 받아 준다
 *   → 사용자는 최대 60초 지연, 공용 DB 는 엣지당 60초에 한 번만 맞는다(원래 노린 것).
 *
 * ★사이트별 목록은 이 파일에 적지 않는다. 옆의 `entries.ts` 가 그 사이트의 원래
 *   `app/sitemap.ts` 본문을 **그대로 옮겨 온 것**이다(손으로 다시 쓰지 않는다 —
 *   다시 쓰면 그 사이트의 개별 경로·우선순위가 조용히 사라진다).
 */
import entries from "./entries";

export const runtime = "nodejs";
// ★`revalidate` 를 쓰지 않는다 — 위 주석대로 정적으로 구워져 사이트맵이 굳는다.
export const dynamic = "force-dynamic";

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

/** 조회가 깨졌을 때의 응답 — CDN·브라우저 어디에도 남기지 않는다. */
const unavailable = () =>
  new Response("sitemap temporarily unavailable", {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET() {
  let items: Entry[] = [];
  try {
    items = (await entries()) as Entry[];
  } catch (e) {
    console.error("[sitemap] entries() 실패", e);
    return unavailable();
  }

  // ★이 검사의 **한계를 정확히 적어 둔다** (2026-08-10 딥리뷰 지적 — 렌즈 6개가 같은 곳을 짚었다).
  //   위 catch 는 사실상 안 탄다. `lib/blog.ts` 의 목록 조회가 실패를 **삼키고 빈 배열**을 돌려주기 때문이다
  //   ("전부 버리면 사이트맵에서 블로그가 통째로 사라진다"는 그쪽 주석의 의도).
  //   그래서 여기서 막을 수 있는 것은 **한 건도 없는 경우**뿐이다 —
  //   정적 경로는 조회와 무관하게 항상 있으므로, 0건이면 그건 "글이 없다"가 아니라 "무언가 깨졌다"이다.
  //   ⚠️ 못 막는 것: 정적 경로는 나오는데 **블로그만 0건**인 부분 실패.
  //      그건 이 파일이 아니라 함대 감시(사이트맵 URL 수 급감 알림)가 잡는 몫이다.
  //      여기서 "블로그 0건 = 실패"로 단정하면 **글이 아직 없는 신규 사이트가 통째로 503** 이 된다.
  if (items.length === 0) {
    console.error("[sitemap] 항목 0건 — 정적 경로조차 없다(조회 실패로 판정)");
    return unavailable();
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
