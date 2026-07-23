#!/usr/bin/env bash
# =============================================================================
# PreToolUse Hook: Graphify Before Grep/Find
# =============================================================================
# Triggers before Bash commands like grep, rg, find, fd, ack, ag.
# If graphify-out/graph.json exists, injects a MANDATORY hint to use graphify
# query/path/explain before falling back to raw file search.
#
# Matcher: Bash
# Hook type: command
# =============================================================================
set -euo pipefail

# Read the tool input JSON from stdin
TOOL_INPUT=$(cat)

# Extract just the command string from the tool input
CMD=$(python3 -c "
import json, sys
try:
    d = json.loads(sys.stdin.read())
    print(d.get('tool_input', d).get('command', ''))
except Exception:
    print('')
" <<< "$TOOL_INPUT" 2>/dev/null || true)

# List of search tools that should trigger a graphify hint
# Each pattern is checked against the full command string
case "$CMD" in
  *grep*|*rg\ *|*ripgrep*|*find\ *|*fd\ *|*ack\ *|*ag\ *)
    SESSION_ID=$(python3 -c "import json,sys;print(json.loads(sys.stdin.read()).get('session_id',''))" <<< "$TOOL_INPUT" 2>/dev/null || true)
    MARKER="${TMPDIR:-/tmp}/.graphify-hint-${SESSION_ID:-default}"
    if [ -f graphify-out/graph.json ] && [ ! -f "$MARKER" ]; then
      touch "$MARKER" 2>/dev/null || true
      cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "MANDATORY: graphify-out/graph.json exists. You MUST run graphify before grepping raw files. Use: graphify query \"<question>\" or graphify path \"<A>\" \"<B>\" or graphify explain \"<concept>\"."
  }
}
EOF
    fi
    ;;
esac
