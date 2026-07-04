# Voice Library Page

> **Route:** `/voices`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

Voice Library displays user's voice clone models. Users can browse their custom voices, see usage statistics, and manage voice clones. Each voice model is created from reference audio and can be used in music generation.

**Primary Use Cases:**

- Browse custom voice models
- View voice usage statistics
- Manage voice clones (rename, delete)
- Select voice for generation

## Layout

### Mobile Layout (Grid)

```
┌──────────────────────────┐
│ HEADER: Back + "Voices"  │
├──────────────────────────┤
│ [+ Create Voice] button   │
├──────────────────────────┤
│ Voices Grid (2 columns)  │
│ ┌──────────┬──────────┐ │
│ │[Avatar]  │[Avatar]  │ │
│ │ Voice 1  │ Voice 2  │ │
│ │ Used 12x │ Used 8x  │ │
│ └──────────┴──────────┘ │
└──────────────────────────┘
```

## Fields

### Voice Card

| Field       | Format            | Notes                     |
| ----------- | ----------------- | ------------------------- |
| Avatar      | Image (100×100px) | Voice model visualization |
| Name        | Text (H3)         | Voice model name          |
| Description | Text (truncated)  | Voice characteristics     |
| Usage Count | Badge             | "Used 12 times"           |
| Created At  | Date              | "Created Jan 15, 2026"    |
| Actions     | Buttons           | Select, Rename, Delete    |

---

## Interactions

### Page Load

**API Calls:**

- `GET /api/voice-clones?user_id={userId}` — User's voice models

### Create Voice

**Trigger:** Click "+ Create Voice"

**Behavior:**

1. Open voice creation dialog (from reference audio)
2. Upload reference audio file
3. Voice model trained (async process)
4. On completion: Added to library

### Select Voice for Generation

**Trigger:** Click "Select" button

**Behavior:**

1. Voice ID stored in state
2. Navigate to generation form
3. Voice pre-selected in custom voice dropdown

### Delete Voice

**Trigger:** Click "Delete" button

**Behavior:**

1. Show confirmation dialog
2. Call API to delete voice model
3. Remove from library

## API Dependencies

| API          | Method | Path                               | Trigger       |
| ------------ | ------ | ---------------------------------- | ------------- |
| Get Voices   | GET    | /api/voice-clones?user_id={userId} | Page load     |
| Create Voice | POST   | /api/voice-clones/create           | Create dialog |
| Delete Voice | DELETE | /api/voice-clones/{id}             | Delete action |

## Page Relationships

**From:** `/` (Home) → Custom voice dropdown
**To:** Generation form with voice pre-selected

---

**Next:** [Voice History Page](./17-voice-history.md)
