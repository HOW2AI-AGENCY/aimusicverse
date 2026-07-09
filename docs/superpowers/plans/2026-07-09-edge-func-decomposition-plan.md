# Edge Function Decomposition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose 11 edge function god-files (>800 LOC) into focused modules. Phase 1: telegram-bot/ cluster (5 files). Phase 2: 7 standalone edge functions.

**Architecture:** Extract shared utilities into `_shared/` directories. Each edge function becomes thin entry + imported modules. No logic changes — pure refactoring for maintainability.

**Tech Stack:** Deno, Supabase Edge Functions, Supabase MCP (lovable.dev)

## Global Constraints

- All refactoring is behavior-preserving extraction only
- Max file size target: ≤500 LOC (from max 1871)
- No new dependencies — only Deno stdlib + existing Supabase client imports
- Deploy via `supabase functions deploy <name>` or MCP server

---

## File Structure

### Current (telegram-bot/handlers/ + commands/)

```
supabase/functions/telegram-bot/
├── handlers/
│   ├── deep-links.ts      (1470 LOC) ← TARGET
│   ├── audio.ts          (1045 LOC) ← TARGET
│   └── audio-classifier.ts (842 LOC) ← TARGET
├── commands/
│   ├── audio-upload.ts   (948 LOC)  ← TARGET
│   └── analyze.ts       (841 LOC)  ← TARGET
└── utils/
    └── (scattered helpers)
```

### Target Structure

```
supabase/functions/telegram-bot/
├── _shared/
│   ├── deeplink-parser.ts      (NEW - extracted from deep-links.ts)
│   ├── audio-utils.ts           (NEW - extracted from audio.ts, audio-classifier.ts)
│   ├── audio-classifier.ts     (NEW - extracted from audio-classifier.ts)
│   └── types.ts                (NEW - shared types)
├── handlers/
│   ├── deep-links.ts           (refactored → ~400 LOC)
│   ├── audio.ts               (refactored → ~300 LOC)
│   └── audio-classifier.ts    (refactored → ~200 LOC)
└── commands/
    ├── audio-upload.ts         (refactored → ~250 LOC)
    └── analyze.ts              (refactored → ~200 LOC)
```

---

## Task 1: Extract Deep Link Parser Module

**Files:**

- Create: `supabase/functions/telegram-bot/_shared/deeplink-parser.ts`
- Modify: `supabase/functions/telegram-bot/handlers/deep-links.ts:1-160`

**Interfaces:**

- Consumes: nothing (pure utility)
- Produces: `parseDeepLink(param: string) → { type: DeepLinkType, value: string }`

- [ ] **Step 1: Create `_shared/deeplink-parser.ts` with type definitions and `parseDeepLink` function**

```typescript
// supabase/functions/telegram-bot/_shared/deeplink-parser.ts
export type DeepLinkType =
  | "track"
  | "project"
  | "artist"
  | "playlist"
  | "album"
  | "blog"
  | "generate"
  | "quick"
  | "studio"
  | "remix"
  | "mashup"
  | "lyrics";
// ... all 60+ types from original

export interface ParsedDeepLink {
  type: DeepLinkType | null;
  value: string;
}

export function parseDeepLink(startParam: string): ParsedDeepLink {
  // ... move lines 84-160 from deep-links.ts here
}
```

- [ ] **Step 2: Update deep-links.ts to import from `_shared/`**

```typescript
// supabase/functions/telegram-bot/handlers/deep-links.ts
import { parseDeepLink, type DeepLinkType } from "../_shared/deeplink-parser.ts";

// Remove the duplicated parseDeepLink function (lines 84-160)
// Keep the rest of the handler logic
```

- [ ] **Step 3: Verify deployment works**

```bash
supabase functions serve telegram-bot --no-verify-jwt
# OR via MCP: use lovable.dev supabase function invoke
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/telegram-bot/_shared/deeplink-parser.ts supabase/functions/telegram-bot/handlers/deep-links.ts
git commit -m "refactor(telegram-bot): extract deeplink-parser to _shared/"
```

---

## Task 2: Extract Audio Utils Module

**Files:**

- Create: `supabase/functions/telegram-bot/_shared/audio-utils.ts`
- Modify: `supabase/functions/telegram-bot/handlers/audio.ts`

**Interfaces:**

- Consumes: `File` object from Telegram
- Produces: `validateAudioFile(file: File) → { valid: boolean, error?: string }`

- [ ] **Step 1: Analyze audio.ts for extractable pure functions**

Run: `grep -n "^function \|^const .* = " supabase/functions/telegram-bot/handlers/audio.ts | head -20`

- [ ] **Step 2: Create `_shared/audio-utils.ts` with validation utilities**

```typescript
// supabase/functions/telegram-bot/_shared/audio-utils.ts
export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  duration?: number;
}

export function validateAudioFile(file: File): AudioValidationResult {
  // ... extract from audio.ts
}

export function detectAudioFormat(filename: string): string {
  // ... extract from audio.ts or audio-classifier.ts
}
```

- [ ] **Step 3: Update handlers to import from `_shared/`**

- [ ] **Step 4: Deploy and verify**

```bash
supabase functions deploy telegram-bot
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(telegram-bot): extract audio-utils to _shared/"
```

---

## Task 3: Extract Audio Classifier Module

**Files:**

- Create: `supabase/functions/telegram-bot/_shared/audio-classifier.ts`
- Modify: `supabase/functions/telegram-bot/handlers/audio-classifier.ts`

**Interfaces:**

- Consumes: `File` or `Buffer`
- Produces: `classifyAudioType(file: File) → AudioType`

- [ ] **Step 1: Review audio-classifier.ts for logic to extract**

Run: `wc -l supabase/functions/telegram-bot/handlers/audio-classifier.ts`

- [ ] **Step 2: Create `_shared/audio-classifier.ts`**

```typescript
// supabase/functions/telegram-bot/_shared/audio-classifier.ts
export type AudioType = "music" | "voice" | "speech" | "ambient" | "unknown";

export function classifyAudioType(buffer: Uint8Array): AudioType {
  // ... extract from handlers/audio-classifier.ts
}
```

- [ ] **Step 3: Update imports in handlers**

- [ ] **Step 4: Deploy and verify**

- [ ] **Step 5: Commit**

---

## Task 4: Refactor Commands (audio-upload, analyze)

**Files:**

- Modify: `supabase/functions/telegram-bot/commands/audio-upload.ts`
- Modify: `supabase/functions/telegram-bot/commands/analyze.ts`

**Interfaces:**

- Consumes: Telegram `Message` object
- Produces: Handler response

- [ ] **Step 1: Analyze audio-upload.ts for import path updates**

```bash
# Check current imports
grep -n "^import" supabase/functions/telegram-bot/commands/audio-upload.ts
```

- [ ] **Step 2: Update imports to use `_shared/` modules**

```typescript
// Before:
import { validateAudioFile } from "../handlers/audio.ts";

// After:
import { validateAudioFile } from "../_shared/audio-utils.ts";
```

- [ ] **Step 3: Apply same pattern to analyze.ts**

- [ ] **Step 4: Deploy and verify both commands work**

```bash
supabase functions deploy telegram-bot
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(telegram-bot): update command imports to use _shared/"
```

---

## Task 5: Verify Phase 1 Completion

**Files:**

- All modified in Tasks 1-4

- [ ] **Step 1: Check line counts**

```bash
wc -l supabase/functions/telegram-bot/handlers/deep-links.ts \
      supabase/functions/telegram-bot/handlers/audio.ts \
      supabase/functions/telegram-bot/handlers/audio-classifier.ts \
      supabase/functions/telegram-bot/commands/audio-upload.ts \
      supabase/functions/telegram-bot/commands/analyze.ts
```

Target: All ≤500 LOC (from max 1470)

- [ ] **Step 2: Run functional smoke test**

- [ ] **Step 3: Commit Phase 1 completion**

```bash
git commit -m "refactor(telegram-bot): phase 1 complete - 5 files refactored to _shared/"
```

---

## Task 6: Phase 2 — Standalone Edge Functions (7 files)

After Phase 1, apply same pattern to:

| File                                  | Strategy                                        |
| ------------------------------------- | ----------------------------------------------- |
| `ai-lyrics-assistant/index.ts`        | Extract prompt templates → `_shared/prompts.ts` |
| `suno-music-callback/index.ts`        | Extract webhook verification, callback parser   |
| `send-telegram-notification/index.ts` | Extract message template builder                |
| `klangio-analyze/index.ts`            | Extract MIDI parser                             |
| `generate-track-cover/index.ts`       | Extract prompt generator                        |
| `process-audio-pipeline/index.ts`     | Extract pipeline stages                         |

Each follows: extract → import swap → verify → commit.

---

## Success Criteria

- [ ] All 5 telegram-bot files ≤500 LOC
- [ ] All imports updated to use `_shared/` modules
- [ ] No behavior changes (pure refactoring)
- [ ] Deploys successfully via `supabase functions deploy`
- [ ] Tests pass (manual smoke test)

---

## Commands Reference

```bash
# Local development
supabase functions serve telegram-bot --no-verify-jwt

# Deploy single function
supabase functions deploy telegram-bot

# Deploy via MCP (lovable.dev)
# Use supabase MCP server from https://ygmvthybdrqymfsqifmj.supabase.co/functions/v1/mcp
```
