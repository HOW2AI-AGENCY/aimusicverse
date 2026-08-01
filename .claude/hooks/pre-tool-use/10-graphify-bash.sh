#!/usr/bin/env bash
# PreToolUse: hint to use graphify before grep/find. One-shot per session.
set -euo pipefail

CMD=$(cat | python3 -c "
import json,sys
try:
    d=json.loads(sys.stdin.read())
    print(d.get('tool_input',d).get('command',''))
except: print('')
" 2>/dev/null || true)

case "$CMD" in
  grep*|rg\ *|find\ *|fd\ *)
    MARKER="${TMPDIR:-/tmp}/.graphify-hint-bash"
    if [ -f graphify-out/graph.json ] && [ ! -f "$MARKER" ]; then
      touch "$MARKER" 2>/dev/null || true
      echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"MANDATORY: graphify query \"<question>\" before raw grep."}}'
    fi
    ;;
esac
