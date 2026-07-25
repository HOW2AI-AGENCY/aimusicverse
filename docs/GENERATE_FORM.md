# Generate Form — Architecture

> Last updated: 2026-07-25

## Overview

The generate form is the primary UI for creating tracks via Suno AI. It has been consolidated from 3+ parallel implementations into **one canonical path**: `GenerateSheetBody` → form hooks → submit edge functions.

```
Entry points → dispatchOpenGenerateSheet() → GenerateSheet → GenerateSheetBody → useGenerateForm → suno-* edge functions
```

## Entry points

All entry points converge through a single helper:

| Entry point              | Location                                           | Status                |
| ------------------------ | -------------------------------------------------- | --------------------- |
| BottomNavigation FAB     | `src/components/BottomNavigation.tsx`              | ✅ Uses helper        |
| Sidebar                  | `src/components/layout/Sidebar.tsx`                | ✅ Uses helper        |
| Home Sticky CTA          | `src/components/home/HomeStickyCTA.tsx`            | ✅ Uses helper        |
| Creative Presets         | `src/components/home/CreativePresetsSection.tsx`   | ✅ Uses helper        |
| Desktop Library Sidebar  | `src/components/library/DesktopLibrarySidebar.tsx` | ✅ Inline form (kept) |
| Telegram deep link       | `src/hooks/useOpenGenerateFromDeeplink.ts`         | ✅ Uses helper        |
| Keyboard shortcuts       | `src/lib/keyboardShortcuts.ts`                     | ✅ Uses helper        |
| ~~GenerateSheet.legacy~~ | (being retired behind flag)                        | Uses helper           |

The helper function `dispatchOpenGenerateSheet()` is exported from `src/lib/events.ts`. All entry points must use it; raw `window.dispatchEvent(new CustomEvent(...))` is deprecated.

## Component tree

```
GenerateSheet (feature-flag switch: redesign vs legacy)
  └── GenerateSheetBody (canonical form wrapper)
        ├── FormStepper (step indicator for custom mode)
        ├── ReferenceChipsRow (project/artist/audio/voice chips)
        ├── GenerateFormSimple (mode="simple")
        │     └── FormSection → sections/...
        └── GenerateFormCustom (mode="custom")
              └── form: UseGenerateFormReturn
                    ├── FormSection #1 → TitleSection
                    ├── FormSection #2 → StyleSection + VocalsToggle
                    ├── FormSection #3 → LyricsSectionAdvanced
                    ├── FormSection #4 → CustomVoicePicker (conditional)
                    └── FormSection #5 → PrivacyToggle + AdvancedSettings
                          ├── FormSliderRow (×3)
                          └── FormSettingCard (×2)
```

## Form state

The form state is managed by `useGenerateForm()` (composed from 4 sub-hooks):

```
useGenerateForm
  ├── useGenerateFormState    — field values + setters
  ├── useGenerateFormActions  — submit, boost, draft
  ├── useGenerateFormValidation — cost/balance/canGenerate
  └── useGenerateFormDraft    — auto-save + restore
```

The combined return `UseGenerateFormReturn` is passed as `form` prop to `GenerateFormCustom` and `GenerateFormSimple`.

Key design decisions:

- **Zustand for global UI state** (player, studio). Not used for form — form state is hook-local.
- **TanStack Query for server state** (cost/balance). Not used for draft/field state.
- **React Hook Form not used** — form is simple enough for raw `useState`.

## Submit pipeline

```
GenerateSheet → useGenerateFormSubmit
  → pre-flight (credits, voice check, artist validation)
  → 4 routing branches:
      1. upload-extend  → suno-upload-extend
      2. extend-by-url  → suno-generate (action=extend)
      3. cover-by-url   → suno-generate (action=cover)
      4. full-generate  → suno-music-generate
  → useAutomaticRetry (max 2, exponential backoff)
  → GenerationLoadingState (4 stages, on failure shows error card + retry)
  → GenerationResultSheet (post-generation result)
```

## Design primitives

Located in `src/components/generate-form/primitives/`:

| Component         | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `FormSettingCard` | Bordered card with label + optional info tooltip |
| `FormSliderRow`   | Slider with percentage display + info tooltip    |

These replace the 5 inline card copies that previously existed in `AdvancedSettings.tsx`.

## Lyrics assistant

Two surfaces, split by context:

| Surface                          | Component              | Capabilities                                                                         |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Lyrics Studio (`/lyrics-studio`) | `LyricsAIChatAgent`    | Full AI agent with tools (Write, Analyze, Producer, Rhyme, Structure, Optimize)      |
| Generate Sheet                   | `LyricsAssistantSheet` | Chat flow (genre→mood→structure→generate) + action buttons (validate, analyze, etc.) |

Both call the `ai-lyrics-assistant` and `ai-lyrics-edit` edge functions.

## Related files

| Layer          | Path                                                      |
| -------------- | --------------------------------------------------------- |
| Hook           | `src/hooks/generation/useGenerateForm.ts`                 |
| Hook (types)   | `src/hooks/generation/useGenerateForm.types.ts`           |
| Hook (submit)  | `src/hooks/generation/useGenerateFormSubmit.ts`           |
| Hook (draft)   | `src/hooks/generation/useGenerateFormDraft.ts`            |
| Hook (actions) | `src/hooks/generation/useGenerateFormActions.ts`          |
| Sheet          | `src/components/GenerateSheet.tsx`                        |
| Sheet body     | `src/components/generate-sheet/GenerateSheetBody.tsx`     |
| Form values    | `src/components/generate-form/GenerateFormCustom.tsx`     |
| Simple form    | `src/components/generate-form/GenerateFormSimple.tsx`     |
| Primitives     | `src/components/generate-form/primitives/`                |
| Actions footer | `src/components/generate-form/GenerateFormActions.tsx`    |
| References     | `src/components/generate-form/GenerateFormReferences.tsx` |
| Helper event   | `src/lib/events.ts`                                       |
