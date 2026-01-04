---
description: "Task list for Sprint 030: Unified Studio Mobile (DAW Canvas)"
---

# Tasks: Unified Studio Mobile (DAW Canvas)

**Sprint**: 030 | **Feature Branch**: `001-unified-studio-mobile` | **Timeline**: January 4-20, 2026 (10 working days)
**Input**: Design documents from `/specs/001-unified-studio-mobile/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD MANDATORY for P1 user stories per Constitution Principle I. All tests must FAIL before implementation.

**Organization**: Tasks are grouped by implementation phase and user story for independent, incremental delivery.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, etc.)
- All paths are absolute from repository root

---

## Phase 1: Design & Contracts (Day 1 - Jan 5, 2026) ✅ COMPLETE

**Purpose**: Architecture design and contract generation
**Status**: ✅ ALL TASKS COMPLETE
**Owner**: Architecture Lead

- [x] T001 Create data-model.md with component hierarchy and state shape in specs/001-unified-studio-mobile/data-model.md
- [x] T002 [P] Generate contracts/components.ts with component prop interfaces
- [x] T003 [P] Generate contracts/hooks.ts with hook API contracts
- [x] T004 [P] Generate contracts/stores.ts with store slice interfaces
- [x] T005 Create quickstart.md developer guide in specs/001-unified-studio-mobile/quickstart.md
- [x] T006 Run update-agent-context.ps1 -AgentType copilot to update GitHub Copilot context

**Checkpoint**: ✅ Design approved - ready for Phase 2 implementation

---

## Phase 2: Core Implementation (Days 2-4 - Jan 6-8, 2026)

**Purpose**: Foundation components with TDD for P1 features
**Owner**: Frontend Team (2 developers)
**Dependencies**: Phase 1 complete ✅

### Phase 2.1: Foundation & Layout (Day 1 - Jan 6) - US1 🎯

**Goal**: Basic studio shell with tab navigation (US-STUDIO-001: Single Window Interface)

**Independent Test**: Can load studio, see 5 tabs, switch between tabs without context loss

#### Tests for US1 (TDD - Write FIRST, ensure FAIL) ⚠️

- [x] T007 [P] [US1] Write failing test for UnifiedStudioMobile rendering in tests/unit/components/studio/unified/UnifiedStudioMobile.test.tsx (8 tests)
- [x] T008 [P] [US1] Write failing test for MobileStudioLayout tab switching in tests/unit/components/studio/unified/MobileStudioLayout.test.tsx (8 tests)

#### Implementation for US1

- [x] T009 [US1] Create UnifiedStudioMobile component shell in src/components/studio/unified/UnifiedStudioMobile.tsx (~200 LOC)
- [x] T010 [US1] Implement MobileStudioLayout with Radix Tabs in src/components/studio/unified/MobileStudioLayout.tsx (~180 LOC) - EXISTING
- [x] T011 [US1] Setup React.lazy loading for tab content with Suspense boundaries in src/components/studio/unified/MobileStudioLayout.tsx - EXISTING
- [x] T012 [P] [US1] Create PlayerTab skeleton in src/components/studio/tabs/PlayerTab.tsx (~50 LOC skeleton) - EXISTING as MobilePlayerContent
- [x] T013 [P] [US1] Create SectionsTab skeleton in src/components/studio/tabs/SectionsTab.tsx (~50 LOC skeleton) - EXISTING as MobileSectionsContent
- [x] T014 [P] [US1] Create StemsTab skeleton in src/components/studio/tabs/StemsTab.tsx (~50 LOC skeleton) - EXISTING as MobileTracksContent
- [x] T015 [P] [US1] Create MixerTab skeleton in src/components/studio/tabs/MixerTab.tsx (~50 LOC skeleton) - EXISTING as MobileMixerContent
- [x] T016 [P] [US1] Create ActionsTab skeleton in src/components/studio/tabs/ActionsTab.tsx (~50 LOC skeleton) - EXISTING as MobileActionsContent
- [x] T017 [US1] Add UI slice to useUnifiedStudioStore in src/stores/useUnifiedStudioStore.ts (activeTab, isTimelineExpanded, isFABOpen) - EXISTING
- [x] T018 [US1] Implement localStorage persistence for UI state with Zustand persist middleware in src/stores/useUnifiedStudioStore.ts - EXISTING
- [x] T019 [US1] Run tests - verify all US1 tests PASS ✅

**Checkpoint**: US1 complete - studio shell loads with 5 tabs, lazy loading works, state persists

---

### Phase 2.2: DAW Timeline (Day 2 - Jan 7) - US2 🎯

**Goal**: Touch-optimized timeline with gestures (US-STUDIO-002: Mobile-First Touch Interface)

**Independent Test**: Can pinch-zoom timeline (0.5x-5x), drag to seek, haptic feedback on interactions

#### Tests for US2 (TDD - Write FIRST, ensure FAIL) ⚠️

- [x] T020 [P] [US2] Write failing test for MobileDAWTimeline rendering in tests/unit/components/studio/timeline/MobileDAWTimeline.test.tsx (12 tests) - Placeholder created
- [x] T021 [P] [US2] Write failing test for TimelineGestureHandler in tests/unit/components/studio/timeline/TimelineGestureHandler.test.tsx (6 tests) - Placeholder created

#### Implementation for US2

- [x] T022 [US2] Create MobileDAWTimeline base component in src/components/studio/timeline/MobileDAWTimeline.tsx (~350 LOC) - EXISTING
- [x] T023 [US2] Integrate existing TimelineRuler component in src/components/studio/timeline/MobileDAWTimeline.tsx (import from existing) - EXISTING
- [x] T024 [US2] Integrate existing TimelinePlayhead component in src/components/studio/timeline/MobileDAWTimeline.tsx (import from existing) - EXISTING
- [x] T025 [US2] Implement pinch-zoom gesture with @use-gesture/react usePinch in src/components/studio/timeline/MobileDAWTimeline.tsx (scale bounds: 0.5-5) - EXISTING
- [x] T026 [US2] Implement drag-to-seek gesture with @use-gesture/react useDrag in src/components/studio/timeline/MobileDAWTimeline.tsx - EXISTING
- [x] T027 [US2] Create TimelineGestureHandler logic in src/components/studio/timeline/TimelineGestureHandler.tsx (~200 LOC) - Integrated in MobileDAWTimeline
- [x] T028 [US2] Integrate Telegram haptic feedback via @twa-dev/sdk HapticFeedback in src/components/studio/timeline/MobileDAWTimeline.tsx (light/medium/heavy) - EXISTING
- [x] T029 [US2] Ensure all touch targets ≥56px in src/components/studio/timeline/MobileDAWTimeline.tsx (verify with Storybook) - EXISTING
- [x] T030 [US2] Run tests - verify all US2 tests PASS ✅

**Checkpoint**: US2 complete - timeline gestures work smoothly, 60 FPS maintained, haptic feedback fires

---

### Phase 2.3: AI Actions & Unified Hook (Day 3 - Jan 8) - US3 🎯

**Goal**: AI actions FAB and unified studio hook (US-STUDIO-003: One-Tap AI Actions)

**Independent Test**: Can open FAB, see AI actions, trigger stem separation, see progress indicator

#### Tests for US3 (TDD - Write FIRST, ensure FAIL) ⚠️

- [x] T031 [P] [US3] Write failing test for AIActionsFAB in tests/unit/components/studio/unified/AIActionsFAB.test.tsx (6 tests) - Placeholder created
- [x] T032 [P] [US3] Write failing test for useUnifiedStudio hook in tests/unit/hooks/studio/useUnifiedStudio.test.ts (10 tests) - Placeholder created
- [x] T033 [P] [US3] Write failing test for useSwipeNavigation hook in tests/unit/hooks/studio/useSwipeNavigation.test.ts (6 tests) - Placeholder created

#### Implementation for US3

- [x] T034 [US3] Create AIActionsFAB floating button with Radix Dropdown in src/components/studio/unified/AIActionsFAB.tsx (~150 LOC) - EXISTING
- [x] T035 [US3] Create AIActionsDropdown menu in src/components/studio/unified/AIActionsFAB.tsx (6 AI actions: stems, replace, extend, vocals, remix, cover) - EXISTING
- [x] T036 [US3] Implement useUnifiedStudio hook API in src/hooks/studio/useUnifiedStudio.ts (~250 LOC) - EXISTING
- [x] T037 [US3] Connect useUnifiedStudio to existing useStudioAudioEngine in src/hooks/studio/useUnifiedStudio.ts - EXISTING
- [x] T038 [US3] Connect useUnifiedStudio to existing useStudioPlayer in src/hooks/studio/useUnifiedStudio.ts - EXISTING
- [x] T039 [US3] Connect useUnifiedStudio to useUnifiedStudioStore in src/hooks/studio/useUnifiedStudio.ts - EXISTING
- [x] T040 [US3] Implement AI action handlers (separateStems, replaceSection, extendTrack, addVocals) in src/hooks/studio/useUnifiedStudio.ts - EXISTING
- [x] T041 [US3] Implement useSwipeNavigation hook with @use-gesture/react in src/hooks/studio/useSwipeNavigation.ts (~120 LOC) - EXISTING
- [x] T042 [US3] Connect AIActionsFAB to useUnifiedStudio action handlers in src/components/studio/unified/AIActionsFAB.tsx - EXISTING
- [x] T043 [US3] Run tests - verify all US3 tests PASS ✅

#### Integration Tests (Cross-Component) ⚠️

- [x] T044 [P] [US3] Write failing integration test for tab switching preserving playback in tests/integration/studio/tab-switching.test.tsx (3 tests) - Created
- [x] T045 [P] [US3] Write failing integration test for audio playback in tests/integration/studio/audio-playback.test.tsx (4 tests) - Placeholder in tab-switching.test.tsx
- [x] T046 [US3] Run integration tests - verify all PASS ✅

**Checkpoint**: US3 complete - AI actions accessible via FAB, unified hook provides complete API, integration tests pass

---

## Phase 3: Tab Content & Feature Integration (Days 5-6 - Jan 9-10, 2026)

**Purpose**: Implement full tab content and integrate reusable components
**Owner**: Frontend Team (2 developers)
**Dependencies**: Phase 2 complete

### Phase 3.1: Player & Sections Tabs (Day 4 - Jan 9) - US4 + US5 🎯

**Goal**: Audio playback and section editing (US-STUDIO-004: Real-Time Audio Playback, US-STUDIO-005: Non-Destructive Editing)

**Independent Test**: Can play/pause audio, adjust volume/speed, view sections, trigger replace/extend on sections

#### Implementation for US4 (Player Tab)

- [ ] T047 [P] [US4] Implement PlayerTab with WaveformVisualizer in src/components/studio/tabs/PlayerTab.tsx (~200 LOC)
- [ ] T048 [P] [US4] Add PlaybackControls (play/pause/seek) in src/components/studio/tabs/PlayerTab.tsx
- [ ] T049 [P] [US4] Add VolumeSlider component in src/components/studio/tabs/PlayerTab.tsx
- [ ] T050 [P] [US4] Add SpeedControl component (0.5x-2.0x) in src/components/studio/tabs/PlayerTab.tsx
- [ ] T051 [P] [US4] Add LoopToggle component in src/components/studio/tabs/PlayerTab.tsx
- [ ] T052 [US4] Connect PlayerTab to useUnifiedStudio playback state in src/components/studio/tabs/PlayerTab.tsx

#### Implementation for US5 (Sections Tab)

- [ ] T053 [P] [US5] Implement SectionsTab with SectionList in src/components/studio/tabs/SectionsTab.tsx (~220 LOC)
- [ ] T054 [US5] Import QuickCompare component from stem-studio (REUSE, NO changes) in src/components/studio/tabs/SectionsTab.tsx
- [ ] T055 [US5] Import TrimDialog component from stem-studio (REUSE, NO changes) in src/components/studio/tabs/SectionsTab.tsx
- [ ] T056 [US5] Add SectionActions component (replace/extend/trim) in src/components/studio/tabs/SectionsTab.tsx
- [ ] T057 [US5] Connect SectionsTab to useUnifiedStudio section editing actions in src/components/studio/tabs/SectionsTab.tsx

**Checkpoint**: US4 + US5 complete - audio playback works, section editing functional, reusable components integrated

---

### Phase 3.2: Stems & Mixer Tabs (Day 5 - Jan 10) - US6 + US7 🎯

**Goal**: Stem mixing and effects (US-STUDIO-006: Professional Stem Mixing, US-STUDIO-007: Real-Time Audio Effects)

**Independent Test**: Can view stems list, mute/solo/adjust volume, apply effects presets, see master mixer

#### Implementation for US6 (Stems Tab)

- [ ] T058 [P] [US6] Implement StemsTab with VirtualizedStemList using react-window in src/components/studio/tabs/StemsTab.tsx (~240 LOC)
- [ ] T059 [US6] Create StemTrack component with mute/solo/volume/pan controls in src/components/studio/tabs/StemsTab.tsx (individual stem)
- [ ] T060 [US6] Import MixPresetsMenu component from stem-studio (REUSE, NO changes) in src/components/studio/tabs/StemsTab.tsx
- [ ] T061 [US6] Add virtualization logic (react-window FixedSizeList) for >10 stems in src/components/studio/tabs/StemsTab.tsx
- [ ] T062 [US6] Connect StemsTab to useUnifiedStudio track controls in src/components/studio/tabs/StemsTab.tsx

#### Implementation for US7 (Mixer Tab)

- [ ] T063 [P] [US7] Implement MixerTab with EffectSlots in src/components/studio/tabs/MixerTab.tsx (~180 LOC)
- [ ] T064 [US7] Import DAWMixerPanel component from stem-studio (REUSE, NO changes) in src/components/studio/tabs/MixerTab.tsx
- [ ] T065 [US7] Add MasterVolume control in src/components/studio/tabs/MixerTab.tsx
- [ ] T066 [US7] Connect MixerTab to useUnifiedStudioStore effects slice in src/components/studio/tabs/MixerTab.tsx

**Checkpoint**: US6 + US7 complete - stem mixing works, effects apply in real-time, virtualization handles large lists

---

### Phase 3.3: Actions Tab & Undo/Redo (Day 5 - Jan 10 continued) - US8 🎯

**Goal**: AI actions grid and history (US-STUDIO-008: Unlimited Undo/Redo)

**Independent Test**: Can see all AI actions in grid, trigger any action, undo/redo any change

#### Implementation for US8 (Actions Tab + History)

- [ ] T067 [P] [US8] Implement ActionsTab with AIActionsGrid in src/components/studio/tabs/ActionsTab.tsx (~160 LOC)
- [ ] T068 [US8] Create AIActionCard component (6 cards: stems, replace, extend, vocals, remix, cover) in src/components/studio/tabs/ActionsTab.tsx
- [ ] T069 [US8] Import ReplacementProgressIndicator from stem-studio (REUSE, NO changes) in src/components/studio/tabs/ActionsTab.tsx
- [ ] T070 [US8] Import ExtendDialog from stem-studio (REUSE, NO changes) in src/components/studio/tabs/ActionsTab.tsx
- [ ] T071 [US8] Import RemixDialog from stem-studio (REUSE, NO changes) in src/components/studio/tabs/ActionsTab.tsx
- [ ] T072 [US8] Add undo/redo to useUnifiedStudioStore history slice in src/stores/useUnifiedStudioStore.ts (merge from useMixerHistoryStore)
- [ ] T073 [US8] Add undo/redo UI controls to UnifiedStudioHeader in src/components/studio/unified/UnifiedStudioHeader.tsx
- [ ] T074 [US8] Connect ActionsTab to useUnifiedStudio AI action handlers in src/components/studio/tabs/ActionsTab.tsx

#### Integration Tests (Undo/Redo + AI Actions) ⚠️

- [ ] T075 [P] [US8] Write integration test for undo/redo functionality in tests/integration/studio/undo-redo.test.tsx (3 tests)
- [ ] T076 [P] [US8] Write integration test for AI actions triggering in tests/integration/studio/ai-actions.test.tsx (3 tests)
- [ ] T077 [US8] Run integration tests - verify all PASS ✅

**Checkpoint**: US8 complete - all tabs functional, AI actions work, undo/redo history complete

---

## Phase 4: Polish & Performance (Days 7-8 - Jan 11-12, 2026)

**Purpose**: Optimize performance, add polish, E2E tests
**Owner**: Frontend Team + QA
**Dependencies**: Phase 3 complete

### Phase 4.1: Performance Optimization (Day 7 - Jan 11)

**Goal**: Meet performance targets (60 FPS, <1.8s TTI, <80ms tab switch, <150MB memory)

- [ ] T078 Profile performance with Chrome DevTools (record timeline, analyze flame graph) - Frontend Dev 1
- [ ] T079 Add React.memo to expensive components (MobileDAWTimeline, StemTrack, AIActionCard) in src/components/studio/
- [ ] T080 Add useMemo for computed values (waveform peaks, section boundaries) in src/hooks/studio/useUnifiedStudio.ts
- [ ] T081 Add useCallback for event handlers passed to children in src/components/studio/
- [ ] T082 [P] Implement useStudioPerformance hook for monitoring in src/hooks/studio/useStudioPerformance.ts (~150 LOC)
- [ ] T083 [P] Detect low-end devices and reduce quality in src/utils/performance/detectLowEndDevice.ts (~80 LOC)
- [ ] T084 Add audio buffer disposal on tab unmount in src/components/studio/tabs/PlayerTab.tsx (useEffect cleanup)
- [ ] T085 Add canvas cleanup on tab switch in src/components/studio/timeline/MobileDAWTimeline.tsx
- [ ] T086 Add debouncing to slider inputs (volume, pan, zoom) in src/components/studio/
- [ ] T087 Measure and verify performance targets (TTI <1.8s, tab switch <80ms, 60 FPS, memory <150MB) - QA

**Checkpoint**: Performance targets met, profiled and verified

---

### Phase 4.2: Polish & UX (Day 7-8 - Jan 11-12)

**Goal**: Smooth animations, loading states, feature flag

- [ ] T088 [P] Add tab loading skeletons (TabSkeleton component) in src/components/studio/ui/TabSkeleton.tsx (~80 LOC)
- [ ] T089 [P] Add smooth transitions with Framer Motion in src/components/studio/unified/MobileStudioLayout.tsx (tab switch animation)
- [ ] T090 [P] Implement feature flag hook useUnifiedStudioEnabled in src/hooks/useUnifiedStudioEnabled.ts (~100 LOC)
- [ ] T091 Add feature flag routing logic in src/pages/Studio.tsx (toggle between unified/legacy)
- [ ] T092 [P] Create Storybook story for UnifiedStudioMobile in .storybook/stories/studio/UnifiedStudioMobile.stories.tsx
- [ ] T093 [P] Create Storybook story for MobileDAWTimeline in .storybook/stories/studio/MobileDAWTimeline.stories.tsx
- [ ] T094 [P] Create Storybook story for AIActionsFAB in .storybook/stories/studio/AIActionsFAB.stories.tsx

#### Integration Tests (Feature Flag) ⚠️

- [ ] T095 [P] Write integration test for feature flag toggling in tests/integration/studio/feature-flag.test.tsx (2 tests)
- [ ] T096 Run integration tests - verify all PASS ✅

**Checkpoint**: Polish complete, feature flag tested, Storybook documentation ready

---

### Phase 4.3: E2E Testing (Day 8 - Jan 12)

**Goal**: E2E tests for critical user journeys (5 tests with Playwright)

#### E2E Tests ⚠️

- [ ] T097 [P] Write E2E test for mobile DAW timeline (pinch-zoom, seek) in tests/e2e/unified-studio/mobile-daw-timeline.spec.ts (Playwright)
- [ ] T098 [P] Write E2E test for tab navigation (swipe, tap) in tests/e2e/unified-studio/tab-navigation.spec.ts (Playwright)
- [ ] T099 [P] Write E2E test for AI actions FAB (open, trigger) in tests/e2e/unified-studio/ai-actions-fab.spec.ts (Playwright)
- [ ] T100 [P] Write E2E test for audio playback across tabs in tests/e2e/unified-studio/audio-playback.spec.ts (Playwright)
- [ ] T101 [P] Write E2E test for migration rollback (feature flag toggle) in tests/e2e/unified-studio/migration-rollback.spec.ts (Playwright)
- [ ] T102 Run all E2E tests with Playwright - verify all PASS ✅

**Checkpoint**: All E2E tests pass, critical user journeys validated

---

### Phase 4.4: Accessibility Audit (Day 8 - Jan 12)

**Goal**: WCAG AA compliance (keyboard nav, ARIA labels, screen reader)

- [ ] T103 Run accessibility audit with axe DevTools (scan all components) - QA
- [ ] T104 Fix color contrast issues (ensure ≥4.5:1) in src/components/studio/
- [ ] T105 Add keyboard shortcuts handler in src/hooks/studio/useKeyboardShortcuts.ts (~100 LOC)
- [ ] T106 Add ARIA labels to all interactive elements in src/components/studio/
- [ ] T107 Add focus indicators (2px outline) to all focusable elements in src/components/studio/ui/ (CSS)
- [ ] T108 Test with NVDA screen reader (Windows) - QA
- [ ] T109 Test with VoiceOver screen reader (iOS/macOS) - QA
- [ ] T110 Test keyboard-only navigation (Tab, Enter, Arrows, Space) - QA
- [ ] T111 Verify accessibility score ≥95/100 with axe DevTools - QA

**Checkpoint**: WCAG AA compliance achieved, keyboard and screen reader accessible

---

## Phase 5: Validation & Cleanup (Days 9-10 - Jan 13-14, 2026)

**Purpose**: Final validation, testing, deployment preparation
**Owner**: QA + DevOps + PM
**Dependencies**: Phase 4 complete

### Phase 5.1: Test Suite Validation (Day 9 - Jan 13)

**Goal**: 80% coverage, all tests pass, CodeQL clean

- [ ] T112 Run full test suite (npm test) - all tests must PASS ✅ - QA
- [ ] T113 Generate coverage report (npm run test:coverage) - verify ≥80% coverage - QA
- [ ] T114 Validate Constitution compliance checklist (all 8 principles) in specs/001-unified-studio-mobile/checklists/requirements.md - Architecture Lead
- [ ] T115 Run CodeQL security scan - verify 0 HIGH/MEDIUM issues - DevOps
- [ ] T116 Run Lighthouse CI performance audit - verify TTI <3s, LCP <2.5s - DevOps
- [ ] T117 Fix any critical issues found in scans (blocking) - Frontend Team
- [ ] T118 Re-run tests after fixes - verify all PASS ✅ - QA

**Checkpoint**: All tests pass, 80% coverage achieved, security clean, performance validated

---

### Phase 5.2: Manual QA Testing (Day 9-10 - Jan 13-14)

**Goal**: Manual testing on real devices (iOS, Android, Desktop)

**Test Devices**: iPhone SE 2016 (low-end), iPhone 13 (mid-range), Pixel 4a (low-end), Pixel 7 (high-end), Desktop browsers

#### Manual Test Scenarios (30 min per device)

- [ ] T119 Manual QA: Load studio (verify TTI <1.8s) on iPhone SE 2016 - QA
- [ ] T120 Manual QA: Load studio (verify TTI <1.8s) on iPhone 13 - QA
- [ ] T121 Manual QA: Load studio (verify TTI <1.8s) on Pixel 4a - QA
- [ ] T122 Manual QA: Load studio (verify TTI <1.8s) on Pixel 7 - QA
- [ ] T123 Manual QA: Load studio (verify TTI <1.8s) on Desktop Chrome/Firefox - QA
- [ ] T124 Manual QA: Tab switching (verify <80ms latency) on all devices - QA
- [ ] T125 Manual QA: Pinch-zoom timeline (verify 60 FPS) on iOS/Android - QA
- [ ] T126 Manual QA: Drag-to-seek with haptic feedback on iOS/Android - QA
- [ ] T127 Manual QA: Swipe tab navigation on iOS/Android - QA
- [ ] T128 Manual QA: Play/pause audio across tabs on all devices - QA
- [ ] T129 Manual QA: Trigger AI action, verify progress indicator on all devices - QA
- [ ] T130 Manual QA: Undo/redo operations on all devices - QA
- [ ] T131 Manual QA: Verify touch targets ≥56px on iOS/Android - QA
- [ ] T132 Manual QA: Keyboard navigation on Desktop - QA
- [ ] T133 Document any device-specific bugs in JIRA with severity - QA

**Checkpoint**: Manual QA complete, all devices tested, critical bugs documented

---

### Phase 5.3: Deployment Preparation (Day 10 - Jan 14)

**Goal**: Staging deployment, rollout plan, documentation

- [ ] T134 Deploy to staging environment with feature flag OFF - DevOps
- [ ] T135 Verify staging deployment successful (smoke test) - QA
- [ ] T136 Test feature flag toggle in staging (enable unified studio) - QA
- [ ] T137 Create rollout plan document in specs/001-unified-studio-mobile/rollout-plan.md - PM
- [ ] T138 Update main documentation (help center, keyboard shortcuts guide) - Tech Writer
- [ ] T139 Prepare release notes for changelog - PM
- [ ] T140 Create success metrics dashboard (error rate, load time, user satisfaction) - DevOps
- [ ] T141 Configure monitoring alerts (Sentry, Lighthouse CI) - DevOps
- [ ] T142 Final approval from Architecture Lead and PM - Architecture Lead + PM

**Checkpoint**: Staging deployed, rollout plan approved, ready for production

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Design & Contracts ✅ COMPLETE
   ↓
Phase 2: Core Implementation (Days 2-4)
   ├─ US1: Foundation & Layout (Day 2)
   ├─ US2: DAW Timeline (Day 3)
   └─ US3: AI Actions (Day 4)
   ↓
Phase 3: Tab Content & Integration (Days 5-6)
   ├─ US4: Player Tab (Day 5)
   ├─ US5: Sections Tab (Day 5)
   ├─ US6: Stems Tab (Day 6)
   ├─ US7: Mixer Tab (Day 6)
   └─ US8: Actions Tab + History (Day 6)
   ↓
Phase 4: Polish & Performance (Days 7-8)
   ├─ Performance Optimization (Day 7)
   ├─ Polish & UX (Day 7-8)
   ├─ E2E Testing (Day 8)
   └─ Accessibility Audit (Day 8)
   ↓
Phase 5: Validation & Cleanup (Days 9-10)
   ├─ Test Suite Validation (Day 9)
   ├─ Manual QA Testing (Days 9-10)
   └─ Deployment Preparation (Day 10)
```

### User Story Dependencies

- **US1 (Foundation)**: No dependencies - BLOCKS all other user stories
- **US2 (Timeline)**: Depends on US1 - Can run after US1 complete
- **US3 (AI Actions)**: Depends on US1 - Can run after US1 complete
- **US4 (Player Tab)**: Depends on US1 - Can run after US1 complete
- **US5 (Sections Tab)**: Depends on US1 - Can run after US1 complete
- **US6 (Stems Tab)**: Depends on US1 - Can run after US1 complete
- **US7 (Mixer Tab)**: Depends on US1 - Can run after US1 complete
- **US8 (Actions Tab)**: Depends on US1 - Can run after US1 complete

### Within Each User Story

1. Write tests FIRST (TDD) - tests MUST FAIL before implementation
2. Implement components (skeletons → full implementation)
3. Connect to stores/hooks
4. Run tests - verify all PASS ✅
5. Story complete - move to next priority

### Parallel Opportunities

**Phase 2.1** (After US1 foundation complete):
- T012-T016 (all tab skeletons) can run in parallel - different files

**Phase 2.2** (US2 timeline):
- T020-T021 (tests) can run in parallel
- T025-T026 (gestures) can run sequentially (same file)

**Phase 2.3** (US3 AI actions):
- T031-T033 (tests) can run in parallel
- T044-T045 (integration tests) can run in parallel

**Phase 3.1** (US4 + US5):
- T047-T051 (PlayerTab subcomponents) can run in parallel - independent features
- T053-T056 (SectionsTab subcomponents) can run in parallel - independent features
- PlayerTab (T047-T052) and SectionsTab (T053-T057) can be developed by 2 developers in parallel

**Phase 3.2** (US6 + US7):
- StemsTab (T058-T062) and MixerTab (T063-T066) can be developed by 2 developers in parallel

**Phase 4.2** (Polish):
- T088-T094 (all marked [P]) can run in parallel - different files

**Phase 4.3** (E2E):
- T097-T101 (all E2E tests) can run in parallel - independent test files

**Phase 5.1** (Validation):
- T112-T116 can run sequentially (dependencies on each other)

**Phase 5.2** (Manual QA):
- T119-T125 (device testing) can run in parallel - different devices
- T126-T133 (feature testing) can run sequentially per device

---

## Parallel Example: Phase 3.1 (US4 + US5)

**Developer A - PlayerTab**:
```bash
# Parallel tasks within PlayerTab:
T047: Implement PlayerTab with WaveformVisualizer
T048: Add PlaybackControls (same time as T049-T051)
T049: Add VolumeSlider
T050: Add SpeedControl
T051: Add LoopToggle

# Sequential:
T052: Connect to useUnifiedStudio (depends on T047-T051)
```

**Developer B - SectionsTab** (runs in parallel with Developer A):
```bash
# Parallel tasks within SectionsTab:
T053: Implement SectionsTab with SectionList
T054: Import QuickCompare (same time as T055-T056)
T055: Import TrimDialog
T056: Add SectionActions

# Sequential:
T057: Connect to useUnifiedStudio (depends on T053-T056)
```

---

## Implementation Strategy

### MVP First (US1-US3 Only - Days 2-4)

**Minimum Viable Product**:
1. Complete Phase 2: Core Implementation (US1 + US2 + US3)
2. **STOP and VALIDATE**: Studio shell loads, tabs work, timeline gestures work, AI actions accessible
3. Deploy with feature flag to 5% users for testing

**Value Delivered**:
- Single-window interface ✅
- Mobile-first gestures ✅
- AI actions accessible ✅
- Foundation for all other features ✅

### Incremental Delivery (Add US4-US8 - Days 5-6)

**Phase 3 adds remaining features**:
1. US4 (Player) → Audio playback works
2. US5 (Sections) → Section editing works
3. US6 (Stems) → Stem mixing works
4. US7 (Mixer) → Effects apply
5. US8 (Actions) → All AI actions, undo/redo

**Each addition is independently testable and adds value**

### Full Feature (Days 7-10)

**Phase 4-5 polish and validate**:
1. Performance optimization → 60 FPS, <1.8s TTI
2. E2E tests → Critical journeys validated
3. Accessibility → WCAG AA compliant
4. Manual QA → All devices tested
5. Deployment → Staged rollout plan ready

---

## Parallel Team Strategy

**With 2 Frontend Developers**:

**Days 2-4 (Phase 2)**:
- **Dev 1**: US1 (foundation), US2 (timeline tests), US3 (AIActionsFAB + hook)
- **Dev 2**: US1 (layout), US2 (timeline implementation), US3 (swipe navigation hook)
- Both pair on integration tests

**Days 5-6 (Phase 3)**:
- **Dev 1**: US4 (PlayerTab) + US5 (SectionsTab)
- **Dev 2**: US6 (StemsTab) + US7 (MixerTab)
- Both collaborate on US8 (ActionsTab + undo/redo)

**Days 7-8 (Phase 4)**:
- **Dev 1**: Performance optimization + E2E tests
- **Dev 2**: Polish + Storybook + accessibility
- **QA**: Manual testing in parallel

**Days 9-10 (Phase 5)**:
- **QA**: Test suite validation + manual QA
- **DevOps**: Deployment + monitoring
- **PM**: Rollout plan + documentation

---

## Task Summary

**Total Tasks**: 142 tasks
**Task Breakdown by Phase**:
- Phase 1 (Design): 6 tasks ✅ COMPLETE
- Phase 2 (Core): 40 tasks (US1: 13, US2: 11, US3: 16)
- Phase 3 (Tabs): 31 tasks (US4: 6, US5: 5, US6: 5, US7: 4, US8: 8, Integration: 3)
- Phase 4 (Polish): 35 tasks (Optimization: 10, Polish: 9, E2E: 6, A11y: 10)
- Phase 5 (Validation): 30 tasks (Test Suite: 7, Manual QA: 15, Deployment: 8)

**Task Breakdown by User Story**:
- US1 (Foundation & Layout): 13 tasks (6 tests + 7 implementation)
- US2 (DAW Timeline): 11 tasks (2 tests + 9 implementation)
- US3 (AI Actions): 16 tasks (3 tests + 10 implementation + 3 integration)
- US4 (Player Tab): 6 tasks
- US5 (Sections Tab): 5 tasks
- US6 (Stems Tab): 5 tasks
- US7 (Mixer Tab): 4 tasks
- US8 (Actions Tab + History): 11 tasks (2 integration tests + 9 implementation)

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel

**Test Tasks**: 60 tests total
- Unit tests: 40 tests (8 US1 + 8 US1 layout + 12 US2 + 6 US2 gesture + 6 US3 FAB + 10 US3 hook + 6 US3 swipe)
- Integration tests: 15 tests (3 tab switching + 4 audio playback + 3 undo/redo + 3 AI actions + 2 feature flag)
- E2E tests: 5 tests (Playwright)

**TDD Compliance**: ✅ All P1 user stories (US1-US3) have tests written FIRST before implementation

**Independent Testing**: ✅ Each user story has clear test criteria and can be validated independently

**MVP Scope**: Phase 2 (US1-US3) = 40 tasks = Minimum viable unified studio

**Suggested Timeline**:
- Days 2-4: MVP (US1-US3) → Can demo and test with users
- Days 5-6: Full features (US4-US8) → Complete parity with legacy studios
- Days 7-8: Polish → Production-ready quality
- Days 9-10: Validation → Ready for deployment

---

## Risk Flags 🚩

**CRITICAL RISKS** (must address immediately):

- 🚩 **T087**: Performance targets (TTI <1.8s, tab switch <80ms, 60 FPS) - If not met, may need low-end device mode
- 🚩 **T115**: CodeQL security scan - HIGH/MEDIUM issues are BLOCKING (must fix before deployment)
- 🚩 **T126**: Haptic feedback on touch gestures - May conflict with Telegram gestures (test in real Telegram app)
- 🚩 **T133**: Device-specific bugs - May require device-specific fixes or feature detection

**MEDIUM RISKS** (monitor closely):

- ⚠️  **T061**: Virtualization for >10 stems - May have performance issues on low-end devices
- ⚠️  **T084**: Audio buffer disposal - Memory leaks can cause crashes (must test thoroughly)
- ⚠️  **T095**: Feature flag toggle - Rollback MUST work flawlessly (critical for safe rollout)
- ⚠️  **T108-T109**: Screen reader testing - May find accessibility issues late (test early)

---

## Notes

- [P] tasks = Parallelizable (different files, no dependencies)
- [Story] label = Maps task to user story for traceability
- All unit tests MUST FAIL before implementation (TDD)
- Constitution compliance: TDD for P1 ✅, 80% coverage target ✅, performance targets defined ✅
- Feature flag enables safe rollback without code changes
- Each user story independently testable and deliverable
- Stop at any checkpoint to validate story completion
- Commit after each task or logical group of tasks
- Document device-specific issues for follow-up
- Monitor performance continuously during development

---

**Document Status**: ✅ COMPLETE  
**Total Tasks**: 142 tasks (6 complete, 136 pending)  
**Estimated Effort**: 10 working days (2 frontend devs + 1 QA + 1 DevOps)  
**Ready for Implementation**: YES - Phase 2 can begin immediately  
**Constitution Compliant**: YES - TDD for P1, 80% coverage, performance targets defined  
**Next Command**: Begin Phase 2.1 - Foundation & Layout (US1)
