#!/usr/bin/env bash
# section-worktree.sh — Phase 3 빌더 병렬 격리 표준 헬퍼 (② worktree 격리)
#
# clone-website Phase 3 는 섹션별 빌더 에이전트를 "각자 격리된 worktree"에서 병렬 작업시킨다.
# 이 스크립트는 그 격리 계약을 결정론적으로 통일한다(에이전트마다 제각각 만들지 않게).
#
# 사용법:
#   bash scripts/section-worktree.sh add <section>      # 섹션용 worktree+브랜치 생성
#   bash scripts/section-worktree.sh merge <section>    # 작업 끝난 섹션 브랜치를 현재 브랜치로 병합 후 정리
#   bash scripts/section-worktree.sh list               # 현재 worktree 목록
#   bash scripts/section-worktree.sh cleanup            # sec/* worktree 전부 정리(머지 안 된 건 경고)
#
# 규약:
#   - worktree 경로: ../wt-<section>   (클론 폴더 형제 디렉토리)
#   - 브랜치명:      sec/<section>
#   - 빌더는 자기 worktree 안에서만 작업하고 `npx tsc --noEmit` 통과 후 끝낸다.
#   - 오케스트레이터가 merge 로 순차 통합(충돌은 오케스트레이터가 해소).
#
# 참고: 섹션 수가 적으면(<2) worktree 없이 단일 작업도 허용 — clone-site 가 규칙 판단.

set -euo pipefail

CMD="${1:-}"
SECTION="${2:-}"

# git 저장소 루트(클론 폴더) 기준
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "❌ git 저장소가 아닙니다. 클론 폴더(new-clone.sh 산출물) 안에서 실행하세요."
  exit 1
fi
cd "$ROOT"

slug() { echo "$1" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-'; }
require_slug() { local s; s="$(slug "$1")"; [ -z "$s" ] && { echo "❌ 섹션명이 ASCII slug로 비었습니다(한글 등): '$1' → 영문 섹션명을 쓰세요(예: hero, about)." >&2; exit 1; }; echo "$s"; }

case "$CMD" in
  add)
    [ -z "$SECTION" ] && { echo "Usage: section-worktree.sh add <section>"; exit 1; }
    S="$(require_slug "$SECTION")"
    WT="../wt-$S"
    BR="sec/$S"
    if git show-ref --verify --quiet "refs/heads/$BR"; then
      echo "ℹ️ 브랜치 $BR 이미 존재 — worktree만 연결 시도"
    fi
    git worktree add -b "$BR" "$WT" 2>/dev/null || git worktree add "$WT" "$BR"
    echo "✓ worktree 생성: $WT  (브랜치 $BR)"
    echo "  빌더 지시: 이 폴더 안에서만 작업 → 끝나면 'npx tsc --noEmit' 통과 → 오케스트레이터가 merge $S"
    ;;
  merge)
    [ -z "$SECTION" ] && { echo "Usage: section-worktree.sh merge <section>"; exit 1; }
    S="$(require_slug "$SECTION")"
    WT="../wt-$S"
    BR="sec/$S"
    echo "→ $BR 병합 (현재 브랜치로)"
    git merge --no-ff "$BR" -m "merge($S): builder worktree" || {
      echo "⚠️ 충돌 발생 — 오케스트레이터가 해소 후 'git merge --continue'. worktree는 보존."; exit 2;
    }
    git worktree remove "$WT" --force 2>/dev/null || true
    git branch -d "$BR" 2>/dev/null || true
    echo "✓ $S 병합 완료 + worktree 정리"
    ;;
  list)
    git worktree list
    ;;
  cleanup)
    echo "→ sec/* worktree 정리 (안전모드: --force 안 씀, 미통합 작업 보존)"
    CUR="$(git rev-parse --abbrev-ref HEAD)"
    git worktree list --porcelain | awk '/^worktree /{w=$2} /^branch refs\/heads\/(sec\/.+)/{print w" "substr($2,12)}' | while read -r w br; do
      # 현재 브랜치에 병합 안 된 커밋이 sec 브랜치에 있으면 손대지 말고 경고
      if [ -n "$br" ] && [ -n "$(git log "$CUR..$br" --oneline 2>/dev/null)" ]; then
        echo "  ⚠️ $br 에 미통합 커밋 있음 → 보존(먼저 'merge ${br#sec/}'). worktree: $w"
        continue
      fi
      echo "  - remove $w"; git worktree remove "$w" 2>/dev/null || echo "    ⚠️ 커밋 안 된 변경 있음 → 보존(수동 확인): $w";
    done
    git worktree prune
    echo "✓ 정리 완료 (미통합/미커밋 worktree는 강제삭제 없이 보존·경고)"
    ;;
  *)
    echo "Usage: section-worktree.sh {add|merge|list|cleanup} [<section>]"
    exit 1
    ;;
esac
