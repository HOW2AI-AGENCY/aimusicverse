# Tasks: Unified Telegram Mini App Interface Components

**Input**: Design documents from `/specs/003-unified-tma-interface/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Tests are NOT explicitly requested in the specification. This task list focuses on component implementation and migration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Project uses single project structure: `src/`, `tests/` at repository root
- Unified components: `src/components/unified-tma/`
- Supporting utilities: `src/lib/unified-tma/`, `src/hooks/unified-tma/`
- Stories: `.storybook/stories/unified-tma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [ ] T001 Create unified component directory structure src/components/unified-tma/ with subdirectories: core/, feedback/, layout/, studio/, primitives/
- [ ] T002 [P] Create supporting utilities directory src/lib/unified-tma/ with files: panel-state.ts, responsive.ts, animation-presets.ts
- [ ] T003 [P] Create hooks directory src/hooks/unified-tma/ with files: usePanelState.ts, useResponsive.ts, useReducedMotion.ts
- [ ] T004 [P] Add design tokens to src/index.css (panel heights, touch sizes, animation timings, bottom sheet variables)
- [ ] T005 [P] Create Storybook directory structure .storybook/stories/unified-tma/ with subdirectories: core/, feedback/, layout/, studio/, primitives/
- [ ] T006 Create centralized exports file src/components/unified-tma/index.ts
- [ ] T007 [P] Run npm run size to establish baseline bundle size

**Checkpoint**: Directory structure ready for component development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core primitives and utilities that ALL components depend on

**⚠️ CRITICAL**: No user story component work can begin until this phase is complete

- [ ] T008 Implement TouchTarget primitive in src/components/unified-tma/primitives/TouchTarget.tsx (minimum 44/48/56px enforcement, optional haptic integration)
- [ ] T009 Implement MotionWrapper primitive in src/components/unified-tma/primitives/MotionWrapper.tsx (animation presets: fade, slide-up, slide-down, scale with duration variants and prefers-reduced-motion support)
- [ ] T010 Implement ResponsiveContainer primitive in src/components/unified-tma/primitives/ResponsiveContainer.tsx (container query support with matchMedia fallback)
- [ ] T011 [P] Implement useReducedMotion hook in src/hooks/unified-tma/useReducedMotion.ts (detect prefers-reduced-motion setting)
- [ ] T012 [P] Implement useResponsive hook in src/hooks/unified-tma/useResponsive.ts (breakpoint detection with matchMedia API)
- [ ] T013 [P] Implement animation presets utility in src/lib/unified-tma/animation-presets.ts (standard preset configurations for MotionWrapper)
- [ ] T014 Update src/components/unified-tma/index.ts to export primitives and hooks

**Checkpoint**: Foundation ready - component implementation can now begin in parallel

---

## Phase 3: User Story 1 - Consistent Component Behavior Across All Screens (Priority: P1) 🎯 MVP

**Goal**: Implement core unified components (Button, SafeArea, Button, Modal, BottomSheet) with consistent touch targets, spacing, and animations

**Independent Test**: Navigate through all major screens (Home, Library, Studio, Player) and verify that buttons have minimum 44×44px touch targets, modals use 300ms animations, spacing follows design system (4/8/16/24/32px), and bottom sheets have identical drag handles and snap points

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement UnifiedButton in src/components/unified-tma/core/UnifiedButton.tsx (variants: primary/secondary/ghost/destructive, sizes: sm/md/lg/icon, haptic feedback integration, loading states, icon positioning)
- [ ] T016 [P] [US1] Implement UnifiedSafeArea in src/components/unified-tma/layout/UnifiedSafeArea.tsx (wrap TelegramContext safe area values, padding/margin modes, selective safe areas top/bottom/left/right)
- [ ] T017 [P] [US1] Create Storybook story for UnifiedButton in .storybook/stories/unified-tma/core/UnifiedButton.stories.tsx (all variants, sizes, states, icon positions)
- [ ] T018 [P] [US1] Create Storybook story for UnifiedSafeArea in .storybook/stories/unified-tma/layout/UnifiedSafeArea.stories.tsx (padding/margin modes, safe area combinations)
- [ ] T019 [US1] Implement UnifiedModal in src/components/unified-tma/core/UnifiedModal.tsx (center positioning, max-width constraints mobile/tablet, backdrop click-to-dismiss, ESC key handler, Radix Dialog primitive integration)
- [ ] T020 [US1] Implement UnifiedBottomSheet in src/components/unified-tma/core/UnifiedBottomSheet.tsx (snap points [0.5, 0.9], drag-to-dismiss with velocity threshold, spring animations damping:30 stiffness:300, backdrop with 0.4 opacity, keyboard trap, drag handle)
- [ ] T021 [P] [US1] Create Storybook story for UnifiedModal in .storybook/stories/unified-tma/core/UnifiedModal.stories.tsx (center modal variants, backdrop options, keyboard interactions)
- [ ] T022 [P] [US1] Create Storybook story for UnifiedBottomSheet in .storybook/stories/unified-tma/core/UnifiedBottomSheet.stories.tsx (snap point variations, dismissible/non-dismissible, with/without handle)
- [ ] T023 [US1] Migrate MobileBottomSheet.tsx to use UnifiedBottomSheet in src/components/mobile/MobileBottomSheet.tsx (update props API to match UnifiedBottomSheet)
- [ ] T024 [US1] Run npm run size and verify bundle increase ≤15 KB (target: US1 components add ~10-12 KB)

**Checkpoint**: At this point, User Story 1 should be fully functional - core components (Button, SafeArea, Modal, BottomSheet) work consistently across screens with proper touch targets and animations

---

## Phase 4: User Story 2 - Mobile-Optimized Touch Interface (Priority: P1)

**Goal**: Implement touch-optimized components (Panel, Drawer, Grid, Stack) with gesture support and viewport adjustments

**Independent Test**: Test all common gestures (tap, long-press, swipe, drag) across all interactive elements on mobile device and verify touch targets ≥44×44px with 8px spacing, keyboard viewport adjustment, smooth 60 FPS swipes, haptic feedback on long-press, safe area clearance ≥16px

### Implementation for User Story 2

- [ ] T025 [P] [US2] Implement UnifiedPanel in src/components/unified-tma/core/UnifiedPanel.tsx (composition API with header/content/footer slots, scroll behavior variants, background variants solid/glass/transparent, z-index from existing hierarchy)
- [ ] T026 [P] [US2] Implement UnifiedDrawer in src/components/unified-tma/core/UnifiedDrawer.tsx (side variants left/right, width variants mobile 85vw tablet 400px, overlay backdrop, slide animations)
- [ ] T027 [P] [US2] Implement UnifiedGrid in src/components/unified-tma/layout/UnifiedGrid.tsx (responsive columns using container queries with matchMedia fallback, cols object xs/sm/md/lg/xl, gap variants tight/normal/loose, alignment options)
- [ ] T028 [P] [US2] Implement UnifiedStack in src/components/unified-tma/layout/UnifiedStack.tsx (vertical/horizontal orientation, gap variants, alignment options, responsive spacing)
- [ ] T029 [P] [US2] Create Storybook story for UnifiedPanel in .storybook/stories/unified-tma/core/UnifiedPanel.stories.tsx (composition examples, scroll variants, background variants)
- [ ] T030 [P] [US2] Create Storybook story for UnifiedDrawer in .storybook/stories/unified-tma/core/UnifiedDrawer.stories.tsx (left/right sides, width variants, overlay options)
- [ ] T031 [P] [US2] Create Storybook story for UnifiedGrid in .storybook/stories/unified-tma/layout/UnifiedGrid.stories.tsx (responsive column examples, gap variants, alignment demos)
- [ ] T032 [P] [US2] Create Storybook story for UnifiedStack in .storybook/stories/unified-tma/layout/UnifiedStack.stories.tsx (vertical/horizontal orientation, gap spacing, nested stacks)
- [ ] T033 [US2] Implement UnifiedPageLayout in src/components/unified-tma/layout/UnifiedPageLayout.tsx (standard page wrapper with safe areas, header/content/footer composition, scroll container)
- [ ] T034 [P] [US2] Create Storybook story for UnifiedPageLayout in .storybook/stories/unified-tma/layout/UnifiedPageLayout.stories.tsx (page layout examples with headers/footers)
- [ ] T035 [US2] Run npm run size and verify cumulative bundle increase ≤25 KB (target: US1+US2 components add ~20-23 KB total)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - touch-optimized layouts and panels available with proper gesture support and viewport handling

---

## Phase 5: User Story 3 - Unified Panel System for Studio Features (Priority: P2)

**Goal**: Implement Studio-specific panel components (StudioPanelHeader, StudioPanelContent, StudioPanelFooter) and panel state persistence

**Independent Test**: Open each Studio tool (stems, mixer, MIDI, section editor) and verify identical header height (56px), close button placement (top-right), title typography, scroll position persistence, panel stacking, consistent notification position (bottom, 80px from edge)

### Implementation for User Story 3

- [ ] T036 [P] [US3] Implement StudioPanelHeader in src/components/unified-tma/studio/StudioPanelHeader.tsx (standard 56px height, close button top-right 44×44px, title typography text-lg font-semibold, action menu slot, sticky positioning option)
- [ ] T037 [P] [US3] Implement StudioPanelContent in src/components/unified-tma/studio/StudioPanelContent.tsx (scroll container with safe area padding, pull-to-refresh integration optional, virtualization support forward ref to Virtuoso, state persistence)
- [ ] T038 [P] [US3] Implement StudioPanelFooter in src/components/unified-tma/studio/StudioPanelFooter.tsx (fixed bottom position with safe area, action button layout 1-3 buttons, progress bar slot optional)
- [ ] T039 [P] [US3] Implement usePanelState hook in src/hooks/unified-tma/usePanelState.ts (save/restore panel state from sessionStorage, state shape: scrollY, expanded sections, form values)
- [ ] T040 [P] [US3] Implement panel state utility in src/lib/unified-tma/panel-state.ts (sessionStorage helpers, state serialization/deserialization, quota management)
- [ ] T041 [P] [US3] Create Storybook story for StudioPanelHeader in .storybook/stories/unified-tma/studio/StudioPanelHeader.stories.tsx (with/without action menu, sticky variants)
- [ ] T042 [P] [US3] Create Storybook story for StudioPanelContent in .storybook/stories/unified-tma/studio/StudioPanelContent.stories.tsx (scrollable content, state persistence demo)
- [ ] T043 [P] [US3] Create Storybook story for StudioPanelFooter in .storybook/stories/unified-tma/studio/StudioPanelFooter.stories.tsx (1-3 button layouts, progress bar examples)
- [ ] T044 [US3] Migrate StudioMixerPanel to use Studio panel components in src/components/studio/unified/StudioMixerPanel.tsx (replace custom header/content/footer with StudioPanelHeader/Content/Footer composition)
- [ ] T045 [US3] Migrate StudioTranscriptionPanel to use Studio panel components in src/components/studio/unified/StudioTranscriptionPanel.tsx (apply UnifiedPanel composition)
- [ ] T046 [US3] Migrate StudioNotationPanel to use Studio panel components in src/components/studio/unified/StudioNotationPanel.tsx (apply UnifiedPanel composition)
- [ ] T047 [US3] Run npm run size and verify cumulative bundle increase ≤35 KB (target: US1+US2+US3 components add ~30-33 KB total)

**Checkpoint**: All Studio panels now use unified panel system with consistent headers, state persistence, and stacking behavior

---

## Phase 6: User Story 4 - Responsive Layout Adaptation (Priority: P2)

**Goal**: Verify responsive behavior across breakpoints and ensure layout adaptations work correctly

**Independent Test**: View app on devices at breakpoints (375px, 640px, 768px, 1024px) and verify layout adapts appropriately - single-column <640px, responsive grid 640-1024px, multi-panel layout >1024px, font scaling per device

### Implementation for User Story 4

- [ ] T048 [P] [US4] Implement responsive utility in src/lib/unified-tma/responsive.ts (breakpoint constants, matchMedia helpers, container query detection)
- [ ] T049 [US4] Update UnifiedGrid to support all responsive breakpoints in src/components/unified-tma/layout/UnifiedGrid.tsx (verify xs:375px, sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px)
- [ ] T050 [US4] Update UnifiedPageLayout for responsive font scaling in src/components/unified-tma/layout/UnifiedPageLayout.tsx (14px mobile, 16px tablet, 18px desktop)
- [ ] T051 [P] [US4] Create Playwright E2E test for responsive behavior in tests/e2e/unified-components-responsive.spec.ts (test all breakpoints 375px, 640px, 768px, 1024px)
- [ ] T052 [P] [US4] Create Storybook responsive viewport addon stories in .storybook/stories/unified-tma/Responsive.stories.tsx (showcase all components at different breakpoints)
- [ ] T053 [US4] Manually test responsive layouts on real devices (iPhone SE 375px, iPhone 12 390px, iPad 768px, iPad Pro 1024px)

**Checkpoint**: Responsive layouts confirmed working across all target devices and breakpoints

---

## Phase 7: User Story 5 - Accessible Color and Contrast System (Priority: P3)

**Goal**: Implement feedback components (Skeleton, Spinner, ErrorState, Toast) with WCAG AA compliance and theme support

**Independent Test**: Switch between light/dark modes and run automated contrast checkers, verify all text/background combinations meet WCAG AA (4.5:1 normal text, 3:1 large text/UI), interactive elements distinguishable beyond color, smooth theme transitions

### Implementation for User Story 5

- [ ] T054 [P] [US5] Implement UnifiedSkeleton in src/components/unified-tma/feedback/UnifiedSkeleton.tsx (variants text/card/list/custom, shimmer animation 1.5s loop with design token, prefers-reduced-motion support, ARIA role="status" aria-busy="true")
- [ ] T055 [P] [US5] Implement UnifiedSpinner in src/components/unified-tma/feedback/UnifiedSpinner.tsx (sizes sm/md/lg 16px/24px/40px, color variants primary/muted/generate, backdrop overlay option)
- [ ] T056 [P] [US5] Implement UnifiedErrorState in src/components/unified-tma/feedback/UnifiedErrorState.tsx (types offline/404/500/generic with lazy-loaded illustrations, retry button integration, contact support link, ARIA role="alert" aria-live="assertive")
- [ ] T057 [P] [US5] Implement UnifiedEmptyState in src/components/unified-tma/feedback/UnifiedEmptyState.tsx (empty state messaging, illustration variants, action button slot)
- [ ] T058 [P] [US5] Implement UnifiedToast in src/components/unified-tma/feedback/UnifiedToast.tsx (wrap sonner toast, position variants bottom/top, type variants info/success/error/warning)
- [ ] T059 [P] [US5] Create Storybook story for UnifiedSkeleton in .storybook/stories/unified-tma/feedback/UnifiedSkeleton.stories.tsx (all variants, animated/static, light/dark themes)
- [ ] T060 [P] [US5] Create Storybook story for UnifiedSpinner in .storybook/stories/unified-tma/feedback/UnifiedSpinner.stories.tsx (all sizes, color variants, backdrop options)
- [ ] T061 [P] [US5] Create Storybook story for UnifiedErrorState in .storybook/stories/unified-tma/feedback/UnifiedErrorState.stories.tsx (all error types with illustrations, retry patterns)
- [ ] T062 [P] [US5] Create Storybook story for UnifiedEmptyState in .storybook/stories/unified-tma/feedback/UnifiedEmptyState.stories.tsx (empty state examples, action button variations)
- [ ] T063 [P] [US5] Create Storybook story for UnifiedToast in .storybook/stories/unified-tma/feedback/UnifiedToast.stories.tsx (all positions, all types, duration variants)
- [ ] T064 [US5] Migrate TrackCardSkeleton to use UnifiedSkeleton in src/components/library/TrackCardSkeleton.tsx
- [ ] T065 [US5] Migrate GenerationFormSkeleton to use UnifiedSkeleton in src/components/generate-form/GenerationFormSkeleton.tsx
- [ ] T066 [US5] Migrate ProfileSkeleton to use UnifiedSkeleton in src/components/profile/ProfileSkeleton.tsx
- [ ] T067 [US5] Migrate ActivitySkeleton to use UnifiedSkeleton in src/components/activity/ActivitySkeleton.tsx
- [ ] T068 [US5] Migrate StatCardSkeleton to use UnifiedSkeleton in src/components/stats/StatCardSkeleton.tsx
- [ ] T069 [P] [US5] Run axe-core automated accessibility tests in tests/unit/components/unified-tma/accessibility.test.ts (verify WCAG AA compliance, contrast ratios, ARIA attributes)
- [ ] T070 [US5] Run npm run size and verify cumulative bundle increase ≤45 KB (target: US1+US2+US3+US4+US5 components add ~40-43 KB total)

**Checkpoint**: All feedback components (loading, error, empty states) available with WCAG AA compliance and theme support

---

## Phase 8: User Story 6 - Loading and Error State Consistency (Priority: P3)

**Goal**: Migrate high-traffic screens to unified components and validate consistency

**Independent Test**: Trigger loading states (navigate to slow screens) and error conditions (disconnect network) across all major features and verify consistent skeleton screens with shimmer, spinners with descriptive text, error messages with clear actions, no technical jargon in user-facing messages

### Implementation for User Story 6

- [ ] T071 [US6] Migrate Library screen to use unified components in src/pages/LibraryPage.tsx (UnifiedSkeleton for loading, UnifiedErrorState for errors, UnifiedGrid for responsive layout)
- [ ] T072 [US6] Migrate Player modals to use UnifiedBottomSheet in src/components/player/PlayerQueueSheet.tsx and src/components/player/VersionSwitcherSheet.tsx
- [ ] T073 [US6] Migrate Generate form error states to use UnifiedErrorState in src/components/generate-form/GenerateForm.tsx
- [ ] T074 [US6] Migrate Studio loading states to use UnifiedSkeleton in src/pages/studio-v2/UnifiedStudioPage.tsx
- [ ] T075 [US6] Update track action sheets to use UnifiedBottomSheet in src/components/track-actions/TrackActionsSheet.tsx
- [ ] T076 [US6] Update playlist action modals to use UnifiedModal in src/components/playlist/PlaylistActionsModal.tsx
- [ ] T077 [US6] Update settings panels to use UnifiedPanel in src/pages/SettingsPage.tsx
- [ ] T078 [US6] Update profile screens to use unified layouts in src/pages/ProfilePage.tsx
- [ ] T079 [US6] Update onboarding flow to use unified components in src/components/onboarding/OnboardingFlow.tsx
- [ ] T080 [US6] Update search results to use UnifiedGrid in src/pages/SearchPage.tsx
- [ ] T081 [US6] Verify error state consistency across all migrated screens (user-friendly messages, consistent retry/dismiss actions)

**Checkpoint**: All major screens migrated to unified components with consistent loading/error states

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility audit, performance testing, documentation

- [ ] T082 [P] Update CLAUDE.md with unified component usage guidelines (MotionWrapper usage, TouchTarget enforcement, component import patterns)
- [ ] T083 [P] Create migration guide document in specs/003-unified-tma-interface/MIGRATION_GUIDE.md (before/after examples, step-by-step migration checklist)
- [ ] T084 [P] Run comprehensive accessibility audit with screen readers (NVDA on Windows, VoiceOver on iOS, TalkBack on Android)
- [ ] T085 [P] Run Lighthouse accessibility tests on all major pages (target ≥95 score)
- [ ] T086 [P] Run performance tests on target devices (iPhone 11, mid-range Android 2020) and verify 60 FPS animations
- [ ] T087 [P] Run bundle size validation with npm run size:why and document component-by-component impact
- [ ] T088 [P] Create Playwright E2E test suite for unified components in tests/e2e/unified-components.spec.ts (touch targets, animations, keyboard navigation, gesture support)
- [ ] T089 [P] Run visual regression tests with Storybook Chromatic (capture baselines for all component variants)
- [ ] T090 [P] Validate prefers-reduced-motion support across all components (disable animations when user preference set)
- [ ] T091 [P] Validate safe area handling on devices with notch/island (iPhone 12/13/14 Pro)
- [ ] T092 [P] Validate keyboard appearance viewport adjustment (test with on-screen keyboard on mobile)
- [ ] T093 Code cleanup: remove old unused components replaced by unified components
- [ ] T094 Code cleanup: consolidate duplicate framer-motion imports to use MotionWrapper or @/lib/motion
- [ ] T095 Final bundle size check: verify total bundle size ≤950 KB and unified components added <50 KB (ideally -40 KB net savings from tree-shaking)
- [ ] T096 Run quickstart.md validation: test all code examples in quickstart guide work correctly
- [ ] T097 Update package.json scripts if needed for component development workflows
- [ ] T098 Git commit all unified components with descriptive message referencing spec 003-unified-tma-interface

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User Story 1 (P1) - Consistent Components: Can start after Foundational
  - User Story 2 (P1) - Touch Interface: Can start after Foundational, builds on US1 components
  - User Story 3 (P2) - Studio Panels: Depends on US1 (UnifiedPanel) and US2 (layout components)
  - User Story 4 (P2) - Responsive Layouts: Can start after Foundational, validates US1-US3
  - User Story 5 (P3) - Accessibility: Can start after Foundational, independent feedback components
  - User Story 6 (P3) - Loading/Error Consistency: Depends on US1+US5 (components + feedback states)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 Button/SafeArea but can proceed in parallel
- **User Story 3 (P2)**: Depends on US1 Panel components - Start after T025 (UnifiedPanel) complete
- **User Story 4 (P2)**: Can start after Foundational - Validates existing US1-US3 components
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent feedback components
- **User Story 6 (P3)**: Depends on US1 (modals/sheets) + US5 (skeletons/errors) - Start after T070 complete

### Within Each User Story

- Storybook stories can be created in parallel with implementation (marked [P])
- Component implementations within same story can run in parallel if different files (marked [P])
- Migration tasks depend on component implementation completing first
- Bundle size checks run at end of each story phase

### Parallel Opportunities

**Setup Phase (Phase 1)**: All tasks except T001 can run in parallel
- T002, T003, T004, T005, T007 can run in parallel after T001 completes

**Foundational Phase (Phase 2)**:
- T008, T009, T010 (components) can run in parallel
- T011, T012, T013 (hooks/utils) can run in parallel with components

**User Story 1 (Phase 3)**:
- T015, T016 (components) can run in parallel
- T017, T018 (Storybook) can run in parallel with implementation
- T021, T022 (Storybook) can run in parallel

**User Story 2 (Phase 4)**:
- T025, T026, T027, T028 (all components) can run in parallel
- T029, T030, T031, T032, T034 (all Storybook) can run in parallel

**User Story 3 (Phase 5)**:
- T036, T037, T038, T039, T040 (all components/hooks/utils) can run in parallel
- T041, T042, T043 (all Storybook) can run in parallel
- T044, T045, T046 (migrations) can run in parallel after components complete

**User Story 5 (Phase 7)**:
- T054, T055, T056, T057, T058 (all components) can run in parallel
- T059, T060, T061, T062, T063 (all Storybook) can run in parallel
- T064, T065, T066, T067, T068 (all migrations) can run in parallel

**User Story 6 (Phase 8)**:
- All migration tasks T071-T080 can run in parallel (different files)

**Polish Phase (Phase 9)**:
- Most tasks marked [P] can run in parallel (T082-T092)

---

## Parallel Example: User Story 1 (Consistent Components)

```bash
# Launch all core components together:
Task T015: "Implement UnifiedButton in src/components/unified-tma/core/UnifiedButton.tsx"
Task T016: "Implement UnifiedSafeArea in src/components/unified-tma/layout/UnifiedSafeArea.tsx"

# Launch Storybook stories in parallel:
Task T017: "Create Storybook story for UnifiedButton"
Task T018: "Create Storybook story for UnifiedSafeArea"

# After T015-T018 complete, launch next batch:
Task T019: "Implement UnifiedModal"
Task T020: "Implement UnifiedBottomSheet"
Task T021: "Create Storybook story for UnifiedModal"
Task T022: "Create Storybook story for UnifiedBottomSheet"
```

---

## Parallel Example: User Story 5 (Accessibility)

```bash
# Launch all feedback components together:
Task T054: "Implement UnifiedSkeleton"
Task T055: "Implement UnifiedSpinner"
Task T056: "Implement UnifiedErrorState"
Task T057: "Implement UnifiedEmptyState"
Task T058: "Implement UnifiedToast"

# Launch all Storybook stories together:
Task T059: "Create Storybook story for UnifiedSkeleton"
Task T060: "Create Storybook story for UnifiedSpinner"
Task T061: "Create Storybook story for UnifiedErrorState"
Task T062: "Create Storybook story for UnifiedEmptyState"
Task T063: "Create Storybook story for UnifiedToast"

# Launch all skeleton migrations together:
Task T064: "Migrate TrackCardSkeleton"
Task T065: "Migrate GenerationFormSkeleton"
Task T066: "Migrate ProfileSkeleton"
Task T067: "Migrate ActivitySkeleton"
Task T068: "Migrate StatCardSkeleton"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Consistent Components - P1)
4. Complete Phase 4: User Story 2 (Touch Interface - P1)
5. **STOP and VALIDATE**: Test US1+US2 independently on real mobile devices
6. Deploy/demo if ready - core components functional

**Deliverable**: Core unified components (Button, SafeArea, Modal, BottomSheet, Panel, Drawer, Grid) working consistently with proper touch targets and animations

### Incremental Delivery (All User Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (P1) → Test independently → Partial Deploy (core components)
3. Add User Story 2 (P1) → Test independently → Partial Deploy (+ touch-optimized layouts)
4. Add User Story 3 (P2) → Test independently → Partial Deploy (+ Studio panels)
5. Add User Story 4 (P2) → Test independently → Partial Deploy (+ responsive validation)
6. Add User Story 5 (P3) → Test independently → Partial Deploy (+ feedback/accessibility)
7. Add User Story 6 (P3) → Test independently → Full Deploy (+ wide adoption)
8. Complete Polish → Final Deploy

**Each story adds value without breaking previous stories**

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Phase 1-2)
2. **Once Foundational is done, split work**:
   - Developer A: User Story 1 (Consistent Components - P1)
   - Developer B: User Story 2 (Touch Interface - P1)
   - Developer C: User Story 5 (Accessibility - P3) - Can start in parallel
3. **After US1+US2 complete**:
   - Developer A: User Story 3 (Studio Panels - P2) - Depends on US1
   - Developer B: User Story 4 (Responsive - P2) - Validates US1-US3
4. **After US1+US5 complete**:
   - Developer C: User Story 6 (Loading/Error - P3) - Depends on US1+US5
5. **All developers**: Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label (US1, US2, etc.) maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Bundle size checks at end of each user story phase (T024, T035, T047, T070, T095)
- Storybook stories created in parallel with component implementation
- Migration tasks depend on component implementation completing first
- Accessibility validation runs throughout (not just at end)
- Performance testing happens in Polish phase but monitored continuously
- Commit after each logical group of tasks (e.g., after completing a component + story)
- Stop at any checkpoint to validate story independently before proceeding

---

## Success Validation Checklist

After completing all tasks, verify:

- [ ] Bundle size ≤950 KB total (target: <50 KB added, ideally -40 KB net savings)
- [ ] All touch targets ≥44×44px (tested on real devices)
- [ ] 95+ Lighthouse accessibility score across all pages
- [ ] 60 FPS animations on iPhone 11+ and mid-range Android 2020+
- [ ] WCAG AA contrast compliance (4.5:1 text, 3:1 UI)
- [ ] Skeleton screens load ≤200ms on 4G
- [ ] All bottom sheets use snap points [0.5, 0.9]
- [ ] All modals/sheets support swipe-to-dismiss
- [ ] All animations ≤300ms
- [ ] All components respect safe areas (16px minimum clearance)
- [ ] prefers-reduced-motion supported throughout
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader testing passed (NVDA, VoiceOver, TalkBack)
- [ ] All components have Storybook stories
- [ ] Migration guide complete with examples
- [ ] CLAUDE.md updated with usage guidelines

---

## Total Task Count: 98 tasks

**Breakdown by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (US1 - P1): 10 tasks
- Phase 4 (US2 - P1): 11 tasks
- Phase 5 (US3 - P2): 12 tasks
- Phase 6 (US4 - P2): 6 tasks
- Phase 7 (US5 - P3): 17 tasks
- Phase 8 (US6 - P3): 11 tasks
- Phase 9 (Polish): 17 tasks

**Breakdown by User Story**:
- US1 (Consistent Components - P1): 10 implementation tasks
- US2 (Touch Interface - P1): 11 implementation tasks
- US3 (Studio Panels - P2): 12 implementation tasks
- US4 (Responsive Layouts - P2): 6 validation tasks
- US5 (Accessibility - P3): 17 implementation tasks
- US6 (Loading/Error Consistency - P3): 11 migration tasks

**Parallel Opportunities**:
- 58 tasks marked [P] can run in parallel (59% of tasks)
- Setup phase: 5 parallel tasks
- Foundational phase: 6 parallel tasks
- US1: 4 parallel tasks
- US2: 8 parallel tasks
- US3: 8 parallel tasks
- US4: 4 parallel tasks
- US5: 10 parallel tasks
- US6: 10 parallel tasks
- Polish: 11 parallel tasks

**Suggested MVP Scope**:
- Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1) + Phase 4 (US2) = **35 tasks**
- Delivers: Core unified components (Button, SafeArea, Modal, BottomSheet, Panel, Drawer, Grid, Stack) with consistent behavior and touch optimization
- Estimated timeline: 1-1.5 weeks with 2 developers working in parallel

**Format Validation**: ✅ ALL 98 tasks follow the required checklist format:
- Every task starts with `- [ ]` (checkbox)
- Every task has sequential ID (T001-T098)
- Parallel tasks marked with [P]
- User story tasks marked with [US1], [US2], [US3], [US4], [US5], or [US6]
- Every task includes file path in description
- Setup/Foundational/Polish tasks have no [Story] label (correct)
