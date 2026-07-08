#!/usr/bin/env bash
# repo-cleanup scanner — run from repo root
ROOT="${1:-.}"
cd "$ROOT" || exit 1

echo "=== BACKUP/DUPLICATE FILES ==="
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.orig" -o -name "*.patch" -o -name "*.diff" \) -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' 2>/dev/null | sort

echo "=== ZERO-LENGTH FILES ==="
find . -type f -size 0 -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' 2>/dev/null | sort

echo "=== STALE ROOT FILES ==="
find . -maxdepth 1 -type f \( -name "SESSION-*" -o -name "FINAL_REPORT*" -o -name "AUDIT-AND-PLAN*" -o -name "SPRINT_*_PLAN*" -o -name "PUSH_INSTRUCTIONS*" -o -name "LOCKFILE_DECISION*" -o -name "KNOWN_ISSUES*" -o -name "MOBILE_AUDIT*" -o -name "MBILE_*" -o -name "all_todos*" -o -name "critical_todos*" -o -name "stale_branches*" -o -name "add-*.cjs" -o -name "fix-*.cjs" -o -name "branch-ruleset*" -o -name "ruleset-update*" -o -name "claude_code_*.sh" -o -name "thumbnail*" -o -name "screenshot*.png" \) 2>/dev/null | sort

echo "=== ORPHANED TOOL DIRS ==="
for d in .kilo .kilocode .lovable .mimocode .roo .specify; do [ -d "$d" ] && echo "$d  ($(du -sh "$d" 2>/dev/null | cut -f1))"; done

echo "=== DUPLICATE CHANGELOG ==="
find . -name "CHANGELOG.md.backup" -o -name "README.md.bak" 2>/dev/null | sort

echo "=== STALE STORYBOOK ==="
if [ -d .storybook ]; then
  HS=$(grep -c '"storybook"' package.json 2>/dev/null || echo 0)
  echo ".storybook/ exists. storybook in package.json: $([ "$HS" -gt 0 ] && echo YES || echo NO)"
fi

echo "=== WORKTREE DEBRIS ==="
find .kilo/worktrees -maxdepth 2 -type d 2>/dev/null | sort
