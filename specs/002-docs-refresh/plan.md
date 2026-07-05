# Implementation Plan: Docs Refresh Audit & Unification

**Branch**: `002-docs-refresh` | **Date**: 2026-06-28 | **Spec**: [specs/002-docs-refresh/spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-docs-refresh/spec.md`

**Note**: Generated via `/speckit.plan`; stops at Phase 2 planning.

## Summary

Refresh and unify documentation so auditors, new engineers, and API consumers get a canonical, deduplicated, and tested doc set. Deliverables: doc inventory with dispositions/owners, unified IA + redirects, refreshed quickstart (≤45 minutes target), API doc alignment with canonical OpenAPI reference, and doc quality gates.

## Technical Context

**Language/Version**: Markdown + TypeScript 5.x (tooling), Node.js 20, Vite 5 for site preview
**Primary Dependencies**: Markdown corpus in `docs/`, React/Vite app shell (for preview), Supabase references (no direct code changes), Telegram Mini App context for terminology
**Storage**: Git-tracked markdown in repo; redirects as markdown pointers/tables
**Testing**: Markdown lint + link checking (linkinator or markdown-link-check); spot-check OpenAPI vs docs; no runtime tests expected
**Target Platform**: Repository consumers (web/github view) + contributors’ local env; mobile-first reading still required by constitution
**Project Type**: Web/docs (single repo; no backend changes)
**Performance Goals**: Docs navigation latency negligible; quickstart completion ≤45 minutes by newcomer
**Constraints**: Constitution non-negotiables (size-limit 950KB for app, single audio source, @/lib/motion import rule) must not be violated; avoid new dependencies that bloat bundle
**Scale/Scope**: ~100+ docs; scope limited to audit + IA + quickstart + API alignment for this feature

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Spec-first and doc-first are satisfied (working inside specs/002-docs-refresh).
- No framer-motion direct imports; no Supabase calls in components planned (docs-only work) → **PASS**.
- Performance budget 950KB unchanged (no bundle additions) → **PASS**.
- Mobile-first reading upheld by keeping touch-target guidance and safe-area notes in docs → **PASS**.
- Single audio source unaffected (no code paths touched) → **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/002-docs-refresh/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (doc refresh quickstart)
├── contracts/           # Phase 1 contracts (API alignment, redirect map schema)
└── tasks.md             # Phase 2 (NOT created here)
```

### Source Code / Docs (repository root focus)

```text
docs/
├── README.md               # Canonical index (current)
├── QUICK_START.md          # Existing quickstart to normalize
├── API.md                  # Canonical API reference entry
├── INDEX.md / NAVIGATION.md
├── ... (feature/arch/design/testing subfolders)

specs/                      # Existing specifications
ADR/                        # Architecture decisions (for ownership cross-links)
```

**Structure Decision**: Docs-centric work: primary edits in `docs/` (inventory, IA, redirects, quickstart normalization, API alignment notes) and `specs/002-docs-refresh/*` outputs. No new code packages or bundles added.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _None_    | —          | —                                    |
