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

<!-- BEGIN sqz-agents-guidance (auto-installed by sqz init; remove this block to disable) -->

## sqz — Token-Optimized CLI Output

When running shell commands whose output may be long (directory listings,
git log/diff, test runners, build logs, `docker ps`, `kubectl get`, etc.),
pipe the output through `sqz compress` to reduce token consumption.

`sqz` is a stdin-to-stdout compressor, not a command wrapper. The correct
usage is to pipe the command's output into `sqz compress`:

```bash
# Instead of:     Use:
git status        git status 2>&1 | C:/Users/oat70/.cargo/bin/sqz.exe compress
cargo test        cargo test 2>&1 | C:/Users/oat70/.cargo/bin/sqz.exe compress
git log -10       git log -10 2>&1 | C:/Users/oat70/.cargo/bin/sqz.exe compress
docker ps         docker ps 2>&1 | C:/Users/oat70/.cargo/bin/sqz.exe compress
ls -la            ls -la 2>&1 | C:/Users/oat70/.cargo/bin/sqz.exe compress
```

The `2>&1` captures stderr too, which is useful for commands like `cargo
test` where diagnostics go to stderr. `sqz compress` filters and compresses
the combined output while preserving filenames, paths, and identifiers.
It typically saves 60-90% tokens on verbose commands.

Do NOT pipe output for:

- Interactive commands (`vim`, `ssh`, `python`, REPLs)
- Compound commands with shell operators (`cmd && other`, `cmd > file.txt`,
  `cmd; other`) — run those directly
- Short commands whose output is already a few lines

If `sqz` is not on PATH, run commands normally.

The `sqz-mcp` MCP server is also available — Codex reads it from
`~/.codex/config.toml` under `[mcp_servers.sqz]`. It exposes three
tools: `compress` (the default pipeline), `passthrough` (return text
unchanged — the escape hatch below), and `expand` (resolve a
`§ref:HASH§` token back to the original bytes).

## Escape hatch — when sqz output confuses you

If you see a `§ref:HASH§` token and can't parse it, or compressed
output is leading you to make lots of small retries instead of one
big request, use one of these:

- **`C:/Users/oat70/.cargo/bin/sqz.exe expand <prefix>`** — resolve a dedup ref back to the
  original bytes. Accepts bare hex (`sqz expand a1b2c3d4`) or the full
  token pasted verbatim (`sqz expand §ref:a1b2c3d4§`).
- **`SQZ_NO_DEDUP=1`** — set this env var for one command to disable
  dedup: `SQZ_NO_DEDUP=1 git status 2>&1 | sqz compress`. You'll get
  the full compressed output with no `§ref:…§` tokens.
- **`--no-cache`** — same opt-out as a CLI flag:
  `git status 2>&1 | sqz compress --no-cache`.

If you're using the MCP server, the `passthrough` tool returns raw
text and the `expand` tool resolves refs — call them when you need
data sqz hasn't touched.

<!-- END sqz-agents-guidance -->
