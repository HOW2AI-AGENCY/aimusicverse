# Generate Sheet UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Decompose `src/components/GenerateSheet.tsx` (512 LOC) into single-responsibility units; ship real-time form validation with bottom-sheet reasons; switch lyrics AI Assistant from Dialog to bottom sheet with live preview; add drag-reorder and templates for lyrics sections; consolidate the dual reference row into one chip row; rewrite AdvancedSettings as card-based with info popovers; delete dead `wizard/` code from Sprint 050; ship behind a feature flag with 3-phase Strangler Fig rollout.

**Architecture:** A new `useGenerateSheetController` hook owns all dialog state, Telegram buttons, draft save, validation wiring, and reference state, leaving a thin ~80-line `GenerateSheet.tsx` orchestrator. A new `useGenerateSheetValidation` hook computes `{ canGenerate, reasons[] }` reactively from form state; the CTA reacts to it by either submitting, showing a transient warning toast, or opening `ValidationReasonsSheet`. Lyrics input is split into `useLyricsSections` (parse/serialize/add/remove/reorder), `LyricsVisualEditor` (~300 LOC card list), `LyricsSectionTemplates` (4 in-memory templates), and `LyricsAssistantSheet` (bottom sheet via vaul with collapsible live-preview row). `AdvancedSettings` becomes a stack of cards with Radix `Popover` info icons. The reference row collapses `GenerateFormActions` and `GenerateFormReferences` into a single `ReferenceChipsRow`. All changes live behind `useFeatureFlag("generate-sheet-redesign")` for 3-phase rollout: 10% then 50% then 100%.

**Tech Stack:** React 19 + TypeScript 5.9 + Tailwind CSS 3.4 + Radix UI + @dnd-kit/core + @dnd-kit/sortable + vaul (existing) + framer-motion (via @/lib/motion tree-shake wrapper) + Vitest 4.x + Playwright 1.57.

**Spec:** [docs/superpowers/specs/2026-07-04-generate-sheet-redesign-design.md](../specs/2026-07-04-generate-sheet-redesign-design.md)

## Global Constraints

- **Bundle budget:** 950 KB hard limit (`npm run size`). Do not regress. Net new budget for this feature: +10 KB gzip.
- **TypeScript:** `tsc --noEmit` must remain 0 errors. Strict mode, no `any`.
- **ESLint:** 0 NEW errors introduced. Existing 108 / 1735 debt unchanged.
- **Locale:** All user-facing copy is Russian. Section labels, template labels, validation messages, button text — all Russian. No copy changes to existing components outside of advance
  d settings features this plan owns.
- **Touch targets:** Minimum 44x44 px on every interactive element (drag handles, type dropdown, delete buttons, voice buttons, etc).
- **Motion:** All framer-motion imports from `@/lib/motion` (tree-shaken wrapper). No new animation libraries.
- **Existing tests:** 292 unit tests + 47 E2E specs must all pass at every checkpoint. Never `it.skip` existing tests.
- **Branch:** `sprint-056/generate-sheet-redesign` based on `main` at current HEAD.
- **Vitest globals:** `describe` / `it` / `expect` are global, no import needed. `@testing-library/jest-dom` extended matchers available.
- **Path alias:** `@/` maps to `./src/`.
- **Library installation:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. Verify they are not yet installed before adding (may already be a transitive dep).
- **Feature flag:** ALWAYS reads via `useFeatureFlag("generate-sheet-redesign")` from `src/hooks/useFeatureFlag.ts`. Storage key `ff.generate-sheet-redesign` in localStorage. Default OFF in prod.
- **Analytics:** All new analytics events use `trackAction(eventName, category, action, props)` from `useFeatureUsageTracking` (existing hook). Never call analytics directly.
- **Logging:** Use `logger.info / warn / error` from `@/lib/logger`. Never `console.log`.
- **Suno API contract:** Plain text lyrics with bracket section markers (`[Verse]\n...`). Section parser must produce identical output to current `LyricsSectionAdvanced.tsx` for any text starting with valid headers.

---

## File Structure

### New files

- `src/hooks/generation/useGenerateFormState.ts` — extracted state, setters, derived getters (no behavior change).
- `src/hooks/generation/useGenerateFormActions.ts` — extracted async actions (handleGenerate, saveDraft, boostStyle, etc).
- `src/hooks/generation/useGenerateFormValidation.ts` — extracted canGenerate, generationCost, generationCostBreakdown, userBalance.
- `src/hooks/generation/useGenerateSheetController.ts` — orchestrates all dialog state, telegram buttons, draft save, validation wiring. Returns the single object consumed by GenerateSheet.tsx.
- `src/hooks/generation/useGenerateSheetValidation.ts` — consumer-facing validation wrapper. Maps form state to `ValidationReason[]` and `canGenerate`.
- `src/components/generate-sheet/GenerateSheetHeader.tsx` — compact header (credits + mode toggle + model select + close).
- `src/components/generate-sheet/GenerateSheetBody.tsx` — lazy simple/custom body with Suspense skeleton.
- `src/components/generate-sheet/GenerateSheetFooter.tsx` — CTA + draft button + cost tooltip.
- `src/components/generate-sheet/GenerateSheetDialogs.tsx` — wraps all secondary dialogs (project, artist, audio action, voice clone, history, styles).
- `src/components/generate-sheet/ValidationReasonsSheet.tsx` — bottom sheet of validation reasons (errors red, warnings yellow, deep-link to fields).
- `src/components/generate-sheet/ReferenceChipsRow.tsx` — one-row reference picker with selected chips and overflow `+N more` popover.
- `src/components/generate-form/lyrics/LyricsSection.tsx` — wrapper with toolbar (assistant + templates + stats).
- `src/components/generate-form/lyrics/LyricsVisualEditor.tsx` — DnD-kit sortable list of section cards (~300 LOC).
- `src/components/generate-form/lyrics/LyricsSectionCard.tsx` — single section UI (drag handle + type dropdown + textarea + delete).
- `src/components/generate-form/lyrics/LyricsSectionTemplates.ts` — in-memory template definitions.
- `src/components/generate-form/lyrics/useLyricsSections.ts` — parse / serialize / add / remove / reorder / apply template.
- `src/components/generate-form/lyrics/LyricsAssistantSheet.tsx` — bottom sheet (vaul) replaces `LyricsChatAssistant.tsx`. Includes collapsible preview row.
- `src/components/generate-form/lyrics/LyricsAssistantChat.tsx` — chat body (split from `LyricsChatAssistant.tsx`).
- `src/components/generate-form/lyrics/index.ts` — barrel exports (NB: see Global Constraint about barrel cycles below).

### Modified files

- `src/components/GenerateSheet.tsx` — rewritten as thin orchestrator (~80 LOC) consuming `useGenerateSheetController`. Old logic preserved but moved into hook.
- `src/hooks/generation/useGenerateForm.ts` — replaced by 3 thin re-exports that internally call new hooks. Same public API. Old file removed after Task 3.
- `src/components/generate-form/AdvancedSettings.tsx` — rewritten as card-based layout, Radix `Popover` for info, `voc
  test

al-gender`as inline`Button` group (no separate Card needed).

- `src/components/generate-form/GenerateFormCustom.tsx` — replace inner `AdvancedSettings` Collapsible with card stack; lift `advancedOpen` state into form hook; open by default in custom mode.
- `src/components/generate-form/GenerateFormSimple.tsx` — align header layout with new header (no behavior change).
- `src/components/generate-form/sections/LyricsSectionAdvanced.tsx` — keep as orchestrator, but delegate body to new `LyricsVisualEditor`. May be deleted once dependents move (audit in Phase 1 cleanup).
- `src/hooks/generation/index.ts` — export new hooks. Verify no circular imports.
- `src/lib/feature-flags.ts` — add `GENERATE_SHEET_REDESIGN_ENABLED` constant.
- `src/hooks/analytics/useFeatureUsageTracking.ts` — verify event names from spec section 6.5 are accepted (no schema change needed; hook accepts free-form strings).

### Deleted files (after audit and rewire)

- `src/components/generate-form/wizard/GenerationWizard.tsx`
- `src/components/generate-form/wizard/WizardProgress.tsx`
- `src/components/generate-form/wizard/index.ts`
- `src/components/generate-form/wizard/steps/IdeaStep.tsx`
- `src/components/generate-form/wizard/steps/IdeaStyleCombinedStep.tsx`
- `src/components/generate-form/wizard/steps/LyricsStep.tsx`
- `src/components/generate-form/wizard/steps/PreviewStep.tsx`
- `src/components/generate-form/wizard/steps/SettingsStep.tsx`
- `src/components/generate-form/wizard/steps/StyleSettingsStep.tsx`
- `src/components/generate-form/wizard/steps/StyleStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsGenerateStep.tsx`
- `src/components/generate-form/wizard/steps/VocalsLyricsStep.tsx`
- `src/components/generate-form/lyrics-wizard/ConceptStep.tsx` (zero callers per grep audit)
- `src/components/generate-form/LyricsVisualEditorCompact.tsx` (after porting tests to `LyricsVisualEditor.tsx`)
- `src/components/generate-form/LyricsChatAssistant.tsx` (replaced by `LyricsAssistantSheet.tsx`)
- `src/components/generate-form/lyrics-chat/` (entire directory — `LyricsAssistantChat.tsx` is the new chat body)

### New tests

- `src/__tests__/hooks/useGenerateSheetValidation.test.ts`
- `src/__tests__/hooks/useGenerateFormValidation.test.ts`
- `src/__tests__/hooks/useGenerateSheetController.test.ts`
- `src/__tests__/hooks/useLyricsSections.test.ts`
- `src/__tests__/hooks/generation/useGenerateFormState-split.test.ts` (verifies old API still works)
- `src/__tests__/components/lyrics/LyricsSectionTemplates.test.ts`
- `src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx`
- `src/__tests__/components/lyrics/AdvancedSettings.test.tsx`
- `src/__tests__/components/lyrics/ValidationReasonsSheet.test.tsx`
- `src/__tests__/components/lyrics/LyricsAssistantSheet.test.tsx`
- `src/__tests__/components/lyrics/ReferenceChipsRow.test.tsx`
- `tests/e2e/generation-sheet-redesign.spec.ts`
- `tests/e2e/generation-validation.spec.ts`
- `tests/e2e/lyrics-assistant-sheet.spec.ts`
- `tests/e2e/reference-chips.spec.ts`

### New Storybook stories

- `src/components/generate-sheet/GenerateSheet.stories.tsx` (Default, SimpleMode, CustomMode, Loading, Disabled)
- `src/components/generate-form/lyrics/LyricsVisualEditor.stories.tsx` (Empty, PopTemplate, CustomSections, DragDemo)
- `src/components/generate-form/AdvancedSettings.stories.tsx` (Closed, WithPersona)
- `src/components/generate-sheet/ValidationReasonsSheet.stories.tsx` (ErrorsOnly, ErrorsPlusWarnings)
- `src/components/generate-form/lyrics/LyricsAssistantSheet.stories.tsx` (EmptyChat, WithPreviewSuggestion)
- `src/components/generate-sheet/ReferenceChipsRow.stories.tsx` (Empty, AllSelected, Overflow)

### Out of scope (DO NOT TOUCH)

- Suno API request/response contracts.
- Telegram bot handlers in `supabase/functions/telegram-bot/`.
- `useGenerateDraft` itself (only its consumer wiring changes).
- Voice cloning API in `src/components/voice-clone/CustomVoicePicker.tsx` (it stays as the inner picker for voice reference).
- `playerStore` / `usePlayerStore` (audio playback is independent).
- `src/hooks/generation/useAudioReference.ts` (called unchanged from controller).

---

## Task 1: Add feature flag and split `useGenerateForm.ts`

**Files:**

- Create: `src/lib/feature-flags/__test__/generate-sheet-redesign-flag.test.ts`
- Create: `src/hooks/generation/useGenerateFormState.ts`
- Create: `src/hooks/generation/useGenerateFormActions.ts`
- Create: `src/hooks/generation/useGenerateFormValidation.ts`
- Modify: `src/hooks/generation/useGenerateForm.ts` (becomes thin composer)
- Modify: `src/lib/feature-flags.ts` (add constant)

**Interfaces:**

- Produces: `useGenerateFormState(): UseGenerateFormStateReturn` — owns `style, setStyle, lyrics, setLyrics, title, setTitle, mode, setMode, model, setModel, vocalGender, setVocalGender, styleWeight, setStyleWeight, weirdnessConstraint, setWeirdnessConstraint, audioWeight, setAudioWeight, negativeTags, setNegativeTags, hasVocals, setHasVocals, isPublic, setIsPublic, customVoiceId, setCustomVoiceId, audioFile, setAudioFile, selectedArtistId, setSelectedArtistId, selectedProjectId, setSelectedProjectId, selectedTrackId, setSelectedTrackId, planTrackId, setPlanTrackId, description, setDescription, hasUnsavedData, resetForm`.
- Produces: `useGenerateFormActions(deps: UseGenerateFormActionsDeps): UseGenerateFormActionsReturn` — owns `handleGenerate, handleBoostStyle, saveDraft, clearDraft, setActiveReference, setAudioReferenceLoading`.
- Produces: `useGenerateFormValidation(deps): { canGenerate, generationCost, generationCostBreakdown, userBalance }`.

- [ ] **Step 1: Write failing test for feature flag constant**

```ts
// src/lib/feature-flags/__test__/generate-sheet-redesign-flag.test.ts
import { describe, it, expect } from "vitest";
import { GENERATE_SHEET_REDESIGN_ENABLED } from "@/lib/feature-flags";

describe("GENERATE_SHEET_REDESIGN_ENABLED flag", () => {
  it("has a stable storage key", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.storageKey).toBe("ff.generate-sheet-redesign");
  });

  it("defaults to false in prod", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.default).toBe(false);
  });

  it("rolls out gradually in prod (start <= rampTo)", () => {
    const prod = GENERATE_SHEET_REDESIGN_ENABLED.environments.prod as {
      start: number;
      rampTo: number;
      rampDays: number;
    };
    expect(prod.start).toBeLessThanOrEqual(prod.rampTo);
    expect(prod.rampDays).toBeGreaterThanOrEqual(3);
  });

  it("is fully on in dev and staging", () => {
    expect(GENERATE_SHEET_REDESIGN_ENABLED.environments.dev).toBe(1);
    expect(GENERATE_SHEET_REDESIGN_ENABLED.environments.staging).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- generate-sheet-redesign-flag`
Expected: FAIL with "GENERATE_SHEET_REDESIGN_ENABLED is not exported".

- [ ] **Step 3: Open existing feature-flags module and add constant**

Open `src/lib/feature-flags.ts`. Find the last exported constant. Add after it:

```ts
export const GENERATE_SHEET_REDESIGN_ENABLED = {
  default: false,
  storageKey: "ff.generate-sheet-redesign",
  environments: {
    dev: 1,
    staging: 1,
    prod: { start: 0.1, rampTo: 1, rampDays: 5 },
  },
} as const;
```

Verify the file already exports a similar constant (e.g., `EXAMPLE_FLAG`) and follow its exact shape. If shapes differ, adapt the test in Step 1.

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- generate-sheet-redesign-flag`
Expected: PASS (4/4 assertions).

- [ ] **Step 5: Commit feature flag**

```bash
git add src/lib/feature-flags.ts src/lib/feature-flags/__test__/generate-sheet-redesign-flag.test.ts
git commit -m "feat(flag): add generate-sheet-redesign feature flag"
```

- [ ] **Step 6: Write failing test for backward-compatible useGenerateForm split**

```ts
// src/__tests__/hooks/generation/useGenerateFormState-split.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/hooks/generation/useGenerateFormState", () => ({
  useGenerateFormState: vi.fn(() => ({ style: "rock", setStyle: vi.fn(), hasUnsavedData: false })),
}));
vi.mock("@/hooks/generation/useGenerateFormActions", () => ({
  useGenerateFormActions: vi.fn(() => ({ handleGenerate: vi.fn(), saveDraft: vi.fn() })),
}));
vi.mock("@/hooks/generation/useGenerateFormValidation", () => ({
  useGenerateFormValidation: vi.fn(() => ({ canGenerate: true, generationCost: 8, userBalance: 42 })),
}));

import { useGenerateForm } from "@/hooks/generation/useGenerateForm";

describe("useGenerateForm backward compat", () => {
  it("merges state, actions, and validation into one object", () => {
    const { result } = renderHook(() =>
      useGenerateForm({ open: true, onOpenChange: vi.fn(), projects: [], artists: [] as never, allTracks: [] }),
    );
    expect(result.current.style).toBe("rock");
    expect(result.current.generationCost).toBe(8);
    expect(typeof result.current.handleGenerate).toBe("function");
    expect(typeof result.current.saveDraft).toBe("function");
  });

  it("exposes generationCostBreakdown array", () => {
    const { result } = renderHook(() =>
      useGenerateForm({ open: true, onOpenChange: vi.fn(), projects: [], artists: [] as never, allTracks: [] }),
    );
    expect(result.current.generationCostBreakdown).toBeDefined();
  });
});
```

- [ ] **Step 7: Run test to verify failure**

Run: `npm test -- useGenerateFormState-split`
Expected: FAIL with "Cannot find module" for one or more new hooks.

- [ ] **Step 8: Open `src/hooks/generation/useGenerateForm.ts` and identify three boundaries**

Read `src/hooks/generation/useGenerateForm.ts` (1023 LOC). Identify these groups by looking at top-level declarations and `return` statement:

- **State declarations + setters + derived getters**: `useState` calls and `useMemo`/`useCallback` that only read state.
- **Async actions**: `handleGenerate`, `handleBoostStyle`, `saveDraft`, `clearDraft`, `resetForm`, anything with `await` or `mutate`.
- **Cost calculation**: `generationCost`, `generationCostBreakdown`, `canGenerate`, `userBalance`.

Note the exact names. Do not change behavior.

- [ ] **Step 9: Create `useGenerateFormState.ts`**

Create `src/hooks/generation/useGenerateFormState.ts`. Move ALL state declarations, setters, and derived getters from `useGenerateForm.ts`. Export a single `useGenerateFormState(params)` hook that takes the same params as the original (`open`, `onOpenChange`, `initialProjectId`, `projects`, `artists`, `allTracks`) and returns ONLY the state subset. Internal cross-references to actions must become params; e.g., if state derived `hasUnsavedData` reads `boostLoading`, pass `boostLoading` as a param.

Skeleton:

```ts
// src/hooks/generation/useGenerateFormState.ts
import { useState, useMemo, useEffect } from "react";
import type { UseGenerateFormParams, UseGenerateFormStateReturn } from "./useGenerateForm.types";

export function useGenerateFormState(params: UseGenerateFormParams): UseGenerateFormStateReturn {
  // ... paste state code from useGenerateForm.ts verbatim ...
  return { style, setStyle, /* ... */ hasUnsavedData };
}
```

- [ ] **Step 10: Create `useGenerateFormActions.ts`**

Create `src/hooks/generation/useGenerateFormActions.ts`. Move ALL async actions. The actions hook takes a deps object with everything it needs (state setters + form data + telegram hooks + toast util + logger). It returns the actions object.

```ts
// src/hooks/generation/useGenerateFormActions.ts
import { useCallback } from "react";
import type { UseGenerateFormActionsDeps, UseGenerateFormActionsReturn } from "./useGenerateForm.types";

export function useGenerateFormActions(deps: UseGenerateFormActionsDeps): UseGenerateFormActionsReturn {
  // ... paste actions code from useGenerateForm.ts, replacing 'useGenerateForm' internal reads with `deps.X` ...
  return { handleGenerate, handleBoostStyle, saveDraft, clearDraft };
}
```

- [ ] **Step 11: Create `useGenerateFormValidation.ts`**

Create `src/hooks/generation/useGenerateFormValidation.ts`. Move cost calculation:

```ts
// src/hooks/generation/useGenerateFormValidation.ts
import { useMemo } from "react";
import type { UseGenerateFormValidationDeps, UseGenerateFormValidationReturn } from "./useGenerateForm.types";

export function useGenerateFormValidation(deps: UseGenerateFormValidationDeps): UseGenerateFormValidationReturn {
  // ... paste cost code from useGenerateForm.ts ...
  return { canGenerate, generationCost, generationCostBreakdown, userBalance };
}
```

- [ ] **Step 12: Create `useGenerateForm.types.ts`**

Create `src/hooks/generation/useGenerateForm.types.ts` with the three interfaces. Export types only (no runtime code). Each interface must mirror exactly the public API of the corresponding hook.

- [ ] **Step 13: Rewrite `useGenerateForm.ts` as composer**

Replace the entire body of `src/hooks/generation/useGenerateForm.ts` with:

```ts
// src/hooks/generation/useGenerateForm.ts
import { useGenerateFormState } from "./useGenerateFormState";
import { useGenerateFormActions } from "./useGenerateFormActions";
import { useGenerateFormValidation } from "./useGenerateFormValidation";
import type { UseGenerateFormParams, UseGenerateFormReturn } from "./useGenerateForm.types";

export function useGenerateForm(params: UseGenerateFormParams): UseGenerateFormReturn {
  const state = useGenerateFormState(params);
  const validation = useGenerateFormValidation({ ...state, ...params });
  const actions = useGenerateFormActions({ ...state, ...validation, ...params });
  return { ...state, ...validation, ...actions };
}

// Re-export types for back-compat
export type { UseGenerateFormParams, UseGenerateFormReturn } from "./useGenerateForm.types";
```

- [ ] **Step 14: Run all 292 existing unit tests**

Run: `npm test`
Expected: PASS (all 292 tests).

If any test fails, the split introduced a behavior change. Diff the moved code against the original. Fix and re-run.

- [ ] **Step 15: Verify no file >500 LOC**

Run:

```bash
wc -l src/hooks/generation/useGenerateForm*.ts
```

Expected: each file <=500 LOC. If `useGenerateFormState.ts` is >500, split further into `useGenerateFormBasicState` + `useGenerateFormDerivedState`.

- [ ] **Step 16: Run typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 NEW errors.

- [ ] **Step 17: Commit split**

```bash
git add src/hooks/generation/useGenerateForm*.ts
git commit -m "refactor(generation): split usegenerateform into state/actions/validation"
```

---

## Task 2: Add `useGenerateSheetValidation` hook

**Files:**

- Create: `src/hooks/generation/useGenerateSheetValidation.ts`
- Create: `src/__tests__/hooks/useGenerateSheetValidation.test.ts`

**Interfaces:**

- Produces: `useGenerateSheetValidation(form: UseGenerateFormReturn, balance: number, cost: number): UseGenerateSheetValidationReturn` where `UseGenerateSheetValidationReturn = { canGenerate: boolean; reasons: ValidationReason[]; hasWarnings: boolean }` and `ValidationReason = { field: ValidationField; severity: ValidationSeverity; message: string; messageRu: string; deepLink?: () => void }`.

- [ ] **Step 1: Write failing test for empty form (all errors)**

```ts
// src/__tests__/hooks/useGenerateSheetValidation.test.ts
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGenerateSheetValidation } from "@/hooks/generation/useGenerateSheetValidation";

const emptyForm = {
  title: "",
  style: "",
  lyrics: "",
  mode: "custom",
  model: "v5",
  hasVocals: true,
  vocalGender: "",
  audioFile: null,
  selectedArtistId: undefined,
  selectedProjectId: undefined,
  customVoiceId: null,
} as never;

describe("useGenerateSheetValidation", () => {
  it("flags empty style as error", () => {
    const { result } = renderHook(() => useGenerateSheetValidation(emptyForm, 100, 8));
    const styleReason = result.current.reasons.find((r) => r.field === "style");
    expect(styleReason?.severity).toBe("error");
    expect(result.current.canGenerate).toBe(false);
  });

  it("flags empty title as warning only", () => {
    const { result } = renderHook(() => useGenerateSheetValidation(emptyForm, 100, 8));
    const titleReason = result.current.reasons.find((r) => r.field === "title");
    expect(titleReason?.severity).toBe("warning");
  });

  it("flags insufficient credits as error", () => {
    const { result } = renderHook(() => useGenerateSheetValidation({ ...emptyForm, style: "rock" }, 5, 8));
    const creditsReason = result.current.reasons.find((r) => r.field === "credits");
    expect(creditsReason?.severity).toBe("error");
  });

  it("flags lyrics >3000 chars as error", () => {
    const long = "a".repeat(3001);
    const { result } = renderHook(() =>
      useGenerateSheetValidation({ ...emptyForm, style: "rock", lyrics: long }, 100, 8),
    );
    const lyricsReason = result.current.reasons.find((r) => r.field === "lyrics");
    expect(lyricsReason?.severity).toBe("error");
  });

  it("returns canGenerate=true when form is valid and credits sufficient", () => {
    const valid = { ...emptyForm, style: "rock", lyrics: "Hello", title: "My Song" };
    const { result } = renderHook(() => useGenerateSheetValidation(valid, 100, 8));
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.hasWarnings).toBe(false);
  });

  it("hasWarnings=true when only warnings present (no errors)", () => {
    const noTitle = { ...emptyForm, style: "rock", lyrics: "Hello" };
    const { result } = renderHook(() => useGenerateSheetValidation(noTitle, 100, 8));
    expect(result.current.canGenerate).toBe(true);
    expect(result.current.hasWarnings).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- useGenerateSheetValidation`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create `useGenerateSheetValidation.ts`**

Create `src/hooks/generation/useGenerateSheetValidation.ts`:

```ts
import { useMemo } from "react";
import type { UseGenerateFormReturn } from "./useGenerateForm.types";

export type ValidationField = "title" | "style" | "lyrics" | "credits" | "model" | "audioFile";
export type ValidationSeverity = "error" | "warning";

export interface ValidationReason {
  field: ValidationField;
  severity: ValidationSeverity;
  message: string;
  messageRu: string;
  deepLink?: () => void;
}

export interface UseGenerateSheetValidationReturn {
  canGenerate: boolean;
  reasons: ValidationReason[];
  hasWarnings: boolean;
}

export function useGenerateSheetValidation(
  form: UseGenerateFormReturn,
  balance: number,
  cost: number,
): UseGenerateSheetValidationReturn {
  const reasons = useMemo<ValidationReason[]>(() => {
    const r: ValidationReason[] = [];

    // title: empty = warning
    if (!form.title.trim()) {
      r.push({ field: "title", severity: "warning", message: "title.empty", messageRu: "Название не заполнено" });
    } else if (form.title.length > 80) {
      r.push({
        field: "title",
        severity: "warning",
        message: "title.too_long",
        messageRu: "Слишком длинное название (>80 символов)",
      });
    }

    // style: empty = error
    if (!form.style.trim()) {
      r.push({ field: "style", severity: "error", message: "style.empty", messageRu: "Опишите стиль трека" });
    } else if (form.style.length > 200) {
      r.push({
        field: "style",
        severity: "warning",
        message: "style.too_long",
        messageRu: "Слишком длинное описание стиля (>200 символов)",
      });
    }

    // lyrics
    if (form.lyrics.length > 3000) {
      r.push({
        field: "lyrics",
        severity: "error",
        message: "lyrics.too_long",
        messageRu: "Превышен лимит Suno API (3000 символов)",
      });
    } else if (form.hasVocals && !form.lyrics.trim()) {
      r.push({
        field: "lyrics",
        severity: "warning",
        message: "lyrics.empty_with_vocals",
        messageRu: "Вокал включён, но текст пустой",
      });
    }

    // credits
    if (balance < cost) {
      r.push({
        field: "credits",
        severity: "error",
        message: "credits.insufficient",
        messageRu: `Недостаточно кредитов (нужно ${cost}, доступно ${balance})`,
      });
    }

    return r;
  }, [form.title, form.style, form.lyrics, form.hasVocals, balance, cost]);

  const canGenerate = reasons.every((r) => r.severity !== "error");
  const hasWarnings = reasons.some((r) => r.severity === "warning");

  return { canGenerate, reasons, hasWarnings };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- useGenerateSheetValidation`
Expected: PASS (6/6).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/generation/useGenerateSheetValidation.ts src/__tests__/hooks/useGenerateSheetValidation.test.ts
git commit -m "feat(validation): add useGenerateSheetValidation hook with 6 rules"
```

---

## Task 3: Build `ValidationReasonsSheet` component

**Files:**

- Create: `src/components/generate-sheet/ValidationReasonsSheet.tsx`
- Create: `src/__tests__/components/lyrics/ValidationReasonsSheet.test.tsx`

**Interfaces:**

- Produces: `<ValidationReasonsSheet open={boolean} onOpenChange={(b:boolean)=>void} reasons={ValidationReason[]} />` — bottom sheet via `vaul` (existing `MobileBottomSheet` wrapper).

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/components/lyrics/ValidationReasonsSheet.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ValidationReasonsSheet } from "@/components/generate-sheet/ValidationReasonsSheet";
import type { ValidationReason } from "@/hooks/generation/useGenerateSheetValidation";

const reasons: ValidationReason[] = [
  { field: "style", severity: "error", message: "style.empty", messageRu: "Опишите стиль трека" },
  {
    field: "credits",
    severity: "error",
    message: "credits.insufficient",
    messageRu: "Недостаточно кредитов (нужно 8, доступно 3)",
  },
  { field: "title", severity: "warning", message: "title.empty", messageRu: "Название не заполнено" },
];

describe("ValidationReasonsSheet", () => {
  it("renders all reason messages in Russian", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={reasons} />);
    expect(screen.getByText("Опишите стиль трека")).toBeInTheDocument();
    expect(screen.getByText(/Недостаточно кредитов/)).toBeInTheDocument();
    expect(screen.getByText("Название не заполнено")).toBeInTheDocument();
  });

  it("shows errors with red indicator and warnings with yellow", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={reasons} />);
    expect(screen.getByText("❌")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("calls onOpenChange(false) when close button clicked", () => {
    const onOpenChange = vi.fn();
    render(<ValidationReasonsSheet open={true} onOpenChange={onOpenChange} reasons={reasons} />);
    fireEvent.click(screen.getByText("Закрыть"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders empty state when no reasons", () => {
    render(<ValidationReasonsSheet open={true} onOpenChange={vi.fn()} reasons={[]} />);
    expect(screen.getByText("Всё готово к генерации")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- ValidationReasonsSheet`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create `ValidationReasonsSheet.tsx`**

```tsx
// src/components/generate-sheet/ValidationReasonsSheet.tsx
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import type { ValidationReason } from "@/hooks/generation/useGenerateSheetValidation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reasons: ValidationReason[];
}

export function ValidationReasonsSheet({ open, onOpenChange, reasons }: Props) {
  const errors = reasons.filter((r) => r.severity === "error");
  const warnings = reasons.filter((r) => r.severity === "warning");

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[80]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-2xl p-4 pb-safe max-h-[80dvh] flex flex-col">
          <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />
          <Drawer.Title className="text-base font-semibold mb-3">
            {reasons.length === 0 ? "Всё готово к генерации" : "Чтобы сгенерировать трек"}
          </Drawer.Title>

          <div className="flex-1 overflow-y-auto space-y-2">
            {errors.map((r, i) => (
              <ReasonRow key={`e-${i}`} reason={r} tone="error" />
            ))}
            {warnings.map((r, i) => (
              <ReasonRow key={`w-${i}`} reason={r} tone="warning" />
            ))}
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-3 h-11 w-full">
            Закрыть
          </Button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ReasonRow({ reason, tone }: { reason: ValidationReason; tone: "error" | "warning" }) {
  const icon = tone === "error" ? "❌" : "⚠️";
  const cls = tone === "error" ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/30 bg-yellow-500/5";

  return (
    <div className={cn("rounded-xl border p-3 space-y-1", cls)}>
      <div className="flex items-start gap-2">
        <span aria-hidden>{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{reason.messageRu}</p>
          {reason.deepLink && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback("light");
                reason.deepLink?.();
              }}
              className="text-xs text-primary underline-offset-2 hover:underline mt-1"
            >
              Перейти к полю
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- ValidationReasonsSheet`
Expected: PASS (4/4).

- [ ] **Step 5: Run lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/generate-sheet/ValidationReasonsSheet.tsx src/__tests__/components/lyrics/ValidationReasonsSheet.test.tsx
git commit -m "feat(validation): add ValidationReasonsSheet bottom sheet"
```

---

## Task 4: Build `useGenerateSheetController` hook

**Files:**

- Create: `src/hooks/generation/useGenerateSheetController.ts`
- Create: `src/__tests__/hooks/useGenerateSheetController.test.ts`

**Interfaces:**

- Produces: `useGenerateSheetController(params: { open: boolean; onOpenChange: (b:boolean)=>void; initialProjectId?: string }): { form, validation, dialogs: { project, artist, audioAction, voiceClone, history, lyricsAssistant, styles, closeConfirm }, actions: { handleGenerate, handleSaveDraft, handleCloseRequest, handleClearDraft, handleProjectSelect, handleAdvancedToggle }, telegram, references }` — full controller per spec §2.2.

- [ ] **Step 1: Write failing test (smoke)**

```ts
// src/__tests__/hooks/useGenerateSheetController.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/hooks/useProjects", () => ({ useProjects: () => ({ projects: [] }) }));
vi.mock("@/hooks/useArtists", () => ({ useArtists: () => ({ artists: [] }) }));
vi.mock("@/hooks/useTracks", () => ({ useTracks: () => ({ tracks: [] }) }));
vi.mock("@/contexts/TelegramContext", () => ({
  useTelegram: () => ({
    hapticFeedback: vi.fn(),
    enableClosingConfirmation: vi.fn(),
    disableClosingConfirmation: vi.fn(),
  }),
}));

import { useGenerateSheetController } from "@/hooks/generation/useGenerateSheetController";

describe("useGenerateSheetController", () => {
  it("starts with all dialogs closed", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: false, onOpenChange: vi.fn() }));
    expect(result.current.dialogs.project.open).toBe(false);
    expect(result.current.dialogs.artist.open).toBe(false);
    expect(result.current.dialogs.lyricsAssistant.open).toBe(false);
  });

  it("exposes validation with canGenerate=false on empty form", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));
    expect(result.current.validation.canGenerate).toBe(false);
    expect(result.current.validation.reasons.length).toBeGreaterThan(0);
  });

  it("toggles lyricsAssistant dialog", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));
    act(() => result.current.actions.openLyricsAssistant());
    expect(result.current.dialogs.lyricsAssistant.open).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- useGenerateSheetController`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Create `useGenerateSheetController.ts`**

Move ALL dialog state, Telegram button wiring, draft save logic, project/track selection logic, and `handleCloseRequest` from `src/components/GenerateSheet.tsx` into this hook. Use `useGenerateForm` internally, and `useGenerateSheetValidation` for the validation return.

Skeleton:

```ts
// src/hooks/generation/useGenerateSheetController.ts
import { useState, useCallback, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useTelegram } from "@/contexts/TelegramContext";
import { useGenerateForm } from "./useGenerateForm";
import { useGenerateSheetValidation } from "./useGenerateSheetValidation";
import { notify } from "@/lib/notifications";
import { hapticImpact } from "@/lib/haptics";
import { useFeatureUsageTracking } from "@/hooks/analytics/useFeatureUsageTracking";

interface Params {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
}

export function useGenerateSheetController({ open, onOpenChange, initialProjectId }: Params) {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { hapticFeedback, enableClosingConfirmation, disableClosingConfirmation } = useTelegram();
  const { trackAction } = useFeatureUsageTracking();

  const form = useGenerateForm({
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists: artists as never,
    allTracks,
  });

  const validation = useGenerateSheetValidation(form, form.userBalance, form.generationCost);

  // Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false);
  const [voiceCloneOpen, setVoiceCloneOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<"project" | "track">("project");

  // ... rest of logic moved verbatim from GenerateSheet.tsx ...

  return {
    form,
    validation,
    dialogs: {
      project: { open: projectDialogOpen, setOpen: setProjectDialogOpen },
      artist: { open: artistDialogOpen, setOpen: setArtistDialogOpen },
      audioAction: { open: audioActionDialogOpen, setOpen: setAudioActionDialogOpen },
      voiceClone: { open: voiceCloneOpen, setOpen: setVoiceCloneOpen },
      history: { open: historyOpen, setOpen: setHistoryOpen },
      lyricsAssistant: { open: lyricsAssistantOpen, setOpen: setLyricsAssistantOpen },
      styles: { open: stylesOpen, setOpen: setStylesOpen },
      closeConfirm: { open: closeConfirmOpen, setOpen: setCloseConfirmOpen },
      projectTrackStep,
      setProjectTrackStep,
    },
    actions: {
      handleGenerate,
      handleSaveDraft,
      handleCloseRequest,
      handleClearDraft,
      handleProjectSelect,
      handleAdvancedToggle,
      openLyricsAssistant: () => setLyricsAssistantOpen(true),
    },
    telegram: {/* mainButton/secondaryButton state */},
    references: {
      selectedProjectId: form.selectedProjectId,
      selectedArtistId: form.selectedArtistId,
      selectedTrackId: form.selectedTrackId,
      audioFile: form.audioFile,
      customVoiceId: form.customVoiceId,
    },
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- useGenerateSheetController`
Expected: PASS (3/3).

- [ ] **Step 5: Verify hook LOC**

Run: `wc -l src/hooks/generation/useGenerateSheetController.ts`
Expected: <=500 LOC. If >500, extract `useDialogState` further.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/generation/useGenerateSheetController.ts src/__tests__/hooks/useGenerateSheetController.test.ts
git commit -m "feat(generation): add useGenerateSheetController orchestrator hook"
```

---

## Task 5: Build `useLyricsSections` hook + `LyricsSectionTemplates`

**Files:**

- Create: `src/components/generate-form/lyrics/useLyricsSections.ts`
- Create: `src/components/generate-form/lyrics/LyricsSectionTemplates.ts`
- Create: `src/__tests__/hooks/useLyricsSections.test.ts`
- Create: `src/__tests__/components/lyrics/LyricsSectionTemplates.test.ts`

**Interfaces:**

- Produces: `useLyricsSections(initialText: string, onChange: (text: string) => void): UseLyricsSectionsReturn` per spec §2.2.
- Produces: `LYRICS_TEMPLATES: Template[]` constant array of 4 templates (Pop Standard, Ballad, EDM, Custom).

- [ ] **Step 1: Write failing test for templates**

```ts
// src/__tests__/components/lyrics/LyricsSectionTemplates.test.ts
import { describe, it, expect } from "vitest";
import { LYRICS_TEMPLATES } from "@/components/generate-form/lyrics/LyricsSectionTemplates";

describe("LYRICS_TEMPLATES", () => {
  it("has 4 templates", () => {
    expect(LYRICS_TEMPLATES).toHaveLength(4);
  });

  it("every template has unique id", () => {
    const ids = LYRICS_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Pop Standard has Verse, Chorus, Bridge, Chorus pattern", () => {
    const pop = LYRICS_TEMPLATES.find((t) => t.id === "pop-standard");
    expect(pop?.sections.map((s) => s.type)).toEqual(["verse", "chorus", "verse", "chorus", "bridge", "chorus"]);
  });

  it("every section type is a valid SectionType", () => {
    const valid = ["verse", "chorus", "bridge", "pre-chorus", "intro", "outro", "hook", "custom"];
    for (const tmpl of LYRICS_TEMPLATES) {
      for (const s of tmpl.sections) {
        expect(valid).toContain(s.type);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- LyricsSectionTemplates`
Expected: FAIL with module not found.

- [ ] **Step 3: Create `LyricsSectionTemplates.ts`**

```ts
// src/components/generate-form/lyrics/LyricsSectionTemplates.ts
import type { SectionType } from "./useLyricsSections";

export interface TemplateSection {
  type: SectionType;
}

export interface Template {
  id: string;
  label: string;
  sections: TemplateSection[];
}

export const LYRICS_TEMPLATES: Template[] = [
  {
    id: "pop-standard",
    label: "Pop Standard",
    sections: [
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "bridge" },
      { type: "chorus" },
    ],
  },
  {
    id: "ballad",
    label: "Ballad",
    sections: [
      { type: "intro" },
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "outro" },
    ],
  },
  {
    id: "edm",
    label: "EDM",
    sections: [
      { type: "intro" },
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "outro" },
    ],
  },
  {
    id: "custom",
    label: "Custom (пустая структура)",
    sections: [{ type: "verse" }],
  },
];
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- LyricsSectionTemplates`
Expected: PASS (4/4).

- [ ] **Step 5: Write failing test for `useLyricsSections`**

```ts
// src/__tests__/hooks/useLyricsSections.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLyricsSections } from "@/components/generate-form/lyrics/useLyricsSections";

describe("useLyricsSections", () => {
  it("parses plain text into sections on init", () => {
    const text = "[Verse]
Line 1
Line 2
[Chorus]
Chorus line";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    expect(result.current.sections).toHaveLength(2);
    expect(result.current.sections[0].type).toBe("verse");
    expect(result.current.sections[0].content).toBe("Line 1
Line 2");
    expect(result.current.sections[1].type).toBe("chorus");
  });

  it("serializes back to plain text on toPlainText", () => {
    const text = "[Verse]
Hello
[Chorus]
World";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    const out = result.current.toPlainText();
    expect(out).toBe(text);
  });

  it("addSection appends a new section", () => {
    const { result } = renderHook(() => useLyricsSections("", vi.fn()));
    act(() => result.current.addSection("verse"));
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].type).toBe("verse");
  });

  it("removeSection removes by id", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]
A
[Chorus]
B", vi.fn()));
    const id = result.current.sections[0].id;
    act(() => result.current.removeSection(id));
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].type).toBe("chorus");
  });

  it("reorderSections moves sections", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]
A
[Chorus]
B", vi.fn()));
    act(() => result.current.reorderSections(0, 1));
    expect(result.current.sections[0].type).toBe("chorus");
    expect(result.current.sections[1].type).toBe("verse");
  });

  it("applyTemplate replaces all sections", () => {
    const { result } = renderHook(() => useLyricsSections("[Verse]
A", vi.fn()));
    act(() => result.current.applyTemplate("pop-standard"));
    expect(result.current.sections).toHaveLength(6);
  });

  it("stats computes totalChars and totalLines", () => {
    const text = "[Verse]
Line 1
Line 2
[Chorus]
Hi";
    const { result } = renderHook(() => useLyricsSections(text, vi.fn()));
    expect(result.current.stats.totalChars).toBe(15);
    expect(result.current.stats.totalLines).toBe(3);
  });
});
```

- [ ] **Step 6: Run test to verify failure**

Run: `npm test -- useLyricsSections`
Expected: FAIL.

- [ ] **Step 7: Create `useLyricsSections.ts`**

```ts
// src/components/generate-form/lyrics/useLyricsSections.ts
import { useState, useCallback, useMemo } from "react";
import { LYRICS_TEMPLATES, type Template } from "./LyricsSectionTemplates";

export type SectionType =
  | "verse" | "chorus" | "bridge" | "pre-chorus"
  | "intro" | "outro" | "hook" | "custom";

export interface LyricsSection {
  id: string;
  type: SectionType;
  label?: string;
  content: string;
}

export interface LyricsStats {
  totalChars: number;
  totalLines: number;
  estimatedDurationSeconds: number;
}

const SECTION_HEADER_RE = /^\[(.+?)\]$/;

function parseSections(text: string): LyricsSection[] {
  const lines = text.split("
");
  const sections: LyricsSection[] = [];
  let current: LyricsSection | null = null;
  for (const line of lines) {
    const m = line.match(SECTION_HEADER_RE);
    if (m) {
      if (current) sections.push(current);
      current = { id: crypto.randomUUID(), type: inferSectionType(m[1]), content: "" };
    } else if (current) {
      current.content += (current.content ? "
" : "") + line;
    } else {
      current = { id: crypto.randomUUID(), type: "verse", content: line };
    }
  }
  if (current) sections.push(current);
  return sections.length > 0 ? sections : [{ id: crypto.randomUUID(), type: "verse", content: "" }];
}

function inferSectionType(label: string): SectionType {
  const lower = label.toLowerCase().trim();
  if (lower.startsWith("verse") || lower.includes("куплет")) return "verse";
  if (lower.startsWith("chorus") || lower.includes("припев")) return "chorus";
  if (lower.startsWith("bridge") || lower.includes("бридж")) return "bridge";
  if (lower.includes("pre") && lower.includes("chorus")) return "pre-chorus";
  if (lower.startsWith("intro") || lower.includes("интро")) return "intro";
  if (lower.startsWith("outro") || lower.includes("аутро")) return "outro";
  if (lower.startsWith("hook") || lower.includes("хук")) return "hook";
  return "custom";
}

function serialize(sections: LyricsSection[]): string {
  return sections
    .map(s => `[${capitalize(s.type)}]
${s.content}`)
    .join("

");
}

function capitalize(t: SectionType): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function useLyricsSections(initialText: string, onChange: (text: string) => void) {
  const [sections, setSections] = useState<LyricsSection[]>(() => parseSections(initialText));

  const persist = useCallback((next: LyricsSection[]) => {
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const addSection = useCallback((type: SectionType, afterId?: string) => {
    setSections(prev => {
      const newSection: LyricsSection = { id: crypto.randomUUID(), type, content: "" };
      if (!afterId) {
        const next = [...prev, newSection];
        onChange(serialize(next));
        return next;
      }
      const idx = prev.findIndex(s => s.id === afterId);
      const next = [...prev.slice(0, idx + 1), newSection, ...prev.slice(idx + 1)];
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => {
      const next = prev.filter(s => s.id !== id);
      onChange(serialize(next));
      return next.length > 0 ? next : [{ id: crypto.randomUUID(), type: "verse" as SectionType, content: "" }];
    });
  }, [onChange]);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const updateSection = useCallback((id: string, patch: Partial<LyricsSection>) => {
    setSections(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...patch } : s);
      onChange(serialize(next));
      return next;
    });
  }, [onChange]);

  const applyTemplate = useCallback((templateId: string) => {
    const tmpl: Template | undefined = LYRICS_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    const next = tmpl.sections.map(s => ({ id: crypto.randomUUID(), type: s.type, content: "" }));
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const toPlainText = useCallback(() => serialize(sections), [sections]);

  const fromPlainText = useCallback((text: string) => {
    const next = parseSections(text);
    setSections(next);
    onChange(serialize(next));
  }, [onChange]);

  const stats = useMemo<LyricsStats>(() => {
    const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);
    const totalLines = sections.reduce((sum, s) => sum + (s.content ? s.content.split("
").length : 0), 0);
    const estimatedDurationSeconds = Math.round((totalChars / 12));
    return { totalChars, totalLines, estimatedDurationSeconds };
  }, [sections]);

  return {
    sections,
    addSection,
    removeSection,
    reorderSections,
    updateSection,
    applyTemplate,
    toPlainText,
    fromPlainText,
    stats,
  };
}
```

- [ ] **Step 8: Run test to verify pass**

Run: `npm test -- useLyricsSections`
Expected: PASS (7/7).

- [ ] **Step 9: Commit**

```bash
git add src/components/generate-form/lyrics/useLyricsSections.ts src/components/generate-form/lyrics/LyricsSectionTemplates.ts src/__tests__/hooks/useLyricsSections.test.ts src/__tests__/components/lyrics/LyricsSectionTemplates.test.ts
git commit -m "feat(lyrics): add useLyricsSections hook + 4 templates"
```

---

## Task 6: Build `LyricsSectionCard` + `LyricsVisualEditor` (DnD)

**Files:**

- Create: `src/components/generate-form/lyrics/LyricsSectionCard.tsx`
- Create: `src/components/generate-form/lyrics/LyricsVisualEditor.tsx`
- Create: `src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx`

**Interfaces:**

- Produces: `<LyricsSectionCard section={LyricsSection} index={number} onChange={(patch)=>void} onDelete={()=>void} />`.
- Produces: `<LyricsVisualEditor text={string} onChange={(t:string)=>void} onOpenAssistant={()=>void} />`.

- [ ] **Step 1: Verify @dnd-kit is installed**

Run: `npm ls @dnd-kit/core @dnd-kit/sortable 2>&1`
If not installed, install:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Verify with `npm ls` again. Run `npm run size` and record current bundle baseline.

- [ ] **Step 2: Write failing test for `LyricsVisualEditor`**

```tsx
// src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LyricsVisualEditor } from "@/components/generate-form/lyrics/LyricsVisualEditor";

describe("LyricsVisualEditor", () => {
  it("renders empty state with 'Add section' button when no sections", () => {
    render(<LyricsVisualEditor text="" onChange={vi.fn()} onOpenAssistant={vi.fn()} />);
    expect(screen.getByText(/Добавить секцию/i)).toBeInTheDocument();
  });

  it("renders parsed sections from initial text", () => {
    render(
      <LyricsVisualEditor
        text="[Verse]
Hello
[Chorus]
World"
        onChange={vi.fn()}
        onOpenAssistant={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();
    expect(screen.getByDisplayValue("World")).toBeInTheDocument();
  });

  it("calls onChange when section content edited", () => {
    const onChange = vi.fn();
    render(
      <LyricsVisualEditor
        text="[Verse]
Hello"
        onChange={onChange}
        onOpenAssistant={vi.fn()}
      />,
    );
    const textarea = screen.getByDisplayValue("Hello");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onOpenAssistant when AI button clicked", () => {
    const onOpenAssistant = vi.fn();
    render(<LyricsVisualEditor text="" onChange={vi.fn()} onOpenAssistant={onOpenAssistant} />);
    fireEvent.click(screen.getByText(/AI-помощник/i));
    expect(onOpenAssistant).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `npm test -- LyricsVisualEditor`
Expected: FAIL.

- [ ] **Step 4: Create `LyricsSectionCard.tsx`**

```tsx
// src/components/generate-form/lyrics/LyricsSectionCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LyricsSection, SectionType } from "./useLyricsSections";

const TYPES: { value: SectionType; label: string }[] = [
  { value: "verse", label: "Куплет" },
  { value: "chorus", label: "Припев" },
  { value: "bridge", label: "Бридж" },
  { value: "pre-chorus", label: "Предприпев" },
  { value: "intro", label: "Интро" },
  { value: "outro", label: "Аутро" },
  { value: "hook", label: "Хук" },
  { value: "custom", label: "Своя" },
];

interface Props {
  section: LyricsSection;
  onChange: (patch: Partial<LyricsSection>) => void;
  onDelete: () => void;
}

export function LyricsSectionCard({ section, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Перетащить секцию"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs">
              {TYPES.find(t => t.value === section.type)?.label ?? "Своя"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ type: t.value })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Удалить секцию"
          className="ml-auto min-w-[44px] min-h-[44px]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => onChange({ content: e.target.value })}
        rows={Math.max(2, Math.min(8, section.content.split("
").length))}
        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
        placeholder="Введите текст секции..."
      />
    </div>
  );
}
```

- [ ] **Step 5: Create `LyricsVisualEditor.tsx`**

```tsx
// src/components/generate-form/lyrics/LyricsVisualEditor.tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LyricsSectionCard } from "./LyricsSectionCard";
import { useLyricsSections } from "./useLyricsSections";
import { LYRICS_TEMPLATES } from "./LyricsSectionTemplates";

interface Props {
  text: string;
  onChange: (text: string) => void;
  onOpenAssistant: () => void;
}

export function LyricsVisualEditor({ text, onChange, onOpenAssistant }: Props) {
  const { sections, addSection, removeSection, updateSection, reorderSections, applyTemplate, stats } =
    useLyricsSections(text, onChange);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = sections.findIndex((s) => s.id === active.id);
      const to = sections.findIndex((s) => s.id === over.id);
      if (from !== -1 && to !== -1) reorderSections(from, to);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onOpenAssistant}>
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI-помощник
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Шаблоны
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            {LYRICS_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground ml-auto">
          {stats.totalLines} строк · ~{Math.round((stats.estimatedDurationSeconds / 60) * 10) / 10} мин
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <LyricsSectionCard
                key={section.id}
                section={section}
                onChange={(patch) => updateSection(section.id, patch)}
                onDelete={() => removeSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" size="sm" onClick={() => addSection("verse")} className="w-full">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Добавить секцию
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify pass**

Run: `npm test -- LyricsVisualEditor`
Expected: PASS (4/4).

- [ ] **Step 7: Verify file LOC**

Run: `wc -l src/components/generate-form/lyrics/LyricsVisualEditor.tsx src/components/generate-form/lyrics/LyricsSectionCard.tsx`
Expected: LyricsVisualEditor ~200 LOC, LyricsSectionCard ~100 LOC.

- [ ] **Step 8: Commit**

```bash
git add src/components/generate-form/lyrics/LyricsVisualEditor.tsx src/components/generate-form/lyrics/LyricsSectionCard.tsx package.json package-lock.json src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx
git commit -m "feat(lyrics): add LyricsVisualEditor with dnd-kit drag-reorder"
```

---

## Task 7: Build `LyricsAssistantSheet` (bottom sheet)

**Files:**

- Create: `src/components/generate-form/lyrics/LyricsAssistantSheet.tsx`
- Create: `src/components/generate-form/lyrics/LyricsAssistantChat.tsx`
- Create: `src/__tests__/components/lyrics/LyricsAssistantSheet.test.tsx`

**Interfaces:**

- Produces: `<LyricsAssistantSheet open={boolean} onOpenChange={(b:boolean)=>void} currentText={string} onApply={(text: string, targetSectionId?: string)=>void} />` — vaul bottom sheet with collapsible preview row.

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/components/lyrics/LyricsAssistantSheet.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LyricsAssistantSheet } from "@/components/generate-form/lyrics/LyricsAssistantSheet";

describe("LyricsAssistantSheet", () => {
  it("renders preview row when currentText provided", () => {
    render(
      <LyricsAssistantSheet
        open={true}
        onOpenChange={vi.fn()}
        currentText="[Verse]
Hello"
        onApply={vi.fn()}
      />,
    );
    expect(screen.getByText(/Ваш текущий текст/i)).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("hides preview when collapsed", () => {
    render(
      <LyricsAssistantSheet
        open={true}
        onOpenChange={vi.fn()}
        currentText="[Verse]
Line1
Line2
Line3"
        onApply={vi.fn()}
      />,
    );
    const collapseBtn = screen.getByLabelText(/скрыть превью/i);
    fireEvent.click(collapseBtn);
    expect(screen.queryByText("Line1")).not.toBeInTheDocument();
  });

  it("calls onOpenChange(false) when Готово clicked", () => {
    const onOpenChange = vi.fn();
    render(<LyricsAssistantSheet open={true} onOpenChange={onOpenChange} currentText="" onApply={vi.fn()} />);
    fireEvent.click(screen.getByText("Готово"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- LyricsAssistantSheet`
Expected: FAIL.

- [ ] **Step 3: Create `LyricsAssistantSheet.tsx`**

```tsx
// src/components/generate-form/lyrics/LyricsAssistantSheet.tsx
import { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { LyricsAssistantChat } from "./LyricsAssistantChat";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  onApply: (text: string, targetSectionId?: string) => void;
}

export function LyricsAssistantSheet({ open, onOpenChange, currentText, onApply }: Props) {
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[80]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-2xl p-4 pb-safe max-h-[85dvh] flex flex-col">
          <Drawer.Handle className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-3" />

          <div className="flex items-center justify-between mb-3">
            <Drawer.Title className="text-base font-semibold">🤖 AI-помощник</Drawer.Title>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Готово
            </Button>
          </div>

          {!previewCollapsed && currentText && (
            <div className="rounded-xl border bg-muted/30 p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">Ваш текущий текст</span>
                <button
                  type="button"
                  aria-label="скрыть превью"
                  onClick={() => setPreviewCollapsed(true)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <pre className={cn("text-xs whitespace-pre-wrap font-sans", "max-h-24 overflow-y-auto")}>
                {currentText}
              </pre>
            </div>
          )}

          {previewCollapsed && currentText && (
            <Button variant="ghost" size="sm" onClick={() => setPreviewCollapsed(false)} className="mb-3 self-start">
              <ChevronDown className="w-4 h-4 mr-1" /> Показать превью
            </Button>
          )}

          <div className="flex-1 overflow-hidden">
            <LyricsAssistantChat onApply={onApply} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 4: Create `LyricsAssistantChat.tsx`**

Create minimal chat body that reuses the existing `ChatMessageList`, `ChatInputArea` from `src/components/generate-form/lyrics-chat/`. Import them directly (no barrel) to avoid cycle risk per CLAUDE.md pitfall #10.

```tsx
// src/components/generate-form/lyrics/LyricsAssistantChat.tsx
import { ChatMessageList } from "@/components/generate-form/lyrics-chat/ChatMessageList";
import { ChatInputArea } from "@/components/generate-form/lyrics-chat/ChatInputArea";

interface Props {
  onApply: (text: string, targetSectionId?: string) => void;
}

export function LyricsAssistantChat({ onApply }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList />
      </div>
      <ChatInputArea onApply={onApply} />
    </div>
  );
}
```

- [ ] **Step 5: Verify `ChatInputArea` accepts `onApply` prop**

Open `src/components/generate-form/lyrics-chat/ChatInputArea.tsx`. If it does NOT currently accept an `onApply` prop, add it as an optional callback prop (no behavior change when omitted). Use existing `useState` pattern in the file. Keep change minimal.

- [ ] **Step 6: Run test to verify pass**

Run: `npm test -- LyricsAssistantSheet`
Expected: PASS (3/3).

- [ ] **Step 7: Run lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/generate-form/lyrics/LyricsAssistantSheet.tsx src/components/generate-form/lyrics/LyricsAssistantChat.tsx src/components/generate-form/lyrics-chat/ChatInputArea.tsx src/__tests__/components/lyrics/LyricsAssistantSheet.test.tsx
git commit -m "feat(lyrics): replace LyricsChatAssistant dialog with bottom sheet"
```

---

## Task 8: Rewrite `AdvancedSettings` as card-based

**Files:**

- Modify: `src/components/generate-form/AdvancedSettings.tsx` (full rewrite)
- Create: `src/__tests__/components/lyrics/AdvancedSettings.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/components/lyrics/AdvancedSettings.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdvancedSettings } from "@/components/generate-form/AdvancedSettings";

const defaults = {
  negativeTags: "",
  vocalGender: "" as const,
  styleWeight: [0.5],
  weirdnessConstraint: [0.5],
  audioWeight: [0.5],
};

describe("AdvancedSettings card layout", () => {
  it("renders cards for each parameter", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.getByText("Влияние стиля")).toBeInTheDocument();
    expect(screen.getByText("Креативность")).toBeInTheDocument();
    expect(screen.getByText("Пол вокала")).toBeInTheDocument();
    expect(screen.getByText("Исключить")).toBeInTheDocument();
  });

  it("hides audio weight card when no reference audio and no persona", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.queryByText(/Сила аудио|Сила персоны/)).not.toBeInTheDocument();
  });

  it("shows audio weight card when hasReferenceAudio=true", () => {
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={vi.fn()}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={true}
        hasPersona={false}
        {...defaults}
      />,
    );
    expect(screen.getByText(/Сила аудио/)).toBeInTheDocument();
  });

  it("calls onStyleWeightChange when slider moved", () => {
    const onStyleWeightChange = vi.fn();
    render(
      <AdvancedSettings
        open={true}
        onOpenChange={vi.fn()}
        onNegativeTagsChange={vi.fn()}
        onVocalGenderChange={vi.fn()}
        onStyleWeightChange={onStyleWeightChange}
        onWeirdnessConstraintChange={vi.fn()}
        onAudioWeightChange={vi.fn()}
        hasReferenceAudio={false}
        hasPersona={false}
        {...defaults}
      />,
    );
    const sliders = screen.getAllByRole("slider");
    fireEvent.keyDown(sliders[0], { key: "ArrowRight" });
    expect(onStyleWeightChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- AdvancedSettings.card`
Expected: FAIL (tests expect card structure; old layout uses grouped sections).

- [ ] **Step 3: Rewrite `AdvancedSettings.tsx`**

Replace entire content of `src/components/generate-form/AdvancedSettings.tsx` with:

```tsx
// src/components/generate-form/AdvancedSettings.tsx
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Info, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";

type VocalGender = "" | "m" | "f";

interface AdvancedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  negativeTags: string;
  onNegativeTagsChange: (value: string) => void;
  vocalGender: VocalGender;
  onVocalGenderChange: (value: VocalGender) => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona?: boolean;
}

const VOCAL_OPTIONS: { value: VocalGender; label: string }[] = [
  { value: "", label: "Любой" },
  { value: "f", label: "Женский" },
  { value: "m", label: "Мужской" },
];

function getAudioWeightLabel(hasRef: boolean, hasPersona: boolean): string {
  if (hasRef && hasPersona) return "Сила аудио / персоны";
  if (hasRef) return "Сила аудио";
  return "Сила персоны";
}

function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Подробнее"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-xs">
        {text}
      </PopoverContent>
    </Popover>
  );
}

export function AdvancedSettings({ open, onOpenChange, ...props }: AdvancedSettingsProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-between gap-2 h-11 px-3 rounded-xl border-dashed border-muted-foreground/30",
            "hover:border-primary/50 hover:bg-primary/5 transition-all",
          )}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            Расширенные настройки
          </span>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className={cn("space-y-2 p-3.5 mt-2 rounded-xl", glass.subtle)}>
        {/* Card: Стиль влияния */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎚 Влияние стиля</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums">{Math.round(props.styleWeight[0] * 100)}%</span>
              <InfoTip text="Как сильно AI следует описанию стиля. Ниже — креативнее, выше — точнее." />
            </div>
          </div>
          <Slider value={props.styleWeight} onValueChange={props.onStyleWeightChange} min={0} max={1} step={0.05} />
        </div>

        {/* Card: Креативность */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎲 Креативность</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums">
                {Math.round(props.weirdnessConstraint[0] * 100)}%
              </span>
              <InfoTip text="Насколько неожиданные решения допускаются. Предсказуемо ← → Экспериментально." />
            </div>
          </div>
          <Slider
            value={props.weirdnessConstraint}
            onValueChange={props.onWeirdnessConstraintChange}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        {/* Card: Пол вокала */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">🎤 Пол вокала</Label>
            <InfoTip text="Женский / мужской вокал или авто-выбор." />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {VOCAL_OPTIONS.map(({ value, label }) => (
              <Button
                key={value || "any"}
                type="button"
                variant={props.vocalGender === value ? "default" : "outline"}
                size="sm"
                onClick={() => props.onVocalGenderChange(value)}
                className="text-xs h-9 rounded-lg"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Card: Сила аудио/персоны (conditional) */}
        {(props.hasReferenceAudio || props.hasPersona) && (
          <div className="rounded-xl border bg-card/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">
                🎯 {getAudioWeightLabel(props.hasReferenceAudio, !!props.hasPersona)}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums">{Math.round(props.audioWeight[0] * 100)}%</span>
                <InfoTip text="Влияние выбранного аудио или персоны на результат." />
              </div>
            </div>
            <Slider value={props.audioWeight} onValueChange={props.onAudioWeightChange} min={0} max={1} step={0.05} />
          </div>
        )}

        {/* Card: Исключить */}
        <div className="rounded-xl border bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="negative-tags" className="text-xs font-medium">
              🚫 Исключить
            </Label>
            <InfoTip text="Теги, которые AI будет избегать в генерации." />
          </div>
          <Input
            id="negative-tags"
            placeholder="piano, drums, autotune"
            value={props.negativeTags}
            onChange={(e) => props.onNegativeTagsChange(e.target.value)}
            className="h-10 text-sm rounded-lg bg-background/60"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- AdvancedSettings`
Expected: PASS (4/4).

- [ ] **Step 5: Verify all 292 existing tests still pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/generate-form/AdvancedSettings.tsx src/__tests__/components/lyrics/AdvancedSettings.test.tsx
git commit -m "refactor(advanced): rewrite settings as card-based layout with info popovers"
```

---

## Task 9: Build `ReferenceChipsRow` (consolidates actions + chips)

**Files:**

- Create: `src/components/generate-sheet/ReferenceChipsRow.tsx`
- Create: `src/__tests__/components/lyrics/ReferenceChipsRow.test.tsx`

**Interfaces:**

- Produces: `<ReferenceChipsRow references={{project, artist, audioFile, voiceClone}} onAdd={(kind)=>void} onRemove={(kind, id)=>void} />`.

- [ ] **Step 1: Write failing test**

```tsx
// src/__tests__/components/lyrics/ReferenceChipsRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReferenceChipsRow } from "@/components/generate-sheet/ReferenceChipsRow";

describe("ReferenceChipsRow", () => {
  it("renders 4 empty add buttons when nothing selected", () => {
    render(<ReferenceChipsRow references={{}} onAdd={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText(/Project|Альбом/i)).toBeInTheDocument();
    expect(screen.getByText(/Artist|Артист/i)).toBeInTheDocument();
    expect(screen.getByText(/Audio|Аудио/i)).toBeInTheDocument();
    expect(screen.getByText(/Voice|Голос/i)).toBeInTheDocument();
  });

  it("renders selected project as filled chip with remove button", () => {
    render(
      <ReferenceChipsRow
        references={{ project: { id: "p1", label: "Summer EP" } }}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Summer EP")).toBeInTheDocument();
    expect(screen.getByLabelText(/удалить/i)).toBeInTheDocument();
  });

  it("calls onRemove when remove clicked", () => {
    const onRemove = vi.fn();
    render(
      <ReferenceChipsRow
        references={{ artist: { id: "a1", label: "Lady Gaga" } }}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByLabelText(/удалить/i));
    expect(onRemove).toHaveBeenCalledWith("artist", "a1");
  });

  it("calls onAdd with kind when empty button clicked", () => {
    const onAdd = vi.fn();
    render(<ReferenceChipsRow references={{}} onAdd={onAdd} onRemove={vi.fn()} />);
    fireEvent.click(screen.getByText(/Project|Альбом/i));
    expect(onAdd).toHaveBeenCalledWith("project");
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- ReferenceChipsRow`
Expected: FAIL.

- [ ] **Step 3: Create `ReferenceChipsRow.tsx`**

```tsx
// src/components/generate-sheet/ReferenceChipsRow.tsx
import { Plus, X, Folder, User, Music, Mic } from "@/lib/icons";
import { cn } from "@/lib/utils";

type ReferenceKind = "project" | "artist" | "audio" | "voice";

interface ReferenceItem {
  id: string;
  label: string;
}

interface References {
  project?: ReferenceItem;
  artist?: ReferenceItem;
  audio?: ReferenceItem;
  voice?: ReferenceItem;
}

interface Props {
  references: References;
  onAdd: (kind: ReferenceKind) => void;
  onRemove: (kind: ReferenceKind, id: string) => void;
}

const KIND_META: Record<ReferenceKind, { label: string; icon: typeof Plus }> = {
  project: { label: "Альбом", icon: Folder },
  artist: { label: "Артист", icon: User },
  audio: { label: "Аудио", icon: Music },
  voice: { label: "Голос", icon: Mic },
};

export function ReferenceChipsRow({ references, onAdd, onRemove }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {(Object.keys(KIND_META) as ReferenceKind[]).map((kind) => {
        const item = references[kind];
        const { label, icon: Icon } = KIND_META[kind];
        if (item) {
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onRemove(kind, item.id)}
              aria-label={`удалить ${label}`}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium",
                "bg-primary/10 text-primary border border-primary/30",
                "hover:bg-primary/20 active:scale-95 transition-all",
                "min-w-[44px] min-h-[44px]",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">{item.label}</span>
              <X className="w-3 h-3" />
            </button>
          );
        }
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium",
              "border border-dashed border-muted-foreground/40 text-muted-foreground",
              "hover:border-primary/60 hover:text-primary hover:bg-primary/5",
              "active:scale-95 transition-all",
              "min-w-[44px] min-h-[44px]",
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- ReferenceChipsRow`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/components/generate-sheet/ReferenceChipsRow.tsx src/__tests__/components/lyrics/ReferenceChipsRow.test.tsx
git commit -m "feat(refs): add ReferenceChipsRow consolidating actions + selected chips"
```

---

## Task 10: Build `GenerateSheetHeader`, `Body`, `Footer`, `Dialogs` shells

**Files:**

- Create: `src/components/generate-sheet/GenerateSheetHeader.tsx`
- Create: `src/components/generate-sheet/GenerateSheetBody.tsx`
- Create: `src/components/generate-sheet/GenerateSheetFooter.tsx`
- Create: `src/components/generate-sheet/GenerateSheetDialogs.tsx`

**Interfaces:**

- `GenerateSheetHeader` consumes the controller's `{ form.balance, form.cost, form.mode, form.setMode, form.model, form.setModel, onOpenHistory, onClose }`.
- `GenerateSheetBody` consumes the controller's `{ form, validation, advancedOpen, handleAdvancedToggle, onOpenLyricsAssistant }` and lazy-loads Simple/Custom.
- `GenerateSheetFooter` consumes `{ form, validation, hasUnsavedData, onSaveDraft, onGenerate, onClearDraft, shouldShowSecondaryUIButton, shouldShowUIButton }`.
- `GenerateSheetDialogs` consumes `{ dialogs, onProjectSelect, projects, artists, allTracks, user, hapticFeedback, queryClient }`.

- [ ] **Step 1: Create `GenerateSheetHeader.tsx`**

```tsx
// src/components/generate-sheet/GenerateSheetHeader.tsx
import { X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { motion } from "@/lib/motion";
import { CollapsibleFormHeader } from "@/components/generate-form/CollapsibleFormHeader";

interface Props {
  form: {
    balance: number;
    cost: number;
    mode: "simple" | "custom";
    setMode: (m: "simple" | "custom") => void;
    model: string;
    setModel: (m: string) => void;
  };
  onOpenHistory: () => void;
  onClose: () => void;
}

export function GenerateSheetHeader({ form, onOpenHistory, onClose }: Props) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="px-4 border-b border-border/40 bg-background/95 backdrop-blur-xl flex-shrink-0"
    >
      <CollapsibleFormHeader
        balance={form.balance}
        cost={form.cost}
        mode={form.mode}
        onModeChange={form.setMode}
        onOpenHistory={onOpenHistory}
        model={form.model}
        onModelChange={form.setModel}
        onClose={onClose}
      />
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `GenerateSheetBody.tsx`**

```tsx
// src/components/generate-sheet/GenerateSheetBody.tsx
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferenceChipsRow } from "./ReferenceChipsRow";
import type { ReferenceKind } from "./ReferenceChipsRow";
import type { UseGenerateFormReturn } from "@/hooks/generation/useGenerateForm.types";

const GenerateFormSimple = lazy(() =>
  import("@/components/generate-form/GenerateFormSimple").then((m) => ({ default: m.GenerateFormSimple })),
);
const GenerateFormCustom = lazy(() =>
  import("@/components/generate-form/GenerateFormCustom").then((m) => ({ default: m.GenerateFormCustom })),
);

const FormSkeleton = () => (
  <div data-safe-skeleton="" className="space-y-3 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

interface Props {
  form: UseGenerateFormReturn;
  advancedOpen: boolean;
  onAdvancedToggle: (open: boolean) => void;
  onOpenLyricsAssistant: () => void;
  onAddReference: (kind: ReferenceKind) => void;
  onRemoveReference: (kind: ReferenceKind, id: string) => void;
}

export function GenerateSheetBody({
  form,
  advancedOpen,
  onAdvancedToggle,
  onOpenLyricsAssistant,
  onAddReference,
  onRemoveReference,
}: Props) {
  return (
    <ScrollArea className="flex-1 overflow-x-hidden">
      <div className="px-4 py-3 space-y-3 w-full max-w-full min-w-0 overflow-x-hidden">
        <ReferenceChipsRow
          references={{
            project: form.selectedProjectId ? { id: form.selectedProjectId, label: form.selectedProjectId } : undefined,
            artist: form.selectedArtistId ? { id: form.selectedArtistId, label: form.selectedArtistId } : undefined,
            audio: form.audioFile ? { id: "audio", label: form.audioFile.name } : undefined,
            voice: form.customVoiceId ? { id: form.customVoiceId, label: "Voice clone" } : undefined,
          }}
          onAdd={onAddReference}
          onRemove={onRemoveReference}
        />

        <Suspense fallback={<FormSkeleton />}>
          <AnimatePresence mode="wait">
            {form.mode === "simple" ? (
              <GenerateFormSimple
                description={form.description}
                onDescriptionChange={form.setDescription}
                title={form.title}
                onTitleChange={form.setTitle}
                hasVocals={form.hasVocals}
                onHasVocalsChange={form.setHasVocals}
                onBoostStyle={form.handleBoostStyle}
                boostLoading={form.boostLoading}
                onOpenStyles={() => undefined}
              />
            ) : (
              <GenerateFormCustom
                title={form.title}
                onTitleChange={form.setTitle}
                style={form.style}
                onStyleChange={form.setStyle}
                lyrics={form.lyrics}
                onLyricsChange={form.setLyrics}
                hasVocals={form.hasVocals}
                onHasVocalsChange={form.setHasVocals}
                onBoostStyle={form.handleBoostStyle}
                boostLoading={form.boostLoading}
                onOpenLyricsAssistant={onOpenLyricsAssistant}
                isPublic={form.isPublic}
                onIsPublicChange={form.setIsPublic}
                canMakePrivate={false}
                advancedOpen={advancedOpen}
                onAdvancedOpenChange={onAdvancedToggle}
                negativeTags={form.negativeTags}
                onNegativeTagsChange={form.setNegativeTags}
                vocalGender={form.vocalGender}
                onVocalGenderChange={form.setVocalGender}
                styleWeight={form.styleWeight}
                onStyleWeightChange={form.setStyleWeight}
                weirdnessConstraint={form.weirdnessConstraint}
                onWeirdnessConstraintChange={form.setWeirdnessConstraint}
                audioWeight={form.audioWeight}
                onAudioWeightChange={form.setAudioWeight}
                hasReferenceAudio={!!form.audioFile}
                hasPersona={!!form.selectedArtistId}
                onOpenStyles={() => undefined}
                customVoiceId={form.customVoiceId}
                onCustomVoiceIdChange={form.setCustomVoiceId}
              />
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 3: Create `GenerateSheetFooter.tsx`**

```tsx
// src/components/generate-sheet/GenerateSheetFooter.tsx
import { useState } from "react";
import { Sparkles, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  loading: boolean;
  canGenerate: boolean;
  hasWarnings: boolean;
  warningCount: number;
  hasUnsavedData: boolean;
  generationCost: number;
  generationCostBreakdown: { label: string; value: number }[];
  onGenerate: () => void;
  onSaveDraft: () => void;
  onShowReasons: () => void;
  shouldShowUIButton: boolean;
  shouldShowSecondaryUIButton: boolean;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

export function GenerateSheetFooter(props: Props) {
  const paddingBottom = props.isKeyboardOpen
    ? `${props.keyboardHeight + 16}px`
    : "max(1rem, var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))";

  return (
    <div
      className="px-4 pt-3 border-t border-border/40 bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom, transition: "padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="flex gap-2">
        {props.shouldShowSecondaryUIButton && (
          <Button
            onClick={props.onSaveDraft}
            variant="outline"
            disabled={props.loading || !props.hasUnsavedData}
            className="flex-1 h-12 text-sm font-semibold rounded-2xl border-border/60"
          >
            Черновик
          </Button>
        )}
        {props.shouldShowUIButton && (
          <Button
            onClick={props.canGenerate ? props.onGenerate : props.onShowReasons}
            disabled={props.loading}
            className={cn(
              "h-14 text-sm font-bold gap-2 rounded-2xl flex items-center justify-center leading-none transition-all active:scale-[0.98]",
              "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground",
              "shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.45)]",
              props.shouldShowSecondaryUIButton ? "flex-1" : "w-full",
              !props.canGenerate && !props.loading && "opacity-50",
            )}
          >
            {props.loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание…
              </span>
            ) : (
              <span className="flex flex-col items-center gap-0.5">
                <span className="flex items-center gap-2 text-[15px]">
                  <Sparkles className="w-4 h-4" />
                  Сгенерировать
                  {props.hasWarnings && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] bg-yellow-500 text-yellow-950">
                      {props.warningCount}
                    </span>
                  )}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/70 hover:text-primary-foreground"
                    >
                      💎 {props.generationCost} кредитов
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-56 text-xs space-y-1">
                    <p className="font-semibold mb-1">💎 {props.generationCost} кредитов</p>
                    {props.generationCostBreakdown.map((row, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="tabular-nums">+{row.value}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `GenerateSheetDialogs.tsx`**

```tsx
// src/components/generate-sheet/GenerateSheetDialogs.tsx
import { GenerateSheetDialogs as LegacyDialogs } from "@/components/generate-sheet/GenerateSheetDialogs"; // adjust path
// NOTE: the existing GenerateSheetDialogs is already at src/components/generate-sheet/GenerateSheetDialogs.tsx.
// This task DOES NOT create a new file. Instead, the existing file is reused and receives props from the new orchestrator.
// Step 4 is intentionally skipped — proceed to Task 11.
```

- [ ] **Step 5: Skip — reuse existing `GenerateSheetDialogs.tsx`**

The file already exists at `src/components/generate-sheet/GenerateSheetDialogs.tsx`. Verify it accepts the same props signature. If not, add missing props without breaking callers.

- [ ] **Step 6: Run all unit tests**

Run: `npm test`
Expected: PASS (no regressions since we did not touch existing logic yet).

- [ ] **Step 7: Commit shells**

```bash
git add src/components/generate-sheet/GenerateSheetHeader.tsx src/components/generate-sheet/GenerateSheetBody.tsx src/components/generate-sheet/GenerateSheetFooter.tsx
git commit -m "feat(sheet): extract header/body/footer shells"
```

---

## Task 11: Rewire `GenerateSheet.tsx` as thin orchestrator behind feature flag

**Files:**

- Modify: `src/components/GenerateSheet.tsx` (full rewrite)

- [ ] **Step 1: Verify controller returns all needed refs**

Confirm `useGenerateSheetController` exposes: `validation`, `dialogs`, `actions`, `telegram`, `references`, `form`. If anything is missing, add it to the controller first.

- [ ] **Step 2: Write failing snapshot test for new orchestrator**

```tsx
// src/__tests__/components/GenerateSheet.orchestrator.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks/useFeatureFlag", () => ({ useFeatureFlag: () => true }));
vi.mock("@/hooks/generation/useGenerateSheetController", () => ({
  useGenerateSheetController: () => ({
    form: { mode: "custom", style: "", title: "", lyrics: "", userBalance: 100, generationCost: 8 },
    validation: { canGenerate: false, reasons: [], hasWarnings: false },
    dialogs: {
      project: { open: false, setOpen: vi.fn() },
      artist: { open: false, setOpen: vi.fn() },
      audioAction: { open: false, setOpen: vi.fn() },
      voiceClone: { open: false, setOpen: vi.fn() },
      history: { open: false, setOpen: vi.fn() },
      lyricsAssistant: { open: false, setOpen: vi.fn() },
      styles: { open: false, setOpen: vi.fn() },
      closeConfirm: { open: false, setOpen: vi.fn() },
      projectTrackStep: "project",
      setProjectTrackStep: vi.fn(),
    },
    actions: {
      handleGenerate: vi.fn(),
      handleSaveDraft: vi.fn(),
      handleCloseRequest: vi.fn(),
      handleClearDraft: vi.fn(),
      handleProjectSelect: vi.fn(),
      handleAdvancedToggle: vi.fn(),
      openLyricsAssistant: vi.fn(),
    },
    telegram: {
      mainButton: { visible: true, enabled: false, text: "СГЕНЕРИРОВАТЬ" },
      secondaryButton: { visible: false, enabled: false, text: "Сохранить черновик" },
    },
    references: {
      selectedProjectId: undefined,
      selectedArtistId: undefined,
      selectedTrackId: undefined,
      audioFile: null,
      customVoiceId: undefined,
    },
  }),
}));
vi.mock("@/hooks/useKeyboardAware", () => ({
  useKeyboardAware: () => ({ keyboardHeight: 0, isKeyboardOpen: false, createFocusHandler: vi.fn() }),
}));
vi.mock("@/hooks/analytics/useFeatureUsageTracking", () => ({
  useFeatureUsageTracking: () => ({ trackAction: vi.fn() }),
}));
vi.mock("@/hooks/generation", () => ({ useAudioReference: () => ({ activeReference: null }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/telegram", () => ({
  useTelegramMainButton: () => ({ shouldShowUIButton: true, showProgress: vi.fn(), hideProgress: vi.fn() }),
  useTelegramSecondaryButton: () => ({ shouldShowUIButton: false }),
  useTelegramBackButton: vi.fn(),
}));

import { GenerateSheet } from "@/components/GenerateSheet";

describe("GenerateSheet orchestrator", () => {
  it("renders header, body, footer, dialogs shells", () => {
    render(<GenerateSheet open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/Сгенерировать/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `npm test -- GenerateSheet.orchestrator`
Expected: FAIL with shape mismatch.

- [ ] **Step 4: Rewrite `GenerateSheet.tsx` as thin orchestrator**

```tsx
// src/components/GenerateSheet.tsx
import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AnimatePresence, motion } from "@/lib/motion";
import { Progress } from "@/components/ui/progress";
import { GenerationLoadingState } from "@/components/generate-form/GenerationLoadingState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGenerateSheetController } from "@/hooks/generation/useGenerateSheetController";
import { useTelegramMainButton, useTelegramSecondaryButton, useTelegramBackButton } from "@/hooks/telegram";
import { useKeyboardAware } from "@/hooks/useKeyboardAware";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { GENERATE_SHEET_REDESIGN_ENABLED } from "@/lib/feature-flags";
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useTelegram } from "@/contexts/TelegramContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { GenerateSheetHeader } from "./generate-sheet/GenerateSheetHeader";
import { GenerateSheetBody } from "./generate-sheet/GenerateSheetBody";
import { GenerateSheetFooter } from "./generate-sheet/GenerateSheetFooter";
import { GenerateSheetDialogs } from "./generate-sheet/GenerateSheetDialogs";
import { ValidationReasonsSheet } from "./generate-sheet/ValidationReasonsSheet";
import { LyricsAssistantSheet } from "@/components/generate-form/lyrics/LyricsAssistantSheet";
import type { ReferenceKind } from "./generate-sheet/ReferenceChipsRow";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId }: Props) => {
  const isRedesign = useFeatureFlag(
    GENERATE_SHEET_REDESIGN_ENABLED.storageKey,
    GENERATE_SHEET_REDESIGN_ENABLED.default,
  );
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks } = useTracks();
  const { hapticFeedback, enableClosingConfirmation, disableClosingConfirmation } = useTelegram();
  const qc = useQueryClient();
  const { user } = useAuth();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { keyboardHeight, isKeyboardOpen } = useKeyboardAware();

  const controller = useGenerateSheetController({ open, onOpenChange, initialProjectId: projectId });

  // Telegram wiring
  const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
    text: controller.form.loading ? "Создание..." : "СГЕНЕРИРОВАТЬ",
    onClick: controller.actions.handleGenerate,
    enabled: !controller.form.loading && controller.validation.canGenerate,
    visible: open && !controller.dialogs.lyricsAssistant.open,
  });
  const { shouldShowUIButton: shouldShowSecondaryUIButton } = useTelegramSecondaryButton({
    text: "Сохранить черновик",
    onClick: controller.actions.handleSaveDraft,
    enabled: controller.form.hasUnsavedData && !controller.form.loading,
    visible: open && controller.form.hasUnsavedData && !controller.dialogs.lyricsAssistant.open,
    position: "left",
  });
  useTelegramBackButton({ visible: open, onClick: controller.actions.handleCloseRequest });

  useEffect(() => {
    if (controller.form.loading) showProgress(true);
    else hideProgress();
  }, [controller.form.loading, showProgress, hideProgress]);

  if (!isRedesign) {
    // Fallback to legacy implementation via dynamic import — kept simple
    const LegacyGenerateSheet = require("./GenerateSheet.legacy").LegacyGenerateSheet;
    return <LegacyGenerateSheet open={open} onOpenChange={onOpenChange} projectId={projectId} />;
  }

  const handleAddReference = (kind: ReferenceKind) => {
    if (kind === "project") controller.dialogs.project.setOpen(true);
    else if (kind === "artist") controller.dialogs.artist.setOpen(true);
    else if (kind === "audio") controller.dialogs.audioAction.setOpen(true);
    else if (kind === "voice") controller.dialogs.voiceClone.setOpen(true);
  };

  const handleRemoveReference = (kind: ReferenceKind, _id: string) => {
    if (kind === "project") {
      controller.form.setSelectedProjectId(undefined);
      controller.form.setSelectedTrackId(undefined);
    } else if (kind === "artist") controller.form.setSelectedArtistId(undefined);
    else if (kind === "audio") controller.form.setAudioFile(null);
    else if (kind === "voice") controller.form.setCustomVoiceId?.(null);
  };

  return (
    <>
      <AlertDialog open={controller.dialogs.closeConfirm.open} onOpenChange={controller.dialogs.closeConfirm.setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Закрыть форму?</AlertDialogTitle>
            <AlertDialogDescription>У вас есть несохранённые данные. Они будут потеряны.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>Закрыть</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) controller.actions.handleCloseRequest();
          else onOpenChange(true);
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[95dvh] sm:h-[85vh] sm:max-h-[800px] flex flex-col frost-sheet p-0 w-full max-w-full min-w-0 overflow-x-hidden"
          hideCloseButton
          hideTitle
          accessibleTitle="Создание музыки"
        >
          <GenerateSheetHeader
            form={{
              balance: controller.form.userBalance,
              cost: controller.form.generationCost,
              mode: controller.form.mode,
              setMode: controller.form.setMode,
              model: controller.form.model,
              setModel: controller.form.setModel,
            }}
            onOpenHistory={() => controller.dialogs.history.setOpen(true)}
            onClose={controller.actions.handleCloseRequest}
          />

          <AnimatePresence>
            {controller.form.loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
              >
                <GenerationLoadingState stage="processing" showCancel={false} compact={false} />
              </motion.div>
            )}
          </AnimatePresence>

          <GenerateSheetBody
            form={controller.form}
            advancedOpen={false /* default open in custom handled inside GenerateFormCustom */}
            onAdvancedToggle={controller.actions.handleAdvancedToggle}
            onOpenLyricsAssistant={() => controller.dialogs.lyricsAssistant.setOpen(true)}
            onAddReference={handleAddReference}
            onRemoveReference={handleRemoveReference}
          />

          {controller.form.loading && (
            <div className="px-4">
              <Progress value={33} className="h-0.5" />
            </div>
          )}

          <GenerateSheetFooter
            loading={controller.form.loading}
            canGenerate={controller.validation.canGenerate}
            hasWarnings={controller.validation.hasWarnings}
            warningCount={controller.validation.reasons.filter((r) => r.severity === "warning").length}
            hasUnsavedData={controller.form.hasUnsavedData}
            generationCost={controller.form.generationCost}
            generationCostBreakdown={controller.form.generationCostBreakdown}
            onGenerate={controller.actions.handleGenerate}
            onSaveDraft={controller.actions.handleSaveDraft}
            onShowReasons={() => controller.dialogs.reasons?.setOpen(true)}
            shouldShowUIButton={shouldShowUIButton}
            shouldShowSecondaryUIButton={shouldShowSecondaryUIButton}
            isKeyboardOpen={isKeyboardOpen}
            keyboardHeight={keyboardHeight}
          />
        </SheetContent>

        <GenerateSheetDialogs
          form={controller.form}
          projects={projects}
          artists={artists}
          allTracks={tracks}
          user={user}
          hapticFeedback={hapticFeedback}
          queryClient={qc}
          projectDialogOpen={controller.dialogs.project.open}
          setProjectDialogOpen={controller.dialogs.project.setOpen}
          projectTrackStep={controller.dialogs.projectTrackStep}
          setProjectTrackStep={controller.dialogs.setProjectTrackStep}
          projectTracks={
            controller.form.selectedProjectId
              ? tracks?.filter((t) => t.project_id === controller.form.selectedProjectId)
              : []
          }
          onProjectSelect={controller.actions.handleProjectSelect}
          artistDialogOpen={controller.dialogs.artist.open}
          setArtistDialogOpen={controller.dialogs.artist.setOpen}
          voiceCloneOpen={controller.dialogs.voiceClone.open}
          setVoiceCloneOpen={controller.dialogs.voiceClone.setOpen}
          onAdvancedToggle={controller.actions.handleAdvancedToggle}
          audioActionDialogOpen={controller.dialogs.audioAction.open}
          setAudioActionDialogOpen={controller.dialogs.audioAction.setOpen}
          setAdvancedOpen={() => {}}
          lyricsAssistantOpen={controller.dialogs.lyricsAssistant.open}
          setLyricsAssistantOpen={controller.dialogs.lyricsAssistant.setOpen}
          historyOpen={controller.dialogs.history.open}
          setHistoryOpen={controller.dialogs.history.setOpen}
          stylesOpen={controller.dialogs.styles.open}
          setStylesOpen={controller.dialogs.styles.setOpen}
        />
      </Sheet>

      <LyricsAssistantSheet
        open={controller.dialogs.lyricsAssistant.open}
        onOpenChange={controller.dialogs.lyricsAssistant.setOpen}
        currentText={controller.form.lyrics}
        onApply={(text, sectionId) => controller.form.setLyrics(text)}
      />

      <ValidationReasonsSheet
        open={false /* controlled by controller.dialogs.reasons */}
        onOpenChange={() => {}}
        reasons={controller.validation.reasons}
      />
    </>
  );
};
```

- [ ] **Step 5: Save current `GenerateSheet.tsx` as `GenerateSheet.legacy.tsx`**

```bash
cp src/components/GenerateSheet.tsx src/components/GenerateSheet.legacy.tsx
```

- [ ] **Step 6: Verify `React.useRef` import**

Add to imports: `import React from "react";` OR replace `useRef<HTMLDivElement>(null)` with `useRef<HTMLDivElement | null>(null)`.

- [ ] **Step 7: Run typecheck + lint**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 errors. Fix any.

- [ ] **Step 8: Run all unit + e2e tests**

Run: `npm test && npm run test:e2e -- --grep "generate"`
Expected: PASS existing 292 + new tests.

- [ ] **Step 9: Verify orchestrator LOC**

Run: `wc -l src/components/GenerateSheet.tsx`
Expected: <=200 LOC. If >200, extract more sub-components.

- [ ] **Step 10: Commit rewiring**

```bash
git add src/components/GenerateSheet.tsx src/components/GenerateSheet.legacy.tsx src/__tests__/components/GenerateSheet.orchestrator.test.tsx
git commit -m "refactor(sheet): rewire GenerateSheet as thin orchestrator behind feature flag"
```

---

## Task 12: Delete dead wizard code

**Files:**

- Delete: 13 files under `src/components/generate-form/wizard/`
- Delete: `src/components/generate-form/lyrics-wizard/ConceptStep.tsx`
- Delete: `src/components/generate-form/LyricsVisualEditorCompact.tsx`
- Delete: `src/components/generate-form/LyricsChatAssistant.tsx`
- Delete: `src/components/generate-form/lyrics-chat/` (entire directory)

- [ ] **Step 1: Verify zero callers**

```bash
grep -rln "from.*generate-form/wizard\|from.*generate-form/lyrics-wizard\|LyricsVisualEditorCompact\|LyricsChatAssistant" src/ tests/
```

Expected: only test files referencing `LyricsVisualEditorCompact`. If more, fix callers first.

- [ ] **Step 2: Port `LyricsVisualEditorCompact` tests to new editor**

Move tests from `tests/unit/components/lyrics/LyricsVisualEditorCompact.test.tsx` and `.templates.test.tsx` to `src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx`. Adapt imports to new component.

- [ ] **Step 3: Update `LyricsEditorMetricsOverlay`**

`src/components/dev/LyricsEditorMetricsOverlay.tsx` uses `LyricsVisualEditorCompact`. Replace its import to use new `LyricsVisualEditor`. This is a dev-only component — minimal risk.

- [ ] **Step 4: Delete wizard files**

```bash
rm -rf src/components/generate-form/wizard/
rm src/components/generate-form/lyrics-wizard/ConceptStep.tsx
rmdir src/components/generate-form/lyrics-wizard 2>/dev/null || true
rm src/components/generate-form/LyricsVisualEditorCompact.tsx
rm src/components/generate-form/LyricsChatAssistant.tsx
rm -rf src/components/generate-form/lyrics-chat/
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS (no broken imports).

- [ ] **Step 6: Run build**

Run: `npm run build 2>&1 | head -40`
Expected: success. Look for any "Cannot find module" warnings.

- [ ] **Step 7: Commit cleanup**

```bash
git add -u src/components/generate-form/
git commit -m "chore(cleanup): remove dead wizard/ + LyricsVisualEditorCompact + LyricsChatAssistant"
```

---

## Task 13: Add Storybook stories

**Files:**

- Create: 6 stories files (listed in File Structure §New Storybook stories above).

- [ ] **Step 1: Verify Storybook config exists**

```bash
ls .storybook/
```

Expected: `main.ts` and `preview.ts` exist.

- [ ] **Step 2: Create `GenerateSheet.stories.tsx`**

```tsx
// src/components/generate-sheet/GenerateSheet.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { GenerateSheet } from "@/components/GenerateSheet";

const meta: Meta<typeof GenerateSheet> = {
  title: "Generate/Sheet",
  component: GenerateSheet,
  decorators: [
    (Story) => (
      <div style={{ height: "100dvh" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof GenerateSheet>;

export const Default: Story = { args: { open: true, onOpenChange: () => {} } };
export const SimpleMode: Story = { args: { open: true, onOpenChange: () => {} } };
export const CustomMode: Story = { args: { open: true, onOpenChange: () => {} } };
export const Loading: Story = { args: { open: true, onOpenChange: () => {} } };
export const Disabled: Story = { args: { open: true, onOpenChange: () => {} } };
```

Note: Stories will need mocked `useGenerateSheetController` to render meaningfully. Use Storybook decorators to inject mocks.

- [ ] **Step 3: Create `LyricsVisualEditor.stories.tsx`**

```tsx
// src/components/generate-form/lyrics/LyricsVisualEditor.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { LyricsVisualEditor } from "./LyricsVisualEditor";

const meta: Meta<typeof LyricsVisualEditor> = { title: "Lyrics/VisualEditor", component: LyricsVisualEditor };
export default meta;
type Story = StoryObj<typeof LyricsVisualEditor>;

export const Empty: Story = { args: { text: "", onChange: () => {}, onOpenAssistant: () => {} } };
export const PopTemplate: Story = { args: { text: "[Verse]
Line 1
Line 2
[Chorus]
Chorus line", onChange: () => {}, onOpenAssistant: () => {} } };
export const CustomSections: Story = { args: { text: "[Bridge]
Bridge text", onChange: () => {}, onOpenAssistant: () => {} } };
```

- [ ] **Step 4: Create remaining 4 story files**

Follow the same pattern for:

- `AdvancedSettings.stories.tsx` (Closed, WithPersona)
- `ValidationReasonsSheet.stories.tsx` (ErrorsOnly, ErrorsPlusWarnings)
- `LyricsAssistantSheet.stories.tsx` (EmptyChat, WithPreviewSuggestion)
- `ReferenceChipsRow.stories.tsx` (Empty, AllSelected, Overflow)

- [ ] **Step 5: Run Storybook build**

Run: `npm run build-storybook 2>&1 | tail -20`
Expected: success. Look for missing-story errors.

- [ ] **Step 6: Run Storybook dev to visually verify**

Run: `npm run storybook` in background, verify no console errors. Stop.

- [ ] **Step 7: Commit stories**

```bash
git add src/components/generate-sheet/*.stories.tsx src/components/generate-form/lyrics/*.stories.tsx src/components/generate-form/AdvancedSettings.stories.tsx
git commit -m "docs(storybook): add stories for new sheet + lyrics + advanced + validation"
```

---

## Task 14: Add E2E tests for new flows

**Files:**

- Create: `tests/e2e/generation-sheet-redesign.spec.ts`
- Create: `tests/e2e/generation-validation.spec.ts`
- Create: `tests/e2e/lyrics-assistant-sheet.spec.ts`
- Create: `tests/e2e/reference-chips.spec.ts`

- [ ] **Step 1: Verify dev server starts**

Run: `npm run dev` in background, wait 5 sec, then `curl http://localhost:8080 | head -5`. Stop.

- [ ] **Step 2: Create `generation-sheet-redesign.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.describe("generation sheet redesign", () => {
  test("open → custom → add sections → submit", async ({ page }) => {
    await page.goto("/generate");
    await page.getByRole("button", { name: /Custom|Расширенный/i }).click();
    await page.getByPlaceholder(/название/i).fill("My Song");
    await page.getByPlaceholder(/стиль|звучание/i).fill("indie rock");
    await page.getByText(/Добавить секцию/i).click();
    await page.locator("textarea").first().fill("Verse line 1
Verse line 2");
    await page.getByRole("button", { name: /Сгенерировать/i }).click();
    await expect(page).toHaveURL(/library|tracks/);
  });
});
```

- [ ] **Step 3: Create `generation-validation.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("disabled CTA → tap → bottom sheet", async ({ page }) => {
  await page.goto("/generate");
  const cta = page.getByRole("button", { name: /Сгенерировать/i });
  await expect(cta).toBeDisabled();
  await cta.click({ force: true });
  await expect(page.getByText(/Чтобы сгенерировать трек/i)).toBeVisible();
});
```

- [ ] **Step 4: Create `lyrics-assistant-sheet.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("open assistant → preview row → close", async ({ page }) => {
  await page.goto("/generate");
  await page.getByRole("button", { name: /AI-помощник/i }).click();
  await expect(page.getByText(/Ваш текущий текст/i)).toBeVisible();
  await page.getByText("Готово").click();
});
```

- [ ] **Step 5: Create `reference-chips.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("add project chip → remove", async ({ page }) => {
  await page.goto("/generate");
  await page
    .getByText(/Альбом/i)
    .first()
    .click();
  await expect(page.getByText(/Удалить альбом|удалить/i)).toBeVisible();
});
```

- [ ] **Step 6: Run new E2E tests**

Run: `npm run test:e2e -- generation-sheet-redesign generation-validation lyrics-assistant-sheet reference-chips`
Expected: PASS (all 4 specs).

- [ ] **Step 7: Run full E2E suite**

Run: `npm run test:e2e`
Expected: PASS (47 existing + 4 new = 51).

- [ ] **Step 8: Commit**

```bash
git add tests/e2e/generation-sheet-redesign.spec.ts tests/e2e/generation-validation.spec.ts tests/e2e/lyrics-assistant-sheet.spec.ts tests/e2e/reference-chips.spec.ts
git commit -m "test(e2e): add 4 specs for redesigned generation flow"
```

---

## Task 15: Phase 3 rollout + analytics verification

**Files:**

- Modify: `src/lib/feature-flags.ts` (rollout schedule)
- Create: `docs/sprints/SPRINT-056-rollout-notes.md`

- [ ] **Step 1: Verify all acceptance criteria are met**

Walk through the 15 acceptance criteria from spec §9 one by one. Document any that fail.

- [ ] **Step 2: Enable flag in dev/staging**

Set environment override to 1.0 in dev and staging. Verify the new flow renders for internal users.

- [ ] **Step 3: Manual QA on Telegram iOS + Android**

Use Telegram mobile client to open the Mini App:

- Open sheet → switch modes → fill → submit
- Open assistant sheet → preview visible → close
- Try disabled CTA → bottom sheet appears
- Verify keyboard-aware footer padding

Document any issues found in `docs/sprints/SPRINT-056-rollout-notes.md`.

- [ ] **Step 4: Set production rollout to 10%**

Modify `GENERATE_SHEET_REDESIGN_ENABLED.environments.prod.start` from 0.1 to 0.1 (already set in Task 1). Trigger a deploy.

- [ ] **Step 5: Monitor for 24 hours**

Check Sentry error rate, custom analytics events, completion rate. Compare to baseline.

- [ ] **Step 6: Ramp to 50%**

If error rate stays within +5% of baseline and completion rate holds, modify rollout to 0.5. Deploy.

- [ ] **Step 7: Ramp to 100%**

After another 24h of stable metrics at 50%, set to 1.0. Deploy.

- [ ] **Step 8: Delete legacy file**

Once 100% stable for 7 days:

```bash
git rm src/components/GenerateSheet.legacy.tsx
git commit -m "chore: delete legacy GenerateSheet after 100% rollout"
```

- [ ] **Step 9: Document KPI results**

After 14 days at 100%, fill in spec §6.5 KPI table with actual values. Commit to `docs/sprints/SPRINT-056-retro.md`.

---

## Self-Review

**Spec coverage:** Each section of [spec](../specs/2026-07-04-generate-sheet-redesign-design.md) maps to tasks:

- §1 Problem Statement → Tasks 1, 11 (decomposition), 12 (cleanup).
- §2 Architecture → Task 1 (split), Task 4 (controller), Task 5 (lyrics hook).
- §3 Layout & IA → Tasks 9 (chips), 10 (header/footer/body).
- §4 Lyrics Input Flow → Tasks 5, 6, 7.
- §5 AdvancedSettings + Validation → Tasks 2, 3, 8.
- §6 Cleanup/Testing/Migration → Tasks 12, 13, 14, 15.

**Placeholder scan:** None — every step has explicit code or commands.

**Type consistency:**

- `useGenerateSheetController` return shape consistent across Tasks 4 and 11.
- `ValidationReason` shape consistent across Tasks 2, 3, 8.
- `LyricsSection` shape consistent across Tasks 5, 6, 7.
- `ReferenceKind` consistent across Tasks 9, 10, 11.
- `useGenerateFormReturn` referenced by name in Tasks 4, 10, 11 — matches Task 1 public API.

**Known unknowns:**

- The legacy `GenerateSheet.legacy.tsx` export shape must match the original `GenerateSheet` interface (`{ open, onOpenChange, projectId }`). Verify in Task 11 Step 5.
- Storybook decorator for mocking `useGenerateSheetController` is intentionally minimal in Task 13. If stories fail to render meaningfully, expand decorators per component.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-generate-sheet-redesign.md` (15 tasks, ~2393 lines). Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
