/**
 * 옛 한글 인코딩(EUC-KR/CP949) 주소를 **바른 UTF-8 주소로 바로잡는다**.
 *
 * 왜 (2026-08-27 라이브 실측):
 *   `https://<사이트>/blog/%BE%E7%BE%E7-%B5%B6%C3%A4-mqy416f3` 같은 요청에 **모든 사이트가
 *   500** 을 냈다(정상적으로 없는 주소는 404). 30일간 26종·51건·6곳(자체도메인
 *   gjh-law.com·airconclean24.com 포함). 그 주소들은 **우리 실제 글**이다 — 같은 글을
 *   UTF-8 로 인코딩해 열면 200 이 뜬다. 즉 옛 링크·크롤러가 찾아오는데 우리가
 *   서버 오류로 돌려보내고 있었다.
 *
 * ★터지는 자리는 우리 코드가 아니라 **Next 자신의 params 디코딩**이다. 그래서 페이지에
 *   try/catch 를 둘러도 안 없어진다 — `/area/…`·`/services/…`·한 칸짜리 경로도 똑같이 500 인데
 *   그 라우트들은 `decodeURIComponent` 를 한 줄도 안 쓴다. 봉합 자리는 **관문(proxy) 하나뿐**이다.
 *
 * ★DB 를 보지 않는다. 「해독해서 찾아보고 있으면 보낸다」로 만들면 조회 1왕복과 새 실패 경로가
 *   생기고, 못 찾았을 때 어디로 보낼지가 또 판단거리가 된다. 여기서는 **주소 표기만 바로잡고**
 *   그 뒤는 원래 라우팅에 맡긴다 — 글이 있으면 200, 없으면 우리 404. 둘 다 500 보다 낫다.
 */

/** 퍼센트 인코딩 조각을 바이트열로. `%` 가 아닌 문자는 그대로 한 바이트로 본다. */
function percentToBytes(segment: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < segment.length; ) {
    if (segment[i] === "%") {
      const hex = segment.slice(i + 1, i + 3);
      if (hex.length < 2 || !/^[0-9A-Fa-f]{2}$/.test(hex)) return new Uint8Array();
      out.push(Number.parseInt(hex, 16));
      i += 3;
    } else {
      out.push(segment.charCodeAt(i) & 0xff);
      i += 1;
    }
  }
  return new Uint8Array(out);
}

/** 이미 바른 UTF-8 인가. 바르면 손대지 않는다 — 정상 한글 주소를 건드리면 그게 새 사고다. */
function isValidUtf8Percent(segment: string): boolean {
  try {
    decodeURIComponent(segment);
    return true;
  } catch {
    return false;
  }
}

/** 못 믿을 결과 — 깨진 문자(U+FFFD)나 제어문자가 섞였으면 해독을 신뢰하지 않는다. */
const UNTRUSTWORTHY = /[\uFFFD\u0000-\u001F\u007F]/;

/**
 * 경로를 바로잡아 돌려준다. 바로잡을 게 없으면 `null`(그대로 흘려보낸다).
 *
 * 판정 순서가 곧 안전장치다:
 *   ① 퍼센트 인코딩이 없으면 볼 것도 없다
 *   ② 이미 바른 UTF-8 이면 **손대지 않는다**
 *   ③ EUC-KR 로도 못 읽으면 그 조각은 그대로 — 억지로 고치면 엉뚱한 주소를 만든다
 *   ④ 읽었는데 깨진 문자·제어문자가 섞였으면 그 조각은 그대로
 *   ⑤ 결과가 입력과 같으면 `null` — **되돌이 리다이렉트를 구조적으로 막는다**
 */
export function normalizeLegacyEncodedPath(pathname: string): string | null {
  if (!/%[0-9A-Fa-f]{2}/.test(pathname)) return null; // ①

  let changed = false;
  const decoder = new TextDecoder("euc-kr", { fatal: true });

  const fixed = pathname
    .split("/")
    .map((seg) => {
      if (!seg || !/%[0-9A-Fa-f]{2}/.test(seg)) return seg;
      if (isValidUtf8Percent(seg)) return seg; // ②
      let ko: string;
      try {
        ko = decoder.decode(percentToBytes(seg)); // ③
      } catch {
        return seg;
      }
      if (!ko || UNTRUSTWORTHY.test(ko)) return seg; // ④
      changed = true;
      return encodeURIComponent(ko);
    })
    .join("/");

  if (!changed || fixed === pathname) return null; // ⑤
  return fixed;
}
