# Implementation Plan: Mobile Studio V2 - Legacy Feature Migration

**Branch**: `031-mobile-studio-v2` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-mobile-studio-v2/spec.md`

## Summary

Migrate 8 major feature areas from the legacy studio interface to the unified StudioShell (studio-v2):

1. **Lyrics Studio Integration** (P1) - AI-powered lyric editing with version history and section notes
2. **MusicLab Creative Workspace** (P2) - Vocal/guitar recording, chord detection, and PromptDJ
3. **Professional Studio Dashboard** (P3) - Project statistics, preset management, workflow visualization
4. **Advanced Stem Processing** (P2) - Batch transcription, stem mode selection
5. **Section Replacement History** (P3) - Complete audit trail with restore capability
6. **MIDI File Support** (P3) - Import, visualization, and playback
7. **Keyboard Shortcuts System** (P3) - Desktop-only shortcuts with customization
8. **Studio Actions Layout** (P3) - Consistent FAB across all studio views

**Technical Approach**: Extract and refactor existing legacy components (LyricsStudio.tsx, MusicLab.tsx, ProfessionalStudio.tsx) into unified studio panels following mobile-first constitution principles. All features integrate via StudioShell tab navigation with MobileBottomSheet pattern for modals.

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19.2
**Primary Dependencies**: shadcn/ui, Radix UI, Framer Motion, Tailwind CSS 3.4, Zustand 5.0, TanStack Query 5.90, React Hook Form + Zod, Tone.js 14.9, Wavesurfer.js 7.8, @twa-dev/sdk 8.0.2, @use-gesture/react, Supabase (PostgreSQL, Edge Functions, Storage, Realtime)
**Storage**: PostgreSQL (Supabase) + Supabase Storage for audio/MIDI files
**Testing**: Jest 30.2 (unit), Playwright 1.57 (E2E)
**Target Platform**: Telegram Mini App (iOS Safari 15+, Chrome Android 100+)
**Project Type**: Mobile web application (React-based SPA)
**Performance Goals**: Bundle size < 950 KB (gzip), touch response < 100ms, recording 2+ concurrent tracks, batch processing 10 stems in < 2 minutes, lyrics workflow in < 3 minutes
**Constraints**: Bundle size limit 950 KB, touch targets 44-56px, iOS Safari audio limit 10 elements, portrait primary orientation
**Scale/Scope**: 8 user stories (P1-P3), 42 functional requirements, 9 key entities, 7 new database tables, 10+ new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Status

All 10 constitution principles PASSED:
- I. Mobile-First Development ✅
- II. Performance & Bundle Optimization ✅
- III. Audio Architecture ✅
- IV. Component Architecture ✅
- V. State Management Strategy ✅
- VI. Security & Privacy ✅
- VII. Accessibility & UX Standards ✅
- VIII. Unified Component Architecture ✅
- IX. Screen Development Patterns ✅
- X. Performance Budget Enforcement ✅

**No violations.** All migration decisions comply with constitution principles.

## Project Structure

### Documentation (this feature)

specs/031-mobile-studio-v2/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/api-contracts.md # Phase 1 output
├── checklists/requirements.md # Spec quality checklist
└── tasks.md             # Phase 2 output (NOT created yet)

### Source Code (repository root)

src/components/studio/unified/ - NEW unified studio mobile components:
- LyricsPanel.tsx (NEW) - Lyrics editing with AI
- MusicLabPanel.tsx (NEW) - Recording workspace
- RecordingControls.tsx (NEW) - Vocal/guitar recording
- ChordDetectionPanel.tsx (NEW) - Chord analysis results
- ProfessionalDashboard.tsx (NEW) - Stats & presets
- PresetManager.tsx (NEW) - Preset CRUD
- BatchStemProcessor.tsx (NEW) - Batch operations
- ReplacementHistoryDrawer.tsx (NEW) - Section history
- MidiViewerPanel.tsx (NEW) - MIDI visualization
- KeyboardShortcutsDialog.tsx (NEW) - Shortcuts reference
- StudioFAB.tsx (NEW) - Floating action button
- StudioShell.tsx (MODIFY) - Add new tabs

**Structure Decision**: Single web application with feature-based component organization under src/components/studio/unified/. All new features integrate via StudioShell tab navigation.

## Phase 0: Research Summary

**Status**: ✅ Complete - [research.md](./research.md)

### Key Decisions

1. Lyrics Studio: Migrate LyricsStudio.tsx as unified panel with MobileBottomSheet modals
2. MusicLab: MediaRecorder API with Telegram SDK for microphone access
3. Professional Dashboard: Context-aware sidebar with JSONB preset storage
4. Batch Processing: Multi-select UI with Supabase Realtime progress tracking
5. Section History: Drawer panel querying track_change_log with restore capability
6. MIDI Support: Tone.js parser with canvas-based piano roll visualization
7. Keyboard Shortcuts: Desktop-only with JSONB storage in profiles table
8. Studio FAB: Fixed bottom-right position with context-aware actions

## Phase 1: Design Artifacts

**Status**: ✅ Complete

### Data Model
**Document**: [data-model.md](./data-model.md)

**New Tables**: lyric_versions, section_notes, recording_sessions, presets, stem_batches, midi_files, chord_detection_results

**Extended Tables**: profiles (add keyboard_shortcuts), track_change_log (add replacement columns)

### API Contracts
**Document**: [contracts/api-contracts.md](./contracts/api-contracts.md)

**Endpoints**: Lyrics (versions, restore), Recording (start, complete, chords), Presets (CRUD, apply), Batch (transcribe, status), History (list, restore), MIDI (upload, download), Dashboard (stats), Shortcuts (get, update, reset)

### Quickstart Guide
**Document**: [quickstart.md](./quickstart.md)

Developer onboarding with setup instructions, component templates, common patterns, testing checklist.

## Phase 2: Implementation Planning

**Status**: ⏳ Pending (run `/speckit.tasks` to generate tasks.md)

**Next Steps**:
1. Run `/speckit.tasks` to generate dependency-ordered task list
2. Begin implementation with P1 features (Lyrics Studio)
3. Follow constitution principles throughout development

**Implementation Phases**:
- Week 1: Lyrics Studio Integration (P1)
- Week 2: MusicLab Recording (P2)
- Week 3: Professional Dashboard (P3)
- Week 4: Batch Processing (P2) + remaining P3 features

## References

- Constitution: ../../../.specify/memory/constitution.md
- Feature Spec: spec.md
- Research: research.md
- Data Model: data-model.md
- API Contracts: contracts/api-contracts.md
- Quickstart: quickstart.md
- Project Docs: ../../../CLAUDE.md

**Plan Version**: 1.0.0 | **Last Updated**: 2026-01-06 | **Ready for Implementation**: Yes
