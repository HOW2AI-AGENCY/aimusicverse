#!/usr/bin/env bash
# =============================================================================
# Stop Hook: Save Session Context
# =============================================================================
# At session end, captures key session metadata for potential context restore
# in a future session. Writes to ~/.claude/sessions/<project>-<timestamp>.json
#
# Saved data: branch, last actions, changed files, timestamp
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION_DIR="$HOME/.claude/sessions"

# Only save if there were actual changes
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
TOTAL=$((STAGED + UNSTAGED))

# Skip if no changes and not forced
if [ "$TOTAL" -eq 0 ]; then
  exit 0
fi

mkdir -p "$SESSION_DIR"

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
PROJECT=$(basename "$(pwd)")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
SESSION_FILE="$SESSION_DIR/${PROJECT}-${BRANCH//\//-}.json"

python3 -c "
import json, os, sys
from datetime import datetime, timezone

branch = '$BRANCH'
project = '$PROJECT'
timestamp = '$TIMESTAMP'

# Collect changed files
import subprocess
staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only']).decode().strip().split('\n')
unstaged = subprocess.check_output(['git', 'diff', '--name-only']).decode().strip().split('\n')
changed = [f for f in staged + unstaged if f]

data = {
    'project': project,
    'branch': branch,
    'timestamp': timestamp,
    'changed_files': changed[:50],  # Cap at 50 files
    'changed_count': len(changed),
}

with open('$SESSION_FILE', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')

print(f'  context saved → {os.path.basename(\"$SESSION_FILE\")} ({len(changed)} files)')
" 2>/dev/null || true
