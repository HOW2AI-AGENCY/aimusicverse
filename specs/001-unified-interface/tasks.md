# Tasks: Unified Interface Application

**Feature Branch**: `001-unified-interface`  
**Created**: 2026-01-05  
**Status**: Phase 2 Implementation  
**Input**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Context**: Complete unified interface architecture migration across 991 TSX components with focus on mobile-first UX, 44-56px touch targets, modal consistency, list virtualization, and bundle size optimization (<950KB).

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, etc.)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Baseline (Sprint 0: 2-3 days)

**Purpose**: Establish baseline metrics, tooling infrastructure, and feature flag system for gradual rollout

**Rollback Plan**: All tasks are preparatory and non-destructive. If issues arise, simply delete added files.

- [x] T001 Run production build and establish bundle size baseline using `npm run build && du -sh dist/`
  - **Acceptance**: Bundle size documented in KB with breakdown by chunk using vite-bundle-visualizer
  - **Estimate**: 2 hours
  - **Rollback**: N/A (read-only operation)
  - **Completed**: Bundle: 1748 KB (798 KB over limit). Report: `bundle-baseline.md`

- [x] T002 [P] Create bundle size monitoring script in `.specify/scripts/check-bundle-size.sh`
  - **Acceptance**: Script exits with error if bundle >950KB, outputs size comparison
  - **Estimate**: 1 hour
  - **Rollback**: Delete script file
  - **Completed**: Script created with top 10 chunks reporting and exit codes

- [x] T003 [P] Add feature flag system using environment variables in `src/lib/featureFlags.ts`
  - **Acceptance**: `useFeatureFlag(flagName)` hook returns boolean, flags configurable via `.env.local`
  - **Estimate**: 2 hours
  - **Rollback**: Delete featureFlags.ts, remove imports
  - **Completed**: 19 feature flags with rollout percentage support and master kill switch

- [x] T004 [P] Create touch target validation utility in `src/lib/validation/touchTargets.ts`
  - **Acceptance**: `validateTouchTarget(width, height)` returns validation result with errors array
  - **Estimate**: 1.5 hours
  - **Rollback**: Delete file
  - **Completed**: Validation functions, React hook, and page audit utility

- [ ] T005 [P] Create migration tracking spreadsheet in `specs/001-unified-interface/migration-tracker.csv`
  - **Acceptance**: CSV contains all 991 components with status, priority, sprint columns
  - **Estimate**: 2 hours
  - **Rollback**: Delete CSV file

- [ ] T006 Add bundle size check to pre-commit hook in `.husky/pre-commit`
  - **Acceptance**: Hook runs check-bundle-size.sh, blocks commit if >950KB
  - **Estimate**: 1 hour
  - **Rollback**: Remove hook addition from .husky/pre-commit

**Sprint 0 Checkpoint**: Baseline established (current bundle size known), feature flags ready, validation tooling in place

---

## Phase 2: Foundational - Critical Infrastructure (Sprint 0: 2-3 days)

**Purpose**: Core unified components optimizations that are BLOCKING prerequisites for all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Rollback Plan**: Each task includes component-level rollback. If critical issues, revert commits for specific tasks.

- [ ] T007 Optimize Tone.js lazy loading in `src/lib/audio/toneLoader.ts` to reduce bundle size
  - **Acceptance**: Tone.js (200KB) only loads when Stem Studio or MIDI features accessed, not on app init
  - **Estimate**: 3 hours
  - **Rollback**: Revert toneLoader.ts, restore direct imports
  - **Dependencies**: T001 (need baseline)

- [x] T008 [P] Create touch target utility classes in `src/styles/touch-targets.css`
  - **Acceptance**: Classes `touch-target-44`, `touch-target-48`, `touch-target-56` enforce minimum sizes
  - **Estimate**: 1 hour
  - **Rollback**: Delete CSS file, remove import
  - **Completed**: CSS utilities for 44/48/56px targets, debug mode, and variants

- [ ] T009 [P] Create ResponsiveModal wrapper component in `src/components/ui/responsive-modal.tsx`
  - **Acceptance**: Component auto-switches between Dialog (desktop) and MobileBottomSheet (mobile) based on viewport
  - **Estimate**: 2 hours
  - **Rollback**: Delete responsive-modal.tsx file

- [ ] T010 Update MainLayout safe area handling in `src/components/layout/MainLayout.tsx`
  - **Acceptance**: Safe area insets (top/bottom) correctly applied for all device types including iPhone 14 Pro notch
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert MainLayout.tsx changes
  - **Dependencies**: None (enhancement to existing component)

**Foundational Checkpoint**: Core infrastructure ready - user story implementation can now begin in parallel

---

## Sprint 1: Bundle Baseline + Critical Touch Targets (5-7 days) 🎯 P0

**Goal**: Establish bundle size baseline, fix critical touch target violations, prevent regressions

**Success Criteria**: Bundle size <950KB, all P0 components have 44-56px touch targets

---

### User Story 1 - Navigate Between Main Sections (Priority: P1)

**Goal**: Consistent navigation with bottom nav and headers across all main screens

**Independent Test**: Navigate between Home/Library/Create/Projects/More, verify back button, verify safe areas on notched device

**Rollback Plan**: Each component has feature flag `UNIFIED_NAV_ENABLED`. If issues, disable flag and old component takes over.

#### Implementation for User Story 1

- [ ] T011 [P] [US1] Fix touch targets in BottomNavigation component in `src/components/navigation/BottomNavigation.tsx`
  - **Acceptance**: All nav buttons minimum 56x56px, verify on iPhone 14 Pro simulator
  - **Estimate**: 1 hour
  - **Rollback**: Revert BottomNavigation.tsx
  - **Priority**: P0 (critical navigation)

- [ ] T012 [P] [US1] Fix touch targets in MobileHeaderBar back button in `src/components/mobile/MobileHeaderBar.tsx`
  - **Acceptance**: Back button 44x44px minimum, verify on Android emulator
  - **Estimate**: 0.5 hour
  - **Rollback**: Revert MobileHeaderBar.tsx
  - **Priority**: P0 (critical navigation)

- [ ] T013 [P] [US1] Fix touch targets in FAB Create button in `src/components/navigation/BottomNavigation.tsx`
  - **Acceptance**: FAB button 56x56px diameter, elevated above other nav items
  - **Estimate**: 0.5 hour
  - **Rollback**: Revert changes to FAB styling
  - **Priority**: P0 (primary action)

- [ ] T014 [US1] Add haptic feedback to all BottomNavigation interactions in `src/components/navigation/BottomNavigation.tsx`
  - **Acceptance**: Telegram HapticFeedback.selectionChanged() fires on tab switch
  - **Estimate**: 1 hour
  - **Rollback**: Remove haptic feedback calls
  - **Dependencies**: T011, T012, T013 (touch targets fixed first)

- [ ] T015 [US1] Test navigation on real devices (iPhone 14 Pro, Pixel 7)
  - **Acceptance**: All navigation flows work, safe areas respected, no visual glitches
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T011-T014

**US1 Checkpoint**: Navigation fully functional with correct touch targets and haptic feedback

---

### User Story 2 - Browse and Interact with Track Lists (Priority: P1)

**Goal**: Smooth 60 FPS scrolling for 500+ track lists with virtualization, consistent card layouts

**Independent Test**: Open Library with 500+ tracks, scroll smoothly, tap play/like/menu buttons

**Rollback Plan**: Feature flag `VIRTUALIZED_LISTS_ENABLED`. If performance issues, disable and use simple .map() temporarily.

#### Implementation for User Story 2

- [ ] T016 [P] [US2] Fix touch targets in TrackCard play button in `src/components/track/TrackCard.tsx`
  - **Acceptance**: Play button 48x48px minimum (larger than other buttons for primary action)
  - **Estimate**: 0.5 hour
  - **Rollback**: Revert TrackCard.tsx play button sizing
  - **Priority**: P0 (primary action)

- [ ] T017 [P] [US2] Fix touch targets in TrackCard like/menu buttons in `src/components/track/TrackCard.tsx`
  - **Acceptance**: Like and menu buttons 44x44px minimum, 8px spacing between buttons
  - **Estimate**: 0.5 hour
  - **Rollback**: Revert button sizing changes
  - **Priority**: P0 (frequent interaction)

- [ ] T018 [P] [US2] Merge MinimalTrackCard and ProfessionalTrackRow into TrackCard variants in `src/components/track/TrackCard.tsx`
  - **Acceptance**: TrackCard supports `variant="default" | "compact" | "minimal" | "professional"`, old components deprecated
  - **Estimate**: 3 hours
  - **Rollback**: Restore MinimalTrackCard.tsx and ProfessionalTrackRow.tsx files, revert TrackCard.tsx
  - **Priority**: P2 (cleanup, not blocking)

- [ ] T019 [US2] Add pull-to-refresh to VirtualizedTrackList in `src/components/library/VirtualizedTrackList.tsx`
  - **Acceptance**: Pull-down gesture triggers refresh, loading indicator shown, haptic feedback fires
  - **Estimate**: 2 hours
  - **Rollback**: Remove pull-to-refresh code, feature flag off
  - **Dependencies**: T016, T017 (touch targets fixed)

- [ ] T020 [US2] Apply VirtualizedTrackList to Playlists page in `src/pages/Playlists.tsx`
  - **Acceptance**: Playlist track lists use VirtualizedTrackList, smooth 60 FPS scrolling with 500+ tracks
  - **Estimate**: 2 hours
  - **Rollback**: Revert Playlists.tsx to use .map(), disable VIRTUALIZED_LISTS_ENABLED flag
  - **Dependencies**: T019
  - **Priority**: P0 (performance critical)

- [ ] T021 [US2] Apply VirtualizedTrackList to Community page in `src/pages/Community.tsx`
  - **Acceptance**: Community feed uses VirtualizedTrackList, infinite scroll works
  - **Estimate**: 2 hours
  - **Rollback**: Revert Community.tsx
  - **Dependencies**: T019
  - **Priority**: P0 (performance critical)

- [ ] T022 [US2] Performance test with Chrome DevTools on lists >500 items
  - **Acceptance**: Maintain 60 FPS during scrolling, memory usage <100MB increase
  - **Estimate**: 1.5 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T020, T021

**US2 Checkpoint**: All large lists virtualized, touch targets compliant, 60 FPS scrolling verified

---

### Sprint 1 Summary & Validation

**Deliverables**:
- Bundle size baseline documented
- Touch target validation tooling in place
- BottomNavigation touch targets fixed (T011-T013)
- TrackCard touch targets fixed (T016-T017)
- VirtualizedTrackList applied to Playlists and Community (T020-T021)

**Validation**:
- Run bundle size check: `npm run build && .specify/scripts/check-bundle-size.sh`
- Run touch target audit script on modified components
- Manual testing on iPhone 14 Pro and Pixel 7 for navigation and scrolling
- Lighthouse Performance score >90 on Library and Community pages

**Rollback**: If critical issues, disable feature flags `UNIFIED_NAV_ENABLED` and `VIRTUALIZED_LISTS_ENABLED`

---

## Sprint 2: Modal Migration (5-7 days) 🎯 P1

**Goal**: Migrate top 15 Dialog usages to MobileBottomSheet on mobile for consistent UX

**Success Criteria**: 15 modals using ResponsiveModal pattern, all forms swipe-dismissible on mobile

**Rollback Plan**: Each modal migration has feature flag. If UX issues, disable flag to revert to Dialog.

---

### User Story 3 - Create Music with Generation Form (Priority: P1)

**Goal**: Intuitive generation form with auto-save, consistent form controls, touch-friendly inputs

**Independent Test**: Open Create form, fill fields, verify auto-save, submit generation

**Rollback Plan**: Feature flag `UNIFIED_FORMS_ENABLED`. Revert to old form layout if critical issues.

#### Implementation for User Story 3

- [ ] T023 [P] [US3] Fix touch targets in Generate form inputs in `src/components/generate-form/GenerateForm.tsx`
  - **Acceptance**: All input fields minimum 44px height, labels above inputs for better touch targeting
  - **Estimate**: 2 hours
  - **Rollback**: Revert GenerateForm.tsx input styling
  - **Priority**: P0 (primary feature)

- [ ] T024 [P] [US3] Fix touch targets in Generate form buttons in `src/components/generate-form/GenerateForm.tsx`
  - **Acceptance**: Submit button minimum 48px height, secondary buttons 44px height
  - **Estimate**: 1 hour
  - **Rollback**: Revert button sizing
  - **Priority**: P0

- [ ] T025 [US3] Enhance auto-save functionality in `src/hooks/useGenerateDraft.ts`
  - **Acceptance**: Drafts save every 2 seconds after user stops typing, expiry 30 minutes, version number for migration
  - **Estimate**: 2 hours
  - **Rollback**: Revert useGenerateDraft.ts changes
  - **Dependencies**: T023, T024 (form structure stable)

- [ ] T026 [US3] Add inline validation messages in `src/components/generate-form/GenerateForm.tsx`
  - **Acceptance**: Validation errors appear next to affected fields, clear error messages, WCAG AA compliant color contrast
  - **Estimate**: 2 hours
  - **Rollback**: Remove validation message components
  - **Dependencies**: T025

- [ ] T027 [US3] Add loading state to submit button in `src/components/generate-form/GenerateForm.tsx`
  - **Acceptance**: Button shows spinner during submission, disabled state, Telegram haptic feedback fires
  - **Estimate**: 1 hour
  - **Rollback**: Revert button loading state
  - **Dependencies**: T026

**US3 Checkpoint**: Generation form fully functional with auto-save, validation, and touch-friendly controls

---

### User Story 4 - Manage Playlists and Projects (Priority: P2)

**Goal**: Consistent modal patterns for playlist/project creation and editing

**Independent Test**: Create playlist via bottom sheet, edit project via bottom sheet, verify swipe-to-dismiss

**Rollback Plan**: Feature flag `UNIFIED_MODALS_ENABLED`. Revert to Dialog if modal UX issues.

#### Implementation for User Story 4

- [ ] T028 [P] [US4] Migrate Settings edit forms to ResponsiveModal in `src/pages/Settings.tsx`
  - **Acceptance**: Profile edit, preferences, account settings use MobileBottomSheet on mobile, Dialog on desktop
  - **Estimate**: 2 hours
  - **Rollback**: Revert Settings.tsx, disable UNIFIED_MODALS_ENABLED flag
  - **Priority**: P1 (high-traffic page)

- [ ] T029 [P] [US4] Migrate Library filter modals to ResponsiveModal in `src/pages/Library.tsx`
  - **Acceptance**: Sort/filter options use MobileBottomSheet on mobile, Popover on desktop
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert Library.tsx filter components
  - **Priority**: P1

- [ ] T030 [P] [US4] Create playlist modal migration in `src/components/playlist/CreatePlaylistSheet.tsx`
  - **Acceptance**: Use MobileBottomSheet with snapPoints [0.5, 0.9], swipe-to-dismiss enabled
  - **Estimate**: 2 hours
  - **Rollback**: Revert CreatePlaylistSheet.tsx
  - **Priority**: P0 (core feature)

- [ ] T031 [P] [US4] Migrate ProfilePage edit modal in `src/pages/ProfilePage.tsx`
  - **Acceptance**: Profile edit uses ResponsiveModal, form validation works, auto-save enabled
  - **Estimate**: 2 hours
  - **Rollback**: Revert ProfilePage.tsx
  - **Priority**: P1

- [ ] T032 [US4] Migrate track action menus to MobileActionSheet in `src/components/track/TrackMenu.tsx`
  - **Acceptance**: Track 3-dot menu uses MobileActionSheet on mobile, DropdownMenu on desktop, destructive actions red
  - **Estimate**: 2 hours
  - **Rollback**: Revert TrackMenu.tsx
  - **Dependencies**: T028-T031 (other modals tested first)
  - **Priority**: P0 (frequent interaction)

- [ ] T033 [US4] Migrate share sheet to MobileActionSheet in `src/components/share/ShareSheet.tsx`
  - **Acceptance**: Share options use MobileActionSheet, Telegram native sharing integrated
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert ShareSheet.tsx
  - **Dependencies**: T032
  - **Priority**: P1

- [ ] T034 [US4] Migrate Projects page tab modals in `src/pages/Projects.tsx`
  - **Acceptance**: Artist/Project/Lyrics/Cloud creation modals use ResponsiveModal pattern
  - **Estimate**: 2 hours
  - **Rollback**: Revert Projects.tsx modal components
  - **Dependencies**: T033
  - **Priority**: P2

- [ ] T035 [US4] Test all modals on mobile (swipe-to-dismiss, backdrop dismiss, keyboard handling)
  - **Acceptance**: All 15+ migrated modals work on iOS Safari and Chrome Android, no UX regressions
  - **Estimate**: 3 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T028-T034

**US4 Checkpoint**: 15+ modals migrated to unified pattern, all tested on real devices

---

### Sprint 2 Summary & Validation

**Deliverables**:
- Generation form touch targets fixed (T023-T024)
- 15+ modals migrated to ResponsiveModal/MobileBottomSheet pattern (T028-T034)
- All forms swipe-dismissible on mobile
- Modal decision matrix followed for all new modals

**Validation**:
- Modal UX testing on iPhone and Android: swipe-to-dismiss, backdrop dismiss, keyboard handling
- Verify no Dialog usage on mobile viewport (<768px)
- Lighthouse Accessibility score >90 (ARIA labels on modals)

**Rollback**: Disable `UNIFIED_MODALS_ENABLED` flag if critical UX issues

---

## Sprint 3: List Virtualization Expansion (4-6 days) 🎯 P2

**Goal**: Expand virtualization to all lists with >50 items, ensure 60 FPS scrolling

**Success Criteria**: 17+ components using VirtualizedTrackList, all maintain 60 FPS with 500+ items

**Rollback Plan**: Per-component feature flags. Revert to .map() if performance regressions.

---

### User Story 5 - Work in Unified Studio (Priority: P2)

**Goal**: Mobile-optimized studio with swipeable tabs, smooth audio playback, responsive controls

**Independent Test**: Open track in studio, switch tabs, play audio, adjust mixer controls

**Rollback Plan**: Feature flag `UNIFIED_STUDIO_ENABLED` already exists. Studio is already unified per research.md.

#### Implementation for User Story 5

- [ ] T036 [P] [US5] Optimize UnifiedStudioMobile tab switching performance in `src/components/studio/unified/UnifiedStudioMobile.tsx`
  - **Acceptance**: Tab content lazy loads, swipe gesture smooth 60 FPS, no jank on low-end devices
  - **Estimate**: 2 hours
  - **Rollback**: Revert lazy loading changes
  - **Priority**: P2 (enhancement)

- [ ] T037 [P] [US5] Fix touch targets in mixer controls in `src/components/studio/unified/MobileMixerContent.tsx`
  - **Acceptance**: Slider handles minimum 44px, volume buttons 44x44px
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert MobileMixerContent.tsx
  - **Priority**: P1 (usability)

- [ ] T038 [P] [US5] Apply VirtualizedTrackList to Tracks tab in `src/components/studio/unified/MobileTracksContent.tsx`
  - **Acceptance**: Track list in studio uses virtualization when >50 tracks
  - **Estimate**: 2 hours
  - **Rollback**: Revert MobileTracksContent.tsx
  - **Priority**: P2

- [ ] T039 [US5] Add haptic feedback to studio actions in `src/components/studio/unified/MobileActionsContent.tsx`
  - **Acceptance**: Export, share, save actions trigger Telegram haptic feedback
  - **Estimate**: 1 hour
  - **Rollback**: Remove haptic calls
  - **Dependencies**: T036-T038

**US5 Checkpoint**: Studio optimized for mobile, touch targets compliant, virtualization applied

---

### Additional Virtualization Tasks

- [ ] T040 [P] Apply VirtualizedTrackList to Search results in `src/pages/Search.tsx`
  - **Acceptance**: Search results virtualized when >50 results, infinite scroll works
  - **Estimate**: 2 hours
  - **Rollback**: Revert Search.tsx
  - **Priority**: P1 (performance critical)

- [ ] T041 [P] Apply VirtualizedTrackList to Artists page in `src/pages/Artists.tsx`
  - **Acceptance**: Artist cards virtualized when >50 artists, grid layout responsive
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert Artists.tsx
  - **Priority**: P2

- [ ] T042 [P] Optimize LazyImage adoption in TrackCard in `src/components/track/TrackCard.tsx`
  - **Acceptance**: All track cover images use LazyImage with blur placeholder
  - **Estimate**: 1 hour
  - **Rollback**: Revert to regular img tags
  - **Priority**: P2 (performance improvement)

- [ ] T043 [P] Optimize LazyImage adoption in PlaylistCard in `src/components/playlist/PlaylistCard.tsx`
  - **Acceptance**: Playlist cover images use LazyImage
  - **Estimate**: 0.5 hour
  - **Rollback**: Revert to regular img tags
  - **Priority**: P2

- [ ] T044 Performance benchmark all virtualized lists with Chrome DevTools
  - **Acceptance**: All pages maintain 60 FPS with 500+ items, memory usage documented
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T040-T043

**Sprint 3 Checkpoint**: 17+ components virtualized, all maintain 60 FPS, LazyImage adoption expanded

---

### Sprint 3 Summary & Validation

**Deliverables**:
- UnifiedStudioMobile optimized (T036-T039)
- Search, Artists, Playlists virtualized (T040-T041)
- LazyImage adoption expanded to TrackCard and PlaylistCard (T042-T043)
- Performance benchmarks documented (T044)

**Validation**:
- Chrome DevTools Performance recording for all pages
- Verify 60 FPS scrolling on mid-range device (iPhone 12 or equivalent)
- Memory profiling: no leaks, <100MB increase during scroll

**Rollback**: Per-component feature flags for virtualization. Disable if regressions detected.

---

## Sprint 4: Header Unification (3-5 days) 🎯 P2

**Goal**: Apply MobileHeaderBar to top 16 pages for consistent navigation

**Success Criteria**: 16+ pages use MobileHeaderBar, all have proper back button and action buttons

**Rollback Plan**: Per-page feature flags. Revert to custom headers if layout issues.

---

### User Story 6 - Use Modals Consistently Across App (Priority: P2)

**Goal**: All modals follow decision matrix, no Radix Dialog on mobile

**Independent Test**: Trigger all modal types (form, menu, confirmation), verify correct pattern used

**Rollback Plan**: Feature flag per modal type. Revert to Dialog if issues.

#### Implementation for User Story 6

- [ ] T045 [P] [US6] Apply MobileHeaderBar to Generate page in `src/pages/Generate.tsx`
  - **Acceptance**: Header shows "Create Music", back button when not root, save draft action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert Generate.tsx header changes
  - **Priority**: P1 (high-traffic page)

- [ ] T046 [P] [US6] Apply MobileHeaderBar to Projects page in `src/pages/Projects.tsx`
  - **Acceptance**: Header shows "Projects", tab bar below header, filter action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert Projects.tsx
  - **Priority**: P1

- [ ] T047 [P] [US6] Apply MobileHeaderBar to Studio page in `src/pages/Studio.tsx`
  - **Acceptance**: Header shows track title, back button, share action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert Studio.tsx
  - **Priority**: P1

- [ ] T048 [P] [US6] Apply MobileHeaderBar to LyricsStudio page in `src/pages/LyricsStudio.tsx`
  - **Acceptance**: Header shows "Lyrics Studio", back button, save action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert LyricsStudio.tsx
  - **Priority**: P2

- [ ] T049 [P] [US6] Apply MobileHeaderBar to Settings page in `src/pages/Settings.tsx`
  - **Acceptance**: Header shows "Settings", back button, help action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert Settings.tsx
  - **Priority**: P1

- [ ] T050 [P] [US6] Apply MobileHeaderBar to ProfilePage in `src/pages/ProfilePage.tsx`
  - **Acceptance**: Header shows username, back button, edit action button
  - **Estimate**: 1 hour
  - **Rollback**: Revert ProfilePage.tsx
  - **Priority**: P1

- [ ] T051 [P] [US6] Apply MobileHeaderBar to Community page in `src/pages/Community.tsx`
  - **Acceptance**: Header shows "Community", search bar, filter action button
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert Community.tsx
  - **Priority**: P1

- [ ] T052 [P] [US6] Apply MobileHeaderBar to remaining 9 pages (Artists, Playlists, Analytics, etc.)
  - **Acceptance**: Each page has consistent header with title, back button, relevant actions
  - **Estimate**: 4 hours (bulk migration)
  - **Rollback**: Revert individual page files
  - **Priority**: P2
  - **Dependencies**: T045-T051 (pattern validated)

- [ ] T053 Audit all Dialog usages to ensure ResponsiveModal pattern on mobile
  - **Acceptance**: No Radix Dialog on mobile viewport, all use MobileBottomSheet or centered Dialog for confirmations
  - **Estimate**: 2 hours
  - **Rollback**: N/A (audit only)
  - **Dependencies**: T052

**US6 Checkpoint**: 16+ pages use MobileHeaderBar, modal patterns consistent across app

---

### Sprint 4 Summary & Validation

**Deliverables**:
- 16+ pages migrated to MobileHeaderBar (T045-T052)
- Modal pattern audit complete (T053)
- All pages have consistent header structure

**Validation**:
- Visual regression testing: screenshot all 16 pages before/after
- Navigation flow testing: back button works from all pages
- Accessibility: ARIA labels on all action buttons

**Rollback**: Per-page feature flags. Disable `UNIFIED_HEADERS_ENABLED` if critical issues.

---

## Sprint 5: Testing, Validation, Cleanup (2-3 days) 🎯 P1

**Goal**: Comprehensive testing, accessibility audit, bundle size validation, cleanup

**Success Criteria**: Lighthouse >90, WCAG AA compliance, bundle <950KB, zero regressions

**Rollback Plan**: Full rollback via feature flag `UNIFIED_INTERFACE_ENABLED` if critical issues discovered.

---

### User Story 7 - Switch Between Themes (Priority: P3)

**Goal**: Telegram theme synchronization, high contrast support

**Independent Test**: Change Telegram theme, verify app updates within 500ms

**Rollback Plan**: Feature flag `THEME_SYNC_ENABLED`. No impact if disabled (static theme).

#### Implementation for User Story 7

- [ ] T054 [P] [US7] Enhance theme synchronization in `src/lib/telegram/themeSync.ts`
  - **Acceptance**: Theme updates within 500ms of Telegram theme change, high contrast mode supported
  - **Estimate**: 2 hours
  - **Rollback**: Revert themeSync.ts changes
  - **Priority**: P3 (nice-to-have)

- [ ] T055 [P] [US7] Verify WCAG AA color contrast ratios on all unified components
  - **Acceptance**: All text meets 4.5:1 contrast ratio, interactive elements meet 3:1
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)
  - **Dependencies**: T054

**US7 Checkpoint**: Theme sync works, WCAG AA compliance verified

---

### User Story 8 - Share and Download Content (Priority: P3)

**Goal**: Telegram native sharing integration, download functionality

**Independent Test**: Share track to Telegram contacts, download audio file

**Rollback Plan**: Feature flag `TELEGRAM_SHARING_ENABLED`. Falls back to web share API.

#### Implementation for User Story 8

- [ ] T056 [P] [US8] Enhance Telegram sharing in share action sheet in `src/components/share/ShareSheet.tsx`
  - **Acceptance**: Share to Telegram contacts, Stories, with rich preview metadata
  - **Estimate**: 2 hours
  - **Rollback**: Revert ShareSheet.tsx
  - **Priority**: P3

- [ ] T057 [P] [US8] Implement download with confirmation in `src/components/track/DownloadButton.tsx`
  - **Acceptance**: Download shows progress, confirmation with haptic feedback, file saved to Telegram storage
  - **Estimate**: 1.5 hours
  - **Rollback**: Revert DownloadButton.tsx
  - **Priority**: P3

**US8 Checkpoint**: Sharing and downloading fully functional

---

### Final Testing & Validation

- [ ] T058 [P] Run Lighthouse audit on top 10 pages, document scores
  - **Acceptance**: Performance >90, Accessibility >90, Best Practices >90
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)

- [ ] T059 [P] Run axe-core accessibility audit on all unified components
  - **Acceptance**: Zero WCAG AA violations, all interactive elements have ARIA labels
  - **Estimate**: 2 hours
  - **Rollback**: N/A (testing only)

- [ ] T060 [P] Keyboard navigation testing on desktop (Tab, Enter, Esc)
  - **Acceptance**: All forms, modals, navigation keyboard accessible
  - **Estimate**: 1.5 hours
  - **Rollback**: N/A (testing only)

- [ ] T061 [P] Device testing matrix: iPhone 14 Pro, Pixel 7, iPad, Desktop
  - **Acceptance**: All user flows work on all devices, safe areas correct, gestures work
  - **Estimate**: 4 hours
  - **Rollback**: N/A (testing only)

- [ ] T062 Final bundle size check and optimization
  - **Acceptance**: Bundle <950KB gzipped, chunk sizes documented, no regressions
  - **Estimate**: 2 hours
  - **Rollback**: N/A (verification only)
  - **Dependencies**: T001 (baseline comparison)

- [ ] T063 [P] Update CLAUDE.md with unified patterns in `.specify/memory/agent-context/CLAUDE.md`
  - **Acceptance**: Agent context updated with modal patterns, touch target rules, virtualization guidelines
  - **Estimate**: 1 hour
  - **Rollback**: Revert CLAUDE.md changes

- [ ] T064 Update migration tracker CSV with final status in `specs/001-unified-interface/migration-tracker.csv`
  - **Acceptance**: All 991 components marked as complete, verified, or pending
  - **Estimate**: 1 hour
  - **Rollback**: N/A (documentation only)

- [ ] T065 [P] Remove deprecated components (MinimalTrackCard, ProfessionalTrackRow, custom modals)
  - **Acceptance**: Old components deleted, imports updated, no dead code
  - **Estimate**: 2 hours
  - **Rollback**: Restore deleted files from git history
  - **Dependencies**: T018 (merge complete), T053 (modal migration complete)

- [ ] T066 Run quickstart.md validation scenarios
  - **Acceptance**: All code examples in quickstart.md work, no broken imports
  - **Estimate**: 1 hour
  - **Rollback**: N/A (testing only)

**Sprint 5 Checkpoint**: All tests passing, accessibility compliant, bundle optimized, ready for production

---

### Sprint 5 Summary & Validation

**Deliverables**:
- Theme sync enhanced (T054-T055)
- Sharing/downloading implemented (T056-T057)
- Lighthouse audits complete (T058-T059)
- Device testing complete (T061)
- Bundle size <950KB verified (T062)
- Documentation updated (T063-T064)
- Deprecated components removed (T065)

**Validation**:
- Lighthouse Performance >90 on all main pages
- Lighthouse Accessibility >90 (zero WCAG AA violations)
- Bundle size <950KB gzipped
- All user flows tested on 4 device types
- Zero regressions from pre-migration baseline

**Final Rollback**: Master kill switch `UNIFIED_INTERFACE_ENABLED=false` reverts entire feature

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Sprint 0, 2-3 days)**: T001-T006 - No dependencies, start immediately
2. **Foundational (Sprint 0, 2-3 days)**: T007-T010 - Depends on T001 (baseline established)
3. **Sprint 1 (5-7 days)**: T011-T022 - Depends on Foundational (T007-T010)
4. **Sprint 2 (5-7 days)**: T023-T035 - Can start after Sprint 1 or in parallel with Sprint 1 (different files)
5. **Sprint 3 (4-6 days)**: T036-T044 - Can start after Sprint 1 or in parallel
6. **Sprint 4 (3-5 days)**: T045-T053 - Depends on Sprint 1 (navigation baseline)
7. **Sprint 5 (2-3 days)**: T054-T066 - Depends on all previous sprints complete

### User Story Dependencies

- **US1 (Navigation)**: No dependencies on other stories - can start after Foundational
- **US2 (Track Lists)**: No dependencies on other stories - can start after Foundational
- **US3 (Generation Form)**: No dependencies on other stories - can start after Foundational
- **US4 (Playlists/Projects)**: No dependencies on other stories - can start after Foundational
- **US5 (Unified Studio)**: No dependencies on other stories - can start after Foundational
- **US6 (Modal Consistency)**: Depends on US3, US4 patterns validated
- **US7 (Themes)**: No dependencies on other stories - can run in parallel
- **US8 (Sharing)**: No dependencies on other stories - can run in parallel

**All user stories are independently implementable after Foundational phase.**

### Within Each Sprint

**Sprint 1** (Touch Targets + Virtualization):
- T011-T013 can run in parallel (different components)
- T014 depends on T011-T013 (touch targets fixed first)
- T016-T017 can run in parallel (different buttons in TrackCard)
- T020-T021 can run in parallel (different pages)

**Sprint 2** (Modal Migration):
- T023-T024 can run in parallel (different sections of form)
- T028-T031 can run in parallel (different pages)
- T032-T034 are sequential (validate pattern before wide rollout)

**Sprint 3** (Virtualization Expansion):
- T036-T038 can run in parallel (different studio tabs)
- T040-T043 can run in parallel (different pages)

**Sprint 4** (Header Unification):
- T045-T051 can run in parallel (different pages)
- T052 depends on T045-T051 (pattern validated)

**Sprint 5** (Testing):
- T054-T057 can run in parallel (different features)
- T058-T061 can run in parallel (different testing types)
- T065 depends on T018, T053 (merge and migration complete)

---

## Parallel Execution Examples

### Sprint 1 Parallelization

```bash
# Team of 3 developers can work simultaneously:

# Developer A: Navigation Touch Targets (US1)
T011: Fix BottomNavigation touch targets
T012: Fix MobileHeaderBar back button
T013: Fix FAB Create button

# Developer B: Track List Touch Targets (US2)
T016: Fix TrackCard play button
T017: Fix TrackCard like/menu buttons
T018: Merge TrackCard variants

# Developer C: Virtualization (US2)
T019: Add pull-to-refresh to VirtualizedTrackList
T020: Apply to Playlists page
T021: Apply to Community page
```

### Sprint 2 Parallelization

```bash
# Team of 3 developers:

# Developer A: Generation Form (US3)
T023: Fix form input touch targets
T024: Fix form button touch targets
T025: Enhance auto-save

# Developer B: Settings & Library Modals (US4)
T028: Migrate Settings to ResponsiveModal
T029: Migrate Library filters

# Developer C: Playlist & Profile Modals (US4)
T030: Migrate Create Playlist modal
T031: Migrate ProfilePage edit modal
```

---

## Implementation Strategy

### MVP First (Sprints 0-1: 7-10 days)

**Critical Path**:
1. Sprint 0: Setup + Foundational (4-6 days) - T001-T010
2. Sprint 1: Bundle baseline + Critical touch targets (5-7 days) - T011-T022

**MVP Deliverables**:
- Bundle size <950KB verified
- Navigation touch targets compliant (US1)
- Track list touch targets compliant (US2)
- VirtualizedTrackList applied to Playlists and Community
- 60 FPS scrolling verified

**MVP Validation**:
- User can navigate app smoothly
- User can browse 500+ tracks without jank
- Touch targets meet accessibility standards
- Bundle size within budget

### Incremental Delivery (Sprints 2-5: 14-21 days)

**Sprint 2** (5-7 days):
- Generation form optimized (US3)
- 15+ modals migrated to unified pattern (US4)
- Test on real devices
- **Deliverable**: Consistent modal UX across app

**Sprint 3** (4-6 days):
- Studio optimized (US5)
- Virtualization expanded to 17+ components
- LazyImage adoption increased
- **Deliverable**: All large lists virtualized, 60 FPS everywhere

**Sprint 4** (3-5 days):
- Headers unified across 16+ pages (US6)
- Modal pattern audit complete
- **Deliverable**: Consistent navigation headers

**Sprint 5** (2-3 days):
- Theme sync (US7)
- Sharing/downloading (US8)
- Comprehensive testing
- Documentation updates
- **Deliverable**: Production-ready, fully tested

### Parallel Team Strategy (3 developers)

**Week 1** (Setup + Foundational):
- All team: T001-T010 together (setup infrastructure)

**Week 2-3** (Sprint 1):
- Dev A: US1 Navigation (T011-T015)
- Dev B: US2 Track Lists Part 1 (T016-T019)
- Dev C: US2 Track Lists Part 2 (T020-T022)

**Week 3-4** (Sprint 2):
- Dev A: US3 Generation Form (T023-T027)
- Dev B: US4 Settings/Library Modals (T028-T029)
- Dev C: US4 Playlist/Profile/Track Modals (T030-T033)

**Week 5** (Sprint 3):
- Dev A: US5 Studio (T036-T039)
- Dev B: Search/Artists Virtualization (T040-T041)
- Dev C: LazyImage Adoption (T042-T043)

**Week 6** (Sprint 4):
- Dev A: Headers (T045-T047)
- Dev B: Headers (T048-T050)
- Dev C: Headers (T051-T052)

**Week 7** (Sprint 5):
- Dev A: Testing (T058-T061)
- Dev B: Themes/Sharing (T054-T057)
- Dev C: Cleanup (T062-T066)

**Total Duration**: 7 weeks (35 days) with 3 developers working in parallel

---

## Rollback Strategy

### Component-Level Rollback

Each migrated component has a feature flag:

```typescript
// Example: TrackCard.tsx
const useUnifiedTrackCard = useFeatureFlag('UNIFIED_TRACK_CARD');

if (!useUnifiedTrackCard) {
  return <LegacyTrackCard {...props} />;
}

return <UnifiedTrackCard {...props} />;
```

**Rollback**: Set `UNIFIED_TRACK_CARD=false` in `.env.local`, restart app.

### Feature-Level Rollback

Each user story has a feature flag:

```typescript
// US1: Navigation
UNIFIED_NAV_ENABLED=true

// US2: Virtualized Lists
VIRTUALIZED_LISTS_ENABLED=true

// US3: Unified Forms
UNIFIED_FORMS_ENABLED=true

// US4: Unified Modals
UNIFIED_MODALS_ENABLED=true

// US5: Unified Studio (already exists)
UNIFIED_STUDIO_ENABLED=true

// US6: Unified Headers
UNIFIED_HEADERS_ENABLED=true

// US7: Theme Sync
THEME_SYNC_ENABLED=true

// US8: Telegram Sharing
TELEGRAM_SHARING_ENABLED=true
```

**Rollback**: Disable specific feature flag, redeploy.

### Master Kill Switch

Single master flag reverts entire unified interface:

```typescript
// .env.local
UNIFIED_INTERFACE_ENABLED=false
```

**Effect**: All unified components disabled, app reverts to pre-migration state.

### Git-Based Rollback

If feature flags fail:

```bash
# Find commit before problematic merge
git log --oneline

# Revert specific commit
git revert <commit-hash>

# Or reset to previous state (DANGEROUS - loses history)
git reset --hard <commit-hash>
```

**⚠️ Warning**: Only use git reset in emergency. Prefer feature flags.

### Per-Sprint Rollback Plan

**Sprint 1 Rollback**:
- Disable `UNIFIED_NAV_ENABLED` and `VIRTUALIZED_LISTS_ENABLED`
- Revert commits: T011-T022
- Impact: Navigation and lists revert to old patterns, no data loss

**Sprint 2 Rollback**:
- Disable `UNIFIED_FORMS_ENABLED` and `UNIFIED_MODALS_ENABLED`
- Revert commits: T023-T035
- Impact: Forms and modals revert to old patterns, drafts preserved

**Sprint 3 Rollback**:
- Disable virtualization per-page flags
- Revert commits: T036-T044
- Impact: Lists revert to .map(), performance degraded but functional

**Sprint 4 Rollback**:
- Disable `UNIFIED_HEADERS_ENABLED`
- Revert commits: T045-T053
- Impact: Custom headers restore, navigation still works

**Sprint 5 Rollback**:
- Disable `THEME_SYNC_ENABLED` and `TELEGRAM_SHARING_ENABLED`
- Revert commits: T054-T057
- Impact: Theme sync and sharing features disabled, core app unaffected

---

## Success Metrics & Validation

### Sprint 1 Success Criteria

- ✅ Bundle size baseline established and <950KB
- ✅ BottomNavigation touch targets 56x56px (verified on device)
- ✅ TrackCard buttons 44-48px (verified on device)
- ✅ VirtualizedTrackList applied to Playlists and Community
- ✅ 60 FPS scrolling maintained with 500+ tracks
- ✅ Lighthouse Performance >90 on Library and Community pages

### Sprint 2 Success Criteria

- ✅ Generation form all inputs ≥44px height
- ✅ Auto-save works (drafts persist after app close)
- ✅ 15+ modals use ResponsiveModal pattern
- ✅ All modals swipe-dismissible on mobile
- ✅ Zero Dialog usage on mobile viewport (<768px)
- ✅ Modal UX tested on iPhone and Android

### Sprint 3 Success Criteria

- ✅ UnifiedStudioMobile tab switching 60 FPS
- ✅ 17+ components use VirtualizedTrackList
- ✅ All lists maintain 60 FPS with 500+ items
- ✅ LazyImage adoption >50% (from 23%)
- ✅ Memory usage <100MB increase during scroll

### Sprint 4 Success Criteria

- ✅ 16+ pages use MobileHeaderBar
- ✅ All pages have consistent header structure
- ✅ Back button works from all pages
- ✅ Modal pattern audit complete (zero non-compliant modals)
- ✅ Visual regression tests pass

### Sprint 5 Success Criteria

- ✅ Lighthouse Performance >90 on all main pages
- ✅ Lighthouse Accessibility >90 (zero WCAG AA violations)
- ✅ Bundle size <950KB gzipped
- ✅ All user flows tested on 4 device types (iPhone, Android, iPad, Desktop)
- ✅ Theme sync <500ms response time
- ✅ Telegram sharing works (contacts, Stories)
- ✅ Zero regressions from baseline
- ✅ Deprecated components removed
- ✅ Documentation complete (CLAUDE.md, quickstart.md)

### Overall Project Success Criteria (from spec.md)

- **SC-001**: ✅ Navigate between main sections within 0.5 seconds
- **SC-002**: ✅ 100% touch target compliance (44-56px minimum)
- **SC-003**: ✅ 60 FPS scrolling for 500+ item lists
- **SC-004**: ✅ Bundle size < 950KB gzipped
- **SC-005**: ✅ Initial page load < 3 seconds on 3G
- **SC-006**: ✅ Touch interactions < 100ms response
- **SC-007**: ✅ Lighthouse Mobile Performance > 90
- **SC-008**: ✅ Form auto-save within 2 seconds
- **SC-009**: ✅ 95% task completion on first attempt (measured via analytics)
- **SC-010**: ✅ Theme switching < 500ms
- **SC-011**: ✅ Safe area respect on notched devices
- **SC-012**: ✅ Pull-to-refresh < 1 second
- **SC-013**: ✅ Zero WCAG AA violations
- **SC-014**: ✅ 80%+ component reusability (unified components usage)

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Feature flags enable gradual rollout and easy rollback
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Small PRs (1-3 components per PR) for easier review
- Device testing on real devices (iPhone, Android) is critical - allocate 30% of time
- Monitor bundle size after every commit (automated via pre-commit hook)

---

## Risk Mitigation Summary

| Risk | Mitigation | Rollback Plan |
|------|-----------|---------------|
| **Breaking existing functionality** | Feature flags for each component/story, incremental rollout | Disable feature flag, revert commits |
| **Bundle size exceeds 950KB** | Pre-commit hook blocks commits >950KB, lazy load Tone.js | Revert heavy imports, remove new features |
| **Touch target violations** | Validation utility enforces 44-56px, device testing | Fix immediately (P0 priority) |
| **Performance regression** | Lighthouse CI on PRs, Chrome DevTools profiling | Revert virtualization changes |
| **Modal UX issues** | Test on iOS and Android before rollout, user feedback loop | Disable UNIFIED_MODALS_ENABLED flag |
| **Timeline overrun** | Phased approach, parallel work, automate where possible | Reduce scope, deliver MVP (Sprint 1) first |
| **Accessibility gaps** | axe-core on every sprint, manual keyboard testing | Fix immediately (P1 priority) |
| **Device compatibility** | Test matrix (iPhone, Android, iPad, Desktop) | Fix device-specific issues or add fallbacks |

---

## Estimated Timeline Summary

| Sprint | Duration | Tasks | Team Size | Parallel Work |
|--------|----------|-------|-----------|---------------|
| **Sprint 0** (Setup + Foundational) | 4-6 days | T001-T010 | 1-3 devs | Limited (setup tasks) |
| **Sprint 1** (Touch Targets + Virtualization) | 5-7 days | T011-T022 | 2-3 devs | High (US1 + US2 parallel) |
| **Sprint 2** (Modal Migration) | 5-7 days | T023-T035 | 2-3 devs | High (US3 + US4 parallel) |
| **Sprint 3** (Virtualization Expansion) | 4-6 days | T036-T044 | 2-3 devs | High (multiple pages) |
| **Sprint 4** (Header Unification) | 3-5 days | T045-T053 | 2-3 devs | High (16+ pages parallel) |
| **Sprint 5** (Testing & Cleanup) | 2-3 days | T054-T066 | 2-3 devs | Medium (testing sequential) |
| **TOTAL** | **23-34 days** | 66 tasks | 2-3 devs | High overall |

**Optimistic**: 23 days (with 3 developers, high parallelization, no blockers)  
**Realistic**: 27-30 days (with 2-3 developers, some blockers, testing time)  
**Pessimistic**: 34 days (with 2 developers, many blockers, extended testing)

**User's Original Estimate**: 19-29 days for Phase 2 implementation  
**Our Estimate**: 23-34 days (slightly longer due to comprehensive testing and rollback plans)

**Recommendation**: Target 27-day timeline with 3 developers for realistic delivery with buffer for testing and rollback validation.

---

## Next Steps

1. ✅ Review and approve this tasks.md
2. 🔄 Create feature flag system (T003)
3. 🔄 Establish bundle size baseline (T001)
4. 🔄 Begin Sprint 0 (Setup + Foundational)
5. 🔄 After Sprint 0: Start Sprint 1 (Touch Targets + Virtualization)
6. 🔄 Continue sprints 2-5 sequentially or with parallel teams
7. 🔄 Final validation and production deployment

**This tasks.md is immediately executable** - each task has specific file paths, acceptance criteria, time estimates, rollback plans, and dependencies documented.
