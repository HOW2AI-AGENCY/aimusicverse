# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Package Manager

- **npm** (ESM — `"type": "module"`). All scripts use `npm run`.

## File-Scoped Commands

- Single test: `npx vitest run <path>` or `npm test -- <path>`
- Build chain: `npm run check:design-tokens` runs before `vite build` (custom ESLint plugin `./eslint-rules/section-tokens.js` enforces `section-tokens/no-saturated-brand`)
- Full check: `npm run check-all` (lint + format:check + typecheck + test)

## Commit Attribution

- Conventional commits enforced via commitlint + husky `pre-commit` hook
- `lint-staged`: `*.{ts,tsx}` → eslint --fix + prettier --write; `*.{json,md,css}` → prettier --write

## graphify

This project uses graphify for knowledge graph management.

- `graphify query "<question>"` — query the graph
- `graphify path "<A>" "<B>"` — find paths between nodes
- `graphify explain "<concept>"` — explain a node
- `graphify update .` — update after code changes (AST-only, no API cost)
- Dirty graphify-out/ files after hooks are expected; not a reason to skip graphify

## Non-Obvious Rules (Will Fail Build or Lint)

- **Import wrappers (ESLint ERROR)**: `framer-motion` → `@/lib/motion`, `lucide-react` → `@/lib/icons`
- **No direct `supabase.from()`** in components (enforced via `no-restricted-syntax`)
- **No arbitrary px** in className for spacing/padding/margin/gap or font-size/leading (exception: 1-2px hairline borders only)
- **Console limited**: only `warn`/`error`, only in `src/lib/logger.ts`, `src/lib/sentry.ts`, `src/lib/debug/**`, `src/lib/icons.ts`, `src/lib/motion.ts`
- **Lazy loading tiers**: critical pages use `lazyWithRetry` from `@/lib/performance`; admin/heavy pages use `/* webpackChunkName: "..." */` naming

## Debugging

- Boot logs stored in `sessionStorage` key `musicverse_boot_log`; exposed via `window.__BOOT_LOG` and `window.__getBootLog()`
- Global error handlers filter `AbortError` (DOMException name: `'AbortError'`) — they are silenced
- Viewport CSS vars: `--vh`, `--keyboard-height`; toggle class `keyboard-open` when keyboard > 150px
- Audio Service Worker registered at `/audio-sw.js`

---

<div align="center">

[← CLAUDE.md](./CLAUDE.md) · [↑ К индексу](./DOCUMENTATION_INDEX.md) · [CONTRIBUTING.md →](./CONTRIBUTING.md)

<sub>Обновлено: 29.06.2026</sub>

</div>
