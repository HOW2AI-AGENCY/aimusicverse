# Studio Hub Page

> **Route:** `/studio-v2`  
> **Module:** Studio V2  
> **Generated:** 2026-06-26

## Overview

Studio Hub is the main entry point for Studio V2, displaying all studio projects. Users can create new projects, open existing ones, and delete unwanted projects. Features project cards with track counts, status indicators, and recently opened sorting.

**Primary Use Cases:**

- Browse all studio projects
- Create new studio project
- Open project in Unified Studio
- Delete unwanted projects
- Track project activity via timestamps

## Layout

### Mobile Layout (List)

```
┌──────────────────────────┐
│ HEADER: "Studio v2"      │
│ [+ New Project] button    │
├──────────────────────────┤
│ Projects List            │
│ ┌──────────────────────┐ │
│ │ Project Name          │ │
│ │ Description • 5 tracks│ │
│ │ Opened 2h ago         │ │
│ │ [Open] [Delete]       │ │
│ ├──────────────────────┤ │
│ │ Project Name          │ │
│ │ Description • 3 tracks│ │
│ │ Opened 1d ago         │ │
│ │ [Open] [Delete]       │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Grid)

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Studio v2" [+ New Project]            │
├─────────────────────────────────────────────────┤
│ Projects Grid (3 columns)                         │
│ ┌──────────────┬──────────────┬──────────────┐  │
│ │ Project 1    │ Project 2    │ Project 3    │  │
│ │ Desc • 5 tr  │ Desc • 3 tr  │ Desc • 8 tr  │  │
│ │ Opened 2h    │ Opened 1d    │ Opened 5h    │  │
│ │ [Open] [Del] │ [Open] [Del] │ [Open] [Del] │  │
│ └──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────┘
```

## Fields

### Project Card

| Field       | Format           | Notes                                |
| ----------- | ---------------- | ------------------------------------ |
| Name        | Text (H3)        | Project name                         |
| Description | Text (truncated) | Project description (optional)       |
| Track Count | Badge            | "5 tracks"                           |
| BPM         | Text (optional)  | Project tempo (if set)               |
| Status      | Badge            | Draft, In Progress, Completed        |
| Last Opened | Date             | "Opened 2 hours ago" relative format |
| Actions     | Buttons          | Open, Delete (3-dot menu)            |

---

## Interactions

### Page Load

**Behavior:**

1. Fetch studio projects via API
2. Setup Telegram Back Button (returns to home)
3. Sort projects by `opened_at` (most recently opened first)
4. Render project grid with loading skeletons

**API Calls:**

- `GET /api/studio-projects` — All user's studio projects

### Create New Project

**Trigger:** Click "+ New Project" button

**Behavior:**

1. Navigate to `/studio-v2/new`
2. Open new project creation interface
3. User fills project details
4. On save: Create project and navigate to Unified Studio

### Open Project

**Trigger:** Click "Open" button on project card

**Behavior:**

1. Navigate to `/studio-v2/project/{projectId}`
2. Load project in Unified Studio
3. Update `opened_at` timestamp

**API Call:**

- `PATCH /api/studio-projects/{id}` — Update opened_at timestamp

### Delete Project

**Trigger:** Click "Delete" button

**Behavior:**

1. Show confirmation dialog: "Delete project '{name}'?"
2. User confirms
3. Call API: `DELETE /api/studio-projects/{id}`
4. On success: Remove from list, show "Project deleted!" toast

**API Call:**

- `DELETE /api/studio-projects/{id}` — Delete project

### Empty State

**No Projects:**

- Display: "No projects yet"
- Illustration: Empty state graphic
- CTA: "Create your first project" button

## API Dependencies

| API              | Method | Path                      | Trigger       | Notes                  |
| ---------------- | ------ | ------------------------- | ------------- | ---------------------- |
| Get Projects     | GET    | /api/studio-projects      | Page load     | User's studio projects |
| Create Project   | POST   | /api/studio-projects      | New project   | Creates new project    |
| Update Opened At | PATCH  | /api/studio-projects/{id} | Open action   | Updates timestamp      |
| Delete Project   | DELETE | /api/studio-projects/{id} | Delete action | Deletes project        |

## Page Relationships

**From:**

- `/` (Home) → Click "Studio" in navigation
- `/library` → Click "Edit in Studio" on track
- `/projects` → Click "Open in Studio" on project
- Deep link → `startapp=studio` or `startapp=studio-{projectId}`

**To:**

- `/studio-v2/new` → Create new project
- `/studio-v2/project/{projectId}` → Open existing project
- `/studio-v2/track/{trackId}` → Create project from track
- `/` (Home) → Back button

**Data Coupling:**

- Projects list: Refreshed when project created/deleted
- Opened timestamp: Updated when project opened
- Sort order: By `opened_at DESC` (most recent first)

## Business Rules

1. **Project Types:**
   - From track: Created from existing track (imports track audio)
   - From scratch: Created with manual audio upload
   - Limits: No hard limit on projects per user

2. **Project Deletion:**
   - Confirmation required: Always show dialog
   - Tracks unaffected: Deleting project doesn't delete associated tracks
   - Recovery: 30-day grace period (soft delete)

3. **Project Status Flow:**
   - Draft → In Progress → Completed
   - Manual transitions: User advances status
   - Auto-completed: Status updates when all tracks processed

4. **Sort Order:**
   - Default: `opened_at DESC` (most recently opened)
   - Fallback: `created_at DESC` for never-opened projects
   - Persistence: Sort order not saved (always by opened_at)

5. **Track Association:**
   - Project tracks: Stored in `studio_project.tracks` array
   - Track references: Tracks can be in multiple projects
   - Audio files: Stored separately, referenced by track ID

6. **Recently Opened:**
   - Timestamp: Updated every time project is opened
   - Purpose: Quick access to active projects
   - Display: "Opened 2 hours ago" relative format

---

**Next:** [Unified Studio Page](./19-unified-studio.md) → Core studio interface
