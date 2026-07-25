#!/usr/bin/env bash
# =============================================================================
# PostToolUse Hook: Fast TypeScript Check
# =============================================================================
# After editing a .ts/.tsx file, runs a fast tsc --noEmit to surface type
# errors immediately. Only reports the first 3 errors to avoid noise.
# Caches a pass/fail status so SessionStart dashboard can report it.
#
# Matcher: Edit|Write
# Hook type: command
# =============================================================================
set -euo pipefail

TOOL_RESULT=$(cat)

FILE=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    t = d.get('tool_input', d)
    fp = str(t.get('file_path', ''))
    print(fp)
except Exception:
    print('')
" <<< "$TOOL_RESULT" 2>/dev/null || true)

# Only check TypeScript files
case "$FILE" in
  *.ts|*.tsx)
    # Must have tsc available
    if ! command -v npx &>/dev/null; then
      exit 0
    fi

    # Run tsc and capture output
    TSC_OUT=$(npx tsc --noEmit --pretty 2>&1 || true)

    if [ -z "$TSC_OUT" ]; then
      # Cache pass
      mkdir -p node_modules/.cache
      echo "✓ passing" > node_modules/.cache/test-status
    else
      # Show first 3 errors
      ERROR_COUNT=$(echo "$TSC_OUT" | grep -c "error TS" || true)
      echo ""
      echo "  ⚠ TypeScript: $ERROR_COUNT errors (first 3 shown)"
      echo "$TSC_OUT" | grep "error TS" | head -3 | while read -r line; do
        echo "    $line"
      done
      echo ""
      # Cache fail
      mkdir -p node_modules/.cache
      echo "⚠ $ERROR_COUNT TS errors" > node_modules/.cache/test-status
    fi
    ;;
esac
