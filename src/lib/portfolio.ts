// 태영목공(전동현 대표) 실제 시공 자료 — 네이버 블로그 blog.naver.com/woodty 게시물에서 확인한
// 시공 항목·현장 사진만 사용한다. 사진은 public/images/ 에 원본 그대로 최적화해 보관.
//
// 각 사진의 출처 글은 픽셀 대조로 확정했다(추측 금지). 지역·연도는 그 글의 제목·본문에 적힌
// 내용만 적는다. 글에서 지역을 알 수 없는 사진은 지역을 쓰지 않는다.

export type Service = {
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
  img: string;
};

export const SERVICES: Service[] = [
  {
    title: "천장 목공",
    subtitle: "우물등박스 · 간접등박스 · 라인조명",
    desc: "천장 골조부터 조명 매립까지 한 팀이 진행합니다. 등박스 단차와 조명 라인이 어긋나지 않도록 실측 기준으로 골조를 잡습니다.",
    features: ["우물·간접 등박스", "라인조명 매립", "에어컨 단내림"],
    img: "/images/svc-ceiling-fin.jpg",
  },
  {
    title: "거실 포인트",
    subtitle: "TV 반매립 가벽 · 아트월",
    desc: "TV를 벽 안으로 넣는 반매립 가벽과 아트월을 제작합니다. 배선·콘센트 위치를 먼저 잡고 마감재를 붙여 선이 보이지 않게 정리합니다.",
    features: ["TV 반매립 가벽", "아트월 제작", "배선 매립 정리"],
    img: "/images/svc-artwall.jpg",
  },
  {
    title: "문 · 중문",
    subtitle: "히든도어 · 포켓도어 · 간살 중문",
    desc: "벽과 하나로 이어지는 히든도어, 벽 속으로 들어가는 포켓도어, 상부구동형 매립틀 원슬라이딩 간살 중문까지 제작·설치합니다.",
    features: ["히든도어·스텝도어", "포켓도어·인뎁스도어", "원슬라이딩 간살 중문"],
    img: "/images/svc-hiddendoor-fin.jpg",
  },
  {
    title: "수납 목공",
    subtitle: "붙박이장 · 커튼박스 · 침대헤드",
    desc: "집 구조에 맞춰 짜 넣는 수납 목공입니다. 붙박이장·선반·커튼박스·침대헤드를 현장 실측 치수로 제작합니다.",
    features: ["붙박이장·선반", "커튼박스", "침대헤드 제작"],
    img: "/images/svc-storage-fin.jpg",
  },
  {
    title: "단열 목공",
    subtitle: "확장부 단열 · 아이소핑크",
    desc: "확장한 베란다·외벽 쪽 결로와 냉기를 잡는 단열 시공입니다. 외벽 100t·50t 등 현장 조건에 맞춰 아이소핑크를 시공하고 목공으로 마감합니다.",
    features: ["확장부 단열", "외벽 100t·50t", "천장 단열 (바닥공사 제외)"],
    img: "/images/svc-insulation.jpg",
  },
  {
    title: "공간 분리",
    subtitle: "가벽 · 파티션 · 칸막이",
    desc: "방을 나누거나 현관·주방을 가리는 가벽·파티션을 세웁니다. 철거 없이 부분 시공만으로 구조를 바꿀 수 있는 범위를 먼저 안내드립니다.",
    features: ["가벽 신설·철거", "파티션·칸막이", "9미리 문선 마감"],
    img: "/images/svc-partition-fin.jpg",
  },
  {
    title: "주택 목공",
    subtitle: "목계단 · 웨인스코팅 · 데크",
    desc: "단독·신축 주택의 목계단과 웨인스코팅, 실외 데크 등 규모가 있는 목공사도 진행합니다. 신축빌라 내장목공 경험이 많습니다.",
    features: ["목계단·핸드레일", "웨인스코팅", "데크·테이블 제작"],
    img: "/images/svc-stairs.jpg",
  },
  {
    title: "상업 공간",
    subtitle: "카페 · 사무실 · 매장",
    desc: "카페·사무실·매장 등 상업 공간 내장 목공사도 시공합니다. 원목 루바·흡음보드 등 상업 공간용 마감재도 함께 다룹니다.",
    features: ["카페·매장 내장", "사무실 파티션", "원목 루바·흡음보드"],
    img: "/images/svc-cafe-fin.jpg",
  },
];

export type Project = {
  title: string;
  region: string;
  date: string;
  tag: string;
  img: string;
};

export const PROJECTS: Project[] = [
  { title: "확장 거실·주방 목공 마감", region: "용인 수지 50평대 아파트", date: "2025", tag: "아파트 목공", img: "/images/case-suji-living.jpg" },
  { title: "우물천장·간접등 거실 마감", region: "수원 영통 한양수자인", date: "2025", tag: "천장 목공", img: "/images/case-yeongtong-living.jpg" },
  { title: "확장부 아이소핑크 단열", region: "자양동·화서동 단열 현장", date: "2025", tag: "단열 시공", img: "/images/case-insul-wall.jpg" },
  { title: "창가 붙박이 선반 제작", region: "용인 수지 50평대 아파트", date: "2025", tag: "붙박이 수납", img: "/images/case-suji-shelf.jpg" },
  { title: "히든도어·중문 설치", region: "용인 수지 50평대 아파트", date: "2025", tag: "히든도어", img: "/images/case-suji-door.jpg" },
  { title: "천장 단열 시공", region: "자양동·화서동 단열 현장", date: "2025", tag: "단열 시공", img: "/images/case-insul-ceiling.jpg" },
  { title: "원형 간접등 니치·복도 마감", region: "수원 영통 한양수자인", date: "2025", tag: "조명 목공", img: "/images/case-yeongtong-niche.jpg" },
  { title: "확장부 단열 시공", region: "용인 수지 50평대 아파트", date: "2025", tag: "단열 시공", img: "/images/case-2.jpg" },
  { title: "천장 목공 골조 작업", region: "위브하늘채 아파트", date: "2024", tag: "천장 목공", img: "/images/case-weave.jpg" },
  { title: "침대헤드·간접등 침실 목공", region: "청라지구 주상복합 아파트", date: "2019", tag: "수납·조명", img: "/images/case-bedhead.jpg" },
  { title: "웨인스코팅 아트월 업무실", region: "서울 강남 도산대로", date: "2019", tag: "아트월", img: "/images/case-office-wainscot.jpg" },
  { title: "붙박이 책장·수납장 제작", region: "아파트 서재", date: "2018", tag: "붙박이 수납", img: "/images/case-bookshelf.jpg" },
  { title: "아치 니치·진열장 내장 목공", region: "학습교재 전시장", date: "2025", tag: "상업 공간", img: "/images/case-showroom.jpg" },
  { title: "매장 원목 루바·쇼케이스 목공", region: "아이스크림 체인점 (사당·강동)", date: "2022", tag: "상업 공간", img: "/images/case-icecream.jpg" },
  { title: "목계단 마감", region: "동탄 신축빌라", date: "2018", tag: "주택 목공", img: "/images/case-stairs.jpg" },
];
