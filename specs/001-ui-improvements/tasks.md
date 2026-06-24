# Tasks: UI Improvement System

**Feature Branch**: `001-ui-improvements`
**Created**: 2026-01-24
**Updated**: 2026-01-24
**Specification**: [spec.md](./spec.md)
**Implementation Plan**: [plan.md](./plan.md)

---

## Task Overview

**Total Tasks**: 47
**Estimated Duration**: 8 weeks (4 sprints × 2 weeks)
**Dependencies**: See [plan.md](./plan.md#dependencies)

---

## Phase 1: Setup & Infrastructure

### Goal
Initialize project structure and dependencies for UI improvements.

### Tasks

- [ ] T001 Create component utilities directory structure in src/components/ui/utils/
- [ ] T002 Install @tanstack/react-virtual package if not already present
- [ ] T003 Update tailwind.config.ts with safe-area-inset CSS variables
- [ ] T004 Create gesture system directory structure in src/lib/gesture/

---

## Phase 2: Foundational Components (Blocking Prerequisites)

### Goal
Create core utility components that all user stories depend on.

### Tasks

- [ ] T005 Create TouchTarget component in src/components/ui/touch-target.tsx
- [ ] T006 Create SafeArea component in src/components/ui/safe-area.tsx
- [ ] T007 Create ResponsiveContainer component in src/components/ui/responsive-container.tsx
- [ ] T008 Create Skeleton component in src/components/ui/skeleton.tsx
- [ ] T009 Create color-tokens utility in src/lib/color-tokens.ts
- [ ] T010 Create z-index utility in src/lib/z-index.ts
- [ ] T011 Create useGestures hook in src/hooks/use-gestures.ts
- [ ] T012 Create GestureManager class in src/lib/gesture-manager.ts

---

## Phase 3: User Story 1 - Component Maintainability (P1)

### Goal
Split oversized components into focused subcomponents under 500 lines each.

### Independent Test Criteria
- [ ] All component files are under 500 lines
- [ ] Each subcomponent has single responsibility
- [ ] No functionality broken (verified by existing tests)

### Tasks

- [ ] T013 [US1] Create StudioShell directory structure in src/components/studio/unified/StudioShell/
- [ ] T014 [P] [US1] Create StudioShellHeader in src/components/studio/unified/StudioShell/StudioShellHeader.tsx
- [ ] T015 [P] [US1] Create StudioShellSidebar in src/components/studio/unified/StudioShell/StudioShellSidebar.tsx
- [ ] T016 [P] [US1] Create StudioShellMobileNav in src/components/studio/unified/StudioShell/StudioShellMobileNav.tsx
- [ ] T017 [P] [US1] Create StudioShellContent in src/components/studio/unified/StudioShell/StudioShellContent.tsx
- [ ] T018 [P] [US1] Create StudioShellTransportBar in src/components/studio/unified/StudioShell/StudioShellTransportBar.tsx
- [ ] T019 [P] [US1] Create StudioDialogs in src/components/studio/unified/StudioShell/StudioDialogs.tsx
- [ ] T020 [US1] Update StudioShell main wrapper in src/components/studio/unified/StudioShell/StudioShell.tsx
- [ ] T021 [US1] Update all StudioShell imports across codebase
- [ ] T022 [US1] Delete original StudioShell.tsx monolith file
- [ ] T023 [US1] Create UnifiedStudioContent directory structure in src/components/studio/unified/content/
- [ ] T024 [P] [US1] Create StudioAudioManager in src/components/studio/unified/content/StudioAudioManager.tsx
- [ ] T025 [P] [US1] Create StudioMixerControls in src/components/studio/unified/content/StudioMixerControls.tsx
- [ ] T026 [P] [US1] Create StudioSectionEditor in src/components/studio/unified/content/StudioSectionEditor.tsx
- [ ] T027 [P] [US1] Create StudioPlaybackControls in src/components/studio/unified/content/StudioPlaybackControls.tsx
- [ ] T028 [P] [US1] Create StudioTimeline in src/components/studio/unified/content/StudioTimeline.tsx
- [ ] T029 [US1] Update UnifiedStudioContent main wrapper in src/components/studio/unified/content/UnifiedStudioContent.tsx
- [ ] T030 [US1] Create QuickCompare directory structure in src/components/stem-studio/
- [ ] T031 [P] [US1] Create QuickCompareLogic in src/components/stem-studio/QuickCompareLogic.tsx
- [ ] T032 [P] [US1] Create QuickCompareWaveform in src/components/stem-studio/QuickCompareWaveform.tsx
- [ ] T033 [P] [US1] Create QuickCompareControls in src/components/stem-studio/QuickCompareControls.tsx
- [ ] T034 [US1] Create useQuickCompare hook in src/components/stem-studio/useQuickCompare.ts
- [ ] T035 [US1] Update QuickCompare main wrapper in src/components/stem-studio/QuickCompare.tsx

---

## Phase 4: User Story 2 - Design System Consistency (P1)

### Goal
Replace hardcoded colors and values with design tokens.

### Independent Test Criteria
- [ ] Zero hardcoded hex colors in component files (verified by grep)
- [ ] All spacing uses defined tokens
- [ ] Z-index conflicts resolved

### Tasks

- [ ] T036 [US2] Audit codebase for hardcoded colors using grep "#[0-9A-Fa-f]{6}"
- [ ] T037 [P] [US2] Migrate Button component to color-tokens in src/components/ui/button.tsx
- [ ] T038 [P] [US2] Migrate Card component to color-tokens in src/components/ui/card.tsx
- [ ] T039 [P] [US2] Migrate Dialog component to color-tokens in src/components/ui/dialog.tsx
- [ ] T040 [P] [US2] Migrate player components to color-tokens in src/components/player/
- [ ] T041 [US2] Update remaining hardcoded colors in feature components
- [ ] T042 [US2] Audit codebase for hardcoded z-index values
- [ ] T043 [US2] Replace hardcoded z-index with semantic zIndex utility

---

## Phase 5: User Story 3 - Mobile Gestures Without Conflicts (P1)

### Goal
Implement centralized gesture management with priority-based conflict resolution.

### Independent Test Criteria
- [ ] Double-tap executes without triggering single-tap
- [ ] Swipe gestures don't conflict with drag
- [ ] No unintended actions on mobile

### Tasks

- [ ] T044 [US3] Implement GestureManager class in src/lib/gesture-manager.ts
- [ ] T045 [US3] Implement useGestures hook in src/hooks/use-gestures.ts
- [ ] T046 [US3] Add gesture support to TrackCard component in src/components/library/TrackCard.tsx
- [ ] T047 [US3] Add gesture support to Player component in src/components/player/
- [ ] T048 [US3] Test gesture conflicts on real mobile devices

---

## Phase 6: User Story 4 - Responsive Layouts (P2)

### Goal
Ensure consistent responsive patterns across all screen sizes.

### Independent Test Criteria
- [ ] No horizontal scrolling on mobile (<640px)
- [ ] Sidebar appears on desktop (>=640px)
- [ ] Smooth adaptation at breakpoints

### Tasks

- [ ] T049 [US4] Audit all pages for responsive issues
- [ ] T050 [P] [US4] Add ResponsiveContainer to Index page in src/pages/Index.tsx
- [ ] T051 [P] [US4] Add ResponsiveContainer to Library page in src/pages/library/
- [ ] T052 [P] [US4] Add ResponsiveContainer to Generate page in src/pages/generate/
- [ ] T053 [US4] Test on multiple screen sizes (375px, 640px, 1024px, 1280px)

---

## Phase 7: User Story 5 - Fast Loading and Smooth Animations (P2)

### Goal
Optimize performance with virtualization and GPU-accelerated animations.

### Independent Test Criteria
- [ ] 60fps maintained while scrolling
- [ ] Only visible items rendered in lists
- [ ] Animations stay above 55fps

### Tasks

- [ ] T054 [US5] Create VirtualizedList component in src/components/ui/virtualized-list.tsx
- [ ] T055 [US5] Integrate VirtualizedList in TrackList component
- [ ] T056 [US5] Audit animations for GPU acceleration
- [ ] T057 [US5] Replace width/height animations with transform
- [ ] T058 [US5] Profile performance on target devices

---

## Phase 8: User Story 6 - Safe Area Handling (P2)

### Goal
Ensure content not obscured by notch/home indicator.

### Independent Test Criteria
- [ ] Headers below notch on iPhone X+
- [ ] Bottom controls above home indicator
- [ ] Modals respect all safe areas

### Tasks

- [ ] T059 [US6] Add SafeArea to MobileHeaderBar in src/components/mobile/MobileHeaderBar.tsx
- [ ] T060 [P] [US6] Add SafeArea to BottomNavigation in src/components/BottomNavigation.tsx
- [ ] T061 [P] [US6] Add SafeArea to MobileBottomSheet in src/components/mobile/MobileBottomSheet.tsx
- [ ] T062 [US6] Test on iPhone 14 Pro (Dynamic Island)

---

## Phase 9: User Story 7 - Touch Target Sizing (P3)

### Goal
Ensure all interactive elements meet 44px minimum.

### Independent Test Criteria
- [ ] All buttons >=44px on mobile
- [ ] Icon buttons have proper padding
- [ ] List items tappable (44px min height)

### Tasks

- [ ] T063 [US7] Audit interactive elements for touch target size
- [ ] T064 [P] [US7] Wrap small buttons with TouchTarget in src/components/ui/
- [ ] T065 [P] [US7] Wrap icon buttons with TouchTarget in player components
- [ ] T066 [P] [US7] Wrap list actions with TouchTarget in library components
- [ ] T067 [US7] Verify all touch targets with DevTools measurement

---

## Phase 10: User Story 8 - Loading States (P3)

### Goal
Show consistent loading indicators with skeleton screens.

### Independent Test Criteria
- [ ] Skeleton placeholders during data fetch
- [ ] No layout shift from loading states
- [ ] Consistent loading patterns

### Tasks

- [ ] T068 [US8] Create TrackCardSkeleton preset in src/components/ui/skeleton.tsx
- [ ] T069 [US8] Create ListSkeleton preset in src/components/ui/skeleton.tsx
- [ ] T070 [P] [US8] Add skeletons to TrackList in src/components/library/TrackList.tsx
- [ ] T071 [P] [US8] Add skeletons to PlaylistView in src/components/playlist/
- [ ] T072 [US8] Test loading states throughout app

---

## Phase 11: Polish & Cross-Cutting Concerns

### Goal
Final validation, documentation, and cleanup.

### Tasks

- [ ] T073 Run bundle size analysis with npm run size
- [ ] T074 Verify all components under 500 lines
- [ ] T075 Run ESLint and fix any warnings
- [ ] T076 Run TypeScript type check
- [ ] T077 Test on iPhone 12 (baseline iOS)
- [ ] T078 Test on Pixel 5 (baseline Android)
- [ ] T079 Test on iPhone 14 Pro (Dynamic Island)
- [ ] T080 Update CLAUDE.md with new component patterns
- [ ] T081 Create documentation for gesture system
- [ ] T082 Remove any deprecated code patterns

---

## Dependencies

### User Story Dependencies

```
US1 (Component Maintainability) - No dependencies
US2 (Design System) - No dependencies
US3 (Gestures) - No dependencies
US4 (Responsive) - Requires ResponsiveContainer (Phase 2)
US5 (Performance) - Requires VirtualizedList (created in phase)
US6 (Safe Areas) - Requires SafeArea (Phase 2)
US7 (Touch Targets) - Requires TouchTarget (Phase 2)
US8 (Loading States) - Requires Skeleton (Phase 2)
```

### Critical Path

1. Phase 2 (Foundational Components) - BLOCKS ALL USER STORIES
2. US1, US2, US3 (P1 stories) - Can run in parallel after Phase 2
3. US4, US5, US6 (P2 stories) - Can run in parallel after P1 stories
4. US7, US8 (P3 stories) - Can run in parallel after P2 stories

---

## Parallel Execution Opportunities

### Phase 2 (Foundational Components)
- T005-T012 can run in parallel (different files)

### US1 (Component Maintainability)
- T014-T019 can run in parallel (StudioShell subcomponents)
- T024-T028 can run in parallel (UnifiedStudioContent subcomponents)
- T031-T033 can run in parallel (QuickCompare subcomponents)

### US2 (Design System Consistency)
- T037-T041 can run in parallel (migrate different components)

### US4 (Responsive Layouts)
- T050-T052 can run in parallel (different pages)

### US6 (Safe Area Handling)
- T060-T061 can run in parallel (different components)

### US7 (Touch Target Sizing)
- T064-T066 can run in parallel (different component groups)

### US8 (Loading States)
- T070-T071 can run in parallel (different features)

---

## Implementation Strategy

### MVP Scope (Sprint 031)
Focus on highest priority items:
- Phase 1: Setup
- Phase 2: Foundational Components
- Phase 3: US1 (Component Maintainability) - Critical debt

### Incremental Delivery
- **Sprint 031**: Phases 1-3 (Setup + US1)
- **Sprint 032**: Phases 4-5 (US2 + US3)
- **Sprint 033**: Phases 6-8 (US4 + US5 + US6)
- **Sprint 034**: Ph 9-11 (US7 + US8 + Polish)

### Risk Mitigation
- All changes are additive first (new components)
- Migrations are incremental (no breaking changes)
- Existing functionality preserved throughout
- Can rollback individual phases if needed

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Component size | <500 lines | Code analysis |
| Hardcoded colors | 0 instances | grep scan |
| Gesture conflicts | 0 reports | Mobile testing |
| Touch targets | 44px min | DevTools measurement |
| Animation fps | >55fps | Performance profiling |
| Bundle size | <950KB | npm run size |

---

**Last Updated**: 2026-01-24
**Status**: Ready for implementation
