# Project Detail Page

> **Route:** `/projects/:id`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

The Project Detail Page provides comprehensive management for a single music project. Users can view project info, manage tracks (add, reorder, generate, edit), access lyrics, configure settings, publish the project, and share with others. The page features tabbed navigation, drag-and-drop track reordering, AI-powered generation from plans, and Telegram Main Button integration for quick actions.

**Primary Use Cases:**

- View project details and track list
- Add existing tracks or generate new ones
- Reorder tracks via drag-and-drop
- Edit project settings (title, type, cover, visibility)
- Generate tracks from lyric plans
- Publish project to public library
- Share project via Telegram

## Layout

### Mobile Layout (Tabs + Telegram Main Button)

```
┌──────────────────────────┐
│ HEADER: Back + Title     │
├──────────────────────────┤
│ Project Header           │
│ [Cover] Title [Badge]    │
│ Type • Status • Tracks   │
├──────────────────────────┤
│ Tabs: [Tracks|Lyrics|AI] │
├──────────────────────────┤
│ Tab Content              │
│ Tracks Tab:              │
│ ┌──────────────────────┐ │
│ │ [+ Add Track]        │ │
│ ├──────────────────────┤ │
│ │ [Drag Handle]        │ │
│ │ [Track 1]  [Play]    │ │
│ │ Title • 2:34         │ │
│ ├──────────────────────┤ │
│ │ [Drag Handle]        │ │
│ │ [Track 2]  [Play]    │ │
│ │ Title • 3:12         │ │
│ └──────────────────────┘ │
│                          │
│ Unlinked Tracks (if any)│
│ ┌──────────────────────┐ │
│ │ Tracks not in project│ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Telegram Main Button     │
│ [ADD TRACK] or           │
│ [GENERATE TRACK] or      │
│ [PUBLISH]                │
└──────────────────────────┘
```

### Desktop Layout (Two Columns)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Back Button + Project Title                    │
├──────────────────────────┬──────────────────────────────┤
│ Left Column (Main)        │ Right Column (Sidebar)       │
│ ─────────────────────────│ ──────────────────────────── │
│ Project Header            │ Project Details Card         │
│ [Cover] Title [Type]      │ • Created date               │
│ Status • Tracks           │ • Total duration             │
│                           │ • Completion %               │
│ Tabs: [Tracks|Lyrics|AI] │ • Readiness indicator        │
│ ─────────────────────────│                               │
│ Track List (Drag-Drop)    │ Quick Actions Grid            │
│ [+ Add Existing Track]    │ [Generate] [Settings]        │
│ ┌────────────────────────│ [Share] [Publish]             │
│ │ ☰ Track 1     [Play]  │                               │
│ │ Title • 2:34 • Status│ Share Card                   │
│ ├────────────────────────│ [Telegram] [Copy Link]       │
│ │ ☰ Track 2     [Play]  │                               │
│ │ Title • 3:12 • Status│ Unlinked Tracks (if any)      │
│ └────────────────────────│ Available tracks to add      │
│                           │                               │
│ Unlinked Tracks           │ AI Suggestions (if in AI tab)│
│ [Link to Project]        │ Generate missing tracks      │
└──────────────────────────┴──────────────────────────────┘
```

## Fields

### Project Header

| Field           | Type              | Notes                                              |
| --------------- | ----------------- | -------------------------------------------------- |
| Cover Art       | Image (200×200px) | Project cover, clickable to change                 |
| Title           | Text (H1)         | Project name                                       |
| Type Badge      | Badge             | Single, EP, Album, Compilation                     |
| Status Badge    | Badge             | Draft, In Progress, Completed, Released, Published |
| Track Count     | Text              | "5 tracks"                                         |
| Settings Button | Icon              | Opens project settings sheet                       |

### Tabs

| Tab    | Content                                 | Default |
| ------ | --------------------------------------- | ------- |
| Tracks | Track list with drag-drop reordering    | Yes     |
| Lyrics | Lyrics plans and drafts                 | No      |
| AI     | AI-powered track generation suggestions | No      |

### Tracks Tab

| Element          | Type             | Notes                                         |
| ---------------- | ---------------- | --------------------------------------------- |
| Add Track Button | Button           | Opens add track dialog (existing or generate) |
| Track Items      | List (drag-drop) | Each track with controls                      |

**Track Item Fields:**

| Field        | Type                | Notes                                  |
| ------------ | ------------------- | -------------------------------------- |
| Drag Handle  | Icon                | ☰ for reordering                      |
| Cover Art    | Thumbnail (48×48px) | Track cover art                        |
| Title        | Text                | Track name                             |
| Duration     | Text (MM:SS)        | Audio length                           |
| Status Badge | Badge               | Draft, Processing, Completed, Failed   |
| Play Button  | Icon                | Plays track in global player           |
| Actions Menu | Icon (3-dot)        | Edit, Generate, Remove, Open in Studio |
| Move Handle  | Icon (arrows)       | Move up/down in list                   |

### Project Details Card (Right Sidebar)

| Field          | Type         | Notes                               |
| -------------- | ------------ | ----------------------------------- |
| Created At     | Date         | "Created Jan 15, 2026"              |
| Total Duration | Text (MM:SS) | Sum of all track durations          |
| Completion %   | Progress bar | "60% complete" (3 of 5 tracks done) |
| Readiness      | Indicator    | Shows if ready to publish           |
| Last Updated   | Date         | "Last updated 2 hours ago"          |

### Quick Actions Grid

| Action         | Icon     | Description                  | Condition            |
| -------------- | -------- | ---------------------------- | -------------------- |
| Generate Track | Sparkles | Generate new track from plan | Has unlinked lyrics  |
| Settings       | Settings | Edit project settings        | Always               |
| Share          | Share2   | Share project via Telegram   | Always               |
| Publish        | Rocket   | Publish to public library    | All tracks completed |

### Share Card

| Element         | Type   | Notes                         |
| --------------- | ------ | ----------------------------- |
| Telegram Button | Button | Opens Telegram share dialog   |
| Copy Link       | Button | Copies deep link to clipboard |
| QR Code         | Image  | QR code for easy sharing      |

### Lyrics Tab

| Element         | Type   | Notes                                  |
| --------------- | ------ | -------------------------------------- |
| Lyrics Plans    | List   | Unlinked lyrics that can become tracks |
| Generate Button | Button | Generate track from selected lyrics    |
| Add Lyrics      | Button | Create new lyrics draft                |

### AI Tab

| Element        | Type         | Notes                                         |
| -------------- | ------------ | --------------------------------------------- |
| AI Suggestions | List         | Suggested tracks to generate based on project |
| Generate All   | Button       | Generate all suggested tracks at once         |
| Progress       | Progress bar | Shows generation progress for batch           |

---

## Interactions

### Page Load

**Behavior:**

1. Extract `projectId` from URL params
2. Fetch project data via `useProjectDetailData()` hook
3. Fetch project tracks
4. Fetch unlinked tracks (available to add)
5. Check project readiness for publishing
6. Setup Telegram Back Button (returns to `/projects`)
7. Setup Telegram Main Button (dynamic based on state)
8. Render project with loading skeletons

**API Calls:**

- `GET /api/projects/{id}` — Project details
- `GET /api/projects/{id}/tracks` — Project tracks
- `GET /api/tracks?unlinked=true&user_id={userId}` — Unlinked tracks
- `GET /api/lyrics?project_id={id}` — Lyrics plans

### Track Reordering (Drag-Drop)

**Trigger:** Drag track handle and drop in new position

**Behavior:**

1. Update local track order immediately (optimistic)
2. Call API: `PATCH /api/projects/{id}/reorder-tracks`
3. On success: Show "Track order updated" toast
4. On error: Revert to original order

**API Request:**

```typescript
PATCH /api/projects/{id}/reorder-tracks
{
  track_ids: string[];  // New order
}
```

### Add Existing Track

**Trigger:** Click "+ Add Track" button → "Add Existing Track"

**Behavior:**

1. Open add track dialog:
   - List of unlinked tracks (tracks not in any project)
   - Search/filter options
2. User selects track(s)
3. Call API: `POST /api/projects/{id}/tracks`
4. On success:
   - Add track to project
   - Refresh track list
   - Show "Track added!" toast
5. On error: Show error message

**API Request:**

```typescript
POST / api / projects / { id } / tracks;
{
  track_id: string;
  position: number; // Optional, defaults to end
}
```

### Generate New Track

**Trigger:** Click "+ Add Track" → "Generate New Track"

**Behavior:**

1. Open generation form (same as home page)
2. Pre-fill project association (if saving to project)
3. User fills generation form
4. On submit: Generate track via Suno API
5. On completion: Ask to add to project
6. If yes: Add track to project

### Track Actions

**Play Track:**

- Trigger: Click play button on track
- Behavior: Start global audio player

**Edit Track:**

- Trigger: Click "Edit" in track actions
- Behavior: Navigate to `/studio-v2/track/{trackId}`

**Generate Track (from Plan):**

- Trigger: Click "Generate" on draft track (from lyrics plan)
- Behavior: Open generation form with lyrics pre-filled

**Remove Track:**

- Trigger: Click "Remove" in track actions
- Behavior: Show confirmation → Unlink track from project (not deleted)

**Open in Studio:**

- Trigger: Click "Open in Studio"
- Behavior: Navigate to `/studio-v2/track/{trackId}`

### Project Settings

**Trigger:** Click settings icon in project header

**Behavior:**

1. Open project settings sheet:
   - Title (text input)
   - Type (select: single/EP/album/compilation)
   - Cover image (upload)
   - Visibility toggle (public/private)
   - Description (textarea)
2. User edits fields
3. Click "Save"
4. Call API: `PATCH /api/projects/{id}`
5. On success: Update project, show "Settings saved!" toast
6. On error: Show error message

### Publish Project

**Trigger:** Click "Publish" button (when all tracks completed)

**Behavior:**

1. Open publish dialog:
   - Confirm project details
   - Select visibility (public/private)
   - Add description (optional)
2. User confirms
3. Call API: `POST /api/projects/{id}/publish`
4. On success:
   - Update project status to "Published"
   - Show "Project published!" toast
   - Enable share features
5. On error: Show error message

**Publishing Requirements:**

- All tracks must be completed (not draft or processing)
- At least 1 track required
- Project title required
- Cover image required (can be auto-generated)

### Share Project

**Trigger:** Click "Share" button or share icon

**Behavior:**

1. Generate deep link: `t.me/AIMusicVerseBot/app?startapp=project={id}`
2. Open Telegram share dialog via `useTelegram()`
3. Pre-fill message: "Check out my project '{title}' on MusicVerse AI!"
4. User selects contact(s) to share
5. On success: Show "Project shared!" toast

**Copy Link:**

- Trigger: Click "Copy Link" in share card
- Behavior: Copy deep link to clipboard, show "Link copied!" toast

### Telegram Main Button (Dynamic)

The Telegram Main Button changes based on project state:

| State            | Button Text          | Action                     |
| ---------------- | -------------------- | -------------------------- |
| Ready to publish | "ОПУБЛИКОВАТЬ"       | Opens publish dialog       |
| Has draft tracks | "СГЕНЕРИРОВАТЬ ТРЕК" | Generate first draft track |
| Normal           | "ДОБАВИТЬ ТРЕК"      | Opens add track dialog     |

**Trigger:** Click Telegram Main Button

**Behavior:**

1. Execute action based on current state (see table above)
2. Haptic feedback (medium impact)
3. Show appropriate dialog

### Tab Switching

**Trigger:** Click tab trigger (Tracks, Lyrics, AI)

**Behavior:**

1. Update active tab state
2. Switch content display
3. Haptic feedback (light impact)

### Lyrics Tab - Generate from Plan

**Trigger:** Click "Generate" on lyrics plan card

**Behavior:**

1. Open generation form with lyrics pre-filled
2. Set project association to current project
3. User adjusts style/settings
4. On submit: Generate track
5. On completion: Auto-add to project

### AI Tab - Generate All

**Trigger:** Click "Generate All" button (AI tab)

**Behavior:**

1. Show confirmation: "Generate all suggested tracks? This will use X credits."
2. User confirms
3. Iterate through all suggested tracks:
   - Submit generation for each
   - Show progress for each
   - Add to project as they complete
4. Show "X tracks generated!" toast on completion

### Unlinked Tracks Section

**Trigger:** View unlinked tracks (available tracks not in project)

**Behavior:**

1. Display list of unlinked tracks
2. Click "Add to Project" button on track
3. Call API: `POST /api/projects/{id}/tracks`
4. Remove from unlinked list
5. Add to project track list
6. Show "Track added!" toast

## API Dependencies

| API                       | Method | Path                                | Trigger         | Notes                     |
| ------------------------- | ------ | ----------------------------------- | --------------- | ------------------------- |
| Get Project               | GET    | /api/projects/{id}                  | Page load       | Project details           |
| Get Project Tracks        | GET    | /api/projects/{id}/tracks           | Page load       | All tracks in project     |
| Get Unlinked Tracks       | GET    | /api/tracks?unlinked=true           | Page load       | Available tracks to add   |
| Update Project            | PATCH  | /api/projects/{id}                  | Settings save   | Update title, type, cover |
| Add Track to Project      | POST   | /api/projects/{id}/tracks           | Add track       | Link existing track       |
| Remove Track from Project | DELETE | /api/projects/{id}/tracks/{trackId} | Remove track    | Unlink track (not delete) |
| Reorder Tracks            | PATCH  | /api/projects/{id}/reorder-tracks   | Drag-drop       | Update track order        |
| Publish Project           | POST   | /api/projects/{id}/publish          | Publish action  | Make public               |
| Generate from Plan        | POST   | /api/generation/generate            | Generate action | Create track from lyrics  |
| Get Lyrics Plans          | GET    | /api/lyrics?project_id={id}         | Lyrics tab load | Unlinked lyrics           |

## Page Relationships

**From:**

- `/projects` → Click project card
- `/library` → Click "Add to Project" on track
- `/studio-v2` → Click "Save to Project" after editing
- Deep link → `t.me/AIMusicVerseBot/app?startapp=project={id}` opens project

**To:**

- `/studio-v2/track/{trackId}` → Click "Edit in Studio" on track
- `/projects` → Click back button or Telegram back button
- `/lyrics-studio` → Click lyrics in Lyrics tab

**Data Coupling:**

- Project data: Refreshed when tracks added/removed
- Track list: Updates in real-time when generation completes
- Unlinked tracks: Fetched from global track pool (excludes tracks in any project)
- Lyrics plans: Linked to project but not yet generated

## Business Rules

1. **Project Type Constraints:**
   - Single: Max 2 tracks
   - EP: Max 6 tracks
   - Album: No limit (typical 10-15)
   - Compilation: No limit

2. **Track Addition Rules:**
   - Existing tracks: Can add from unlinked pool
   - New tracks: Generate via Suno API
   - From lyrics: Generate using lyrics as base
   - Duplicate tracks: Same track can't be in multiple projects

3. **Track Reordering:**
   - Drag-drop: Desktop and mobile (with handle)
   - Position: 1-indexed (first track = position 1)
   - Persistence: Saved immediately to database
   - Optimistic: UI updates before API confirmation

4. **Publishing Requirements:**
   - All tracks completed: No draft or processing tracks
   - Minimum tracks: At least 1 track
   - Title required: Cannot publish with empty title
   - Cover image: Can be auto-generated (first track cover or default)

5. **Project Visibility:**
   - Private: Only owner can view
   - Public: Visible to all users (in browse, search)
   - Unpublishing: Can unpublish (becomes private again)
   - Public tracks: Individual tracks can be public even if project is private

6. **Lyrics Plans:**
   - Unlinked lyrics: Lyrics not yet generated into tracks
   - Generation: Can generate track from lyrics plan
   - Auto-link: Generated track auto-linked to project
   - Multiple versions: Can regenerate from same lyrics (creates new track)

7. **AI Suggestions:**
   - Based on project type: EP suggests 4-6 tracks, Album suggests 10-12
   - Genre consistency: Suggests tracks matching project's genre
   - Gap analysis: Identifies missing track types (intro, outro, bridge)
   - Batch generation: Can generate all suggested tracks at once

8. **Track Status Flow:**
   - Draft → Processing → Completed → Failed
   - From lyrics: Starts as draft, moves to processing on generation
   - Failed tracks: Can regenerate or remove from project
   - Completed: Can edit in studio, regenerate versions

9. **Project Deletion:**
   - Draft projects: Immediate deletion
   - Projects with published tracks: Cannot delete (preserve content)
   - Admin override: Admins can delete any project
   - Confirmation: Always show dialog before delete

10. **Share Functionality:**
    - Deep link: `startapp=project={id}` format
    - Public projects: Anyone with link can view
    - Private projects: Link only works for project owner
    - Expiry: No expiry (links work indefinitely)

11. **Mobile Optimizations:**
    - Drag-drop: Touch handle for reordering
    - Telegram Main Button: Context-aware action
    - Haptic feedback: On all actions
    - Safe areas: Padding for notch/island
    - Swipe actions: Swipe track left for quick actions

12. **Unlinked Tracks:**
    - Definition: Tracks not associated with any project
    - Source: Directly generated without project, or removed from project
    - Display: Shown in separate section
    - Actions: Add to project, delete, keep unlinked

---

**Batch 1 Complete!** ✅

**Next:** [Artists Page](../pages/11-artists.md) → Batch 2: Content Discovery Pages
