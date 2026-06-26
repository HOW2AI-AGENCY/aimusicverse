# New Studio Project Page

> **Route:** `/studio-v2/new`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

New Studio Project Page allows users to create a new studio project from scratch or by importing existing tracks. Features project setup form with metadata entry and track selection interface.

**Primary Use Cases:**
- Create new empty studio project
- Import existing track as project base
- Set project metadata (name, BPM, description)
- Select initial tracks to include

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Back Button + "New Project"     │
├─────────────────────────────────────────┤
│ Project Setup Form                        │
│ ┌───────────────────────────────────┐  │
│ │ Project Name                         │  │
│ │ [Text input]                         │  │
│ ├───────────────────────────────────┤  │
│ │ Description (optional)               │  │
│ │ [Textarea]                           │  │
│ ├───────────────────────────────────┤  │
│ │ BPM (optional)                       │  │
│ │ [Number input: 60-200]              │  │
│ ├───────────────────────────────────┤  │
│ │ Initial Tracks                       │  │
│ │ [+ Select from Library]             │  │
│ │ Track 1       [Remove]              │  │
│ │ Track 2       [Remove]              │  │
│ ├───────────────────────────────────┤  │
│ │ [Cancel]              [Create]      │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Project Name | Text | Yes | Max 100 chars | Project identifier |
| Description | Textarea | No | Max 500 chars | Optional description |
| BPM | Number | No | 60-200 | Tempo (optional) |
| Initial Tracks | List | No | Max 10 | Tracks to include initially |

---

## Interactions

### Page Load

**Behavior:**
1. Setup Telegram Back Button (returns to studio hub)
2. Initialize empty form
3. Setup track selection state

### Create Project

**Trigger:** Click "Create" button

**Behavior:**
1. Validate required fields (project name)
2. Call API: `POST /api/studio-projects`
3. On success: Navigate to `/studio-v2/project/{newProjectId}`

### Add Tracks from Library

**Trigger:** Click "+ Select from Library"

**Behavior:**
1. Open track selector dialog
2. User selects tracks from library
3. Selected tracks added to "Initial Tracks" list
4. Can remove before project creation

## API Dependencies

| API | Method | Path | Trigger |
|-----|--------|------|---------|
| Create Project | POST | /api/studio-projects | Create button |

## Page Relationships

**From:** `/studio-v2` → Click "+ New Project"
**To:** `/studio-v2/project/{newProjectId}` → After creation

---
