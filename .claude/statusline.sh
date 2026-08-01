#!/usr/bin/env bash
set -euo pipefail

STDIN=$(cat 2>/dev/null || echo '{}')
DASHBOARD=$(echo "$STDIN" | node "$HOME/.claude/plugins/marketplaces/claude-dashboard/dist/index.js" 2>/dev/null || true)

SPRINT=$(grep -oP 'Sprint \d+' PROJECT_STATUS.md 2>/dev/null | head -1 || echo "")
TASK=$(grep -m1 '\- \[ \]' SPRINTS/SPRINT-*.md 2>/dev/null | sed 's/.*\[ \] //' | cut -c1-60 | head -1 || echo "")

echo "$DASHBOARD"
[ -n "$SPRINT" ] && echo "🏁 $SPRINT${TASK:+ · $TASK}" || true