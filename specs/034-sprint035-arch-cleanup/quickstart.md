# Quickstart: Sprint 035 — Stabilization & Architecture Cleanup

**Branch**: `034-sprint035-arch-cleanup`

## Prerequisites

- Node.js 18+, npm 9+
- Git access to `HOW2AI-AGENCY/aimusicverse`

## Setup

```bash
git checkout 034-sprint035-arch-cleanup
npm install
npm run dev
```

## Implementation Order

Execute phases sequentially — each phase must pass `npm run build` before proceeding.

### Phase 1: Runtime Fixes (do first — prevents crashes)

1. **ESLint rules-of-hooks** → `eslint.config.js:53` change `"warn"` to `"error"`, fix violations
2. **Payment route protection** → wrap `/payment` and `/payment/buy` in `<ProtectedRoute>` in `src/App.tsx:337-338`
3. **PlaybackStore consolidation** → merge studio/slices stores into `src/stores/usePlaybackStore.ts`, update imports, delete duplicates

### Phase 2: Deduplication (largest code reduction)

4. **useMixExport** → keep `hooks/studio/`, delete `hooks/`, update imports
5. **useOptimizedAudioPlayer** → keep `hooks/audio/`, delete `hooks/`, update imports
6. **PromptDJ** → keep enhanced, rename, delete old files
7. **Query key factory** → create `src/lib/queryKeys.ts`, migrate all hooks

### Phase 3: E2E Stabilization

8. Fix smoke/homepage/navigation E2E tests
9. Configure Playwright CI pipeline

### Phase 4: Quick Fixes

10. Remove `react-redux` from `vite.config.ts:216` manualChunks
11. Migrate `@hello-pangea/dnd` → `@dnd-kit` (4 files)
12. Verify `npm run build` + `npm run size`

## Verification

```bash
npm run lint          # 0 errors, rules-of-hooks: error
npm run build         # clean build, no warnings
npm run size          # < 950KB
npm test              # all unit tests pass
npm run test:e2e      # ≥20 specs pass
```

## Key Files

| File | Change |
|------|--------|
| `eslint.config.js:53` | `"warn"` → `"error"` |
| `src/App.tsx:337-338` | Wrap payment routes |
| `src/stores/usePlaybackStore.ts` | Canonical playback store |
| `src/stores/studio/usePlaybackStore.ts` | DELETE |
| `src/stores/slices/playbackSlice.ts` | DELETE |
| `src/hooks/useMixExport.ts` | DELETE |
| `src/hooks/useOptimizedAudioPlayer.tsx` | DELETE |
| `src/hooks/usePromptDJ.ts` | DELETE (old version) |
| `src/hooks/usePromptDJStore.ts` | DELETE |
| `src/hooks/usePromptDJEnhanced.ts` | RENAME → `usePromptDJ.ts` |
| `src/lib/queryKeys.ts` | NEW |
| `vite.config.ts:216` | Remove react-redux ref |
