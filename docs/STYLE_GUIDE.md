# Documentation Style Guide

> Single source of truth for how README files and every document under `docs/`
> are written, formatted and decorated. Enforced by `markdownlint`
> (`.markdownlint.jsonc`) and the `Docs` GitHub Actions workflow.

---

## 1. File anatomy

Every top-level document follows this skeleton:

```markdown
# <Title>

<!-- BADGES:START -->
... auto-generated badges ...
<!-- BADGES:END -->

> One-sentence purpose statement.

## Table of Contents (optional, for >300 lines)

## <Sections...>

---

_Last updated: YYYY-MM-DD · Maintainer: @handle_
```

Use the shared templates verbatim where possible:

- `docs/templates/HEADER_TEMPLATE.md`
- `docs/templates/BADGES_TEMPLATE.md`
- `docs/templates/FOOTER_TEMPLATE.md`

## 2. Headings

| Level | Use for                                  | Rule                          |
| ----- | ---------------------------------------- | ----------------------------- |
| `#`   | Document title                           | Exactly **one** per file      |
| `##`  | Top-level sections                       | Title Case                    |
| `###` | Sub-sections                             | Sentence case                 |
| `####`| Nested details                           | Avoid going deeper than `####`|

- Never skip a level (no `##` → `####`).
- Headings end **without** trailing punctuation.

## 3. Badges

Badges live in a single block delimited by `<!-- BADGES:START -->` and
`<!-- BADGES:END -->` so the badge updater workflow can refresh them
automatically.

Standard palette (Shields.io hex, `style=flat-square`):

| Purpose   | Color    |
| --------- | -------- |
| Primary   | `26A5E4` |
| Success   | `10B981` |
| Warning   | `F59E0B` |
| Danger    | `EF4444` |
| Neutral   | `475569` |

See `docs/templates/BADGES_TEMPLATE.md` for the canonical snippet.

## 4. Links

- Use **relative** links between repo docs (`../CONTRIBUTING.md`).
- External links must be HTTPS.
- Don't link to ephemeral preview URLs (`*.lovable.app`) — they're excluded
  from CI link-checking and considered unstable references.

## 5. Code blocks

- Always specify a language: ` ```ts `, ` ```bash `, ` ```sql `.
- Use ` ```mermaid ` for diagrams. Prefer `flowchart`, `sequenceDiagram`,
  `erDiagram`, `gantt`.
- Keep examples runnable — no pseudo-code unless clearly labelled.

## 6. Admonitions

Prefer GitHub-flavoured callouts:

```markdown
> [!NOTE] Short clarification.
> [!TIP]  Optional improvement.
> [!WARNING] Footgun or constraint.
> [!CAUTION] Security / data-loss risk.
```

## 7. Tables

- Always include a header row.
- Pipes aligned for readability in source; CI does not enforce alignment.
- Long tables → consider a collapsible `<details>` block.

## 8. Tone

- English (`README.md`, `docs/*`) — concise, second person ("you"), present tense.
- Russian (`README_RU.md`) — same structure, neutral business tone, no slang.
- Avoid marketing adjectives ("blazing fast", "revolutionary").

## 9. File names

- `SCREAMING_SNAKE_CASE.md` for root-level governance docs
  (`README.md`, `CHANGELOG.md`, `ROADMAP.md`, …).
- `kebab-case.md` inside `docs/` for topical guides.
- One concept per file. Split rather than nest beyond ~600 lines.

## 10. Lifecycle

| Status      | Where it lives             | Notes                                  |
| ----------- | -------------------------- | -------------------------------------- |
| Active      | Root or `docs/`            | Linked from `DOCUMENTATION_INDEX.md`   |
| Deprecated  | Stub at original path      | Stub links to replacement              |
| Archived    | `docs/archive/<YYYY-MM-DD>/` | Not built into the MkDocs site       |

## 11. Automation

| Workflow                          | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `.github/workflows/docs.yml`      | Lint markdown, check links, build & deploy MkDocs |
| `.github/workflows/update-badges.yml` | Regenerate version badges from `package.json`  |
| `scripts/update-badges.mjs`       | Local equivalent: `node scripts/update-badges.mjs` |

## 12. Checklist before merging a docs PR

- [ ] One `#` heading, sentence/Title Case respected
- [ ] Badges block intact (markers not removed)
- [ ] All links relative & valid (`lychee` green)
- [ ] Code fences have a language
- [ ] Updated `DOCUMENTATION_INDEX.md` if a new doc was added
- [ ] Footer date refreshed

---

_Last updated: 2026-06-27 · Maintainer: Docs WG_
