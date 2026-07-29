/**
 * 히어로 아키타입 레지스트리 (REVRUN 차별화 레이어 W1a).
 *
 * variation.mjs가 seed로 고른 아키타입 id를 page.tsx가 여기서 컴포넌트로 매핑.
 * 세 아키타입 모두 동일한 HeroProps 계약을 소비하므로 데이터 재사용 무손실.
 *
 * 사용 예 (page.tsx):
 *   import { HERO_ARCHETYPES } from "@/components/heroes";
 *   const Hero = HERO_ARCHETYPES["carousel"]; // variation.config.json의 heroArchetype
 *   <Hero slides={HERO_SLIDES} title="…" eyebrow="…" scrollCue="SCROLL" />
 */
import { HeroFullBleed } from "./HeroFullBleed";
import { HeroCarousel } from "./HeroCarousel";
import { HeroSplit } from "./HeroSplit";

export const HERO_ARCHETYPES = {
  fullbleed: HeroFullBleed,
  carousel: HeroCarousel,
  split: HeroSplit,
} as const;

export type HeroArchetypeId = keyof typeof HERO_ARCHETYPES;

/** variation.mjs와 동일 순서 — seed % 개수로 인덱싱 (SSOT 유지) */
export const HERO_ARCHETYPE_IDS: HeroArchetypeId[] = [
  "fullbleed",
  "carousel",
  "split",
];

export { HeroFullBleed, HeroCarousel, HeroSplit };
export type { HeroProps, HeroSlide } from "@/types/hero";
