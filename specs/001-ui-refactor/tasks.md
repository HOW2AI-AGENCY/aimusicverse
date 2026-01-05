# Tasks: UI Architecture Refactoring & Optimization

**Input**: Design documents from `/specs/001-ui-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Branch**: `001-ui-refactor`
**Tests**: FR-025 through FR-027 specify test requirements (80% hook coverage, mobile testing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

- **Single React project**: `src/`, `tests/` at repository root
- **Components**: `src/components/` organized by feature
- **Hooks**: `src/hooks/` organized by domain (track/, social/, player/, stem/)
- **Tests**: `tests/unit/hooks/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure tooling for refactoring (bundle monitoring, naming conventions, test coverage)

- [x] T001 [P] Configure enhanced size-limit with multi-tier tracking in package.json (total 950 KB, chunks 50-200 KB per plan.md) ✅
- [x] T002 [P] Add ESLint rule for kebab-case file naming using eslint-plugin-check-file in .eslintrc.cjs ✅
- [x] T003 [P] Configure Jest coverage thresholds for hooks (80% coverage) in jest.config.cjs ✅
- [x] T004 [P] Create bundle monitoring script scripts/track-bundle-size.js per research.md Task 7 ✅
- [x] T005 [P] Create component migration script scripts/migrate-filenames.js per research.md Task 6 ✅

**Checkpoint**: ✅ Tooling ready - bundle size monitoring, naming enforcement, and test coverage configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create hook infrastructure and shared patterns that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 [P] Create src/hooks/track/ directory for track-related hooks ✅
- [x] T007 [P] Create src/hooks/social/ directory for social interaction hooks ✅
- [x] T008 [P] Create src/hooks/player/ directory for player control hooks ✅
- [x] T009 [P] Create src/hooks/stem/ directory for stem operation hooks ✅
- [x] T010 [P] Create src/lib/a11y.ts with usePrefersReducedMotion hook per research.md Task 3 ✅
- [x] T011 [P] Create src/lib/lazy.ts utility for dynamic imports per plan.md Phase 1 ✅
- [x] T012 [P] Create src/lib/motion-variants.ts with common animation variants per research.md Task 3 ✅
- [x] T013 Create base hook types in src/hooks/types/track.ts per data-model.md ✅
- [x] T014 Create base hook types in src/hooks/types/social.ts per data-model.md ✅
- [x] T015 [P] Create useMediaQuery hook in src/hooks/use-media-query.ts per research.md Task 5 ✅
- [x] T016 [P] Create useIsMobile hook in src/hooks/use-is-mobile.ts per research.md Task 5 ✅

**Checkpoint**: ✅ Hook infrastructure ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Unified Track Card Component (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Consolidate 5 duplicate track card implementations into single UnifiedTrackCard component with 7 variants

**Independent Test**: Navigate to library/home/search screens and verify all track cards display consistently with working play/like/share/version switching/swipe gestures

### Tests for User Story 1 ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US1] Unit test for useTrackData hook in tests/unit/hooks/use-track-data.test.ts (mock TanStack Query, test data fetching) ✅
- [x] T018 [P] [US1] Unit test for useTrackActions hook in tests/unit/hooks/use-track-actions.test.ts (mock mutations, test optimistic updates) ✅
- [x] T019 [P] [US1] Unit test for useTrackVersionSwitcher hook in tests/unit/hooks/use-track-version-switcher.test.ts (test atomic updates) ✅
- [x] T020 [P] [US1] Unit test for useRealtimeTrackUpdates hook in tests/unit/hooks/use-realtime-track-updates.test.ts (test subscription lifecycle) ✅
- [x] T021 [P] [US1] Integration test for UnifiedTrackCard in tests/integration/unified-track-card.test.tsx (test all variants, props, interactions) ✅
- [x] T022 [P] [US1] E2E test for track card swipe gestures in tests/e2e/mobile/track-card-gestures.spec.ts (test swipe to like, swipe to delete on mobile) ✅

### Implementation for User Story 1 ✅

- [x] T023 [US1] Create UnifiedTrackCard type definitions in src/components/track/track-card.types.ts per contracts/UnifiedTrackCard.contract.ts (discriminated unions, variant props) ✅
- [x] T024 [US1] Create VARIANT_CONFIG constant in src/components/track/track-card.config.ts per research.md Task 1 (variant configurations) ✅
- [x] T025 [US1] Implement useTrackData hook in src/hooks/track/use-track-data.ts per contracts/useTrackData.contract.ts (TanStack Query integration) ✅
- [x] T026 [US1] Implement useTrackActions hook in src/hooks/track/use-track-actions.ts per contracts/useTrackActions.contract.ts (optimistic updates, mutations) ✅
- [x] T027 [US1] Implement useTrackVersionSwitcher hook in src/hooks/track/use-track-version-switcher.ts per contracts/useTrackVersionSwitcher.contract.ts (atomic updates) ✅
- [x] T028 [US1] Implement useRealtimeTrackUpdates hook in src/hooks/track/use-realtime-track-updates.ts per contracts/useRealtimeTrackUpdates.contract.ts (Supabase subscriptions) ✅
- [x] T029 [US1] Create base UnifiedTrackCard component in src/components/track/track-card.tsx per plan.md (imports hooks, variant rendering logic) ✅
- [x] T030 [US1] Implement grid variant rendering in src/components/track/variants/grid-variant.tsx (grid layout, animations) ✅
- [x] T031 [US1] Implement list variant rendering in src/components/track/variants/list-variant.tsx (list layout, animations) ✅
- [x] T032 [US1] Implement compact variant rendering in src/components/track/variants/compact-variant.tsx (compact layout, reduced features) ✅
- [x] T033 [US1] Implement minimal variant rendering in src/components/track/variants/minimal-variant.tsx (minimal layout, no actions) ✅
- [x] T034 [US1] Implement enhanced variant rendering in src/components/track/variants/enhanced-variant.tsx (social features, follow button) ✅
- [x] T035 [US1] Implement professional variant rendering in src/components/track/variants/professional-variant.tsx (MIDI status, version pills) ✅
- [x] T036 [US1] Add swipe gesture support in src/components/track/track-card.tsx using @use-gesture/react (swipe to like, swipe to delete) ✅
- [x] T037 [US1] Add haptic feedback to swipe gestures in src/components/track/track-card.tsx per FR-012 (light for swipe, error for failures) ✅
- [x] T038 [US1] Add touch target compliance (44-56px) in src/components/track/track-card.tsx per FR-011 (interactive buttons) ✅
- [x] T039 [US1] Create index.ts barrel export in src/components/track/index.ts (export UnifiedTrackCard) ✅
- [x] T040 [US1] Update src/components/track/track-actions.tsx to use extracted hooks (remove direct Supabase queries, use useTrackActions) ✅
- [x] T041 [US1] Add deprecation warnings to old TrackCard.tsx in src/components/TrackCard.tsx (console.warn, import alias) ✅

**Checkpoint**: At this point, User Story 1 should be fully functional - UnifiedTrackCard with 7 variants, extracted hooks, gesture support, touch targets, haptic feedback

---

## Phase 4: User Story 2 - Business Logic Extraction (Priority: P1)

**Goal**: Extract business logic from 37+ components into dedicated hooks, leaving components purely presentational

**Independent Test**: Examine TrackCard and other components - verify only JSX/presentation logic remains, all data fetching/subscriptions happen in hooks

### Tests for User Story 2

- [ ] T042 [P] [US2] Unit test for useSocialInteractions hook in tests/unit/hooks/use-social-interactions.test.ts (test like, follow, share actions)
- [ ] T043 [P] [US2] Unit test for usePlayerControls hook in tests/unit/hooks/use-player-controls.test.ts (test play, pause, seek operations)
- [ ] T044 [P] [US2] Integration test for player with extracted hooks in tests/integration/player-hooks.test.tsx (test player state management via hooks)
- [ ] T045 [P] [US2] Integration test for social features with extracted hooks in tests/integration/social-hooks.test.tsx (test like, follow, share)

### Implementation for User Story 2

- [ ] T046 [US2] Implement useSocialInteractions hook in src/hooks/social/use-social-interactions.ts per data-model.md (like, follow, share with optimistic updates)
- [ ] T047 [US2] Implement useRealtimeSocialCounts hook in src/hooks/social/use-realtime-social-counts.ts per FR-007 (real-time like/follow count subscriptions)
- [ ] T048 [US2] Implement usePlayerControls hook in src/hooks/player/use-player-controls.ts per data-model.md (play, pause, seek, queue management)
- [ ] T049 [US2] Implement useStemOperations hook in src/hooks/stem/use-stem-operations.ts per data-model.md (stem separation, mixing operations)
- [ ] T050 [US2] Refactor src/components/player/ExpandedPlayer.tsx to use usePlayerControls (remove direct playerStore manipulation)
- [ ] T051 [US2] Refactor src/components/player/MobileFullscreenPlayer.tsx to use usePlayerControls (remove direct playerStore manipulation)
- [ ] T052 [US2] Refactor src/components/library/VirtualizedTrackList.tsx to use useTrackData (remove direct Supabase queries)
- [ ] T053 [US2] Refactor src/components/home/PublicTrackCard.tsx to use useTrackData and useSocialInteractions (remove direct queries)
- [ ] T054 [US2] Refactor src/components/home/TrackCardEnhanced.tsx to use useSocialInteractions (remove social logic)
- [ ] T055 [US2] Refactor src/components/stem-studio/* components to use useStemOperations (remove stem logic)
- [ ] T056 [US2] Remove real-time subscriptions from src/components/TrackCard.tsx (now handled by useRealtimeTrackUpdates)
- [ ] T057 [US2] Remove database queries from src/components/generate-form/* (use extracted hooks instead)

**Checkpoint**: At this point, 37+ components should be refactored - only JSX/presentation logic remains, all business logic in hooks

---

## Phase 5: User Story 3 - Consolidated Skeleton Loader System (Priority: P2)

**Goal**: Unify 3 skeleton loader files into single system with centralized motion handling

**Independent Test**: Trigger loading states across app - verify all skeletons render consistently with proper shimmer, respect prefers-reduced-motion

### Tests for User Story 3

- [ ] T058 [P] [US3] Unit test for Skeletons.TrackCard in tests/unit/components/skeletons.test.tsx (test grid/list layouts)
- [ ] T059 [P] [US3] Unit test for useSkeletonAnimation in tests/unit/hooks/use-skeleton-animation.test.ts (test prefers-reduced-motion respect)
- [ ] T060 [P] [US3] Visual regression test for skeleton layouts in tests/e2e/skeleton-layouts.spec.ts (ensure skeletons match actual components)

### Implementation for User Story 3

- [ ] T061 [US3] Create base skeleton types in src/components/ui/skeletons/skeleton.types.ts per data-model.md (SkeletonProps, variant configs)
- [ ] T062 [US3] Implement useSkeletonAnimation hook in src/hooks/use-skeleton-animation.ts per research.md Task 3 (motion preference handling)
- [ ] T063 [US3] Implement ShimmerEffect component in src/components/ui/skeletons/shimmer-effect.tsx per research.md Task 3 (respects motion preferences)
- [ ] T064 [US3] Implement createSkeleton factory function in src/components/ui/skeletons/factory.ts per research.md Task 3
- [ ] T065 [US3] Implement Skeletons.TrackCard in src/components/ui/skeletons/track-skeleton.tsx per research.md Task 3 (grid/list/compact layouts)
- [ ] T066 [US3] Implement Skeletons.Player in src/components/ui/skeletons/player-skeleton.tsx per research.md Task 3
- [ ] T067 [US3] Implement Skeletons.PlayerCompact in src/components/ui/skeletons/player-compact-skeleton.tsx
- [ ] T068 [US3] Implement Skeletons.Grid in src/components/ui/skeletons/grid-skeleton.tsx per research.md Task 3
- [ ] T069 [US3] Implement Skeletons.Form in src/components/ui/skeletons/form-skeleton.tsx per research.md Task 3
- [ ] T070 [US3] Implement Skeletons.Text in src/components/ui/skeletons/text-skeleton.tsx per research.md Task 3
- [ ] T071 [US3] Create barrel export in src/components/ui/skeletons/index.ts (export Skeletons object with all variants)
- [ ] T072 [US3] Replace LoadingSpinner.tsx imports with Skeletons in src/components/ (find and replace)
- [ ] T073 [US3] Replace skeleton-loader.tsx imports with Skeletons in src/components/ (find and replace)
- [ ] T074 [US3] Replace skeleton-components.tsx imports with Skeletons in src/components/ (find and replace)
- [ ] T075 [US3] Delete src/components/ui/LoadingSpinner.tsx (consolidated into Skeletons)
- [ ] T076 [US3] Delete src/components/ui/skeleton-loader.tsx (consolidated into Skeletons)
- [ ] T077 [US3] Delete src/components/ui/skeleton-components.tsx (consolidated into Skeletons)
- [ ] T078 [US3] Delete src/components/ui/shimmer-skeleton.tsx if exists (consolidated into Skeletons)

**Checkpoint**: At this point, 3 skeleton files consolidated into single system - all skeletons use Skeletons.*, respect motion preferences

---

## Phase 6: User Story 4 - Dialog and Sheet Strategy Standardization (Priority: P2)

**Goal**: Establish clear modal usage guidelines, consolidate duplicate dialogs, implement ResponsiveModal pattern

**Independent Test**: Open various modals - verify mobile uses bottom sheets with swipe-to-dismiss, desktop uses centered dialogs

### Tests for User Story 4

- [ ] T079 [P] [US4] E2E test for modal responsiveness in tests/e2e/modal-responsiveness.spec.ts (test Sheet on mobile, Dialog on desktop)
- [ ] T080 [P] [US4] E2E test for swipe-to-dismiss on mobile in tests/e2e/mobile/sheet-gestures.spec.ts (test swipe down to close sheets)

### Implementation for User Story 4

- [ ] T081 [US4] Create modal selection decision tree document in docs/MODAL_SELECTION_GUIDE.md per research.md Task 4 (AlertDialog vs Sheet vs Dialog vs ResponsiveModal)
- [ ] T082 [US4] Implement ResponsiveModal component in src/components/ui/responsive-modal.tsx per research.md Task 4 (adapts Sheet/Dialog based on viewport)
- [ ] T083 [US4] Consolidate AudioExtendDialog and ExtendTrackDialog in src/components/dialog/extend-track-dialog.tsx per FR-004 (keep one implementation)
- [ ] T084 [US4] Update all AudioExtendDialog imports to ExtendTrackDialog in src/ (find and replace)
- [ ] T085 [US4] Update src/components/dialog/ to use AlertDialog for confirmations per decision tree (delete, destructive actions)
- [ ] T086 [US4] Update src/components/dialog/ to use Sheet for details/forms per decision tree (settings, track details)
- [ ] T087 [US4] Update src/components/dialog/ to use ResponsiveModal for adaptive modals per decision tree (forms that adapt)
- [ ] T088 [US4] Add swipe-to-dismiss to MobileBottomSheet in src/components/mobile/MobileBottomSheet.tsx (use @use-gesture/react)
- [ ] T089 [US4] Ensure safe-area-inset-bottom respect in MobileBottomSheet per FR-011 (Telegram safe areas)
- [ ] T090 [US4] Create modal component barrel export in src/components/ui/modals/index.ts (export AlertDialog, Sheet, Dialog, ResponsiveModal)

**Checkpoint**: At this point, clear modal guidelines established, duplicate dialogs consolidated, ResponsiveModal pattern implemented

---

## Phase 7: User Story 5 - Mobile Component Strategy Clarification (Priority: P3)

**Goal**: Document guidelines for Mobile* vs responsive components, enforce touch targets and haptic feedback

**Independent Test**: Navigate app on mobile - verify all interactive elements meet 44-56px targets, provide haptic feedback, respect motion preferences

### Tests for User Story 5

- [ ] T091 [P] [US5] E2E test for touch target compliance in tests/e2e/mobile/touch-targets.spec.ts (verify all interactive elements meet 44-56px)
- [ ] T092 [P] [US5] E2E test for haptic feedback in tests/e2e/mobile/haptic-feedback.spec.ts (verify haptic triggers on taps, swipes, errors, successes)
- [ ] T093 [P] [US5] E2E test for motion preferences in tests/e2e/mobile/reduced-motion.spec.ts (verify animations respect prefers-reduced-motion)

### Implementation for User Story 5

- [ ] T094 [US5] Create mobile component strategy guidelines in docs/MOBILE_COMPONENT_STRATEGY.md per research.md Task 5 (when to create Mobile* vs responsive)
- [ ] T095 [US5] Create ESLint rule for touch target size in .eslintrc.cjs per FR-011 (enforce 44-56px minimum)
- [ ] T096 [US5] Add haptic feedback utility to src/lib/telegram-haptics.ts per FR-012 (wrap Telegram WebApp HapticFeedback API)
- [ ] T097 [US5] Update src/components/mobile/MobileStudioLayout.tsx with haptic feedback per FR-012 (light for taps, medium for swipes)
- [ ] T098 [US5] Update src/components/mobile/MobileLyricsEditor.tsx with haptic feedback per FR-012 (error for failures, success for saves)
- [ ] T099 [US5] Update src/components/mobile/MobileActionSheet.tsx with haptic feedback per FR-012 (medium for selection)
- [ ] T100 [US5] Verify touch targets in src/components/player/CompactPlayer.tsx (ensure 44-56px buttons)
- [ ] T101 [US5] Verify touch targets in src/components/library/VirtualizedTrackList.tsx (ensure 44-56px interactive elements)
- [ ] T102 [US5] Verify touch targets in src/components/generate-form/* components (ensure 44-56px form inputs/buttons)
- [ ] T103 [US5] Add prefers-reduced-motion checks to src/lib/motion.ts per FR-013 (respect user preferences)
- [ ] T104 [US5] Add prefers-reduced-motion checks to src/components/ui/skeletons/ per FR-013 (disable shimmer when preferred)
- [ ] T105 [US5] Update CLAUDE.md with mobile component strategy per FR-010 (document guidelines in developer documentation)

**Checkpoint**: At this point, mobile guidelines documented, touch targets enforced, haptic feedback added, motion preferences respected

---

## Phase 8: User Story 6 - Component Naming and Organization Standardization (Priority: P3)

**Goal**: Standardize kebab-case file names, PascalCase exports, resolve duplicates, organize by feature

**Independent Test**: Navigate component directories - verify all files use kebab-case, exports use PascalCase, organized by feature

### Tests for User Story 6

- [ ] T106 [P] [US6] Linting test for file naming conventions in tests/lint/naming-conventions.test.ts (verify kebab-case enforcement)
- [ ] T107 [P] [US6] Integration test for component imports in tests/integration/component-structure.test.tsx (verify all imports work with new structure)

### Implementation for User Story 6

- [ ] T108 [US6] Run migration script to rename components to kebab-case in src/components/ per FR-014 (use scripts/migrate-filenames.js)
- [ ] T109 [US6] Resolve VoiceInputButton vs voice-input-button duplicate in src/components/ui/ per FR-016 (keep voice-input-button.tsx, delete VoiceInputButton.tsx)
- [ ] T110 [US6] Move TrackCard.tsx to src/components/track/track-card.tsx per FR-017 (organize by feature)
- [ ] T111 [US6] Move UnifiedTrackCard.tsx to src/components/track/unified-track-card.tsx if not already per FR-017
- [ ] T112 [US6] Move MinimalTrackCard.tsx to src/components/track/minimal-track-card.tsx per FR-017 (organize by feature)
- [ ] T113 [US6] Move scattered root-level components to feature directories per FR-017 (player/, studio/, library/)
- [ ] T114 [US6] Update all imports after file moves in src/ (update @/ import paths to match new structure)
- [ ] T115 [US6] Verify ESLint naming convention enforcement in src/components/ (run lint, fix violations)
- [ ] T116 [US6] Create component directory structure guide in docs/COMPONENT_STRUCTURE.md per FR-018 (document organization principles)
- [ ] T117 [US6] Update CLAUDE.md with naming conventions and component organization per FR-018 (document kebab-case/PascalCase standard)

**Checkpoint**: At this point, all components use kebab-case files, PascalCase exports, organized by feature, duplicates resolved

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, validation across all user stories

- [ ] T118 [P] Run bundle size analysis with npm run size and verify <950 KB per FR-022 (check consolidation impact)
- [ ] T119 [P] Run npm run size:why to analyze bundle changes per FR-024 (compare before/after consolidation)
- [ ] T120 [P] Generate bundle visualizer report with npm run visualizer per plan.md (identify large chunks for optimization)
- [ ] T121 [P] Run Jest tests with coverage npm run test:coverage and verify 80% hook coverage per FR-025, SC-011
- [ ] T122 [P] Run Playwright E2E tests for mobile npm run test:e2e:mobile per FR-027, SC-013 (verify touch targets, haptics on real devices)
- [ ] T123 [P] Run ESLint with naming convention check npm run lint per FR-014, FR-015 (verify kebab-case/PascalCase compliance)
- [ ] T124 Update quickstart.md with component migration examples per FR-020 (document how to migrate from old components)
- [ ] T125 Create migration guide docs/COMPONENT_MIGRATION_GUIDE.md per FR-020 (step-by-step migration from old to new components)
- [ ] T126 Add deprecation warnings to all deprecated components per FR-019 (console.warn about upcoming removal)
- [ ] T127 Update all imports from deprecated components per FR-021 (migrate to UnifiedTrackCard, Skeletons, etc.)
- [ ] T128 Delete deprecated components after migration per FR-002 (TrackCard.tsx, MinimalTrackCard.tsx, PublicTrackCard.tsx, TrackCardEnhanced.tsx)
- [ ] T129 Verify all existing functionality works per FR-021, SC-014, SC-015 (test play, like, share, version switching, swipe gestures)
- [ ] T130 Code cleanup: remove unused imports and comments in refactored components per plan.md
- [ ] T131 Final validation: run all tests, verify bundle size, check naming conventions per success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P2 → P3 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories (MVP candidate)
- **User Story 2 (P1)**: Can start after Foundational - Uses hooks created in US1 (can run in parallel with US1 implementation)
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1/US2/US3
- **User Story 5 (P3)**: Can start after Foundational - Independent of other stories
- **User Story 6 (P3)**: Can start after Foundational - Should run AFTER other stories (to avoid renaming files being actively worked on)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach)
- Hook types before hook implementations
- Base components before variant components
- Core implementation before gesture/haptic support
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- All tests for a user story marked [P] can run in parallel
- Hook implementations can run in parallel (different files)
- Variant implementations can run in parallel (different files)
- Different user stories can be worked on in parallel by different team members (after Foundational phase)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T017: Unit test for useTrackData hook
Task T018: Unit test for useTrackActions hook
Task T019: Unit test for useTrackVersionSwitcher hook
Task T020: Unit test for useRealtimeTrackUpdates hook
Task T021: Integration test for UnifiedTrackCard
Task T022: E2E test for track card swipe gestures

# Launch all variant implementations together:
Task T030: Implement grid variant
Task T031: Implement list variant
Task T032: Implement compact variant
Task T033: Implement minimal variant
Task T034: Implement enhanced variant
Task T035: Implement professional variant
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - Recommended)

1. Complete Phase 1: Setup (tooling configuration)
2. Complete Phase 2: Foundational (hook infrastructure)
3. Complete Phase 3: User Story 1 (UnifiedTrackCard + hooks)
4. **STOP and VALIDATE**: Test UnifiedTrackCard independently, verify bundle size, check touch targets
5. Deploy/demo if ready (track cards are most frequently used UI component)

### Incremental Delivery (All P1 Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (UnifiedTrackCard) → Test independently → Deploy/Demo
3. Add User Story 2 (Business Logic Extraction) → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories
5. P1 stories complete → Core refactoring done, largest impact achieved

### Full Implementation (All Stories)

1. Complete Setup + Foundational together
2. Complete P1 stories (US1, US2) → Major refactoring complete
3. Complete P2 stories (US3, US4) → Bundle optimization, modal consistency
4. Complete P3 stories (US5, US6) → Mobile polish, naming standardization
5. Polish phase → Full refactoring complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (UnifiedTrackCard + hooks)
   - Developer B: User Story 2 (Business Logic Extraction)
   - Developer C: User Story 3 (Skeleton Consolidation)
3. Stories complete and integrate independently
4. After P1 stories: Developer A: User Story 4, Developer B: User Story 5, Developer C: User Story 6

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests follow TDD approach (write first, ensure fail, then implement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Bundle size must stay under 950 KB (enforced by size-limit)
- 100% backward compatibility required (no breaking changes)
- Touch targets must be 44-56px minimum on mobile
- Haptic feedback required for all mobile interactions
- Motion preferences must be respected (prefers-reduced-motion)

---

## Success Criteria Validation

At the end of all phases, verify:

**Code Quality** (SC-001 to SC-004):
- ✅ Track cards reduced from 5 to 1 (eliminate ~1,800 lines)
- ✅ Skeleton files reduced from 3 to 1 (eliminate ~400 lines)
- ✅ Dialog components consolidated by 50% (98 → <49)
- ✅ Business logic extracted from 37+ components

**Developer Experience** (SC-005 to SC-007):
- ✅ Mobile component strategy documented
- ✅ Naming conventions standardized (kebab-case/PascalCase)
- ✅ Components organized by feature (player/, studio/, library/, track/)

**Bundle Size and Performance** (SC-008 to SC-010):
- ✅ Bundle size <950 KB
- ✅ Component count reduced by 10% (952 → <857)
- ✅ Skeleton animations respect prefers-reduced-motion (100%)

**Testing and Quality** (SC-011 to SC-013):
- ✅ Hook test coverage 80%+
- ✅ Touch targets meet 44-56px (100% compliance)
- ✅ Mobile testing complete on real devices

**Migration Safety** (SC-014 to SC-015):
- ✅ 100% backward compatibility maintained
- ✅ Zero production incidents (no regressions)

---

**Generated**: 2026-01-06
**Total Tasks**: 131
**Tasks by Story**: US1: 25, US2: 16, US3: 21, US4: 12, US5: 13, US6: 10, Setup/Foundational/Polish: 34
**Parallel Opportunities**: 65 tasks marked [P] (49% parallelizable)
