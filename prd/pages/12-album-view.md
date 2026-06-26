# Album View Page

> **Route:** `/album/:id`  
> **Module:** Content Discovery  
> **Generated:** 2026-06-26

## Overview

The Album View Page displays a music album (project) with its full track list. Users can play tracks, like the album, follow the creator, and share. Similar to streaming service album pages.

**Primary Use Cases:**
- View full album with all tracks
- Play album tracks sequentially
- Like/follow album creator
- Share album via Telegram

## Layout

### Mobile Layout

```
┌──────────────────────────┐
│ HEADER: Back Button      │
├──────────────────────────┤
│ Album Header             │
│ [Cover Large]            │
│ Album Title              │
│ Artist • 2026 • 12 trk   │
│ [❤️ Like] [Follow] [▶ Play All]│
├──────────────────────────┤
│ Track List              │
│ ┌──────────────────────┐ │
│ │ 1. Track One   2:34 │ │
│ │    [▶] [❤️] [⋯]     │ │
│ ├──────────────────────┤ │
│ │ 2. Track Two   3:12 │ │
│ │    [▶] [❤️] [⋯]     │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout

```
┌─────────────────────────────────────────────────┐
│  HEADER: Back Button                            │
├─────────────────────────────────────────────────┤
│ Album Header (Left: Cover, Right: Info)         │
│ ┌──────────────────┬──────────────────────────┐ │
│ │ [Cover Large]    │ Title                    │ │
│ │                  │ Artist • Type • Year      │ │
│ │                  │ Description              │ │
│ │                  │ [▶ Play All] [❤️] [🔄]   │ │
│ └──────────────────┴──────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Track List (Numbered)                            │
│ ┌───────────────────────────────────────────┐  │
│ │ 1. Track One   2:34   [▶] [❤️] [Add]     │  │
│ │ 2. Track Two   3:12   [▶] [❤️] [Add]     │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Fields

### Album Header

| Field | Type | Notes |
|-------|------|-------|
| Cover Art | Image (300×300px) | Album cover image |
| Title | Text (H1) | Album name |
| Artist | Text (link) | Creator name, links to profile |
| Type | Badge | Album, EP, Single, Compilation |
| Year | Text | Release year |
| Track Count | Text | "12 tracks" |
| Total Duration | Text | "45 min" |
| Description | Text (multi-line) | Album description |
| Like Button | Icon button | Heart icon with count |
| Follow Button | Button | Follow creator |
| Play All Button | Button | Play all tracks sequentially |
| Share Button | Icon button | Share via Telegram |

### Track List

| Column | Format | Notes |
|--------|--------|-------|
| Number | Text | Track position (1, 2, 3...) |
| Title | Text | Track name |
| Duration | Text (MM:SS) | Track length |
| Play Button | Icon | Plays individual track |
| Like Button | Icon | Like track |
| Add Button | Icon | Add to playlist |

---

## Interactions

### Page Load

**Behavior:**
1. Extract `albumId` from URL params
2. Fetch album data via API
3. Fetch album tracks
4. Setup Telegram Back Button (returns to previous page)
5. Render album with loading skeletons

**API Calls:**
- `GET /api/projects/{id}` — Album/project details
- `GET /api/projects/{id}/tracks` — Album tracks

### Play All

**Trigger:** Click "Play All" button

**Behavior:**
1. Create queue from all album tracks
2. Start playback from first track
3. Show mini player at bottom
4. Set player to album context (sequential play)

### Play Individual Track

**Trigger:** Click play button on track

**Behavior:**
1. Stop current track
2. Start selected track
3. Set player context to album
4. Auto-play next track when current ends

### Like Album

**Trigger:** Click like button in header

**Behavior:**
1. Optimistic update: Toggle like
2. Call API: `POST /api/projects/{id}/like`
3. Update like count

### Follow Creator

**Trigger:** Click "Follow" button

**Behavior:**
1. Check if following creator
2. If not: Call API to follow
3. Update button to "Following"

### Share Album

**Trigger:** Click share button

**Behavior:**
1. Generate deep link: `startapp=album={id}`
2. Open Telegram share dialog
3. Pre-fill message with album title

### Add Track to Playlist

**Trigger:** Click add icon on track

**Behavior:**
1. Open playlist selector dialog
2. User selects playlist
3. Call API: `POST /api/playlists/{id}/tracks`
4. Show "Added to playlist!" toast

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Album | GET | /api/projects/{id} | Page load | Album details |
| Get Album Tracks | GET | /api/projects/{id}/tracks | Page load | All tracks |
| Like Album | POST | /api/projects/{id}/like | Like action | Toggle like |
| Follow Creator | POST | /api/social/follow | Follow action | Follow user |
| Add to Playlist | POST | /api/playlists/{id}/tracks | Add action | Add track |

## Page Relationships

**From:**
- `/library` → Click "View Album" on project card
- `/projects` → Click project card
- `/profile/{userId}` → Click album in user's projects
- Deep link → `startapp=album={id}`

**To:**
- `/profile/{userId}` → Click artist name
- `/library` → Click "View Track"
- Previous page → Back button

## Business Rules

1. **Album vs Project:**
   - Album: Published project with is_public=true
   - Project: Can be draft or private
   - Only published projects accessible via album view

2. **Track Playback:**
   - Sequential: Auto-play next track in album
   - Shuffle: Can shuffle album order
   - Repeat: Can repeat album or single track

3. **Like Album vs Track:**
   - Album like: Likes the entire project
   - Track like: Likes individual track
   - Independent: Separate like counts

4. **Follow Creator:**
   - Follow: Follow album owner (user)
   - Notifications: Owner notified when followed
   - Feed: Followed users' tracks appear in community feed

5. **Add to Playlist:**
   - Any playlist: User can add to any of their playlists
   - Create new: Option to create new playlist during add
   - Duplicates: Same track can appear in multiple playlists

---

**Batch 2 Complete!** ✅

**Next:** [Templates Page](../pages/13-templates.md) → Batch 3: Creative Tools
