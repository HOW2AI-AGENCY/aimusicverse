#!/usr/bin/env bash
# =============================================================================
# PostToolUse Hook: Auto-format on Write/Edit
# =============================================================================
# After Write or Edit on TypeScript/JavaScript files, runs Prettier to keep
# code consistently formatted. Skips if prettier isn't available or the file
# is outside the project.
#
# Matcher: Edit|Write
# Hook type: command
# =============================================================================
set -euo pipefail

# Read the tool result JSON from stdin
TOOL_RESULT=$(cat)

# Extract the file path from the tool input
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

# Only format source files with supported extensions
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.json|*.md)
    # Check that prettier is available
    if ! command -v npx &>/dev/null; then
      exit 0
    fi

    # Check file exists and is in the project
    if [ ! -f "$FILE" ]; then
      exit 0
    fi

    # Run prettier (suppress output on success)
    if npx prettier --write --loglevel silent "$FILE" 2>/dev/null; then
      echo "  ✓ formatted"
    fi
    ;;
esac
