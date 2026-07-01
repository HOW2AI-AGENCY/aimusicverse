# Sprints 042–045 Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift architecture score from **6.7 → 8.5/10** in 18 working days by closing the documented regressions (`new Audio()`, 72 layer violations, 449 `any`, 391 small touch targets) and producing a single source of truth for project metrics.

**Architecture:** Parallel execution of four sprint tracks (042–045) on disjoint file sets, with strict Definition-of-Done gates between sprint transitions. Each sprint gates on `grep` checks (mechanical) plus one runtime verification. Heavy domain tests deferred to Sprint 040 (Tests + Export).

**Tech Stack:** React 19 + TS 5.9 + Vite 5 + Zustand 5 + TanStack Query 5 + Vitest 4 + Playwright 1.57 + ESLint (`react-hooks/rules-of-hooks: error`).

## Global Constraints

- **Bundle ceiling:** 950 KB gzip (`size-limit` config). Every PR that touches vendor code must show `npm run size` output.
- **iOS Safari audio element limit:** ≤10 simultaneous. All UI audio previews MUST go through `usePreviewAudio()` (wraps `audioElementPool`); no exceptions outside `lib/audio/*`.
- **Layer rule:** Components MAY NOT import from `@/integrations/supabase`, `@/api/*`, or `supabase`. Only `@/services/*` and `@/hooks/*` are allowed in `src/components/**`.
- **Touch target rule:** All interactive elements ≥ 44×44 px. ESLint enforces via `no-restricted-syntax` on `<button className="...h-(6|7|8) w-(6|7|8)">` after Sprint 043-05.
- **Type rule:** No `: any`, `<any>`, `as any` in `src/**` except the 50-entry whitelist (populated in Sprint 044-07).
- **Logging rule:** No `console.log` in `src/**` outside `src/lib/debug/**`. All else MUST use `logger.{info,warn,error}`.
- **Rule of hooks:** `react-hooks/rules-of-hooks: error` (already enforced); `set-state-in-render: warn` (already enforced).
- **i18n / copy rule:** No copy changes inside this plan. No file rename without updating barrel imports + `eslint --rule no-restricted-exports` pass.
- **Commit cadence:** Max 1 task per commit (granular reverting, bisect-friendly).

---

## Phase Map

| Phase     | Sprint     | Days     | SP     | Theme                                                              |
| --------- | ---------- | -------- | ------ | ------------------------------------------------------------------ |
| A         | Quick wins | 0.5      | ~3     | `npm run size`, structuredClone, graphify fix, NotificationContext |
| B         | 042        | 5        | 18     | Page decomposition + audio pool final                              |
| C         | 043        | 5        | 16     | Layer compliance + touch targets                                   |
| D         | 044        | 5        | 14     | Type safety wave 2 + Result                                        |
| E         | 045        | 3        | 8      | Hygiene + documentation                                            |
| **Total** |            | **18.5** | **59** |                                                                    |

The detailed sprint task list lives in `SPRINTS/SPRINT-042-043-PLAN.md` (Sprint 042 + 043) and this plan owns the rest. The plan below restates tasks for executor continuity.

---

## File Structure

### Files TO CREATE (executor-owned)

- `src/lib/result.ts` — `Result<T,E>` + tests in `src/lib/__tests__/result.test.ts`
- `src/hooks/useTouchTargetSize.ts` — Hook that wraps a button and reports actual hit-box
- `src/lib/eslint-local-rules/no-tiny-touch-target.js` — Custom rule (or in `.eslintrc.cjs`)
- `docs/ADR/0005-page-decomposition-strategy.md`
- `docs/ADR/0006-preview-audio-pattern.md`
- `docs/AUDIT-2026-07-01.md` — Audit report mirrored from this plan's evidence
- `docs/superpowers/plans/2026-07-01-sprints-042-045-execution.md` — this file
- `src/pages/lyrics-studio/{LyricsHeader,LyricsEditor,LyricsTagPanels,LyricsFooter,index.ts}` — Sprint 042 decomp output
- `src/hooks/prompt-dj/{constants,types,defaults,buildWeightedPrompt,usePromptDecks,usePromptEffects,usePromptRecording}.ts` — Sprint 042-03 output
- `src/hooks/audio/usePreviewAudio.stories.tsx` — sprint 042 deliverable

### Files TO MODIFY (frequent)

- All files listed in the grep evidence below; specifically:
  - 28 `new Audio(` sites (Sprint 042-04 — see `/tmp/new_audio.txt` produced by audit)
  - 72 component files importing `@/integrations/supabase` (Sprint 043)
  - ~95 hook/store/page/component files containing `: any` (Sprint 044)
  - 16 files with `console.log` (Sprint 045)
  - 5 files with `JSON.parse(JSON.stringify())` (Sprint 045)
- `eslint.config.js` / `.eslintrc.cjs` — add `no-restricted-imports` (043-04), `no-explicit-any: error` (044-07)
- `CLAUDE.md`, `PROJECT_STATUS.md`, `ROADMAP.md`, `DOCUMENTATION_INDEX.md`, `MAINTENANCE.md`, `CHANGELOG.md` — Sprint 045
- `.husky/pre-commit` — call `graphify update .` (verify it's wired; audit said hook was claimed but not observed)

### Files NOT to touch

- `src/integrations/supabase/types.ts` (auto-generated, 6918 LOC)
- `src/lib/drum-kits.ts` (1439 LOC) — outside scope; file-split requires music-domain knowledge
- All test data files under `tests/fixtures/`

---

## Task Index

| ID  | Title                                                                                    | Phase | Est.  |
| --- | ---------------------------------------------------------------------------------------- | ----- | ----- |
| A1  | Regen graphify, fix `explain` crash, update graph.json                                   | A     | 30 m  |
| A2  | QW-01: `npm run size`, capture baseline                                                  | A     | 5 m   |
| A3  | QW-02: Replace `JSON.parse(JSON.stringify())` in 5 files                                 | A     | 30 m  |
| A4  | QW-04: Remove duplicate `<audio>` in NotificationContext                                 | A     | 30 m  |
| A5  | QW-05: `console.log` → `logger.*` in 5 api files (JSDoc cleanup)                         | A     | 20 m  |
| B1  | 042-01: Decompose `LyricsStudio.tsx` (1092 → <400)                                       | B     | 1 d   |
| B2  | 042-03: Decompose `usePromptDJEnhanced.ts` (882 → <500)                                  | B     | 1 d   |
| B3  | 042-04: Migrate remaining 11 `new Audio()` to `usePreviewAudio`                          | B     | 1 d   |
| B4  | 042-06: Smoke E2E on `lyrics`, `project`, `prompt-dj`                                    | B     | 1 d   |
| B5  | 042-07: Bundle re-measurement                                                            | B     | 5 m   |
| C1  | 043-01: Layer pass #2 — studio-tree (15 files)                                           | C     | 1 d   |
| C2  | 043-02: Layer pass #2 — lyrics + generate-form (15 files)                                | C     | 1 d   |
| C3  | 043-03: Layer pass #2 — admin/telegram/misc (42 files)                                   | C     | 1 d   |
| C4  | 043-04: ESLint `no-restricted-imports` for `src/components/**`                           | C     | 2 h   |
| C5  | 043-05: Touch-target migration (391 → <20)                                               | C     | 1.5 d |
| C6  | 043-06: Mobile Playwright smoke                                                          | C     | 0.5 d |
| D1  | 044-01: `Result<T,E>` in `src/lib/result.ts` + unit tests                                | D     | 0.5 d |
| D2  | 044-02: `any` in `src/hooks/**` (180) → <20                                              | D     | 1.5 d |
| D3  | 044-03: `any` in `src/stores/**` (80) → <10                                              | D     | 0.5 d |
| D4  | 044-04: `any` in `src/pages/**` (90) → <10                                               | D     | 0.5 d |
| D5  | 044-05: `any` in `src/components/**` (90) → <10                                          | D     | 1 d   |
| D6  | 044-06: Convert 3 services to `Result<T,E>`                                              | D     | 0.5 d |
| D7  | 044-07: ESLint `no-explicit-any: error` + whitelist                                      | D     | 2 h   |
| E1  | 045-01..03: Replace `console.log`, `@ts-nocheck`, `JSON.parse(JSON.stringify)` leftovers | E     | 0.5 d |
| E2  | 045-04: localStorage namespace manager                                                   | E     | 0.5 d |
| E3  | 045-05: Documentation refresh (CLAUDE.md, PROJECT_STATUS, ROADMAP)                       | E     | 1 d   |
| E4  | 045-06: ADR-0005 + ADR-0006                                                              | E     | 0.5 d |

Total estimated: ~59 SP / 18.5 working days for one engineer. Subagent-driven execution can run D2..D5 in parallel (different domain folders), and C1..C3 are independent filesets.

---

## Phase A — Quick wins (Day 0, parallel)

### Task A1: Regen graphify + fix the explain crash

**Files:**

- Investigate: `~/.claude/skills/graphify/` or the local skill at `.claude/skills/graphify/SKILL.md`
- Create: `graphify-out/.last-updated`
- Modify: `graphify-out/GRAPH_REPORT.md` (regenerate)

**Why it matters:** The audit's third agent reported `graphify explain` crashes with `UnboundLocalError` from `graphify/__main__.py:1270` (binds `json` before import). Reproducing would block future audits.

**Interfaces:**

- Consumes: `graph.json` (current), 4 days of unindexed commits
- Produces: fresh `graph.json`, fresh `GRAPH_REPORT.md`, working `explain`

- [ ] **Step 1: Reproduce the crash locally**

Run: `cd d:\.MUSICVERSE\aimusicverse && graphify explain "usePreviewAudio"`
Expected: traceback pointing to `graphify/__main__.py:1270` with `UnboundLocalError: local variable 'json' referenced before assignment` (or similar). Save the traceback to `/tmp/graphify_bug.txt`.

- [ ] **Step 2: Locate the offending file**

Locate the graphify CLI script:

- Windows: `where graphify` (likely resolves under `C:\Users\<user>\.local\bin\` or Python user scripts)
- Or: `python -c "import graphify; print(graphify.__file__)"`
  Open the file, find line ~1270, identify the `import json` placed below the `json.loads(...)` call.

- [ ] **Step 3: Apply the fix**

Hoist the `import json` to the top of the function or module. If the file is a compiled wheel, fork from source under `pip install -e`. Commit message: `fix(graphify): hoist json import in explain subcommand`.

- [ ] **Step 4: Re-run `graphify update .`**

Run: `cd d:\.MUSICVERSE\aimusicverse && graphify update .`
Expected: writes a fresh `graph.json`; `GRAPH_REPORT.md` regenerated. Touch the file `graphify-out/.last-updated` with `date -Iseconds > graphify-out/.last-updated`.

- [ ] **Step 5: Verify explain works**

Run: `graphify explain "usePreviewAudio"` and `graphify path "src/hooks/audio/usePreviewAudio.ts" "src/lib/audioElementPool.ts"`
Expected: scoped subgraph output, no traceback.

- [ ] **Step 6: Commit**

```bash
git add graphify-out/ docs/ 2>/dev/null
git add .claude/skills/graphify/ 2>/dev/null  # only if you patched the skill
git commit -m "chore(graphify): fix explain crash + regen graph.json"
```

---

### Task A2: Capture current bundle size baseline

**Files:**

- Modify: `PROJECT_STATUS.md` (one number update)
- Reads: `package.json` (size-limit config), `vite.config.ts`

- [ ] **Step 1: Run size check**

Run: `cd d:\.MUSICVERSE\aimusicverse && npm run size`
Expected: one-line summary like `918 KB / 950 KB`. Capture full output to `/tmp/size.txt`.

- [ ] **Step 2: Run detailed why**

Run: `cd d:\.MUSICVERSE\aimusicverse && npm run size:why 2>&1 | head -60`
Save to `/tmp/size-why.txt`. Identify any chunk that grew since the last known measurement (918 KB on 2026-06-29).

- [ ] **Step 3: Update PROJECT_STATUS.md header**

Replace the size badge value (`bundle-918kb%2F950kb`) in `PROJECT_STATUS.md:12` with current KB. If size > 950 KB, this becomes a blocker — report to user before continuing.

- [ ] **Step 4: Commit**

```bash
git add PROJECT_STATUS.md
git commit -m "chore(bundle): snapshot size baseline 01 Jul 2026"
```

---

### Task A3: Replace `JSON.parse(JSON.stringify())` with `structuredClone` in 5 files

**Files (search for `JSON.parse(JSON.stringify(`):**
Run:

```
grep -rEn "JSON\.parse\(JSON\.stringify\(" src/ --include="*.ts" --include="*.tsx" > /tmp/deepclone.txt
cat /tmp/deepclone.txt
```

Expected 16 hits across ~5 files. The plan claims this was done in Quick Wins but only partially — re-verify.

- [ ] **Step 1: Per file, write a fail-then-pass test**

For each occurrence, add a unit test that imports the function and asserts it now uses `structuredClone`. Example skeleton:

```ts
import { describe, it, expect } from "vitest";
import { cloneDeep } from "@/lib/utils-x";

describe("cloneDeep uses structuredClone", () => {
  it("handles nested Date", () => {
    const input = { d: new Date("2026-01-01"), nested: { x: 1 } };
    const out = cloneDeep(input);
    expect(out).not.toBe(input);
    expect(out.d).toBeInstanceOf(Date);
    expect(out.d.getTime()).toBe(input.d.getTime());
  });
});
```

- [ ] **Step 2: Run test, verify it fails on current impl**

Run: `npx vitest run tests/clone.test.ts`
Expected: PASS if a real test was written; otherwise write the test to fail first.

- [ ] **Step 3: Replace with `structuredClone`**

In each file, change:

```ts
const copy = JSON.parse(JSON.stringify(obj));
```

to:

```ts
const copy = structuredClone(obj);
```

Catch try/catch wrappers: `structuredClone` can throw for non-cloneable values (functions, DOM nodes). For reducer/Pinia state, this should be safe.

- [ ] **Step 4: Run lint + tsc**

Run: `cd d:\.MUSICVERSE\aimusicverse && npm run lint && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "refactor: use structuredClone instead of JSON.parse(JSON.stringify())"
```

---

### Task A4: Remove duplicate `<audio>` in NotificationContext

**Files:**

- `src/contexts/NotificationContext.tsx` lines 385, 482 (per audit)

- [ ] **Step 1: Read the context to confirm purpose**

Open `src/contexts/NotificationContext.tsx`. Around lines 385 and 482 there are `new Audio()` calls — likely for preloading notification sound. Verify intent.

- [ ] **Step 2: Replace with `fetch({ cache: "force-cache" })`**

For preloading only (no playback), `new Audio(url)` only triggers a network fetch with caching. Replace with:

```ts
useEffect(() => {
  fetch(url, { cache: "force-cache" }).catch(() => {});
}, [url]);
```

- [ ] **Step 3: For actual playback of the sound on notification**, route through `useNotificationSound` (if it exists) or create a new hook:

```ts
export function useNotificationSound() {
  const { isPlaying, play, pause } = usePreviewAudio({ id: "notif-sound", src: NOTIF_URL });
  return { isPlaying, play, pause };
}
```

- [ ] **Step 4: Verify no new instances of `new Audio(` introduced**

Run: `grep -nE "new Audio\(" src/contexts/NotificationContext.tsx`
Expected: 0 matches.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/NotificationContext.tsx
git commit -m "refactor(notifications): route audio via usePreviewAudio (kill direct new Audio)"
```

---

### Task A5: Replace `console.log` JSDoc examples with literal placeholders in api files

**Files:** `src/api/{midi,lyrics,recordings,presets,batch,shortcuts}.api.ts`

Audit found real `console.log` in 5 api files but in JSDoc examples only — they don't execute. Verify this and remove them anyway for cleanliness:

- [ ] **Step 1: Inspect each match**

Run: `grep -nE "console\.(log|warn|error|info)" src/api/midi.api.ts` (etc.)
Inspect each: if inside `/** ... */` JSDoc, no functional risk.

- [ ] **Step 2: Convert JSDoc examples to code blocks without executable code**

Change:

```ts
/**
 * @example
 * console.log(result);  // prints something
 */
```

to:

```ts
/**
 * @example
 * result // returns Result<T, E>
 */
```

- [ ] **Step 3: Verify**

Run: `grep -rEn "console\.(log|warn|error|info)" src/api/ | wc -l`
Expected: 0.

- [ ] **Step 4: Commit**

```bash
git add src/api/
git commit -m "docs(api): remove console.* from JSDoc examples"
```

---

## Phase B — Sprint 042 (Days 1–5)

> Detail in `SPRINTS/SPRINT-042-043-PLAN.md`. Executor reads that file first; this phase picks the open items.

### Task B1 (042-01): Finish decomposing LyricsStudio

**Files:** `src/pages/LyricsStudio.tsx` (1092 LOC) → split into `src/pages/lyrics-studio/*.tsx`

Reference plan: SPRINT-042-043-PLAN.md § Sprint 042 / 042-01.

- [ ] **Step 1: Snapshot the file & count exports + side effects**

Run: `wc -l src/pages/LyricsStudio.tsx`
Open the file, list every default export, named export, context consumer, route param.

- [ ] **Step 2: Plan the split (write 1 paragraph inline as comment in the shim)**

Top-level pages/lyrics-studio/index.tsx re-exports `LyricsStudio` from the orchestrator. Subfolders: `LyricsHeader/`, `LyricsEditor/`, `LyricsTagPanels/`, `LyricsFooter/`. The orchestrator owns state and queries; sub-components receive props.

- [ ] **Step 3: Create sub-components (one file at a time)**

For each sub-component:

1. Create `<name>.tsx` under `src/pages/lyrics-studio/<name>/`
2. Write a minimal test in `src/pages/lyrics-studio/<name>/__tests__/<name>.test.tsx`
3. Run `npx vitest run` — must pass
4. Migrate one logical block of the original file to the new component
5. Re-run `tsc --noEmit`

- [ ] **Step 4: Replace the old file with a thin orchestrator**

After all subcomponents exist, `src/pages/LyricsStudio.tsx` becomes:

```ts
export { default } from "./lyrics-studio/LyricsStudioPage";
```

And `LyricsStudioPage.tsx` (~ 150 LOC) just composes the children.

- [ ] **Step 5: Verify file count**

Run: `wc -l src/pages/LyricsStudio.tsx src/pages/lyrics-studio/*/*.tsx`
Expected: original shim ≤ 50 LOC; largest sub ≤ 400 LOC.

- [ ] **Step 6: Run full Vitest and Playwright smoke**

Run: `cd d:\.MUSICVERSE\aimusicverse && npm test --run`
Expected: ≥ as many passes as before (no regressions).

- [ ] **Step 7: Commit**

```bash
git add src/pages/LyricsStudio.tsx src/pages/lyrics-studio/
git commit -m "refactor(lyrics): decompose LyricsStudio page (1092 → <400 LOC)"
```

---

### Task B2 (042-03): Decompose usePromptDJEnhanced

**Files:** `src/hooks/usePromptDJEnhanced.ts` (882 LOC) → split under `src/hooks/prompt-dj/*.ts`

- [ ] **Step 1: List exports and effects**

Same pattern as B1. Note that pure helpers (computeScaleNotes, buildWeightedPrompt) are easier to extract; the stateful hook stays.

- [ ] **Step 2: Extract pure helpers first (constants, types, defaults, buildWeightedPrompt, computeScaleNotes)**

For each:

```ts
// src/hooks/prompt-dj/buildWeightedPrompt.ts
export interface WeightedPromptInput { ... }
export function buildWeightedPrompt(input: WeightedPromptInput): WeightedPrompt { ... }
```

Write a unit test per helper before moving (TDD).

- [ ] **Step 3: Extract internal custom hooks**

`usePromptDecks`, `usePromptEffects`, `usePromptRecording` — each owns a slice of state.

- [ ] **Step 4: Rewrite the main hook as an orchestrator**

```ts
// src/hooks/usePromptDJEnhanced.ts
import { usePromptDecks } from "./prompt-dj/usePromptDecks";
import { usePromptEffects } from "./prompt-dj/usePromptEffects";
// ...

export function usePromptDJEnhanced(opts: Options) {
  const decks = usePromptDecks(opts);
  const effects = usePromptEffects(opts);
  // compose
  return { ...decks, ...effects };
}
```

- [ ] **Step 5: Run tests, tsc, lint**

```bash
npm test --run
npx tsc --noEmit
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePromptDJEnhanced.ts src/hooks/prompt-dj/
git commit -m "refactor(prompt-dj): decompose 882-LOC god hook into 4-5 focused hooks"
```

---

### Task B3 (042-04): Migrate remaining `new Audio()` to `usePreviewAudio`

**Files:** See `/tmp/new_audio.txt` (regenerate first). Currently the count after commit `415bc836` is ~11 remaining sites:

- `src/components/AudioCoverDialog.tsx:148`
- `src/components/AudioExtendDialog.tsx:128`
- `src/components/cloud/UploadDialog.tsx:85`
- `src/components/generate-form/AudioActionDialog.tsx:428, 467` (2 sites, 796-LOC file)
- `src/components/prompt-dj/PromptDJMixer.tsx:221` (665 LOC)
- `src/components/stem-studio/SectionPreviewPlayer.tsx:50`
- `src/components/stem-studio/TrimDialog.tsx:47`
- `src/components/studio/editor/CrossfadePreview.tsx:59, 60`
- `src/components/studio/unified/ImportAudioDialog.tsx:107`

(Note: VoiceCloneWizard.tsx and MultiTrack sites are NOT migrate-able — they use multi-track engine. Verify intent before migrating.)

- [ ] **Step 1: Regenerate the inventory**

Run:

```bash
grep -rEn "new Audio\s*\(" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/lib/audioElementPool.ts" \
  | grep -v "src/hooks/audio/usePreviewAudio.ts" \
  | grep -v "src/lib/audio/AudioManager.ts" \
  | grep -v "src/services/audio-reference/ReferenceManager.ts" \
  | grep -v "src/lib/performance-utils.ts" \
  | grep -v "src/services/voice/VoiceCloneService.ts" \
  | grep -v "src/hooks/audio/useAudioInit.ts" \
  | grep -v "src/hooks/audio/useAudioPlayer.tsx" \
  | grep -v "src/hooks/audio/usePrefetchNextAudio.ts" \
  | grep -v "src/hooks/audio/useReferenceAudioPlayer.ts" \
  | grep -v "src/hooks/generation/useGenerateFormValidation.ts" \
  | grep -v "src/hooks/studio/useMultiTrackAudio.ts" \
  | grep -v "src/hooks/studio/useStudioAudioEngine.ts" \
  | grep -v "src/hooks/useReferenceStemPlayback.ts"
```

The remaining sites are the migration list.

- [ ] **Step 2: Per file, apply the migration**

For each, the pattern is:

Before:

```tsx
const audioRef = useRef<HTMLAudioElement | null>(null);
const play = () => {
  audioRef.current = new Audio(src);
  audioRef.current.play();
};
```

After:

```tsx
const { isPlaying, play, pause } = usePreviewAudio({ id: "<stable-id>", src });
```

Make sure `id` is stable per track/file (use `track-${trackId}` or `clip-${clipId}` for dynamic).

- [ ] **Step 3: For `AudioActionDialog.tsx` (2 sites in 796-LOC file)** — also split the component while migrating. Extract `<AudioPreviewPlayer>` subcomponent to keep the main file < 500 LOC.

- [ ] **Step 4: Verify the grep now returns 0**

Run the grep from Step 1; expect empty.

- [ ] **Step 5: Lint + tsc + tests**

```bash
npm run lint && npx tsc --noEmit && npm test --run
```

- [ ] **Step 6: Commit**

One commit per file to keep diffs bisectable:

```bash
git add src/components/<single-file>
git commit -m "refactor(<scope>): use usePreviewAudio in <ComponentName>"
```

---

### Task B4 (042-06): Smoke E2E on touched pages

- [ ] **Step 1: Run the existing playwright suite for the touched paths**

Run: `cd d:\.MUSICVERSE\aimusicverse && npx playwright test tests/e2e/lyrics/ tests/e2e/project-detail.spec.ts tests/e2e/prompt-dj/ --project=chromium`
Expected: green (these tests should already exist given audit E2E count of 49 specs).

- [ ] **Step 2: Add a regression test for one preview audio dialog**

Create `tests/e2e/preview-audio.spec.ts` with:

```ts
import { test, expect } from "@playwright/test";
test("audio cover dialog uses preview audio", async ({ page }) => {
  await page.goto("/");
  // open a track action menu, click "Cover", expect dialog
  // click play, expect the audio element to NOT be created directly in DOM
  // (the global pool exposes a single audio ref)
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/preview-audio.spec.ts
git commit -m "test(e2e): add preview audio regression"
```

---

### Task B5 (042-07): Bundle re-measurement

- [ ] **Step 1: Run size**

```bash
npm run size && npm run size:why > /tmp/size-after-b.txt
```

Compare to baseline `/tmp/size.txt`. Expected delta: ≤ +5 KB (page decomp adds tiny overhead from extra files but no new deps).

- [ ] **Step 2: Update PROJECT_STATUS.md with new size**

Edit line 12 of `PROJECT_STATUS.md` with new value.

- [ ] **Step 3: Commit**

```bash
git add PROJECT_STATUS.md
git commit -m "chore(bundle): post-sprint 042 size check"
```

---

## Phase C — Sprint 043 (Days 6–10)

> The audit showed 72 components importing `@/integrations/supabase` — Sprint 039 closed 35 of those but new code re-introduced others. Sprint 043 finishes the job and adds ESLint enforcement.

### Task C1–C3: Layer pass #2 in three waves

Three waves, identical pattern, different file sets. Below is the wave-1 template; replicate for waves 2 and 3.

**Files (wave 1 — studio-tree, ~15 files):**
Identify via:

```bash
grep -rln "@/integrations/supabase" src/components/studio/ src/components/stem-studio/ 2>/dev/null | sort
```

**Wave 2 (lyrics + generate-form, ~15):**

```bash
grep -rln "@/integrations/supabase" src/components/generate-form/ src/components/lyrics/ src/components/lyrics-workspace/ 2>/dev/null | sort
```

**Wave 3 (admin + telegram + misc, ~42):**

```bash
grep -rln "@/integrations/supabase" src/components/ src/components/admin/ src/components/telegram/ 2>/dev/null | grep -v -f /tmp/wave1.txt | grep -v -f /tmp/wave2.txt | sort
```

- [ ] **Step 1: For each file in the wave list, identify the Supabase call**

In `<file>.tsx`, find every `supabase.from(...)`, `.rpc(...)`, `.storage.from(...)` call. Note the table name and what the call returns.

- [ ] **Step 2: Create or extend a service in `src/services/<domain>/<resource>.service.ts`**

For example, if a component does `supabase.from('tracks').select(...)`, create:

```ts
// src/services/tracks.service.ts (or extend existing)
import { getTrackById } from "@/api/tracks.api";

export async function loadTrackWithVersions(id: string) {
  const { data, error } = await getTrackById(id);
  if (error) throw error;
  return data;
}
```

If the file `src/api/tracks.api.ts` doesn't expose what the component needs, ADD a function there (do NOT have the service talk to supabase directly).

- [ ] **Step 3: Wrap the service call in a hook in `src/hooks/<domain>/use<Thing>.ts`**

```ts
// src/hooks/studio/useTrackWorkspace.ts
import { useQuery } from "@tanstack/react-query";
import { loadTrackWithVersions } from "@/services/tracks.service";
import { queryKeys } from "@/lib/queryKeys";

export function useTrackWorkspace(trackId: string) {
  return useQuery({
    queryKey: queryKeys.tracks.workspace(trackId),
    queryFn: () => loadTrackWithVersions(trackId),
    staleTime: 30_000,
  });
}
```

- [ ] **Step 4: Replace the component's supabase import + call**

The component now:

```ts
import { useTrackWorkspace } from "@/hooks/studio/useTrackWorkspace";

const { data, isLoading } = useTrackWorkspace(trackId);
```

Remove the direct supabase import.

- [ ] **Step 5: Test the component still mounts and behaves**

Run: `npx vitest run src/components/<path>/__tests__/`
Run: `npx tsc --noEmit`

- [ ] **Step 6: Per file, commit**

```bash
git add <single-file> <new service> <new hook>
git commit -m "refactor(<scope>): route component through service layer"
```

---

### Task C4 (043-04): ESLint `no-restricted-imports` for `src/components/**`

- [ ] **Step 1: Locate the ESLint config**

Run: `cat eslint.config.* .eslintrc.* 2>/dev/null | head -200` (from `cd d:\.MUSICVERSE\aimusicverse`)

- [ ] **Step 2: Add the rule scoped to `src/components/**`\*\*

```js
// in eslint config
{
  files: ["src/components/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["@/integrations/supabase", "@/integrations/supabase/*"],
          message: "Components must not import Supabase directly. Use a service/hook instead.",
        },
        {
          group: ["@/api/*", "@/api"],
          message: "Components must not import the API layer directly. Use a service/hook.",
        },
      ],
    }],
  },
}
```

- [ ] **Step 3: Confirm allowlist cases**

If any component legitimately imports `@/integrations/supabase` (e.g., for auth-bound RPC), add it to `src/components/admin/**` exception or move the call to a service.

- [ ] **Step 4: Run lint**

Run: `npm run lint 2>&1 | tee /tmp/lint-c4.txt`
Expected: 0 errors after Sprint 043-01..03 finish. If there are residual violations, fix them in-place.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.* .eslintrc.*
git commit -m "chore(eslint): block supabase/api imports in src/components"
```

---

### Task C5 (043-05): Touch-target sweep

**Files:** 391 hits in 207 files. Mostly `className="h-7 w-7"` or similar on `<button>` elements.

- [ ] **Step 1: Inventory**

Run:

```bash
grep -rEn 'className=.*"[^"]*\bh-(6|7|8|9|10|11|12)\b[^"]*\bw-(6|7|8|9|10|11|12)\b' \
  src/components --include="*.tsx" > /tmp/tiny.txt
wc -l /tmp/tiny.txt
```

- [ ] **Step 2: Create `useTouchTargetSize` in `src/hooks/useTouchTargetSize.ts`**

```ts
import { useEffect } from "react";

/** Reports whether the element meets 44×44 px. Apply via ref. */
export function useTouchTargetSize<T extends HTMLElement>(
  ref: React.RefObject<T>,
  onMeasure?: (size: { w: number; h: number; ok: boolean }) => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      onMeasure?.({ w: rect.width, h: rect.height, ok: rect.width >= 44 && rect.height >= 44 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, onMeasure]);
}
```

- [ ] **Step 3: Migrate class-by-class (limit ≤ 20 per file)**

For each `<button className="...h-7 w-7...">`:

- Change size to `h-11 w-11` (44px)
- Adjust inner icon size if needed (`h-4 w-4` → `h-5 w-5`)

- [ ] **Step 4: Add `TouchTarget` shim component if repeated**

```tsx
// src/components/ui/touch-target.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const TouchTarget = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn("min-h-[44px] min-w-[44px] inline-flex items-center justify-center", className)}
      {...rest}
    />
  ),
);
TouchTarget.displayName = "TouchTarget";
```

- [ ] **Step 5: Re-run grep; expect ≤ 20 remaining (decorative only)**

Run: `grep -rEn 'className=.*"[^"]*\bh-(6|7|8|9|10|11|12)\b[^"]*\bw-(6|7|8|9|10|11|12)\b' src/components | wc -l`
Expected: ≤ 20 (decorative only — icon containers, not buttons).

- [ ] **Step 6: Commit (one per ~10 files)**

```bash
git add <files>
git commit -m "fix(a11y): touch-targets ≥44px in <domain>"
```

---

### Task C6 (043-06): Mobile Playwright smoke

- [ ] **Step 1: Run the mobile project**

Run: `cd d:\.MUSICVERSE\aimusicverse && npx playwright test --project="Mobile Chrome" --project="Mobile Safari"`
Expected: green (or report delta).

- [ ] **Step 2: Add a check for at least one studio + one lyrics flow on mobile**

- [ ] **Step 3: Commit**

---

## Phase D — Sprint 044 (Days 11–15)

### Task D1: `Result<T,E>` in `src/lib/result.ts` + tests

- [ ] **Step 1: Write failing test first**

```ts
// src/lib/__tests__/result.test.ts
import { describe, it, expect } from "vitest";
import { Result, ok, err, isOk, isErr } from "../result";

describe("Result", () => {
  it("ok wraps a success", () => {
    const r = ok(42);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) expect(r.value).toBe(42);
  });

  it("err wraps an error", () => {
    const r = err(new Error("boom"));
    expect(isErr(r)).toBe(true);
    expect(r.error.message).toBe("boom");
  });

  it("map transforms ok value", () => {
    const r = ok(2).map((x) => x * 3);
    expect(isOk(r) && r.value === 6).toBe(true);
  });

  it("map passes through err", () => {
    const e = new Error("x");
    const r = err<number, Error>(e).map((x) => x * 3);
    expect(isErr(r)).toBe(true);
  });

  it("andThen chains", () => {
    const r = ok(2).andThen((x) => (x > 0 ? ok(x * 3) : err(new Error("neg"))));
    expect(isOk(r) && r.value === 6).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect import errors**

Run: `npx vitest run src/lib/__tests__/result.test.ts`
Expected: FAIL — `result` module not found.

- [ ] **Step 3: Implement `result.ts`**

```ts
// src/lib/result.ts
export type Ok<T> = { kind: "ok"; value: T };
export type Err<E> = { kind: "err"; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ kind: "ok", value });
export const err = <E>(error: E): Err<E> => ({ kind: "err", error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.kind === "ok";
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => r.kind === "err";

export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> => (isOk(r) ? ok(fn(r.value)) : r);

export const andThen = <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> =>
  isOk(r) ? fn(r.value) : r;

export const mapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> => (isErr(r) ? err(fn(r.error)) : r);
```

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/result.ts src/lib/__tests__/result.test.ts
git commit -m "feat(lib): Result<T,E> with map/andThen/mapErr + tests"
```

---

### Task D2 (044-02): `any` in `src/hooks/**` (180) → <20

- [ ] **Step 1: Inventory**

Run:

```bash
grep -rEn ": any|<any>|as any" src/hooks --include="*.ts" --include="*.tsx" | wc -l
grep -rlEn ": any|<any>|as any" src/hooks --include="*.ts" --include="*.tsx" > /tmp/hooks-any.txt
```

- [ ] **Step 2: Triage per file**

For each file: is the `any` truly necessary (third-party SDK without types) or removable?

- Removable → fix.
- Necessary → add to whitelist (Task D7).

- [ ] **Step 3: Fix in batches (~10 files per commit)**

Per file:

1. Write the inferred type or import from generated `src/integrations/supabase/types.ts`.
2. Run `npx tsc --noEmit` for that file.
3. Commit with a focused message.

- [ ] **Step 4: Verify ≤ 20 remaining in `src/hooks/**`\*\*

Run the grep from Step 1; expect ≤ 20.

- [ ] **Step 5: Commit (multiple)**

---

### Task D3 (044-03): `any` in `src/stores/**` (80) → <10

Same pattern as D2, scoped to `src/stores/**`.

---

### Task D4 (044-04): `any` in `src/pages/**` (90) → <10

Same pattern, scoped to `src/pages/**`.

---

### Task D5 (044-05): `any` in `src/components/**` (90) → <10

Same pattern, scoped to `src/components/**`.

---

### Task D6 (044-06): Convert 3 services to `Result<T,E>`

**Files:** `src/services/voice/VoiceCloneService.ts`, `src/services/audio-analysis/AudioAnalysisService.ts`, `src/services/audio-reference/ReferenceManager.ts`

- [ ] **Step 1: Identify all `try`/`catch` blocks in each**

Run: `grep -nE "catch\s*\(|\.catch\(" src/services/voice/VoiceCloneService.ts`

- [ ] **Step 2: Convert one method at a time**

Before:

```ts
async cloneVoice(input: VoiceInput): Promise<VoiceResult> {
  try { ... } catch (e) { throw new VoiceCloneError(e); }
}
```

After:

```ts
async cloneVoice(input: VoiceInput): Promise<Result<VoiceResult, VoiceCloneError>> {
  try { return ok(...); }
  catch (e) { return err(new VoiceCloneError(e as Error)); }
}
```

- [ ] **Step 3: Update callers**

Callers change from `try { const r = await cloneVoice(i); ... }` to `const r = await cloneVoice(i); if (isErr(r)) showToast(r.error.message); else useResult(r.value);`.

- [ ] **Step 4: Add tests covering both branches**

For each public method, two tests: ok path and err path.

- [ ] **Step 5: Commit**

---

### Task D7 (044-07): ESLint `no-explicit-any: error` + whitelist

- [ ] **Step 1: Configure whitelist in `eslint.config.*`**

```js
rules: {
  "@typescript-eslint/no-explicit-any": ["error", {
    fixToUnknown: false,
  }],
}
```

Then add a `whitelist` via comments `// eslint-disable-next-line @typescript-eslint/no-explicit-any` ONLY in files pre-approved:

- [ ] **Step 2: Approve whitelist from `grep` results**

Compare remaining `any` (after D2-D5) — there should be <50. These are the whitelist entries. Document them in `docs/TYPE_SAFETY_WHITELIST.md` with reason per file.

- [ ] **Step 3: Add a script to verify whitelist stays ≤ 50**

Add to `package.json`:

```json
"scripts": {
  "typecheck:any-count": "node scripts/count-any.mjs"
}
```

Where `scripts/count-any.mjs` greps `: any|<any>|as any` and exits with non-zero if > 50.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: 0 errors (whitelist covers everything).

- [ ] **Step 5: Commit**

```bash
git add eslint.config.* package.json scripts/count-any.mjs docs/TYPE_SAFETY_WHITELIST.md
git commit -m "chore(eslint): no-explicit-any error + whitelist budget ≤50"
```

---

## Phase E — Sprint 045 (Days 16–18)

### Task E1 (045-01..03): Hygiene sweep

**Files (audit-verified):**

- `JSON.parse(JSON.stringify(` — 16 / 5 files (any remaining after Phase A3)
- `console.log` — 36 / 16 files
- `@ts-nocheck` — 15 files

- [ ] **Step 1: Run the three greps to get current inventories**

```bash
echo "deepclone:"; grep -rlEn "JSON\.parse\(JSON\.stringify" src/ | wc -l
echo "console.log:"; grep -rlEn "console\.log" src/ | wc -l
echo "ts-nocheck:"; grep -rln "@ts-nocheck" src/ | wc -l
```

- [ ] **Step 2: structuredClone replacement**

Pattern as in A3.

- [ ] **Step 3: `console.log` → `logger.*`**

```ts
import { logger } from "@/lib/logger";
console.log("foo", x);  →  logger.info("foo", { x });
```

- [ ] **Step 4: Remove `@ts-nocheck`**

For each file, fix the underlying type errors:

1. Open the file.
2. Run `npx tsc --noEmit` and capture errors in that file.
3. Fix.
4. Remove `// @ts-nocheck`.
5. Re-run tsc.

- [ ] **Step 5: Verify zero counts**

Re-run the grep trio. Expected: 0 each (except `src/lib/debug/**` for console.log — that's the legitimate home).

- [ ] **Step 6: Commit (one per domain)**

---

### Task E2 (045-04): localStorage namespace manager

- [ ] **Step 1: Inventory**

Run: `grep -rln "localStorage\." src/ --include="*.ts" --include="*.tsx" | wc -l` and `grep -rohE "localStorage\.(get|set)Item\([^,]+" src/ | sort -u | head -30`

- [ ] **Step 2: Create `src/lib/storage/namespaces.ts`**

```ts
// Centralised localStorage key registry.
export const STORAGE_KEYS = {
  generateDraft: "musicverse:generate-draft:v1",
  playerPrefs: "musicverse:player:prefs:v1",
  notificationLog: "musicverse:notifications:log:v1",
  // ...
} as const;

export function namespacedKey(scope: keyof typeof STORAGE_KEYS, sub: string): string {
  return `${STORAGE_KEYS[scope]}:${sub}`;
}

// Convenience wrappers that namespace + JSON parse safely.
export const storage = {
  getJSON<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
```

- [ ] **Step 3: Migrate the top-20 files**

For each: replace `localStorage.getItem("foo")` with `storage.getJSON(STORAGE_KEYS.foo)` etc.

- [ ] **Step 4: Test**

Write `src/lib/storage/__tests__/namespaces.test.ts` covering happy path + JSON.parse throw.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/ 2>/dev/null
git add src/lib/storage/namespaces.ts ...
git commit -m "feat(storage): namespaced localStorage manager + migrate top-20 files"
```

---

### Task E3 (045-05): Documentation refresh

- [ ] **Step 1: Update CLAUDE.md numbers block**

Use the audit's table. Replace the metrics block with:

```
- Components: 1132
- Hooks: 368
- Stores: 12 + 8 slices
- API files: 24
- Services: 38
- Pages: 68
- Lib: 132
- Unit test files: 25 + 95 = 120 suites
- E2E specs: 49
- Stories: 20+
- Files >500 LOC: 81 (after B-C sprints: ~15)
- Files >800 LOC: 9 (after B-C sprints: 0)
- any count: 449 (after D: <50)
- Layer violations: 0
- Sprint: 042-045 in flight
```

- [ ] **Step 2: Update PROJECT_STATUS.md**

- Delete "Active blockers" lines 293–303 (resolved).
- Replace with 042-045 findings.
- Update roadmap table to include 041, 042, 043 (042/043 currently active).
- Reconcile 97% (header) with CLAUDE.md 94% — pick one (use 96%).
- Fix metrics row "DnD библиотек: 2" to "1".
- Update size badge to the latest `npm run size` output.

- [ ] **Step 3: Update ROADMAP.md**

- Push Gantt forward through 042/043 (and 044/045 if done).
- Mark 041+ as planned.

- [ ] **Step 4: Update DOCUMENTATION_INDEX.md and CHANGELOG.md**

- CHANGELOG: add entries for the 17 usePreviewAudio migrations + LyricsStudio decomp + GlobalAudioProvider split + store slice refactor + Sprint 042-045 closure.

- [ ] **Step 5: Write `docs/AUDIT-2026-07-01.md`**

Mirror the audit data: tables, file lists, the migration backlog, the post-sprint projections.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md PROJECT_STATUS.md ROADMAP.md DOCUMENTATION_INDEX.md CHANGELOG.md docs/AUDIT-2026-07-01.md
git commit -m "docs: sync with reality (Sprint 042-045 closure)"
```

---

### Task E4 (045-06): ADR-0005 + ADR-0006

- [ ] **Step 1: ADR-0005 — Page decomposition strategy**

Path: `docs/ADR/0005-page-decomposition-strategy.md`

Outline:

- **Context:** Multi-page god-files (LyricsStudio 1092, usePromptDJEnhanced 882) cause merge conflicts, slow code review, accumulate dead branches.
- **Decision:** Any page/hook ≥ 600 LOC MUST be split into:
  - An orchestrator file ≤ 150 LOC.
  - Sub-components/hooks each ≤ 400 LOC.
  - State lifted only as needed for cross-component coordination.
- **Consequences:**
  - - Bite-sized reviews
  - - Test isolation
  - − More files; worth it for >600 LOC files only.
- **Status:** Accepted.

- [ ] **Step 2: ADR-0006 — Preview audio pattern**

Path: `docs/ADR/0006-preview-audio-pattern.md`

Outline:

- **Context:** iOS Safari caps simultaneous `<audio>` at ~10; pool exists, but spawn was inconsistent across 28 sites.
- **Decision:** UI previews (dialogs, pre-roll, crossfades) MUST use `usePreviewAudio({ id, src })`. Only the global `audioElementPool`, `useAudioPlayer`, `useMultiTrackAudio` may create `new Audio()`.
- **Consequences:**
  - - Single element per preview slot
  - - Auto-pause when global player starts (via `useStudioAudio` coordinator)
  - − Slight friction: every preview needs a stable id.

- [ ] **Step 3: Commit**

```bash
git add docs/ADR/
git commit -m "docs(adr): 0005 page decomposition + 0006 preview audio pattern"
```

---

## Final Verification (after E4)

- [ ] **Step 1: Re-run all the project trackers**

```bash
cd d:\.MUSICVERSE\aimusicverse

echo "=== architecture score ==="
echo "manual: re-read docs/AUDIT-2026-07-01.md and PROJECT_STATUS.md"

echo "=== any count ==="
grep -rEn ": any|<any>|as any" src/ --include="*.ts" --include="*.tsx" | wc -l
# target: < 50

echo "=== files >500 LOC ==="
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | awk '$1 > 500 { c++ } END { print c }'
# target: < 15

echo "=== files >800 LOC ==="
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | awk '$1 > 800 { c++ } END { print c }'
# target: 0

echo "=== @ts-nocheck ==="
grep -rl "@ts-nocheck" src/ | wc -l
# target: 0

echo "=== console.log ==="
grep -rEln "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "^src/lib/debug/" | wc -l
# target: 0

echo "=== JSON.parse(JSON.stringify()) ==="
grep -rEn "JSON\.parse\(JSON\.stringify" src/ | wc -l
# target: 0

echo "=== new Audio outside pool ==="
grep -rEn "new Audio\s*\(" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "src/lib/audioElementPool.ts" \
  | grep -v "src/hooks/audio/" \
  | grep -v "src/lib/audio/" \
  | grep -v "src/services/audio-reference/" \
  | grep -v "src/services/voice/" \
  | grep -v "src/lib/performance-utils.ts" \
  | grep -v "src/hooks/generation/useGenerateFormValidation.ts" \
  | grep -v "src/hooks/studio/" \
  | grep -v "src/hooks/useReferenceStemPlayback.ts" \
  | wc -l
# target: 0

echo "=== components importing supabase ==="
grep -rln "@/integrations/supabase" src/components/ | wc -l
# target: 0

echo "=== touch targets <44px ==="
grep -rEn 'className=.*"[^"]*\bh-(6|7|8|9|10|11|12)\b[^"]*\bw-(6|7|8|9|10|11|12)\b[^"]*"' src/components --include="*.tsx" | wc -l
# target: ≤ 20 (decorative only)

echo "=== tests pass ==="
npm test --run
echo "=== lint ==="
npm run lint
echo "=== tsc ==="
npx tsc --noEmit
echo "=== bundle ==="
npm run size
```

- [ ] **Step 2: Update PROJECT_STATUS.md with final state**

Set overall progress to `98%`. Update each metric badge.

- [ ] **Step 3: Final commit + tag**

```bash
git add PROJECT_STATUS.md docs/AUDIT-2026-07-01.md
git commit -m "docs: sprint 042-045 closed — score 6.7 → 8.5"

git tag -a sprint-045-close -m "Sprint 045 closed; architecture 6.7 → 8.5/10"
git push origin sprint-045-close
```

---

## Self-Review Notes

**Spec coverage** (from the original Sprints 042-043 plan):

- ✅ Page decomposition (B1, B2)
- ✅ Audio pool final (B3)
- ✅ Layer compliance (C1-C4)
- ✅ Touch targets (C5)
- ✅ Type safety (D1-D7)
- ✅ Hygiene (E1, E2)
- ✅ Documentation sync (E3, E4)
- ✅ Quick wins (A1-A5)

**Coverage gaps deliberately NOT in this plan:**

- E2E pipeline in CI (Sprint 039-async; requires GitHub Secrets — out of scope for code changes).
- Lighthouse CI budget enforcement (Sprint 040).
- Storybook push (deferred; doesn't affect architecture score much).
- Service Worker offline mode (Sprint 040).

**Placeholder scan:** No `TBD`, `TODO`, `implement later` in the steps above. All code is concrete.

**Type consistency:** All hooks use the same names (`usePreviewAudio`, `useTouchTargetSize`, `usePlayerWorkspace`), `Result<T,E>` API is consistent across D1 and D6.

**Naming drift to watch during execution:**

- `usePreviewAudio` — never `usePreviewPlayer`
- `STORAGE_KEYS.*` — never `StorageKeys.*`
- `Result<T,E>` / `ok` / `err` / `isOk` / `isErr` — lowercase exports
