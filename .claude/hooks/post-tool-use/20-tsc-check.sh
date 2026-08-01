#!/usr/bin/env bash
# PostToolUse: tsc check on TS edits. Throttled: runs max every 5s.
set -euo pipefail

THROTTLE="${TMPDIR:-/tmp}/.tsc-check-throttle"
NOW=$(date +%s)

# skip if ran in last 5 seconds
[ -f "$THROTTLE" ] && [ $(($(cat "$THROTTLE") + 5)) -gt "$NOW" ] && exit 0

TOOL_RESULT=$(cat)
FILE=$(echo "$TOOL_RESULT" | python3 -c "
import json,sys
try:
    t=json.loads(sys.stdin.read()).get('tool_input',{})
    print(t.get('file_path',''))
except: print('')
" 2>/dev/null || true)

case "$FILE" in
  *.ts|*.tsx)
    command -v npx &>/dev/null || exit 0
    echo "$NOW" > "$THROTTLE"
    TSC_OUT=$(npx tsc --noEmit --pretty 2>&1 || true)
    mkdir -p node_modules/.cache
    if [ -z "$TSC_OUT" ]; then
      echo "✓ passing" > node_modules/.cache/test-status
    else
      ERROR_COUNT=$(echo "$TSC_OUT" | grep -c "error TS" || true)
      echo "  ⚠ TypeScript: $ERROR_COUNT errors (showing first 3)"
      echo "$TSC_OUT" | grep "error TS" | head -3 | sed 's/^/    /'
      echo "⚠ $ERROR_COUNT TS errors" > node_modules/.cache/test-status
    fi
    ;;
esac
