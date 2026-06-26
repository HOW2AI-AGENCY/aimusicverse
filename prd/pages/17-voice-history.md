# Voice History Page

> **Route:** `/voices/history`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

Voice History displays timeline of voice clone training sessions. Users can view training progress, status, and results of voice model creation attempts.

**Primary Use Cases:**
- Track voice clone training history
- View training status and progress
- Access completed voice models
- Retry failed training attempts

## Layout

### Mobile Layout (Timeline)

```
┌──────────────────────────┐
│ HEADER: Back + "History" │
├──────────────────────────┤
│ Timeline                 │
│ ┌──────────────────────┐ │
│ │ Jan 20, 2026          │ │
│ │ Voice Model 1         │ │
│ │ Status: ✅ Completed  │ │
│ │ [View] [Delete]       │ │
│ ├──────────────────────┤ │
│ │ Jan 18, 2026          │ │
│ │ Voice Model 2         │ │
│ │ Status: ❌ Failed     │ │
│ │ [Retry] [Delete]      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## Fields

### History Item

| Field | Format | Notes |
|-------|--------|-------|
| Timestamp | Date | Training start date/time |
| Voice Name | Text | Name of voice model |
| Reference Audio | Text | Original audio file name |
| Status | Badge | Completed, Failed, Processing |
| Duration | Text | "Training time: 5 min" |
| Actions | Buttons | View, Retry, Delete |

---

## Interactions

### Page Load

**API Calls:**
- `GET /api/voice-clones/history?user_id={userId}` — Training history

### Retry Failed Training

**Trigger:** Click "Retry" on failed item

**Behavior:**
1. Open confirmation dialog
2. Re-submit voice clone training with same reference audio
3. Update history item status to "Processing"

### View Completed Model

**Trigger:** Click "View" on completed item

**Behavior:**
1. Navigate to Voice Library
2. Filter to show specific voice model

## API Dependencies

| API | Method | Path | Trigger |
|-----|--------|------|---------|
| Get History | GET | /api/voice-clones/history | Page load |
| Retry Training | POST | /api/voice-clones/{id}/retry | Retry action |

## Page Relationships

**From:** `/voices` → Click "View History"
**To:** `/voices` → Click "View" on completed model

---

**Batch 3 Complete!** ✅

**Next:** [Studio Hub Page](./18-studio-hub.md) → Batch 4: Studio Pages (Critical)
