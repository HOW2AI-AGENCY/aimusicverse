# Research: Sprint 035 — Stabilization & Architecture Cleanup

**Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)

## R1: PlaybackStore Consolidation Strategy

**Decision**: Keep `src/stores/usePlaybackStore.ts` as canonical, absorb studio-specific features from `stores/studio/usePlaybackStore.ts` and `stores/slices/playbackSlice.ts`.

**Rationale**: The root-level `usePlaybackStore.ts` already exports 5 selector hooks (`usePlaybackStatus`, `usePlaybackControls`, `useLoopControls`, `usePlaybackProgress`, `usePlaybackLoadingState`), making it the most complete and well-structured implementation. The studio variant adds a `playbackLogger` — this should be merged into the canonical store.

**Alternatives considered**:
- Create entirely new store → rejected: unnecessary churn when root store is already well-structured
- Keep studio variant and delete root → rejected: root has more consumers and better selectors

## R2: DnD Library Decision

**Decision**: Keep `@dnd-kit` (3 files), migrate `@hello-pangea/dnd` (4 files) to `@dnd-kit`.

**Rationale**: `@dnd-kit` is more modern, has better accessibility, smaller bundle, active maintenance, and headless architecture allowing more flexibility. Usage distribution:
- `@dnd-kit`: `SortableTrackList.tsx`, `QueueSheet.tsx`, `QueueItem.tsx` (sortable lists — core player/studio UX)
- `@hello-pangea/dnd`: `ProjectDetail.tsx`, `ProjectTracklistSection.tsx`, `LyricsVisualEditor.tsx`, `useProjectDetailHandlers.ts` (drag-drop for project track ordering, lyrics editing)

The `@hello-pangea/dnd` usage is simpler (basic reorder), easy to migrate to `@dnd-kit/sortable`.

**Alternatives considered**:
- Keep `@hello-pangea/dnd` and migrate `@dnd-kit` → rejected: `@dnd-kit` is used in higher-traffic components (player queue), is more actively maintained, smaller bundle
- Keep both → rejected: +50KB bundle bloat, two mental models

## R3: ProtectedRoute Pattern

**Decision**: Wrap `/payment` and `/payment/buy` routes with existing `ProtectedRoute` component.

**Rationale**: `ProtectedRoute` is already imported and used in `src/App.tsx` for studio, player, and other authenticated routes. Pattern is established — just wrap the payment `<Route>` elements. `ProtectedRoute.tsx` at `src/components/ProtectedRoute.tsx` has an `isDevEnvironment()` bypass for development.

**Risk**: `/payment/success` and `/payment/fail` should remain unprotected — users may land on these from external payment callbacks without active session.

## R4: ESLint rules-of-hooks Upgrade

**Decision**: Change `"warn"` to `"error"` at `eslint.config.js:53`.

**Rationale**: The comment at line 51 explains the rule is set to warn because it's "only registered for ts/tsx files." This is not a valid reason to downgrade from error — the fact that it only applies to ts/tsx is correct behavior.

**Risk**: There may be existing violations that currently only warn. Must run `npx eslint src/ --rule '{"react-hooks/rules-of-hooks":"error"}'` first to check for existing violations and fix before changing the config.

## R5: Query Key Factory Pattern

**Decision**: Create `src/lib/queryKeys.ts` using TanStack Query's recommended factory pattern with hierarchical keys.

**Rationale**: Standard pattern from TanStack Query docs. Example structure:
```typescript
export const queryKeys = {
  tracks: {
    all: ['tracks'] as const,
    lists: () => [...queryKeys.tracks.all, 'list'] as const,
    list: (filters: TrackFilters) => [...queryKeys.tracks.lists(), filters] as const,
    details: () => [...queryKeys.tracks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tracks.details(), id] as const,
    versions: (id: string) => [...queryKeys.tracks.detail(id), 'versions'] as const,
  },
  // ... per domain
}
```

**staleTime standardization**: Default 30s (as per CLAUDE.md), with domain overrides:
- User profile: 5min (rarely changes)
- Track lists: 30s (default)
- Real-time data (generation status): 2s
- Static data (genres, artists): 10min

## R6: E2E Test Failures

**Decision**: Prioritize smoke, homepage, and navigation tests (highest value, least flaky). Fix test infrastructure issues (missing selectors, wait conditions, dev server startup) rather than rewriting tests.

**Rationale**: 47 specs exist but 0 pass. Most likely causes: test selectors don't match current DOM, missing wait-for-network-idle, dev server not starting in CI. Fix infrastructure first, then fix individual test assertions.

**Alternatives considered**:
- Rewrite all E2E tests → rejected: too much scope for Sprint 035
- Skip E2E entirely → rejected: zero regression safety net is a critical gap

## R7: Hook Deduplication Strategy

**Decision**: For each duplicate pair, keep the more feature-complete version, update all imports, delete the other.

| Hook | Keep | Delete | Rationale |
|------|------|--------|-----------|
| useMixExport | `hooks/studio/useMixExport.ts` (396 LOC) | `hooks/useMixExport.ts` (381 LOC) | Studio version is newer, more complete |
| useOptimizedAudioPlayer | `hooks/audio/useOptimizedAudioPlayer.tsx` (325 LOC) | `hooks/useOptimizedAudioPlayer.tsx` (395 LOC) | Audio-scoped version is cleaner, 70 LOC smaller |
| PromptDJ | `usePromptDJEnhanced.ts` (1070 LOC) → rename to `usePromptDJ.ts` | `usePromptDJ.ts` (374 LOC), `usePromptDJStore.ts` (287 LOC) | Enhanced is the evolution with all features |

**Risk**: Must verify no consumers import unique exports from the deleted files. Run TypeScript compilation after each deletion.
