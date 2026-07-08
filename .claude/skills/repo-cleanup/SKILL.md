---
name: repo-cleanup
description: |
  Analyzes repository for stale files, backups, duplicates, temporary artifacts,
  and orphaned directories. Removes confirmed junk. After cleanup, analyzes results
  and self-improves by updating its detection patterns.
  Use when user says: "clean repo", "remove stale files", "cleanup backup files",
  "find dead files", "repository hygiene", "/cleanup".
---

# repo-cleanup

Three-phase skill: **Scan → Clean → Retrospect & Improve**.

## Phase 1: Scan

Run discovery against the repository. Detect across all categories below.
Present findings as a grouped summary with file counts and estimated space.

### Detection Categories

Load `references/patterns.md` for the full pattern list. Core categories:

1. **Backup files** — `*.bak`, `*.backup`, `*.old`, `*.orig`, `*~`, `#*#`
2. **Patch/Diff artifacts** — `*.patch`, `*.diff` (not in `.git/`)
3. **Zero-length files** — empty, size=0
4. **Duplicate lock/package files** — co-existing `package-lock.json` + `yarn.lock` + `pnpm-lock.yaml` etc.
5. **Duplicate configs** — co-existing `.editorconfig` + `.prettierrc`, multiple tsconfig variants
6. **Stale session/report files** — root-level `SESSION-*.md`, `FINAL_REPORT*.md`, `*-AUDIT-*.md`, `AUDIT-AND-PLAN-*.md`, `SPRINT_*_PLAN.md`, `PUSH_INSTRUCTIONS.md`, `LOCKFILE_DECISION.md`, `KNOWN_ISSUES_*.md`, `MOBILE_*FIXES*.md`, `MOBILE_AUDIT*.md`
7. **One-off scripts** — root-level `add-*.cjs`, `fix-*.cjs`, `fix-*.js`, `claude_code_*.sh`
8. **Scraped text files** — `all_todos.txt`, `critical_todos.txt`, `stale_branches.txt`
9. **One-off configs** — `branch-ruleset.json`, `ruleset-update.json`
10. **Temporary media** — `thumbnail.jpg`, `screenshot*.png` at repo root
11. **Orphaned tool directories** — `.kilo/`, `.kilocode/`, `.lovable/`, `.mimocode/`, `.roo/` (each >1MB), `.kilo/worktrees/`
12. **Duplicate CHANGELOG/README** — `CHANGELOG.md.backup`, `README.md.bak`
13. **Obsolete .storybook config** — `.storybook/` when no storybook in `package.json`
14. **Obsolete GitHub workflow history** — deleted workflow files still showing in git log

### Scan Procedure

```bash
# 1. Backup/patch artifacts
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.orig" -o -name "*.patch" -o -name "*.diff" -o -name "*~" \) -not -path './.git/*' -not -path './node_modules/*'

# 2. Zero-length files
find . -type f -size 0 -not -path './.git/*' -not -path './node_modules/*'

# 3. Root-level stale session/report/script files
find . -maxdepth 1 -type f \( -name "SESSION-*" -o -name "FINAL_REPORT*" -o -name "AUDIT-AND-PLAN*" -o -name "SPRINT_*_PLAN*" -o -name "PUSH_INSTRUCTIONS*" -o -name "LOCKFILE_DECISION*" -o -name "KNOWN_ISSUES*" -o -name "MOBILE_AUDIT*" -o -name "MBILE_*" -o -name "all_todos*" -o -name "critical_todos*" -o -name "stale_branches*" -o -name "add-*.cjs" -o -name "fix-*.cjs" -o -name "branch-ruleset*" -o -name "ruleset-update*" -o -name "claude_code_*.sh" -o -name "thumbnail*" \)

# 4. Orphaned tool directories (check each: if no tool using it, mark for removal)
for d in .kilo .kilocode .lovable .mimocode .roo; do
  [ -d "$d" ] && du -sh "$d" 2>/dev/null && echo "CANDIDATE: $d"
done

# 5. Duplicate files
find . -name "CHANGELOG.md.backup" -o -name "README.md.bak" -not -path './node_modules/*'

# 6. Check git for historically deleted files still in tracking
git log --diff-filter=D --name-only --pretty=format: | sort -u | head -30
```

### Categorization

After gathering, group by:

- `safe-to-delete` — unambiguous junk (backups, patches, empty files)
- `review-needed` — might have value (session notes, audit reports, configs)
- `large-artifacts` — >1MB, shows size estimate

Present a summary table: | Category | Count | Space | Action |

Ask user which categories to clean before proceeding.

## Phase 2: Clean

For approved categories:

1. **Untracked files** → `rm -f <path>`
2. **Tracked files** → `git rm -f <path>` (stages deletion)
3. **Directories** → `rm -rf <path>` (confirm large dirs first)

Provide a single summary of: files deleted, files staged for git commit, space freed.

## Phase 3: Retrospect & Improve

After cleanup, analyze what was actually found vs expected patterns:

1. **What was found that the patterns missed?** — New categories or file naming patterns
2. **What patterns had false positives?** — Files that matched but shouldn't be deleted
3. **What patterns matched nothing?** — Consider demoting or removing stale patterns
4. **What new tool directories appeared?** — Add to detection list

Then update `references/patterns.md`:

- Add new patterns discovered
- Add false-positive notes with context
- Increment `version` and `last_updated`
- Add a `## Learnings: <date>` section with findings

### Retrospect procedure

After cleanup completes, run a quick analysis:

```bash
# Check what else might be stale at root
find . -maxdepth 1 -type f -not -path './.git/*' | sort
```

Ask: "Any of these remaining root files also look stale?" If yes, note in `patterns.md`.

Then say: "Self-improvement applied: [N] new patterns added to references/patterns.md."
