# Projects Page

> **Route:** `/projects`  
> **Module:** Projects & Creativity  
> **Generated:** 2026-06-26

## Overview

The Projects Page (also called "My Content" or "Мой контент") is a centralized hub for managing a user's creative projects and lyrics. It provides tabbed navigation between Projects and Lyrics sections, with drag-and-drop reordering, project preview (desktop), and quick actions. The page serves as the main entry point for organizing and accessing all creative work.

**Primary Use Cases:**

- Browse and manage all projects (albums, EPs, singles)
- Access and manage lyrics drafts
- Quick preview projects (desktop master-detail layout)
- Navigate to project details
- Create new projects or lyrics

## Layout

### Mobile Layout (Single Column with Tabs)

```
┌──────────────────────────┐
│ HEADER: Back + Title     │
├──────────────────────────┤
│ Tabs: [Projects|Lyrics]  │
├──────────────────────────┤
│ Tab Content              │
│ Projects Tab:            │
│ ┌──────────────────────┐ │
│ │ Create New Project   │ │
│ ├──────────────────────┤ │
│ │ [Project Card 1]     │ │
│ │ Status • 5 tracks    │ │
│ ├──────────────────────┤ │
│ │ [Project Card 2]     │ │
│ │ Status • 3 tracks    │ │
│ └──────────────────────┘ │
│                          │
│ Lyrics Tab:             │
│ ┌──────────────────────┐ │
│ │ New Lyric Draft      │ │
│ ├──────────────────────┤ │
│ │ [Lyric Card 1]       │ │
│ │ Title • 2 days ago   │ │
│ ├──────────────────────┤ │
│ │ [Lyric Card 2]       │ │
│ │ Title • 5 days ago   │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Master-Detail with Sidebar)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: "Мой контент"                                  │
├──────────────────────────┬──────────────────────────────┤
│ Projects List             │ Project Preview Panel        │
│ (Left Column)            │ (Right Column)               │
│ ─────────────────────    │ ──────────────────────────── │
│ [Create New Project]     │ Project Details              │
│ ┌──────────────────────┐ │ Title: My Album             │
│ │ Project Card 1       │ │ Type: Album                 │
│ │ Status • 5 tracks    │ │ Status: In Progress          │
│ │ [Click to preview]   │ │ Track List (5 tracks)        │
│ ├──────────────────────┤ │ 1. Track One                │
│ │ Project Card 2       │ │ 2. Track Two                │
│ │ Status • 3 tracks    │ │ 3. Track Three              │
│ │ [Click to preview]   │ │ ...                          │
│ └──────────────────────┘ │                              │
│                          │ [Actions]                    │
│                          │ • Open Full Details          │
│                          │ • Edit Project               │
│                          │ • Share                      │
│ ─────────────────────────────────────────────────────── │
└──────────────────────────┴──────────────────────────────┘
```

## Fields

### Tab Navigation

| Tab      | Content                                      | Default |
| -------- | -------------------------------------------- | ------- |
| Projects | User's music projects (albums, EPs, singles) | Yes     |
| Lyrics   | User's lyrics drafts and notes               | No      |

### Projects Tab

| Element            | Type        | Notes                          |
| ------------------ | ----------- | ------------------------------ |
| Create New Project | Button/Card | Opens new project dialog       |
| Project Cards      | List/Grid   | Displays all user projects     |
| Filter/Sort        | Controls    | Filter by status, sort by date |

**Project Card Fields:**

| Field         | Format            | Notes                                              |
| ------------- | ----------------- | -------------------------------------------------- |
| Cover Art     | Image (200×200px) | Project cover or first track cover                 |
| Title         | Text (H3)         | Project name                                       |
| Type          | Badge             | Single, EP, Album, Compilation                     |
| Status        | Badge             | Draft, In Progress, Completed, Released, Published |
| Track Count   | Text              | "5 tracks"                                         |
| Last Updated  | Date              | "2 days ago" relative format                       |
| Quick Actions | Icons             | Edit, Share, Delete (3-dot menu)                   |

### Lyrics Tab

| Element         | Type        | Notes                      |
| --------------- | ----------- | -------------------------- |
| New Lyric Draft | Button/Card | Creates new lyrics draft   |
| Lyrics Cards    | List        | Displays all lyrics drafts |

**Lyrics Card Fields:**

| Field         | Format           | Notes                        |
| ------------- | ---------------- | ---------------------------- |
| Title         | Text (H3)        | Lyrics title                 |
| Preview       | Text (truncated) | First 3 lines of lyrics      |
| Tags          | Chips            | Genre, mood tags             |
| Created At    | Date             | "2 days ago" relative format |
| Quick Actions | Icons            | Edit, Delete, Generate       |

### Project Preview Panel (Desktop Only)

| Section       | Content                                            |
| ------------- | -------------------------------------------------- |
| Header        | Cover art (large), Title, Type badge, Status badge |
| Track List    | All tracks in project (with drag handles)          |
| Statistics    | Total tracks, completed tracks, total duration     |
| Quick Actions | Open full details, Edit project, Share             |

---

## Interactions

### Page Load

**Behavior:**

1. Check authentication via `useAuth()`
2. Redirect to `/auth` if not authenticated
3. Fetch user's projects via `useProjects()` hook
4. Fetch user's lyrics drafts
5. Get initial tab from URL param (`?tab=lyrics`) or default to "projects"
6. Setup Telegram Back Button (returns to home)
7. Render projects/lyrics with loading skeletons

**API Calls:**

- `GET /api/projects?user_id={userId}` — User's projects
- `GET /api/lyrics?user_id={userId}` — User's lyrics drafts

### Tab Switching

**Trigger:** Click tab trigger (Projects, Lyrics)

**Behavior:**

1. Update `activeTab` state
2. Update URL query param: `?tab={tabName}`
3. Switch content display
4. Haptic feedback (light impact)

**Persistence:**

- Tab selection saved to URL (refresh restores tab)

### Create New Project

**Trigger:** Click "Create New Project" button/card

**Behavior:**

1. Open new project dialog:
   - Project title (required)
   - Project type (single/EP/album/compilation)
   - Description (optional)
   - Cover image upload (optional)
2. User fills form and clicks "Create"
3. Call API: `POST /api/projects`
4. On success:
   - Navigate to new project detail: `/projects/{id}`
   - Show "Project created!" toast
5. On error: Show error message

**API Request:**

```typescript
POST /api/projects
{
  title: string;
  type: "single" | "ep" | "album" | "compilation";
  description?: string;
  cover_url?: string;
}
```

### Create New Lyrics Draft

**Trigger:** Click "New Lyric Draft" button (Lyrics tab)

**Behavior:**

1. Open new lyrics dialog:
   - Title (required)
   - Content (optional)
   - Tags (optional)
2. User fills form and clicks "Create"
3. Call API: `POST /api/lyrics`
4. On success:
   - Refresh lyrics list
   - Show "Lyrics created!" toast
5. On error: Show error message

### Project Card Interactions

**Click Project Card:**

- **Mobile:** Navigate to project detail: `/projects/{id}`
- **Desktop:** Open preview panel (right side)

**Quick Actions Menu:**

- **Edit:** Navigate to project detail
- **Share:** Open share dialog (Telegram)
- **Delete:** Show confirmation, then delete

### Project Preview Panel (Desktop)

**Trigger:** Click project card in list

**Behavior:**

1. Set `selectedProjectId` state
2. Render project preview in right panel
3. Display project details:
   - Cover art, title, type, status
   - Track list with drag handles
   - Statistics (tracks, duration)
   - Quick actions

**Track Reordering (Preview Panel):**

- Trigger: Drag track handle (drag-drop)
- Behavior: Reorder tracks within project
- API: `PATCH /api/projects/{id}/reorder-tracks`

**Open Full Details:**

- Trigger: Click "Open Full Details" button
- Behavior: Navigate to `/projects/{id}`

### Lyrics Card Interactions

**Click Lyrics Card:**

- Navigate to lyrics detail/edit page

**Generate Track from Lyrics:**

- Trigger: Click "Generate" action on lyrics card
- Behavior: Open generation form with lyrics pre-filled

**Edit Lyrics:**

- Trigger: Click "Edit" action
- Behavior: Open lyrics editor

**Delete Lyrics:**

- Trigger: Click "Delete" action
- Behavior: Show confirmation, then delete

### Empty States

**No Projects:**

- Display: "No projects yet"
- CTA: "Create your first project" button

**No Lyrics:**

- Display: "No lyrics drafts yet"
- CTA: "Create lyrics draft" button

### Pull-to-Refresh (Mobile)

**Trigger:** Pull down on project/lyrics list

**Behavior:**

1. Show refresh indicator
2. Refetch projects/lyrics from API
3. Show updated list
4. Show "Refreshed" toast

## API Dependencies

| API            | Method | Path                              | Trigger        | Notes                  |
| -------------- | ------ | --------------------------------- | -------------- | ---------------------- |
| Get Projects   | GET    | /api/projects?user_id={userId}    | Page load      | User's projects        |
| Create Project | POST   | /api/projects                     | Create project | Returns new project ID |
| Get Lyrics     | GET    | /api/lyrics?user_id={userId}      | Tab load       | User's lyrics drafts   |
| Create Lyrics  | POST   | /api/lyrics                       | Create lyrics  | Returns new lyrics ID  |
| Delete Project | DELETE | /api/projects/{id}                | Delete action  | Soft delete            |
| Delete Lyrics  | DELETE | /api/lyrics/{id}                  | Delete action  | Permanent delete       |
| Reorder Tracks | PATCH  | /api/projects/{id}/reorder-tracks | Drag-drop      | Update track order     |

## Page Relationships

**From:**

- `/` (Home) → Click "Projects" in quick actions or navigation
- `/profile` → Click "Projects" stat card
- Deep link → `t.me/AIMusicVerseBot/app?startapp=projects` opens projects
- `/studio-v2` → Click "Save to Project" after editing

**To:**

- `/projects/{id}` → Click project card or "Open Full Details"
- `/lyrics-studio` → Click "New Lyric Draft" or lyrics card
- `/` (Home) → Click back button or Telegram back button
- `/studio-v2` → Click "Edit in Studio" from project actions

**Data Coupling:**

- Projects list: Refreshed when project created/updated/deleted
- Lyrics list: Independent of projects (separate data source)
- Track counts: Fetched from project metadata (cached)

## Business Rules

1. **Project Types:**
   - Single: 1-2 tracks (standalone release)
   - EP: 3-6 tracks (extended play)
   - Album: 7+ tracks (full album)
   - Compilation: Various artists, curated collection

2. **Project Status Flow:**
   - Draft → In Progress → Completed → Released → Published
   - Manual transitions: User can advance status
   - Auto-complete: Status updates to "Completed" when all tracks done
   - Published: Publicly visible (requires all tracks completed)

3. **Track Limits per Project:**
   - Single: Max 2 tracks
   - EP: Max 6 tracks
   - Album: No limit (typical 10-15 tracks)
   - Compilation: No limit

4. **Project Deletion:**
   - Draft projects: Immediate deletion
   - Projects with >5 likes: Cannot delete (preserve community content)
   - Published projects: Admin-only deletion
   - Confirmation: Always show dialog before delete

5. **Lyrics Drafts:**
   - Unlimited drafts per user
   - Auto-save: Every 30 seconds while editing
   - Expiry: No expiry (persistent until deleted)
   - Tags: Genre, mood tags for organization

6. **Project Cover Art:**
   - Default: First track's cover art
   - Custom: User can upload custom cover (JPG/PNG, max 5MB)
   - Size: 2000×2000px recommended (square)
   - Storage: Supabase Storage (public bucket)

7. **Lyrics Generation:**
   - From lyrics draft: Pre-fills generation form
   - AI assistant: Chat interface to improve lyrics
   - Templates: Genre-specific lyric templates
   - Versioning: Each edit creates new version (restorable)

8. **Mobile Optimizations:**
   - Touch targets: Minimum 44×44px
   - Swipe actions: Swipe left on project card for quick actions
   - Pull-to-refresh: Native mobile gesture
   - Haptic feedback: On all interactive elements
   - Safe areas: Padding for notch/island

9. **Desktop Master-Detail Layout:**
   - Left column: Projects list (scrollable)
   - Right panel: Selected project preview (sticky)
   - Click behavior: Click card to preview, click "Open" for details
   - Keyboard: Arrow keys to navigate projects, Enter to open

10. **Project Sharing:**
    - Public projects: Shareable via Telegram deep link
    - Private projects: Only owner can view
    - Collaboration: Not supported (single-owner model)
    - Embed: Not supported (Telegram-only platform)

---

**Next:** [Project Detail Page](./07-project-detail.md) → Individual project management
