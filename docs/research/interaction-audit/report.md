# Interaction Audit — http://localhost:3222

## 요약

- 모바일 인터랙티브 요소: 36개
- 모바일 내비: 보이는 링크 10개 · 토글 1개 · 토글동작 ❌
- 판정: P1 0 · P2 3 · P3 0

### 🟠 P2 (죽은 버튼/에러)
- [mobile] 장식 버튼(클릭 불가): <div> "바로가기" — 버튼처럼 보이지만 a/button이 아니고 인터랙티브 조상도 없음. Link/button으로 감쌀 것.
- [desktop] 죽은 버튼: "메뉴 닫기" — 클릭해도 DOM/스크롤/aria/네비 변화 없음(mutations 0).
- [desktop] 장식 버튼(클릭 불가): <div> "바로가기" — 버튼처럼 보이지만 a/button이 아니고 인터랙티브 조상도 없음. Link/button으로 감쌀 것.
