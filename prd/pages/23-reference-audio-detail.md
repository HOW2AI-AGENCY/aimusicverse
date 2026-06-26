# Reference Audio Detail Page

> **Route:** `/reference/:id`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

Reference Audio Detail displays detailed information about a reference audio file used in music generation. Shows audio metadata, waveforms, usage statistics, and allows audio to be used as reference for new generations.

**Primary Use Cases:**
- View reference audio details
- See how audio is used in generations
- Use audio as reference for new generation
- Download or delete reference audio

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Back Button + Reference Name   │
├─────────────────────────────────────────┤
│ Audio Details                            │
│ ┌───────────────────────────────────┐  │
│ │ [Waveform Display]                 │  │
│ │ Large waveform with playhead        │  │
│ └───────────────────────────────────┘  │
│                                          │
│ Metadata Table                          │
│ • Duration: 2:34                       │  │
│ • Sample Rate: 44.1kHz                 │  │
│ • Bit Depth: 24-bit                     │  │
│ • File Size: 3.2 MB                    │  │
│ • Created: Jan 15, 2026                │  │
│                                          │
│ Usage Statistics                         │
│ • Used in 3 generations              │  │
│ • Last used: 2 days ago               │  │
│                                          │
│ Actions                                  │
│ [▶ Play] [Use in Generation] [Download] [Delete]│
└─────────────────────────────────────────┘
```

## Fields

| Element | Type | Notes |
|---------|------|-------|
| Waveform Display | Canvas | Large waveform with playhead |
| Duration | Text | Audio length in MM:SS |
| Sample Rate | Text | "44.1kHz" or "48kHz" |
| Bit Depth | Text | "16-bit", "24-bit", or "32-bit float" |
| File Size | Text | "3.2 MB" formatted |
| Created At | Date | "Created Jan 15, 2026" |
| Usage Count | Number | "Used in 3 generations" |
| Last Used | Date | "Last used 2 days ago" relative |
| Play Button | Button | Plays reference audio |
| Use in Generation | Button | Opens generation form with audio pre-loaded |
| Download Button | Button | Downloads audio file |
| Delete Button | Button | Deletes reference (with confirmation) |

---

## Interactions

### Page Load

**API Calls:**
- `GET /api/reference-audio/{id}` — Reference audio details
- `GET /api/reference-audio/{id}/usage` — Usage statistics

### Play Audio

**Trigger:** Click play button

**Behavior:**
1. Play reference audio via global audio player
2. Show playhead position on waveform
3. Update "Last used" timestamp

### Use in Generation

**Trigger:** Click "Use in Generation" button

**Behavior:**
1. Navigate to home page generation form
2. Pre-fill reference audio field
3. User can adjust style and generate track with audio reference

**API Call:**
- `PATCH /api/reference-audio/{id}` — Update last used timestamp

### Download Audio

**Trigger:** Click download button

**Behavior:**
1. Download audio file to device
2. File format: Original format (WAV, MP3, etc.)

### Delete Reference

**Trigger:** Click delete button

**Behavior:**
1. Show confirmation: "Delete reference audio?"
2. Check if used in any generations
3. If used: Warn "This audio is used in X generations. Delete anyway?"
4. User confirms
5. Call API: `DELETE /api/reference-audio/{id}`
6. Navigate back to Audio Hub or previous page

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Reference Audio | GET | /api/reference-audio/{id} | Page load | Audio details |
| Get Usage Stats | GET | /api/reference-audio/{id}/usage | Page load | Usage statistics |
| Update Last Used | PATCH | /api/reference-audio/{id} | Play/use action | Timestamp |
| Delete Reference | DELETE | /api/reference-audio/{id} | Delete action | Remove audio |

## Page Relationships

**From:** `/audio-hub` → Click reference audio item
**To:** `/` (Home) → Use in generation
**Back:** Previous page

## Business Rules

1. **Reference Audio Types:**
   - Vocal recordings: Singing, voice samples
   - Instrument recordings: Guitar, piano, etc.
   - Existing tracks: Can use any track as reference
   - File formats: WAV, MP3, M4A supported

2. **Usage Tracking:**
   - Generations: Count of times used in generation
   - Last used: Timestamp of last usage
   - Associated tracks: List of tracks generated from this reference

3. **Deletion Rules:**
   - Unused: Can delete immediately
   - Used: Warning shown if used in generations
   - Generations unaffected: Deleting reference doesn't break generated tracks

4. **Storage:**
   - Location: Supabase Storage (user's private bucket)
   - File size: No hard limit (practical limit: 50MB)
   - Retention: Indefinite (no auto-deletion)

---

**Batch 4 Complete!** ✅

**Next:** Key remaining pages → Onboarding, Analytics, Auth, Mobile Player
