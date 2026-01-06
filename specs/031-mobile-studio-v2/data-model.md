# Data Model: Mobile Studio V2 - Legacy Feature Migration

**Feature**: 031-mobile-studio-v2
**Date**: 2026-01-06
**Purpose**: Define data entities and relationships for migrated studio features

## Entity Relationships

```
profiles (1) ----< (1) presets
profiles (1) ----< (1) recording_sessions
profiles (1) ----< (1) midi_files
profiles (1) ----< (N) lyric_versions

tracks (1) ----< (N) track_sections
tracks (1) ----< (N) stem_batches
tracks (1) ----< (N) replacement_events
tracks (1) ----< (N) chord_detection_results

track_sections (1) ----< (N) section_notes
track_sections (1) ----< (N) lyric_versions
```

## Entity Definitions

### 1. Lyric Version

**Table**: `lyric_versions`

**Purpose**: Track all versions of lyrics with full history and restore capability

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| track_id | UUID | FK(tracks), NOT NULL | Associated track |
| version_number | INTEGER | NOT NULL | Sequential version number |
| content | TEXT | NOT NULL | Full lyric content |
| author_id | UUID | FK(profiles), NOT NULL | User who created version |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| is_current | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is the active version |
| change_summary | TEXT | | Summary of changes made |

**Indexes**:
- `(track_id, version_number)` - Version lookup
- `(track_id, is_current)` - Current version lookup
- `(author_id, created_at)` - User history

**Validation Rules**:
- `content` max length: 50,000 characters (~10 pages)
- Only one `is_current = TRUE` per track
- Version numbers must be sequential without gaps

**State Transitions**:
```
[NEW] ---(save)---> [SAVED]
[SAVED] ---(new edit)---> [SUPERSEDED]
[ANY] ---(restore)---> [CURRENT]
```

---

### 2. Section Note

**Table**: `section_notes`

**Purpose**: Annotations associated with specific track sections

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| section_id | UUID | FK(track_sections), NOT NULL | Associated section |
| author_id | UUID | FK(profiles), NOT NULL | User who created note |
| content | TEXT | NOT NULL | Note content |
| note_type | VARCHAR(20) | NOT NULL, DEFAULT 'general' | Type: general, production, lyric, arrangement |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| is_resolved | BOOLEAN | NOT NULL, DEFAULT FALSE | Resolution status |

**Indexes**:
- `(section_id, created_at)` - Section notes timeline
- `(author_id, created_at)` - User notes

**Validation Rules**:
- `content` max length: 5,000 characters
- `note_type` enum: general, production, lyric, arrangement

---

### 3. Recording Session

**Table**: `recording_sessions`

**Purpose**: Track vocal/guitar recording sessions with audio metadata

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| user_id | UUID | FK(profiles), NOT NULL | User who recorded |
| track_id | UUID | FK(tracks), | Associated track (optional) |
| recording_type | VARCHAR(10) | NOT NULL | Type: vocal, guitar, other |
| audio_url | TEXT | NOT NULL | Storage URL for audio file |
| duration | DECIMAL(10,2) | NOT NULL | Duration in seconds |
| file_size | BIGINT | NOT NULL | File size in bytes |
| sample_rate | INTEGER | NOT NULL | Sample rate in Hz |
| bit_depth | INTEGER | NOT NULL | Bit depth (16, 24, 32) |
| channels | INTEGER | NOT NULL | Mono (1) or Stereo (2) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Recording timestamp |
| metadata | JSONB | | Additional recording data |

**Indexes**:
- `(user_id, created_at)` - User recording history
- `(track_id)` - Track recordings

**Validation Rules**:
- `duration` > 0
- `sample_rate` in [44100, 48000, 96000]
- `bit_depth` in [16, 24, 32]
- `channels` in [1, 2]
- `recording_type` enum: vocal, guitar, other

**Storage**:
- Audio files in Supabase Storage: `recordings/{user_id}/{session_id}.{format}`
- CDN caching via Supabase

---

### 4. Preset

**Table**: `presets`

**Purpose**: User-defined and system presets for track processing

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| user_id | UUID | FK(profiles) | Owner (NULL for system presets) |
| name | VARCHAR(100) | NOT NULL | Preset name |
| description | TEXT | | Preset description |
| category | VARCHAR(50) | NOT NULL | Category: vocal, guitar, mastering, etc |
| settings | JSONB | NOT NULL | Preset parameters |
| is_public | BOOLEAN | NOT NULL, DEFAULT FALSE | Public visibility |
| is_system | BOOLEAN | NOT NULL, DEFAULT FALSE | System preset flag |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| usage_count | INTEGER | NOT NULL, DEFAULT 0 | Usage counter |

**Indexes**:
- `(user_id, category)` - User presets by category
- `(is_public, category, usage_count)` - Public preset discovery
- `(is_system)` - System preset lookup

**Validation Rules**:
- `name` max length: 100 characters
- `settings` JSON schema validation (mixer settings, effects, etc.)
- `category` enum: vocal, guitar, drums, mastering, stem_separation, midi

**settings JSONB Schema** (example):
```json
{
  "mixer": {
    "volume": 0.8,
    "pan": 0.0,
    "eq": { "low": 0, "mid": 0, "high": 0 }
  },
  "effects": {
    "reverb": { "enabled": true, "roomSize": 0.5 },
    "compression": { "enabled": true, "threshold": -18 }
  }
}
```

---

### 5. Stem Batch

**Table**: `stem_batches`

**Purpose**: Track batch stem processing operations

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| track_id | UUID | FK(tracks), NOT NULL | Source track |
| user_id | UUID | FK(profiles), NOT NULL | User who initiated batch |
| operation_type | VARCHAR(20) | NOT NULL | Operation: transcription, separation |
| stem_ids | UUID[] | NOT NULL | Array of stem IDs being processed |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: pending, processing, completed, failed |
| progress | INTEGER | NOT NULL, DEFAULT 0 | Progress percentage (0-100) |
| results | JSONB | | Processing results per stem |
| error_message | TEXT | | Error details if failed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Batch start time |
| completed_at | TIMESTAMPTZ | | Batch completion time |

**Indexes**:
- `(track_id, created_at)` - Track batch history
- `(user_id, status)` - User active batches
- `(status, created_at)` - Pending/processing batches

**Validation Rules**:
- `stem_ids` array length: 1-50 stems
- `progress` range: 0-100
- `operation_type` enum: transcription, separation
- `status` enum: pending, processing, completed, failed

**results JSONB Schema** (transcription example):
```json
{
  "stems": [
    { "stem_id": "uuid", "status": "success", "midi_url": "..." },
    { "stem_id": "uuid", "status": "failed", "error": "..." }
  ],
  "summary": { "total": 10, "success": 9, "failed": 1 }
}
```

---

### 6. Replacement Event

**Table**: `track_change_log` (EXTENDED)

**Purpose**: Track section replacement history (extends existing change log)

**New Fields for Section Replacements**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| old_content | TEXT | | Previous section content |
| new_content | TEXT | | New section content |
| section_start | DECIMAL(10,2) | | Section start time (seconds) |
| section_end | DECIMAL(10,2) | | Section end time (seconds) |
| prompt | TEXT | | Generation prompt used |

**Note**: These fields extend the existing `track_change_log` table. Use `change_type = 'section_replacement'` to filter.

**Validation Rules**:
- `old_content` and `new_content` can be NULL for track-level changes
- `section_start` < `section_end` when both present
- `prompt` max length: 2,000 characters

---

### 7. MIDI File

**Table**: `midi_files`

**Purpose**: Store MIDI file metadata and references

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| user_id | UUID | FK(profiles), NOT NULL | Owner |
| track_id | UUID | FK(tracks) | Associated track (optional) |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_url | TEXT | NOT NULL | Storage URL |
| file_size | BIGINT | NOT NULL | File size in bytes |
| duration | DECIMAL(10,2) | NOT NULL | Duration in seconds |
| tempo | INTEGER | | Tempo in BPM |
| time_signature | VARCHAR(10) | | Time signature (e.g., "4/4") |
| key_signature | VARCHAR(10) | | Key signature (e.g., "C Major") |
| note_count | INTEGER | | Total number of notes |
| track_count | INTEGER | | Number of MIDI tracks |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Upload timestamp |
| metadata | JSONB | | Additional MIDI data |

**Indexes**:
- `(user_id, created_at)` - User MIDI library
- `(track_id)` - Track MIDI files

**Validation Rules**:
- `file_name` max length: 255 characters
- `duration` > 0
- `tempo` range: 20-300 BPM
- `note_count` >= 0
- `track_count` >= 1

**Storage**:
- MIDI files in Supabase Storage: `midi/{user_id}/{file_id}.mid`
- CDN caching via Supabase

---

### 8. Keyboard Shortcut

**Table**: `profiles` (EXTENDED)

**Purpose**: Store user keyboard shortcut customizations

**New Field**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| keyboard_shortcuts | JSONB | DEFAULT '{}' | Custom shortcut mappings |

**Note**: Stored in `profiles` table as user preference.

**keyboard_shortcuts JSONB Schema**:
```json
{
  "studio": {
    "play_pause": { "key": " ", "ctrl": false, "shift": false },
    "save": { "key": "s", "ctrl": true, "shift": false },
    "undo": { "key": "z", "ctrl": true, "shift": false }
  },
  "lyrics": {
    "ai_assist": { "key": "a", "ctrl": true, "shift": false },
    "add_note": { "key": "n", "ctrl": true, "shift": false }
  }
}
```

**Validation Rules**:
- Each shortcut has: `key` (string), `ctrl` (boolean), `shift` (boolean), `meta` (boolean)
- No duplicate key combinations within context
- Reserved shortcuts (Cmd+W, Cmd+Q, etc.) cannot be overridden

---

### 9. Chord Detection Result

**Table**: `chord_detection_results`

**Purpose**: Store chord detection analysis results

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| track_id | UUID | FK(tracks), NOT NULL | Source track |
| recording_id | UUID | FK(recording_sessions) | Source recording (optional) |
| user_id | UUID | FK(profiles), NOT NULL | User who requested |
| analysis_id | VARCHAR(100) | NOT NULL | External analysis ID |
| chords | JSONB | NOT NULL | Detected chords with timing |
| confidence | DECIMAL(4,3) | NOT NULL | Overall confidence (0-1) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Analysis timestamp |

**Indexes**:
- `(track_id)` - Track chord results
- `(recording_id)` - Recording chord results
- `(user_id, created_at)` - User analysis history

**Validation Rules**:
- `confidence` range: 0-1
- `analysis_id` max length: 100 characters

**chords JSONB Schema**:
```json
{
  "chords": [
    { "time": 0.0, "chord": "C", "duration": 2.5, "confidence": 0.95 },
    { "time": 2.5, "chord": "Am", "duration": 2.5, "confidence": 0.92 }
  ],
  "key": "C Major",
  "tempo": 120
}
```

---

## Database Migrations Required

### New Tables
1. `lyric_versions` - Track lyric version history
2. `section_notes` - Section annotations
3. `recording_sessions` - Vocal/guitar recording metadata
4. `presets` - User and system presets
5. `stem_batches` - Batch processing tracking
6. `midi_files` - MIDI file metadata
7. `chord_detection_results` - Chord analysis results

### Extended Tables
1. `profiles` - Add `keyboard_shortcuts` column
2. `track_change_log` - Add replacement-specific columns

### Indexes to Add
- All indexes listed in entity definitions above

### RLS Policies
- Enable Row Level Security on all new tables
- Users can read/write their own data
- Public presets visible to all authenticated users
- System presets readable by all

## Data Flow Diagrams

### Lyrics Versioning Flow
```
User edits lyrics
  ↓
Create new lyric_versions row (is_current=FALSE)
  ↓
Update all lyric_versions for track (is_current=FALSE)
  ↓
Set new version is_current=TRUE
  ↓
Log to track_change_log
```

### Recording Flow
```
User grants microphone permission
  ↓
MediaRecorder captures audio
  ↓
Upload to Supabase Storage
  ↓
Create recording_sessions row
  ↓
Optional: Trigger chord detection
  ↓
Create chord_detection_results row
```

### Batch Stem Processing Flow
```
User selects multiple stems
  ↓
Create stem_batches row (status=pending)
  ↓
Call Edge Function for batch processing
  ↓
Update status=processing, progress=0
  ↓
Process each stem sequentially/parallel
  ↓
Update progress per stem
  ↓
Store results in JSONB
  ↓
Set status=completed when done
```

## Storage Requirements

### Supabase Storage Paths
- `recordings/{user_id}/{session_id}.{format}` - Audio recordings
- `midi/{user_id}/{file_id}.mid` - MIDI files
- `stems/{track_id}/{stem_id}.{format}` - Separated stems
- `presets/{category}/{preset_id}.json` - Preset exports (optional)

### CDN Configuration
- Enable CDN for all storage buckets
- Cache TTL: 1 hour for audio files
- Cache TTL: 24 hours for MIDI files
- Cache TTL: 1 week for presets

### Backup Strategy
- Daily backups of all tables
- Retain backups for 30 days
- Point-in-time recovery enabled

## Performance Considerations

### Query Optimization
- Use indexed columns for filtering (created_at, user_id, track_id)
- Limit result sets with pagination (cursor-based for large lists)
- Use materialized views for dashboard stats

### Caching Strategy
- TanStack Query cache: 30s stale time for user data
- Static data (presets): Infinity cache
- Real-time updates via Supabase Realtime for collaboration

### Cleanup Jobs
- Delete recording_sessions older than 90 days with no track association
- Archive chord_detection_results older than 1 year
- Soft-delete presets (is_deleted flag) instead of hard delete
