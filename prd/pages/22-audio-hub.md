# Audio Hub Page

> **Route:** `/audio-hub`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

Audio Hub is the centralized audio library for managing all user recordings. Features recording interface, file upload, and organization of audio files by type (vocal, guitar, other). Integrates with Studio V2 for seamless track import.

**Primary Use Cases:**
- Browse all audio recordings
- Record new audio (vocal, guitar, other)
- Upload audio files from device
- Import recordings into studio projects
- Organize audio by type and date

## Layout

### Mobile Layout (Tabs + List)

```
┌──────────────────────────┐
│ HEADER: Back + "Audio Hub"│
├──────────────────────────┤
│ Tabs: [All][Vocal][Guitar][Other]│
├──────────────────────────┤
│ [+ Record] [+ Upload]    │
├──────────────────────────┤
│ Audio List               │
│ ┌──────────────────────┐ │
│ │ [Waveform] Name      │ │
│ │ Type • Duration • Date│ │
│ │ [▶] [Edit] [Import]  │ │
│ ├──────────────────────┤ │
│ │ [Waveform] Name      │ │
│ │ Type • Duration • Date│ │
│ │ [▶] [Edit] [Import]  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## Fields

### Tab Navigation

| Tab | Filter | Description |
|-----|--------|-------------|
| All | No filter | All recordings |
| Vocal | `type='vocal'` | Vocal recordings only |
| Guitar | `type='guitar'` | Guitar recordings only |
| Other | `type='other'` | Other recordings |

### Audio Item

| Field | Format | Notes |
|-------|--------|-------|
| Waveform | Canvas | Mini waveform visualization |
| Name | Text | Recording filename |
| Type | Badge | Vocal, Guitar, Other |
| Duration | Text (MM:SS) | Audio length |
| File Size | Text | "2.4 MB" |
| Created At | Date | "Jan 15, 2026" |
| Play Button | Icon | Plays audio |
| Edit Button | Icon | Open in editor (if applicable) |
| Import Button | Icon | Import into studio project |
| Delete Button | Icon | Delete recording |

---

## Interactions

### Page Load

**API Calls:**
- `GET /api/recordings?user_id={userId}` — All user recordings
- `GET /api/recordings/stats` — Recording statistics

### Record Audio

**Trigger:** Click "+ Record" button

**Behavior:**
1. Open recording dialog:
   - Select recording type (vocal, guitar, other)
   - Configure format (sample rate, bit depth)
2. Start recording via device microphone
3. Show recording controls (stop, pause, levels)
4. On stop: Auto-save to Audio Hub
5. Show "Recording saved!" toast

### Upload Audio File

**Trigger:** Click "+ Upload" button

**Behavior:**
1. Open file picker (audio files only)
2. User selects file(s)
3. Upload progress indicator
4. On complete: Save to Audio Hub
5. Show "File uploaded!" toast

**API Call:**
- `POST /api/audio-hub/upload` — Upload and save audio file

### Import to Studio Project

**Trigger:** Click "Import" button on audio item

**Behavior:**
1. Open project selector dialog
2. User selects existing or new project
3. Call API to link audio with project
4. Audio appears in project's track list
5. Show "Imported to project!" toast

**API Call:**
- `POST /api/studio-projects/{id}/import-audio` — Import audio into project

### Delete Recording

**Trigger:** Click "Delete" button

**Behavior:**
1. Show confirmation: "Delete recording?"
2. User confirms
3. Call API: `DELETE /api/recordings/{id}`
4. Remove from list, show "Deleted!" toast

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Recordings | GET | /api/recordings?user_id={userId} | Page load | User's recordings |
| Upload Audio | POST | /api/audio-hub/upload | Upload action | Upload file |
| Save Recording | POST | /api/recordings/save | Record stop | Save from mic |
| Import to Project | POST | /api/studio-projects/{id}/import-audio | Import action | Link audio |
| Delete Recording | DELETE | /api/recordings/{id} | Delete action | Remove file |

## Page Relationships

**From:**
- `/music-lab` → From various recording tools
- `/studio-v2` → Import audio into project
- `/library` → Access audio library

**To:**
- `/studio-v2/project/{id}` → Import audio
- `/guitar-studio` → Guitar-specific editing
- Back button → Previous page

## Business Rules

1. **Recording Types:**
   - Vocal: Singing, voice-overs, a cappella
   - Guitar: Acoustic, electric guitar performances
   - Other: Instruments, sound effects, ambient audio

2. **File Formats:**
   - Upload: WAV, MP3, M4A supported
   - Export: WAV (lossless) or MP3 (compressed)
   - Max size: 50MB per file

3. **Storage:**
   - Location: Supabase Storage (user's private bucket)
   - Organization: By user ID and recording type
   - Retention: Indefinite (no auto-deletion)

4. **Import to Projects:**
   - Any recording: Can be imported to any project
   - Duplicates: Same recording can be in multiple projects
   - Reference: Original preserved in Audio Hub

---

**Next:** [Reference Audio Detail Page](./23-reference-audio-detail.md) → Batch 4 complete
