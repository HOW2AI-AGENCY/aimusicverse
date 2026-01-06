# Tasks: Mobile Studio V2 - Legacy Feature Migration

**Input**: Design documents from `/specs/031-mobile-studio-v2/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅

**Tests**: Tests are OPTIONAL per spec - not explicitly requested. Test tasks omitted to focus on implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions
Single web application structure: `src/`, `supabase/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema creation and foundation setup

- [x] T001 Create database migration for lyric_versions table in supabase/migrations/20260106_lyric_versions.sql
- [x] T002 [P] Create database migration for section_notes table in supabase/migrations/20260106_section_notes.sql
- [x] T003 [P] Create database migration for recording_sessions table in supabase/migrations/20260106_recording_sessions.sql
- [x] T004 [P] Create database migration for presets table in supabase/migrations/20260106_presets.sql
- [x] T005 [P] Create database migration for stem_batches table in supabase/migrations/20260106_stem_batches.sql
- [x] T006 [P] Create database migration for midi_files table in supabase/migrations/20260106_midi_files.sql
- [x] T007 [P] Create database migration for chord_detection_results table in supabase/migrations/20260106_chord_detection_results.sql
- [x] T008 Add keyboard_shortcuts column to profiles table in supabase/migrations/20260106_profiles_keyboard_shortcuts.sql
- [x] T009 Add replacement-specific columns to track_change_log table in supabase/migrations/20260106_track_change_log_replacements.sql
- [x] T010 Run all database migrations via supabase db push

**Checkpoint**: Database schema ready - user story implementation can now begin ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create base API client for lyrics endpoints in src/api/lyrics.api.ts
- [x] T012 [P] Create base API client for recordings endpoints in src/api/recordings.api.ts
- [x] T013 [P] Create base API client for presets endpoints in src/api/presets.api.ts
- [x] T014 [P] Create base API client for batch operations in src/api/batch.api.ts
- [x] T015 [P] Create base API client for MIDI endpoints in src/api/midi.api.ts
- [x] T016 Create base API client for dashboard in src/api/dashboard.api.ts
- [x] T017 [P] Create base API client for shortcuts in src/api/shortcuts.api.ts
- [x] T018 Create TypeScript types for all new entities in src/types/studio-entities.ts
- [x] T019 Setup RLS policies for all new tables in supabase/migrations/20260106_rls_policies.sql

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Lyrics Studio Integration (Priority: P1) 🎯 MVP

**Goal**: AI-powered lyric editing with version history and section notes

**Independent Test**: Open a track in unified studio, navigate to Lyrics tab, edit lyrics, use AI assistance, add section notes, view/restore version history

### Implementation for User Story 1

- [x] T020 [P] [US1] Create useLyricVersions hook in src/hooks/useLyricVersions.ts
- [x] T021 [P] [US1] Create useSectionNotes hook in src/hooks/useSectionNotes.ts
- [x] T022 [US1] Create lyrics service in src/services/lyrics.service.ts (depends on T020, T021)
- [x] T023 [US1] Create LyricsPanel component in src/components/studio/unified/LyricsPanel.tsx
- [x] T024 [US1] Create AI assistant sheet component in src/components/studio/unified/LyricsAIAssistantSheet.tsx
- [x] T025 [US1] Create version history drawer in src/components/studio/unified/LyricsVersionHistoryDrawer.tsx
- [x] T026 [US1] Create section notes component in src/components/studio/unified/SectionNotesPanel.tsx
- [x] T027 [US1] Integrate LyricsPanel into StudioShell tabs in src/components/studio/unified/StudioShell.tsx
- [x] T028 [US1] Extend useUnifiedStudioStore for lyrics state in src/stores/useUnifiedStudioStore.ts

**Checkpoint**: User Story 1 fully functional - users can edit lyrics with AI assistance, version history, and section notes ✅

---

## Phase 4: User Story 2 - MusicLab Creative Workspace (Priority: P2)

**Goal**: Vocal/guitar recording, chord detection, and PromptDJ mixing

**Independent Test**: Access MusicLab panel from unified studio, record vocals/guitar, trigger chord detection, access PromptDJ (PRO)

### Implementation for User Story 2

- [ ] T029 [P] [US2] Create useRecordings hook in src/hooks/useRecordings.ts
- [ ] T030 [P] [US2] Create useChordDetection hook in src/hooks/useChordDetection.ts
- [ ] T031 [US2] Create recordings service in src/services/recording.service.ts (depends on T029, T030)
- [ ] T032 [US2] Create chord detection service in src/services/chord-detection.service.ts
- [ ] T033 [US2] Create MusicLabPanel component in src/components/studio/unified/MusicLabPanel.tsx
- [ ] T034 [US2] Create RecordingControls component in src/components/studio/unified/RecordingControls.tsx
- [ ] T035 [US2] Create audio visualization canvas in src/components/studio/unified/AudioVisualizer.tsx
- [ ] T036 [US2] Create ChordDetectionPanel component in src/components/studio/unified/ChordDetectionPanel.tsx
- [ ] T037 [US2] Create PromptDJ panel (PRO-gated) in src/components/studio/unified/PromptDJPanel.tsx
- [ ] T038 [US2] Integrate MusicLabPanel into StudioShell tabs in src/components/studio/unified/StudioShell.tsx
- [ ] T039 [US2] Configure microphone permissions via Telegram SDK in src/contexts/TelegramContext.tsx

**Checkpoint**: User Story 2 fully functional - users can record audio, detect chords, access PromptDJ

---

## Phase 5: User Story 3 - Professional Studio Dashboard (Priority: P3)

**Goal**: Project statistics, preset management, workflow visualization

**Independent Test**: Access professional dashboard, view statistics, create/edit/apply/delete presets

### Implementation for User Story 3

- [ ] T040 [P] [US3] Create usePresets hook in src/hooks/usePresets.ts
- [ ] T041 [P] [US3] Create useDashboardStats hook in src/hooks/useDashboardStats.ts
- [ ] T042 [US3] Create presets service in src/services/presets.service.ts (depends on T040, T041)
- [ ] T043 [US3] Create dashboard service in src/services/dashboard.service.ts
- [ ] T044 [US3] Create ProfessionalDashboard component in src/components/studio/unified/ProfessionalDashboard.tsx
- [ ] T045 [US3] Create PresetManager component in src/components/studio/unified/PresetManager.tsx
- [ ] T046 [US3] Create workflow visualization component in src/components/studio/unified/WorkflowVisualization.tsx
- [ ] T047 [US3] Create stats cards component in src/components/studio/unified/DashboardStatsCards.tsx
- [ ] T048 [US3] Integrate ProfessionalDashboard into StudioShell in src/components/studio/unified/StudioShell.tsx

**Checkpoint**: User Story 3 fully functional - users can view stats and manage presets

---

## Phase 6: User Story 4 - Advanced Stem Processing (Priority: P2)

**Goal**: Batch transcription and stem separation with multiple modes

**Independent Test**: Select multiple stems, initiate batch transcription, choose stem separation mode, monitor progress

### Implementation for User Story 4

- [ ] T049 [P] [US4] Create useBatchStemProcessing hook in src/hooks/useBatchStemProcessing.ts
- [ ] T050 [US4] Create batch processing service in src/services/batch-processing.service.ts
- [ ] T051 [US4] Create BatchStemProcessor component in src/components/studio/unified/BatchStemProcessor.tsx
- [ ] T052 [US4] Create stem multi-select component in src/components/studio/unified/StemMultiSelect.tsx
- [ ] T053 [US4] Create stem mode selector (none/simple/detailed) in src/components/studio/unified/StemModeSelector.tsx
- [ ] T054 [US4] Create batch progress tracker in src/components/studio/unified/BatchProgressTracker.tsx
- [ ] T055 [US4] Setup Supabase Realtime for progress updates in src/lib/realtime-batch-progress.ts
- [ ] T056 [US4] Integrate batch processor into stem panel in src/components/studio/unified/StemPanel.tsx

**Checkpoint**: User Story 4 fully functional - users can batch process stems with progress tracking

---

## Phase 7: User Story 5 - Section Replacement History (Priority: P3)

**Goal**: Complete audit trail with restore capability

**Independent Test**: Make section replacements, access replacement history, preview and restore previous versions

### Implementation for User Story 5

- [ ] T057 [P] [US5] Create useReplacementHistory hook in src/hooks/useReplacementHistory.ts
- [ ] T058 [US5] Create replacement history service in src/services/replacement-history.service.ts
- [ ] T059 [US5] Create ReplacementHistoryDrawer component in src/components/studio/unified/ReplacementHistoryDrawer.tsx
- [ ] T060 [US5] Create replacement diff viewer in src/components/studio/unified/ReplacementDiffViewer.tsx
- [ ] T061 [US5] Create restore confirmation dialog in src/components/studio/unified/RestoreConfirmDialog.tsx
- [ ] T062 [US5] Integrate history drawer into section editor in src/components/studio/unified/SectionEditorSheet.tsx

**Checkpoint**: User Story 5 fully functional - users can view and restore replacement history

---

## Phase 8: User Story 6 - MIDI File Support (Priority: P3)

**Goal**: Import, visualize, and play MIDI files

**Independent Test**: Import MIDI file, view piano roll visualization, play back with note highlighting

### Implementation for User Story 6

- [ ] T063 [P] [US6] Create useMidiFiles hook in src/hooks/useMidiFiles.ts
- [ ] T064 [US6] Create MIDI service in src/services/midi.service.ts
- [ ] T065 [US6] Create MidiViewerPanel component in src/components/studio/unified/MidiViewerPanel.tsx
- [ ] T066 [US6] Create piano roll visualization canvas in src/components/studio/unified/PianoRollCanvas.tsx
- [ ] T067 [US6] Create MIDI playback controls in src/components/studio/unified/MidiPlaybackControls.tsx
- [ ] T068 [US6] Extend ImportAudioDialog for MIDI files in src/components/studio/unified/ImportAudioDialog.tsx
- [ ] T069 [US6] Integrate Tone.js MIDI parser in src/lib/midi-parser.ts
- [ ] T070 [US6] Integrate MIDI viewer into StudioShell tabs in src/components/studio/unified/StudioShell.tsx

**Checkpoint**: User Story 6 fully functional - users can import and visualize MIDI files

---

## Phase 9: User Story 7 - Keyboard Shortcuts System (Priority: P3)

**Goal**: Desktop-only shortcuts with customization

**Independent Test**: Press keyboard shortcuts on desktop, customize shortcuts, reset to defaults

### Implementation for User Story 7

- [ ] T071 [P] [US7] Create useKeyboardShortcuts hook in src/hooks/useKeyboardShortcuts.ts
- [ ] T072 [US7] Create shortcuts service in src/services/shortcuts.service.ts
- [ ] T073 [US7] Create KeyboardShortcutsDialog component in src/components/studio/unified/KeyboardShortcutsDialog.tsx
- [ ] T074 [US7] Create shortcut registry in src/lib/shortcut-registry.ts
- [ ] T075 [US7] Add keyboard event listeners in src/hooks/useGlobalKeyboardShortcuts.ts
- [ ] T076 [US7] Implement desktop-only detection in src/lib/platform-detection.ts
- [ ] T077 [US7] Integrate shortcuts dialog into help menu in src/components/studio/unified/StudioShell.tsx

**Checkpoint**: User Story 7 fully functional - desktop users can use and customize shortcuts

---

## Phase 10: User Story 8 - Studio Actions Layout (Priority: P3)

**Goal**: Consistent FAB across all studio views

**Independent Test**: Navigate studio views, verify FAB position, test context-aware actions

### Implementation for User Story 8

- [ ] T078 [P] [US8] Create StudioFAB component in src/components/studio/unified/StudioFAB.tsx
- [ ] T079 [US8] Create FAB action configuration registry in src/lib/fab-actions.ts
- [ ] T080 [US8] Add context-aware action mapping in src/hooks/useFabActions.ts
- [ ] T081 [US8] Implement FAB animations (scale/rotate) in src/components/studio/unified/StudioFAB.tsx
- [ ] T082 [US8] Add Telegram haptic feedback to FAB in src/components/studio/unified/StudioFAB.tsx
- [ ] T083 [US8] Integrate FAB into StudioShell in src/components/studio/unified/StudioShell.tsx
- [ ] T084 [US8] Test touch targets (44px minimum) across all studio views

**Checkpoint**: User Story 8 fully functional - consistent FAB across all studio views

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T085 [P] Update CLAUDE.md with new component patterns in CLAUDE.md
- [ ] T086 [P] Update ARCHITECTURE_DIAGRAMS.md with studio changes in docs/ARCHITECTURE_DIAGRAMS.md
- [ ] T087 Run bundle size check via npm run size
- [ ] T088 [P] Run linter via npm run lint
- [ ] T089 [P] Run type check via npm run type-check
- [ ] T090 Run E2E tests for all user stories via npm run test:e2e
- [ ] T091 Validate mobile touch targets (44px minimum) across all new components
- [ ] T092 Verify safe-area handling on mobile devices
- [ ] T093 Test Telegram SDK integration (haptics, MainButton, BackButton)
- [ ] T094 Run quickstart.md validation checklist
- [ ] T095 Performance optimization review (lazy loading, code splitting)


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Lyrics)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2 - MusicLab)**: Can start after Foundational - Independent testable
- **User Story 3 (P3 - Dashboard)**: Can start after Foundational - Independent testable
- **User Story 4 (P2 - Batch Processing)**: Can start after Foundational - Independent testable
- **User Story 5 (P3 - History)**: Can start after Foundational - Independent testable
- **User Story 6 (P3 - MIDI)**: Can start after Foundational - Independent testable
- **User Story 7 (P3 - Shortcuts)**: Can start after Foundational - Independent testable
- **User Story 8 (P3 - FAB)**: Can start after Foundational - Independent testable

### Within Each User Story

- Hooks marked [P] can run in parallel
- Services depend on their hooks
- Components depend on services
- Integration depends on components
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup migration tasks (T001-T010) marked [P] can run in parallel
- All Foundational API clients (T011-T017) marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start in parallel
- Within each story, hooks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members


---

## Parallel Example: User Story 1 (Lyrics)

```bash
# Launch both hooks for User Story 1 together:
Task T020: "Create useLyricVersions hook in src/hooks/useLyricVersions.ts"
Task T021: "Create useSectionNotes hook in src/hooks/useSectionNotes.ts"

# Then create the service (depends on both hooks):
Task T022: "Create lyrics service in src/services/lyrics.service.ts"
```


---

## Parallel Example: User Story 2 (MusicLab)

```bash
# Launch both hooks for User Story 2 together:
Task T029: "Create useRecordings hook in src/hooks/useRecordings.ts"
Task T030: "Create useChordDetection hook in src/hooks/useChordDetection.ts"

# Then create services in parallel:
Task T031: "Create recordings service in src/services/recording.service.ts"
Task T032: "Create chord detection service in src/services/chord-detection.service.ts"
```


---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T019) - CRITICAL
3. Complete Phase 3: User Story 1 (T020-T028)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**Result**: Fully functional lyrics editing with AI assistance, version history, and section notes

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Lyrics) → Test independently → Deploy/Demo (MVP\!)
3. Add User Story 2 (MusicLab) → Test independently → Deploy/Demo
4. Add User Story 4 (Batch Processing) → Test independently → Deploy/Demo
5. Add User Story 3 (Dashboard) → Test independently → Deploy/Demo
6. Add remaining P3 stories → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Lyrics) - P1 priority
   - Developer B: User Story 2 (MusicLab) - P2 priority
   - Developer C: User Story 4 (Batch Processing) - P2 priority
3. Stories complete and integrate independently

### Recommended Execution Order (Single Developer)

1. Phase 1: Setup (T001-T010) - Database migrations
2. Phase 2: Foundational (T011-T019) - API clients and types
3. Phase 3: User Story 1 (T020-T028) - Lyrics Studio (P1) 🎯 MVP
4. **MVP CHECKPOINT**: Validate and deploy
5. Phase 4: User Story 2 (T029-T039) - MusicLab (P2)
6. Phase 6: User Story 4 (T049-T056) - Batch Processing (P2)
7. Phase 5: User Story 3 (T040-T048) - Dashboard (P3)
8. Phase 7: User Story 5 (T057-T062) - History (P3)
9. Phase 8: User Story 6 (T063-T070) - MIDI (P3)
10. Phase 9: User Story 7 (T071-T077) - Shortcuts (P3)
11. Phase 10: User Story 8 (T078-T084) - FAB (P3)
12. Phase 11: Polish (T085-T095)


---

## Notes

- Total tasks: 95
- Tasks per user story:
  - US1 (Lyrics): 9 tasks
  - US2 (MusicLab): 11 tasks
  - US3 (Dashboard): 9 tasks
  - US4 (Batch Processing): 8 tasks
  - US5 (History): 6 tasks
  - US6 (MIDI): 8 tasks
  - US7 (Shortcuts): 7 tasks
  - US8 (FAB): 7 tasks
- Parallel opportunities: 30+ tasks marked [P]
- All user stories independently testable
- MVP scope: Phases 1-3 (Tasks T001-T028) = 28 tasks for core lyrics editing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
