# C1 — Layer pass #2, wave 1: studio-tree (Report)

## Pass 2 — Final Wave (13 files)

### Status

**Complete.** All 13 files in `src/components/studio/` and `src/components/studio/unified/` no longer import `@/integrations/supabase/client`. Layer architecture (component → hook → service → api) is now enforced for the studio tree.

### Files Touched (13)

1. `src/components/studio/UnifiedNotesViewer.tsx` — Telegram document share via `useTelegramDocumentShare`
2. `src/components/studio/unified/AddInstrumentalDrawer.tsx` — `useAddInstrumental` mutation
3. `src/components/studio/unified/AddVocalsDrawer.tsx` — `useAddVocals` mutation
4. `src/components/studio/unified/MobileSectionsContent.tsx` — `useSourceTrack` query
5. `src/components/studio/unified/SortableTrackList.tsx` — `useStemTranscriptionsForTypes` query
6. `src/components/studio/unified/StemMidiDrawer.tsx` — `useExportMidi` mutation
7. `src/components/studio/unified/StudioArrangementDialog.tsx` — `useAddInstrumental` mutation (no trackId variant)
8. `src/components/studio/unified/StudioNotationPanel.tsx` — `useTranscriptionForStudio` query + normalization
9. `src/components/studio/unified/StudioPendingTrackRow.tsx` — `useGenerationTaskProgress` query+subscription
10. `src/components/studio/unified/StudioShell.tsx` — `useStudioRealtime` subscription (pending tasks + studio projects)
11. `src/components/studio/unified/StudioShell/useStudioCallbacks.ts` — `fetchTrackById` from `tracks.api`
12. `src/components/studio/unified/StudioShell/useStudioStemSync.ts` — `fetchTrackStemsMinimal` + `subscribeToTrackStemsInsert`
13. `src/components/studio/unified/StudioTranscriptionPanel.tsx` — `fetchLatestStemTranscriptionByStemId/ByTrackId` + `invokeReplicateMidiTranscription` + `invokeKlangioAnalyze`

### New Hooks (8)

- `src/hooks/studio/useTelegramDocumentShare.ts` (already existed, repurposed)
- `src/hooks/studio/useAddInstrumental.ts`
- `src/hooks/studio/useAddVocals.ts`
- `src/hooks/studio/useSourceTrack.ts`
- `src/hooks/studio/useStemTranscriptionsForTypes.ts`
- `src/hooks/studio/useExportMidi.ts`
- `src/hooks/studio/useTranscriptionForStudio.ts`
- `src/hooks/studio/useGenerationTaskProgress.ts`
- `src/hooks/studio/useStudioRealtime.ts` (new for Pass 2 final wave)

### New API Functions (`src/api/studio.api.ts`)

- `invokeAddInstrumental`, `invokeAddVocals`
- `invokeExportMidi`
- `fetchTrackStemsByTypes`, `fetchTrackStemByType`
- `fetchLatestStemTranscription`, `fetchLatestStemTranscriptionByStemId`, `fetchLatestStemTranscriptionByTrackId`
- `fetchStemTranscriptionsByStemIds`
- `fetchVersionTranscriptionData`
- `fetchGenerationTaskBySunoId`, `subscribeToGenerationTaskBySunoId`
- `subscribeToPendingTaskComplete`, `subscribeToStudioProject` (Pass 2 final)
- `fetchTrackStemsMinimal`, `subscribeToTrackStemsInsert` (Pass 2 final)
- `invokeReplicateMidiTranscription`, `invokeKlangioAnalyze` (Pass 2 final)

### New Service Functions (`src/services/studio.service.ts`)

- `addInstrumental`, `addVocals` (with `AddInstrumentalParams`/`AddVocalsParams`)
- `fetchSourceTrack`, `fetchStemsByTypes`, `fetchMainTrackTranscription`
- `fetchTranscriptionsByStemIds`, `exportMidi`
- `fetchVersionTranscription`, `fetchStemTranscriptionForTrackType`, `fetchLatestTranscriptionForTrackOrStem`

### Commit List (Pass 2)

1. `ddef5b16` refactor(studio): route unifiednotesviewer through service layer
2. `58d991a2` refactor(studio-unified): route addinstrumentaldrawer through service layer
3. `565fb735` refactor(studio): add addinstrumental/addvocals api, service, hooks
4. `7cc7bfbb` refactor(studio-unified): route addvocalsdrawer through service layer
5. `89ba1f68` refactor(studio-unified): route mobilesectionscontent through service layer
6. `bd1330d1` refactor(studio-unified): route sortabletracklist through service layer
7. `0f321e68` refactor(studio-unified): route stemmidiidrawer through service layer
8. `6f7fbafa` refactor(studio-unified): route studioarrangementdialog through service layer
9. `2d7b84e7` refactor(studio-unified): route studionotationpanel through service layer
10. `378954c9` refactor(studio-unified): route studiopendingtrackrow through service layer
11. `f3af40dd` refactor(studio-unified): route studioshell through service layer
12. `a4e8a81a` refactor(studio-unified): route usestudiocallbacks through service layer
13. `50556d56` refactor(studio-unified): route usestudiostemsync through service layer
14. `587b2d50` refactor(studio-unified): route studiotranscriptionpanel through service layer

### Final Grep Result

```
$ grep -rn "integrations/supabase/client" src/components/studio
(no matches)
```

All 13 files are now clean of direct Supabase client imports.

### Quality Gates

- **`./node_modules/.bin/tsc --noEmit`**: exit 0 (no type errors)
- **`./node_modules/.bin/vitest run`**: 13 test files, **228 tests passed** (228/228, 0 failed)
- **`npm run lint`**: exit 0 (pre-existing warnings only — 4 pre-existing errors + 2233 warnings unrelated to refactor)
- **No `any` types introduced** in any refactored file

### Concerns

1. **`useStudioRealtime.ts`** is a new hook that encapsulates two realtime subscriptions (pending task completion + studio project updates). It accepts a `loadProject` callback via ref to avoid resubscribing on every render.
2. **Existing `useStemTypeTranscriptionStatus`** still imports from `@/integrations/supabase/client` directly and uses `any[]` types — but it's outside this wave's scope (a separate file in `src/hooks/studio/`).
3. **`invokeAddInstrumental`** accepts an optional `track_id` to support both `AddInstrumentalDrawer` (needs trackId) and `StudioArrangementDialog` (audioUrl-only) call patterns.
4. **StudioShell** previously used a single `useEffect` for two subscriptions; split logic is now in `useStudioRealtime` hook for testability. Note: hooks-of-hooks rule required the hook to be called at top level — the original `useEffect` was replaced with top-level hook invocation + memoized pendingTasks.
