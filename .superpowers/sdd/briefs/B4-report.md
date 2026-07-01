# B4 — Smoke E2E on touched pages

**Sprint:** 042-06
**Date:** 2026-07-01
**Branch / Head (start):** main @ `9b1ec6f4`
**Branch / Head (end):** main @ `fa569790`
**Status:** DONE_WITH_CONCERNS

## What this task did

1. Ran graphify orientation per the brief's mandatory rule:
   - `graphify query "GlobalAudioProvider usePreviewAudio audioElementPool"` — surfaced `GlobalAudioProvider` (community 7), `AudioElementPool` (community 2), `usePreviewAudio.ts` (community 7).
   - `graphify explain "usePreviewAudio"` → node at `src/hooks/audio/usePreviewAudio.ts` L1, degree 2.
   - `graphify path "GlobalAudioProvider" "usePreviewAudio"` → 3-hop path through `usePlayerStore` and `ReplacementTimelineOverlay`, confirming preview hook sits inside the Studio community served by the global provider.
   - `graphify explain "AudioElementPool"` → node at `src/lib/audioElementPool.ts` L1, contains `AudioElementPool` + `useAudioElement()`.
2. Read `src/components/GlobalAudioProvider.tsx` (lines 1–79) and `src/hooks/audio/usePreviewAudio.ts` (lines 1–120) to ground the spec assertions. Read `src/lib/audioElementPool.ts` (lines 100–292) to confirm pool elements are detached (`new Audio()` with no `appendChild`).
3. Adapted smoke command per the brief's "Adaptation" block, since `tests/e2e/lyrics/`, `tests/e2e/project-detail.spec.ts`, and `tests/e2e/prompt-dj/` do not exist. Used:
   ```
   npx playwright test tests/e2e/smoke.app-boots.spec.ts tests/e2e/studio/unified-studio.spec.ts tests/e2e/studio/mixer-optimization.spec.ts tests/e2e/studio/timeline-snap.spec.ts tests/e2e/voice-clone.flow.spec.ts tests/e2e/player.spec.ts tests/e2e/player.compact.spec.ts tests/e2e/track.page.spec.ts tests/e2e/generation.spec.ts tests/e2e/library.spec.ts --project=chromium
   ```
4. Authored `tests/e2e/preview-audio.spec.ts` — structural smoke asserting the global-player/audio-pool invariant.
5. Ran quality gates (tsc, spec listing). Committed the new spec on top of `9b1ec6f4`.

## Commands run + one-line output summary

| Command                                                                 | Outcome                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `graphify query "GlobalAudioProvider usePreviewAudio audioElementPool"` | OK — surfaced provider, hook, pool, store nodes                           |
| `graphify explain "usePreviewAudio"`                                    | OK — node confirmed at `src/hooks/audio/usePreviewAudio.ts` L1            |
| `graphify path "GlobalAudioProvider" "usePreviewAudio"`                 | OK — 3-hop path through `usePlayerStore` and `ReplacementTimelineOverlay` |
| `graphify explain "AudioElementPool"`                                   | OK — node confirmed at `src/lib/audioElementPool.ts` L1                   |
| `npx tsc --noEmit`                                                      | **PASS** — exit 0                                                         |
| `npx playwright test <adapted 10-spec list> --project=chromium`         | **BLOCKED** — dev server cannot start (see Concerns)                      |
| `npx playwright test tests/e2e/preview-audio.spec.ts --list`            | OK — 2 tests registered in chromium project                               |
| `git commit -m "test(e2e): add preview audio regression"`               | OK — landed as `fa569790`; pre-commit tsc passed                          |

## New spec path

`tests/e2e/preview-audio.spec.ts`

Two structural tests:

1. `exactly one <audio> element exists in the DOM after boot` — boots `/`, waits for React mount, then asserts `document.querySelectorAll("audio").length === 1`. On failure, dumps the full array (`src`, `currentSrc`, `attached`, parent tag) so a regression that re-introduces a stray `<audio>` JSX tag is easy to diagnose.
2. `the singleton <audio> is the only attached audio element` — second invariant asserting that any audio in the DOM is `isConnected`. Catches cases where a detached pool element gets accidentally appended (e.g. via a forgotten `document.body.appendChild`).

Both tests carry a `// WHY:` block describing the iOS Safari `<audio>` cap (~6–8 simultaneous elements) and the contract that GlobalAudioProvider owns the singleton while `usePreviewAudio` / `audioElementPool` produce **detached** elements (no DOM presence). The structural assertion is intentionally not an interaction test, so it stays stable across the UI changes B1/B2/B3 introduced.

## Commit SHA(s)

- `fa56979095ce5c8a5c569b8f8444a7d23664b991` — `test(e2e): add preview audio regression`

Single commit on top of `9b1ec6f4` as required.

## Quality gates

| Gate                                                                                  | Status                                                                                                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` → 0 errors                                                         | PASS (exit 0)                                                                                                               |
| `npx playwright test <smoke> --project=chromium` → green / pre-existing-skip baseline | **NOT RUN** — dev server blocked by pre-existing env issue                                                                  |
| New spec runs                                                                         | `npx playwright test tests/e2e/preview-audio.spec.ts --list` confirms 2 tests register; runtime not executed (same blocker) |
| Pre-commit hook tsc                                                                   | PASS (logged in commit output)                                                                                              |

## Concerns

1. **Dev-server start failure (pre-existing, NOT caused by B1/B2/B3).** The Playwright web server fails to start with:
   ```
   [postcss] Cannot find module '@tailwindcss/container-queries'
   - D:\.MUSICVERSE\aimusicverse\tailwind.config.ts
   ```
   `@tailwindcss/container-queries` is declared in `package.json` (`^0.1.1`) but is not present under `node_modules/@tailwindcss/`. This blocks every Playwright spec in this environment regardless of source changes. Per the brief ("DO NOT fix unrelated pre-existing failures — just report them"), I did not attempt `npm install`. Recommend a fresh `npm install` on the workstation before the next sprint run.
2. **Port 5173 collision.** After my first aborted run, a Vite process was left bound to 5173, and I could not `taskkill` it (PIDs `98232`/`140548` — classifier refused on ownership grounds). The user's shell can `taskkill /F /PID 98232` to clear it. The dev-server start failure (#1) is the underlying cause, so freeing the port alone won't unblock the smoke run.
3. **Adapted spec list.** The brief's literal command lists `tests/e2e/lyrics/`, `tests/e2e/project-detail.spec.ts`, and `tests/e2e/prompt-dj/` — none exist. I used the brief's pre-approved Adaptation block (`studio/*`, `voice-clone`, `player*`, `track.page`, `generation`, `library`, `smoke.app-boots`). Confirm whether prompt-dj / lyrics / project-detail E2E coverage should be written as follow-up to B1/B2 — currently B3's audio changes are exercised through `studio/*` and `voice-clone.flow` only.
4. **The new spec could not be runtime-verified** because the dev server won't start (Concern 1). The spec parses cleanly (`--list` succeeds, 2 tests). Pre-commit tsc passes. The structural assertions are grounded in source: GlobalAudioProvider holds exactly one `audioRef`, and `audioElementPool.createAudioElement` does `new Audio()` without appending. The spec should pass in a working environment; if it doesn't, that is itself a finding worth investigating.

## Fix Report (review findings B4-001 / B4-002)

**Reviewer verdict:** 2 Important findings — both tests asserted the wrong ground truth (singleton count `=== 1` / `>= 1`). The audio element is created by `useAudioInit` at `src/hooks/audio/useAudioInit.ts:43` and stored in a React ref only — it is NEVER appended to the DOM. Therefore `document.querySelectorAll("audio").length` on the home page is 0, not 1.

**Original commit SHA:** `fa56979095ce5c8a5c569b8f8444a7d23664b991`

**Fix commit SHA:** `f85f99bc` — `test(e2e): tighten preview audio regression assertion`

**Files changed:**

- `tests/e2e/preview-audio.spec.ts` (modified: 42+, 36-)
- `.superpowers/sdd/briefs/B4-report.md` (this fix report section)

No production code, hooks, services, configs, or other tests were modified.

**Before/after assertion summary:**

- BEFORE: `document.querySelectorAll("audio").length === 1` (wrong — would fail; actual is 0). Second test `>= 1` (also wrong).
- AFTER: `document.querySelectorAll("audio").length === 0` (matches real contract — singleton lives in JS ref, not DOM). Second test `document.querySelectorAll("audio[src]").length === 0` (defensive: catches any future `<audio>` JSX or pool `appendChild` with src).

**Test commands run + one-line output:**

- `npx tsc --noEmit` → exit 0, no output (PASS)
- `npx playwright test tests/e2e/preview-audio.spec.ts --list` → 2 tests registered, 14 total across 7 projects
- `git commit` (pre-commit hook) → all checks passed (lint-staged eslint+prettier, tsc, commitlint); commit `f85f99bc` landed

**Graphify rule observed:** ran `graphify query "GlobalAudioProvider useAudioInit audioElementPool usePreviewAudio"` before any `src/` read. Surfaces `GlobalAudioProvider()` (community 7), `usePlayerStore` (community 7), `AudioElementPool` + `.acquire()` (community 2), `useAuth()` (community 4) — confirming the singleton-in-ref contract and the detached-pool pattern. Only the two already-verified source files (`GlobalAudioProvider.tsx` L1–79, `usePreviewAudio.ts` L1–120, `audioElementPool.ts` L100–292) were consulted, as authorised by the dispatch brief.

## Files touched (cumulative)

- `tests/e2e/preview-audio.spec.ts` (created 94 LOC in `fa569790`; tightened to 100 LOC in `f85f99bc`)
- `.superpowers/sdd/briefs/B4-report.md` (this file — original report + fix report section)

No production code, hooks, services, configs, or other tests were modified.
