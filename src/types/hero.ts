/**
 * 히어로 공통 계약 (REVRUN 차별화 레이어 W1a).
 *
 * 모든 히어로 아키타입(fullbleed/carousel/split)이 이 단일 props 계약을 소비한다.
 * → variation.ts가 seed로 아키타입을 고르고, page.tsx는 같은 데이터로 어느 것이든 렌더 가능.
 *
 * ⚠️ 콘텐츠(slides·title·copy)는 원본에서 충실히 가져온 실데이터를 넣는다(브랜드명 하드코딩 금지).
 *    시각 표현(어느 아키타입·색·폰트)만 REVRUN 고유로 변주된다.
 */
export interface HeroSlide {
  /** 이미지 URL (public/ 상대경로 또는 절대) */
  src: string;
  /** 접근성 alt (없으면 title 사용) */
  alt?: string;
}

export interface HeroProps {
  /** 배경 이미지 1장 이상 (fullbleed는 첫 장, carousel/split은 전체 순환) */
  slides: HeroSlide[];
  /** 제목 위 작은 라인 (예: "welcome to", 상호 슬로건) */
  eyebrow?: string;
  /** 메인 헤딩 (상호·영문 타이틀 등) */
  title: string;
  /** 보조 라인 (한 줄 설명) */
  subtitle?: string;
  /** 긴 본문 카피 (split 아키타입에서 노출, 줄바꿈은 \n) */
  body?: string;
  /** 스크롤 유도 라벨 (예: "SCROLL") */
  scrollCue?: string;
  /** 앵커 대상(스크롤 큐 클릭 시), 기본 다음 섹션 */
  scrollHref?: string;
}
