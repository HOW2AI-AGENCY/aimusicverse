# Sprint 008 Kickoff Checklist

**Sprint:** 008 - Library & Player MVP  
**Period:** 2025-12-15 - 2025-12-29 (2 недели)  
**Target:** User Stories 1 & 2 (22 задачи)

---

## Pre-Sprint Setup (Before Day 1)

### Environment Setup

- [ ] **Install Required NPM Dependencies**
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```

- [ ] **Verify Existing Dependencies**
  ```bash
  npm list framer-motion @tanstack/react-query @twa-dev/sdk
  ```
  Expected versions:
  - framer-motion: ^12.23.24
  - @tanstack/react-query: ^5.90.11
  - @twa-dev/sdk: ^8.0.2

### Code Quality Check

- [ ] **Run TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors in frontend code

- [ ] **Run Linter**
  ```bash
  npm run lint
  ```
  Expected: 0 critical errors (101 backend errors acceptable)

- [ ] **Run Tests**
  ```bash
  npm test
  ```
  Expected: All tests passing

- [ ] **Build Project**
  ```bash
  npm run build
  ```
  Expected: Successful build

### Database Verification

- [ ] **Check track_versions Table**
  - Verify table exists in Supabase
  - Check migration: `20251129084954_*.sql`
  - Columns: id, track_id, audio_url, cover_url, duration_seconds, version_type, is_primary, parent_version_id, metadata, created_at

- [ ] **Check track_stems Table**
  - Verify table exists
  - Confirm stems can be linked to tracks

- [ ] **Verify RLS Policies**
  - track_versions RLS enabled
  - Users can read their own track versions
  - Users can update/delete their own versions

### Test Data Preparation

- [ ] **Create Test Tracks with Versions**
  - At least 3 tracks with 2+ versions each
  - At least 1 track marked as master version
  - Include tracks with different durations

- [ ] **Create Test Tracks with Stems**
  - At least 2 tracks with stems
  - Verify stems are accessible

- [ ] **Create Test Tracks with Lyrics**
  - At least 2 tracks with timestamped lyrics
  - At least 1 track with normal lyrics

### Design Assets Check

- [ ] **Verify UI Components Available**
  - TrackCard mockups
  - Player mode mockups (compact/expanded/fullscreen)
  - Version switcher design
  - Queue management design

- [ ] **Icon Assets Ready**
  - Version badge icons
  - Track type icons (vocal/instrumental/stems)
  - Player control icons

---

## Week 1: User Story 1 - Library Mobile Redesign

### Day 1: Core Components Foundation

#### Morning (4 hours)
- [ ] **Create TrackRow Component** (US1-T02)
  - File: `src/components/library/TrackRow.tsx`
  - Implement compact list view layout
  - Add touch-friendly buttons (≥44×44px)
  - Test on mobile viewport (375px)
  
- [ ] **Create VersionBadge Component** (US1-T03)
  - File: `src/components/library/VersionBadge.tsx`
  - Implement version display logic
  - Add master version indicator (star icon)
  - Make clickable with proper touch area

#### Afternoon (4 hours)
- [ ] **Create TrackTypeIcons Component** (US1-T05)
  - File: `src/components/library/TrackTypeIcons.tsx`
  - Add vocal, instrumental, stems icons
  - Implement tooltip on hover (desktop)
  
- [ ] **Create Skeleton Loaders** (US1-T08)
  - File: `src/components/ui/skeleton-loader.tsx`
  - Create card skeleton variant
  - Create row skeleton variant
  - Test loading states

#### End of Day
- [ ] **Run Tests**
  ```bash
  npm test
  npm run lint
  ```
- [ ] **Git Commit**
  ```bash
  git add .
  git commit -m "feat(library): Add TrackRow, VersionBadge, TrackTypeIcons, and skeleton loaders"
  git push
  ```

### Day 2: Version Management

#### Morning (4 hours)
- [ ] **Create VersionSwitcher Component** (US1-T04)
  - File: `src/components/library/VersionSwitcher.tsx`
  - Implement bottom sheet for mobile
  - Add version list with details
  - Connect to useTrackVersions hook
  - Test version selection

#### Afternoon (4 hours)
- [ ] **Enhance TrackCard Component** (US1-T01)
  - Update: `src/components/TrackCard.tsx`
  - Add VersionBadge integration
  - Add TrackTypeIcons integration
  - Implement touch-friendly layout
  - Test responsive behavior (320px-1920px)

#### End of Day
- [ ] **Run Tests**
- [ ] **Test on Real Device** (if possible)
  - Open Telegram Mini App
  - Navigate to Library
  - Test touch interactions
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(library): Add VersionSwitcher and enhance TrackCard with version support"
  ```

### Day 3: Swipe Actions & Integration

#### Morning (4 hours)
- [ ] **Implement Swipe Actions** (US1-T07)
  - Update: `src/components/TrackCard.tsx`
  - Add framer-motion drag gesture
  - Implement swipe-to-like (left)
  - Implement swipe-to-delete (right)
  - Add haptic feedback (Telegram SDK)
  - Test swipe threshold (≥50px)

#### Afternoon (4 hours)
- [ ] **Update Library Page** (US1-T06) - Part 1
  - Update: `src/pages/Library.tsx`
  - Add Grid/List view toggle
  - Integrate TrackCard and TrackRow
  - Add skeleton loaders during fetch

#### End of Day
- [ ] **Manual Testing**
  - Test Grid view on 375px, 768px, 1920px
  - Test List view on all viewports
  - Test swipe gestures on mobile
  - Verify haptic feedback (real device)
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(library): Add swipe actions and grid/list toggle"
  ```

### Day 4: Library Page Complete

#### Morning (4 hours)
- [ ] **Update Library Page** (US1-T06) - Part 2
  - Implement infinite scroll
  - Add backend pagination
  - Test with 100+ tracks

#### Afternoon (4 hours)
- [ ] **Optimize Performance**
  - Add React.memo to TrackCard
  - Implement lazy loading for images
  - Test scroll performance
  - Profile with React DevTools

#### End of Day
- [ ] **Performance Testing**
  - Run Lighthouse audit (mobile)
  - Target: Score >90
  - Check FCP <2s
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(library): Complete Library page with infinite scroll and performance optimizations"
  ```

### Day 5: US1 Testing & Polish

#### Morning (2 hours)
- [ ] **Code Review**
  - Review all US1 code
  - Check for TypeScript errors
  - Verify ESLint compliance
  - Refactor if needed

#### Afternoon (3 hours)
- [ ] **Integration Testing**
  - Test all user flows
  - Test on multiple viewports
  - Test with different data scenarios
- [ ] **Documentation**
  - Update component README
  - Add Storybook stories (if time allows)

#### Optional (if time)
- [ ] **Unit Tests** (US1-T09)
  - Test TrackRow component
  - Test VersionBadge component
  - Test VersionSwitcher logic

#### End of Day
- [ ] **Sprint Progress Update**
  - Update SPRINT_MANAGEMENT.md
  - Mark US1 tasks as complete
  - Document any blockers
- [ ] **Git Commit**
  ```bash
  git commit -m "test(library): Add tests and documentation for US1"
  ```

---

## Week 2: User Story 2 - Player Mobile Optimization

### Day 1 (Monday): Player Core Components

#### Morning (4 hours)
- [ ] **Create PlaybackControls** (US2-T04)
  - File: `src/components/player/PlaybackControls.tsx`
  - Implement play/pause, skip buttons
  - Add shuffle, repeat toggles
  - Support 3 sizes (compact/medium/large)

- [ ] **Create ProgressBar** (US2-T05)
  - File: `src/components/player/ProgressBar.tsx`
  - Implement seek functionality
  - Add time labels
  - Make touch-friendly (≥44px touch area)

#### Afternoon (4 hours)
- [ ] **Create QueueItem** (US2-T07)
  - File: `src/components/player/QueueItem.tsx`
  - Implement drag handle
  - Add remove button
  - Style current track indicator

#### End of Day
- [ ] **Test Components in Isolation**
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(player): Add PlaybackControls, ProgressBar, and QueueItem components"
  ```

### Day 2 (Tuesday): Player Modes

#### Morning (4 hours)
- [ ] **Enhance CompactPlayer** (US2-T01)
  - Update: `src/components/CompactPlayer.tsx`
  - Add swipe-up gesture
  - Connect to PlaybackControls
  - Test fixed bottom positioning

#### Afternoon (4 hours)
- [ ] **Create ExpandedPlayer** (US2-T02)
  - File: `src/components/player/ExpandedPlayer.tsx`
  - Implement bottom sheet (~40vh)
  - Add cover art
  - Add ProgressBar
  - Add PlaybackControls
  - Test swipe down to close

#### End of Day
- [ ] **Test Player Transitions**
  - Compact → Expanded
  - Expanded → Compact
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(player): Enhance CompactPlayer and add ExpandedPlayer"
  ```

### Day 3 (Wednesday): Fullscreen & Queue

#### Morning (4 hours)
- [ ] **Enhance FullscreenPlayer** (US2-T03)
  - Update: `src/components/FullscreenPlayer.tsx`
  - Add lyrics toggle
  - Integrate TimestampedLyrics
  - Add volume control
  - Test fullscreen mode

#### Afternoon (4 hours)
- [ ] **Create QueueSheet** (US2-T06)
  - File: `src/components/player/QueueSheet.tsx`
  - Implement drag-and-drop with @dnd-kit
  - Add clear queue button
  - Test reordering

#### End of Day
- [ ] **Test Queue Management**
  - Test drag-to-reorder
  - Test remove from queue
  - Test clear queue
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(player): Add FullscreenPlayer enhancements and QueueSheet"
  ```

### Day 4 (Thursday): Integration & State Management

#### Morning (4 hours)
- [ ] **Player State Integration** (US2-T09)
  - Update usePlayerState hook if needed
  - Connect all player components to state
  - Implement queue state management
  - Test state synchronization

#### Afternoon (4 hours)
- [ ] **Player Transitions** (US2-T10)
  - Add Framer Motion animations
  - Implement smooth mode transitions
  - Add spring physics
  - Test 60fps performance

- [ ] **Update TimestampedLyrics** (US2-T08)
  - Fix mobile layout issues
  - Improve sync accuracy
  - Add word-by-word highlight

#### End of Day
- [ ] **Integration Testing**
  - Test all player modes
  - Test state persistence
  - Test queue management
- [ ] **Git Commit**
  ```bash
  git commit -m "feat(player): Complete player state management and transitions"
  ```

### Day 5 (Friday): Testing, Polish & Sprint Closure

#### Morning (3 hours)
- [ ] **Final Testing**
  - Test all user flows
  - Test on multiple devices
  - Fix any critical bugs

- [ ] **Performance Optimization**
  - Run Lighthouse audit
  - Optimize animations
  - Profile with DevTools

#### Afternoon (3 hours)
- [ ] **Code Review**
  - Review all US2 code
  - Check ESLint compliance
  - Refactor if needed

- [ ] **Documentation**
  - Update README
  - Document new components
  - Update architecture docs

#### Optional (if time)
- [ ] **Unit Tests** (US2-T11)
  - Test PlaybackControls
  - Test QueueSheet logic

#### End of Day
- [ ] **Sprint Closure**
  - Update SPRINT_MANAGEMENT.md
  - Mark Sprint 008 as complete
  - Calculate velocity
  - Document lessons learned
  
- [ ] **Final Git Commit**
  ```bash
  git commit -m "docs: Complete Sprint 008 - Library & Player MVP"
  git push
  ```

- [ ] **Create Pull Request**
  - Title: "Sprint 008: Library & Player MVP"
  - Description: Link to tasks, demo video
  - Request code review

---

## Success Criteria Verification

### User Story 1: Library

- [ ] **Functional Requirements**
  - [ ] TrackCard works on 320px-1920px
  - [ ] Touch targets ≥44×44px
  - [ ] Swipe gestures work with haptic feedback
  - [ ] Versions display with badges
  - [ ] Master version marked
  - [ ] Grid/List toggle smooth
  - [ ] Lazy loading works

- [ ] **Performance**
  - [ ] Lighthouse Mobile >90
  - [ ] FCP <2s on 3G
  - [ ] Smooth scrolling 60fps

- [ ] **Accessibility**
  - [ ] WCAG 2.1 AA compliant
  - [ ] All buttons have ARIA labels
  - [ ] Keyboard navigation works

### User Story 2: Player

- [ ] **Functional Requirements**
  - [ ] CompactPlayer 64px height
  - [ ] ExpandedPlayer swipe-up works
  - [ ] FullscreenPlayer shows lyrics
  - [ ] Progress bar touch works
  - [ ] Queue drag-to-reorder works
  - [ ] Shuffle/repeat work

- [ ] **Performance**
  - [ ] Smooth animations 60fps
  - [ ] No audio interruptions
  - [ ] Transitions <300ms

- [ ] **Accessibility**
  - [ ] Keyboard controls work
  - [ ] Screen reader support

---

## Blockers & Escalation

### If Blocked On:

**Dependencies Not Installed:**
- Action: Run `npm install @dnd-kit/core @dnd-kit/sortable`
- Escalate to: Team lead if permission issues

**Database Issues:**
- Action: Check Supabase connection
- Verify migrations applied
- Escalate to: Backend team

**Design Assets Missing:**
- Action: Use placeholder UI
- Document missing assets
- Escalate to: Design team

**Performance Issues:**
- Action: Profile with React DevTools
- Check for unnecessary re-renders
- Escalate to: Senior developer

**API Issues:**
- Action: Use mock data for development
- Document API requirements
- Escalate to: Backend team

---

## Daily Standup Template

```
Yesterday:
- Completed: [list tasks]
- Challenges: [any blockers]

Today:
- Plan: [tasks for today]
- Focus: [main goal]

Blockers:
- [any blockers or help needed]
```

---

## End of Sprint Checklist

- [ ] **All Tasks Completed**
  - [ ] 10/10 US1 tasks done
  - [ ] 12/12 US2 tasks done

- [ ] **Code Quality**
  - [ ] All ESLint errors fixed
  - [ ] TypeScript errors: 0
  - [ ] Code reviewed and approved

- [ ] **Testing**
  - [ ] Manual testing complete
  - [ ] Unit tests passing (if implemented)
  - [ ] E2E tests passing (if implemented)

- [ ] **Documentation**
  - [ ] README updated
  - [ ] Components documented
  - [ ] API docs updated

- [ ] **Performance**
  - [ ] Lighthouse score >90
  - [ ] No performance regressions

- [ ] **Git & PR**
  - [ ] All code committed
  - [ ] PR created and reviewed
  - [ ] PR approved and merged

- [ ] **Sprint Review**
  - [ ] Demo prepared
  - [ ] Stakeholders notified
  - [ ] Sprint retrospective scheduled

---

**Good luck with Sprint 008! 🚀**

*Last Updated: 2025-12-02*
