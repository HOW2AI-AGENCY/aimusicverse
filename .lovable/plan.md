# Unified Generation Form — Refactor Progress

## Status

- **Phase 1 — Safe cleanup**: in progress
- Phase 2/3/4: not started

## Done this session

### §4 Deduplicate lyrics editor — DONE
Deleted 12 orphan files (~2500 LOC of dead code):

- `src/components/generate-form/LyricsVisualEditor.tsx` (627 lines, zero importers)
- `src/components/generate-form/lyrics/LyricsVisualEditor.tsx` (+ `.stories.tsx`)
- `src/components/generate-form/lyrics/SectionCard.tsx`
- `src/components/generate-form/lyrics/ActionButton.tsx`
- `src/components/generate-form/lyrics/lyricsEditorHelpers.ts`
- `src/components/generate-form/lyrics/LyricsSectionCard.tsx`
- `src/components/generate-form/lyrics/useLyricsSections.ts`
- `src/components/generate-form/lyrics/LyricsSectionTemplates.ts`
- `src/__tests__/components/lyrics/LyricsVisualEditor.test.tsx`
- `src/__tests__/components/lyrics/LyricsSectionTemplates.test.ts`
- `src/__tests__/hooks/useLyricsSections.test.ts`

Fixed the broken lazy import in `src/components/lazy/index.ts:156` — `LazyLyricsVisualEditor` was importing a file that no longer existed anywhere; now points to canonical `LyricsVisualEditorCompact`.

**What's canonical now**: `sections/LyricsSectionAdvanced.tsx` → `LyricsVisualEditorCompact.tsx` → `lyrics-editor/{SectionCard,ActionButton,EmptyState}.tsx` + `lyricsEditorHelpers.ts` (top-level). One editor, one helpers file. `generate-form/lyrics/` retains only the actively-used assistant surfaces (`LyricsAssistantSheet.tsx`, `LyricsAssistantChat.tsx`, `LyricsProsodyPanel.tsx`).

### §3 Entry-point standardization — PARTIAL
Fixed `src/components/home/CreativePresetsSection.tsx:89`:
- Was firing raw `new CustomEvent("openGenerateSheet")` (camelCase) which **never matched** the listener on `"open-generate-sheet"` (kebab-case in `events.ts`). Silent bug — clicking a genre preset stored sessionStorage but never opened the sheet.
- Now uses `dispatchOpenGenerateSheet()` from `@/lib/events`.

Every other entry point (`BottomNavigation`, `Sidebar`, `HomeStickyCTA`, `Index.tsx` deeplink) was already on the helper — no changes needed.

## Deferred

### §6 Studio dialog wirings — DEFERRED
`StudioShellDialogs.tsx` (611 lines, desktop) and `StudioShell/StudioDialogs.tsx` (445 lines, mobile) are both live on different render trees (`StudioShell.tsx` vs `UnifiedStudioMobile.tsx`). Consolidating them requires reconciling divergent prop shapes for both call sites — real Phase 2 work, not a safe cleanup.

### §10 Deprecated progress hooks — DEFERRED
`useAddInstrumentalProgress` / `useAddVocalsProgress` / `useExtendProgress` are still actively used by their respective dialogs (`AddInstrumentalDialog`, `AddVocalsDialog`, `AddVocalsDrawer`, `ExtendTrackDialog`). Migrating call sites to `useAudioProcessing()` needs an API-shape audit first.

### §1, §2, §5, §7, §8, §9, §11 — NOT STARTED
Reserved for follow-up phases. Full plan preserved in git history of this file.

## Files touched this session
1. Deleted: 12 files (~2500 LOC)
2. Edited: `src/components/lazy/index.ts` — repointed lazy import
3. Edited: `src/components/home/CreativePresetsSection.tsx` — fixed silent event-name bug

## Next step
Ship this cleanup, verify no regressions in preview, then tackle §7 (prop-drilling in `GenerateFormCustom` — 25+ props → single `form` object). That's the highest-value structural win and unlocks §8 (design primitives).
