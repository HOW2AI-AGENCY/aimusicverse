# Edge Function Decomposition — Design Spec

**Date:** 2026-07-09
**Status:** Design (pre-implementation)
**Scope:** `supabase/functions/` — 11 files >800 LOC
**Phase 1 target:** `telegram-bot/` cluster (4 files)

---

## 1. Current State

`supabase/functions/` has 136 deployed edge functions. 11 files exceed 800 LOC:

| File | Lines |
|---|---|
| `supabase/functions/ai-lyrics-assistant/index.ts` | 1871 |
| `supabase/functions/telegram-bot/handlers/deep-links.ts` | 1470 |
| `supabase/functions/suno-music-callback/index.ts` | 1319 |
| `supabase/functions/send-telegram-notification/index.ts` | 1121 |
| `supabase/functions/klangio-analyze/index.ts` | 1084 |
| `supabase/functions/telegram-bot/handlers/audio.ts` | 1045 |
| `supabase/functions/generate-track-cover/index.ts` | 1015 |
| `supabase/functions/telegram-bot/commands/audio-upload.ts` | 948 |
| `supabase/functions/telegram-bot/handlers/audio-classifier.ts` | 842 |
| `supabase/functions/telegram-bot/commands/analyze.ts` | 841 |
| `supabase/functions/process-audio-pipeline/index.ts` | 822 |

These are not unit-testable in current form (Deno, no vitest). Shared logic is duplicated across files (audio format detection, deep link parsing, Telegram message formatting).

---

## 2. Approach

**Approach B — Service modules.** Extract shared logic into `_shared/` directories. Each edge function becomes entry + 1-3 internal modules. Files shrink to ≤400 LOC.

### Phase 1: `telegram-bot/` (4 files)

**Current structure:**
```
supabase/functions/telegram-bot/
├── index.ts
├── commands/
│   ├── audio-upload.ts   (948)
│   └── analyze.ts        (841)
└── handlers/
    ├── deep-links.ts     (1470)
    ├── audio.ts          (1045)
    └── audio-classifier.ts (842)
```

**Target structure:**
```
supabase/functions/telegram-bot/
├── index.ts              → thin entry, <50 loc
├── router.ts             → command routing + middleware
├── _shared/
│   ├── telegram-client.ts       → Bot API wrapper
│   ├── audio-utils.ts           → format detection, validation
│   ├── deeplink-parser.ts       → deep link → action mapping
│   └── types.ts                 → shared types
├── commands/
│   ├── start.ts                 → /start
│   ├── generate.ts              → /generate
│   ├── library.ts               → /library
│   ├── analyze.ts               → /analyze (extracted from 841→200)
│   └── audio-upload.ts          → file upload flow (948→250)
└── handlers/
    ├── deep-links.ts            → inline queries (1470→350)
    ├── audio-classifier.ts      → type detection (842→250)
    └── callback.ts              → inline keyboard callbacks
```

**Max file size after:** ~400 LOC (was 1470).

### Phase 2: Standalone edge functions (7 files)

Each gets its own decomposition:

| File | Strategy |
|---|---|
| `ai-lyrics-assistant/index.ts` | Extract: prompt templates → `_shared/prompts.ts`, response parser → `_shared/parser.ts` |
| `suno-music-callback/index.ts` | Extract: webhook signature verification, callback state machine |
| `send-telegram-notification/index.ts` | Extract: message template builder, recipient resolver |
| `klangio-analyze/index.ts` | Extract: MIDI parser, format converter |
| `generate-track-cover/index.ts` | Extract: prompt generator, image post-processor |
| `process-audio-pipeline/index.ts` | Extract: pipeline stages into separate files |

---

## 3. Extraction Rules

1. **Behavior-preserving** — extracted code is pure copy + import path update. No logic changes.
2. **One export per concern** — each extracted module exports one function or one class.
3. **`_shared/` only for cross-file reuse** — if a module is used by one file, keep it co-located.
4. **No new dependencies** — extracted modules use only Deno stdlib + Supabase client (already imported).
5. **No barrel indexes** — import directly from the file path to avoid circular deps.

---

## 4. Migration Plan (per edge function)

1. Create `_shared/` directory with extracted modules
2. Update imports in existing file to point at new modules
3. Verify deployment: `supabase functions serve <name> --no-verify-jwt`
4. Delete extracted code from original file
5. Split remaining entry file into sub-modules if still >400 LOC
6. Deploy: `supabase functions deploy <name>`

No downtime — each step is import-path-only until final deletion.

---

## 5. Testing

Edge functions have 0 unit tests today (Deno runtime, no vitest). Add:

- **3 smoke tests per `_shared/` module** — pure function calls, no network
- Test file: `.test.ts` alongside each module, runnable via `deno test`
- **No CI integration yet** — tests run manually on deploy

---

## 6. Success Criteria

- All 11 files ↓ to ≤500 LOC (from max 1871)
- `telegram-bot/` max file ≤400 LOC (from 1470)
- 0 regressions in deployed behavior
- `_shared/` modules have ≥1 smoke test each

---

## 7. Future Scope (not in Phase 1-2)

- CI integration for Deno tests (`deno test` in GitHub Actions)
- Per-command E2E tests via `supabase functions serve`
- Type generation from shared types across edge functions

---

## 8. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Split granularity | Per-command files | Matches existing `commands/` convention |
| Module format | One export per file | No barrel indexes, no circular deps |
| Test framework | `deno test` | Already in environment, no install needed |
| `_shared/` location | Per-function `_shared/` | Isolated scope, no cross-function coupling |
| Entry file size target | ≤100 LOC | Router pattern keeps entry thin |
