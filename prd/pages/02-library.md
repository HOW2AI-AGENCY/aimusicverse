# Library

> **Route:** `/library`  
> **Module:** Library & Discovery  
> **Generated:** 2026-06-26

## Overview

The Library page is the user's personal track management hub. It displays all generated tracks with powerful search, filtering, and sorting capabilities. Users can browse, play, like, delete, and manage their music collection. The page supports both list and grid view modes, with real-time updates for active generations and infinite scroll with virtualization for performance.

**Primary Use Cases:**
- Browse personal music collection
- Search and filter tracks by type, status, tags
- Play tracks and manage playback
- Access track detail panel (desktop) or full-screen player (mobile)
- Delete unwanted tracks
- Monitor active generation tasks

## Layout

### Desktop Layout (Master-Detail with Sidebar)

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER: Search Bar + Filter Chips + View Toggle + Sort Select   │
├──────────────┬─────────────────────────────────┬─────────────────┤
│ Sidebar      │ Track List (12/12)              │ Detail Panel    │
│ (Collapsed)  │ ┌─────────────────────────────┐ │ (if selected)  │
│              │ │ Track Row 1        [Play]   │ │ ┌─────────────┐ │
│ • Filters    │ ├─────────────────────────────┤ │ │ Cover Art   │ │
│ • Tags       │ │ Track Row 2        [Play]   │ │ │ Title       │ │
│ • Quick      │ ├─────────────────────────────┤ │ │ Style       │ │
│ • Stats      │ │ Track Row 3        [Play]   │ │ │ Versions    │ │
│ • Generate   │ │ ...                         │ │ │ Stems       │ │
│              │ │ Track Row 12       [Play]   │ │ │ Actions     │ │
│              │ └─────────────────────────────┘ │ └─────────────┘ │
└──────────────┴─────────────────────────────────┴─────────────────┘
```

### Mobile Layout (Single Column with Filter Bar)

```
┌──────────────────────────┐
│ HEADER: Search + Filter  │
├──────────────────────────┤
│ Compact Filter Bar       │
│ [All] [Vocal] [Inst]     │
├──────────────────────────┤
│ Active Generations (if any) │
│ ┌──────────────────────┐ │
│ │ Generating... 45s    │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Track List / Grid        │
│ ┌──────────────────────┐ │
│ │ [▶] Title - Artist  │ │
│ │     2:34  •  ❤ 124  │ │
│ ├──────────────────────┤ │
│ │ [▶] Title - Artist  │ │
│ │     3:12  •  ❤ 89   │ │
│ │ ...                  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## Fields

### Search & Filter Section

| Field | Type | Required | Options / Enum | Default | Notes |
|-------|------|----------|---------------|---------|-------|
| Search Query | Text input | No | — | "" | Debounced (300ms), searches title/style |
| Type Filter | Chips/Select | No | all, vocals, instrumental, stems | all | Filter by track type |
| Status Filter | Select | No | all, completed, failed | all | Filter by generation status |
| Tag Filter | Chips | No | All user tags | null | Filter by custom tags |
| Sort By | Select | No | recent, popular, liked | recent | Sort order |
| View Mode | Toggle | No | grid, list | Desktop: grid, Mobile: list | Display mode |

### Track List (List View)

| Column | Format | Sortable | Filterable | Notes |
|--------|--------|----------|-----------|-------|
| Play Button | Icon | No | No | Starts playback, stops current track |
| Cover Art | Image (80×80px) | No | No | Lazy-loaded with blur placeholder |
| Title | Text (link) | No | Yes (Search) | Truncated at 2 lines, links to detail |
| Style/Tags | Text (chips) | No | Yes (Tag filter) | Genre tags, clickable |
| Duration | Text (MM:SS) | No | No | Audio length |
| Version Count | Badge | No | Yes (Type filter) | "2" or "3+" with icon |
| Stem Count | Badge | No | Yes (Type filter) | "4 stems" with icon |
| MIDI Status | Icon | No | No | Shows if MIDI transcription available |
| Likes | Heart icon + count | Yes (Sort) | No | Optimistic update on click |
| Play Count | Number | Yes (Sort) | No | "1.2K" format |
| Created At | Date | Yes (Sort) | No | "2 hours ago" relative format |
| Actions | Dropdown | No | No | Play, Delete, Share, Studio, More |

### Track Grid (Grid View)

| Column | Format | Sortable | Filterable | Notes |
|--------|--------|----------|-----------|-------|
| Cover Art | Image (200×200px) | No | No | Large thumbnail, click to play |
| Title | Text | No | Yes (Search) | Truncated at 2 lines |
| Duration | Text (MM:SS) | No | No | Small badge on cover |
| Play Overlay | Icon button | No | No | Appears on hover/tap, plays track |

### Active Generations Section

| Field | Type | Notes |
|-------|------|-------|
| Track Title | Text | "Generating: {title}" |
| Progress | Progress bar | 0-100% based on elapsed time |
| Status | Text | "Processing (~45s remaining)" |
| Cancel | Button | Stops generation task |

### Track Detail Panel (Desktop)

| Section | Fields | Notes |
|---------|--------|-------|
| Header | Cover art (large), Title, Artist, Badge (model) | Top section |
| Metadata | Duration, Created at, Play count, Likes | Info row |
| Versions | Version A/B selector, Switch button | A/B comparison |
| Stems | Stem list (vocals, drums, bass, other) | With play buttons |
| Lyrics | Full lyrics text (if has vocals) | Scrollable |
| Tags | Style tags, genre, mood | Clickable to filter |
| Actions | Play, Download, Share, Edit in Studio, Delete | Action buttons |

---

## Interactions

### Page Load

**Behavior:**
1. Check authentication via `useAuth()`
2. Initialize filter states from URL params or defaults
3. Fetch user's tracks via `useTracks()`:
   - First page: 12 tracks
   - Paginated: Infinite scroll
4. Fetch active generation tasks via `useActiveGenerations()`
5. Setup real-time updates via `useGenerationRealtime()`
6. Batch fetch track counts (versions & stems) for visible tracks
7. Batch fetch MIDI/PDF status for visible tracks
8. Render filtered/sorted tracks

**API Calls:**
- `GET /api/tracks?user_id={userId}&limit=12&sort=recent` — User's tracks
- `GET /api/generation/active?user_id={userId}` — Active generations
- `GET /api/tracks/{id}/counts` (batch) — Version/stem counts
- `GET /api/tracks/{id}/midi-status` (batch) — MIDI availability

### Search

**Trigger:** User types in search input

**Behavior:**
1. Update `searchQuery` state (immediate)
2. Debounce query (300ms delay)
3. Call `useTracks()` with debounced query
4. Filter tracks by title OR style containing query
5. Update filtered list
6. Reset to page 1 (clear infinite scroll)

**Special Rules:**
- Case-insensitive search
- Searches both title and style fields
- Minimum 2 characters to trigger search
- Shows "No results" if empty filtered list

### Filter by Type

**Trigger:** Click type filter chip (All, Vocals, Instrumental, Stems)

**Behavior:**
1. Update `typeFilter` state
2. Filter client-side from fetched tracks:
   - `vocals`: `has_vocals = true AND is_instrumental = false`
   - `instrumental`: `is_instrumental = true`
   - `stems`: `has_stems = true`
3. Update filtered list
4. Show count badge on each filter option

### Filter by Status

**Trigger:** Select status from dropdown (All, Completed, Failed)

**Behavior:**
1. Update `statusFilter` state
2. Call `useTracks()` with status filter
3. Server-side filtering via API
4. Update filtered list

### Filter by Tag

**Trigger:** Click tag chip on track or in filter bar

**Behavior:**
1. Set `tagFilter` state to clicked tag
2. Call `useTracks()` with tag filter
3. Server-side filtering via API
4. Update filtered list
5. Show "Clear tag" button in filter bar

### Sort

**Trigger:** Select sort option from dropdown

**Options:**
- **Recent:** Sort by `created_at DESC` (newest first)
- **Popular:** Sort by `play_count DESC` (most played)
- **Liked:** Sort by local likes state (favorites first)

**Behavior:**
1. Update `sortBy` state
2. For "Recent"/"Popular": Call API with sort param
3. For "Liked": Client-side sort (uses local like state)
4. Re-order filtered list

### View Mode Toggle

**Trigger:** Click grid/list toggle button

**Behavior:**
1. Update `viewMode` state
2. Change rendering component:
   - `list`: `VirtualizedTrackList` (row layout)
   - `grid`: `VirtualizedGrid` (card layout)
3. Persist to localStorage (restores on reload)

### Track Playback

**Trigger:** Click play button on track row/card

**Behavior:**
1. Stop currently playing track (if any)
2. Set new active track via `usePlayerStore()`
3. Start global audio player
4. Update track play count (API call)
5. Show mini player at bottom of screen
6. Add to playback history

**API Calls:**
- `POST /api/tracks/{id}/play` — Log play event (increments play_count)

**Special Rules:**
- Only one track plays globally
- Clicking same track again pauses playback
- Desktop: Spacebar shortcut for play/pause
- Mobile: Haptic feedback on play

### Like Track

**Trigger:** Click heart icon on track

**Behavior:**
1. Optimistic update: Toggle like state immediately
2. Call API: `POST /api/tracks/{id}/like`
3. On error: Revert optimistic update
4. Update like count display
5. Haptic feedback (light impact)

**API Calls:**
- `POST /api/tracks/{id}/like` — Toggle like
- `DELETE /api/tracks/{id}/like` — Remove like

### Delete Track

**Trigger:** Click "Delete" in track actions menu

**Behavior:**
1. Show confirmation dialog: "Delete '{title}'?"
2. User confirms
3. Call API: `DELETE /api/tracks/{id}`
4. Remove from list (optimistic update)
5. Show "Track deleted" toast
6. If deleted track was playing: Stop playback

**API Calls:**
- `DELETE /api/tracks/{id}` — Delete track and versions

**Special Rules:**
- Cannot delete tracks with >100 likes
- Cannot delete tracks in public playlists (admin-only)
- Confirmation dialog required

### Track Detail Panel (Desktop)

**Trigger:** Click track row in list view (desktop only)

**Behavior:**
1. Set `selectedTrackId` state
2. Open detail panel on right side
3. Load full track details:
   - Versions (A/B)
   - Stems (if available)
   - Lyrics (if has vocals)
   - Tags
   - MIDI status
4. Enable keyboard navigation:
   - Arrow Up/Down: Navigate to prev/next track
   - Space: Play/pause selected track
5. Click outside panel: Close panel

**Version Switch:**
- Trigger: Click version A/B toggle
- Behavior: Call `POST /api/tracks/{id}/switch-version`, update `active_version_id`

### Infinite Scroll

**Trigger:** Scroll to bottom of track list

**Behavior:**
1. Check `hasNextPage` flag
2. If true: Call `fetchNextPage()`
3. Show loading spinner at bottom
4. Append new tracks to existing list
5. Update virtualized list
6. If false: Show "End of library" message

**Special Rules:**
- Virtualization renders only visible items (performance)
- Page size: 12 tracks per page
- Max pages: Unlimited (fetches all user tracks)

### Pull-to-Refresh (Mobile)

**Trigger:** Pull down on mobile track list

**Behavior:**
1. Show refresh indicator (pull arrow)
2. On release past threshold: Trigger refresh
3. Refetch tracks from API
4. Reset to page 1
5. Show "Library updated" toast
6. Scroll to top

### Active Generation Tracking

**Behavior:**
1. Poll for active generations every 3 seconds
2. Show skeleton cards for in-progress tracks
3. Display progress bar with estimated time
4. On completion: Auto-refresh track list
5. Remove completed generation from active list

**Real-time Updates:**
- WebSocket connection for instant updates (if available)
- Fallback: Polling every 3 seconds
- Auto-refresh when generation count decreases

### Swipe Actions (Mobile)

**Trigger:** Swipe track row left or right

**Actions:**
- **Left Swipe:** Quick actions (Delete, Share)
- **Right Swipe:** Play (most common)

**Behavior:**
1. Show action buttons on swipe
2. Tap button to execute action
3. Swipe back to cancel
4. Haptic feedback on swipe

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get User Tracks | GET | /api/tracks?user_id={userId} | Page load, filter, sort | Paginated (12/page) |
| Search Tracks | GET | /api/tracks?user_id={userId}&search={query} | Search (debounced) | Server-side search |
| Filter by Tag | GET | /api/tracks?user_id={userId}&tag={tag} | Tag filter | Server-side filter |
| Get Active Generations | GET | /api/generation/active?user_id={userId} | Page load | Polls every 3s |
| Get Track Counts | GET | /api/tracks/{id}/counts | Batch request | Returns version/stem counts |
| Get MIDI Status | GET | /api/tracks/{id}/midi-status | Batch request | Returns MIDI/PDF availability |
| Like Track | POST | /api/tracks/{id}/like | Like action | Toggle like |
| Delete Track | DELETE | /api/tracks/{id} | Delete action | Soft delete (archives) |
| Log Play | POST | /api/tracks/{id}/play | Playback | Increments play_count |
| Switch Version | POST | /api/tracks/{id}/switch-version | Version toggle | Updates active_version_id |
| Get Filter Counts | GET | /api/tracks/counts?user_id={userId} | Page load | Returns counts for filter badges |

## Page Relationships

**From:**
- `/` (Home) → Click "Library" in nav or "Explore Library" button
- `/profile/{userId}` → Click "View Library" on public profile
- Deep link → `t.me/AIMusicVerseBot/app?startapp=library` opens library

**To:**
- `/player/{trackId}` → Click "Open Full Player" on track
- `/studio-v2/track/{trackId}` → Click "Edit in Studio" on track
- `/profile/{userId}` → Click artist name on track
- `/` (Home) → Click back button or home icon

**Data Coupling:**
- Global player state: Playing track updates player across all pages
- Active generations: Auto-refreshes when generation completes (shared with home page)
- Filter state: Persists across navigation (restored on return)
- Track counts: Cached for 5 minutes (invalidated on generation/delete)

## Business Rules

1. **Track Ownership:**
   - Users see only their own tracks (filtered by `user_id`)
   - Admins see all tracks (bypass user filter)
   - Public tracks: Visible on profile but not in personal library

2. **Deletion Policy:**
   - Soft delete: Tracks marked deleted, not removed from DB
   - Recovery: Deleted tracks recoverable for 30 days
   - Popular tracks: Cannot delete if >100 likes (preserve community content)
   - Public playlists: Cannot delete if track in public playlist (admin override)

3. **Version Display:**
   - Default: Show active version (A or B)
   - Badge: Display version count ("2" or "3+")
   - Detail panel: Show all versions with switcher
   - Switch: Updates `active_version_id` in DB

4. **Stem Display:**
   - Badge: Show stem count if `has_stems = true`
   - Detail panel: List all stem types (vocals, drums, bass, other)
   - Playable: Each stem has individual play button
   - Separate: Stems stored in `track_stems` table

5. **MIDI/PDF Status:**
   - Badge: Show music note icon if MIDI available
   - Detail panel: Download MIDI/PDF buttons
   - Status: Batch fetched for all visible tracks (performance)
   - Generation: Created on-demand via `POST /api/tracks/{id}/generate-midi`

6. **Search Behavior:**
   - Debounce: 300ms delay to avoid excessive API calls
   - Scope: Searches title AND style fields
   - Minimum: 2 characters required
   - Case-insensitive: "rock" matches "Rock" and "rock"

7. **Sorting Logic:**
   - Recent: Server-side sort by `created_at DESC`
   - Popular: Server-side sort by `play_count DESC`
   - Liked: Client-side sort (uses local like state from cache)
   - Persistence: Sort preference saved to localStorage

8. **Filtering Logic:**
   - Type filters: Client-side (fetch all, filter in browser)
   - Status filter: Server-side (API parameter)
   - Tag filter: Server-side (API parameter)
   - Composable: Multiple filters can be active simultaneously

9. **Performance Optimizations:**
   - Virtualization: Only render visible tracks (react-virtuoso)
   - Batch fetching: Single request for all track counts/MIDI status
   - Infinite scroll: Load 12 tracks per page (not all at once)
   - Debounced search: Reduce API calls during typing
   - Cached data: Tracks cached for 5 minutes (TanStack Query)

10. **Mobile Optimizations:**
    - Pull-to-refresh: Native mobile gesture
    - Swipe actions: Quick access to common actions
    - List view default: Better for small screens
    - Touch targets: Minimum 44×44px
    - Haptic feedback: Confirmation of actions
    - Safe areas: Padding for notch/island

11. **Real-time Updates:**
    - Active generations: Poll every 3 seconds
    - Completion detection: Auto-refresh when generation finishes
    - WebSocket: Preferred if available (fallback to polling)
    - Optimistic UI: Update immediately, revert on error

12. **Empty State:**
    - No tracks: Show "Empty Library" with CTA to generate first track
    - No search results: Show "No tracks found" with clear search button
    - No filters: Show "All caught up!" message at end of list

---

**Next:** [Profile Page](./03-profile-page.md) → User profile management
