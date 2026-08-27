import { NextResponse, type NextRequest } from "next/server";
import { normalizeLegacyEncodedPath } from "@/lib/seo/legacy-encoded-path";

/**
 * (Next 16 은 `middleware` 대신 `proxy` 이름을 쓴다 — 같은 자리, 같은 동작)
 *
 * 옛 한글 인코딩(EUC-KR) 주소를 바른 UTF-8 주소로 넘긴다.
 *
 * 왜 (2026-08-27 라이브 실측): `/blog/%C0%FC%B1%E2` 같은 옛 인코딩 주소가 **500** 이었다
 * (정상적으로 없는 주소는 404). 터지는 자리는 우리 코드가 아니라 **Next 자신의 params
 * 디코딩**이라 페이지에 try/catch 를 둘러도 안 없어진다 — 관문에서만 막힌다.
 * 그 주소들은 우리 실제 글이라, 바른 인코딩으로 열면 200 이 뜬다.
 *
 * ★목적지는 `new URL(request.url)` + pathname **세터**로만 만든다. 문자열로 조립하면
 *   해독 결과가 `//` 로 시작할 때 다른 도메인으로 튄다(오픈 리다이렉트). 세터는 호스트를 못 바꾼다.
 * ★1차는 302 + max-age=60 — 잘못된 301 은 방문자 브라우저에 박혀 되돌릴 수 없다.
 * ★되돌이는 구조적으로 불가 — 결과는 항상 바른 UTF-8 이라 다음 판정에서 걸러진다.
 */
export default function proxy(request: NextRequest) {
  const fixed = normalizeLegacyEncodedPath(request.nextUrl.pathname);
  if (!fixed) return NextResponse.next();
  const target = new URL(request.url);
  target.pathname = fixed;
  const res = NextResponse.redirect(target.toString(), 302);
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
}

export const config = {
  // 정적 자산·API 는 건드리지 않는다 — 거기까지 판정을 태울 이유가 없다.
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|images/|fonts/).*)"],
};
