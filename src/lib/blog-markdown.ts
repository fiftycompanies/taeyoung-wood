/**
 * 마크다운 원고 → 화면용 HTML (외부 의존성 없음).
 *
 * 왜 필요한가 — 백과사전형 자동생성 글(`engine_version=encyclopedia_v1_batch`)은 생성 프롬프트가
 * "마크다운 본문"을 명시 요구하는 계약이라 본문이 마크다운으로 저장된다. 공용 템플릿은 marked 로
 * 변환해 그리는데 클론에는 변환기가 없어 `## 제목`·`**굵게**` 가 라이브에 그대로 보였다
 * (2026-08-18 실측: papershred 2편 · pohang-skyforest 1편 · family-auto-camping 1편).
 *
 * 왜 직접 쓰나 — 클론 27곳에 의존성과 lockfile 을 늘리지 않기 위해. 우리 생성기가 실제로 쓰는
 * 문법만 다룬다. 실측(마크다운 본문 932편): 표·목록·인용·링크·굵게·H1~H3 는 쓰고,
 * 코드펜스 0건 · 원시 HTML 태그 0건.
 *
 * 품질 기준은 marked(공용 템플릿이 쓰는 정본) 대비 동등 이상 — 같은 932편 실측에서
 * 잔여 결함이 제목 0/0 · 표 0/0 · 목록 0/0 · 굵게 0/157 · 링크 0/5 (내 변환기/marked).
 */

/**
 * 마크다운으로 그려야 하는 본문인가.
 *
 * ★HTML 태그가 하나라도 있으면 무조건 false — 지금 정상으로 보이는 글(HTML 본문 2,484편)의
 * 렌더 경로를 절대 건드리지 않기 위한 보수적 판정이다. 마크다운 경로는 태그가 0개인 본문에만 탄다.
 */
export function isMarkdownContent(src: string): boolean {
  if (!src.trim()) return false;
  return !/<(p|h[1-6]|div|section|article|blockquote|figure|ul|ol|li|table|strong|em|img|br)[ >/]/i.test(src);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 인라인 문법(굵게·기울임·코드·링크). 이스케이프 이후에 돌린다. */
function inline(s: string): string {
  let out = escapeHtml(s);
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
  return out;
}

function isTableDelimiter(line: string): boolean {
  return line.includes("|") && line.includes("-") && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}

/** 마크다운 → HTML. 우리 생성기가 쓰는 문법만 처리한다. */
export function markdownToHtml(src: string): string {
  let text = src.replace(/\r\n?/g, "\n");

  // HTML 주석(`<!-- IMG -->` · `<!-- CTA:quality -->` 등)은 파이프라인이 심어둔 자리표시다.
  // 이스케이프에 걸리면 화면에 글자로 튀어나오므로(실측 932편 중 907편 해당) 변환 전에
  // 치워뒀다가 끝나고 제자리에 그대로 되돌린다 — 사진 주입 단계가 평소처럼 이 마커를 집게 한다.
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

  return out.join("\n").replace(/zzCOMMENT(\d+)zz/g, (_m, n: string) => comments[Number(n)] ?? "");
}
