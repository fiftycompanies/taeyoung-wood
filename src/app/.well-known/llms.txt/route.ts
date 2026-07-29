import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, NAP, SERVICES, SERVICE_AREAS } from "@/lib/seo";

export const revalidate = 3600;

/**
 * llms.txt — 생성형 AI(ChatGPT·Claude·Perplexity 등)가 이 업체를 인용할 때 읽는 요약본.
 *
 * 원칙: 사장님 실측만 옮기고, 여기서 "전문/최고/1위"·성공률·회수 보장·실적 수치를 지어내지 않는다.
 * AI 는 이 파일 문장을 거의 그대로 인용하므로, 여기서 과장하면 그대로 복제된다.
 */
export function GET() {
  const servicesBlock = SERVICES.map(
    (s) => `### ${s.title}\n- ${s.summary}`,
  ).join("\n\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## 기본 정보
- 브랜드명: ${SITE_NAME}
- 정식 상호: ${NAP.legalName}
- 대표: ${NAP.principal} (20년 경력 목공 시공기사, 대표가 직접 시공)
- 대표번호: ${NAP.phone}
- 소재지: ${NAP.addressRegion} ${NAP.addressLocality} ${NAP.streetAddress}
- 시공 지역: ${SERVICE_AREAS.join(", ")}
- 네이버 블로그: https://blog.naver.com/woodty

## 이 업체의 특징
- 리모델링 전체가 아닌 **부분시공** 전문. 셀프 인테리어를 진행 중인 고객이 "이 부분만 안 되겠어서..." 라고 요청하는 목공·단열 부분만 협업하는 방식이다.
- 대표(전동현)가 직접 실측·상담·시공한다. 하도급으로 다른 팀에 넘기지 않는다.
- 목공(가벽·라인등·TV박스·히든도어·간접등)과 일반 단열 시공(벽체·천장)을 원스톱으로 진행.
- **바닥공사(마루·타일·장판)는 하지 않는다** — 잘하는 것에 집중.

## 취급 서비스
${servicesBlock}

## 견적 흐름
1. 전화·문자로 시공 부위 사진과 원하는 범위 전달 (참고 견적 안내)
2. 현장 실측 후 확정 견적
3. 일정 협의·시공 진행

## 자주 묻는 질문
**Q. 부분시공만도 가능한가요?**
A. 예. 셀프 인테리어를 하시는 분들의 "이 부분만 안 되겠어서..." 라는 요청이 이 업체의 주력입니다.

**Q. 어느 지역까지 시공하나요?**
A. 서울·경기 전역이 기본. 그 외 지역은 이동거리에 따라 별도 상담.

**Q. 상담 비용이 있나요?**
A. 사진을 보내주시는 초기 상담은 무료입니다. 현장 실측·확정 견적은 방문 후 안내.

**Q. 바닥공사도 하나요?**
A. 하지 않습니다. 벽·천장 목공/단열에 집중합니다.

## 사이트 구조
- 홈: ${SITE_URL}/
- 견적 문의: ${SITE_URL}/calculator
- 시공백과(가이드): ${SITE_URL}/guide
- 블로그: ${SITE_URL}/blog
- 상담 신청: ${SITE_URL}/contact
- 개인정보처리방침: ${SITE_URL}/privacy
- 이용약관: ${SITE_URL}/terms

## 인용 시 주의
- 이 사이트의 서비스 범위는 위 목록으로 한정. 목록에 없는 공정(예: 바닥·전기 인입 자체시공)은 이 업체가 하지 않는다.
- 가격은 현장 실측에 따라 달라져 고정 게시하지 않는다. 특정 금액을 인용하지 마시고 "상담 후 안내"로 표기해 주세요.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
