# Playlists Page

> **Route:** `/playlists`  
> **Module:** Content Discovery  
> **Generated:** 2026-06-26

## Overview

The Playlists Page allows users to browse and manage their music playlists. Users can create new playlists, edit existing ones, share with others, and delete unwanted playlists. Features desktop master-detail layout with preview panel and mobile list view.

**Primary Use Cases:**
- Browse all user playlists
- Create new playlist
- Edit playlist (title, description, cover)
- Share playlist via Telegram
- Delete playlist

## Layout

### Mobile Layout (List View)

```
┌──────────────────────────┐
│ HEADER: Back + "Playlists"│
│ [+ Create] button        │
├──────────────────────────┤
│ Playlist List            │
│ ┌──────────────────────┐ │
│ │ [Cover] Title        │ │
│ │ 12 tracks • 45 min   │ │
│ │ [Edit] [Share] [Del]│ │
│ ├──────────────────────┤ │
│ │ [Cover] Title        │ │
│ │ 8 tracks • 32 min    │ │
│ │ [Edit] [Share] [Del]│ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Master-Detail)

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Playlists" [+ Create]               │
├──────────────────────┬────────────────────────┤
│ Playlist List (4 cols)│ Playlist Preview        │
│ ┌────────┬────────┬───┐ └────────────────────────┤
│ │[Cover] │[Cover] │...│ Playlist Details          │
│ │Title   │Title   │   │ • Cover art               │
│ │12 tr   │8 tr    │   │ • Title, description      │
│ └────────┴────────┴───┘ • Track list              │
│                          • Duration, track count    │
│                          • [Play All] [Edit] [Share]│
└──────────────────────┴────────────────────────┘
```

## Fields

### Playlist Card

| Field | Format | Notes |
|-------|--------|-------|
| Cover Art | Image (200×200px) | Playlist cover or grid of track covers |
| Title | Text (H3) | Playlist name |
| Track Count | Text | "12 tracks" |
| Total Duration | Text | "45 мин" (formatted) |
| Actions | Buttons | Edit, Share, Delete (3-dot menu) |

### Playlist Preview Panel (Desktop)

| Section | Content |
|---------|---------|
| Cover Art | Large cover (300×300px) |
| Title | Playlist name (H2) |
| Description | Text (multi-line) |
| Statistics | Track count, total duration, created date |
| Track List | First 20 tracks |
| Actions | Play All, Edit, Share, Delete |

---

## Interactions

### Page Load

**Behavior:**
1. Fetch user playlists via `usePlaylists()`
2. Setup Telegram Back Button (returns to home)
3. Render playlist grid with loading skeletons

**API Calls:**
- `GET /api/playlists?user_id={userId}` — User's playlists

### Create Playlist

**Trigger:** Click "+ Create" button

**Behavior:**
1. Open create dialog:
   - Title (required)
   - Description (optional)
   - Cover image upload (optional)
2. User fills form and clicks "Create"
3. Call API: `POST /api/playlists`
4. On success: Refresh playlist list, show "Playlist created!" toast

**API Request:**
```typescript
POST /api/playlists
{
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;  // Default false
}
```

### Edit Playlist

**Trigger:** Click "Edit" button on playlist

**Behavior:**
1. Open edit dialog (pre-filled with current data)
2. User edits fields
3. Call API: `PATCH /api/playlists/{id}`
4. On success: Update playlist, show "Playlist updated!" toast

### Delete Playlist

**Trigger:** Click "Delete" button

**Behavior:**
1. Show confirmation: "Delete '{title}'?"
2. User confirms
3. Call API: `DELETE /api/playlists/{id}`
4. On success: Remove from list, show "Playlist deleted!" toast

### Share Playlist

**Trigger:** Click "Share" button

**Behavior:**
1. Open share dialog
2. Generate deep link: `t.me/AIMusicVerseBot/app?startapp=playlist={id}`
3. Open Telegram share dialog
4. On success: Show "Playlist shared!" toast

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Playlists | GET | /api/playlists?user_id={userId} | Page load | User's playlists |
| Create Playlist | POST | /api/playlists | Create dialog | Creates new playlist |
| Update Playlist | PATCH | /api/playlists/{id} | Edit dialog | Updates playlist |
| Delete Playlist | DELETE | /api/playlists/{id} | Delete action | Deletes playlist |
| Add Track to Playlist | POST | /api/playlists/{id}/tracks | Add track | Links track |
| Remove Track | DELETE | /api/playlists/{id}/tracks/{trackId} | Remove action | Unlinks track |

## Page Relationships

**From:**
- `/` (Home) → Click "Playlists" in navigation
- `/library` → Click "Add to Playlist" on track
- Deep link → `startapp=playlist={id}` opens playlist

**To:**
- `/library` → Browse tracks to add to playlist
- `/playlists/{id}` — Not implemented (playlist detail same as preview)
- `/` (Home) → Back button

## Business Rules

1. **Playlist Creation:**
   - Title required: Max 255 chars
   - Description optional: Max 1000 chars
   - Cover optional: Auto-generated from track covers if not provided
   - Visibility: Default private, can make public

2. **Track Management:**
   - Add tracks: From library or track detail
   - Remove tracks: From playlist edit or track detail
   - Reorder: Drag-drop reordering (not implemented in current code)
   - Duplicates: Same track can appear multiple times

3. **Playlist Deletion:**
   - Confirmation required: Always show dialog
   - Tracks unaffected: Deleting playlist doesn't delete tracks
   - Recovery: 30-day grace period (soft delete)

4. **Public Playlists:**
   - Visible to all: In browse, search
   - Shareable: Deep link accessible to anyone
   - Follower system: Not implemented (planned feature)

5. **Cover Generation:**
   - Default: Grid of first 4 track covers (2×2)
   - Custom: User can upload custom cover
   - Auto-update: Updates when tracks added/removed

---

**Next:** [Blog Page](./10-blog.md) → Batch 2 continues
