#!/usr/bin/env bash
STDIN=$(cat /dev/stdin 2>/dev/null || echo '{}')
DASHBOARD=$(echo "$STDIN" | node "$HOME/.claude/plugins/marketplaces/claude-dashboard/dist/index.js" 2>/dev/null || true)

SPRINT="Sprint 065"
grep -q 'Sprint 066' PROJECT_STATUS.md 2>/dev/null && SPRINT="Sprint 066"
grep -q 'Sprint 067' PROJECT_STATUS.md 2>/dev/null && SPRINT="Sprint 067"

DONE=0
TODO=0
while IFS= read -r line; do
  case "$line" in
    '- [x]'*) DONE=$((DONE + 1)) ;;
    '- [ ]'*) TODO=$((TODO + 1)) ;;
  esac
done < <(awk '/^## 🔄/{f=1;next} /^## / && f{exit} f' SPRINTS/SPRINT-PROGRESS.md 2>/dev/null)
TOTAL=$((DONE + TODO))
[ $TOTAL -eq 0 ] && { TOTAL=$(grep -c '^- \[' SPRINTS/SPRINT-PROGRESS.md 2>/dev/null || echo 0); DONE=$((TOTAL / 2)); TODO=$((TOTAL - DONE)); }

TASK=$(grep -m1 '^\- \[ \]' SPRINTS/SPRINT-PROGRESS.md 2>/dev/null | sed 's/.*\[ \] //' | cut -c1-50 | tr -d '\n')

LINE=$(echo "$DASHBOARD" | head -1)
LINE="${LINE} · 🏁 $SPRINT ✓$DONE/$TOTAL${TASK:+ · $TASK}"
echo "$LINE"