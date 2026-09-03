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
import { isMarkdownContent, markdownToHtml, fillImgPlaceholders, sanitizeInlineMarkdown } from "@/lib/blog-markdown";

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
  /** 왜 보관했나 — our_fault(사실오류) 는 본문을 주지 않는다. */
  archive_reason?: string | null;
  /** 환각 목록은 색인 차단 판정에 쓴다(2건 이상 = 사실 신뢰 불가) */
  quality_score?: { totalScore?: number; hallucinations?: unknown[] } | null;
  /** 이미 검색에 올라갔나 — 점수 게이트 예외 재료(2026-08-27). 조회에서 빠지면 예외가 조용히 꺼진다. */
  indexed_google?: boolean | null;
  indexed_naver?: boolean | null;
  index_coverage_state?: string | null;
  /** 한 번이라도 검색에 있었음을 관측한 시각 — **래치**(DB 트리거가 채우고 절대 안 지운다). */
  index_seen_at?: string | null;
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
  /** 사진 목록 원본 — 본문의 `<!-- IMG -->` 자리표시를 채우는 데 쓴다(2026-09-03). */
  images: BlogImage[] | null;
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
const DRAFT_LIKE = new Set(["draft", "scheduled", "collected", "generating"]);
const ARCHIVED_LIKE = new Set(["archived", "paused", "needs_review", "failed", "preview"]);
const KNOWN_STATUS = new Set([...DRAFT_LIKE, ...ARCHIVED_LIKE, "published", "deleted"]);
const VERYLOW_SCORE = 40;
// 품질 게이트 상수 — 정본(site-template/src/lib/seo/post-visibility.ts)과 같은 값.
// 임계는 env 로 조정 가능하되 클론에는 env 가 없으므로 기본 75 고정.
const QUALITY_NOINDEX_THRESHOLD = 75;
const HALLUCINATION_BLOCK_MIN = 2;
const SOFT_404_MIN_CONTENT = 500;
const SOFT_404_PLACEHOLDER_MIN = 3;
/**
 * 이미 검색에 올라가 있나 — 점수 게이트의 **예외 조건**(kk 2026-08-27 「유입이나 색인이 있으면 빼지 말자」).
 * ★부분일치 금지: `"Crawled - currently not indexed"` 안에도 `indexed` 가 들어 있어 판정이 뒤집힌다.
 *   실제 쓰이는 값만 나열하고, 목록 밖은 색인 아님으로 본다(fail-closed).
 * 정본: construction-factory/site-template/src/lib/seo/post-visibility.ts (alreadyIndexed)
 */
const GSC_INDEXED_STATES = new Set(["submitted and indexed", "indexed, not submitted in sitemap"]);
function alreadyIndexed(row: {
  indexed_google?: boolean | null;
  indexed_naver?: boolean | null;
  index_coverage_state?: string | null;
  /** 한 번이라도 검색에 있었음을 관측한 시각 — **래치**(DB 트리거가 채우고 절대 안 지운다). */
  index_seen_at?: string | null;
}): boolean {
  // ★래치가 정본 — 「지금 색인돼 있나」만 보면 우리가 이미 뺀 글이 안 돌아오고, 억지로 되살리면 깜빡인다.
  if (row.index_seen_at) return true;
  return (
    row.indexed_google === true ||
    row.indexed_naver === true ||
    GSC_INDEXED_STATES.has((row.index_coverage_state ?? "").trim().toLowerCase())
  );
}

const PLACEHOLDER_RE = /\[추후 보완\]|\[placeholder\]|\bTODO\b|\bFIXME\b|XXX:/gi;

const VISIBLE = (over: Partial<BlogVisibility> & { reason: string }): BlogVisibility => ({
  index: false,
  follow: true,
  archived: false,
  bodyHidden: false,
  ...over,
});

/** null = 하드 제거(404). 그 외 = 200 으로 열되 robots/배너를 visibility 로 지시. */
/** 사이트맵 경로는 본문을 싣지 않으므로 content 없이도 판정할 수 있어야 한다(정본과 같은 설계). */
type VisibilityInput = Pick<BlogPostRaw, "status" | "audit_status" | "archive_reason" | "quality_score" | "indexed_google" | "indexed_naver" | "index_coverage_state" | "index_seen_at"> & {
  content?: string | null;
};

function computeVisibility(row: VisibilityInput): BlogVisibility | null {
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
    // ★사실오류로 내린 글(our_fault)은 본문을 주지 않는다 — noindex 는 읽기·인용을 막지 않는다.
    //   2026-08-05 에 템플릿엔 들어갔는데 클론 일부에 빠져 있었다(2026-08-08 이식).
    if (row.archive_reason === "our_fault") return null;
    const score = row.quality_score?.totalScore;
    const veryLow = typeof score === "number" && score < VERYLOW_SCORE;
    return VISIBLE({ follow: !veryLow, archived: true, reason: veryLow ? "archived+verylow" : "archived" });
  }

  // 발행글 — 감사에서 제외된 것만 색인 차단
  if (audit === "duplicate" || audit === "noindex" || audit === "archived") {
    return VISIBLE({ archived: true, reason: "audit_excluded" });
  }

  // ── 품질 게이트 (2026-08-08 이식) ──────────────────────────────────
  //   이 자리에 원래 "품질 게이트는 클론에 미포팅 — 별건 후속 과제" 라고 적혀 있었다.
  //   그 사이 라이브에서 **21~40점짜리 글이 `index, follow` 로 나가고 있었고**
  //   그중 일부는 구글이 실제로 색인했다(2026-08-08 실측: 클론 13곳 72편, 40점 미만 30편, 색인 19편).
  //   템플릿 사이트는 같은 조건에서 noindex 인데 클론만 열려 있어, 같은 회사 사이트가
  //   서로 다른 품질 기준으로 검색에 나가고 있었다.
  //   정본: construction-factory/site-template/src/lib/seo/post-visibility.ts (규칙 6·7·8)

  //   (6) 환각 2건 이상 — 사실이 틀린 글이므로 링크도 넘기지 않는다
  const hallucinations = row.quality_score?.hallucinations;
  if (Array.isArray(hallucinations) && hallucinations.length >= HALLUCINATION_BLOCK_MIN) {
    return VISIBLE({ follow: false, reason: "hallucination_gate" });
  }

  //   (7) Soft 404 — 본문이 너무 짧거나 미완성 표시가 많다.
  //       content 가 없으면(목록·사이트맵 경로) 길이를 모르므로 판정하지 않는다.
  //   ★`!== undefined` 로 판정한다(정본과 동일) — `typeof === "string"` 이면 content 가 null 인 글이
  //     검사를 건너뛰어 **빈 본문이 색인 허용**으로 새어 나간다. 사이트맵 경로는 본문을 안 실으므로
  //     undefined 로 들어와 여기서 자연히 스킵된다(정본과 같은 설계).
  if (row.content !== undefined) {
    const len = (row.content || "").length;
    const placeholders = ((row.content || "").match(PLACEHOLDER_RE) || []).length;
    if (len < SOFT_404_MIN_CONTENT || placeholders >= SOFT_404_PLACEHOLDER_MIN) {
      return VISIBLE({ reason: "soft_404" });
    }
  }

  //   (8) 품질 점수 미달 — 색인만 막고 링크는 넘긴다(자산 보존)
  const score = row.quality_score?.totalScore;
  //   ★이미 검색에 올라간 글은 점수로 빼지 않는다(kk 2026-08-27 · alreadyIndexed 머리말).
  if (typeof score === "number" && score < QUALITY_NOINDEX_THRESHOLD && !alreadyIndexed(row)) {
    return VISIBLE({ reason: "low_quality" });
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
    images: row.images ?? null,
    published_at: row.published_at,
    // 정렬/표시용 fallback: published_at → generated_at
    created_at: row.published_at ?? row.generated_at ?? new Date().toISOString(),
    visibility,
  };
}

const SELECT_COLS =
  "id,slug,title,content,meta_description,images,published_at,generated_at";
/** 상세는 노출 판정에 필요한 상태 컬럼까지 읽는다 */
const SELECT_COLS_DETAIL = `${SELECT_COLS},status,audit_status,quality_score,indexed_google,indexed_naver,index_coverage_state,index_seen_at`;

/**
 * 목록 — site_id + published 강제 필터 + 최신 50개.
 * 목록/사이트맵은 발행글만. 보관글은 상세 URL 로 들어온 방문자에게만 열린다(색인 대상 아님).
 */
/**
 * 목록에 실을 최대 글 수 (2026-08-10 W3 — 50 → 100).
 *
 * ★글 상세에 다른 글로 가는 링크가 **하나도 없다**(라이브 실측). 이 목록이 글에 닿는
 *   유일한 내부 경로라, 상한을 넘긴 글은 사이트맵에만 있고 사이트 안에서는 못 가는 고아 글이 된다.
 * ★임시 방편이다 — 100 도 발행이 빠른 사이트는 몇 달이면 닿는다. 진짜 해법은 목록 페이지네이션인데
 *   목록 화면이 사이트마다 달라 기계 적용이 안 된다(별건).
 */
const LIST_LIMIT = 100;

export async function listBlogPosts(): Promise<BlogPost[]> {
  if (!configured()) {
    console.warn(`[blog] ${NO_CONFIG_REASON} 빈 목록을 반환합니다.`);
    return [];
  }
  try {
    // ★목록도 **판정기를 통과시킨다** (2026-08-22 실사고).
    //   예전엔 status=published 만 보고 무조건 「노출」로 못박아, 숨김(audit_status=noindex)
    //   처리한 글이 **개별 페이지에선 noindex 인데 목록에는 그대로 남았다**.
    //   판정을 두 벌 두면 한쪽만 옛날이 된다 — 상세와 같은 computeVisibility 하나만 쓴다.
    const rows = await rest<BlogPostRaw[]>(
      `blog_posts?select=${SELECT_COLS_DETAIL}` +
        `&site_id=eq.${SITE_ID}` +
        `&status=eq.published` +
        `&order=published_at.desc.nullslast,generated_at.desc` +
        `&limit=${LIST_LIMIT}`,
    );
    return rows
      .map((r) => {
        const v = computeVisibility(r);
        return v && v.index ? normalize(r, v) : null;
      })
      .filter((p): p is BlogPost => p !== null);
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

/**
 * 모든 published 글의 slug — 사이트맵 · `generateStaticParams` 용. **상한 없음.**
 *
 * ★목록(listBlogPosts)의 `limit=50` 을 재사용하면 51편째부터 사이트맵에서 소리 없이 사라진다.
 *   그래서 이 경로만 offset 페이지네이션으로 전량을 읽는다(목록의 50건은 UI 의도라 그대로 둔다).
 * ★끊는 조건이 `rows.length < PAGE_SIZE` 이면 서버(PostgREST)의 max-rows 가 PAGE_SIZE 보다
 *   작을 때 첫 페이지에서 조용히 잘린다. 그래서 **받은 건수만큼 offset 을 밀고 0건이 올 때까지** 돈다.
 * ★order 에 id 를 넣어 동순위 정렬이 페이지마다 흔들려 글이 중복·누락되는 것을 막는다.
 */
const SLUG_PAGE_SIZE = 200;
const SLUG_MAX_PAGES = 50; // 폭주 방지 — 최대 10,000편

/** 사이트맵용 조회 행 — 본문은 싣지 않는다(정본도 사이트맵에서 soft404 를 판정하지 않는다). */
type SlugRow = Pick<BlogPostRaw, "slug" | "published_at" | "status" | "audit_status" | "quality_score" | "indexed_google" | "indexed_naver" | "index_coverage_state" | "index_seen_at"> & {
  sitemap_lastmod?: string | null;
};

export async function getBlogSlugs(): Promise<{ slug: string; updated: string | null }[]> {
  if (!configured()) {
    console.warn(`[blog] ${NO_CONFIG_REASON} 빈 slug 목록을 반환합니다.`);
    return [];
  }
  const out: { slug: string; updated: string | null }[] = [];
  const seen = new Set<string>();
  try {
    let offset = 0;
    for (let page = 0; page < SLUG_MAX_PAGES; page++) {
      const rows = await rest<SlugRow[]>(
        // ★사이트맵도 상세 페이지와 **같은 판정기**를 통과한 글만 싣는다(2026-08-09).
        //   품질 게이트를 상세에만 붙였던 동안 사이트맵은 저품질 글까지 제출하고 페이지는 noindex 라
        //   서치콘솔에 "제출된 URL 이 noindex" 경고가 쌓였다(papershred 라이브 실측: 표본 6편 중 3편).
        //   본문(content)은 일부러 안 싣는다 — 정본도 사이트맵에서는 soft404 를 판정하지 않는다.
        `blog_posts?select=slug,published_at,sitemap_lastmod,status,audit_status,quality_score,indexed_google,indexed_naver,index_coverage_state,index_seen_at` +
          `&site_id=eq.${SITE_ID}` +
          `&status=eq.published` +
          `&order=published_at.desc.nullslast,generated_at.desc,id.asc` +
          `&limit=${SLUG_PAGE_SIZE}` +
          `&offset=${offset}`,
      );
      if (rows.length === 0) break;
      for (const r of rows) {
        if (r.slug && !seen.has(r.slug)) {
          seen.add(r.slug);
          if (!computeVisibility(r)?.index) continue; // 색인 불가 글은 사이트맵에서 제외
          out.push({ slug: r.slug, updated: r.sitemap_lastmod ?? r.published_at });
        }
      }
      offset += rows.length;
      // ★상한에 닿아 끊기는 것을 침묵시키면 "51편째가 소리 없이 사라진다"를 1만편 자리에 다시 만든다.
      if (page === SLUG_MAX_PAGES - 1 && rows.length === SLUG_PAGE_SIZE) {
        console.error(
          `[blog] slug 조회가 페이지 상한(${SLUG_MAX_PAGES}×${SLUG_PAGE_SIZE})에 닿아 잘렸다 — 사이트맵이 불완전하다`,
        );
      }
    }
  } catch (err) {
    // 부분이라도 돌려준다 — 전부 버리면 사이트맵에서 블로그가 통째로 사라진다.
    console.error("[blog] slugs failed", err);
  }
  return out;
}

/** content 가 인라인 스타일 HTML 이므로 안전하게 노출 전 정리 */
export function cleanBlogContent(html: string, images?: unknown[]): string {
  let out = html;
  // 선행 <title> 제거 (REVRUN 자동생성 콘텐츠 컨벤션)
  out = out.replace(/^\s*<title>[\s\S]*?<\/title>\s*/i, "");
  // 미치환 {{markers}} 제거
  out = out.replace(/\{\{[^}]+\}\}/g, "");
  // 본문이 마크다운 원고면 화면용 HTML 로 바꾼다(백과사전형 글). 태그가 하나라도 있으면
  // 기존 HTML 경로 그대로 — 지금 정상인 글의 렌더를 건드리지 않기 위한 보수적 분기.
  //   ★2026-09-03: images 를 함께 넘긴다 — 안 넘기면 `<!-- IMG -->` 자리표시가 안 채워진다.
  if (isMarkdownContent(out)) {
    out = markdownToHtml(out, images);
  } else {
    out = fillImgPlaceholders(out, images);
    out = sanitizeInlineMarkdown(out);
  }
  return out;
}
