# Research Document: Mobile Studio V2 - Legacy Feature Migration

**Feature**: 031-mobile-studio-v2
**Date**: 2026-01-06
**Purpose**: Resolve technical decisions for migrating legacy studio functionality to unified StudioShell

## Executive Summary

This document consolidates research findings for migrating 8 major feature areas from the legacy studio to the unified StudioShell. Based on comprehensive codebase exploration, the following decisions address architectural patterns, component organization, and implementation approaches for the migration.

## Decision 1: Lyrics Studio Integration Architecture

**Decision**: Migrate LyricsStudio.tsx (1,073 lines) as a unified panel within StudioShell with mobile-first redesign

**Rationale**:
- Legacy LyricsStudio.tsx is a standalone page with advanced features (AI assistance, section notes, version history)
- New studio has no lyrics editing capabilities - complete migration required
- Existing component structure supports panel-based integration via MobileBottomSheet pattern

**Implementation Approach**:
1. Extract core lyrics editing logic from `src/pages/LyricsStudio.tsx`
2. Create `src/components/studio/unified/LyricsPanel.tsx` with mobile-optimized UI
3. Integrate via StudioShell tab navigation (add "Lyrics" tab)
4. Preserve AI assistant integration, version history, and section notes

**Alternatives Considered**:
- **Keep separate page**: Rejected - violates unified architecture principle, creates navigation fragmentation
- **Build from scratch**: Rejected - duplicate effort, existing logic is proven (1,073 lines of tested code)

**Technical Details**:
- Use existing `useLyricsHistoryStore` for version management
- Leverage MobileBottomSheet for AI assistant interface
- Integrate with TanStack Query for server state sync
- Touch targets: 44px minimum for all controls

---

## Decision 2: MusicLab Creative Workspace Migration

**Decision**: Integrate MusicLab.tsx functionality as three separate panels within StudioShell

**Rationale**:
- MusicLab contains 4 distinct workflows (vocal recording, guitar recording, lyrics+AI, PromptDJ)
- Recording features require native mobile APIs (microphone access, audio capture)
- PromptDJ is PRO-only feature requiring subscription gating

**Implementation Approach**:
1. **Recording Panel**: Consolidate vocal/guitar recording from `src/pages/MusicLab.tsx`
   - Use `@telegram-apps/sdk` for microphone access
   - Real-time visualization via canvas/WebGL
   - Audio captured as Blob, stored in Supabase Storage
2. **Chord Detection Panel**: Extract from KlangioToolsPanel.tsx
   - Batch processing via Edge Function
   - Results stored as `chord_detection_results` table
3. **PromptDJ Panel**: PRO-gated feature
   - Existing integration from legacy studio
   - Require `profiles.is_pro` check

**Alternatives Considered**:
- **Keep separate MusicLab page**: Rejected - creates context switch, violates unified workflow
- **Desktop-first recording UI**: Rejected - violates mobile-first constitution principle

**Technical Details**:
- Recording: MediaRecorder API with Telegram SDK haptic feedback
- Chord detection: Klangio API (existing integration in `src/components/studio/KlangioToolsPanel.tsx`)
- Storage: Supabase Storage with CDN caching
- Permissions: Request microphone via Telegram WebApp API

---

## Decision 3: Professional Studio Dashboard Integration

**Decision**: Add professional features as context-aware sidebar/overlay within StudioShell

**Rationale**:
- ProfessionalStudio.tsx focuses on dashboard metrics and preset management
- Preset management is utility feature, not core workflow
- Dashboard stats can be displayed without separate page

**Implementation Approach**:
1. **Dashboard Overlay**: Create `ProfessionalDashboard.tsx` as slide-over panel
   - Display project stats (track count, total duration, storage used)
   - Workflow visualization via mermaid or similar diagramming
2. **Preset Management**: Extend existing preset system
   - Create `presets` table if not exists (check schema)
   - CRUD operations via TanStack Query mutations
   - Apply preset via mixer state update

**Alternatives Considered**:
- **Separate professional page**: Rejected - creates navigation overhead, features are utility-level
- **Skip professional features**: Rejected - valued by power users, low implementation cost

**Technical Details**:
- Preset storage: JSONB in `presets` table (mixer settings, effects parameters)
- Stats: Denormalized counters on `profiles` table (track_count, total_duration)
- Visualization: SVG-based workflow diagrams (lightweight, no external chart lib)

---

## Decision 4: Advanced Stem Processing

**Decision**: Implement batch processing and stem mode selection within existing stem panel

**Rationale**:
- Legacy `BatchTranscriptionPanel.tsx` handles batch operations
- New studio has basic stem handling, missing batch and mode selection
- Stem processing is I/O bound, can be parallelized

**Implementation Approach**:
1. **Batch Transcription**: Create `BatchStemProcessor.tsx`
   - Multi-select UI for stems (checkbox list with select-all)
   - Progress indicator via TanStack Query mutation status
   - Individual failure handling (continue on error)
2. **Stem Mode Selection**: Add to stem settings
   - Radio buttons: None, Simple (2-stem), Detailed (4-stem)
   - Mode affects stem separation API call
   - User preference stored in `profiles.stem_separation_mode`

**Alternatives Considered**:
- **Queue-based batch processing**: Rejected - over-engineering for studio use case
- **Client-side stem separation**: Rejected - too heavy, requires WebAssembly ML models

**Technical Details**:
- Batch API: Supabase Edge Function with parallel processing
- Progress tracking: Real-time via Supabase Realtime
- Failure handling: Try/catch per stem, log errors, show summary

---

## Decision 5: Section Replacement History

**Decision**: Implement replacement history as drawer panel with restore capability

**Rationale**:
- Legacy `SectionReplacementHistory.tsx` exists
- New studio has basic section replacement (via `SectionEditorSheet.tsx`)
- History is audit trail, not core workflow

**Implementation Approach**:
1. **History Panel**: Create `ReplacementHistoryDrawer.tsx`
   - Query `track_change_log` table filtered by `change_type: 'section_replacement'`
   - Display as chronological list with timestamps
   - Diff view for old vs new content
2. **Restore Functionality**: Add restore button per history entry
   - Mutation to update track section with historical content
   - Confirm dialog (MobileActionSheet) before restore

**Alternatives Considered**:
- **Skip restore capability**: Rejected - reduces utility of history feature
- **Auto-restore with undo**: Rejected - complex state management, explicit restore is clearer

**Technical Details**:
- Query: `useTrackChangeHistory(trackId)` via TanStack Query
- Restore: Atomic update to `track_sections` table with new change log entry
- UI: Virtualized list for large histories (react-virtuoso)

---

## Decision 6: MIDI File Support

**Decision**: Migrate MIDI viewer and player as dedicated panel within StudioShell

**Rationale**:
- Legacy has `MidiViewerPanel.tsx`, `MidiPlayerCard.tsx`, `MidiFilesCard.tsx`
- MIDI is niche but valuable workflow for producers
- Existing components can be adapted to mobile

**Implementation Approach**:
1. **MIDI Import**: Add to existing `ImportAudioDialog.tsx`
   - Accept .mid, .midi files
   - Parse via Tone.js MIDI parser (already in dependencies)
2. **MIDI Viewer**: Create `MidiViewerPanel.tsx`
   - Piano roll visualization (canvas-based for performance)
   - Note highlighting during playback
   - Zoom/pan gestures via @use-gesture/react
3. **MIDI Playback**: Integrate with existing GlobalAudioPlayer
   - MIDI rendered to audio via Tone.js sampler
   - Sync with existing player controls

**Alternatives Considered**:
- **Skip MIDI support**: Rejected - removes value for producers, low maintenance cost
- **External MIDI library**: Rejected - Tone.js already has MIDI support

**Technical Details**:
- MIDI parse: `Tone.Midi.parse(file)`
- Visualization: HTML5 Canvas with requestAnimationFrame
- Playback: Tone.js Sampler with instrument samples
- Storage: MIDI files in Supabase Storage, metadata in `midi_files` table

---

## Decision 7: Keyboard Shortcuts System

**Decision**: Implement desktop-only keyboard shortcuts with reference dialog

**Rationale**:
- Keyboard shortcuts improve desktop efficiency
- Mobile users rely on touch, shortcuts are desktop concern
- Constitution requires cross-platform compatibility

**Implementation Approach**:
1. **Shortcut Registry**: Create `useKeyboardShortcuts.ts` hook
   - Map key combinations to actions (Cmd/Ctrl + S = Save, etc.)
   - Context-aware shortcuts (different per studio tab)
   - Store customizations in user preferences
2. **Shortcuts Dialog**: Create `KeyboardShortcutsDialog.tsx`
   - Table format: Key combo | Action | Context
   - Search/filter by action name
   - Edit capability (rebind shortcuts)
3. **Desktop Only**: Detect via `window.matchMedia('(pointer: fine)')`
   - Disable on mobile/touch devices
   - Show help tip on desktop only

**Alternatives Considered**:
- **Mobile shortcuts**: Rejected - no physical keyboard, touch gestures are better
- **Fixed shortcuts**: Rejected - power users want customization

**Technical Details**:
- Event handling: `useEffect` with `keydown` listener
- Key detection: `e.key`, `e.ctrlKey`, `e.metaKey`, `e.shiftKey`
- Conflicts: Prevent browser defaults (Cmd+S, Cmd+P) with `e.preventDefault()`
- Storage: User preferences in `profiles.keyboard_shortcuts` (JSONB)

---

## Decision 8: Studio Actions Layout (FAB System)

**Decision**: Implement consistent Floating Action Button (FAB) across all studio views

**Rationale**:
- Legacy has scattered action placement
- FAB is standard mobile pattern (Material Design)
- Improves discoverability and consistency

**Implementation Approach**:
1. **Global FAB Component**: Create `StudioFAB.tsx`
   - Fixed position (bottom-right, 16px from edge)
   - Action menu (list of 3-5 actions max)
   - Context-aware actions (different per tab)
2. **Action Configuration**: Define actions per studio context
   - Player tab: Play, Pause, Loop
   - Sections tab: Add Section, Replace Section
   - Stems tab: Separate, Export
3. **Haptic Feedback**: Telegram SDK on tap
   - Light feedback for menu open
   - Medium feedback for action execute

**Alternatives Considered**:
- **Multiple FABs**: Rejected - cluttered, violates single-primary-action principle
- **Top bar actions**: Rejected - harder to reach on mobile, non-standard pattern

**Technical Details**:
- Positioning: `position: fixed; bottom: 80px; right: 16px` (above bottom nav)
- Animation: Framer Motion scale + rotate (menu open/close)
- Actions: Record of context -> action list mapping
- Accessibility: ARIA label, keyboard navigation (Tab, Enter, Esc)

---

## Technical Context Summary

**Language/Version**: TypeScript 5.9 + React 19.2
**Primary Dependencies**:
- UI: shadcn/ui, Radix UI, Framer Motion, Tailwind CSS
- State: Zustand 5.0, TanStack Query 5.90, React Hook Form
- Audio: Tone.js 14.9, Wavesurfer.js 7.8
- Mobile: @twa-dev/sdk 8.0.2, @use-gesture/react
- Storage: Supabase (PostgreSQL, Edge Functions, Storage, Realtime)

**Storage**: PostgreSQL (Supabase) + Supabase Storage for audio/MIDI files
**Testing**: Jest 30.2 (unit), Playwright 1.57 (E2E)
**Target Platform**: Telegram Mini App (iOS Safari 15+, Chrome Android 100+)
**Project Type**: Mobile web application (single-page, React-based)
**Performance Goals**:
- Bundle size: < 950 KB (gzip)
- Touch response: < 100ms (instant feedback)
- Recording: Support 2+ concurrent tracks without degradation
- Batch processing: 10 stems in < 2 minutes

**Constraints**:
- Bundle size limit: 950 KB enforced by size-limit
- Touch targets: 44-56px minimum
- iOS Safari audio limit: Max 10 simultaneous audio elements
- Telegram Mini App viewport: Portrait primary, landscape secondary

**Scale/Scope**:
- 8 user stories (P1-P3 priority)
- 42 functional requirements
- 9 key entities
- 8 feature areas to migrate
- Target: 100% feature parity for P1-P2 features

## Architecture Compliance

All decisions comply with constitution principles:
- **Mobile-First**: All UI designed for portrait, 44px touch targets
- **Performance**: Code splitting, lazy loading, virtualization
- **Audio**: Single audio source via GlobalAudioProvider
- **Component**: shadcn/ui patterns, MobileBottomSheet for modals
- **State**: Zustand for global, TanStack Query for server, React Hook Form for forms
- **Security**: RLS policies, input validation (Zod), no secrets in frontend
- **Accessibility**: WCAG AA, keyboard nav, ARIA labels, haptic feedback

## Open Questions Resolved

All technical clarifications from spec have been addressed:
- Recording API: MediaRecorder with Telegram SDK
- Chord detection: Existing Klangio integration
- Preset storage: JSONB in presets table
- MIDI parsing: Tone.js MIDI parser
- Shortcuts: Desktop-only, context-aware
- FAB actions: Record of context -> action mapping

No remaining technical blockers for implementation.
