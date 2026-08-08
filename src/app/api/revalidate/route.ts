/**
 * POST /api/revalidate — 클론 사이트 ISR 캐시 즉시 무효화.
 *
 * 왜 필요한가: 클론은 각자 독립 Vercel 프로젝트라 site-template 의 라우트가 안 붙는다.
 * 이 파일이 없으면 admin/스크립트가 DB 본문을 고쳐도 라이브는 ISR 만료(최대 1시간)까지 옛 글을 서빙하고,
 * 호출부는 404 를 조용히 삼켜 "갱신됐다"고 오인한다(2026-07-28 실측: 활성 51곳 중 30곳이 404).
 *
 * 계약은 site-template 정본과 동일하게 맞춘다(호출부 하나로 전 함대 커버):
 *   header: x-revalidate-secret = REVALIDATE_SECRET (양쪽 동일 값)
 *   body:   { paths?: string[], tags?: string[] }   // paths 없으면 ["/"]
 *   응답:   200 {ok,revalidated} / 401 불일치 / 400 잘못된 body / 503 secret 미설정
 *
 * 정본 위치: site-cloner/_base/src/app/api/revalidate/route.ts — 임의 수정 금지, 여기만 고치고 클론에 sync.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs"; // revalidatePath 는 Node.js 런타임 필요

export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    console.error("[revalidate] REVALIDATE_SECRET 미설정 — 엔드포인트 비활성");
    return NextResponse.json({ error: "service unavailable" }, { status: 503 });
  }
  if (req.headers.get("x-revalidate-secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { paths?: string[]; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const requested = Array.isArray(body.paths) && body.paths.length > 0 ? body.paths : ["/"];
  // 외부 URL·빈 문자열 차단
  const paths = requested.filter((p) => typeof p === "string" && p.startsWith("/") && p.length < 200);
  // ★리터럴 경로엔 type 을 붙이지 않는다(Next 16 문서: "literal path 면 type 을 생략").
  //   붙이면 무효화 태그가 `_N_T_<path>/page` 가 되는데, 라우트 핸들러의 실제 태그는
  //   `_N_T_/sitemap.xml/route` 라 /sitemap.xml purge 가 **조용히 아무 일도 안 했다**(라이브 실측).
  for (const p of paths) {
    if (p.includes("[")) revalidatePath(p, "page"); // 동적 세그먼트는 type 필수
    else revalidatePath(p);
  }

  const tags = (Array.isArray(body.tags) ? body.tags : []).filter(
    (t) => typeof t === "string" && t.length > 0 && t.length < 100
  );
  // Next.js 16: 외부 호출자(어드민)가 즉시 반영을 원하면 `{ expire: 0 }` 이 정석(공식 문서).
  //   "default" 프로파일은 stale 표시만 해서 다음 방문까지 옛 값이 나간다.
  for (const t of tags) revalidateTag(t, { expire: 0 });

  return NextResponse.json({
    ok: true,
    revalidated: { paths, tags },
    timestamp: new Date().toISOString(),
  });
}
