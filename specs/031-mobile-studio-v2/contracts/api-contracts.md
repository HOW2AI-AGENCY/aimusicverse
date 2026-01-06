# API Contracts: Mobile Studio V2 - Legacy Feature Migration

**Feature**: 031-mobile-studio-v2
**Date**: 2026-01-06
**Format**: OpenAPI 3.0 (REST) + Supabase RPC
**Purpose**: Define API contracts for migrated studio features

## Base URL

```
Production: https://api.musicverse.ai
Development: http://localhost:5173/functions/v1
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer {supabase_access_token}
```

Tokens obtained via Telegram WebApp SDK initData validation.

---

## Lyrics Studio API

### GET /tracks/{trackId}/lyrics/versions

Get all lyric versions for a track.

**Response**: 200 OK
```json
{
  "versions": [
    {
      "id": "uuid",
      "versionNumber": 3,
      "content": "Full lyric text...",
      "author": {
        "id": "uuid",
        "username": "producer_jane"
      },
      "createdAt": "2026-01-06T10:30:00Z",
      "isCurrent": true,
      "changeSummary": "Added bridge section"
    }
  ]
}
```

### POST /tracks/{trackId}/lyrics/versions

Create a new lyric version.

**Request**:
```json
{
  "content": "New lyric text...",
  "changeSummary": "Revised chorus"
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "versionNumber": 4,
  "content": "New lyric text...",
  "author": {
    "id": "uuid",
    "username": "producer_jane"
  },
  "createdAt": "2026-01-06T11:00:00Z",
  "isCurrent": true
}
```

### POST /lyric-versions/{versionId}/restore

Restore a previous lyric version as current.

**Response**: 200 OK
```json
{
  "success": true,
  "restoredVersion": {
    "id": "uuid",
    "versionNumber": 2,
    "content": "Restored lyric text...",
    "isCurrent": true
  }
}
```

### GET /sections/{sectionId}/notes

Get all notes for a section.

**Response**: 200 OK
```json
{
  "notes": [
    {
      "id": "uuid",
      "content": "Add harmony here",
      "noteType": "production",
      "author": {
        "id": "uuid",
        "username": "producer_jane"
      },
      "createdAt": "2026-01-06T10:30:00Z",
      "isResolved": false
    }
  ]
}
```

### POST /sections/{sectionId}/notes

Create a new section note.

**Request**:
```json
{
  "content": "Add harmony here",
  "noteType": "production"
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "content": "Add harmony here",
  "noteType": "production",
  "createdAt": "2026-01-06T10:30:00Z",
  "isResolved": false
}
```

---

## MusicLab Recording API

### POST /recordings/start

Initialize a new recording session (returns upload URL).

**Request**:
```json
{
  "recordingType": "vocal",
  "trackId": "uuid (optional)"
}
```

**Response**: 200 OK
```json
{
  "sessionId": "uuid",
  "uploadUrl": "https://storage.supabase.co/...",
  "uploadHeaders": {
    "Authorization": "Bearer ...",
    "Content-Type": "audio/webm"
  },
  "maxDuration": 300
}
```

### POST /recordings/{sessionId}/complete

Finalize a recording session after upload.

**Request**:
```json
{
  "duration": 125.5,
  "fileSize": 2048576,
  "metadata": {
    "device": "iPhone 14 Pro",
    "sampleRate": 44100
  }
}
```

**Response**: 200 OK
```json
{
  "recording": {
    "id": "uuid",
    "audioUrl": "https://cdn.musicverse.ai/recordings/...",
    "duration": 125.5,
    "createdAt": "2026-01-06T12:00:00Z"
  }
}
```

### POST /recordings/{recordingId}/chords

Trigger chord detection for a recording.

**Response**: 202 Accepted
```json
{
  "analysisId": "chord_12345",
  "status": "processing",
  "estimatedTime": 30
}
```

### GET /recordings/{recordingId}/chords

Get chord detection results.

**Response**: 200 OK
```json
{
  "id": "uuid",
  "status": "completed",
  "chords": [
    { "time": 0.0, "chord": "C", "duration": 2.5, "confidence": 0.95 },
    { "time": 2.5, "chord": "Am", "duration": 2.5, "confidence": 0.92 }
  ],
  "confidence": 0.94,
  "key": "C Major"
}
```

---

## Presets API

### GET /presets

Get available presets (user + system + public).

**Query Parameters**:
- `category`: Filter by category (vocal, guitar, mastering, etc.)
- `scope`: Filter by scope (user, system, public)

**Response**: 200 OK
```json
{
  "presets": [
    {
      "id": "uuid",
      "name": "Warm Vocal",
      "description": "Adds warmth and presence",
      "category": "vocal",
      "isPublic": true,
      "isSystem": false,
      "usageCount": 1250,
      "settings": {
        "mixer": { "volume": 0.8, "pan": 0.0 },
        "effects": { "reverb": { "enabled": true, "roomSize": 0.5 } }
      }
    }
  ]
}
```

### POST /presets

Create a new preset.

**Request**:
```json
{
  "name": "My Custom Vocal",
  "description": "My go-to vocal settings",
  "category": "vocal",
  "isPublic": false,
  "settings": {
    "mixer": { "volume": 0.9, "pan": -0.2 },
    "effects": { "compression": { "enabled": true, "threshold": -18 } }
  }
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "name": "My Custom Vocal",
  "category": "vocal",
  "isPublic": false,
  "createdAt": "2026-01-06T14:00:00Z"
}
```

### PUT /presets/{presetId}

Update a preset.

**Request**: Same as POST /presets

**Response**: 200 OK
```json
{
  "id": "uuid",
  "name": "My Custom Vocal (Updated)",
  "updatedAt": "2026-01-06T14:30:00Z"
}
```

### DELETE /presets/{presetId}

Delete a preset.

**Response**: 204 No Content

### POST /tracks/{trackId}/apply-preset

Apply a preset to a track.

**Request**:
```json
{
  "presetId": "uuid"
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "appliedSettings": {
    "mixer": { "volume": 0.8, "pan": 0.0 },
    "effects": { "reverb": { "enabled": true, "roomSize": 0.5 } }
  }
}
```

---

## Batch Stem Processing API

### POST /stems/batch/transcribe

Initiate batch transcription for multiple stems.

**Request**:
```json
{
  "trackId": "uuid",
  "stemIds": ["uuid1", "uuid2", "uuid3"],
  "model": "basic"
}
```

**Response**: 202 Accepted
```json
{
  "batchId": "uuid",
  "status": "processing",
  "stemsCount": 3
}
```

### GET /stems/batches/{batchId}

Get batch processing status and results.

**Response**: 200 OK
```json
{
  "id": "uuid",
  "status": "processing",
  "progress": 66,
  "results": {
    "stems": [
      { "stemId": "uuid1", "status": "success", "midiUrl": "https://..." },
      { "stemId": "uuid2", "status": "success", "midiUrl": "https://..." },
      { "stemId": "uuid3", "status": "processing", "progress": 80 }
    ],
    "summary": { "total": 3, "success": 2, "processing": 1, "failed": 0 }
  }
}
```

### POST /stems/batch/separate

Initiate batch stem separation.

**Request**:
```json
{
  "trackId": "uuid",
  "stemIds": ["uuid1", "uuid2"],
  "mode": "detailed"
}
```

**Response**: 202 Accepted
```json
{
  "batchId": "uuid",
  "status": "processing",
  "mode": "detailed"
}
```

---

## Section Replacement History API

### GET /tracks/{trackId}/replacements

Get section replacement history for a track.

**Query Parameters**:
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response**: 200 OK
```json
{
  "replacements": [
    {
      "id": "uuid",
      "sectionStart": 45.2,
      "sectionEnd": 67.8,
      "prompt": "Epic guitar solo",
      "oldContent": "base64_encoded_audio",
      "newContent": "base64_encoded_audio",
      "author": {
        "id": "uuid",
        "username": "producer_jane"
      },
      "createdAt": "2026-01-06T15:00:00Z"
    }
  ],
  "total": 23
}
```

### POST /replacements/{replacementId}/restore

Restore a previous section replacement.

**Response**: 200 OK
```json
{
  "success": true,
  "sectionStart": 45.2,
  "sectionEnd": 67.8,
  "restoredContent": "base64_encoded_audio"
}
```

---

## MIDI File API

### POST /midi/upload

Upload a MIDI file.

**Request**: multipart/form-data
```
file: (binary)
trackId: "uuid (optional)"
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "fileUrl": "https://cdn.musicverse.ai/midi/...",
  "fileName": "song.mid",
  "fileSize": 15360,
  "duration": 180.5,
  "tempo": 120,
  "timeSignature": "4/4",
  "keySignature": "C Major",
  "noteCount": 1250,
  "trackCount": 4
}
```

### GET /midi/{midiId}

Get MIDI file metadata.

**Response**: 200 OK
```json
{
  "id": "uuid",
  "fileUrl": "https://cdn.musicverse.ai/midi/...",
  "fileName": "song.mid",
  "duration": 180.5,
  "tempo": 120,
  "timeSignature": "4/4",
  "keySignature": "C Major",
  "noteCount": 1250,
  "trackCount": 4,
  "createdAt": "2026-01-06T16:00:00Z"
}
```

### GET /midi/{midiId}/download

Download MIDI file.

**Response**: 200 OK
```
Content-Type: audio/midi
Content-Disposition: attachment; filename="song.mid"
(binary data)
```

---

## Professional Dashboard API

### GET /dashboard/stats

Get user's dashboard statistics.

**Response**: 200 OK
```json
{
  "tracks": {
    "total": 47,
    "published": 12,
    "drafts": 35
  },
  "storage": {
    "used": 2048576000,
    "limit": 5368709120,
    "percentage": 38
  },
  "recordings": {
    "total": 125,
    "totalDuration": 18750
  },
  "presets": {
    "custom": 8,
    "favorite": "uuid"
  }
}
```

---

## Keyboard Shortcuts API

### GET /users/me/shortcuts

Get user's keyboard shortcuts.

**Response**: 200 OK
```json
{
  "shortcuts": {
    "studio": {
      "play_pause": { "key": " ", "ctrl": false, "shift": false },
      "save": { "key": "s", "ctrl": true, "shift": false }
    },
    "lyrics": {
      "ai_assist": { "key": "a", "ctrl": true, "shift": false }
    }
  }
}
```

### PUT /users/me/shortcuts

Update user's keyboard shortcuts.

**Request**:
```json
{
  "shortcuts": {
    "studio": {
      "play_pause": { "key": " ", "ctrl": false, "shift": false },
      "save": { "key": "s", "ctrl": true, "shift": false }
    }
  }
}
```

**Response**: 200 OK
```json
{
  "success": true
}
```

### POST /users/me/shortcuts/reset

Reset shortcuts to default.

**Response**: 200 OK
```json
{
  "shortcuts": {
    // Default shortcuts
  }
}
```

---

## WebSocket Events (Supabase Realtime)

### Lyrics Channel

**Subscribe to**: `lyric_versions:track_id={trackId}`

**Events**:
- `INSERT` - New lyric version created
- `UPDATE` - Version restored or updated

```typescript
const channel = supabase
  .channel('lyrics')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lyric_versions',
    filter: `track_id=eq.${trackId}`
  }, (payload) => {
    console.log('Lyrics updated:', payload)
  })
  .subscribe()
```

### Batch Processing Channel

**Subscribe to**: `stem_batches:id={batchId}`

**Events**:
- `UPDATE` - Batch progress updated

```typescript
const channel = supabase
  .channel('batch')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stem_batches',
    filter: `id=eq.${batchId}`
  }, (payload) => {
    console.log('Batch progress:', payload.new.progress)
  })
  .subscribe()
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request payload",
  "details": {
    "field": "content",
    "issue": "exceeds maximum length of 50000 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Resource not found",
  "resourceType": "lyric_version",
  "resourceId": "uuid"
}
```

### 429 Rate Limited
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests",
  "retryAfter": 60
}
```

### 500 Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_12345"
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /recordings/start | 10 | 1 hour |
| POST /recordings/*/chords | 20 | 1 hour |
| POST /stems/batch/* | 5 | 1 hour |
| POST /midi/upload | 30 | 1 hour |
| All other endpoints | 100 | 1 minute |

---

## Supabase RPC Functions

### rpc.get_lyric_versions(track_id UUID)

Returns all lyric versions for a track.

**Returns**: TABLE (same as GET /tracks/{trackId}/lyrics/versions)

### rpc.create_lyric_version(track_id UUID, content TEXT, change_summary TEXT)

Creates a new lyric version.

**Returns**: lyric_versions record

### rpc.restore_lyric_version(version_id UUID)

Restores a previous lyric version.

**Returns**: updated lyric_versions record

### rpc.apply_preset_to_track(track_id UUID, preset_id UUID)

Applies preset settings to a track.

**Returns**: JSON with applied settings

### rpc.get_dashboard_stats(user_id UUID)

Returns dashboard statistics for a user.

**Returns**: JSON with stats object
