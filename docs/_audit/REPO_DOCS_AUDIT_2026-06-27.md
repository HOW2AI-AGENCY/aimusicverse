# 📋 Repository Documentation Audit — 2026-06-27

> **Scope:** root-level `*.md` (18 files) + `docs/` (100 files) + `docs/templates/`.
> **Goal:** identify duplicates, broken navigation, outdated metadata, and define the new visual system.

---

## 1. Executive Summary

| Metric                              | Value           |
| ----------------------------------- | --------------- |
| Root `.md` files                    | 18              |
| `docs/` files                       | 100             |
| Detected duplicates / overlaps      | **11 clusters** |
| Stale "last updated" stamps (>6 mo) | ~14 files       |
| Recommended archive moves           | 9 files         |
| Recommended merges                  | 5 pairs         |

---

## 2. Duplicate / Overlapping Clusters

| Cluster                | Files                                                                                                                                                        | Action                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Architecture**       | `ARCHITECTURE_HUB.md` (root), `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE_ANALYSIS.md`, `docs/COMPREHENSIVE_ARCHITECTURE.md`, `docs/ARCHITECTURE_DIAGRAMS.md` | Keep `ARCHITECTURE_HUB.md` as canonical; archive ANALYSIS + COMPREHENSIVE; keep DIAGRAMS as visual companion. |
| **Navigation**         | `docs/NAVIGATION.md`, `docs/NAVIGATION_GUIDE.md`, `docs/NAVIGATION_INDEX.md`, `docs/NAVIGATION_SYSTEM.md`                                                    | Merge into single `docs/NAVIGATION.md`; archive others.                                                       |
| **Index**              | `DOCUMENTATION_INDEX.md` (root), `docs/INDEX.md`                                                                                                             | Keep root as canonical hub; `docs/INDEX.md` → thin redirect.                                                  |
| **Known Issues**       | `KNOWN_ISSUES_TRACKED.md` (root), `docs/KNOWN_ISSUES.md`                                                                                                     | Merge into root `KNOWN_ISSUES_TRACKED.md`.                                                                    |
| **Summaries**          | `SUMMARY.md`, `REPOSITORY_IMPROVEMENTS_SUMMARY.md`                                                                                                           | Archive both — superseded by CHANGELOG + PROJECT_STATUS.                                                      |
| **Audio architecture** | `docs/PLAYER_ARCHITECTURE.md`, `docs/AUDIO_ARCHITECTURE_DIAGRAM.md`                                                                                          | Keep both, cross-link from ARCHITECTURE_HUB.                                                                  |

---

## 3. Stale Files (>180 days since "Last Updated")

Identified in: legacy `2025-12` archive (already archived ✅), `docs/MUSICVERSE_DESCRIPTION.md`, several SPRINT reports outside `/SPRINTS/completed/`. **Action:** add `> [!WARNING] Stale` banner or move to `docs/archive/2026-06-27/`.

---

## 4. Broken / Inconsistent Links

| Source                     | Target                                         | Status                   |
| -------------------------- | ---------------------------------------------- | ------------------------ |
| `README.md` § Документация | `docs/ARCHITECTURE.md#подробнее`               | anchor missing           |
| `DOCUMENTATION_INDEX.md`   | `docs/INDEX.md`                                | self-loop (both indexes) |
| Multiple                   | `KNOWN_ISSUES.md` vs `KNOWN_ISSUES_TRACKED.md` | inconsistent references  |

Full link-check to be re-run via `scripts/check-links.js` after rewrite pass.

---

## 5. Badge / Metadata Drift

- README badges OK (React 19.2, TS 5.9, Supabase 2.86) — match `package.json`.
- Missing: build status, coverage, bundle-size, license, last-commit, contributors, telegram-app badges.
- `CHANGELOG.md` lacks "Keep a Changelog" header + semver discipline in older entries.

---

## 6. New Visual System (adopted)

### Badge palette (shields.io, `style=for-the-badge`)

| Token   | Hex       | Use                  |
| ------- | --------- | -------------------- |
| Primary | `#26A5E4` | Telegram, brand      |
| Accent  | `#9333EA` | AI / generative      |
| Success | `#10B981` | passing, stable      |
| Warning | `#F59E0B` | beta, WIP            |
| Danger  | `#EF4444` | breaking, deprecated |
| Neutral | `#475569` | meta, version        |

### GitHub Alerts convention

- `> [!NOTE]` — informational context.
- `> [!TIP]` — best-practice hints.
- `> [!IMPORTANT]` — must-read before action.
- `> [!WARNING]` — risk of data loss / breakage.
- `> [!CAUTION]` — deprecated / security.

### Structural primitives

- `<div align="center">` hero with logo + tagline + badge stack + nav chips.
- `<details><summary>` collapsible sections for Quick Start, Tech Stack, Scripts, FAQ.
- Mermaid diagrams (`graph TD`, `flowchart LR`, `gantt`) for architecture & roadmap.
- Feature matrix tables with emoji + status chips (✅ 🚧 📋 ⛔).
- Footer block with "Related Docs" table — generated from `docs/templates/FOOTER_TEMPLATE.md`.

---

## 7. Archive Manifest — `docs/archive/2026-06-27/`

Moved:

- `SUMMARY.md`
- `REPOSITORY_IMPROVEMENTS_SUMMARY.md`
- `docs/ARCHITECTURE_ANALYSIS.md`
- `docs/COMPREHENSIVE_ARCHITECTURE.md`
- `docs/NAVIGATION_GUIDE.md`
- `docs/NAVIGATION_INDEX.md`
- `docs/NAVIGATION_SYSTEM.md`
- `docs/INDEX.md` (replaced by 1-line redirect)
- `docs/KNOWN_ISSUES.md` (merged)

---

## 8. Next Steps

1. ✅ Write new templates (`HEADER`, `FOOTER`, `BADGES`).
2. ✅ Rewrite root canonical docs: `README`, `README_RU`, `DOCUMENTATION_INDEX`, `REPOSITORY_STRUCTURE`, `CONTRIBUTING`, `SECURITY`, `CODE_OF_CONDUCT`, `CHANGELOG`, `ROADMAP`, `PROJECT_STATUS`, `ARCHITECTURE_HUB`, `KNOWN_ISSUES_TRACKED`.
3. ✅ Move archive set.
4. ⏭️ Re-run `scripts/check-links.js` post-merge.

---

_Audit produced: 2026-06-27. Maintainer: Documentation WG._
