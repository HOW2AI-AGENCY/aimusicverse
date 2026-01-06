# Feature Specification: Mobile Studio V2 - Legacy Feature Migration

**Feature Branch**: `031-mobile-studio-v2`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "требуется доработать единый интерфейс мобильной студии 2 версии - StudioShell(/studio-v2) - изучи в деталях интерфейс устаревшей студии и перенеси функционал в единый новый интерфейс"

## Overview

This specification defines the migration of functionality from the legacy studio interface to the unified StudioShell (studio-v2). The legacy studio contains several features that are missing from the new unified studio, including lyric editing capabilities, creative workspace tools (MusicLab), professional studio features, and various advanced editing tools.

## User Scenarios & Testing

### User Story 1 - Lyrics Studio Integration (Priority: P1)

A music creator opens the unified studio to edit lyrics for their track. They want AI-powered lyric assistance, section notes, tag enrichment, and version history while working on their mobile device.

**Why this priority**: Core music creation workflow - lyric editing is fundamental to music production and is currently missing from the new studio interface.

**Independent Test**: Can be tested by opening a track in the unified studio and accessing the lyrics editing panel. Users should be able to edit lyrics, use AI assistance, add section notes, and view version history.

**Acceptance Scenarios**:

1. **Given** a user has opened a track in the unified studio, **when** they tap the Lyrics tab, **then** the lyrics editing interface displays with full editing capabilities
2. **Given** a user is editing lyrics, **when** they request AI assistance, **then** the system provides contextual lyric suggestions based on the track's style
3. **Given** a user is editing lyrics, **when** they add a section note, **then** the note is saved and associated with the specific section
4. **Given** a user has made lyric edits, **when** they view version history, **then** all previous versions are displayed with timestamps and ability to restore

---

### User Story 2 - MusicLab Creative Workspace (Priority: P2)

A creator wants to record vocals, guitar, or explore creative tools like chord detection and PromptDJ mixing within the unified studio interface on their mobile device.

**Why this priority**: Creative tools enable music creation beyond generation - recording and experimentation are essential for the complete music production workflow.

**Independent Test**: Can be tested by accessing the MusicLab panel from the unified studio and using the recording and creative tools.

**Acceptance Scenarios**:

1. **Given** a user is in the unified studio, **when** they access the MusicLab panel, **then** they see recording options (vocal, guitar) and creative tools
2. **Given** a user selects vocal recording, **when** they start recording, **then** the system captures audio from the device microphone with real-time visualization
3. **Given** a user selects guitar recording, **when** they connect their instrument, **then** the system detects and processes the guitar input
4. **Given** a user has recorded audio, **when** they use chord detection, **then** the system analyzes and displays the detected chords
5. **Given** a user is a PRO subscriber, **when** they access PromptDJ, **then** the DJ mixing interface loads with prompt-based controls

---

### User Story 3 - Professional Studio Dashboard (Priority: P3)

An advanced user wants to access professional studio features including dashboard statistics, preset management, and workflow visualization from the unified studio.

**Why this priority**: Professional features enhance the workflow for power users but are not essential for basic music creation.

**Independent Test**: Can be tested by accessing the professional dashboard from the unified studio and using the preset and workflow features.

**Acceptance Scenarios**:

1. **Given** a user is in the unified studio, **when** they access the professional dashboard, **then** they see project statistics and workflow visualization
2. **Given** a user is in the professional dashboard, **when** they manage presets, **then** they can create, edit, delete, and apply presets to tracks
3. **Given** a user has applied a preset, **when** they view the workflow visualization, **then** they see the processing steps and current status

---

### User Story 4 - Advanced Stem Processing (Priority: P2)

A user wants to perform batch processing operations on stems, including batch transcription and advanced stem separation with multiple modes.

**Why this priority**: Efficiency feature for users working with multiple stems - improves workflow speed and flexibility.

**Independent Test**: Can be tested by selecting multiple stems and initiating batch operations from the stem panel.

**Acceptance Scenarios**:

1. **Given** a user has multiple stems in a project, **when** they select batch transcription, **then** the system processes all selected stems and displays progress
2. **Given** a user is separating stems, **when** they choose stem separation mode, **then** they see options for none, simple, and detailed modes
3. **Given** a user selects detailed stem mode, **when** the separation completes, **then** individual stem tracks are created for vocals, drums, bass, and instruments

---

### User Story 5 - Section Replacement History (Priority: P3)

A user wants to view the complete history of section replacements made to their track, including the ability to compare and restore previous versions.

**Why this priority**: Iterative editing feature - enables users to experiment and revert changes but not essential for basic functionality.

**Independent Test**: Can be tested by making section replacements and then accessing the replacement history panel.

**Acceptance Scenarios**:

1. **Given** a user has made section replacements, **when** they access replacement history, **then** they see a chronological list of all replacements
2. **Given** a user is viewing replacement history, **when** they select a past replacement, **then** they can preview and restore that version
3. **Given** a user restores a past replacement, **when** the restoration completes, **then** the track reflects the restored state

---

### User Story 6 - MIDI File Support (Priority: P3)

A user wants to import, view, and play MIDI files within the unified studio interface, including visualization and playback controls.

**Why this priority**: Niche use case for MIDI workflows - valuable for specific users but not core to most music creation workflows.

**Independent Test**: Can be tested by importing a MIDI file and accessing the MIDI viewer and player from the unified studio.

**Acceptance Scenarios**:

1. **Given** a user imports a MIDI file, **when** the file loads, **then** it appears in the track list with MIDI indicator
2. **Given** a user has a MIDI track, **when** they open the MIDI viewer, **then** they see visual representation of notes and timing
3. **Given** a user is viewing MIDI, **when** they play the track, **then** the MIDI viewer highlights notes in sync with playback

---

### User Story 7 - Keyboard Shortcuts System (Priority: P3)

A user wants to use keyboard shortcuts for common studio operations to improve their workflow efficiency on desktop devices.

**Why this priority**: UX enhancement - improves efficiency for desktop users but mobile users rely on touch.

**Independent Test**: Can be tested by pressing keyboard shortcuts and verifying the corresponding actions occur.

**Acceptance Scenarios**:

1. **Given** a user is in the unified studio on desktop, **when** they press a keyboard shortcut, **then** the corresponding action executes
2. **Given** a user is unsure of shortcuts, **when** they open the shortcuts dialog, **then** they see a complete reference of all available shortcuts
3. **Given** a user has customized shortcuts, **when** they use their custom bindings, **then** the system respects their customizations

---

### User Story 8 - Studio Actions Layout (Priority: P3)

A user wants consistent placement of action buttons throughout the studio interface, including floating action buttons for quick access to common operations.

**Why this priority**: UI consistency - improves discoverability and usability but doesn't add new functionality.

**Independent Test**: Can be tested by navigating different studio views and verifying action button placement and behavior.

**Acceptance Scenarios**:

1. **Given** a user is in any studio view, **when** they look for actions, **then** the floating action button appears in a consistent position
2. **Given** a user taps the floating action button, **when** the menu opens, **then** they see contextually relevant actions for the current view
3. **Given** a user selects an action from the FAB, **when** the action executes, **then** the interface updates to reflect the change

---

### Edge Cases

- What happens when a user tries to record audio but the device microphone permission is denied?
- How does the system handle batch processing when some stems fail to process?
- What happens when a user with limited network access tries to use AI features?
- How does the system handle MIDI file import for unsupported formats?
- What happens when a user runs out of storage space during recording?
- How does the system handle preset synchronization when working offline?
- What happens when a user attempts to restore a version that no longer exists in storage?
- How does the system handle concurrent edits when multiple users collaborate on lyrics?

## Requirements

### Functional Requirements

#### Lyrics Studio Features
- **FR-001**: System MUST provide a dedicated lyrics editing panel within the unified studio interface
- **FR-002**: System MUST offer AI-powered lyric assistance that provides contextual suggestions based on track style
- **FR-003**: Users MUST be able to add section notes that are associated with specific track sections
- **FR-004**: System MUST maintain version history for all lyric edits with timestamps
- **FR-005**: Users MUST be able to restore previous lyric versions from history
- **FR-006**: System MUST support tag enrichment for lyrics organization and search

#### MusicLab Creative Workspace
- **FR-007**: System MUST provide a MusicLab panel accessible from the unified studio
- **FR-008**: Users MUST be able to record vocals using the device microphone
- **FR-009**: Users MUST be able to record guitar input with instrument detection
- **FR-010**: System MUST provide real-time audio visualization during recording
- **FR-011**: System MUST offer chord detection functionality for recorded audio
- **FR-012**: PRO users MUST have access to PromptDJ mixing interface
- **FR-013**: System MUST support lyrics + AI tab for combined lyric and AI workflow

#### Professional Studio Features
- **FR-014**: System MUST provide a professional dashboard with project statistics
- **FR-015**: Users MUST be able to create, edit, delete, and apply presets to tracks
- **FR-016**: System MUST offer workflow visualization showing processing steps
- **FR-017**: Dashboard MUST display relevant metrics and analytics for the user's projects

#### Advanced Stem Processing
- **FR-018**: System MUST support batch transcription of multiple stems
- **FR-019**: System MUST provide stem separation mode selection (none, simple, detailed)
- **FR-020**: Detailed stem mode MUST separate audio into vocals, drums, bass, and instruments
- **FR-021**: System MUST display progress indication for batch operations
- **FR-022**: System MUST handle individual failures within batch operations without stopping entire batch

#### Section Replacement History
- **FR-023**: System MUST maintain complete history of all section replacements
- **FR-024**: Users MUST be able to view chronological list of replacements with timestamps
- **FR-025**: Users MUST be able to preview previous replacement versions
- **FR-026**: Users MUST be able to restore previous replacement versions
- **FR-027**: System MUST display track state accurately after restoration

#### MIDI File Support
- **FR-028**: System MUST support MIDI file import into the unified studio
- **FR-029**: System MUST provide MIDI viewer with visual representation of notes and timing
- **FR-030**: MIDI viewer MUST highlight notes in sync during playback
- **FR-031**: System MUST support MIDI playback with appropriate controls
- **FR-032**: MIDI tracks MUST be visually distinguishable in the track list

#### Keyboard Shortcuts
- **FR-033**: System MUST provide keyboard shortcuts for common studio operations
- **FR-034**: Users MUST be able to access a complete shortcuts reference dialog
- **FR-035**: System MUST support customizable keyboard shortcuts
- **FR-036**: Shortcuts MUST be contextually appropriate for the current view

#### Studio Actions Layout
- **FR-037**: System MUST provide consistent floating action button placement across studio views
- **FR-038**: Floating action button menu MUST show contextually relevant actions
- **FR-039**: System MUST maintain visual consistency for action buttons throughout the interface

#### Mobile Optimization
- **FR-040**: All migrated features MUST be optimized for mobile touch interactions
- **FR-041**: Touch targets MUST meet minimum size requirements (44x44px)
- **FR-042**: Interface MUST adapt appropriately to different screen sizes and orientations

### Key Entities

- **Lyric Version**: Represents a specific version of lyrics with timestamp, content, and author
- **Section Note**: Annotation associated with a specific track section containing text and metadata
- **Recording Session**: Represents a vocal or guitar recording with audio data, duration, and metadata
- **Preset**: Collection of settings and parameters that can be applied to tracks
- **Stem Batch**: Group of stems selected for batch processing with status and results
- **Replacement Event**: Record of a section replacement with old content, new content, timestamp, and author
- **MIDI File**: Musical data file with notes, timing, and instrument information
- **Keyboard Shortcut**: Key combination mapped to a specific studio action
- **Chord Detection Result**: Analysis output containing detected chords with timing and confidence

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete lyric editing workflow (edit, save, AI assist, version restore) in under 3 minutes
- **SC-002**: System supports concurrent recording of at least 2 tracks without performance degradation
- **SC-003**: Batch stem processing completes for 10 stems in under 2 minutes on average network conditions
- **SC-004**: 95% of users successfully access migrated features on first attempt without assistance
- **SC-005**: MIDI file import and visualization completes in under 5 seconds for files up to 1MB
- **SC-006**: Replacement history loads and displays for tracks with up to 50 replacement events in under 2 seconds
- **SC-007**: Preset application completes in under 1 second regardless of preset complexity
- **SC-008**: Touch interface response time for all migrated features is under 100ms (perceptible instantly)
- **SC-009**: Feature parity achieves 100% of high-priority (P1-P2) legacy studio features
- **SC-010**: Mobile-optimized interface reduces user error rate by 40% compared to legacy studio

## Assumptions

1. Users have devices with working microphones for recording features
2. Network connectivity is available for AI-powered features (lyrics assistance, chord detection)
3. Users have appropriate permissions (microphone, storage) granted on their devices
4. Legacy studio components can be refactored to work with the unified studio architecture
5. Existing database schema supports the data requirements for migrated features
6. PRO users have access to PromptDJ feature (assumes existing subscription model)
7. MIDI files follow standard MIDI format specifications
8. Users are familiar with basic touch interface patterns (swipe, tap, long-press)
9. The unified studio state management system can be extended to support legacy features
10. Sufficient storage is available for audio recordings and cached data

## Dependencies

1. Legacy studio components must be accessible for refactoring
2. AI service integration for lyrics assistance and chord detection
3. Device hardware capabilities (microphone, audio processing)
4. Network service availability for cloud-based features
5. Existing user authentication and authorization systems
6. Current database schema and data storage systems
7. Audio processing libraries and utilities
8. Mobile platform APIs for device access (microphone, storage)