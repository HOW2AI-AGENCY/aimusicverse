#!/usr/bin/env bash
# =============================================================================
# PreToolUse Hook: Graphify Before Read/Glob Source Files
# =============================================================================
# Triggers before Read or Glob commands that target source code files.
# If graphify-out/graph.json exists, injects a MANDATORY hint to use graphify
# query/path/explain before reading raw source files.
#
# Matcher: Read|Glob
# Hook type: command
# =============================================================================
set -euo pipefail

# Read the tool input JSON from stdin
TOOL_INPUT=$(cat)

# Check if the target is a source file (not in graphify-out/)
HIT=$(python3 -c "
import json, sys

d = json.loads(sys.stdin.read())
t = d.get('tool_input', d)

# Collect all searchable text from file_path, pattern, path fields
s = (
    str(t.get('file_path') or '') + ' ' +
    str(t.get('pattern') or '') + ' ' +
    str(t.get('path') or '')
).lower().replace('\\\\', '/')

# Source file extensions that should trigger graphify hint
exts = (
    '.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java',
    '.rb', '.c', '.h', '.cpp', '.hpp', '.cc', '.cs', '.kt',
    '.swift', '.php', '.scala', '.lua', '.sh', '.md', '.rst',
    '.txt', '.mdx'
)

# Only trigger if NOT already reading from graphify-out/
if 'graphify-out/' not in s and any(e in s for e in exts):
    sys.stdout.write('1')
" <<< "$TOOL_INPUT" 2>/dev/null || true)

SESSION_ID=$(python3 -c "import json,sys;print(json.loads(sys.stdin.read()).get('session_id',''))" <<< "$TOOL_INPUT" 2>/dev/null || true)
MARKER="${TMPDIR:-/tmp}/.graphify-hint-${SESSION_ID:-default}"
if [ "$HIT" = "1" ] && [ -f graphify-out/graph.json ] && [ ! -f "$MARKER" ]; then
  touch "$MARKER" 2>/dev/null || true
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "MANDATORY: graphify-out/graph.json exists. You MUST run graphify before reading source files. Use: graphify query \"<question>\" or graphify path \"<A>\" \"<B>\" or graphify explain \"<concept>\"."
  }
}
EOF
fi
