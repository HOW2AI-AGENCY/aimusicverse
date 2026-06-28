# Tasks: Sprint 035 — Stabilization & Architecture Cleanup

**Input**: Design documents from `/specs/034-sprint035-arch-cleanup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Not explicitly requested in spec — test tasks omitted except for E2E stabilization (US6).

**Organization**: Tasks grouped by user story (7 stories) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify current state and create working branch

- [ ] T001 Verify current build passes with `npm run build` and `npm run lint` to establish baseline
- [ ] T002 Run `npx eslint src/ --rule '{"react-hooks/rules-of-hooks":"error"}'` to inventory existing hook violations before changing config

**Checkpoint**: Baseline established — violation count known, build green

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational blocking tasks for this sprint — all work maps directly to user stories. Proceed to Phase 3.

---

## Phase 3: User Story 1 — Runtime Crash Prevention (Priority: P1) 🎯 MVP

**Goal**: Enforce strict `rules-of-hooks` so conditional/nested hook calls cause build failures instead of silent production crashes.

**Independent Test**: `npm run lint` passes with zero `rules-of-hooks` errors.

### Implementation for User Story 1

- [ ] T003 [US1] Fix all hook violations identified in T002 across `src/` (refactor conditional hooks to top-level calls)
- [ ] T004 [US1] Change `react-hooks/rules-of-hooks` from `"warn"` to `"error"` in `eslint.config.js:53`
- [ ] T005 [US1] Verify `npm run lint` and `npm run build` pass with zero hook violations

**Checkpoint**: ESLint enforces rules-of-hooks as error — no silent crashes possible

---

## Phase 4: User Story 2 — Payment Route Protection (Priority: P1)

**Goal**: Unauthenticated users navigating to `/payment` or `/payment/buy` are redirected to auth flow.

**Independent Test**: Navigate to `/payment` while logged out — verify redirect.

### Implementation for User Story 2

- [ ] T006 [P] [US2] Wrap `/payment` and `/payment/buy` routes with `<ProtectedRoute>` in `src/App.tsx:337-338` (keep `/payment/success` and `/payment/fail` unprotected)
- [ ] T007 [US2] Verify build succeeds and manually test auth redirect for payment routes

**Checkpoint**: Payment routes protected — unauthenticated users redirected

---

## Phase 5: User Story 3 — PlaybackStore Consolidation (Priority: P1)

**Goal**: Merge 3 PlaybackStore implementations into 1 canonical store, eliminating state desync.

**Independent Test**: Play a track in Library, switch to Studio — playback state is consistent in both views.

### Implementation for User Story 3

- [ ] T008 [US3] Audit exports of `src/stores/studio/usePlaybackStore.ts` and `src/stores/slices/playbackSlice.ts` to identify unique features not in canonical store
- [ ] T009 [US3] Merge unique features (e.g., `playbackLogger` from studio variant) into canonical `src/stores/usePlaybackStore.ts`
- [ ] T010 [US3] Update all imports referencing `stores/studio/usePlaybackStore` to use canonical `src/stores/usePlaybackStore.ts`
- [ ] T011 [US3] Update all imports referencing `stores/slices/playbackSlice` to use canonical `src/stores/usePlaybackStore.ts`
- [ ] T012 [US3] Delete `src/stores/studio/usePlaybackStore.ts`
- [ ] T013 [US3] Delete `src/stores/slices/playbackSlice.ts`
- [ ] T014 [US3] Verify `npm run build` succeeds with zero import errors and manually test player in compact, expanded, and fullscreen modes

**Checkpoint**: Single PlaybackStore — no state desynchronization possible

---

## Phase 6: User Story 4 — Hook Deduplication (Priority: P2)

**Goal**: Consolidate 3 duplicate hook pairs, removing ~1700 lines of dead code.

**Independent Test**: `grep -r "useMixExport\|useOptimizedAudioPlayer\|usePromptDJ" src/hooks/ --include="*.ts" --include="*.tsx" -l` returns at most one file per hook name.

### Implementation for User Story 4

#### 4a: useMixExport consolidation

- [ ] T015 [P] [US4] Update all imports of `hooks/useMixExport` to point to `hooks/studio/useMixExport` in `src/hooks/studio/useMixExport.ts`
- [ ] T016 [US4] Delete `src/hooks/useMixExport.ts`
- [ ] T017 [US4] Verify build succeeds after useMixExport consolidation

#### 4b: useOptimizedAudioPlayer consolidation

- [ ] T018 [P] [US4] Update all imports of `hooks/useOptimizedAudioPlayer` to point to `hooks/audio/useOptimizedAudioPlayer` in `src/hooks/audio/useOptimizedAudioPlayer.tsx`
- [ ] T019 [US4] Delete `src/hooks/useOptimizedAudioPlayer.tsx`
- [ ] T020 [US4] Verify build succeeds after useOptimizedAudioPlayer consolidation

#### 4c: PromptDJ consolidation

- [ ] T021 [US4] Update all imports of `usePromptDJ` and `usePromptDJStore` to point to `usePromptDJEnhanced`
- [ ] T022 [US4] Delete `src/hooks/usePromptDJ.ts` (old version)
- [ ] T023 [US4] Delete `src/hooks/usePromptDJStore.ts`
- [ ] T024 [US4] Rename `src/hooks/usePromptDJEnhanced.ts` to `src/hooks/usePromptDJ.ts` and update all imports
- [ ] T025 [US4] Verify `npm run build` succeeds with zero import errors after all hook deduplication

**Checkpoint**: 3 duplicate hook pairs eliminated — ~1700 LOC removed

---

## Phase 7: User Story 5 — Query Key Factory (Priority: P2)

**Goal**: Centralize all TanStack Query keys into a typed factory, enabling reliable cache invalidation.

**Independent Test**: `grep -rn "queryKey:" src/hooks/ | grep -v "queryKeys\."` returns zero results.

### Implementation for User Story 5

- [ ] T026 [US5] Create query key factory at `src/lib/queryKeys.ts` with typed hierarchical keys for all domains (tracks, playlists, users, generation, studio, voices, social, payments, admin)
- [ ] T027 [US5] Migrate track-related hooks to use `queryKeys.tracks.*` in `src/hooks/useTracks*.ts` and related files
- [ ] T028 [US5] Migrate playlist-related hooks to use `queryKeys.playlists.*`
- [ ] T029 [P] [US5] Migrate user/profile hooks to use `queryKeys.users.*`
- [ ] T030 [P] [US5] Migrate generation hooks to use `queryKeys.generation.*`
- [ ] T031 [P] [US5] Migrate studio/project hooks to use `queryKeys.studio.*`
- [ ] T032 [P] [US5] Migrate voice, social, payment, and admin hooks to use `queryKeys.voices.*`, `queryKeys.social.*`, `queryKeys.payments.*`, `queryKeys.admin.*`
- [ ] T033 [US5] Standardize staleTime/gcTime defaults per domain (30s default, 5min user profile, 2s generation status, 10min static data)
- [ ] T034 [US5] Verify `npm run build` and `npm test` pass — audit with grep that zero raw string queryKeys remain

**Checkpoint**: All query keys centralized — cache invalidation is reliable and typed

---

## Phase 8: User Story 6 — E2E Test Stabilization (Priority: P2)

**Goal**: At least 20 of 47 E2E specs pass reliably in CI with Playwright pipeline configured.

**Independent Test**: `npm run test:e2e -- --grep "smoke|homepage|navigation"` passes 3 consecutive runs.

### Implementation for User Story 6

- [ ] T035 [US6] Fix E2E test infrastructure: update selectors to match current DOM, add proper wait-for-network-idle conditions in `tests/e2e/*.spec.ts`
- [ ] T036 [US6] Fix smoke and homepage E2E tests to pass reliably in `tests/e2e/`
- [ ] T037 [US6] Fix navigation E2E tests to pass reliably in `tests/e2e/`
- [ ] T038 [US6] Verify at least 20 E2E specs pass with 3 consecutive green runs
- [ ] T039 [P] [US6] Configure Playwright CI pipeline in `.github/workflows/` with screenshot artifacts on failure

**Checkpoint**: ≥20 E2E specs green in CI — regression safety net established

---

## Phase 9: User Story 7 — Bundle Cleanup (Priority: P3)

**Goal**: Remove dead `react-redux` chunk reference, consolidate to single DnD library, reduce bundle ~50KB.

**Independent Test**: `npm run size` passes (< 950KB), `npm run build` has no chunk warnings.

### Implementation for User Story 7

- [ ] T040 [P] [US7] Remove `react-redux` from manualChunks in `vite.config.ts:216`
- [ ] T041 [US7] Migrate `@hello-pangea/dnd` to `@dnd-kit` in `src/components/generate-form/LyricsVisualEditor.tsx`
- [ ] T042 [P] [US7] Migrate `@hello-pangea/dnd` to `@dnd-kit` in `src/components/project/detail/ProjectTracklistSection.tsx`
- [ ] T043 [US7] Migrate `@hello-pangea/dnd` to `@dnd-kit` in `src/pages/ProjectDetail.tsx` and `src/hooks/useProjectDetailHandlers.ts`
- [ ] T044 [US7] Remove `@hello-pangea/dnd` from `package.json` and run `npm install`
- [ ] T045 [US7] Verify `npm run build` and `npm run size` pass (bundle < 950KB, zero chunk warnings)

**Checkpoint**: Single DnD library, no dead chunk references — bundle reduced ~50KB

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [ ] T046 Run full verification suite: `npm run lint`, `npm run build`, `npm run size`, `npm test`, `npm run test:e2e`
- [ ] T047 Run quickstart.md validation steps to confirm all changes work end-to-end
- [ ] T048 Verify net code reduction ≥ 1500 lines from deduplication (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: N/A for this sprint
- **US1 (Phase 3)**: Depends on Setup (T002 violation inventory)
- **US2 (Phase 4)**: Can start after Setup — independent of US1
- **US3 (Phase 5)**: Can start after Setup — independent of US1/US2
- **US4 (Phase 6)**: Can start after US3 (PlaybackStore must be consolidated first to avoid conflicting changes)
- **US5 (Phase 7)**: Can start after US4 (hook deduplication should complete before query key migration to avoid migrating deleted hooks)
- **US6 (Phase 8)**: Can start after US3 (stable player state needed for E2E)
- **US7 (Phase 9)**: Independent — can start anytime after Setup
- **Polish (Phase 10)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — no dependencies on other stories
- **US2 (P1)**: Independent — no dependencies on other stories
- **US3 (P1)**: Independent — no dependencies on other stories
- **US4 (P2)**: Depends on US3 (PlaybackStore consolidation may affect hook consumers)
- **US5 (P2)**: Depends on US4 (migrate only canonical hooks)
- **US6 (P2)**: Soft dependency on US3 (stable playback for E2E tests)
- **US7 (P3)**: Independent — no dependencies on other stories

### Parallel Opportunities

- **US1 + US2 + US3 + US7**: All P1/P3 stories can run in parallel (different files, no conflicts)
- **T015 + T018**: useMixExport and useOptimizedAudioPlayer consolidation in parallel (different files)
- **T029 + T030 + T031 + T032**: Query key migrations across independent domains in parallel
- **T040 + T041/T042**: react-redux removal and DnD migration in parallel (different files)
- **T039**: Playwright CI config can run in parallel with E2E test fixes

---

## Parallel Example: Phase 3-5 (P1 Stories)

```bash
# These three P1 stories can launch in parallel:
Task: "US1 — Fix hook violations and enforce rules-of-hooks error"
Task: "US2 — Wrap payment routes with ProtectedRoute"
Task: "US3 — Consolidate PlaybackStore (3 → 1)"
Task: "US7 — Remove react-redux chunk + DnD consolidation"
```

## Parallel Example: Phase 6 (Hook Deduplication)

```bash
# These two consolidations can run in parallel (different files):
Task: "Update imports of hooks/useMixExport to hooks/studio/useMixExport"
Task: "Update imports of hooks/useOptimizedAudioPlayer to hooks/audio/useOptimizedAudioPlayer"
```

## Parallel Example: Phase 7 (Query Key Migration)

```bash
# Independent domain migrations can run in parallel:
Task: "Migrate user/profile hooks to queryKeys.users.*"
Task: "Migrate generation hooks to queryKeys.generation.*"
Task: "Migrate studio/project hooks to queryKeys.studio.*"
Task: "Migrate voice, social, payment, admin hooks to queryKeys.*"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 Only)

1. Complete Phase 1: Setup (baseline)
2. Complete US1: rules-of-hooks enforcement
3. Complete US2: Payment route protection
4. Complete US3: PlaybackStore consolidation
5. **STOP and VALIDATE**: `npm run lint` + `npm run build` — runtime crashes prevented, security gap closed, state desync fixed

### Incremental Delivery

1. US1 + US2 + US3 → Runtime stability (MVP) → Validate
2. Add US4 → Hook deduplication → ~1700 LOC removed → Validate
3. Add US5 → Query key factory → Cache reliability → Validate
4. Add US6 → E2E stabilization → Regression safety → Validate
5. Add US7 → Bundle cleanup → ~50KB saved → Validate
6. Polish → Full verification suite

### Parallel Team Strategy

With multiple developers:

1. Team verifies Setup baseline together
2. Once baseline confirmed:
   - Developer A: US1 (ESLint) + US4 (Hook dedup) + US5 (Query keys)
   - Developer B: US2 (Payment) + US3 (PlaybackStore) + US6 (E2E)
   - Developer C: US7 (Bundle cleanup)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `npm run build` after each deletion to catch broken imports immediately
