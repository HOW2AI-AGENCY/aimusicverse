# Tasks: Mobile UI/UX Improvements

**Input**: Design documents from `/specs/033-mobile-ui-improvements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification. Focus on implementation tasks.

**Organization**: Tasks are grouped by user story (P1, P2, P3 priority) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US10)
- Include exact file paths in descriptions

## Path Conventions

- **Web Application**: `src/` at repository root
- Frontend: TypeScript, React 19.2, Tailwind CSS 3.4

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for mobile UI/UX improvements

- [ ] T001 Create directory structure per implementation plan (src/components/loading, src/components/error, src/components/notifications, src/components/queue, src/components/gestures)
- [ ] T002 [P] Create TypeScript type definitions in src/types/queue.ts, src/types/gestures.ts, src/types/notifications.ts
- [ ] T003 [P] Create Zod validation schemas in src/lib/validation/queue-schema.ts, src/lib/validation/gestures-schema.ts
- [ ] T004 [P] Create CSS files for accessibility and shimmer animations in src/styles/accessibility.css, src/styles/shimmer.css
- [ ] T005 Import new CSS files in src/main.tsx (accessibility.css, shimmer.css)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and storage systems that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] Implement queue storage utilities in src/lib/queueStorage.ts (loadQueue, saveQueue, clearQueue functions)
- [ ] T007 [P] Implement gesture settings utilities in src/lib/gestureSettings.ts (loadGestureSettings, saveGestureSettings, DEFAULT_GESTURE_SETTINGS)
- [ ] T008 [P] Implement notification manager in src/lib/notificationManager.ts (requestNotificationPermission, showGenerationCompleteNotification)
- [ ] T009 [P] Extend accessibility helpers in src/lib/a11yHelpers.ts (announceToScreenReader, trapFocus, handleKeyboardNavigation)
- [ ] T010 [P] Create shimmer animation utilities in src/lib/shimmerAnimation.ts (ShimmerLoader component, shimmer CSS class)
- [ ] T011 Implement queue migration script in src/lib/migration.ts (migrateQueueFromPlayerStore function)
- [ ] T012 Call queue migration script in src/main.tsx app initialization
- [ ] T013 Update TypeScript types to include new entities in src/types/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigation Consistency & Discoverability (Priority: P1) 🎯 MVP

**Goal**: Users navigate confidently with consistent back button behavior, clear "More" menu discoverability, and persistent active tab indicators

**Independent Test**: Navigate through different pages and verify back button behavior is predictable, "More" menu hint shows on first open, active tab indicator is clear and persistent

### Implementation for User Story 1

- [ ] T014 [P] Create hint tooltip component in src/components/navigation/MoreMenuHintTooltip.tsx
- [ ] T015 [P] Create "Recently Used" section component in src/components/navigation/RecentlyUsedSection.tsx
- [ ] T016 [US1] Update BottomNavigation in src/components/BottomNavigation.tsx (add hint tooltip, persistent active indicator, "Recently Used" section)
- [ ] T017 [US1] Implement hint dismissal state management in src/components/BottomNavigation.tsx (store in UserPreferences)
- [ ] T018 [US1] Standardize back button behavior across all pages (verify consistent use of MobileHeaderBar back button)
- [ ] T019 [US1] Test navigation consistency across all pages (Index, Library, Settings, etc.)

**Checkpoint**: Navigation consistency complete - hint tooltip shows, active indicator persistent, back button consistent

---

## Phase 4: User Story 2 - Gesture Discoverability & Feedback (Priority: P1)

**Goal**: Users discover and successfully use touch gestures through visual hints and clear feedback

**Independent Test**: Open fullscreen player for first time, verify gesture hint overlay appears, tap to dismiss, use gestures and confirm visual feedback

### Implementation for User Story 2

- [ ] T020 [P] Create gesture hint overlay component in src/components/gestures/GestureHintOverlay.tsx (explains double-tap seek and horizontal swipe)
- [ ] T021 [P] Create gesture settings panel component in src/components/gestures/GestureSettingsPanel.tsx (enable/disable gestures, seek amount, hint overlay)
- [ ] T022 [P] Create double-tap seek visual feedback component in src/components/player/DoubleTapSeekFeedback.tsx (animation showing -10s/+10s)
- [ ] T023 [P] Create horizontal swipe chevron indicator component in src/components/player/SwipeChevronIndicator.tsx (shows left/right chevron)
- [ ] T024 [US2] Update MobileFullscreenPlayer in src/components/player/MobileFullscreenPlayer.tsx (add gesture hint overlay, visual feedback, chevron indicator)
- [ ] T025 [US2] Implement gesture hint dismissal logic in src/components/player/MobileFullscreenPlayer.tsx (store in GestureSettings)
- [ ] T026 [US2] Add gesture settings section to Settings page in src/pages/Settings.tsx
- [ ] T027 [US2] Test gesture discoverability (hint shows on first open, dismisses, visual feedback works)

**Checkpoint**: Gesture discoverability complete - hint overlay functional, visual feedback clear, settings configurable

---

## Phase 5: User Story 6 - Accessibility Enhancement (Priority: P1)

**Goal**: Users with disabilities can use the application effectively with WCAG AA compliance

**Independent Test**: Run axe-core audit (95%+ compliance), verify minimum text size 14px, test keyboard navigation, verify ARIA labels

### Implementation for User Story 6

- [ ] T028 [P] Create accessibility CSS in src/styles/accessibility.css (visible focus indicators, skip links)
- [ ] T029 [P] Update typography.css to set minimum text size 14px in src/styles/typography.css (change .text-caption from 12px to 14px)
- [ ] T030 [P] Create ARIA label utilities in src/lib/a11yHelpers.ts (generateAriaLabel helper function)
- [ ] T031 [US6] Update all icon-only buttons to include aria-label in src/components/ui/button.tsx and throughout app
- [ ] T032 [US6] Add visible focus indicators to all interactive elements in src/index.css (*:focus-visible styles)
- [ ] T033 [US6] Implement keyboard navigation for fullscreen player gestures in src/components/player/MobileFullscreenPlayer.tsx (Arrow keys for seek, Shift+Arrows for tracks, Space for play/pause, Escape to exit)
- [ ] T034 [US6] Update all text elements to minimum 14px across all components (replace text-xs with text-sm)
- [ ] T035 [US6] Run axe-core accessibility audit and fix issues (target: 95%+ compliance)

**Checkpoint**: Accessibility complete - WCAG AA compliant, keyboard navigation works, ARIA labels present

---

## Phase 6: User Story 4 - Error Recovery & Feedback (Priority: P1)

**Goal**: Users recover gracefully from errors with clear messages and actionable recovery steps

**Independent Test**: Trigger various error conditions (network offline, server errors, timeout) and verify friendly error states with Retry/Go Back buttons

### Implementation for User Story 4

- [ ] T036 [P] Create base ErrorState component in src/components/error/ErrorState.tsx (friendly illustration, message, Retry button, Go Back button)
- [ ] T037 [P] Create NetworkErrorState component in src/components/error/NetworkErrorState.tsx (extends ErrorState, network-specific message)
- [ ] T038 [P] Create ServerErrorState component in src/components/error/ServerErrorState.tsx (extends ErrorState, server-specific message)
- [ ] T039 [P] Create TimeoutErrorState component in src/components/error/TimeoutErrorState.tsx (extends ErrorState, timeout-specific message)
- [ ] T040 [P] Create error illustration components in src/components/error/illustrations/ (NetworkErrorIllustration.tsx, ServerErrorIllustration.tsx, etc.)
- [ ] T041 [US4] Implement retry logic with preserved context in src/components/error/ErrorState.tsx (retry function that preserves form data)
- [ ] T042 [US4] Add support contact option to critical flow errors in src/components/error/ServerErrorState.tsx (link to report issue)
- [ ] T043 [US4] Update all error boundaries with new ErrorState components in src/components/ErrorBoundary.tsx, src/components/ErrorBoundaryWrapper.tsx
- [ ] T044 [US4] Test error recovery (retry works, context preserved, support contact shows)

**Checkpoint**: Error recovery complete - friendly error states, retry functional, support contact available

---

## Phase 7: User Story 3 - Loading State Clarity (Priority: P2)

**Goal**: Users experience clear, informative loading states with visual feedback on progress

**Independent Test**: Trigger various loading states and verify skeleton loaders with shimmer, progress badges, timeout indicators

### Implementation for User Story 3

- [ ] T045 [P] Create ShimmerLoader component in src/components/loading/ShimmerLoader.tsx (skeleton with shimmer animation)
- [ ] T046 [P] Create GenerationProgressBadge component in src/components/loading/GenerationProgressBadge.tsx (mini progress bar for nav badge)
- [ ] T047 [P] Create TimeoutIndicator component in src/components/loading/TimeoutIndicator.tsx (shows after 10s with retry option)
- [ ] T048 [P] Update TrackCardSkeleton in src/components/ui/skeleton-components.tsx (add shimmer animation)
- [ ] T049 [US3] Update all skeleton loaders to use shimmer animation across app
- [ ] T050 [US3] Add GenerationProgressBadge to BottomNavigation in src/components/BottomNavigation.tsx (shows progress during generation)
- [ ] T051 [US3] Implement timeout indicators in all loading states (show after 10s)
- [ ] T052 [US3] Implement retry logic with attempt limits in src/components/loading/TimeoutIndicator.tsx (max 3 retries)
- [ ] T053 [US3] Test loading states (shimmer works, progress badge shows, timeout indicators work)

**Checkpoint**: Loading states complete - shimmer animations present, progress visible, timeouts handled

---

## Phase 8: User Story 5 - Generation Notifications (Priority: P2)

**Goal**: Users receive timely notifications when generations complete, allowing them to navigate away

**Independent Test**: Start generation, navigate away, verify in-app notification appears with "Listen Now" button

### Implementation for User Story 5

- [ ] T054 [P] Create NotificationBanner component in src/components/notifications/NotificationBanner.tsx (in-app toast with action button)
- [ ] T055 [P] Create NotificationManager in src/components/notifications/NotificationManager.tsx (state management for notifications)
- [ ] T056 [P] Create GenerationCompleteNotification in src/components/notifications/GenerationCompleteNotification.tsx (specific notification type)
- [ ] T057 [US5] Implement notification permission request flow in src/lib/notificationManager.ts (request on first generation completion)
- [ ] T058 [US5] Show in-app permission prompt in src/components/notifications/NotificationPermissionPrompt.tsx (friendly message before requesting)
- [ ] T059 [US5] Implement push notification support in src/lib/notificationManager.ts (send push if permission granted)
- [ ] T060 [US5] Implement notification grouping in src/components/notifications/NotificationManager.tsx (group multiple completions)
- [ ] T061 [US5] Wire up generation complete notification in src/hooks/useGenerationRealtime.ts (call showGenerationCompleteNotification on completion)
- [ ] T062 [US5] Test notifications (in-app shows, push sends if permission granted, grouping works)

**Checkpoint**: Notifications complete - in-app notifications functional, permission flow works, push notifications supported

---

## Phase 9: User Story 7 - Queue Management (Priority: P2)

**Goal**: Users can build and manage a playback queue that persists across sessions

**Independent Test**: Add tracks to queue, close and reopen app, verify queue restored, reorder tracks

### Implementation for User Story 7

- [ ] T063 [P] Create QueueSheet component in src/components/queue/QueueSheet.tsx (bottom sheet for queue management)
- [ ] T064 [P] Create QueueItem component in src/components/queue/QueueItem.tsx (individual queue item with drag handle)
- [ ] T065 [P] Create AddToQueueButton component in src/components/queue/AddToQueueButton.tsx (button with confirmation message)
- [ ] T066 [P] Implement queue reordering logic in src/components/queue/QueueSheet.tsx (drag-and-drop with @dnd-kit/core)
- [ ] T067 [US7] Extend playerStore with queue operations in src/hooks/audio/usePlayerState.ts (addToQueue, playNext, removeFromQueue, reorderQueue)
- [ ] T068 [US7] Implement queue localStorage persistence in src/hooks/audio/usePlayerState.ts (save queue on every change)
- [ ] T069 [US7] Add "Add to Queue" action to track action menus in src/components/track-actions/UnifiedTrackSheet.tsx (call addToQueue)
- [ ] T070 [US7] Implement queue limits (100 tracks max) in src/components/queue/QueueSheet.tsx (show message when full)
- [ ] T071 [US7] Wire up auto-play next track from queue in src/components/GlobalAudioProvider.tsx (play next when current finishes)
- [ ] T072 [US7] Test queue management (add works, persists, reorders, limits enforced, auto-play works)

**Checkpoint**: Queue management complete - add to queue works, persistence functional, reordering works, limits enforced

---

## Phase 10: User Story 8 - Visual Polish & Consistency (Priority: P2)

**Goal**: Users experience visually polished interface with consistent typography, spacing, shadows, animations

**Independent Test**: View multiple pages and verify Typography components used, spacing follows 4px grid, shadows use elevation system, animations smooth (200-300ms)

### Implementation for User Story 8

- [ ] T073 [P] Update SectionHeader to use Typography components in src/components/common/SectionHeader.tsx (already done in 032-professional-ui)
- [ ] T074 [P] Update card components to use design system shadows in src/components/ui/card.tsx (use elevation-0 through elevation-5)
- [ ] T075 [P] Add page transition animations in src/App.tsx (AnimatePresence with motion.div for routes)
- [ ] T076 [P] Create page transition variant in src/lib/motion-variants.ts (pageTransition variant with 200-300ms duration)
- [ ] T077 [US8] Migrate Library page to use Typography components in src/pages/Library.tsx (replace inline text classes)
- [ ] T078 [US8] Migrate Index page to use Typography components in src/pages/Index.tsx (replace inline text classes)
- [ ] T079 [US8] Replace fractional spacing with 4px grid tokens in src/components/BottomNavigation.tsx (gap-2.5 → gap-3, etc.)
- [ ] T080 [US8] Replace fractional spacing in other components (find all gap-X.5, p-X.5 and replace with standard tokens)
- [ ] T081 [US8] Add ESLint rule for Tailwind spacing in .eslintrc.js or .eslintrc.cjs (enforce 4px grid)
- [ ] T082 [US8] Test visual polish (Typography components used, spacing consistent, animations smooth)

**Checkpoint**: Visual polish complete - Typography adopted, spacing consistent, animations smooth

---

## Phase 11: User Story 9 - Empty State Guidance (Priority: P3)

**Goal**: Users see helpful, friendly empty states with clear calls-to-action

**Independent Test**: View various empty states (new user library, empty search, empty playlist) and verify helpful messaging and CTAs

### Implementation for User Story 9

- [ ] T083 [P] Create base EmptyState component in src/components/empty/EmptyState.tsx (illustration, message, primary CTA, secondary CTA, help link)
- [ ] T084 [P] Create EmptyLibraryState component in src/components/library/EmptyLibraryState.tsx (extends EmptyState, "Create your first track" CTA)
- [ ] T085 [P] Create EmptySearchResults component in src/components/library/EmptySearchResults.tsx (extends EmptyState, "No results found", "Clear search" CTA)
- [ ] T086 [P] Create EmptyPlaylistState component in src/components/playlist/EmptyPlaylistState.tsx (extends EmptyState, "Add tracks" CTA)
- [ ] T087 [US9] Add illustrations to empty state components (Lucide icons or custom SVGs in src/components/empty/illustrations/)
- [ ] T088 [US9] Update Library page to use EmptyLibraryState in src/pages/Library.tsx (show when no tracks)
- [ ] T089 [US9] Update search results to use EmptySearchResults in src/pages/Library.tsx (show when no results)
- [ ] T090 [US9] Update playlist views to use EmptyPlaylistState in src/components/playlist/PlaylistView.tsx (show when empty)
- [ ] T091 [US9] Test empty states (all empty states show, CTAs work, help links present)

**Checkpoint**: Empty states complete - friendly messages, clear CTAs, help links available

---

## Phase 12: User Story 10 - Recently Played Section (Priority: P3)

**Goal**: Users can quickly access recently played tracks from homepage

**Independent Test**: Play several tracks, navigate to homepage, verify "Recently Played" section appears with correct tracks

### Implementation for User Story 10

- [ ] T092 [P] Create recently played storage utilities in src/lib/recentlyPlayedStorage.ts (loadRecentlyPlayed, addRecentlyPlayed, clearOld, clearAll)
- [ ] T093 [P] Create RecentlyPlayedSection component in src/components/home/RecentlyPlayedSection.tsx (displays up to 6 tracks)
- [ ] T094 [P] Implement deduplication logic in src/lib/recentlyPlayedStorage.ts (most recent wins, max 6 tracks)
- [ ] T095 [US10] Implement localStorage persistence in src/lib/recentlyPlayedStorage.ts (save to localStorage on track play complete)
- [ ] T096 [US10] Wire up track play complete to update recently played in src/components/GlobalAudioProvider.tsx (call addRecentlyPlayed when track finishes)
- [ ] T097 [US10] Add RecentlyPlayedSection to homepage in src/pages/Index.tsx (wrap in LazySection)
- [ ] T098 [US10] Implement "tap to play" functionality in src/components/home/RecentlyPlayedSection.tsx (play track immediately on tap)
- [ ] T099 [US10] Test recently played section (shows max 6 tracks, deduplicates, persists, tap plays)

**Checkpoint**: Recently played complete - section appears on homepage, persistence works, deduplication functional

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation across all user stories

- [ ] T100 [P] Update CLAUDE.md with new components and patterns in docs/CLAUDE.md (document queue management, notifications, gestures)
- [ ] T101 [P] Update PROJECT_STATUS.md with mobile UI/UX improvements completion status in PROJECT_STATUS.md
- [ ] T102 Run accessibility audit with axe-core (target: 95%+ WCAG AA compliance)
- [ ] T103 Run touch target compliance test (target: 100% >= 44px)
- [ ] T104 Measure bundle size impact (target: < 50KB increase from current ~900KB)
- [ ] T105 Performance testing (target: 60 FPS on 90% of mobile devices)
- [ ] T106 Run TypeScript compilation check (npx tsc --noEmit)
- [ ] T107 Run ESLint and fix any issues (npm run lint)
- [ ] T108 Validate quickstart.md migration steps (all steps tested and working)
- [ ] T109 Code cleanup and refactoring (remove unused imports, consolidate duplicate code)
- [ ] T110 Set up analytics for gesture hint dismissals vs. usage (track effectiveness)
- [ ] T111 Set up analytics for error retry click-through rate (measure improvement)
- [ ] T112 Set up analytics for queue management adoption rate (track usage)
- [ ] T113 Set up analytics for generation completion notification engagement (track effectiveness)
- [ ] T114 Set up analytics for navigation confusion (measure support ticket reduction)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-12)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
  - **P1 Stories (Phases 3-6)**: US1 (Navigation), US2 (Gestures), US6 (Accessibility), US4 (Errors) - Can run in parallel after Foundational
  - **P2 Stories (Phases 7-10)**: US3 (Loading), US5 (Notifications), US7 (Queue), US8 (Polish) - Can run in parallel after P1
  - **P3 Stories (Phases 11-12)**: US9 (Empty States), US10 (Recently Played) - Can run in parallel after P2
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Navigation**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Gestures**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P1) - Accessibility**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P1) - Errors**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2) - Loading**: Can start after Foundational (Phase 2) - May use components from P1 (shimmer animations)
- **User Story 5 (P2) - Notifications**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 7 (P2) - Queue**: Can start after Foundational (Phase 2) - Integrates with playerStore
- **User Story 8 (P2) - Polish**: Can start after Foundational (Phase 2) - Builds on design system from 032-professional-ui
- **User Story 9 (P3) - Empty States**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 10 (P3) - Recently Played**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Utilities/components marked [P] can run in parallel
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- Once Foundational phase completes, ALL P1 stories (Phases 3-6) can start in parallel
- Once P1 stories complete, ALL P2 stories (Phases 7-10) can start in parallel
- Once P2 stories complete, ALL P3 stories (Phases 11-12) can start in parallel
- Within each story, tasks marked [P] can run in parallel

---

## Parallel Example: P1 Critical Stories (Phases 3-6)

With 4 developers after Foundational phase completes:

```bash
# Developer A: Navigation (US1)
Task: "Create hint tooltip component in src/components/navigation/MoreMenuHintTooltip.tsx"
Task: "Create 'Recently Used' section component in src/components/navigation/RecentlyUsedSection.tsx"

# Developer B: Gestures (US2)
Task: "Create gesture hint overlay component in src/components/gestures/GestureHintOverlay.tsx"
Task: "Create gesture settings panel component in src/components/gestures/GestureSettingsPanel.tsx"

# Developer C: Accessibility (US6)
Task: "Create accessibility CSS in src/styles/accessibility.css"
Task: "Update typography.css to set minimum text size 14px in src/styles/typography.css"

# Developer D: Errors (US4)
Task: "Create base ErrorState component in src/components/error/ErrorState.tsx"
Task: "Create NetworkErrorState component in src/components/error/NetworkErrorState.tsx"
```

---

## Parallel Example: P2 Stories (Phases 7-10)

With 4 developers after P1 stories complete:

```bash
# Developer E: Loading (US3)
Task: "Create ShimmerLoader component in src/components/loading/ShimmerLoader.tsx"
Task: "Create GenerationProgressBadge component in src/components/loading/GenerationProgressBadge.tsx"

# Developer F: Notifications (US5)
Task: "Create NotificationBanner component in src/components/notifications/NotificationBanner.tsx"
Task: "Create NotificationManager in src/components/notifications/NotificationManager.tsx"

# Developer G: Queue (US7)
Task: "Create QueueSheet component in src/components/queue/QueueSheet.tsx"
Task: "Create QueueItem component in src/components/queue/QueueItem.tsx"

# Developer H: Polish (US8)
Task: "Update SectionHeader to use Typography components"
Task: "Update card components to use design system shadows"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only - Weeks 1-4)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T013) - **CRITICAL**
3. Complete Phase 3: US1 Navigation (T014-T019)
4. Complete Phase 4: US2 Gestures (T020-T027)
5. Complete Phase 6: US6 Accessibility (T028-T035)
6. Complete Phase 5: US4 Errors (T036-T044)
7. **STOP and VALIDATE**: Test all P1 stories independently
8. Deploy/demo if ready

**MVP Deliverable**: Navigation consistency, gesture discoverability, accessibility (WCAG AA), error recovery

### Incremental Delivery (Full Feature - Weeks 1-10)

1. Complete Setup + Foundational → Foundation ready
2. Add P1 Stories (US1, US2, US6, US4) → Test independently → Deploy/Demo **(MVP!)**
3. Add P2 Stories (US3, US5, US7, US8) → Test independently → Deploy/Demo
4. Add P3 Stories (US9, US10) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy (4+ Developers)

With multiple developers after Foundational phase:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 Navigation (Phase 3)
   - Developer B: US2 Gestures (Phase 4)
   - Developer C: US6 Accessibility (Phase 6)
   - Developer D: US4 Errors (Phase 5)
3. After P1 complete:
   - Developer E: US3 Loading (Phase 7)
   - Developer F: US5 Notifications (Phase 8)
   - Developer G: US7 Queue (Phase 9)
   - Developer H: US8 Polish (Phase 10)
4. After P2 complete:
   - Developer I: US9 Empty States (Phase 11)
   - Developer J: US10 Recently Played (Phase 12)
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All P1 stories (US1, US2, US4, US6) can be developed in parallel after Foundational phase
- All P2 stories (US3, US5, US7, US8) can be developed in parallel after P1 complete
- All P3 stories (US9, US10) can be developed in parallel after P2 complete
- Focus on P1 stories for MVP (4-week delivery)
- Bundle size impact: ~50KB estimated (within 950KB limit)
- Performance target: 60 FPS on 90% of mobile devices
- Accessibility target: 95%+ WCAG AA compliance

---

## Summary

**Total Tasks**: 114 tasks
- **Setup (Phase 1)**: 5 tasks
- **Foundational (Phase 2)**: 8 tasks (BLOCKS all user stories)
- **P1 Stories (Phases 3-6)**: 31 tasks across 4 stories (US1: 6 tasks, US2: 8 tasks, US6: 8 tasks, US4: 9 tasks)
- **P2 Stories (Phases 7-10)**: 40 tasks across 4 stories (US3: 9 tasks, US5: 9 tasks, US7: 10 tasks, US8: 10 tasks)
- **P3 Stories (Phases 11-12)**: 17 tasks across 2 stories (US9: 9 tasks, US10: 8 tasks)
- **Polish (Phase 13)**: 15 tasks

**Parallel Opportunities**:
- Setup: 4 parallel tasks
- Foundational: 5 parallel tasks
- P1 stories: 16 parallel tasks across 4 stories (can run with 4 developers)
- P2 stories: 16 parallel tasks across 4 stories (can run with 4 developers)
- P3 stories: 6 parallel tasks across 2 stories (can run with 2 developers)

**Estimated Effort**:
- MVP (P1 only): 4 weeks
- Full feature (P1+P2+P3): 7-10 weeks

**Suggested MVP Scope**: P1 stories only (Navigation, Gestures, Accessibility, Errors) - 31 tasks + 13 foundational = 44 tasks total
