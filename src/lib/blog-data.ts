/**
 * 클론 초기 목록 — Supabase env가 붙기 전(enrich-site 단계 전) 시각 확인용 정적 목록.
 * 실제 라이브에서는 src/lib/blog.ts 의 Supabase 목록이 우선한다.
 * 이 파일은 clone 단계에서만 사용. enrich-site에서 필요 시 재발행/삭제 가능.
 */

export type StaticPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  read: string;
};

export const BLOG_POSTS: StaticPost[] = [
  { slug: "gabyeok-partition-tip", title: "가벽 시공, 셀프 인테리어에서 놓치기 쉬운 3가지 포인트", excerpt: "가벽 두께·마감·전기 배선 처리까지, 셀프 인테리어에서 가장 자주 물어보시는 포인트를 정리했습니다.", category: "목공", date: "2026. 7. 29.", read: "3분" },
  { slug: "ceiling-line-light", title: "천장 라인등·간접등, 목공 마감이 예뻐지는 순서", excerpt: "라인등이 예쁘게 나오려면 목공 마감·전선 배치·조도 계산의 순서가 중요합니다.", category: "조명", date: "2026. 7. 28.", read: "3분" },
  { slug: "wall-condensation-insulation", title: "결로가 심한 벽, 부분 단열로 해결하는 방법", excerpt: "북향 벽면·외기와 접한 방의 결로를 부분 단열로 잡는 방법과 필요한 자재를 안내드립니다.", category: "단열", date: "2026. 7. 27.", read: "3분" },
  { slug: "hidden-door-detail", title: "히든도어, 실제 시공에서 확인해야 할 문틀·경첩 디테일", excerpt: "히든도어가 잘 열리려면 문틀 수평·경첩 종류·손잡이 처리를 미리 결정해야 합니다.", category: "목공", date: "2026. 7. 26.", read: "3분" },
  { slug: "tv-box-idea", title: "TV박스·아트월, 우리 집 거실에 딱 맞는 크기 찾는 법", excerpt: "TV 크기, 소파와의 거리, 콘센트 위치까지 고려한 TV박스 설계 원칙을 알려드립니다.", category: "목공", date: "2026. 7. 25.", read: "3분" },
  { slug: "ceiling-insulation-basic", title: "천장 단열, 어떤 경우에 필요할까요?", excerpt: "최상층·확장 베란다·옥탑방 등 천장 단열이 필요한 상황과 시공 순서를 안내합니다.", category: "단열", date: "2026. 7. 24.", read: "3분" },
  { slug: "part-construction-benefit", title: "리모델링 전체가 아닌 부분시공의 장점", excerpt: "예산·기간·거주 유지 3가지 관점에서 부분시공이 왜 유리한지 실제 사례로 정리했습니다.", category: "노하우", date: "2026. 7. 22.", read: "3분" },
  { slug: "self-interior-companion", title: "셀프 인테리어를 하는 분에게 태영목공이 맞는 이유", excerpt: "'이 부분만 안 되겠어서...' 하는 요청에 딱 맞춰 협업하는 방식과 견적 흐름을 설명합니다.", category: "노하우", date: "2026. 7. 20.", read: "3분" },
  { slug: "veranda-window-insulation", title: "베란다 확장 후 냉기, 어디를 단열해야 하나요?", excerpt: "확장 베란다에서 자주 겪는 냉기·결로 문제, 창호 주변과 벽체 부분 단열 포인트.", category: "단열", date: "2026. 7. 18.", read: "3분" },
  { slug: "molding-mafuri-tips", title: "몰딩·마감재, 사소해 보이지만 완성도가 갈리는 부분", excerpt: "몰딩 스타일 3가지와 도장·필름·마감재 선택 시 자주 하는 실수를 정리했습니다.", category: "목공", date: "2026. 7. 16.", read: "3분" },
  { slug: "no-floor-work-reason", title: "왜 태영목공은 바닥공사를 하지 않을까요?", excerpt: "'잘하는 것에만 집중'이라는 원칙과, 바닥공사 대신 벽·천장 목공/단열에 집중하는 이유.", category: "노하우", date: "2026. 7. 14.", read: "3분" },
  { slug: "quote-request-checklist", title: "부분시공 견적 문의 전 확인해두면 좋은 3가지", excerpt: "현장 사진·정확한 시공 범위·희망 일정만 정리하시면 상담이 훨씬 빨라집니다.", category: "노하우", date: "2026. 7. 12.", read: "3분" },
];
