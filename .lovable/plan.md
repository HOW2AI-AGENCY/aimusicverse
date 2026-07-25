# Unified Generation Form — Refactor Plan

## Why this needs to happen

The generation form works, but it has grown three parallel implementations. Right now the same feature can be reached through **five different code paths** and rendered by **two different sheets** with **three different lyrics editors**. That is why bugs like "Стили dead in redesign", "черновик сохранён" spam, and mobile layout drift keep coming back — every fix has to be applied twice or three times, and inevitably one copy gets missed.

Goal: **one canonical form, one entry-point contract, one lyrics editor, one visual language** — so the next change touches exactly one place.

---

## What will change

### 1. Retire the legacy sheet
- Confirm the redesign flag (`GENERATE_SHEET_REDESIGN_ENABLED`) is at 100% rollout.
- Delete `GenerateSheet.legacy.tsx` (537 lines) and the flag switch in `GenerateSheet.tsx`.
- `GenerateSheet.tsx` becomes a thin default export of the redesign path.

### 2. Collapse the desktop sidebar's private form into the canonical sheet
- `DesktopLibrarySidebar.tsx` currently mounts its own `useGenerateForm()` + `GenerateFormSimple`/`GenerateFormCustom` + its own dialogs — a shadow copy of the sheet.
- Replace with a **single "Открыть генератор"** button that calls `dispatchOpenGenerateSheet()`.
- Removes ~200 lines of divergent UI and eliminates the second dialog stack.

### 3. Standardize every entry point on `dispatchOpenGenerateSheet()`
- Fix `CreativePresetsSection.tsx:88-89` (raw `window.dispatchEvent`) to use the helper.
- Audit and unify: `BottomNavigation`, `Sidebar`, `HomeStickyCTA`, `KeyboardShortcutsProvider`, `OnboardingFlow`, `Templates`, Telegram deep link, `TrackDetailSheet` — one helper, one payload shape (optional `initialMode`, `initialReference`, `initialTemplate`).

### 4. Deduplicate the lyrics editor
- Canonical stays: `sections/LyricsSectionAdvanced.tsx` → `LyricsVisualEditorCompact.tsx` → `lyrics-editor/SectionCard.tsx` + `ActionButton.tsx` + `lyricsEditorHelpers.ts`.
- Delete: `generate-form/lyrics/LyricsVisualEditor.tsx`, `generate-form/lyrics/SectionCard.tsx`, `generate-form/lyrics/ActionButton.tsx`, `generate-form/lyrics/lyricsEditorHelpers.ts`, `generate-form/LyricsVisualEditor.tsx` (top-level 627-line copy).
- Move the associated Storybook story and test to import from the canonical path.
- Result: one editor, one helpers module, one place to fix bugs.

### 5. Merge the two lyrics-assistant surfaces
- Keep `lyrics/LyricsAssistantSheet.tsx` (already wired from the canonical sheet).
- Fold the useful bits of top-level `LyricsChatAssistant.tsx` (623 lines) into the assistant sheet, delete the standalone file. The lyrics editor gets **one** AI entry point.

### 6. Merge the two Studio dialog wirings
- Determine which of `StudioShell/StudioDialogs.tsx` vs `StudioShellDialogs.tsx` is actually rendered; delete the other. Both wire the same `LazyGenerateSheet`/`LazyAddVocalsDrawer` — this is pure duplication.

### 7. Fix prop-drilling: one form object, one convention
- `GenerateFormCustom.tsx` currently takes 25+ individual props. Migrate it (and `GenerateFormSimple.tsx`) to accept the whole `form: UseGenerateFormReturn` object, matching `GenerateSheetBody.tsx`'s convention.
- Reduces the surface for prop-drift bugs (this is exactly the class of bug that hid the "Стили dead" regression).

### 8. One design system for the form
- Extract shared visual primitives from `sections/` (TitleSection, StyleSection, VocalsToggle, PrivacyToggle) into a small `generate-form/primitives/` set: `FormField`, `FormRow`, `SegmentedToggle`, `NumericChip`.
- Every section becomes: label above, control below, helper text under, error state, 44px touch targets. One card padding scale, one border-radius scale, one gap scale — pulled from existing `design-tokens.ts` / `design-spacing.ts`.
- Applies to both simple and custom modes so switching modes doesn't feel like changing apps.

### 9. Tag composer consolidation
- Fold `SectionTagSelector.tsx` (401 lines) and `TagBuilderPanel.tsx` (327 lines) responsibilities into one `TagBuilder` component with two entry modes (section-scoped, global). Same UI grammar as the modifier popover already shipped in `SectionCard.tsx`.

### 10. Remove deprecated hooks
- Delete `useAddInstrumentalProgress.ts`, `useAddVocalsProgress.ts`, `useExtendProgress.ts` — all explicitly `@deprecated` and superseded by `useAudioProcessing()`. Update the 2-3 call sites still on the old hooks.

### 11. Tests + docs, then flag off
- Snapshot test for each entry point → verify it opens the canonical sheet with the right initial state.
- Contract test on the submit path (already covered by classification tests, extend to cover cover/extend/upload-extend branches).
- Short `docs/GENERATE_FORM.md` diagram: entry points → sheet → controller → form hooks → submit → edge functions. One page. Kept next to the code so it stays current.

## What will NOT change

- Suno edge functions (`suno-music-generate`, `suno-generate`, `suno-upload-extend`) — untouched. This is a frontend consolidation.
- Generation cost/credit logic — untouched (still routes through `useGenerateFormValidation` / `secure_credit_update`).
- Modes stay `simple` and `custom` — no wizard resurrection.
- Draft autosave semantics unchanged (only the toast noise, already fixed).
- Extend/cover/add-vocals/stems flows outside the form (Studio, TrackDetailSheet) keep their existing entry points; only the sheet they open is unified.

## Sequencing

Ordered so each step lands independently and can be reverted without breaking the next:

```text
Phase 1 — Safe cleanup (no user-visible change)
  1.  Delete duplicate lyrics editor directory (§4)
  2.  Merge Studio dialog wirings (§6)
  3.  Delete deprecated progress hooks (§10)
  4.  Standardize entry points on dispatchOpenGenerateSheet (§3)

Phase 2 — Structural
  5.  Fix prop-drilling: pass form object (§7)
  6.  Extract primitives, apply consistently (§8)
  7.  Consolidate tag composer (§9)

Phase 3 — De-duplication of code paths
  8.  Collapse DesktopLibrarySidebar to a launcher (§2)
  9.  Merge lyrics-assistant surfaces (§5)
  10. Retire GenerateSheet.legacy + flag (§1)

Phase 4 — Verify + document
  11. Add entry-point snapshot tests, submit contract tests, docs/GENERATE_FORM.md (§11)
```

## Technical details

- **Entry-point contract** (`src/lib/events.ts`) gets a typed payload:
  ```ts
  type OpenGenerateSheetPayload = {
    initialMode?: 'simple' | 'custom';
    initialReference?: ActiveReference;
    initialTemplate?: GenerationTemplate;
    initialProjectId?: string;
    initialTrackId?: string;
  };
  ```
  All entry points import a typed helper; raw `window.dispatchEvent` is banned via ESLint rule.
- **Form object contract**: `UseGenerateFormReturn` becomes the single prop shape. Sections pluck what they need via destructuring inside the component, not from parent props.
- **Design primitives**: `FormField` = label + control + helper + error; `SegmentedToggle` replaces the ad-hoc mode switch in `GenerateSheetHeader`; both use tokens from `src/lib/design-tokens.ts`.
- **File deletions** (net): ~2200 lines of duplicated/legacy code removed. No new dependencies.
- **Feature flag**: `GENERATE_SHEET_REDESIGN_ENABLED` removed once §1 lands.
- **Risk**: The redesign has already had regressions vs. legacy ("Стили dead", `setAudioDuration` no-op). Before §1, do a diff review of `GenerateSheet.legacy.tsx` vs `GenerateSheetBody.tsx` for any props/handlers the redesign still doesn't wire, and land those first.

## Open questions before Phase 1 starts

1. Is `GENERATE_SHEET_REDESIGN_ENABLED` already at 100%? If not, when? Retiring the legacy sheet is safe only after 100% for a full week with no rollback.
2. Confirm which Studio dialog wiring file is live (`StudioShell/StudioDialogs.tsx` or `StudioShellDialogs.tsx`) — one 5-min trace, but I want to write the deletion PR against the correct target.
3. Do you want the desktop sidebar's inline form fully removed (my recommendation) or kept as a "quick generate" surface for desktop power users? If kept, it becomes a **view** of the same shared form state, not a second implementation.

Answer those three and Phase 1 can start immediately.
