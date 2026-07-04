# Music Lab Page

> **Route:** `/music-lab`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

Music Lab is a unified creative workspace providing 6 specialized tools for music creation. Features tabbed interface with Vocal recording, Guitar studio, Lyrics+AI assistant, PromptDJ mixer (PRO), Chord visualizer, and Audio Hub for managing recordings.

**Primary Use Cases:**

- Record and edit vocal performances
- Record guitar sessions with chord detection
- Create and edit lyrics with AI assistance
- Mix and manipulate prompts (PRO feature)
- Visualize chords in real-time
- Manage audio recordings and uploads

## Layout

### Mobile Layout (Tabs + Content)

```
┌──────────────────────────┐
│ HEADER: Back + "Music Lab"│
├──────────────────────────┤
│ Tabs (6 tabs, icons)      │
│ [Hub][Voc][Gui][Lyr][DJ][Ch]│
├──────────────────────────┤
│ Tab Content              │
│ Based on active tab:      │
│                          │
│ Hub Tab:                 │
│ Welcome + Quick Actions  │
│ [Record Vocal]            │
│ [Record Guitar]           │
│ [Write Lyrics]            │
│ [PromptDJ (PRO)]          │
│ [Chord Visualizer]         │
│                          │
│ Vocal Tab:               │
│ [Record Vocal] button    │
│ Recording interface       │
│                          │
│ Guitar Tab:              │
│ [Record Guitar] button   │
│ Recording + chord detect  │
│                          │
│ Lyrics Tab:              │
│ AI Chat Assistant         │
│ Lyrics editor             │
│                          │
│ DJ Tab (PRO only):       │
│ Prompt mixer interface    │
│                          │
│ Chords Tab:              │
│ Real-time chord visualizer│
│                          │
└──────────────────────────┘
```

### Desktop Layout (Tabs + Content Panel)

```
┌─────────────────────────────────────────────────┐
│  HEADER: Back Button + "Music Lab"              │
├─────────────────────────────────────────────────┤
│ Tabs: [Hub][Vocal][Guitar][Lyrics][DJ][Chords] │
├─────────────────────────────────────────────────┤
│ Content Area (Max-width 4xl centered)            │
│                                                   │
│ Tab Content:                                     │
│ Hub: Welcome cards with icons                    │
│ Vocal: Audio recording controls                   │
│ Guitar: Recording + chord detection              │
│ Lyrics: AI chat + text editor                     │
│ DJ: Prompt mixer (PRO gated)                      │
│ Chords: Real-time visualizer                      │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Fields

### Tabs

| Tab           | Icon          | Feature                   | PRO Required            |
| ------------- | ------------- | ------------------------- | ----------------------- |
| Hub           | AudioWaveform | Welcome and quick access  | No                      |
| Vocal         | Mic           | Vocal recording           | No                      |
| Guitar        | Guitar        | Guitar recording + chords | Yes (BASIC tier)        |
| Lyrics        | PenLine       | Lyrics AI assistant       | No                      |
| DJ (PromptDJ) | Disc3         | Prompt mixer              | Yes (prompt_dj feature) |
| Chords        | Music         | Chord visualizer          | No                      |

### Hub Tab Content

| Element            | Type   | Notes                                    |
| ------------------ | ------ | ---------------------------------------- |
| Welcome Message    | Text   | "Music Lab - Creative Workspace"         |
| Quick Action Cards | Cards  | 6 cards, one per tool                    |
| Tool Icon          | Icon   | Large icon for each tool                 |
| Tool Name          | Text   | "Vocal Recording", "Guitar Studio", etc. |
| Tool Description   | Text   | Short description of what tool does      |
| PRO Badge          | Badge  | Shown on Guitar, DJ tabs (if no access)  |
| Open Button        | Button | Opens corresponding tab/dialog           |

### Vocal Tab Content

| Element          | Type      | Notes                             |
| ---------------- | --------- | --------------------------------- |
| Record Button    | Button    | Opens vocal recording dialog      |
| Recording Dialog | Component | `AudioRecordDialog` (lazy loaded) |
| Audio Controls   | Controls  | Record, stop, playback, save      |
| Format Settings  | Select    | Sample rate, bit depth            |

### Guitar Tab Content

| Element          | Type        | Notes                                      |
| ---------------- | ----------- | ------------------------------------------ |
| PRO Gate         | FeatureGate | Shows upgrade prompt if no access          |
| Record Button    | Button      | Opens guitar recording dialog              |
| Recording Dialog | Component   | `GuitarRecordDialog` (lazy loaded)         |
| Chord Detection  | Auto        | Automatic chord detection during recording |
| Format Settings  | Select      | Sample rate, bit depth                     |

### Lyrics Tab Content

| Element        | Type      | Notes                             |
| -------------- | --------- | --------------------------------- |
| AI Chat Agent  | Component | `LyricsAIChatAgent` (lazy loaded) |
| Chat Interface | Chat      | AI assistant for lyrics           |
| Lyrics Editor  | Textarea  | Full-featured lyrics editor       |
| AI Suggestions | Panel     | Context-aware lyric suggestions   |

### DJ Tab Content (PRO)

| Element        | Type        | Notes                             |
| -------------- | ----------- | --------------------------------- |
| PRO Gate       | FeatureGate | Shows upgrade prompt if no access |
| PromptDJ Mixer | Component   | `PromptDJMixer` (lazy loaded)     |
| Mixer Controls | Controls    | Blend and manipulate prompts      |
| Presets        | Select      | Pre-built prompt configurations   |

### Chords Tab Content

| Element          | Type      | Notes                                   |
| ---------------- | --------- | --------------------------------------- |
| Chord Visualizer | Component | `RealtimeChordVisualizer` (lazy loaded) |
| Display Area     | Canvas    | Real-time chord visualization           |
| Chord Info       | Text      | Current chord, key, confidence          |

---

## Interactions

### Page Load

**Behavior:**

1. Check feature access for Guitar Studio and PromptDJ
2. Setup Telegram Back Button (returns to previous page)
3. Initialize tab state (default: "hub")
4. Render lazy-loaded components on demand

**API Calls:**

- None (feature checks use local state/pro Subscription tier)

### Tab Switching

**Trigger:** Click tab trigger

**Behavior:**

1. Update `activeTab` state
2. Lazy load tab content if not loaded
3. Show loading skeleton while loading
4. Render tab content when ready
5. Haptic feedback (light impact)

**Lazy Loading:**

- Components loaded on first tab access
- Reduces initial bundle size
- Improves page load performance

### Feature Gates (PRO Features)

**Guitar Studio:**

- Trigger: Click Guitar tab without access
- Behavior: Show `FeatureGate` component with upgrade prompt
- Requirement: BASIC tier or higher
- Action: "Upgrade to Access" button → `/subscription`

**PromptDJ:**

- Trigger: Click DJ tab without access
- Behavior: Show `FeatureGate` component with upgrade prompt
- Requirement: `prompt_dj` feature enabled
- Action: "Upgrade to Access" button → `/subscription`

### Vocal Recording

**Trigger:** Click "Record Vocal" button (Hub tab) or open Vocal tab

**Behavior:**

1. Open `AudioRecordDialog`
2. Show recording controls:
   - Record button (starts recording)
   - Stop button (stops recording)
   - Play button (playback recording)
   - Save button (save to library)
3. Configure format settings (sample rate, bit depth)
4. On save: Call API to store recording

**API Calls:**

- `POST /api/recordings/vocal` — Save vocal recording

### Guitar Recording

**Trigger:** Click "Record Guitar" button (Hub tab) or open Guitar tab

**Behavior:**

1. Check feature access (if no access: show upgrade prompt)
2. Open `GuitarRecordDialog`
3. Show recording controls + chord detection:
   - Record button (starts recording)
   - Stop button (stops recording + analyzes chords)
   - Chord display (shows detected chords in real-time)
   - Save button (save recording + chord data)
4. On save: Call API to store recording with chords

**API Calls:**

- `POST /api/recordings/guitar` — Save guitar recording
- `POST /api/chords/detect` — Detect chords from audio

### Lyrics AI Assistant

**Trigger:** Click "Write Lyrics" button (Hub tab) or open Lyrics tab

**Behavior:**

1. Open `LyricsAIChatAgent`
2. Show chat interface with AI assistant
3. User can:
   - Ask for lyric suggestions
   - Request rhymes
   - Get genre-specific lyric templates
   - Edit lyrics in real-time
4. AI responds with suggestions
5. User can accept/edit suggestions
6. Save lyrics to library or use in generation

**API Calls:**

- `POST /api/lyrics/ai-assistant` — AI lyric suggestions
- `POST /api/lyrics/save` — Save lyrics draft

### PromptDJ Mixer

**Trigger:** Click "PromptDJ" button (Hub tab) or open DJ tab

**Behavior:**

1. Check feature access (if no access: show upgrade prompt)
2. Open `PromptDJMixer`
3. Show prompt mixing interface:
   - Multiple prompt inputs
   - Mixer controls (blend prompts)
   - Preset configurations
   - Export mixed prompt
4. User can blend prompts from different sources
5. Export final prompt to generation form

**API Calls:**

- None (client-side prompt mixing)

### Chord Visualizer

**Trigger:** Click "Chord Visualizer" button (Hub tab) or open Chords tab

**Behavior:**

1. Open `RealtimeChordVisualizer`
2. Show chord detection interface:
   - Audio input (microphone or file)
   - Real-time chord display
   - Key signature detection
   - Confidence meter
3. User can:
   - Play instrument to visualize chords
   - Upload audio file for analysis
   - Export chord progression

**API Calls:**

- `POST /api/chords/detect` — Detect chords from audio
- `POST /api/chords/progression` — Export chord progression

### Audio Hub (Integrated)

**Trigger:** Not a separate tab, integrated into various tools

**Behavior:**

1. Audio recordings automatically saved to Audio Hub
2. User can access Audio Hub to:
   - Browse all recordings
   - Upload audio files
   - Manage audio library
3. Recordings organized by type (vocal, guitar, other)

**Audio Hub Components:**

- `AudioHubRecorder` — Recording interface
- `AudioHubUploader` — File upload interface

## API Dependencies

| API                      | Method | Path                         | Trigger        | Notes                     |
| ------------------------ | ------ | ---------------------------- | -------------- | ------------------------- |
| Save Vocal Recording     | POST   | /api/recordings/vocal        | Save button    | Stores vocal recording    |
| Save Guitar Recording    | POST   | /api/recordings/guitar       | Save button    | Stores guitar recording   |
| Detect Chords            | POST   | /api/chords/detect           | Recording stop | Analyzes audio for chords |
| AI Lyrics Assistant      | POST   | /api/lyrics/ai-assistant     | Chat message   | Returns AI suggestions    |
| Save Lyrics              | POST   | /api/lyrics/save             | Save button    | Stores lyrics draft       |
| Export Chord Progression | POST   | /api/chords/progression      | Export action  | Returns chord data        |
| Check Feature Access     | GET    | /api/users/{userId}/features | Page load      | Returns enabled features  |

## Page Relationships

**From:**

- `/` (Home) → Click "Music Lab" in creative tools
- `/templates` → Click "Music Lab" in tools
- Deep link → `startapp=music-lab` opens Music Lab

**To:**

- `/audio-hub` → Access audio library (integrated)
- `/lyrics-studio` → Full lyrics editing page
- `/guitar-studio` → Dedicated guitar studio page
- `/subscription` → Upgrade for PRO features
- Previous page → Back button

**Data Coupling:**

- Feature access: Checked on page load (subscription tier)
- Recordings: Saved to Audio Hub (global audio library)
- Lyrics: Saved to lyrics drafts (accessible from Lyrics Studio)
- Chords: Stored with recordings for reference

## Business Rules

1. **Feature Access (PRO Gates):**
   - Guitar Studio: Requires BASIC tier or higher
   - PromptDJ: Requires `prompt_dj` feature enabled
   - Other tools: Available to all users (no gate)
   - Upgrade path: CTA buttons lead to `/subscription`

2. **Recording Formats:**
   - Vocal: WAV, MP3, M4A supported
   - Guitar: WAV, MP3 supported (chord detection works best with WAV)
   - Sample rates: 44.1kHz, 48kHz, 96kHz
   - Bit depths: 16-bit, 24-bit, 32-bit float

3. **Chord Detection:**
   - Real-time: Detects chords during recording
   - Post-recording: Can analyze existing audio files
   - Accuracy: 85-95% confidence (displayed to user)
   - Supported: Major, minor, 7th chords, extensions

4. **Lyrics AI Assistant:**
   - Context-aware: Suggests based on genre, mood
   - Rhyme engine: Finds rhyming words
   - Templates: Genre-specific lyric templates
   - Language: Supports multiple languages (EN, RU, ES, DE, FR)

5. **PromptDJ Mixing:**
   - Blending: Combine multiple prompts
   - Weighting: Adjust influence of each prompt
   - Presets: Pre-built configurations for common genres
   - Export: Copy to generation form or save as template

6. **Audio Hub Integration:**
   - Automatic: All recordings auto-saved to Audio Hub
   - Organized: By type (vocal, guitar, other)
   - Accessible: From various tools and dedicated `/audio-hub` page
   - Storage: Supabase Storage (user's private bucket)

7. **Chord Export:**
   - Formats: Chord progression (text), MIDI file
   - Notation: Standard notation or guitar tablature
   - Copy to clipboard: For easy pasting into other tools
   - Save to project: Can associate with music project

8. **Recording Quality:**
   - Device mic: Uses device default microphone
   - External mics: Supported via audio interface (if available)
   - Monitoring: Real-time playback monitoring during recording
   - Latency: Optimized for real-time monitoring (<50ms)

9. **Lazy Loading Strategy:**
   - Hub tab: Immediate load (no lazy components)
   - Other tabs: Components lazy-loaded on first access
   - Bundle size: Reduces initial page load by ~40%
   - Performance: Skeletons shown while loading

10. **Mobile Optimizations:**
    - Touch controls: Large buttons for recording (easy to tap while playing)
    - Landscape mode: Supported for recording (better access to controls)
    - Audio feedback: Real-time monitoring during recording
    - Haptic feedback: On record start/stop
    - Safe areas: Padding for notch/island

---

**Next:** [Lyrics Studio Page](./15-lyrics-studio.md) → Batch 3 continues
