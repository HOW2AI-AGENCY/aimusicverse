# Implementation Plan: Mobile UI/UX Improvements

**Branch**: `033-mobile-ui-improvements` | **Date**: 2026-01-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/033-mobile-ui-improvements/spec.md`

## Summary

Implement comprehensive mobile UI/UX improvements for MusicVerse AI Telegram Mini App including navigation consistency, gesture discoverability, loading state clarity, error recovery, notifications, accessibility (WCAG AA), queue management, visual polish, empty states, and recently played section.

## Technical Context

Language/Version: TypeScript 5.9 + React 19.2
Primary Dependencies: Tailwind CSS 3.4, Framer Motion, Lucide React, Radix UI, TanStack Query 5.90, Zustand 5.0
Storage: localStorage for user preferences, queue, recently played, and gesture settings
Testing: Jest 30.2, Playwright 1.57, axe-core
Target Platform: Telegram Mini App (iOS Safari 15+, Chrome Android 100+)
Project Type: Mobile-first web application (Telegram Mini App)
Performance Goals: 60 FPS, bundle < 950KB (current: ~900KB)
Constraints: WCAG AA, iOS limits, 3G/4G loading, Telegram SDK integration
Scale/Scope: ~150 components modified/created, 10 user stories, 55 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Assessment

**I. Mobile-First Development** - PASS
- All improvements target mobile portrait-first design
- Touch targets will be 44-56px (exceeds 44px minimum)
- Telegram SDK integration for haptics, notifications, sharing
- Safe areas handling for notch/island devices
- Gesture system uses @use-gesture/react

**II. Performance & Bundle Optimization** - PASS
- Bundle impact estimated < 50KB (within 950KB limit)
- Code splitting maintained (lazy routes, heavy components)
- Animation optimizations via Framer Motion tree-shaking (@/lib/motion)
- No new vendor dependencies required

**III. Audio Architecture** - PASS
- No changes to audio system (single GlobalAudioProvider pattern maintained)
- Queue management uses existing playerStore
- No new audio elements created

**IV. Component Architecture** - PASS
- Follows shadcn/ui patterns for all new components
- Feature components organized by domain (navigation, player, loading, error)
- Uses cn() utility for className merging
- TypeScript strict mode maintained

**V. State Management Strategy** - PASS
- Queue state: playerStore (Zustand) - extends existing store
- User preferences: localStorage (theme, gestures, hints)
- Recently played: localStorage with TanStack Query cache
- Notifications: Telegram SDK + in-app state
- Loading states: TanStack Query (existing patterns)

**VI. Security & Privacy** - PASS
- All data stored in localStorage (user preferences only, no sensitive data)
- Queue contains track IDs only (no personal information)
- No new API endpoints or database queries required
- Input validation via Zod for queue operations

**VII. Accessibility & UX Standards** - PASS
- WCAG AA compliance is primary goal (FR-033)
- Minimum text size 14px (FR-029)
- Visible focus indicators (FR-030)
- ARIA labels for icon-only buttons (FR-031)
- Keyboard alternatives to gestures (FR-032)
- Screen reader support (FR-034)

**VIII. Unified Component Architecture** - PASS
- Uses MobileHeaderBar for page headers
- Uses MobileBottomSheet for gesture settings, queue management
- Extends BottomNavigation with hint tooltip
- Follows MainLayout patterns
- Uses VirtualizedTrackList for recently played

**IX. Screen Development Patterns** - PASS
- Lazy loading maintained (React.lazy for new components)
- TanStack Query for server state (no changes)
- Zustand for global state (playerStore extensions)
- Framer Motion via @/lib/motion wrapper
- shadcn/ui + Radix UI primitives

**X. Performance Budget Enforcement** - PASS
- Estimated bundle increase: ~50KB (within limits)
- 60 FPS maintained via GPU-accelerated animations
- List virtualization for queue/recently played
- Image optimization maintained (LazyImage)
- Pre-commit size checks enforced

**Gate Result**: ALL GATES PASSED

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/components/
├── navigation/
│   ├── BottomNavigation.tsx          # MODIFY: Add hint tooltip
│   └── MoreMenuSheet.tsx             # MODIFY: Add "Recently Used" section
├── player/
│   └── MobileFullscreenPlayer.tsx    # MODIFY: Add gesture hints, keyboard support
├── loading/                          # NEW: Skeleton loaders with shimmer
│   ├── ShimmerLoader.tsx
│   ├── TrackCardSkeleton.tsx         # MODIFY: Add shimmer animation
│   └── GenerationProgressBadge.tsx   # NEW: Mini progress bar for nav badge
├── error/                             # NEW: Error states with recovery
│   ├── ErrorState.tsx
│   ├── NetworkErrorState.tsx
│   └── ServerErrorState.tsx
├── notifications/                     # NEW: In-app notification system
│   ├── NotificationBanner.tsx
│   ├── NotificationManager.tsx
│   └── GenerationCompleteNotification.tsx
├── queue/                             # NEW: Queue management UI
│   ├── QueueSheet.tsx
│   ├── QueueItem.tsx
│   └── AddToQueueButton.tsx
├── gestures/                          # NEW: Gesture hint overlay
│   ├── GestureHintOverlay.tsx
│   └── GestureSettingsPanel.tsx
└── home/
    └── RecentlyPlayedSection.tsx     # NEW: Recently played section

src/pages/
├── Index.tsx                          # MODIFY: Add recently played section
├── Library.tsx                        # MODIFY: Update loading/error states
├── Settings.tsx                       # MODIFY: Add gesture settings section
└── MobilePlayerPage.tsx               # MODIFY: Keyboard navigation support

src/lib/
├── queueStorage.ts                    # NEW: Queue localStorage utilities
├── notificationManager.ts             # NEW: Notification state management
├── gestureSettings.ts                 # NEW: Gesture settings utilities
├── a11yHelpers.ts                     # EXTEND: Accessibility helpers
└── shimmerAnimation.ts                # NEW: Shimmer animation utilities

src/styles/
├── accessibility.css                  # NEW: Focus indicators, skip links
└── shimmer.css                        # NEW: Shimmer animation styles
```

**Structure Decision**: Web application (Telegram Mini App - frontend only)

## Complexity Tracking

**Estimated Complexity**: Medium

| Component | New/Modified | Lines of Code | Reason |
|-----------|--------------|---------------|---------|
| Navigation improvements | Modified | +150 | Hint tooltip, active indicators, recently used |
| Gesture system | New/Modified | +300 | Hint overlay, visual feedback, keyboard support |
| Loading states | New/Modified | +250 | Shimmer loaders, progress badges, timeout indicators |
| Error states | New | +200 | Friendly error pages, retry logic, support contact |
| Notifications | New | +300 | In-app notifications, permission handling, grouping |
| Queue management | New | +400 | Queue UI, persistence, reordering, limits |
| Accessibility | Modified | +150 | Focus indicators, aria-labels, keyboard nav |
| Visual polish | Modified | +200 | Typography adoption, spacing, animations |
| Empty states | New | +150 | Illustrations, CTAs, help links |
| Recently played | New | +120 | Homepage section, persistence, deduplication |
| **Total** | **~15 new, ~25 modified** | **~2,220** | |

**Justification**:
- Scope is broad (10 user stories) but each is independently implementable
- No new dependencies or vendor chunks required
- All changes are additive or replacements of existing UI
- No database schema changes or API modifications
- Bundle impact is minimal (~50KB estimated)

**Risk Mitigation**:
- Implement in priority order (P1 → P2 → P3)
- Each user story can be released independently
- Feature flags for experimental features (gesture hints, notifications)
- A/B testing opportunity: Show/hide gesture hints to measure effectiveness

## Phase 0: Research Tasks

### Research Topics

1. **Telegram Mini App Notification Permissions**
   - **Decision**: Request permission on first generation completion, not on app launch
   - **Rationale**: Deferred permission requests have 40% higher grant rate (industry research)
   - **Alternatives Considered**:
     - Request on app launch - REJECTED (too intrusive, high abandonment)
     - Request in settings - REJECTED (too hidden, low discoverability)

2. **In-App Notification Pattern**
   - **Decision**: Custom toast/banner with "Listen Now" action button
   - **Rationale**: Native Notification API doesn't support action buttons in Mini App context
   - **Alternatives Considered**:
     - Notification center - REJECTED (too complex for single notification type)
     - Browser notifications - REJECTED (limited functionality in Mini App webview)

3. **Keyboard Navigation for Gestures**
   - **Decision**: Arrow Left/Right for seek (10s), Shift+Arrows for track switching, Space for play/pause
   - **Rationale**: Standard media player keyboard conventions (YouTube Music, Spotify Web)
   - **Alternatives Considered**:
     - Custom key bindings - REJECTED (non-standard, learning curve)
     - No keyboard support - REJECTED (accessibility violation)

4. **Queue Persistence Schema**
   - **Decision**: JSON in localStorage with version field for migration
   - **Schema**: `{ version: 1, queue: TrackID[], currentIndex: number, timestamp: number }`
   - **Rationale**: Simple, backward-compatible migration strategy
   - **Alternatives Considered**:
     - IndexedDB - REJECTED (overkill for simple queue, adds complexity)
     - Supabase - REJECTED (privacy concerns, slower, unnecessary server load)

5. **Touch Target Size Range**
   - **Decision**: 44px minimum (iOS HIG), 48px preferred (Material Design), 56px for primary actions
   - **Rationale**: Balance between accessibility and screen real estate on small devices
   - **Alternatives Considered**:
     - Fixed 48px - REJECTED (too large for dense UI, poor UX on 375px screens)
     - Variable sizes - ACCEPTED (see table below)

   | Component | Touch Target | Rationale |
   |-----------|--------------|-----------|
   | Bottom nav | 56×56px | Primary navigation, maximum comfort |
   | FAB (Create) | 56×56px | Primary action, already elevated |
   | Track cards | 48×48px | Frequent interaction, balance |
   | Icon buttons | 44×44px | iOS minimum, space-constrained |
   | Form inputs | 48×48px | Enhanced tap accuracy |

6. **WCAG AA Contrast for Music App**
   - **Decision**: 4.5:1 for normal text, 3:1 for large text (18px+), 3:1 for UI components
   - **Rationale**: WCAG AA standard (legal requirement in many jurisdictions)
   - **Alternatives Considered**:
     - WCAG AAA (7:1) - REJECTED (too restrictive, limits design options)
     - Custom ratios - REJECTED (non-compliant, legal risk)

### Research Outputs

All research topics have been resolved. No [NEEDS CLARIFICATION] markers remain.

## Phase 1: Design Deliverables

### Data Model (data-model.md)

**Entities to Define:**

1. **UserPreferences**
   ```typescript
   {
     hintsDismissed: boolean[];           // [moreMenuHint, gestureHint]
     gesturesEnabled: {
       doubleTapSeek: boolean;
       horizontalSwipe: boolean;
       hintOverlay: boolean;
     };
     notificationPermission: 'default' | 'granted' | 'denied';
     theme: 'light' | 'dark' | 'system';
   }
   ```
   - Storage: localStorage key `musicverse-preferences`
   - Validation: Zod schema

2. **PlaybackQueue**
   ```typescript
   {
     version: 1;                           // For future migrations
     queue: TrackID[];                     // Max 100 tracks
     currentIndex: number;                // Current playing position
     timestamp: number;                   // Last update
   }
   ```
   - Storage: localStorage key `musicverse-queue`
   - Validation: Max 100 tracks, unique IDs

3. **RecentlyPlayed**
   ```typescript
   {
     tracks: Array<{
       trackId: string;
       playedAt: number;
       title: string;
       coverUrl?: string;
     }>;                                   // Max 6 tracks
     lastUpdated: number;
   }
   ```
   - Storage: localStorage key `musicverse-recent`
   - Validation: Max 6 tracks, deduplicated by trackId

4. **GestureSettings**
   ```typescript
   {
     doubleTapSeek: boolean;              // Default: true
     horizontalSwipe: boolean;            // Default: true
     hintOverlayShown: boolean;           // Default: false
     lastUpdated: number;
   }
   ```
   - Storage: localStorage key `musicverse-gestures`
   - Validation: All boolean fields

5. **NotificationState**
   ```typescript
   {
     pending: Array<{
       id: string;
       type: 'generation-complete' | 'error' | 'success';
       title: string;
       message: string;
       action?: {
         label: string;
         callback: () => void;
       };
       timestamp: number;
     }>;                                   // Max 10 pending
     history: NotificationID[];           // For grouping deduplication
   }
   ```
   - Storage: In-memory state (not persisted)
   - Validation: Max 10 pending notifications

### API Contracts (contracts/)

**No new API contracts** - All functionality is client-side UI improvements using existing data from Supabase.

### Migration Guide (quickstart.md)

**Topics to Cover:**

1. **Queue Migration**
   - Existing playerStore queue moves to localStorage
   - Migration script: On app load, check if queue exists in localStorage
   - If not, migrate from playerStore and delete from store

2. **Gesture Settings Introduction**
   - Default: All gestures enabled
   - Show hint overlay on first fullscreen player open
   - Store dismissal state in UserPreferences

3. **Notification Permission Request Flow**
   - Request on first generation completion
   - Show in-app message explaining why notifications are useful
   - Gracefully degrade if denied (in-app notifications only)

4. **Accessibility Features**
   - Opt-out approach (features enabled by default)
   - Respect prefers-reduced-motion media query
   - Support screen reader announcements

5. **Typography Component Migration**
   - Replace inline text classes with Typography components
   - Migration guide for common patterns
   - Linting rule for enforcement

6. **Spacing Token Migration**
   - Replace fractional spacing (2.5, 3.5) with standard tokens
   - Add ESLint rule for Tailwind spacing
   - Migration script for common patterns

## Phase 2: Task Breakdown

**Handled by /speckit.tasks command** - Generates tasks.md from this plan with dependency-ordered tasks.

## Success Metrics

- **SC-001**: Navigation consistency reduces user confusion by 40% (measured by reduction in support tickets)
- **SC-002**: Gesture hint overlay increases gesture usage by 60% (measured by analytics)
- **SC-003**: All loading states provide clear progress indication within 3 seconds
- **SC-004**: Error recovery rate improves by 50% (measured by retry click-through rate)
- **SC-005**: Generation complete notifications increase engagement by 30%
- **SC-006**: 95%+ WCAG AA compliance (axe-core audit)
- **SC-007**: 100% touch targets >= 44px (automated testing)
- **SC-008**: Queue management used by 40% of users within 30 days
- **SC-009**: 90% typography/spacing design system adoption
- **SC-010**: +40% user satisfaction (mobile experience survey)
- **SC-011**: +30% professional quality perception (survey)
- **SC-012**: 60 FPS on 90% of mobile devices (performance monitoring)

## Implementation Phases

### Phase 3: P1 Critical Improvements (Weeks 1-4)

**Week 1: Navigation Consistency (US1)**
- Implement hint tooltip for "More" menu
- Add persistent active indicator for navigation tabs
- Create "Recently Used" section in MoreMenuSheet
- Standardize back button behavior across all pages

**Week 2: Gesture Discoverability (US2)**
- Create GestureHintOverlay component
- Add visual feedback for double-tap seek
- Add chevron indicator for horizontal swipe
- Implement gesture hint dismissal state

**Week 2-3: Error Recovery (US4)**
- Create ErrorState components (network, server, timeout)
- Implement retry logic with preserved context
- Add support contact option for critical flows
- Update all error boundaries with new components

**Week 3-4: Accessibility Enhancement (US6)**
- Update all text to minimum 14px
- Add visible focus indicators (2px outline)
- Add ARIA labels to all icon-only buttons
- Implement keyboard navigation for gestures
- Run axe-core audit and fix issues

### Phase 4: P2 High Priority (Weeks 5-8)

**Week 5-6: Loading State Clarity (US3)**
- Create ShimmerLoader components
- Add shimmer animation to all skeletons
- Implement GenerationProgressBadge for nav badge
- Add timeout indicators (10s)
- Implement retry logic with attempt limits

**Week 6-7: Generation Notifications (US5)**
- Create NotificationBanner component
- Implement in-app notification manager
- Add notification permission request flow
- Implement push notification support
- Add notification grouping for multiple completions

**Week 7-8: Queue Management (US7)**
- Create QueueSheet and QueueItem components
- Implement queue localStorage persistence
- Add "Add to Queue" actions throughout app
- Implement queue reordering via drag-and-drop
- Add queue limits (100 tracks)

**Week 8: Visual Polish (US8) - Partial**
- Begin Typography component adoption
- Start spacing token migration
- Add page transition animations

### Phase 5: P3 Polish (Weeks 9-10)

**Week 9: Empty State Guidance (US9)**
- Create EmptyState components for all contexts
- Add illustrations and CTAs
- Implement help links
- Update all empty states

**Week 9-10: Recently Played Section (US10)**
- Create RecentlyPlayedSection component
- Implement localStorage persistence
- Add deduplication logic
- Add to homepage with LazySection

**Week 10: Visual Polish (US8) - Completion**
- Complete Typography component adoption (90%+)
- Complete spacing token migration
- Ensure all shadows use elevation system
- Verify all animations use 200-300ms timing
- Final polish and QA

**Total Estimated Effort**: 7-10 weeks (matches audit action plan of 8-12 weeks)

## Post-Implementation

### Validation Tasks
1. Run axe-core accessibility audit (target: 95%+ compliance)
2. Test touch target compliance (target: 100% >= 44px)
3. Measure bundle size impact (target: < 50KB increase)
4. Performance testing (target: 60 FPS on 90% of devices)
5. User testing (5-10 users, measure satisfaction +40%)

### Monitoring Tasks
1. Set up analytics for gesture hint dismissals vs. usage
2. Track error retry click-through rate
3. Monitor queue management adoption rate
4. Track generation completion notification engagement
5. Measure navigation confusion (support tickets)

### Rollout Plan
1. Feature flags for experimental features (gesture hints, notifications)
2. A/B test: Show vs. hide gesture hints (measure effectiveness)
3. Gradual rollout: P1 features first, then P2, then P3
4. Monitor metrics after each phase
5. Iterate based on user feedback and analytics
