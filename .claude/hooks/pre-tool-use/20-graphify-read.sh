#!/usr/bin/env bash
# PreToolUse: hint to use graphify before reading source files. One-shot.
set -euo pipefail

HIT=$(cat | python3 -c "
import json,sys
try:
    d=json.loads(sys.stdin.read())
    t=d.get('tool_input',d)
    s=(str(t.get('file_path') or '')+' '+str(t.get('pattern') or '')+' '+str(t.get('path') or '')).lower().replace('\\\\','/')
    if 'graphify-out/' not in s and any(e in s for e in ('.ts','.tsx','.js','.jsx','.py','.go','.rs','.tsx','.md','.css')):
        print(1)
except: pass
" 2>/dev/null || true)

if [ "$HIT" = "1" ] && [ -f graphify-out/graph.json ]; then
  MARKER="${TMPDIR:-/tmp}/.graphify-hint-read"
  if [ ! -f "$MARKER" ]; then
    touch "$MARKER" 2>/dev/null || true
    echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"MANDATORY: graphify query before reading source."}}'
  fi
fi
