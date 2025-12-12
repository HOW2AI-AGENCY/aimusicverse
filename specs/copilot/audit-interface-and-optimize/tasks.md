# Tasks: UI/UX Improvements with Mobile-First Approach

**Input**: Design documents from `/specs/copilot/audit-interface-and-optimize/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and only included where explicitly requested in the specification. This implementation focuses on UI/UX improvements without mandatory TDD unless specified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Frontend code in `src/`, backend in `supabase/`
- All paths are absolute starting from repository root: `/home/runner/work/aimusicverse/aimusicverse/`

---

## Phase 1: Setup & Infrastructure (Database & Core Hooks)

**Purpose**: Project initialization, database schema updates, and foundational hooks that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Migrations

- [X] T001 Create migration to add primary_version_id to music_tracks table in supabase/migrations/[timestamp]_add_master_version.sql
- [X] T002 Create migration to add version_number and is_primary fields to track_versions table in supabase/migrations/[timestamp]_add_version_fields.sql
- [X] T003 Create migration for track_change_log table with proper indexes in supabase/migrations/[timestamp]_create_changelog_table.sql
- [X] T004 [P] Create migration for playlists and playlist_tracks tables in supabase/migrations/[timestamp]_create_playlists_tables.sql
- [X] T005 Create migration to add performance indexes in supabase/migrations/[timestamp]_add_indexes.sql
- [X] T006 Create data migration script to populate version_number and is_primary for existing data in supabase/migrations/[timestamp]_migrate_existing_data.sql

### Type System Updates

- [X] T007 Update Supabase generated types by running type generation script and updating src/integrations/supabase/types.ts
- [X] T008 [P] Add TrackVersion interface with new fields to src/integrations/supabase/types.ts
- [X] T009 [P] Add TrackChangelog interface to src/integrations/supabase/types.ts
- [X] T010 [P] Add Playlist and PlaylistTrack interfaces to src/integrations/supabase/types.ts
- [X] T011 [P] Add PlayerState client-side interface to src/lib/types/player.ts
- [X] T012 [P] Add PlaybackQueue client-side interface to src/lib/types/player.ts
- [X] T013 [P] Add AssistantFormState interface to src/lib/types/forms.ts

### Core Utility Libraries

- [X] T014 [P] Create versioning utility functions in src/lib/versioning.ts (getVersionNumber, setPrimaryVersion, etc.)
- [X] T015 [P] Create player utility functions in src/lib/player-utils.ts (formatTime, calculateProgress, etc.)
- [X] T016 [P] Create mobile detection and responsive utilities in src/lib/mobile-utils.ts (useIsMobile, useTouchEvents, etc.)

### Foundational Hooks

- [X] T017 [P] Create useTrackVersions hook for fetching versions in src/hooks/useTrackVersions.ts
- [X] T018 Create useVersionSwitcher hook for managing master version switching in src/hooks/useVersionSwitcher.ts
- [X] T019 [P] Create usePublicContent hook for fetching public tracks/projects/artists in src/hooks/usePublicContent.ts
- [X] T020 Create usePlayerState Zustand store for global player state in src/hooks/usePlayerState.ts
- [X] T021 Create usePlaybackQueue hook for queue management in src/hooks/usePlaybackQueue.ts

### Supabase Query Functions

- [X] T022 [P] Create public content query functions in src/integrations/supabase/queries/public-content.ts
- [X] T023 [P] Create versioning query functions in src/integrations/supabase/queries/versioning.ts
- [X] T024 [P] Create changelog query functions in src/integrations/supabase/queries/changelog.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 2: User Story 1 - Library Mobile Redesign & Versioning (Priority: P1) 🎯 MVP

**Goal**: Optimize track browsing for mobile devices and introduce smart versioning system with master version concept.

**Independent Test**: 
1. Open Library page on mobile (375px width)
2. Verify TrackCard displays properly with touch-friendly controls (44×44px minimum)
3. Click version badge to see version switcher
4. Switch between versions and verify master version badge updates
5. Verify track details (cover, duration, audio) update when switching versions

### Implementation for User Story 1

- [X] T025 [P] [US1] Redesign TrackCard component with mobile-first approach in src/components/library/TrackCard.tsx
- [X] T026 [P] [US1] Create TrackRow component for compact list view in src/components/library/TrackRow.tsx
- [X] T027 [P] [US1] Create VersionBadge component with version count indicator in src/components/library/VersionBadge.tsx
- [X] T028 [US1] Create VersionSwitcher component with dropdown/sheet UI in src/components/library/VersionSwitcher.tsx
- [X] T029 [US1] Update Library page to integrate new components in src/pages/Library.tsx
- [X] T030 [US1] Add version management controls to Library page in src/pages/Library.tsx
- [X] T031 [P] [US1] Update TrackCard hover/active states for better interactivity in src/components/library/TrackCard.tsx
- [X] T032 [US1] Implement version switching logic with optimistic updates in src/components/library/VersionSwitcher.tsx
- [X] T033 [P] [US1] Add visual indicators for instrumental/vocal/stems in TrackCard in src/components/library/TrackCard.tsx
- [X] T034 [US1] Add TODO comments for responsive grid layout optimization in src/pages/Library.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently on mobile devices

---

## Phase 3: User Story 2 - Player Mobile Optimization (Priority: P1)

**Goal**: Complete player redesign for mobile with three states (compact/expanded/fullscreen) and improved playback logic.

**Independent Test**:
1. Play a track from Library
2. Verify CompactPlayer appears at bottom (64px height)
3. Swipe up or tap to expand to ExpandedPlayer (~40% viewport)
4. Swipe up again to enter FullscreenPlayer
5. Test playback controls (play/pause, seek, volume)
6. Test queue management (next/previous, repeat, shuffle)
7. Verify state transitions work smoothly with animations

### Implementation for User Story 2

- [X] T035 [P] [US2] Redesign CompactPlayer component for mobile in src/components/player/CompactPlayer.tsx
- [X] T036 [P] [US2] Create ExpandedPlayer component with bottom sheet design in src/components/player/ExpandedPlayer.tsx
- [X] T037 [P] [US2] Redesign FullscreenPlayer component with mobile optimization in src/components/player/FullscreenPlayer.tsx
- [X] T038 [P] [US2] Create reusable PlaybackControls component in src/components/player/PlaybackControls.tsx
- [X] T039 [P] [US2] Create ProgressBar component with buffering state in src/components/player/ProgressBar.tsx
- [X] T040 [P] [US2] Create VolumeControl component (desktop slider, mobile device volume) in src/components/player/VolumeControl.tsx
- [X] T041 [US2] Implement swipe gesture handlers in player components using Framer Motion in src/components/player/ExpandedPlayer.tsx
- [X] T042 [US2] Add player state transition logic (compact → expanded → fullscreen) in src/hooks/usePlayerState.ts
- [X] T043 [US2] Create QueueManager component for displaying and managing queue in src/components/player/QueueManager.tsx
- [X] T044 [US2] Implement queue logic (next/previous, repeat modes, shuffle) in src/hooks/usePlaybackQueue.ts
- [X] T045 [P] [US2] Add mobile-specific touch optimizations and haptic feedback in src/lib/mobile-utils.ts
- [X] T046 [US2] Add TODO comments for audio streaming optimization in src/components/player/CompactPlayer.tsx

**Checkpoint**: At this point, User Story 2 should be fully functional with smooth state transitions

---

## Phase 4: User Story 3 - Track Details Panel Improvements (Priority: P2)

**Goal**: Fix lyrics display, improve version-aware details, and enhance AI analysis display.

**Independent Test**:
1. Open TrackDetailSheet from Library
2. Verify lyrics display correctly in Details tab
3. Switch versions and verify details update
4. Check Stems tab shows available stems with download options
5. Check Analysis tab displays AI analysis with proper formatting
6. Verify Changelog tab shows version history

### Implementation for User Story 3

- [X] T047 [US3] Audit and fix lyrics storage/retrieval in database queries in src/integrations/supabase/queries/tracks.ts
- [X] T048 [US3] Update TrackDetailSheet to support version switching in src/components/track-detail/TrackDetailSheet.tsx
- [X] T049 [US3] Improve TrackDetailsTab with better lyrics display in src/components/track-detail/TrackDetailsTab.tsx
- [X] T050 [US3] Update TrackVersionsTab with improved version list UI in src/components/track-detail/TrackVersionsTab.tsx
- [X] T051 [US3] Enhance TrackStemsTab with stem type indicators and download buttons in src/components/track-detail/TrackStemsTab.tsx
- [X] T052 [US3] Improve TrackAnalysisTab with better parsing and visualization in src/components/track-detail/TrackAnalysisTab.tsx
- [X] T053 [US3] Update TrackChangelogTab to display version changelog in src/components/track-detail/TrackChangelogTab.tsx
- [X] T054 [P] [US3] Create LyricsDisplay component for synchronized lyrics in src/components/player/LyricsDisplay.tsx
- [X] T055 [US3] Fix mobile display issues for lyrics (visibility, synchronization) in src/components/track-detail/TrackDetailsTab.tsx
- [X] T056 [P] [US3] Add word highlighting logic for timestamped lyrics in src/components/player/LyricsDisplay.tsx
- [X] T057 [US3] Add TODO comments for lyrics parsing improvements in src/components/track-detail/TrackDetailsTab.tsx

**Checkpoint**: At this point, User Story 3 should display all track details correctly with version awareness

---

## Phase 5: User Story 4 - Track Actions Menu Expansion (Priority: P2)

**Goal**: Expand functionality with new actions (Create Persona, Open in Studio, Add to Project/Playlist) and improve organization.

**Independent Test**:
1. Open TrackActionsMenu from TrackCard
2. Verify all actions are organized by category (Info, Studio, Share, Manage)
3. Test "Create Persona" dialog opens and allows persona creation
4. Test "Open in Studio" navigation works (if stems available)
5. Test "Add to Project/Playlist" dialog with create new option
6. Verify version switcher in actions menu

### Implementation for User Story 4

- [X] T058 [US4] Update TrackActionsMenu with new action categories in src/components/track-actions/TrackActionsMenu.tsx
- [X] T059 [US4] Update TrackActionsSheet for mobile optimization in src/components/track-actions/TrackActionsSheet.tsx
- [X] T060 [P] [US4] Create CreatePersonaDialog for extracting artist persona in src/components/track-actions/CreatePersonaDialog.tsx
- [X] T061 [P] [US4] Create AddToProjectDialog for adding tracks to projects/playlists in src/components/track-actions/AddToProjectDialog.tsx
- [X] T062 [US4] Add version switcher action to track menu in src/components/track-actions/TrackActionsMenu.tsx
- [X] T063 [US4] Implement "Open in Studio" navigation logic in src/components/track-actions/TrackActionsMenu.tsx
- [X] T064 [P] [US4] Add icons and tooltips for all actions in src/components/track-actions/TrackActionsMenu.tsx
- [X] T065 [US4] Add TODO comments for future studio integration in src/components/track-actions/TrackActionsMenu.tsx

**Checkpoint**: At this point, User Story 4 should provide expanded track actions with proper organization

---

## Phase 6: User Story 5 - Homepage Public Content Discovery (Priority: P2)

**Goal**: Transform homepage into streaming platform for discovering PUBLIC content from all users.

**Independent Test**:
1. Open homepage (Index.tsx) without authentication
2. Verify Featured section displays curated public tracks
3. Verify New Releases section shows recent public tracks
4. Verify Popular section shows most played/liked tracks
5. Test quick play functionality from track cards
6. Test filter by genre/mood/artist
7. Test remix/reuse capability

### Implementation for User Story 5

- [X] T066 [P] [US5] Create FeaturedSection component for curated content in src/components/home/FeaturedSection.tsx
- [X] T067 [P] [US5] Create NewReleasesSection component for recent tracks in src/components/home/NewReleasesSection.tsx
- [X] T068 [P] [US5] Create PopularSection component for popular tracks in src/components/home/PopularSection.tsx
- [X] T069 [P] [US5] Create PublicTrackCard component optimized for discovery in src/components/home/PublicTrackCard.tsx
- [X] T070 [US5] Update Index page to integrate public content sections in src/pages/Index.tsx
- [X] T071 [US5] Implement quick play functionality for public tracks in src/components/home/PublicTrackCard.tsx
- [X] T072 [P] [US5] Add filter bar component for genre/mood/artist in src/components/home/FilterBar.tsx
- [X] T073 [US5] Implement remix/reuse navigation from public tracks in src/components/home/PublicTrackCard.tsx
- [X] T074 [P] [US5] Add mobile-optimized grid layout for public content in src/pages/Index.tsx
- [X] T075 [US5] Add TODO comments for recommendation algorithm in src/hooks/usePublicContent.ts

**Checkpoint**: At this point, User Story 5 should provide complete public content discovery experience

---

## Phase 7: User Story 6 - Generation Form AI Assistant Mode (Priority: P3)

**Goal**: Add AI Assistant mode with intelligent, context-aware generation flow providing step-by-step guidance.

**Independent Test**:
1. Navigate to Generate page
2. Select "Assistant" mode in GenerateHub
3. Verify step indicator shows current progress
4. Complete Step 1: Mode selection (prompt/style-lyrics/cover/extend/project/persona)
5. Verify form adapts based on selected mode
6. Verify inline tips and examples appear
7. Complete all steps and review final form
8. Verify form state persists in localStorage
9. Test mobile layout is comfortable and scrollable

### Implementation for User Story 6

- [X] T076 [US6] Create AssistantWizard container component in src/components/generate/assistant/AssistantWizard.tsx
- [X] T077 [P] [US6] Create StepPrompt component for single prompt generation in src/components/generate/assistant/StepPrompt.tsx
- [X] T078 [P] [US6] Create StepStyle component for style description in src/components/generate/assistant/StepStyle.tsx
- [X] T079 [P] [US6] Create StepLyrics component for lyrics input in src/components/generate/assistant/StepLyrics.tsx
- [X] T080 [P] [US6] Create StepReference component for cover/extension in src/components/generate/assistant/StepReference.tsx
- [X] T081 [P] [US6] Create StepReview component for final review in src/components/generate/assistant/StepReview.tsx
- [X] T082 [P] [US6] Create FormHelper component with tips and examples in src/components/generate/assistant/FormHelper.tsx
- [X] T083 [US6] Create useAssistantForm hook for form state management in src/hooks/useAssistantForm.ts
- [X] T084 [US6] Implement dynamic form rendering based on mode in src/components/generate/assistant/AssistantWizard.tsx
- [X] T085 [US6] Add form validation with helpful error messages in src/hooks/useAssistantForm.ts
- [X] T086 [US6] Implement localStorage persistence for form state in src/hooks/useAssistantForm.ts
- [X] T087 [US6] Update GenerateHub to integrate Assistant mode in src/components/generate/GenerateHub.tsx
- [X] T088 [P] [US6] Create progress indicator component in src/components/generate/assistant/ProgressIndicator.tsx
- [X] T089 [US6] Optimize mobile layout for form (compact, scrollable) in src/components/generate/assistant/AssistantWizard.tsx
- [X] T090 [US6] Add TODO comments for AI-powered suggestions in src/components/generate/assistant/FormHelper.tsx

**Checkpoint**: At this point, User Story 6 should provide complete AI Assistant mode with guided generation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality assurance.

- [X] T091 [P] Add responsive breakpoint utilities to Tailwind config in tailwind.config.ts
- [X] T092 [P] Create mobile-first CSS utility classes in src/index.css
- [X] T093 [P] Optimize image loading with lazy loading across all components (LazyImage expanded to QueueItem, AudioPlayer, CompactPlayer, FullscreenPlayer)
- [X] T094 [P] Add skeleton loaders for all async components in src/components/ui/
- [X] T095 [P] Ensure all touch targets are minimum 44×44px across application
- [ ] T096 [P] Add ARIA labels and keyboard navigation support to all interactive elements
- [ ] T097 [P] Test and fix responsive layouts from 320px to 1920px across all pages
- [X] T098 [P] Add animations with Framer Motion for state transitions
- [X] T099 [P] Optimize bundle size with code splitting and lazy loading (Implemented: feature-generate, feature-stem-studio chunks, gzip+brotli)
- [X] T100 [P] Add error boundaries for graceful error handling in src/components/ErrorBoundary.tsx
- [X] T101 Update documentation in README.md with new features (Updated with UI/UX optimization sprint Dec 12)
- [X] T102 [P] Add BUG/FIXME comments for known issues that need future attention (Created KNOWN_ISSUES_TRACKED.md with 45+ issues)
- [ ] T103 Run performance audit with Lighthouse (target: >90 mobile score)
- [ ] T104 Run accessibility audit with axe-core (target: zero violations)
- [ ] T105 Validate all tasks completed and features working end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Library & Versioning (Phase 2)**: Depends on Phase 1 completion - BLOCKS other UI work
- **Player Optimization (Phase 3)**: Depends on Phase 1 completion - Can run parallel with Phase 2
- **Track Details (Phase 4)**: Depends on Phase 1 & 2 completion
- **Track Actions (Phase 5)**: Depends on Phase 1 & 2 completion - Can run parallel with Phase 4
- **Homepage (Phase 6)**: Depends on Phase 1 completion - Can run parallel with Phases 2-5
- **Assistant Mode (Phase 7)**: Depends on Phase 1 completion - Can run parallel with other phases
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Library & Versioning)**: Can start after Phase 1 - No dependencies on other stories
- **User Story 2 (Player)**: Can start after Phase 1 - Independent of other stories
- **User Story 3 (Track Details)**: Depends on US1 (versioning) - Should be implemented after US1
- **User Story 4 (Track Actions)**: Depends on US1 (versioning) - Can run parallel with US3
- **User Story 5 (Homepage)**: Independent - Can start after Phase 1
- **User Story 6 (Assistant Mode)**: Independent - Can start after Phase 1

### Within Each User Story

- Database migrations must complete before any code changes
- Type updates before hook implementations
- Hooks before component implementations
- Core components before integration
- Mobile optimizations can happen in parallel with desktop versions

### Parallel Opportunities

- All Phase 1 migrations marked [P] can run in parallel
- Phase 1 hooks marked [P] can run in parallel
- Once Phase 1 completes, User Stories 1, 2, 5, 6 can start in parallel
- Component creation within a story marked [P] can run in parallel
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Library & Versioning)

```bash
# Launch all component creations for User Story 1 together:
Task T025: "Redesign TrackCard component with mobile-first approach"
Task T026: "Create TrackRow component for compact list view"
Task T027: "Create VersionBadge component with version count indicator"
Task T031: "Update TrackCard hover/active states for better interactivity"
Task T033: "Add visual indicators for instrumental/vocal/stems"
```

---

## Parallel Example: User Story 2 (Player Optimization)

```bash
# Launch all player component creations together:
Task T035: "Redesign CompactPlayer component for mobile"
Task T036: "Create ExpandedPlayer component with bottom sheet design"
Task T037: "Redesign FullscreenPlayer component with mobile optimization"
Task T038: "Create reusable PlaybackControls component"
Task T039: "Create ProgressBar component with buffering state"
Task T040: "Create VolumeControl component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup & Infrastructure
2. Complete Phase 2: User Story 1 (Library & Versioning)
3. Complete Phase 3: User Story 2 (Player Optimization)
4. **STOP and VALIDATE**: Test US1 & US2 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Infrastructure → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP Phase 1!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP Complete!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Polish Phase → Final testing → Production Release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Infrastructure together (Phase 1)
2. Once Phase 1 is done:
   - Developer A: User Story 1 (Library)
   - Developer B: User Story 2 (Player)
   - Developer C: User Story 5 (Homepage)
   - Developer D: User Story 6 (Assistant Mode)
3. After US1 completes:
   - Developer A moves to US3 (Track Details) or US4 (Track Actions)
4. Stories complete and integrate independently

---

## Key File References

### Database Files
- Migrations: `supabase/migrations/*.sql`
- Types: `src/integrations/supabase/types.ts`
- Queries: `src/integrations/supabase/queries/*.ts`

### Component Files
- Library: `src/components/library/*.tsx`
- Player: `src/components/player/*.tsx`
- Track Details: `src/components/track-detail/*.tsx`
- Track Actions: `src/components/track-actions/*.tsx`
- Home: `src/components/home/*.tsx`
- Generate: `src/components/generate/assistant/*.tsx`

### Hook Files
- Hooks: `src/hooks/*.ts`
- Utilities: `src/lib/*.ts`

### Page Files
- Pages: `src/pages/*.tsx`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability (US1, US2, US3, etc.)
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mobile-first approach: design for 320px first, then scale up
- Touch targets minimum 44×44px for all interactive elements
- All animations should maintain 60fps on mobile devices
- Use Tailwind responsive utilities: base (mobile), sm:, md:, lg:
- Add TODO/FIXME/BUG comments for issues that need future attention
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Success Criteria

- ✅ All Constitution checks pass
- ✅ Lighthouse mobile score >90
- ✅ All touch targets ≥44×44px
- ✅ Smooth 60fps animations
- ✅ API response <500ms p95
- ✅ Zero critical accessibility violations
- ✅ All user stories independently testable
- ✅ Mobile-first responsive design across all screens (320px to 1920px)

---

## Total Task Count

**Total Tasks**: 105
- **Phase 1 (Setup & Infrastructure)**: 24 tasks
- **User Story 1 (Library & Versioning)**: 10 tasks
- **User Story 2 (Player Optimization)**: 12 tasks
- **User Story 3 (Track Details)**: 11 tasks
- **User Story 4 (Track Actions)**: 8 tasks
- **User Story 5 (Homepage Discovery)**: 10 tasks
- **User Story 6 (Assistant Mode)**: 15 tasks
- **Phase 8 (Polish & Cross-Cutting)**: 15 tasks

**Parallel Opportunities**: 50+ tasks marked [P] can run in parallel within their phase

**Suggested MVP Scope**: Phase 1 + User Story 1 + User Story 2 (46 tasks)

**Independent Test Criteria**: Each user story has clear, actionable test steps defined in its phase header
