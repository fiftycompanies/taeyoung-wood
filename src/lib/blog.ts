/**
 * REVRUN blog_posts reader (멀티테넌트).
 *
 * 중요: blog_posts 는 멀티테넌트 단일 테이블. 모든 쿼리는 반드시
 *  site_id=eq.<NEXT_PUBLIC_SITE_ID>
 * 로 강제 필터링되어야 다른 사이트 글이 새지 않습니다.
 *
 * 상태(status) 처리 — 2026-07-28 정본 결정 반영:
 *  목록/사이트맵은 published 만. **상세는 status 필터를 걸지 않고 visibility 로 판정**한다.
 *  archived(은퇴 보관) 글을 404 로 떨구면 네이버 캐시 등으로 들어오는 실제 방문자가 막다른 길로 끝나므로,
 *  200 + noindex 로 열어두고 색인만 뺀다. 하드 404 는 삭제/사고마킹에만.
 *  근거: thoughts/decisions/20260728-2015_archived글_응답정책_정본결정.md
 *  판정 정본: construction-factory/site-template/src/lib/seo/post-visibility.ts (아래는 그 상태단계 포트)
 *
 * 환경변수 누락 시 빈 배열 반환(graceful degrade) — 라우트는 유지하되 빈 목록.
 *
 * 실 스키마(2026-06 기준):
 *  id, site_id, slug, title, content, meta_description, images,
 *  status, published_at, generated_at, ...
 *  (excerpt/thumbnail_url/created_at 컬럼은 없음 — meta_description/images[0]/generated_at 대체)
 *
 * 정본 위치: site-cloner/_base/src/lib/blog.ts
 *  → 신규 클론 생성 시 이 파일이 src/lib/blog.ts로 복제됨.
 *  → 임의 수정 금지. 스키마 변경 시 이 정본만 갱신하고 모든 클론에 sync.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID;

/** images 컬럼은 jsonb 배열(객체 배열) — 첫 요소의 url 을 썸네일로 사용 */
type BlogImage = { url?: string; alt?: string } | string;

export type BlogPostRaw = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  images: BlogImage[] | null;
  published_at: string | null;
  generated_at: string | null;
  status?: string | null;
  audit_status?: string | null;
  quality_score?: { totalScore?: number } | null;
};

/** 노출 판정 결과 — 라우트가 robots 메타·보관 안내 배너를 결정하는 데 쓴다 */
export type BlogVisibility = {
  /** false 면 robots noindex */
  index: boolean;
  /** false 면 robots nofollow */
  follow: boolean;
  /** true 면 "보관된 글" 안내 배너 노출 */
  archived: boolean;
  /** true 면 본문을 렌더하지 않는다(미발행 본문 노출 방지) */
  bodyHidden: boolean;
  reason: string;
};

/** 페이지에서 쓰는 정제 타입 — excerpt/thumbnail_url/created_at 호환 별칭 제공 */
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
  visibility: BlogVisibility;
};

const NO_CONFIG_REASON =
  "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SITE_ID 가 설정되지 않음.";

function configured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON && SITE_ID);
}

async function rest<T>(path: string): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON!,
      Authorization: `Bearer ${SUPABASE_ANON!}`,
    },
    // ISR-friendly
    next: { revalidate: 300, tags: ["blog-posts"] },
  });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}`);
  return (await res.json()) as T;
}

function firstImageUrl(images: BlogImage[] | null): string | null {
  if (!images || images.length === 0) return null;
  const first = images[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && typeof first.url === "string") return first.url;
  return null;
}

// ── 노출 판정 (site-template post-visibility.ts 의 상태단계 포트) ──
//   품질 게이트(환각·soft404·점수<75)는 클론에 미포팅 — 별건 후속 과제.
const DRAFT_LIKE = new Set(["draft", "scheduled", "collected", "generating"]);
const ARCHIVED_LIKE = new Set(["archived", "paused", "needs_review", "failed", "preview"]);
const KNOWN_STATUS = new Set([...DRAFT_LIKE, ...ARCHIVED_LIKE, "published", "deleted"]);
const VERYLOW_SCORE = 40;

const VISIBLE = (over: Partial<BlogVisibility> & { reason: string }): BlogVisibility => ({
  index: false,
  follow: true,
  archived: false,
  bodyHidden: false,
  ...over,
});

/** null = 하드 제거(404). 그 외 = 200 으로 열되 robots/배너를 visibility 로 지시. */
function computeVisibility(row: BlogPostRaw): BlogVisibility | null {
  const status = row.status ?? "published";
  const audit = row.audit_status;

  // 모르는 상태 → 보수적으로 열되 색인·링크 모두 차단
  if (!KNOWN_STATUS.has(status)) return VISIBLE({ follow: false, reason: "unknown_status" });

  // 의도적 영구 삭제 → 하드 제거
  if (status === "deleted") return null;

  // 미발행/재생성 중 → 열되 본문은 감춘다(미발행 본문 노출 방지)
  if (DRAFT_LIKE.has(status)) {
    return VISIBLE({ follow: false, bodyHidden: true, reason: "draft" });
  }

  // 은퇴 보관 → 200 + noindex,follow (사고로 강제 마킹된 것만 하드 제거)
  if (ARCHIVED_LIKE.has(status)) {
    if (audit === "archived") return null;
    const score = row.quality_score?.totalScore;
    const veryLow = typeof score === "number" && score < VERYLOW_SCORE;
    return VISIBLE({ follow: !veryLow, archived: true, reason: veryLow ? "archived+verylow" : "archived" });
  }

  // 발행글 — 감사에서 제외된 것만 색인 차단
  if (audit === "duplicate" || audit === "noindex" || audit === "archived") {
    return VISIBLE({ archived: true, reason: "audit_excluded" });
  }
  return VISIBLE({ index: true, reason: "published" });
}

/**
 * 보관 안내·본문 대체 문구를 **content 에 직접 넣는다**(라우트 JSX 를 안 건드리기 위한 의도적 선택).
 *   클론 21곳의 블로그 라우트 JSX 가 제각각이라 배너 컴포넌트를 꽂으려면 21벌을 손봐야 한다.
 *   모든 클론이 content 를 dangerouslySetInnerHTML 로 그리므로, 여기서 넣으면 라우트 변경 없이 동일하게 보인다.
 *   클론 CSS 에 의존하지 않도록 인라인 스타일만 쓴다.
 */
const NOTICE = (text: string) =>
  `<aside style="margin:0 0 28px;padding:16px 20px;border:1px solid #e2e5ea;border-radius:12px;` +
  `background:#f4f5f7;color:#4b5563;font-size:14px;line-height:1.7;">${text}</aside>`;

const ARCHIVED_NOTICE = NOTICE(
  '보관된 글입니다. 최신 정보는 <a href="/blog" style="color:#2563eb;font-weight:700;">블로그 목록</a>에서 확인해 주세요.',
);
const DRAFT_NOTICE = NOTICE("본문을 준비 중입니다. 잠시 후 다시 확인해 주세요.");

function bodyFor(row: BlogPostRaw, v: BlogVisibility): string {
  if (v.bodyHidden) return DRAFT_NOTICE;
  return v.archived ? ARCHIVED_NOTICE + (row.content ?? "") : row.content;
}

function normalize(row: BlogPostRaw, visibility: BlogVisibility): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: bodyFor(row, visibility),
    excerpt: row.meta_description,
    thumbnail_url: firstImageUrl(row.images),
    published_at: row.published_at,
    // 정렬/표시용 fallback: published_at → generated_at
    created_at: row.published_at ?? row.generated_at ?? new Date().toISOString(),
    visibility,
  };
}

const SELECT_COLS =
  "id,slug,title,content,meta_description,images,published_at,generated_at";
/** 상세는 노출 판정에 필요한 상태 컬럼까지 읽는다 */
const SELECT_COLS_DETAIL = `${SELECT_COLS},status,audit_status,quality_score`;

/**
 * 목록 — site_id + published 강제 필터 + 최신 50개.
 * 목록/사이트맵은 발행글만. 보관글은 상세 URL 로 들어온 방문자에게만 열린다(색인 대상 아님).
 */
export async function listBlogPosts(): Promise<BlogPost[]> {
  if (!configured()) {
    console.warn(`[blog] ${NO_CONFIG_REASON} 빈 목록을 반환합니다.`);
    return [];
  }
  try {
    const rows = await rest<BlogPostRaw[]>(
      `blog_posts?select=${SELECT_COLS}` +
        `&site_id=eq.${SITE_ID}` +
        `&status=eq.published` +
        `&order=published_at.desc.nullslast,generated_at.desc` +
        `&limit=50`,
    );
    return rows.map((r) => normalize(r, VISIBLE({ index: true, reason: "published" })));
  } catch (err) {
    console.error("[blog] list failed", err);
    return [];
  }
}

/**
 * 상세 — status 필터 없이 읽고 visibility 로 판정한다.
 *   null 반환 = 하드 제거(라우트에서 notFound()): 삭제글 · 사고로 archived 마킹된 글.
 *   그 외는 200 으로 열되 `post.visibility` 가 robots/배너를 지시한다.
 *   ★라우트에 딱 한 줄이 필요하다 — `generateMetadata` 의 return 객체에 아래를 넣을 것.
 *     ...(post.visibility.index ? {} : { robots: { index: false, follow: post.visibility.follow } }),
 *     이 줄이 없으면 보관글이 200 으로 열리면서 **색인까지 돼 404 보다 나쁜 상태**가 된다.
 *   보관 안내·본문 대체 문구는 content 에 이미 들어 있으므로 라우트 JSX 는 손대지 않아도 된다.
 */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  if (!configured()) return null;
  try {
    // Next 16: on-demand 동적 라우트의 params.slug 가 URL-인코딩된 채로 전달될 수 있음.
    // 그대로 encodeURIComponent 하면 이중 인코딩 → 0건 → 404/500. 먼저 디코드해 정규화한다.
    // (디코드된 한글 slug 에는 '%' 가 없어 decodeURIComponent 는 no-op·안전. 깨진 입력은 원본 유지.)
    let decoded = slug;
    try { decoded = decodeURIComponent(slug); } catch { /* 원본 유지 */ }
    const rows = await rest<BlogPostRaw[]>(
      `blog_posts?select=${SELECT_COLS_DETAIL}` +
        `&site_id=eq.${SITE_ID}` +
        `&slug=eq.${encodeURIComponent(decoded)}` +
        `&limit=1`,
    );
    if (!rows[0]) return null;
    const visibility = computeVisibility(rows[0]);
    return visibility ? normalize(rows[0], visibility) : null;
  } catch (err) {
    console.error("[blog] detail failed", err);
    return null;
  }
}

/** 모든 published 글의 slug 리스트 — `generateStaticParams` 용 */
export async function getBlogSlugs(): Promise<{ slug: string; updated: string | null }[]> {
  const posts = await listBlogPosts();
  return posts.map((p) => ({ slug: p.slug, updated: p.published_at }));
}

/** content 가 인라인 스타일 HTML 이므로 안전하게 노출 전 정리 */
export function cleanBlogContent(html: string): string {
  let out = html;
  // 선행 <title> 제거 (REVRUN 자동생성 콘텐츠 컨벤션)
  out = out.replace(/^\s*<title>[\s\S]*?<\/title>\s*/i, "");
  // 미치환 {{markers}} 제거
  out = out.replace(/\{\{[^}]+\}\}/g, "");
  return out;
}
