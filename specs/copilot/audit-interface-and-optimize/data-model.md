# Data Model: UI/UX Improvements

**Date**: 2025-12-01  
**Status**: Phase 1 Design

## Overview

This document defines the data model for the UI/UX improvements, including database schema changes, entity relationships, and validation rules.

---

## Database Schema Changes

### 1. Tracks Table (Modified)

**Add Column**:
```sql
ALTER TABLE music_tracks
ADD COLUMN master_version_id UUID REFERENCES track_versions(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_tracks_master_version ON music_tracks(master_version_id);

-- Comment
COMMENT ON COLUMN music_tracks.master_version_id IS 'References the active/primary version of this track';
```

**Existing Relevant Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `title` (TEXT)
- `audio_url` (TEXT)
- `cover_url` (TEXT)
- `duration_seconds` (INTEGER)
- `is_public` (BOOLEAN) - For public content discovery
- `lyrics` (TEXT)
- `timestamped_lyrics` (JSONB)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. Track Versions Table (Modified)

**Add Columns**:
```sql
ALTER TABLE track_versions
ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN is_master BOOLEAN NOT NULL DEFAULT false;

-- Ensure sequential version numbers per track
CREATE UNIQUE INDEX idx_unique_version_number_per_track 
ON track_versions(track_id, version_number);

-- Ensure only one master per track
CREATE UNIQUE INDEX idx_one_master_per_track 
ON track_versions(track_id) 
WHERE is_master = true;

-- Index for queries
CREATE INDEX idx_track_versions_master ON track_versions(track_id, is_master);

-- Comments
COMMENT ON COLUMN track_versions.version_number IS 'Sequential version number (1, 2, 3...)';
COMMENT ON COLUMN track_versions.is_master IS 'True if this is the active/primary version';
```

**Existing Relevant Columns**:
- `id` (UUID, PK)
- `track_id` (UUID, FK to music_tracks)
- `version_type` (TEXT) - 'original', 'remix', 'cover', 'extended', 'alternative'
- `audio_url` (TEXT)
- `cover_url` (TEXT)
- `duration_seconds` (INTEGER)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

### 3. Track Changelog Table (New)

**Create Table**:
```sql
CREATE TABLE track_changelog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  version_id UUID REFERENCES track_versions(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'version_created',
    'master_changed',
    'metadata_updated',
    'stem_generated',
    'cover_updated',
    'lyrics_updated'
  )),
  change_data JSONB NOT NULL DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_changelog_track ON track_changelog(track_id, created_at DESC);
CREATE INDEX idx_changelog_user ON track_changelog(user_id, created_at DESC);
CREATE INDEX idx_changelog_type ON track_changelog(change_type);

-- Comments
COMMENT ON TABLE track_changelog IS 'Audit log for track and version changes';
COMMENT ON COLUMN track_changelog.change_data IS 'JSON object with old_value, new_value, and optional reason';
```

**Example Change Data**:
```json
{
  "old_value": { "version_id": "uuid-1", "version_number": 1 },
  "new_value": { "version_id": "uuid-2", "version_number": 2 },
  "reason": "User preferred alternative generation"
}
```

### 4. Track Stems Table (Existing, No Changes)

**Relevant Columns**:
- `id` (UUID, PK)
- `track_id` (UUID, FK to music_tracks)
- `stem_type` (TEXT) - 'vocals', 'instrumental', 'drums', 'bass', 'other'
- `audio_url` (TEXT)
- `created_at` (TIMESTAMP)

**Add Index** (if not exists):
```sql
CREATE INDEX IF NOT EXISTS idx_track_stems_track 
ON track_stems(track_id);
```

### 5. Audio Analysis Table (Existing, Review Fields)

**Relevant Columns**:
- `id` (UUID, PK)
- `track_id` (UUID, FK to music_tracks)
- `analysis_type` (TEXT)
- `genre` (TEXT)
- `mood` (TEXT)
- `bpm` (INTEGER)
- `key_signature` (TEXT)
- `instruments` (TEXT[])
- `structure` (TEXT)
- `full_response` (TEXT) - Raw AI response
- `created_at` (TIMESTAMP)

### 6. Playlists Tables (New)

**Playlists Table**:
```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_playlists_user ON playlists(user_id, created_at DESC);
CREATE INDEX idx_playlists_public ON playlists(is_public) WHERE is_public = true;
```

**Playlist Tracks Junction Table**:
```sql
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Indexes
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);
```

---

## Entity Definitions

### Track (Extended)

```typescript
interface Track {
  // Primary fields
  id: string;
  user_id: string;
  title: string;
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
  
  // Versioning (NEW)
  master_version_id: string | null;
  
  // Content
  lyrics: string | null;
  timestamped_lyrics: TimestampedLyrics | null;
  
  // Metadata
  is_public: boolean;
  genre: string | null;
  mood: string | null;
  metadata: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Computed/joined fields
  version_count?: number;
  stem_count?: number;
  is_liked?: boolean;
  play_count?: number;
}

interface TimestampedLyrics {
  alignedWords: Array<{
    word: string;
    startS: number;
    endS: number;
  }>;
}
```

### TrackVersion (Extended)

```typescript
interface TrackVersion {
  // Primary fields
  id: string;
  track_id: string;
  
  // Versioning (NEW)
  version_number: number;
  is_master: boolean;
  
  // Type and content
  version_type: 'original' | 'alternative' | 'remix' | 'cover' | 'extended' | 'edit';
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number;
  
  // Metadata
  metadata: {
    generation_params?: Record<string, any>;
    remix_of?: string; // Original track ID if remix
    parent_version?: string; // If derived from another version
    notes?: string; // User notes about this version
  };
  
  // Timestamps
  created_at: string;
}
```

### TrackChangelog (New)

```typescript
interface TrackChangelog {
  id: string;
  track_id: string;
  version_id: string | null;
  change_type: 
    | 'version_created'
    | 'master_changed'
    | 'metadata_updated'
    | 'stem_generated'
    | 'cover_updated'
    | 'lyrics_updated';
  change_data: {
    old_value?: any;
    new_value: any;
    reason?: string;
  };
  user_id: string;
  created_at: string;
}
```

### TrackStem (Existing)

```typescript
interface TrackStem {
  id: string;
  track_id: string;
  stem_type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other';
  audio_url: string;
  created_at: string;
}
```

### AudioAnalysis (Existing)

```typescript
interface AudioAnalysis {
  id: string;
  track_id: string;
  analysis_type: string;
  
  // Parsed fields
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  key_signature: string | null;
  instruments: string[];
  structure: string | null;
  
  // Metrics
  arousal: number | null;  // 0-1
  valence: number | null;  // 0-1 (negative to positive)
  
  // Raw data
  full_response: string;
  analysis_metadata: Record<string, any>;
  
  created_at: string;
}
```

### Playlist (New)

```typescript
interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed
  track_count?: number;
  total_duration?: number;
}
```

### PlaylistTrack (New)

```typescript
interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  
  // Joined
  track?: Track;
}
```

---

## Client-Side State Models

### PlaybackQueue

```typescript
interface PlaybackQueue {
  current_track: Track;
  current_version: TrackVersion | null;
  
  // Queue management
  queue: Track[];           // Upcoming tracks
  history: Track[];         // Previously played (last 50)
  
  // Playback modes
  repeat_mode: 'off' | 'one' | 'all';
  shuffle: boolean;
  shuffle_order: number[];  // Pre-shuffled indices
  
  // Metadata
  created_at: number;       // Timestamp
  source: 'library' | 'playlist' | 'public' | 'project';
}
```

### PlayerState

```typescript
interface PlayerState {
  // Current playback
  track: Track | null;
  version: TrackVersion | null;
  
  // Player UI state
  state: 'compact' | 'expanded' | 'fullscreen';
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  
  // Queue
  queue: PlaybackQueue | null;
  
  // Lyrics
  showLyrics: boolean;
  currentWord: number | null;
}
```

### AssistantFormState

```typescript
interface AssistantFormState {
  // Progress
  step: number;
  totalSteps: number;
  
  // Mode
  mode: 'prompt' | 'style-lyrics' | 'cover' | 'extend' | 'project' | 'persona';
  
  // Form data
  prompt: string;
  style: string;
  lyrics: string;
  
  // References
  reference: {
    type: 'audio' | 'track' | 'project' | 'persona';
    id: string;
    url?: string;
  } | null;
  
  // Generation options
  options: {
    instrumental: boolean;
    duration: number | null;
    custom_mode: boolean;
    make_instrumental: boolean;
  };
  
  // Metadata
  metadata: Record<string, any>;
  
  // State
  isValid: boolean;
  errors: Record<string, string>;
  
  // Persistence
  savedAt: number;
  expiresAt: number;
}
```

---

## Relationships

### Entity Relationship Diagram

```
                    ┌─────────────┐
                    │   User      │
                    │  (auth)     │
                    └──────┬──────┘
                           │
                 ┌─────────┼─────────┐
                 │         │         │
                 ▼         ▼         ▼
          ┌──────────┐ ┌──────┐ ┌──────────┐
          │  Track   │ │Artist│ │ Playlist │
          │          │ └──────┘ └──────────┘
          └────┬─────┘           │
               │                 │
       ┌───────┼────────┐        │
       │       │        │        │
       ▼       ▼        ▼        ▼
   ┌───────┐ ┌─────┐ ┌─────┐ ┌────────────┐
   │Version│ │Stems│ │Audio│ │Playlist    │
   │       │ │     │ │Anal.│ │Tracks      │
   └───┬───┘ └─────┘ └─────┘ └────────────┘
       │
       ▼
   ┌──────────┐
   │Changelog │
   └──────────┘
```

### Relationship Details

1. **Track → TrackVersion** (1:many)
   - One track has multiple versions
   - FK: `track_versions.track_id → music_tracks.id`

2. **Track → TrackVersion (master)** (1:1 optional)
   - One track has one master version
   - FK: `music_tracks.master_version_id → track_versions.id`

3. **Track → TrackStem** (1:many)
   - One track has multiple stems (if generated)
   - FK: `track_stems.track_id → music_tracks.id`

4. **Track → AudioAnalysis** (1:1 optional)
   - One track has one analysis
   - FK: `audio_analysis.track_id → music_tracks.id`

5. **Track → TrackChangelog** (1:many)
   - One track has multiple changelog entries
   - FK: `track_changelog.track_id → music_tracks.id`

6. **TrackVersion → TrackChangelog** (1:many optional)
   - Changelog entries may reference a version
   - FK: `track_changelog.version_id → track_versions.id`

7. **User → Playlist** (1:many)
   - One user has multiple playlists
   - FK: `playlists.user_id → auth.users.id`

8. **Playlist ↔ Track** (many:many via PlaylistTrack)
   - Playlists contain multiple tracks
   - Tracks can be in multiple playlists
   - FK: `playlist_tracks.playlist_id → playlists.id`
   - FK: `playlist_tracks.track_id → music_tracks.id`

---

## Validation Rules

### Track
- `title`: Required, max 200 chars
- `audio_url`: Required, valid URL
- `cover_url`: Optional, valid URL or null
- `duration_seconds`: Must be > 0
- `master_version_id`: Must reference existing version, or null
- `is_public`: Boolean, default false

### TrackVersion
- `version_number`: Required, must be sequential per track
- `is_master`: Boolean, only one true per track
- `audio_url`: Required, valid URL
- `duration_seconds`: Must be > 0
- `version_type`: Must be one of allowed types

### TrackChangelog
- `change_type`: Must be one of allowed types
- `change_data`: Must be valid JSON object
- `track_id`: Must reference existing track
- `version_id`: Must reference existing version or null
- `user_id`: Must reference existing user

### Playlist
- `title`: Required, max 200 chars
- `user_id`: Must reference existing user
- `is_public`: Boolean, default false

### PlaylistTrack
- `position`: Must be >= 0, unique per playlist
- `playlist_id`: Must reference existing playlist
- `track_id`: Must reference existing track
- Unique constraint on (playlist_id, track_id)

---

## State Transitions

### Version Master Status

```
┌─────────────────────────────────────────┐
│  Track with Multiple Versions           │
├─────────────────────────────────────────┤
│  Version 1 (original)     [MASTER]  ◄── │ Initial state
│  Version 2 (alternative)           ─────┤
└─────────────────────────────────────────┘
                │
                │ User switches master
                ▼
┌─────────────────────────────────────────┐
│  Track with Multiple Versions           │
├─────────────────────────────────────────┤
│  Version 1 (original)              ◄────┤ Previous master
│  Version 2 (alternative)  [MASTER] ─────┤ New master
└─────────────────────────────────────────┘
                │
                │ Log to changelog
                ▼
┌─────────────────────────────────────────┐
│  Changelog Entry                        │
├─────────────────────────────────────────┤
│  change_type: "master_changed"          │
│  old_value: { version_id: v1 }          │
│  new_value: { version_id: v2 }          │
│  reason: "User preferred alternative"   │
└─────────────────────────────────────────┘
```

### Player State Transitions

```
    Compact ──tap/swipe up──► Expanded ──tap/swipe up──► Fullscreen
       ▲                          │                           │
       │                          │                           │
       └──────swipe down──────────┘                           │
       │                                                      │
       └──────────────────swipe down───────────────────────────┘
```

---

## Data Access Patterns

### Common Queries

1. **Get track with master version**:
```sql
SELECT t.*, v.*
FROM music_tracks t
LEFT JOIN track_versions v ON t.master_version_id = v.id
WHERE t.id = $1;
```

2. **Get all versions of track**:
```sql
SELECT *
FROM track_versions
WHERE track_id = $1
ORDER BY version_number ASC;
```

3. **Get public tracks with counts**:
```sql
SELECT 
  t.*,
  COUNT(DISTINCT v.id) as version_count,
  COUNT(DISTINCT s.id) as stem_count,
  EXISTS(SELECT 1 FROM track_likes WHERE track_id = t.id AND user_id = $1) as is_liked
FROM music_tracks t
LEFT JOIN track_versions v ON t.id = v.track_id
LEFT JOIN track_stems s ON t.id = s.track_id
WHERE t.is_public = true
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT 20;
```

4. **Get changelog for track**:
```sql
SELECT 
  c.*,
  v.version_number,
  v.version_type,
  u.username
FROM track_changelog c
LEFT JOIN track_versions v ON c.version_id = v.id
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.track_id = $1
ORDER BY c.created_at DESC;
```

---

## Migration Strategy

### Phase 1: Schema Changes
1. Add `master_version_id` to tracks (nullable)
2. Add `version_number`, `is_master` to track_versions
3. Create `track_changelog` table
4. Create `playlists` and `playlist_tracks` tables

### Phase 2: Data Migration
1. Set initial `version_number` for existing versions (sequential)
2. Set first version as master (`is_master = true`)
3. Populate `master_version_id` in tracks
4. Add initial changelog entries

### Phase 3: Validation
1. Verify one master per track
2. Verify sequential version numbers
3. Verify referential integrity

### Rollback Plan
```sql
-- If needed, rollback changes
ALTER TABLE music_tracks DROP COLUMN master_version_id;
ALTER TABLE track_versions DROP COLUMN version_number, DROP COLUMN is_master;
DROP TABLE track_changelog;
DROP TABLE playlist_tracks;
DROP TABLE playlists;
```

---

## Performance Considerations

### Indexes
- All foreign keys have indexes
- Composite index on (track_id, is_master) for fast master lookup
- Index on (track_id, version_number) for ordered queries
- Index on changelog for recent changes

### Caching Strategy
- Cache master version with track data (reduce joins)
- Cache public track counts (materialized view)
- Cache popular tracks (hourly refresh)

### Query Optimization
- Use `SELECT COUNT(*)` with `{ count: 'exact', head: true }` for counts
- Batch version queries when loading multiple tracks
- Use pagination with cursor-based navigation

---

## Conclusion

This data model supports all requirements for versioning, changelog tracking, playlists, and public content discovery while maintaining performance and data integrity. The schema changes are backward-compatible with existing code, and migrations include rollback plans.

**Next**: Proceed to API contract definition in `contracts/` directory.
