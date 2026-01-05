# Feature Specification: Unified Interface Application

**Feature Branch**: `001-unified-interface`  
**Created**: 2026-01-05  
**Status**: Phase 2 Implementation (32 tasks completed)  
**Input**: Complete unified interface architecture migration across 991 TSX components for MusicVerse AI Telegram Mini App

## Problem Statement

MusicVerse AI currently has 991 TSX components with inconsistent mobile UX patterns, creating a fragmented user experience. While core unified components (MainLayout, BottomNavigation, MobileHeaderBar, MobileBottomSheet, VirtualizedTrackList, UnifiedStudioMobile) exist and work well, only 30% of components use them consistently. This inconsistency leads to:

1. **Touch Target Violations**: 5+ component types have buttons/controls below the minimum 44px touch target requirement, causing accessibility issues and user frustration on mobile devices
2. **Modal Pattern Chaos**: 30+ components use Radix Dialog on mobile instead of the native-feeling MobileBottomSheet, creating jarring UX that breaks Telegram Mini App conventions
3. **Performance Issues**: Only 9 components use VirtualizedTrackList despite 28+ features displaying large lists (100-500+ items), causing scroll jank and memory bloat
4. **Bundle Size Risk**: Estimated bundle size ~1095KB exceeds the 950KB target by 15%, threatening mobile load performance
5. **Inconsistent Navigation**: Only 28% of pages use MobileHeaderBar despite it being available, leading to varied header layouts and navigation patterns

**Why This Matters**: MusicVerse AI is a Telegram Mini App targeting mobile users. A fragmented mobile experience with touch target violations and inconsistent patterns directly impacts user satisfaction, accessibility compliance (WCAG AA), and app performance. With 991 components and 37 pages, systematic unification is essential to deliver a polished, professional product.

**Core Challenge**: This is not an architecture redesign—the unified patterns already exist and are well-designed. The challenge is **scale**: systematically applying these patterns across 991 components while maintaining backward compatibility, staying within the 950KB bundle budget, and ensuring zero regressions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Main Sections (Priority: P1)

Users need to move seamlessly between Home, Library, Create, Projects, and More sections with consistent navigation patterns, clear back button behavior, and responsive touch targets.

**Why this priority**: Navigation is the foundation of the entire app experience. If users cannot navigate reliably, all other features become inaccessible. This is the critical path for every user interaction.

**Independent Test**: Can be fully tested by launching the app, tapping bottom navigation tabs (Home/Library/Create/Projects/More), verifying back button appears when appropriate, and confirming touch targets feel natural on iPhone 14 Pro and Pixel 7. Delivers immediate value by ensuring users never get "stuck" in the app.

**Acceptance Scenarios**:

1. **Given** user is on Home screen, **When** user taps Library tab in bottom navigation, **Then** Library page loads within 0.5 seconds and bottom nav highlights Library
2. **Given** user is on Library screen, **When** user taps Create FAB button (center of bottom nav), **Then** Create form opens and back button appears in header
3. **Given** user is on Create form, **When** user taps back button in MobileHeaderBar, **Then** app returns to Library with scroll position preserved
4. **Given** user is on any screen with bottom navigation, **When** user taps any nav button, **Then** Telegram HapticFeedback fires (selection changed) for tactile confirmation
5. **Given** user is on iPhone 14 Pro with notch, **When** user views any page, **Then** safe area insets are respected (no content hidden behind notch/status bar)

---

### User Story 2 - Browse and Interact with Track Lists (Priority: P1)

Users need to scroll through large track collections (500+ tracks) smoothly at 60 FPS, with consistent card layouts and touch-friendly play/like/menu buttons.

**Why this priority**: Track browsing is the primary activity in MusicVerse AI. Performance issues here (scroll jank, memory bloat) directly degrade the core experience. With users accumulating 500+ tracks, virtualization is not optional—it's essential.

**Independent Test**: Can be fully tested by opening Library with 500+ tracks, scrolling rapidly, verifying 60 FPS in Chrome DevTools, tapping play/like/menu buttons on various cards, and confirming pull-to-refresh works. Delivers immediate value by making the app feel fast and responsive.

**Acceptance Scenarios**:

1. **Given** user has 500+ tracks in Library, **When** user scrolls quickly, **Then** app maintains 60 FPS with no jank (verified via Chrome DevTools Performance panel)
2. **Given** user is viewing track list, **When** user taps play button on any track card, **Then** track starts playing within 100ms and haptic feedback fires
3. **Given** user is viewing track card, **When** user taps like button (44x44px minimum), **Then** button is easily tappable without accidental taps on adjacent buttons (8px spacing minimum)
4. **Given** user is viewing track list, **When** user taps 3-dot menu button (44x44px minimum), **Then** MobileActionSheet opens with track actions (Share, Add to Playlist, Download, Delete)
5. **Given** user is at top of track list, **When** user pulls down gesture, **Then** refresh indicator appears, track list refreshes, and haptic feedback fires on completion
6. **Given** user scrolls to position 50 in track list, **When** user navigates away and returns, **Then** scroll position is restored to position 50

---

### User Story 3 - Create Music with Generation Form (Priority: P1)

Users need to fill out the music generation form with auto-save, clear validation messages, and touch-friendly input fields and buttons.

**Why this priority**: Music generation is the primary value proposition of MusicVerse AI. If users cannot easily create music, the app fails its core mission. Form usability directly impacts conversion rates and user satisfaction.

**Independent Test**: Can be fully tested by opening Create form, filling description/lyrics/style fields, verifying auto-save indicator appears, navigating away, returning to verify draft restored, submitting generation, and confirming validation messages are clear. Delivers immediate value by preventing draft loss and reducing form submission errors.

**Acceptance Scenarios**:

1. **Given** user opens Create form, **When** user types description text, **Then** auto-save indicator appears after 2 seconds of inactivity and draft is saved to localStorage
2. **Given** user has a saved draft, **When** user navigates away and returns, **Then** draft is automatically restored with all field values intact
3. **Given** user fills form with invalid data (empty title), **When** user taps Submit button, **Then** validation error appears next to title field with red text and error icon
4. **Given** user is filling form fields, **When** user taps any input field (44px height minimum), **Then** field is easily tappable and keyboard opens smoothly
5. **Given** user has filled all required fields, **When** user taps Submit button (48px height), **Then** button shows loading spinner, Telegram haptic feedback fires, and generation task starts
6. **Given** form validation fails, **When** error messages appear, **Then** error text meets WCAG AA color contrast (4.5:1 minimum) and includes clear instructions to fix

---

### User Story 4 - Manage Playlists and Projects (Priority: P2)

Users need to create/edit playlists and projects through modals that feel native on mobile (swipeable bottom sheets) and appropriate on desktop (centered dialogs).

**Why this priority**: Playlist and project management are secondary features (users browse/create music first), but essential for power users organizing large libraries. Modal UX consistency builds trust and makes the app feel polished.

**Independent Test**: Can be fully tested by creating a new playlist via bottom sheet on mobile, editing playlist details, verifying swipe-to-dismiss gesture works, testing on desktop to confirm Dialog is used instead, and verifying all form inputs have 44px touch targets. Delivers immediate value by making content organization feel natural and intuitive.

**Acceptance Scenarios**:

1. **Given** user taps "Create Playlist" button, **When** on mobile viewport (<768px), **Then** MobileBottomSheet opens at 50% viewport height with swipe-to-dismiss enabled
2. **Given** user is viewing playlist creation bottom sheet, **When** user drags sheet downward, **Then** sheet follows finger and dismisses when dragged below threshold (30% viewport height)
3. **Given** user is on desktop viewport (≥768px), **When** user clicks "Create Playlist" button, **Then** centered Dialog opens with backdrop blur (not bottom sheet)
4. **Given** user is filling playlist name field, **When** user types text, **Then** input field is 44px height minimum and easily tappable
5. **Given** user taps backdrop area, **When** backdrop dismiss is enabled (default), **Then** modal closes and Telegram haptic feedback fires (light impact)
6. **Given** user submits playlist creation form, **When** request succeeds, **Then** success haptic feedback fires, modal closes, and user sees new playlist in list

---

### User Story 5 - Work in Unified Studio (Priority: P2)

Users need to interact with the audio production studio through swipeable tabs (Player, Sections, Tracks, Mixer, Actions) with smooth 60 FPS animations and touch-friendly controls.

**Why this priority**: Studio is a power user feature used by creators producing high-quality music. While secondary to basic generation, it's critical for the "pro" user segment. Performance and UX here signals product quality.

**Independent Test**: Can be fully tested by opening a track in Studio, swiping between tabs, verifying tab transitions are smooth (60 FPS), adjusting mixer volume controls, and confirming all buttons meet 44px touch targets. Delivers immediate value by making the pro workflow feel professional and responsive.

**Acceptance Scenarios**:

1. **Given** user opens track in Studio, **When** user swipes left/right on tab content, **Then** tab content animates smoothly at 60 FPS between Player/Sections/Tracks/Mixer/Actions
2. **Given** user is on Mixer tab, **When** user adjusts volume slider, **Then** slider handle is 44px minimum and easily draggable
3. **Given** user is on Tracks tab with 100+ tracks, **When** user scrolls track list, **Then** VirtualizedTrackList maintains 60 FPS and uses less than 100MB memory
4. **Given** user taps any studio action button (Export, Share, Save), **When** action triggers, **Then** Telegram haptic feedback fires (medium impact) for tactile confirmation
5. **Given** user is on Actions tab, **When** user taps Export button, **Then** export progress appears with percentage and estimated time remaining

---

### User Story 6 - Use Modals Consistently Across App (Priority: P2)

Users expect all modals (forms, menus, confirmations) to follow consistent patterns: native bottom sheets on mobile for forms, action sheets for menus, centered dialogs for confirmations.

**Why this priority**: Modal consistency is a "polish" feature that elevates the app from "functional" to "professional." While not blocking core workflows, inconsistent modals create cognitive friction and break user trust in the product quality.

**Independent Test**: Can be fully tested by triggering all modal types (track menu, share sheet, delete confirmation, filter sheet, edit profile sheet), verifying correct pattern is used based on modal decision matrix, and confirming all modals are swipe-dismissible on mobile. Delivers immediate value by making the app feel "complete" rather than "patched together."

**Acceptance Scenarios**:

1. **Given** user taps track 3-dot menu button, **When** on mobile, **Then** MobileActionSheet opens with actions (Share, Add to Playlist, Download, Delete) using iOS-style action list
2. **Given** user taps Delete action in action sheet, **When** action is destructive, **Then** action item is styled with red text and warning icon
3. **Given** user taps Library filter button, **When** on mobile, **Then** MobileBottomSheet opens with filter/sort options (not Radix Dialog)
4. **Given** user taps Logout in Settings, **When** on any viewport, **Then** centered Dialog opens asking "Are you sure?" (not bottom sheet, because confirmation)
5. **Given** user opens any modal on desktop (≥768px), **When** modal is a form, **Then** Dialog is used instead of MobileBottomSheet (responsive modal pattern)

---

### User Story 7 - Switch Between Themes (Priority: P3)

Users need the app theme to automatically sync with Telegram theme changes within 500ms, supporting light/dark mode and high contrast preferences.

**Why this priority**: Theme sync is a "nice-to-have" feature that enhances Telegram integration feel but doesn't block core workflows. Users can function without it—it just won't feel as polished.

**Independent Test**: Can be fully tested by changing Telegram theme settings, verifying app updates within 500ms, enabling high contrast mode, and confirming color contrast ratios meet WCAG AA (4.5:1 for text). Delivers value by making the app feel like a "true" Telegram Mini App.

**Acceptance Scenarios**:

1. **Given** user changes Telegram theme to dark mode, **When** theme event fires, **Then** app switches to dark theme within 500ms
2. **Given** app is in dark mode, **When** user views text elements, **Then** all text meets WCAG AA contrast ratio (4.5:1 minimum) against background
3. **Given** user enables high contrast mode in system settings, **When** app loads, **Then** high contrast colors are applied (borders thicker, contrast higher)

---

### User Story 8 - Share and Download Content (Priority: P3)

Users need to share tracks to Telegram contacts/Stories and download audio files with progress indicators and haptic feedback.

**Why this priority**: Sharing is a viral growth feature (user shares music, friends discover app), but it's not blocking core use cases (create/browse music). Download is a convenience feature for offline playback.

**Independent Test**: Can be fully tested by tapping Share button on any track, selecting Telegram contact, verifying rich preview appears, downloading a track, and confirming progress indicator shows percentage. Delivers value by enabling user-generated growth and offline access.

**Acceptance Scenarios**:

1. **Given** user taps Share button on track, **When** on mobile, **Then** Telegram native share sheet opens with contacts list
2. **Given** user selects contact to share with, **When** share completes, **Then** rich preview card appears in chat with track title, artist, cover art
3. **Given** user taps Download button on track, **When** download starts, **Then** progress bar appears showing percentage (0-100%) and haptic feedback fires on completion

---

### Edge Cases

- **What happens when user has 1000+ tracks in Library?** VirtualizedTrackList renders only visible items (20-30 at a time), keeping memory usage under 100MB and maintaining 60 FPS scrolling.
- **How does system handle modal stacking (modal opens another modal)?** Maximum 2 modal levels allowed. Third modal replaces second. Z-index automatically managed.
- **What if user rotates device to landscape?** Portrait orientation is locked via MainLayout configuration. Landscape shows "Please rotate device" message.
- **How does app handle network errors during auto-save?** Draft saves to localStorage (offline-first). When network returns, auto-sync to cloud storage occurs in background.
- **What if user's device has non-standard notch (folding phone, punch-hole)?** Safe area insets are detected via CSS env() variables and applied dynamically to all pages.
- **How does app handle very long track titles (>100 chars)?** Titles truncate with ellipsis at 2 lines. Tap title to expand in MobileBottomSheet with full title.
- **What happens if bundle size exceeds 950KB during development?** Pre-commit hook blocks commit. Developer must lazy-load heavy components (Tone.js, Wavesurfer) before committing.
- **How does system handle rapid tab switching in BottomNavigation?** Haptic feedback is debounced (max 1 per 100ms) to prevent haptic fatigue. Page transitions are throttled to prevent race conditions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST wrap all pages in MainLayout component via React Router Outlet pattern to ensure consistent layout structure
- **FR-002**: System MUST display BottomNavigation on all main pages (Home, Library, Create, Projects, More) with 56x56px minimum touch targets
- **FR-003**: System MUST show MobileHeaderBar on all secondary pages with back button (when not root page) and optional action buttons (max 2)
- **FR-004**: System MUST use MobileBottomSheet for all form modals on mobile viewport (<768px) with swipe-to-dismiss gesture enabled
- **FR-005**: System MUST use MobileActionSheet for all action menus (3-dot menus, share sheets) on mobile viewport (<768px)
- **FR-006**: System MUST use centered Dialog for all confirmation prompts on both mobile and desktop (confirmations should not be swipeable)
- **FR-007**: System MUST use ResponsiveModal wrapper that automatically switches between Dialog (desktop) and MobileBottomSheet (mobile) based on viewport width
- **FR-008**: System MUST apply VirtualizedTrackList to all pages displaying >50 items to maintain 60 FPS scrolling
- **FR-009**: System MUST use LazyImage component for all cover art, avatar, and hero images with blur hash placeholder
- **FR-010**: System MUST maintain bundle size < 950KB gzipped by lazy-loading heavy dependencies (Tone.js, Wavesurfer)
- **FR-011**: System MUST enforce 44px minimum touch target size for all interactive elements (buttons, links, tabs, chips)
- **FR-012**: System MUST enforce 48px minimum height for primary action buttons (Submit, Generate, Save)
- **FR-013**: System MUST enforce 56px minimum height for bottom navigation tabs and FAB (Create) button
- **FR-014**: System MUST maintain 8px minimum spacing between adjacent touch targets to prevent accidental taps
- **FR-015**: System MUST fire Telegram HapticFeedback on all user interactions (button taps, tab switches, modal open/close)
- **FR-016**: System MUST respect safe area insets on notched devices (iPhone 14 Pro, Dynamic Island) by applying safe-top and safe-bottom utilities
- **FR-017**: System MUST implement pull-to-refresh gesture on all virtualized lists with animated indicator and haptic feedback
- **FR-018**: System MUST auto-save form drafts to localStorage every 2 seconds after user stops typing
- **FR-019**: System MUST restore form drafts on page return within 30-minute expiry window
- **FR-020**: System MUST display inline validation messages next to affected fields (not toast/top of form)
- **FR-021**: System MUST include ARIA labels on all icon-only buttons for screen reader accessibility
- **FR-022**: System MUST support keyboard navigation (Tab, Enter, Escape) on all modals and forms
- **FR-023**: System MUST trap focus within modals (Tab cycles through modal elements only)
- **FR-024**: System MUST meet WCAG AA color contrast ratios (4.5:1 for text, 3:1 for UI components)
- **FR-025**: System MUST lock orientation to portrait mode on mobile devices
- **FR-026**: System MUST sync theme with Telegram theme changes within 500ms
- **FR-027**: System MUST support high contrast mode for users with visual impairments
- **FR-028**: System MUST track migration status of all 991 components in migration-tracker.csv
- **FR-029**: System MUST implement feature flags for gradual rollout of unified components
- **FR-030**: System MUST provide rollback mechanism (feature flags + git revert) for all unified components

### Key Entities

- **UnifiedComponent**: Represents any UI component that follows unified interface patterns (touch targets, modals, virtualization, theming). Properties: id, category (layout/navigation/modal/list/card/form/player/mobile), status (unified/partial/legacy), touchTargetCompliant (boolean), variants (optional string array).

- **NavigationContext**: Represents current navigation state controlling which UI elements are visible. Properties: currentRoute (string), history (string array), showBottomNav (boolean), header config (showBackButton, title, titleAlign, actions array, showSearch), telegram state (mainButtonVisible, mainButtonText, mainButtonEnabled, backButtonVisible), safeArea insets (top/bottom/left/right in px).

- **ModalState**: Represents currently displayed modal(s) with type and dismiss behavior. Properties: id (string), type (bottom-sheet/action-sheet/dialog/drawer), viewport (mobile/desktop), content component, dismissBehavior (backdropDismiss, swipeToDismiss, escapeKeyDismiss), snapPoints (optional number array 0.0-1.0), zIndex (number), animationState (entering/open/exiting/closed).

- **VirtualizedContent**: Represents large lists/grids requiring virtualization for performance. Properties: totalCount (number), items (array), visibleRange (start/end indices), itemSize (height and width, fixed or dynamic), scrollPosition (px), loading (boolean), error (Error or null), cache (Map of rendered items), infiniteScroll config (enabled, threshold, hasNextPage, isFetchingNextPage, fetchNextPage callback), pullToRefresh config (enabled, isRefreshing, onRefresh callback).

- **FormDraft**: Represents auto-saved form data stored in localStorage. Properties: formId (string identifier like 'generate-music'), values (Record of field values), lastSaved (ISO 8601 timestamp), expiresAt (ISO 8601 timestamp 30 min after lastSaved), version (number for migration compatibility), userId (string), completionPercent (0-100), invalidFields (string array).

- **ThemeConfiguration**: Represents current theme settings synchronized with Telegram. Properties: scheme (light/dark), colors (primary/secondary/background/foreground/accent/destructive/border/input/ring), contrastLevel (normal/high), safeArea insets, systemUI preferences (prefersReducedMotion, prefersHighContrast, devicePixelRatio), telegram-specific colors (bgColor/textColor/hintColor/linkColor/buttonColor/buttonTextColor).

- **TouchInteraction**: Represents touch event configuration for interactive elements. Properties: elementRef (React ref), touchTarget size (width/height/minSize in px), hapticFeedback type (light/medium/heavy/selection/success/error/none), state (idle/pressed/disabled/loading), animation config (pressScale, pressOpacity, spring stiffness/damping), event handlers (onTouchStart/End/Cancel), accessibility (role, ariaLabel, ariaPressed, ariaDisabled).

- **ComponentMigrationStatus**: Represents migration progress for individual components. Properties: componentPath (string), componentName (string), category (string), status (not-started/in-progress/complete/verified), patternsApplied booleans (usesMainLayout, usesMobileHeaderBar, usesMobileBottomSheet, usesVirtualizedTrackList, usesLazyImage), touchTargetCompliant (boolean), accessibilityCompliant (boolean), assignedTo (developer name), sprint (string), priority (P0/P1/P2/P3), estimatedEffort (days), notes (string).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between any two main sections (Home/Library/Create/Projects/More) within 0.5 seconds measured from tap to page render complete
- **SC-002**: 100% of interactive elements meet touch target compliance (44-56px minimum) verified by automated validation script on all 991 components
- **SC-003**: All lists with >50 items maintain 60 FPS scrolling measured via Chrome DevTools Performance panel with no dropped frames
- **SC-004**: Production bundle size remains <950KB gzipped measured by pre-commit hook and CI pipeline checks
- **SC-005**: Initial page load completes <3 seconds on simulated 3G network (Lighthouse Mobile audit)
- **SC-006**: Touch interactions trigger response within 100ms measured from touchstart to visual feedback (haptic + animation)
- **SC-007**: Lighthouse Mobile Performance score >90 for all main pages (Home, Library, Create, Projects, More)
- **SC-008**: Form drafts auto-save within 2 seconds of last keystroke verified by localStorage inspection
- **SC-009**: 95% of users complete primary task (create music, browse library, create playlist) on first attempt without errors (measured via analytics)
- **SC-010**: Theme synchronization with Telegram completes within 500ms of theme change event measured by timestamp diff
- **SC-011**: 100% of pages respect safe area insets on notched devices (iPhone 14 Pro, Dynamic Island) verified by visual inspection
- **SC-012**: Pull-to-refresh gesture completes within 1 second from pull start to content refresh measured by timestamp diff
- **SC-013**: Zero WCAG AA accessibility violations detected by axe-core automated audit across all unified components
- **SC-014**: 80%+ of components use unified patterns (MainLayout, MobileHeaderBar, VirtualizedTrackList, ResponsiveModal) measured by migration-tracker.csv status

## Technical Constraints

### Platform Constraints

- **TC-001**: App MUST run as Telegram Mini App requiring @twa-dev/sdk integration for all native features (MainButton, BackButton, HapticFeedback, CloudStorage, sharing)
- **TC-002**: App MUST support iOS Safari 15+ (iOS WebKit) and Chrome Android 100+ as minimum browser versions
- **TC-003**: App MUST lock orientation to portrait mode on mobile devices (landscape not supported per product requirements)
- **TC-004**: App MUST use single audio element pattern for audio playback (iOS Safari limitation of 1 audio context per page)
- **TC-005**: App MUST respect 950KB bundle size budget enforced by pre-commit hook (exceeding requires lazy loading or dependency removal)

### Architecture Constraints

- **TC-006**: App MUST use React 19 and React Router for routing with all pages wrapped by MainLayout via Outlet pattern
- **TC-007**: App MUST use TanStack Query v5 for server state management with optimized caching (staleTime 30s, gcTime 10min)
- **TC-008**: App MUST use Zustand for global UI state (player, lyrics wizard, project planner) keeping stores minimal
- **TC-009**: App MUST use Framer Motion via @/lib/motion wrapper for animations with tree-shaking enabled
- **TC-010**: App MUST use react-virtuoso for list virtualization (VirtualizedTrackList component)
- **TC-011**: App MUST use shadcn/ui + Radix UI for base components following established patterns
- **TC-012**: App MUST use Tailwind CSS for styling with custom touch-target utility classes (touch-target-44/48/56)

### Performance Constraints

- **TC-013**: App MUST maintain <100MB memory increase during scroll of 500+ item lists measured by Chrome DevTools Memory profiler
- **TC-014**: App MUST achieve <200ms Time to Interactive on initial page load measured by Lighthouse
- **TC-015**: App MUST limit modal stack depth to 2 levels (opening 3rd modal replaces 2nd to prevent z-index chaos)

### Security & Privacy Constraints

- **TC-016**: App MUST enforce Row Level Security (RLS) policies on all database tables using Supabase/Lovable Cloud
- **TC-017**: App MUST validate user input on both client (Zod) and server (Edge Functions) to prevent injection attacks
- **TC-018**: App MUST store form drafts in localStorage only (not Telegram CloudStorage) to avoid leaking sensitive generation prompts

## Dependencies & Assumptions

### External Dependencies

- **Telegram Bot Platform**: Telegram Mini App SDK (@twa-dev/sdk) must remain stable. Breaking changes in SDK require immediate attention and potentially block releases.
- **Lovable Cloud (Supabase)**: Backend services (database, auth, edge functions, storage) must maintain 99.9% uptime. Outages block generation, saving, and user management.
- **Suno AI API**: Music generation service must respond within 5 seconds for synchronous operations. Downtime blocks primary feature.
- **React 19 & React Router**: Framework updates must be monitored for breaking changes. Major version updates require testing across all 991 components.

### Technical Assumptions

- **Browser Support**: Assumes iOS Safari 15+ and Chrome Android 100+ cover 95%+ of target users. Older browsers not tested or supported.
- **Network Conditions**: Assumes 3G minimum network speed for performance targets. Slower networks may degrade experience but app remains functional.
- **Device Types**: Assumes iPhone 14 Pro (notch) and Pixel 7 (standard display) cover majority of device edge cases. Folding phones and tablets are secondary priorities.
- **User Behavior**: Assumes 80% of users primarily create/browse music, 20% use advanced features (Studio, stem separation). Optimization prioritizes primary flows.
- **Bundle Size Management**: Assumes lazy loading Tone.js (200KB) and Wavesurfer (60KB) can keep bundle under 950KB. If not, additional features may need to be delayed or removed.

### Process Assumptions

- **Development Team**: Assumes 2-3 developers available for 27-30 days (realistic timeline). Single developer would extend to 50+ days.
- **Testing Resources**: Assumes access to physical iOS and Android devices for touch target validation. Simulator testing alone is insufficient.
- **Rollback Strategy**: Assumes feature flags can revert any unified component to legacy version without code deployment. Git revert is backup for critical failures.
- **Incremental Delivery**: Assumes users tolerate gradual rollout (20-30% components per sprint). If full rollout required, timeline extends by 40%.

## Risks & Mitigation Strategies

### High Risks (Likelihood: Medium-High, Impact: High)

| Risk ID | Risk | Impact | Probability | Mitigation Strategy | Owner |
|---------|------|--------|-------------|-------------------|-------|
| **R-001** | Breaking existing functionality during component migration | Users cannot complete critical workflows (create music, browse library) leading to support tickets and churn | **MEDIUM** (50% chance during 991-component migration) | 1. Feature flags on every unified component (instant rollback), 2. Maintain legacy components until validation complete, 3. Comprehensive E2E tests before rollout, 4. Gradual rollout (20-30% users per sprint), 5. Monitor error rates in production | Tech Lead |
| **R-002** | Bundle size exceeds 950KB budget breaking performance targets | Mobile users experience slow load times (>3s), high bounce rates, poor App Store ratings | **MEDIUM** (50% if Tone.js/Wavesurfer not lazy-loaded) | 1. Pre-commit hook blocks commits >950KB, 2. Lazy load Tone.js (200KB) only when Studio/MIDI opened, 3. Lazy load Wavesurfer (60KB) only when waveform rendered, 4. Tree-shake Framer Motion aggressively, 5. Bundle analyzer on every build | Frontend Lead |
| **R-003** | Timeline overrun due to scale (991 components) | Feature delayed by 2-4 weeks, blocking dependent features (Analytics v2, Collaboration), team morale impact | **HIGH** (70% chance without mitigation) | 1. Phased approach (MVP → Incremental), 2. Automate where possible (search/replace, code generation), 3. Parallel work (3 devs, different files), 4. Focus on high-impact screens first (Library, Generate, Studio), 5. Defer P3 tasks if timeline pressured | Project Manager |

### Medium Risks (Likelihood: Medium, Impact: Medium)

| Risk ID | Risk | Impact | Probability | Mitigation Strategy | Owner |
|---------|------|--------|-------------|-------------------|-------|
| **R-004** | Touch target validation requires extensive device testing | Cannot verify 44-56px compliance, accessibility violations slip through | **MEDIUM** (40% if only simulator testing) | 1. Allocate 30% of sprint time to device testing, 2. Physical devices required (iPhone 14 Pro, Pixel 7), 3. BrowserStack for extended coverage, 4. Automated validation script for 80% of cases | QA Lead |
| **R-005** | Modal migration breaks established UX patterns | Users complain about "weird" swipeable modals, prefer old Dialog behavior | **MEDIUM** (30% based on user testing unknowns) | 1. Document modal decision matrix clearly, 2. User testing on 20-30 beta users before full rollout, 3. Feature flag per modal type for easy revert, 4. Collect user feedback via in-app survey | Product Manager |
| **R-006** | Performance regression in virtualized lists | VirtualizedTrackList performs worse than old .map() in edge cases (dynamic heights) | **LOW** (20% based on react-virtuoso maturity) | 1. Baseline performance metrics before migration, 2. Monitor FPS after each sprint, 3. React DevTools Profiler to identify bottlenecks, 4. Fall back to .map() for lists <50 items | Frontend Lead |

### Low Risks (Likelihood: Low, Impact: Low-Medium)

| Risk ID | Risk | Impact | Probability | Mitigation Strategy | Owner |
|---------|------|--------|-------------|-------------------|-------|
| **R-007** | Accessibility compliance gaps prevent WCAG AA certification | Cannot market app as accessible, potential legal issues in some jurisdictions | **MEDIUM** (30% without testing) | 1. Run axe-core after each sprint, 2. Manual keyboard navigation testing, 3. Screen reader testing (VoiceOver, TalkBack), 4. WCAG AA audit before final release | Accessibility Lead |
| **R-008** | Inconsistent pattern adoption across team | Developers use old patterns despite unified components being available | **LOW** (20% with good documentation) | 1. Clear quickstart.md with code examples, 2. Code review checklist for unified patterns, 3. Automated linting rules where possible (ESLint plugin), 4. Weekly team sync on pattern usage | Tech Lead |
| **R-009** | Telegram SDK breaking changes | New SDK version incompatible with current integration, requires emergency refactor | **LOW** (10% based on Telegram's stability) | 1. Pin @twa-dev/sdk version in package.json, 2. Monitor Telegram changelog, 3. Test SDK updates in staging before production, 4. Maintain SDK abstraction layer for easy swaps | Backend Lead |

## Success Metrics & Validation

### Phase 0 (Research) - COMPLETE ✅
- ✅ Component inventory covering all 991 components documented
- ✅ Baseline bundle size established with chunk breakdown
- ✅ Touch target audit identifies all non-compliant components
- ✅ Accessibility baseline (Lighthouse scores) documented
- ✅ research.md document approved by 2+ maintainers

### Phase 1 (Design & Documentation) - COMPLETE ✅
- ✅ Unified component schemas documented in data-model.md
- ✅ Developer quickstart guide completed
- ✅ Component contracts defined in TypeScript (contracts/ directory)
- ✅ Agent context updated with unified patterns (CLAUDE.md)

### Phase 2 (Implementation) - IN PROGRESS 🔄
- 🔄 Sprint 0: Baseline established (bundle size, feature flags, validation tooling) - **32 tasks complete**
- 🔄 Sprint 1: Touch targets fixed, virtualization applied to high-impact pages - **5 tasks complete**
- ⏸️ Sprint 2: Modal migration to ResponsiveModal pattern (15+ modals) - **0 tasks complete**
- ⏸️ Sprint 3: Virtualization expansion, LazyImage adoption - **0 tasks complete**
- ⏸️ Sprint 4: Header unification across 16+ pages - **0 tasks complete**
- ⏸️ Sprint 5: Testing, accessibility audit, cleanup - **0 tasks complete**

### Overall Project Success Criteria (Final Validation)

**Performance Metrics**:
- **M-001**: Bundle size <950KB gzipped (measured by pre-commit hook) - **Target: <950KB**
- **M-002**: Lighthouse Mobile Performance score >90 for all main pages - **Target: >90**
- **M-003**: 60 FPS scrolling maintained with 500+ items (Chrome DevTools) - **Target: 60 FPS**
- **M-004**: Initial page load <3 seconds on 3G network (Lighthouse) - **Target: <3s**
- **M-005**: Touch interaction response <100ms (touchstart to feedback) - **Target: <100ms**

**User Experience Metrics**:
- **M-006**: 95% task completion rate on first attempt (analytics) - **Target: >95%**
- **M-007**: Theme sync response <500ms (timestamp diff) - **Target: <500ms**
- **M-008**: Pull-to-refresh completes <1 second (timestamp diff) - **Target: <1s**
- **M-009**: Form auto-save triggers within 2 seconds (localStorage check) - **Target: <2s**

**Quality Metrics**:
- **M-010**: 100% touch target compliance (44-56px minimum) - **Target: 100%**
- **M-011**: Zero WCAG AA violations (axe-core audit) - **Target: 0 violations**
- **M-012**: 80%+ unified component adoption (migration-tracker.csv) - **Target: >80%**
- **M-013**: Zero P0/P1 bugs in production for 2 weeks post-release - **Target: 0 bugs**

### Validation Methodology

**Automated Testing**:
- Pre-commit hooks block commits if bundle >950KB or touch targets <44px
- CI pipeline runs Lighthouse audits on all PRs (Performance >90 required)
- Jest unit tests for all unified components (90%+ coverage target)
- Playwright E2E tests for 8 user journeys (100% pass rate required)
- axe-core accessibility tests on every component (zero violations required)

**Manual Testing**:
- Physical device testing on iPhone 14 Pro and Pixel 7 (30% of sprint time)
- Keyboard navigation testing (Tab, Enter, Escape) on all modals and forms
- Screen reader testing (VoiceOver, TalkBack) on 5 critical user flows
- Visual regression testing (Percy or similar) on 16 main pages

**User Validation**:
- Beta rollout to 20-30 users with feature flags (collect feedback via survey)
- Analytics monitoring (bounce rate, task completion rate, error rate)
- Support ticket tracking (zero increase in tickets post-rollout target)

## Open Questions & Clarifications

*No open questions remain. All critical decisions have been made during Phase 0-1 research and design. Implementation is now proceeding according to plan.md and tasks.md.*

**Decisions Made**:
1. ✅ Modal patterns defined via decision matrix (forms → BottomSheet, menus → ActionSheet, confirmations → Dialog)
2. ✅ Touch targets standardized (44px minimum, 48px primary actions, 56px navigation)
3. ✅ Bundle size target confirmed (<950KB gzipped with lazy loading strategy)
4. ✅ Virtualization threshold set (>50 items requires VirtualizedTrackList)
5. ✅ Rollback strategy defined (feature flags + git revert as backup)
6. ✅ Timeline confirmed (27-30 days realistic with 2-3 developers)
7. ✅ Testing approach approved (30% device testing, axe-core on every sprint)
8. ✅ Success criteria defined (14 measurable metrics with targets)

## References

- **Implementation Plan**: [plan.md](./plan.md) - Detailed implementation roadmap with constitution checks, phases, and risks
- **Research Findings**: [research.md](./research.md) - Phase 0 component audit, touch target analysis, modal patterns, bundle size estimates
- **Task Breakdown**: [tasks.md](./tasks.md) - 66 detailed tasks with acceptance criteria, estimates, rollback plans, and dependencies
- **Data Models**: [data-model.md](./data-model.md) - TypeScript interfaces and schemas for all unified components
- **Developer Guide**: [quickstart.md](./quickstart.md) - Code examples and patterns for implementing unified components
- **Component Contracts**: [contracts/](./contracts/) - TypeScript contract definitions for core unified components
- **Migration Tracker**: [migration-tracker.csv](./migration-tracker.csv) - Real-time status of all 1030 components (991 core + 39 additional)
- **Constitution**: `.specify/memory/constitution.md` - Project-wide architectural principles and constraints

## Appendix: Implementation Summary

### Current Status (as of 2026-01-05)

**Phase 2 Implementation Progress**: 29 tasks completed out of 70 total (41%)

**⚠️ CRITICAL BLOCKERS**:
1. **Bundle Size**: 1748KB (798KB over 950KB limit) - T070 emergency optimization required
2. **T020 Blocked**: Playlist detail view missing - Product decision needed

**Sprint 0 (Setup & Foundational) - COMPLETE**:
- ✅ T001-T006: Bundle baseline, feature flags, validation tooling, migration tracker
- ✅ T007-T010: Tone.js lazy loading, touch target CSS utilities, ResponsiveModal, MainLayout safe areas

**Sprint 1 (Touch Targets + Virtualization) - 82% COMPLETE**:
- ✅ T011-T014: BottomNavigation and MobileHeaderBar touch target fixes (already compliant)
- ✅ T016-T019: TrackCard touch targets fixed, variants merged, pull-to-refresh added
- ✅ T021: Community page virtualized with VirtuosoGrid
- ⚠️ T020: Playlists page blocked (no playlist detail view exists yet - product decision needed)
- ⏸️ T015, T022: Device testing and performance benchmarking pending

**Sprint 1 User Story Status**:
- ✅ US1 (Navigation): 80% complete - touch targets compliant, haptic feedback added, device testing pending
- 🔄 US2 (Track Lists): 71% complete - TrackCard fixed, Community virtualized, Playlists blocked, testing pending

**Sprint 2-5**: Not yet started (0 tasks complete)

**Recent Analysis** (2026-01-05): Comprehensive cross-artifact consistency audit completed. See:
- **ANALYSIS-REMEDIATION.md** - Detailed findings and remediation plan (34 issues identified)
- **FR-TO-TASK-MAPPING.md** - Complete mapping of 30 functional requirements to tasks

**Key Wins**:
1. Bundle baseline established: **1748KB (798KB over limit)** - optimization roadmap defined
2. Feature flag system live with 19 flags including rollout percentage and master kill switch
3. Touch target validation utilities ready for automated checking
4. UnifiedTrackCard now supports all variants (default, compact, minimal, professional)
5. Pull-to-refresh implemented with haptic feedback and touch handlers

**Key Blockers**:
1. Bundle size 84% over target - immediate optimization required (T070: lazy load Tone.js/Wavesurfer)
2. T020 (Playlists virtualization) blocked - no playlist detail view implementation exists
3. Device testing pending - requires physical iPhone 14 Pro and Pixel 7

**Next Immediate Actions**:
1. **CRITICAL**: Create and execute T070 (emergency bundle optimization) before Sprint 2
2. **CRITICAL**: Resolve T020 blocker (product decision + implementation or defer)
3. Complete T015 (navigation device testing) and T022 (performance benchmarking)
4. Add missing tasks: T071 (ARIA labels), T072 (focus trap), T073 (Dialog audit)
5. Start Sprint 2 modal migration tasks (T023-T035) - can run parallel to Sprint 1 testing

---

**Specification Status**: ✅ COMPLETE - Ready for implementation guidance and ongoing validation
