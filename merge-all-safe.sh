#!/bin/bash
# Merge all unmerged branches into main with -X ours (auto-resolve conflicts → main wins)
cd "d:\.MUSICVERSE\aimusicverse" || exit 1

git branch --no-merged main | grep -v "^\*" | grep -v "main" | tr -d ' ' > /tmp/branches_to_merge.txt

SUCCESS=0
SKIPPED=0
CONFLICT_BRANCHES=""

while IFS= read -r branch; do
  echo "=== Merging: $branch ==="
  if git merge --no-edit -X ours "$branch" 2>&1; then
    ((SUCCESS++))
    echo "  ✓ merged"
  else
    ((SKIPPED++))
    CONFLICT_BRANCHES="$CONFLICT_BRANCHES $branch"
    echo "  ✗ FAILED — aborting this merge"
    git merge --abort 2>/dev/null
  fi
  echo ""
done < /tmp/branches_to_merge.txt

echo "=== SUMMARY ==="
echo "Merged: $SUCCESS"
echo "Failed: $SKIPPED"
if [ -n "$CONFLICT_BRANCHES" ]; then
  echo "Failed branches:$CONFLICT_BRANCHES"
fi
