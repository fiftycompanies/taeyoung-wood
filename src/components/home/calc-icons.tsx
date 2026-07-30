// 견적 계산기 아이콘 — 이모지 대신 굵기·크기가 통일된 선 아이콘.
// 이모지는 기기마다 색·모양이 달라 한 화면에서 톤이 깨진다.

type P = { size?: number };
const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

/** 가벽·파티션 — 세운 벽 + 벽돌 결 */
export const IconPartition = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M4 20V6a2 2 0 0 1 2-2h5v16" />
    <path d="M11 20h9V9h-9" />
    <path d="M14 9v11M17 9v11M11 14.5h9" />
  </svg>
);

/** TV 반매립 가벽·아트월 — 벽 속에 들어간 화면 */
export const IconTvBox = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <rect x="6.5" y="7" width="11" height="7.5" rx="1" />
    <path d="M9.5 17.5h5" />
  </svg>
);

/** 라인등·간접등 — 천장 매립 라인에서 아래로 퍼지는 빛 */
export const IconLineLight = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M2.5 4.5h19" />
    <rect x="6" y="7" width="12" height="2.4" rx="1.2" />
    <path d="M6 12.5 3.5 19M12 12.5V19M18 12.5 20.5 19" />
  </svg>
);

/** 히든도어 — 벽면과 이어진 문 */
export const IconHiddenDoor = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M3 20V4h18v16" />
    <path d="M9 4v16" />
    <path d="M17 4v16" />
    <circle cx="11.4" cy="12" r=".9" />
  </svg>
);

/** 몰딩·문선 마감 — ㄱ자 몰딩 단면(벽·천장 만나는 모서리) */
export const IconMolding = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M3.5 4.5h17v3h-14v13h-3z" />
    <path d="M9 10.5h11.5M9 14h11.5" />
  </svg>
);

/** 벽체 단열 — 벽 + 단열층 */
export const IconWallInsul = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M4 3v18" />
    <path d="M8 3v18" />
    <path d="M8 7h12M8 12h12M8 17h12" />
    <path d="M20 5v14" />
  </svg>
);

/** 천장 단열 — 천장 슬래브 아래 단열층(물결) */
export const IconCeilingInsul = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <path d="M2.5 4h19" />
    <path d="M3 8.5c1.6 0 1.6 2.4 3.2 2.4S7.8 8.5 9.4 8.5s1.6 2.4 3.2 2.4 1.6-2.4 3.2-2.4 1.6 2.4 3.2 2.4 1.6-2.4 2.5-2.4" />
    <path d="M2.5 8.5h19" />
    <path d="M5 19.5h14" />
  </svg>
);

/** 베란다 결로 단열 — 창 + 물방울 */
export const IconVeranda = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="3.5" y="3.5" width="17" height="13" rx="1.5" />
    <path d="M12 3.5v13M3.5 10h17" />
    <path d="M8 20c0-1.2 1.2-2.2 1.2-2.2S10.4 18.8 10.4 20a1.2 1.2 0 0 1-2.4 0Z" />
    <path d="M14 20c0-1.2 1.2-2.2 1.2-2.2S16.4 18.8 16.4 20a1.2 1.2 0 0 1-2.4 0Z" />
  </svg>
);

/** 기타 부분시공 — 줄자·목공 */
export const IconEtc = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
    <path d="M6.5 8.5v3M10 8.5v3M13.5 8.5v3M17 8.5v3" />
  </svg>
);

/** 평형 — 방 개수로 규모를 표현(24평 이하 / 25~40평 / 40평+) */
export const IconPlanS = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="4" y="5" width="16" height="14" rx="1.5" />
    <path d="M13 5v14" />
  </svg>
);
export const IconPlanM = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M12 5v14M12 12h9" />
  </svg>
);
export const IconPlanL = ({ size = 24 }: P) => (
  <svg {...svg(size)}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
    <path d="M10 4.5v15M10 12h11.5M16 12v7.5" />
  </svg>
);
