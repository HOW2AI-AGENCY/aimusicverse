#!/bin/bash
# Merge all unmerged branches into main
cd "d:\.MUSICVERSE\aimusicverse" || exit 1

git branch --no-merged main | grep -v "^\*" | grep -v "main" | tr -d ' ' > /tmp/branches_to_merge.txt

while IFS= read -r branch; do
  echo "=== Merging: $branch ==="
  git merge --no-edit "$branch" 2>&1 || echo "CONFLICT in $branch — skipping"
  echo ""
done < /tmp/branches_to_merge.txt

echo "=== DONE ==="
git log --oneline -10
