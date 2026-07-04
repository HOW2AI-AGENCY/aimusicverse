# Unified Studio Page

> **Route:** `/studio-v2/project/:projectId` or `/studio-v2/track/:trackId`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

Unified Studio is the comprehensive music editing workspace combining stem separation, mixing, waveform editing, MIDI transcription, and AI generation. Features tabbed interface with Tracks, Waveform, Stem Mixer, MIDI, and Settings views. Supports both project-based and track-based workflows.

**Primary Use Cases:**

- Edit project tracks with stem separation
- Mix stems with volume, pan, and effects
- Edit waveforms with cut, copy, paste
- Transcribe audio to MIDI (6 AI models)
- Manage project settings and metadata
- Generate new tracks or extend existing ones

## Layout

### Mobile Layout (Bottom Tabs + Content)

```
┌──────────────────────────┐
│ HEADER: Back + Project Name│
│ [Settings] [Save] [Export]│
├──────────────────────────┤
│ Tab Content              │
│ Based on active tab:      │
│                          │
│ Tracks Tab:              │
│ ┌──────────────────────┐ │
│ │ [+ Add Track]         │ │
│ │ Track 1       [▶][✏]│ │
│ │ Track 2       [▶][✏]│ │
│ │ ...                  │ │
│ └──────────────────────┘ │
│                          │
│ Waveform Tab:           │
│ [Waveform Editor]        │
│ [Tools: Cut, Copy, Paste]│
│                          │
│ Stem Mixer Tab:          │
│ [Stem: Vocals, Drums...]│
│ [Volume/Pan controls]   │
│ [Effects: Reverb, EQ]   │
│                          │
│ MIDI Tab:                │
│ [Transcription Models]   │
│ [Notation Display]       │
│                          │
└──────────────────────────┘
├──────────────────────────┤
│ Bottom Navigation (5 tabs) │
│ [Trk][Wave][Mix][MIDI][⚙]│
└──────────────────────────┘
```

### Desktop Layout (Sidebar + Content Panel)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Back + Project Name + [Save] [Export] [Settings] │
├──────────────┬──────────────────────────────────────────┤
│ Track List   │ Main Content Area (Tab-based)                │
│ (Sidebar)    │ ┌────────────────────────────────────────┐ │
│ ─────────────│ │ Tab Content:                             │ │
│ [+ Add Trk] │ │                                           │ │
│ ─────────────│ │ Tracks Tab:                               │ │
│ Track 1      │ │ • Track list with controls                 │ │
│ Track 2      │ │ • Waveform preview                        │ │
│ Track 3      │ │ • Stem status indicator                    │ │
│ ...          │ │ • Actions (play, edit, generate, delete)   │ │
│              │ │                                           │ │
│              │ │ Waveform Tab:                             │ │
│              │ │ • Large waveform canvas                     │ │
│              │ │ • Zoom controls                            │ │
│              │ │ • Selection tools                          │ │
│              │ │ • Edit toolbar (cut, copy, paste, delete)   │ │
│              │ │                                           │ │
│              │ │ Stem Mixer Tab:                            │ │
│              │ │ • Stem list (vocals, drums, bass, other)    │ │
│              │ │ • Volume faders (0-100)                    │ │
│              │ │ • Pan knobs (L-R)                          │ │
│              │ │ • Mute/Solo buttons                        │ │
│              │ │ • Effects rack (reverb, EQ, delay)          │ │
│              │ │ • Master output                            │ │
│              │ │                                           │ │
│              │ │ MIDI Tab:                                  │ │
│              │ │ • Transcription models (6 options)         │ │
│              │ │ • Notation display                         │ │
│              │ │ • Download MIDI/PDF                        │ │
│              │ │                                           │ │
│              │ │ Settings Tab:                              │ │
│              │ │ • Project metadata                         │ │
│              │ │ • BPM, time signature                       │ │
│              │ │ • Export options                            │ │
│ └────────────┴ └────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

## Fields

### Tracks Tab

| Element          | Type         | Notes                               |
| ---------------- | ------------ | ----------------------------------- |
| Add Track Button | Button       | Opens add track dialog              |
| Track Items      | List         | All tracks in project               |
| Track Name       | Text         | Track title (editable)              |
| Waveform Preview | Canvas       | Mini waveform display               |
| Duration         | Text (MM:SS) | Track length                        |
| Stem Status      | Badge        | "4 stems", "No stems", "Processing" |
| Play Button      | Icon         | Plays track                         |
| Edit Button      | Icon         | Opens waveform editor               |
| Generate Button  | Icon         | Extend/regenerate section           |
| Delete Button    | Icon         | Remove from project                 |

### Waveform Tab

| Element         | Type     | Notes                                 |
| --------------- | -------- | ------------------------------------- |
| Waveform Canvas | Canvas   | Large interactive waveform display    |
| Zoom Slider     | Slider   | Zoom in/out (0.1x to 10x)             |
| Selection       | Region   | Selected region (highlighted)         |
| Time Display    | Text     | Current playhead position (MM:SS.mmm) |
| Toolbar         | Buttons  | Cut, Copy, Paste, Delete, Select All  |
| Transport       | Controls | Play, Stop, Loop, Return to start     |

### Stem Mixer Tab

| Element       | Type   | Notes                                   |
| ------------- | ------ | --------------------------------------- |
| Stem List     | List   | Vocals, Drums, Bass, Other instruments  |
| Stem Items    | Rows   | Each stem with controls                 |
| Volume Fader  | Slider | 0-100, controls stem volume             |
| Pan Knob      | Rotary | L-R pan control (-50 to +50)            |
| Mute Button   | Toggle | Mute stem                               |
| Solo Button   | Toggle | Solo stem (hear only this stem)         |
| Effects Rack  | Panel  | Reverb, EQ, Delay, Compression per stem |
| Master Volume | Slider | Overall output volume                   |
| Master Export | Button | Export mixed audio                      |

### MIDI Tab

| Element           | Type     | Notes                                      |
| ----------------- | -------- | ------------------------------------------ |
| Model Selector    | Select   | 6 transcription models (Basic to Advanced) |
| Confidence Meter  | Progress | Shows detection confidence                 |
| Notation Display  | Canvas   | Sheet music or guitar tablature            |
| Download MIDI     | Button   | Download .midi file                        |
| Download PDF      | Button   | Download .pdf notation file                |
| Transcribe Button | Button   | Start transcription process                |

### Settings Tab

| Element        | Type       | Notes                        |
| -------------- | ---------- | ---------------------------- |
| Project Name   | Text input | Editable project name        |
| Description    | Textarea   | Project description          |
| BPM            | Number     | Project tempo (60-200)       |
| Time Signature | Select     | 4/4, 3/4, 6/8, etc.          |
| Export Format  | Select     | WAV, MP3, Stem separated     |
| Sample Rate    | Select     | 44.1kHz, 48kHz, 96kHz        |
| Bit Depth      | Select     | 16-bit, 24-bit, 32-bit float |

---

## Interactions

### Page Load

**Two Entry Points:**

**1. From Project (`/studio-v2/project/{projectId}`):**

- Load project data via `loadProject(projectId)`
- Initialize studio store with project state
- Render StudioShell with project loaded

**2. From Track (`/studio-v2/track/{trackId}`):**

- Create new project from track via `createFromTrack(trackId)`
- Navigate to `/studio-v2/project/{newProjectId}` (replace URL)
- Load project with imported track

**API Calls:**

- `GET /api/studio-projects/{id}` — Load project
- `POST /api/studio-projects/from-track/{trackId}` — Create project from track

### Tab Switching

**Trigger:** Click tab trigger (mobile: bottom, desktop: top)

**Behavior:**

1. Update active tab in store
2. Lazy load tab content if needed
3. Show loading skeleton if loading
4. Render tab content

**Tab Persistence:**

- Tab selection saved to project state
- Restored when project reopened
- Default: Always opens to Tracks tab

### Add Track to Project

**Trigger:** Click "+ Add Track" button

**Behavior:**

1. Open add track dialog:
   - Select from library (dropdown of user's tracks)
   - Or upload new audio file
   - Or generate new track
2. User selects/adds track
3. Call API: `POST /api/studio-projects/{id}/tracks`
4. Track added to project
5. Refresh track list

**API Request:**

```typescript
POST /api/studio-projects/{id}/tracks
{
  track_id: string;
  name?: string;
}
```

### Stem Separation

**Trigger:** Click "Separate Stems" on track

**Behavior:**

1. Show stem selection dialog:
   - Vocals (required)
   - Drums, Bass, Other (optional)
2. User selects stem types
3. Call API: `POST /api/audio/separate-stems`
4. Track status changes to "Processing"
5. On completion: Stems available in Stem Mixer tab
6. Update stem status badge

**API Call:**

- `POST /api/audio/separate-stems` — Separate audio into stems

### Stem Mixing

**Trigger:** Adjust volume/pan faders in Stem Mixer tab

**Behavior:**

1. Update stem state in store immediately (optimistic)
2. Changes reflected in audio output (if playback active)
3. Debounce API updates (500ms) to avoid excessive calls
4. On stop: Call API to save stem mix settings

**API Request:**

```typescript
PATCH /api/studio-projects/{id}/stem-mix
{
  stem_settings: {
    vocals: { volume: 80, pan: 0, mute: false, solo: false },
    drums: { volume: 100, pan: 0, mute: false, solo: false },
    // ... other stems
  }
}
```

### Waveform Editing

**Cut Selection:**

- **Trigger:** Select region → Click "Cut"
- **Behavior:** Remove selection, update track audio

**Copy/Paste:**

- **Trigger:** Select region → Click "Copy" → Click "Paste"
- **Behavior:** Copy selection to clipboard, paste at playhead

**Delete Selection:**

- **Trigger:** Select region → Click "Delete"
- **Behavior:** Remove selection (same as Cut)

### MIDI Transcription

**Trigger:** Select model → Click "Transcribe"

**Behavior:**

1. Show model options (6 models: Basic to Advanced)
2. User selects model and options
3. Call API: `POST /api/midi/transcribe`
4. Show progress indicator
5. On completion:
   - Display notation in MIDI tab
   - Enable download buttons

**API Call:**

- `POST /api/midi/transcribe` — Transcribe audio to MIDI

### Export Project

**Trigger:** Click "Export" button in header

**Behavior:**

1. Open export dialog:
   - Format selection (WAV, MP3, Stems)
   - Sample rate, bit depth
   - Stem selection (if exporting stems)
2. User confirms settings
3. Call API: `POST /api/studio-projects/{id}/export`
4. Download file when ready

**API Call:**

- `POST /api/studio-projects/{id}/export` — Export project

### Save Project

**Trigger:** Click "Save" button in header

**Behavior:**

1. Save current project state to API
2. Show "Saving..." indicator
3. On success: Show "Project saved!" toast
4. Auto-save: Every 5 minutes during editing

**API Call:**

- `PATCH /api/studio-projects/{id}` — Save project state

## API Dependencies

| API               | Method | Path                                       | Trigger           | Notes                  |
| ----------------- | ------ | ------------------------------------------ | ----------------- | ---------------------- |
| Get Project       | GET    | /api/studio-projects/{id}                  | Page load         | Load project           |
| Create from Track | POST   | /api/studio-projects/from-track/{trackId}  | Track entry       | Create project         |
| Add Track         | POST   | /api/studio-projects/{id}/tracks           | Add track         | Link track             |
| Remove Track      | DELETE | /api/studio-projects/{id}/tracks/{trackId} | Remove action     | Unlink track           |
| Separate Stems    | POST   | /api/audio/separate-stems                  | Stem separation   | Process audio          |
| Get Stem Status   | GET    | /api/studio-projects/{id}/stem-status      | Load project      | Stem processing status |
| Save Stem Mix     | PATCH  | /api/studio-projects/{id}/stem-mix         | Mixer change      | Save mix settings      |
| Transcribe MIDI   | POST   | /api/midi/transcribe                       | Transcribe button | Convert audio to MIDI  |
| Export Project    | POST   | /api/studio-projects/{id}/export           | Export button     | Download files         |
| Save Project      | PATCH  | /api/studio-projects/{id}                  | Save button       | Save state             |

## Page Relationships

**From:**

- `/studio-v2` → Click project card
- `/library` → Click "Edit in Studio" on track
- `/` (Home) → From generation "Edit in Studio" option
- Deep link → `startapp=studio` or `startapp=studio-{projectId}` or `startapp=track-{trackId}`

**To:**

- `/library` → Click "View in Library" on track
- `/` (Home) → Back button (returns to studio hub)
- `/studio-v2/new` → Create new project (from hub)

**Data Coupling:**

- Project state: Managed via Zustand store (`useUnifiedStudioStore`)
- Auto-save: Every 5 minutes to prevent data loss
- Stem processing: Async status updates via polling
- Audio playback: Integrated with global player (`usePlayerStore`)

## Business Rules

1. **Project Creation Workflows:**
   - From scratch: Empty project, user adds tracks manually
   - From track: Project created with track imported (audio copied)
   - Limits: No hard limit on tracks per project

2. **Stem Separation:**
   - Supported stems: Vocals, Drums, Bass, Other (instruments)
   - Processing time: 30-120 seconds depending on track length
   - Quality: Lossless stem separation (WAV output)
   - Cost: 1 credit per stem type (4 stems = 4 credits)

3. **MIDI Transcription:**
   - 6 models available: From basic (fast) to advanced (accurate)
   - Processing time: 1-5 minutes depending on model and track length
   - Output formats: MIDI file + PDF notation
   - Confidence score: Displayed to user (0-100%)

4. **Waveform Editing:**
   - Non-destructive: Original audio preserved until export
   - Undo/Redo: 50 levels of undo history
   - Selection: Click-drag to select region
   - Zoom: 0.1x to 10x zoom levels

5. **Stem Mixing:**
   - Volume: 0-100 range (0 = silent, 100 = full)
   - Pan: -50 to +50 (-50 = full left, +50 = full right, 0 = center)
   - Mute: Silences stem (cannot be soloed when muted)
   - Solo: Hears only this stem (other stems muted)
   - Effects: Reverb, EQ, Delay, Compression per stem

6. **Auto-Save:**
   - Frequency: Every 5 minutes during active editing
   - Trigger: Any state change in studio store
   - Conflict detection: Warns if multiple editors detected
   - Recovery: Can recover last auto-saved state

7. **Export Formats:**
   - Mix: Single audio file (all stems mixed)
   - Stems: Separate files for each stem
   - Quality: WAV (lossless) or MP3 (compressed)
   - Sample rates: 44.1kHz, 48kHz, 96kHz
   - Bit depths: 16-bit, 24-bit, 32-bit float

8. **Project Limits:**
   - Max tracks: No hard limit (practical limit: 50)
   - Max stems per track: 4 (vocals, drums, bass, other)
   - Max MIDI per track: 1 transcription
   - Max project size: 2GB (audio files total)

9. **Real-time Updates:**
   - Stem status: Polled every 3 seconds during processing
   - Transcription: Progress updates via WebSocket or polling
   - Collaborative editing: Not supported (single editor at a time)

10. **Mobile Optimizations:**
    - Bottom tabs: 5-tab navigation (Tracks, Waveform, Mixer, MIDI, Settings)
    - Touch targets: Minimum 44×44px for all controls
    - Landscape mode: Supported for waveform editing
    - Haptic feedback: On all actions
    - Safe areas: Padding for notch/island
    - Audio monitoring: Real-time playback during editing

---

**Next:** [New Studio Project Page](./20-new-studio-project.md) → Batch 4 continues
