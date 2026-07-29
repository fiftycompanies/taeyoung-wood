/**
 * SEO / GEO / AEO SSOT — 태영목공(태영 인테리어)
 *
 * 값의 원천은 실측(인테이크 c5acc46e). 새 사실을 지어내지 말 것.
 *
 * · JSON-LD `@type` = LocalBusiness / HomeAndConstructionBusiness (시공업).
 *   숙박(LodgingBusiness)·법률(LegalService) 템플릿을 쓰지 않는다.
 * · aggregateRating / review 를 넣지 말 것 (지어낸 평점 = 자기 별점 표시로 노출자격 0).
 * · priceRange 는 대략치("₩₩")만. 구체 가격 게시 금지(실측 후 견적).
 * · areaServed = 서울/경기 전역(사장님 인테이크 확인).
 */

/** 배포 도메인. 독립 도메인 이전 시 env 로 덮어쓴다(/onboard-site 소관). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://taeyoung-wood.revrun.kr";

export const SITE_NAME = "태영목공";
export const SITE_LEGAL_NAME = "태영 인테리어";

export const SITE_DESCRIPTION =
  "20년 경력 전동현 대표가 직접 시공하는 아파트 홈인테리어 목공·단열 부분시공 전문. 가벽·라인등·TV박스·히든도어·간접등 목공과 일반 단열 시공. 서울·경기 전역, 셀프 인테리어 고객에게 딱 맞춘 부분시공.";

/** NAP(상호·주소·전화) — 검색엔진·AI가 동일 업체로 묶는 기준. */
export const NAP = {
  name: SITE_NAME,
  legalName: SITE_LEGAL_NAME,
  principal: "전동현",
  phone: ["010", "8835", "7775"].join("-"),
  streetAddress: "장안로 232",
  addressLocality: "수원시 장안구",
  addressRegion: "경기도",
  postalCode: "16250",
  addressCountry: "KR",
  // 대략 좌표(수원시 장안구 장안로 232 인근 · 지도 노출은 하지 않음)
  latitude: 37.2836,
  longitude: 127.0069,
} as const;

/** 서비스 지역 — 사장님 실측(인테이크). 광고문구 아님. */
export const SERVICE_AREAS = [
  "서울특별시",
  "경기도",
  "수원시",
  "성남시",
  "용인시",
  "화성시",
  "고양시",
  "부천시",
  "안양시",
  "안산시",
] as const;

/** 취급 서비스 — 홈페이지 섹션과 일치. */
export const SERVICES = [
  { slug: "gabyeok", title: "가벽 시공", summary: "목공 가벽·파티션·아트월 목공 마감" },
  { slug: "line-light", title: "라인등·간접등", summary: "천장 라인등·간접등 목공 마감" },
  { slug: "tv-box", title: "TV박스·아트월", summary: "TV박스·아트월·목공 조형" },
  { slug: "hidden-door", title: "히든도어 제작", summary: "히든도어 문틀·경첩·손잡이 시공" },
  { slug: "insulation", title: "일반 단열 시공", summary: "벽체·천장 부분 단열 시공" },
  { slug: "apartment", title: "아파트 홈인테리어", summary: "아파트 부분시공·목공+단열 원스톱" },
] as const;

/** OG 대표 이미지 — 히어로 배경 재사용(로컬 실제 시공 사진). */
export const OG_IMAGE = "/images/hero.jpg";

/** 정적 라우트 — sitemap·llms.txt 공용. 블로그는 sitemap 에서 동적 합성. */
export const STATIC_ROUTES = [
  "/",
  "/blog",
  "/calculator",
  "/guide",
  "/contact",
  "/privacy",
  "/terms",
];

/**
 * LocalBusiness (HomeAndConstructionBusiness) JSON-LD.
 * · LocalBusiness 하위 타입이라 지역 검색·지도 패널에도 그대로 먹는다.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_URL}/#business`,
    name: NAP.name,
    alternateName: NAP.legalName,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: NAP.phone,
    image: `${SITE_URL}${OG_IMAGE}`,
    logo: `${SITE_URL}${OG_IMAGE}`,
    priceRange: "₩₩",
    address: {
      "@type": "PostalAddress",
      streetAddress: NAP.streetAddress,
      addressLocality: NAP.addressLocality,
      addressRegion: NAP.addressRegion,
      postalCode: NAP.postalCode,
      addressCountry: NAP.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: NAP.latitude,
      longitude: NAP.longitude,
    },
    founder: {
      "@type": "Person",
      name: NAP.principal,
      jobTitle: "대표 · 목공 시공기사",
    },
    employee: {
      "@type": "Person",
      name: NAP.principal,
      jobTitle: "대표 · 목공 시공기사",
    },
    areaServed: SERVICE_AREAS.map((a) => ({ "@type": "AdministrativeArea", name: a })),
    knowsAbout: [
      "아파트 인테리어",
      "부분시공",
      "목공 시공",
      "가벽 시공",
      "히든도어",
      "라인등",
      "TV박스",
      "단열 시공",
      "셀프 인테리어",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "취급 서비스",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.title,
          description: s.summary,
          serviceType: s.title,
        },
      })),
    },
    sameAs: ["https://blog.naver.com/woodty"],
  };
}

/** WebSite JSON-LD */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE_URL}/#business` },
  };
}
