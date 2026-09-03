/**
 * 마크다운 원고 → 화면용 HTML (외부 의존성 없음).
 *
 * 왜 필요한가 — 백과사전형 자동생성 글(`engine_version=encyclopedia_v1_batch`)은 생성 프롬프트가
 * "마크다운 본문"을 명시 요구하는 계약이라 본문이 마크다운으로 저장된다. 공용 템플릿은 marked 로
 * 변환해 그리는데 클론에는 변환기가 없어 `## 제목`·`**굵게**` 가 라이브에 그대로 보였다
 * (2026-08-18 실측: papershred 2편 · pohang-skyforest 1편 · family-auto-camping 1편).
 *
 * ★2026-09-03 재봉합 — 8/18 판은 **사진이 들어간 글을 못 잡았다**.
 *   그때의 판정은 "HTML 태그가 하나라도 있으면 마크다운이 아니다" 였는데, 우리 파이프라인은
 *   사진을 본문 안에 `<div><img ...></div>` 로 꽂아 넣는다. 그래서 **사진 한 장이 들어가는 순간
 *   변환이 통째로 꺼져** 원고 기호가 손님 화면에 그대로 나갔다(라이브 전수 실측: 84편·11곳).
 *   반대로 사진이 `<!-- IMG -->` 자리표시로만 있던 글은 변환은 됐지만 **사진이 0장**이었다(37편).
 *   → 판정을 "확실한 마크다운 마커가 있으면 태그가 섞여 있어도 마크다운"으로 바꾸고,
 *     변환기가 **HTML 덩어리를 건드리지 않고 통과**시키며, 자리표시를 실제 사진으로 채운다.
 *
 * 왜 직접 쓰나 — 클론 31곳에 의존성과 lockfile 을 늘리지 않기 위해. 우리 생성기가 실제로 쓰는
 * 문법만 다룬다. 실측(마크다운 본문 932편): 표·목록·인용·링크·굵게·H1~H3 는 쓰고, 코드펜스 0건.
 */

/** 줄 시작에 오는, HTML 본문엔 우연히 나오지 않는 마크다운 블록 마커 */
const MD_HEADING = /(^|\n)#{2,6} \S/;
const MD_TABLE_DELIM = /(^|\n)[ \t]*\|[\s:|-]*-{3,}[\s:|-]*\|/;

/** 본문이 HTML 문서로 시작하는가 — 그런 글은 예전부터 HTML 그대로 그려 왔고 건드리지 않는다. */
const HTML_FIRST = /^\s*<(p|h[1-6]|div|section|article|blockquote|figure|ul|ol|table)[ >/]/i;

/** 어떤 HTML 태그든 들어 있는가 (8/18 판의 판정 — 마커가 없을 때의 폴백으로 남긴다) */
const ANY_TAG = /<(p|h[1-6]|div|section|article|blockquote|figure|ul|ol|li|table|strong|em|img|br)[ >/]/i;

/** 줄 전체가 HTML 블록인가 — 그 줄은 변환하지 않고 그대로 흘려보낸다. */
const BLOCK_LINE =
  /^\s*<\/?(div|figure|figcaption|img|picture|video|iframe|table|thead|tbody|tr|td|th|ul|ol|li|p|h[1-6]|section|article|blockquote|hr)\b/i;

/**
 * 마크다운으로 그려야 하는 본문인가.
 *
 * ① 본문이 HTML 로 시작하면 → 아니다(기존 HTML 경로 유지).
 * ② 줄 시작 `## …` 나 표 구분줄이 있으면 → 맞다. **태그가 섞여 있어도** 맞다(9/3 봉합의 핵심).
 * ③ 둘 다 아니면 → 태그가 하나도 없을 때만 맞다(8/18 판의 보수적 판정 유지).
 *
 * 라이브 전수 대조(2026-09-03, 활성 사이트 발행글 2,920편): 이 규칙으로 경로가 바뀌는 글은
 * **109편**이고 전부 지금 깨져 있는 글이다. ①에 걸려 그대로 남는 애매한 글은 **0편**이었다.
 */
export function isMarkdownContent(src: string): boolean {
  if (!src.trim()) return false;
  if (HTML_FIRST.test(src)) return false;
  if (MD_HEADING.test(src) || MD_TABLE_DELIM.test(src)) return true;
  return !ANY_TAG.test(src);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 인라인 처리 중 실제 태그를 잠시 빼둘 자리표시 — 본문에 나올 수 없는 모양이어야 한다. */
const KEEP_OPEN = "zzTAG";
const KEEP_CLOSE = "zz";

/**
 * 인라인 문법(굵게·기울임·코드·링크). 이스케이프 이후에 돌린다.
 * ★본문에 이미 있는 인라인 태그(`<strong>`·`<a>`·`<br>`)는 이스케이프에 걸리면 글자로 튀어나오므로
 *   먼저 빼두었다가 끝나고 되돌린다 — 안 그러면 강조·링크가 통째로 글자가 된다.
 */
function inline(s: string): string {
  const kept: string[] = [];
  let out = s.replace(/<\/?[a-zA-Z][^>]*>/g, (m) => {
    kept.push(m);
    return `${KEEP_OPEN}${kept.length - 1}${KEEP_CLOSE}`;
  });
  out = escapeHtml(out);
  // 이미지는 본문에 넣지 않는다(생성 프롬프트가 금지 · 사진은 images 컬럼에서 별도 주입).
  out = out.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // 링크. 주소 자리가 주소가 아니면(설명이 잘못 들어간 실데이터가 있다) 글자만 남긴다 —
  // 원고 기호를 화면에 그대로 노출하는 것보다 낫다.
  out = out.replace(/\[([^\]\n]+)\]\(([^)\n]*)\)/g, (_m, text: string, href: string) => {
    const url = href.trim();
    // escapeHtml 이후라 주소의 & 는 이미 &amp; — 속성값으로 그대로 안전하다.
    return /^(https?:\/\/|\/|#|mailto:|tel:)[^\s]*$/i.test(url) ? `<a href="${url}">${text}</a>` : text;
  });
  out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // 굵게를 먼저, 그 다음 기울임. 별표가 홀로 남은 실데이터가 있어 기울임은
  // "앞뒤가 별표가 아닌 한 쌍"일 때만 잡는다(빈 <em> 방지).
  out = out.replace(/\*\*+([^*\n]+?)\*\*+/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");
  // 짝을 못 찾고 남은 별표는 화면에 기호로 보이므로 지운다.
  out = out.replace(/\*{1,}/g, "");
  return out.replace(new RegExp(`${KEEP_OPEN}(\\d+)${KEEP_CLOSE}`, "g"), (_m, n: string) => kept[Number(n)] ?? "");
}

function isTableDelimiter(line: string): boolean {
  return line.includes("|") && line.includes("-") && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

/** images 컬럼(jsonb) 한 칸에서 주소를 꺼낸다 — 문자열이거나 `{url}` 객체다. */
function imageUrl(item: unknown): string | null {
  if (typeof item === "string") return item.trim() || null;
  if (item && typeof item === "object") {
    const u = (item as { url?: unknown }).url;
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return null;
}

function imgTag(src: string, alt: string): string {
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" class="rounded-xl my-6" />`;
}

/**
 * `<!-- IMG -->` 자리표시를 실제 사진으로 채운다 — **HTML 본문에도** 쓴다.
 *
 * ★HTML 로 저장된 글에도 이 자리표시가 남아 있다(라이브 실측 24편, calmstone 등).
 *   주석이라 화면엔 안 보이지만 그 자리에 들어갔어야 할 사진이 영영 안 들어간다.
 *   마크다운 경로만 고치면 이 글들은 계속 사진 0장으로 남는다.
 */
export function fillImgPlaceholders(html: string, images?: unknown[]): string {
  // ★사진 목록을 아예 안 받았으면(undefined) 자리표시를 **그대로 둔다** — 뒤에 자체 치환
  //   단계를 가진 클론(papershred)이 있어, 여기서 지우면 그 단계가 채울 것을 잃는다.
  if (images === undefined) return html;
  if (!/<!--\s*IMG\s*-->/i.test(html)) return html;
  const pool = images.map(imageUrl).filter((u): u is string => !!u);
  let i = 0;
  return html.replace(/<!--\s*IMG\s*-->/gi, () => {
    const url = pool[i];
    if (!url) return ""; // 목록은 받았는데 채울 사진이 모자라면 자리표시를 지운다
    i++;
    return imgTag(url, "");
  });
}

/**
 * HTML 본문에 새어나온 인라인 마크다운 기호를 정리한다.
 *
 * ★HTML 로 저장된 글에도 `**굵게**` 가 섞여 손님 화면에 별표째 보인다(라이브 실측 18편).
 *   태그 **바깥의 글자 부분만** 손대야 속성값(예: `alt="**"`)이 깨지지 않는다.
 */
export function sanitizeInlineMarkdown(html: string): string {
  if (!/\*\*/.test(html)) return html;
  return html
    .split(/(<[^>]+>)/)
    .map((chunk, idx) =>
      idx % 2 === 1
        ? chunk // 태그는 그대로
        : chunk.replace(/\*\*+([^*\n]+?)\*\*+/g, "<strong>$1</strong>").replace(/\*{2,}/g, ""),
    )
    .join("");
}

/**
 * 마크다운 → HTML. 우리 생성기가 쓰는 문법만 처리한다.
 *
 * @param images 글의 사진 목록(`blog_posts.images`). 주면 `<!-- IMG -->` 자리표시를 실제 사진으로
 *   채운다. 자리표시가 사진보다 많으면 남는 자리표시는 지운다 — 주석이라 화면엔 안 보이지만
 *   그 자리에 들어갔어야 할 사진이 영영 안 들어간다(라이브 37편이 그 상태였다).
 */
export function markdownToHtml(src: string, images?: unknown[]): string {
  let text = src.replace(/\r\n?/g, "\n");

  const pool = (images ?? []).map(imageUrl).filter((u): u is string => !!u);
  let poolIdx = 0;

  // HTML 주석(`<!-- IMG -->` · `<!-- CTA:quality -->` 등)은 파이프라인이 심어둔 자리표시다.
  // 이스케이프에 걸리면 화면에 글자로 튀어나오므로 변환 전에 치워뒀다가 끝나고 되돌린다.
  const comments: string[] = [];
  text = text.replace(/<!--[\s\S]*?-->/g, (m) => {
    comments.push(m);
    return `zzCOMMENT${comments.length - 1}zz`;
  });

  // 페이지가 제목을 이미 <h1> 로 그린다 — 원고 첫 줄의 H1 은 중복이라 뺀다.
  // 단 줄바꿈이 빠져 본문까지 한 줄에 붙어 있는 옛 글이 있어(실측 17편), 제목이라 보기 힘들
  // 만큼 길면 `#` 기호만 떼고 본문으로 살린다 — 통째로 지우면 수백 자가 사라진다.
  text = text.replace(/^\s*#\s+([^\n]*)\n?/, (_m, head: string) => (head.length <= 100 ? "" : `${head}\n`));

  const lines = text.split("\n");
  const out: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    out.push(`<p>${inline(para.join("\n")).replace(/\n/g, "<br />")}</p>`);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      flushPara();
      continue;
    }

    // ★줄 전체가 HTML 블록이면 손대지 않고 그대로 흘려보낸다 — 본문에 주입된 사진이
    //   문단으로 감싸이거나 이스케이프되지 않게 한다(9/3 봉합).
    if (BLOCK_LINE.test(line)) {
      flushPara();
      out.push(line);
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      // 페이지의 <h1> 아래로 한 단계 낮춰 배치한다(최소 h2).
      const level = Math.min(Math.max(heading[1].length, 2), 6);
      out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      continue;
    }

    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
      flushPara();
      out.push("<hr />");
      continue;
    }

    // 표 — 헤더 줄과 구분 줄이 연달아 올 때만 표로 본다.
    if (line.trim().startsWith("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      flushPara();
      const head = splitRow(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        body.push(splitRow(lines[i]));
        i++;
      }
      i--;
      const th = head.map((c) => `<th>${inline(c)}</th>`).join("");
      const rows = body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`);
      continue;
    }

    // 목록 — 같은 종류가 이어지는 동안 한 덩어리로 묶는다.
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushPara();
      const ordered = !!numbered;
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered ? /^\s*\d+\.\s+(.*)$/.exec(lines[i]) : /^\s*[-*+]\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(`<li>${inline(m[1].trim())}</li>`);
        i++;
      }
      i--;
      out.push(`<${ordered ? "ol" : "ul"}>${items.join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }

    // 인용
    if (/^\s*>\s?/.test(line)) {
      flushPara();
      const quoted: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      i--;
      out.push(`<blockquote>${inline(quoted.join("\n")).replace(/\n/g, "<br />")}</blockquote>`);
      continue;
    }

    para.push(line);
  }
  flushPara();

  // 주석 복원 — 이때 `<!-- IMG -->` 는 실제 사진으로 바꾼다.
  return out.join("\n").replace(/zzCOMMENT(\d+)zz/g, (_m, n: string) => {
    const raw = comments[Number(n)] ?? "";
    if (!/^<!--\s*IMG\s*-->$/i.test(raw.trim())) return raw;
    // ★사진 목록을 안 받았으면 자리표시를 그대로 돌려준다 — 뒤에 자체 치환 단계를 가진
    //   클론(papershred)이 있어, 여기서 지우면 그 단계가 채울 것을 잃는다.
    if (images === undefined) return raw;
    const url = pool[poolIdx];
    if (!url) return ""; // 목록은 받았는데 채울 사진이 모자라면 자리표시를 지운다
    poolIdx++;
    return imgTag(url, "");
  });
}
