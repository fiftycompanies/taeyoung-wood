# Hover-Safe Dropdown 정본 패턴 (nav 컴포넌트)

**박제일**: 2026-07-28
**계기**: family-auto-camping 라이브 검수에서 kk가 "드롭다운 클릭하려고 하면 사라진다" 지적 → hover-gap 재발 사례

## 문제

데스크탑 nav에서 트리거 링크와 드롭다운 패널 사이에 `margin-top`(예: `mt-3`)으로 여백을 두면, 그 여백은 group-hover 영역 **밖**이라 커서가 통과할 때 group-hover가 끊겨 패널이 사라진다. 사용자는 항목을 클릭할 수 없다.

## 금지 패턴

```tsx
// ❌ 금지 — 트리거와 패널 사이 mt-3 여백이 group-hover 밖
<div className="group relative">
  <Link href={g.href}>{g.labelEn}</Link>
  <div className="pointer-events-none absolute left-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto">
    <ul>...items...</ul>
  </div>
</div>
```

## 정본 패턴

```tsx
// ✅ 정본 — 부모 group에 py-4로 hover 유지 영역 확장 + 패널은 pt-3 padding으로 시각 여백 유지
<div className="group relative py-4">
  <Link href={g.href}>{g.labelEn}</Link>
  <div className="pointer-events-none absolute left-1/2 top-full pt-3 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto">
    <ul>...items...</ul>
  </div>
</div>
```

**핵심 원리**:
- 부모 `<div>`(group 컨테이너)에 상하 padding(`py-4`)을 넣어 hover 유지 영역을 트리거보다 크게 만든다.
- 패널 wrapper는 `mt-*` 대신 `pt-*`로 시각 여백을 유지(padding은 wrapper 안이라 hover 영역에 포함).
- 결과: 커서가 트리거→패널로 이동하는 궤적 전체가 group-hover 안에 있어 패널이 유지된다.

## 자동 검출

`scripts/interaction-audit.mjs`가 데스크탑 뷰포트에서 실제 마우스 이동(트리거 중앙 → 트리거 하단 +12px → +40px)을 시뮬해 gap 통과 후 dropdown 유지 여부를 검증한다. 실패 시 P1로 리포트되어 Phase 7 게이트에서 자동 차단된다.

## 관련 문서

- `.claude/skills/enrich-site/SKILL.md` § "nav 드롭다운 hover-gap 정본 패턴"
- `.claude/skills/qa-site/SKILL.md` § `button_link_full`의 hover-gap 항목
- 재발 사례 memory: `feedback_nav_dropdown_hover_gap_pattern.md`
