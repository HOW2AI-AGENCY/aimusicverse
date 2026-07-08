---
version: 2
last_updated: 2026-07-08
---

# repo-cleanup Detection Patterns

## File Name Patterns (globs)

| Category                | Glob                                                                  | Check                                   | Priority |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------- | -------- |
| Backup files            | `*.bak`, `*.backup`, `*.old`, `*.orig`, `*~`, `#*#`                   | skip `.git/`, `node_modules/`           | high     |
| Patch artifacts         | `*.patch`, `*.diff`                                                   | skip `.git/`                            | high     |
| Empty files             | size=0                                                                | skip `.git/`, `node_modules/`, `.venv/` | high     |
| Session notes           | `SESSION-*.md`                                                        | root only                               | medium   |
| Final reports           | `FINAL_REPORT*.md`, `AUDIT-AND-PLAN-*.md`                             | root only                               | medium   |
| Sprint plans            | `SPRINT_*_PLAN.md`                                                    | root only                               | medium   |
| Push instructions       | `PUSH_INSTRUCTIONS.md`                                                | root only                               | medium   |
| Lockfile decisions      | `LOCKFILE_DECISION.md`                                                | root only                               | medium   |
| Known issues            | `KNOWN_ISSUES_*.md`, `*-ISSUES-TRACKED*.md`                           | root only                               | medium   |
| Mobile audit            | `MOBILE_AUDIT_*.md`, `MBILE_*FIXES*.md`                               | root only                               | medium   |
| Scraped text            | `all_todos.txt`, `critical_todos.txt`, `stale_branches.txt`           | root only                               | high     |
| One-off scripts         | `add-*.cjs`, `fix-*.cjs`, `fix-*.js`, `claude_code_*.sh`              | root only                               | medium   |
| One-off configs         | `branch-ruleset.json`, `ruleset-update.json`                          | root only                               | medium   |
| Temp media              | `thumbnail.jpg`, `screenshot*.png`, `capture*.png`                    | root only                               | medium   |
| Duplicate changelog     | `CHANGELOG.md.backup`, `README.md.bak`, `*.md.bak`                    | root only                               | high     |
| Workflow history debris | files in `.github/workflows/` deleted from git but staged by checkout | whole repo                              | low      |
| Zero-byte critical      | `critical_todos.txt` (size=0)                                         | root only                               | high     |
| Stale spec stubs        | `spec.md` (zero-length) in `**/specs/*/`                              | whole tree                              | low      |
| Stale PRD stubs         | `**/prd/**/*.md` (zero-length)                                        | whole tree                              | low      |

## Exclusion Rules (always skip)

| Pattern         | Reason                  |
| --------------- | ----------------------- |
| `*.gitkeep`     | Intentional placeholder |
| `.git/`         | Git internals           |
| `node_modules/` | Dependencies            |
| `.venv/`        | Python virtual env      |
| `coverage/`     | Test coverage output    |
| `dist/`         | Build output            |

## Directory Name Patterns

| Directory                    | Flag                                      | Typical Size | Action                                     |
| ---------------------------- | ----------------------------------------- | ------------ | ------------------------------------------ |
| `.kilo/`                     | tool dir, check if active                 | >1MB         | ask to remove if no active kilo project    |
| `.kilocode/`                 | tool dir, check if active                 | >1MB         | ask to remove                              |
| `.lovable/`                  | tool dir                                  | varies       | ask to remove if project not using lovable |
| `.mimocode/`                 | tool dir                                  | >1MB         | ask to remove                              |
| `.roo/`                      | tool dir                                  | varies       | ask to remove                              |
| `.specify/`                  | tool dir                                  | varies       | ask to remove                              |
| `.storybook/`                | stale if no storybook dep in package.json | varies       | ask to remove                              |
| `node_modules/` in worktrees | `.kilo/worktrees/*/node_modules/`         | large        | warn but skip (worktree may be active)     |

## Detection Rules

1. **Always** skip `.git/`, `node_modules/`, `.venv/`, `coverage/`, `dist/`
2. **Root-only** patterns: only match files directly in repo root (`find -maxdepth 1 -type f`)
3. For untracked files: check `git ls-files --error-unmatch` before `git rm`; fallback to `rm -f`
4. For directories >50MB: ask confirmation before deletion
5. For tracked files: use `git rm -f` to stage deletion
6. **Post-cleanup re-scan**: mandatory — re-run scanner after all deletions. If anything remains user-approved remaining, note in retrospect and skip.
7. **Zero-length `.gitkeep` files**: always intentional. Exclude from empty-file detection.

## Learnings: 2026-07-08

First real run on MusicVerse repo:

- `ruleset-update.json` was untracked, not tracked — `git rm` failed gracefully. Use `rm -f` fallback for untracked.
- `.superpowers/sdd/progress.md.bak` found inside a directory, not root. Patterns matched correctly.
- 11 `.diff` review files in `.superpowers/sdd/` were not caught by root-only pattern. Add `**/*.diff` (excluding `.git/`) as a general pattern.
- `CHANGELOG.md.backup` was tracked in git — `git rm` needed, not just `rm`.
- `.storybook/` keeps `main.js` + `preview.jsx` — small (~1KB), but if storybook dep removed from package.json, should be cleaned.
- `.storybook/` still present in project despite stories in `src/stories/` — check whether storybook is actually in use before removing.
- `thumbnail.jpg` was 658KB at root — no longer referenced from any page.
- `claude_code_zai_env.sh` — environment setup script, one-time use.

## Learnings: 2026-07-08 (Post-Retrospect)

- Add `.kilo/worktrees/` subdirs as candidates — 236MB found in `.kilo/worktrees/rocky-college/`
- Add `.venv/` as active dependency (skip always, but note it)
- Add check for `package.json` having storybook dep before suggesting `.storybook/` removal
- Add `.storybook/` check: `grep '"storybook"' package.json` — if missing, flag stale

## Learnings: 2026-07-08 (Second Scan — Deep)

After root cleanup, re-ran scanner. New findings:

- `CHANGELOG.md.backup` persisted after first `git rm` — scanner caught it still tracked. Root cause: file wasn't staged yet. Solution: always verify post-cleanup with scanner re-run.
- `src/__tests__/lib/errors.test.ts.backup` — `.backup` extension in a subdirectory, not caught by root-only pattern. Add `**/*.backup` (whole-tree scan, excluding node_modules/.git/.venv).
- Zero-length files in `.kilo/`, `.kilocode/`, `.mimocode/` `node_modules/` — all from orphaned tool dirs. Side effect: remove orphaned dirs, these vanish with them.
- Zero-length `.gitkeep` files in `docs/archive/`, `public/screenshots/`, `src/components/*/` — intentional placeholder files. **False positive** — add `!.gitkeep` exclusion.
- Zero-length `spec.md` in `specs/001-sunoapi-integration-audit/` — not a placeholder, should not exist. Flag but ask.
- Zero-length `.md` in `docs/archive/audits/ПОЛНЫЙ_АНАЛИЗ_ЛОГИКИ_И_ИНТЕРФЕЙСА.md` — probably a stale archive artifact.
- Zero-length `prd/pages/01-home-generation-form-ru.md` — stale PRD placeholder.
- **New pattern to add**: `**/specs/*/spec.md` (zero-length = stale, deletable)
- **New pattern to add**: `**/prd/**/*.md` (zero-length = stale, deletable)
- **New false positive rule**: `*.gitkeep` files are intentional, skip always
- **Post-cleanup re-scan**: mandatory — re-run scanner after all deletions to verify zero matches
