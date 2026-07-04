# Artists Page

> **Route:** `/artists`  
> **Module:** Content Discovery  
> **Generated:** 2026-06-26

## Overview

The Artists Page allows users to browse and manage AI artist personas. It features two tabs: "My Artists" (user-created personas) and "Discover" (community artists). Users can search artists, filter by genre, view artist details, and create new artists from existing tracks. The page supports both mobile and desktop layouts with a master-detail view on desktop.

**Primary Use Cases:**

- Browse user's own AI artist personas
- Discover community artists
- Search and filter artists by name/genre
- Create new artists from tracks
- View artist details and track lists

## Layout

### Mobile Layout (Tabs + Grid)

```
┌──────────────────────────┐
│ HEADER: Back + Title     │
├──────────────────────────┤
│ Tabs: [My Artists|Discover] │
├──────────────────────────┤
│ Search Bar               │
│ [🔍 Search artists...]  │
├──────────────────────────┤
│ Genre Filter (horizontal)│
│ [All][Pop][Rock][Hip]... │
├──────────────────────────┤
│ Artists Grid (2 columns) │
│ ┌──────────┬──────────┐ │
│ │[Avatar]  │[Avatar]  │ │
│ │ Name     │ Name     │ │
│ │ [Tracks] │ [Tracks] │ │
│ ├──────────┼──────────┤ │
│ │[Avatar]  │[Avatar]  │ │
│ │ Name     │ Name     │ │ │
│ │ [Tracks] │ [Tracks] │ │
│ └──────────┴──────────┘ │
│                          │
│ [+ Create Artist] FAB    │
└──────────────────────────┘
```

### Desktop Layout (Master-Detail with Preview)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: "Artists"                                      │
├──────────────────────────┬──────────────────────────────┤
│ Artists List (Left)        │ Artist Preview (Right)       │
│ ─────────────────────────│ ──────────────────────────── │
│ Tabs: [My Artists|Disc.]  │ Artist Details                │
│ Search: [🔍 Search...]    │ ┌─────────────────────────────┐ │
│ Genre: [All][Pop]...      │ │ [Avatar Large]               │ │
│ ─────────────────────────│ │ Name                          │ │
│ Artists Grid (3 cols)     │ │ Genre Tags                    │ │
│ ┌────────┬────────┬──────│ │ Bio (truncated)              │ │
│ │[Avatar]│[Avatar]│[Ava]│ │ Track List (12 tracks)         │ │
│ │ Name   │ Name   │ Name│ │ 1. Track One                  │ │
│ │[12 tr] │[8 tr]  │[5 t]│ │ 2. Track Two                  │ │
│ ├────────┼────────┼──────│ │ ...                           │ │
│ │[Avatar]│[Avatar]│[Ava]│ │                               │ │
│ └────────┴────────┴──────│ │ [Follow] [View All Tracks]    │ │
│                            │ └─────────────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘
```

## Fields

### Tab Navigation

| Tab        | Content                    | Source               |
| ---------- | -------------------------- | -------------------- |
| My Artists | User's created AI personas | `useArtists()`       |
| Discover   | Community artists (public) | `usePublicArtists()` |

### Search & Filters

| Field        | Type                      | Notes                                    |
| ------------ | ------------------------- | ---------------------------------------- |
| Search Query | Text input                | Searches artist names (case-insensitive) |
| Genre Filter | Chips (horizontal scroll) | Filter by genre tags                     |

**Genre Options:**

- All (no filter)
- Pop
- Rock
- Hip-Hop
- Electronic
- R&B
- Jazz
- Classical
- Folk

### Artist Card

| Field          | Format                     | Notes                 |
| -------------- | -------------------------- | --------------------- |
| Avatar         | Image (100×100px)          | AI-generated portrait |
| Name           | Text (H3)                  | Artist name           |
| Genre Tags     | Chips                      | Genre/style tags      |
| Track Count    | Badge                      | "12 tracks"           |
| Follower Count | Badge (Discover tab only)  | "245 followers"       |
| Follow Button  | Button (Discover tab only) | Follow/unfollow       |

### Artist Preview Panel (Desktop)

| Section         | Content                              |
| --------------- | ------------------------------------ |
| Avatar          | Large avatar (200×200px)             |
| Name            | Artist name (H2)                     |
| Genre Tags      | Chips                                |
| Bio             | Text (truncated at 3 lines)          |
| Track List      | First 12 tracks (click to load more) |
| Follow Button   | Follow/unfollow (Discover tab only)  |
| View All Tracks | Link to artist's full track list     |

---

## Interactions

### Page Load

**Behavior:**

1. Check authentication via `useAuth()`
2. Redirect to `/auth` if not authenticated
3. Fetch user's artists via `useArtists()`
4. Fetch public artists via `usePublicArtists(50)`
5. Get initial tab from URL param (`?tab=discover`) or default to "my"
6. Setup Telegram Back Button (returns to home)
7. Render artists with loading skeletons

**API Calls:**

- `GET /api/artists?user_id={userId}` — User's artists
- `GET /api/artists?is_public=true&limit=50` — Public artists

### Tab Switching

**Trigger:** Click tab trigger (My Artists, Discover)

**Behavior:**

1. Update URL query param: `?tab={tabName}`
2. Clear search query and genre filter
3. Clear selected artist
4. Switch data source (my artists vs public artists)
5. Haptic feedback (light impact)

**Persistence:**

- Tab selection saved to URL (refresh restores tab)

### Search

**Trigger:** Type in search input

**Behavior:**

1. Update `searchQuery` state
2. Filter artists client-side by name:
   - Case-insensitive search
   - Searches artist name field
3. Update filtered grid immediately

**Filter Logic:**

```typescript
artist.name.toLowerCase().includes(searchQuery.toLowerCase());
```

### Genre Filter

**Trigger:** Click genre chip

**Behavior:**

1. Set `selectedGenre` state
2. Filter artists by genre tag:
   - "All": No filter
   - Genre: Only artists with matching genre tag
3. Update filtered grid immediately
4. Highlight selected genre chip

**Filter Logic:**

```typescript
!selectedGenre || artist.genre_tags?.includes(selectedGenre);
```

### Create Artist from Track

**Trigger:** Click floating action button (+) or "Create Artist" button

**Behavior:**

1. Open "Create Artist from Track" dialog:
   - Select track (dropdown of user's tracks)
   - Artist name (text input, required)
   - Genre tags (chips, optional)
   - Style description (textarea, optional)
2. User fills form and clicks "Create"
3. Call API: `POST /api/artists`
4. On success:
   - Refresh artists list
   - Show "Artist created!" toast
   - Switch to "My Artists" tab (if in Discover tab)
5. On error: Show error message

**API Request:**

```typescript
POST /api/artists
{
  track_id: string;      // Source track for avatar
  name: string;
  genre_tags?: string[];
  style_description?: string;
  is_public: boolean;     // Default false
}
```

### Artist Card Click

**Mobile:**

- **Trigger:** Click artist card
- **Behavior:**
  1. Set `selectedArtist` state
  2. Open artist details panel (bottom sheet)
  3. Display full artist info with track list

**Desktop:**

- **Trigger:** Click artist card
- **Behavior:**
  1. Set `selectedArtist` state
  2. Show artist preview in right panel
  3. Display track list (first 12 tracks)

### Follow/Unfollow Artist (Discover Tab)

**Trigger:** Click follow button

**Behavior:**

1. Check if following
2. If not following:
   - Optimistic update: Show "Following"
   - Call API: `POST /api/artists/{id}/follow`
   - On error: Revert to "Follow"
   - Increment follower count
3. If following:
   - Show confirmation: "Unfollow?"
   - User confirms
   - Optimistic update: Show "Follow"
   - Call API: `DELETE /api/artists/{id}/follow`
   - On error: Revert to "Following"
   - Decrement follower count

**API Calls:**

- `POST /api/artists/{id}/follow` — Follow artist
- `DELETE /api/artists/{id}/follow` — Unfollow artist

### View Artist Tracks

**Trigger:** Click "View All Tracks" in preview panel

**Behavior:**

1. Navigate to artist detail view (could be filtered library view)
2. Filter tracks by artist ID
3. Show all tracks by this artist

### Empty States

**No Artists (My Artists):**

- Display: "No artists yet"
- CTA: "Create your first artist" button

**No Results (Search/Filter):**

- Display: "No artists found"
- Hint: "Try adjusting your search or filters"

**No Artists (Discover):**

- Display: "No public artists yet"
- Note: "Be the first to create and share an artist!"

## API Dependencies

| API                | Method | Path                                 | Trigger                    | Notes                  |
| ------------------ | ------ | ------------------------------------ | -------------------------- | ---------------------- |
| Get My Artists     | GET    | /api/artists?user_id={userId}        | Page load (My Artists tab) | User's created artists |
| Get Public Artists | GET    | /api/artists?is_public=true&limit=50 | Page load (Discover tab)   | Community artists      |
| Create Artist      | POST   | /api/artists                         | Create dialog              | Creates new artist     |
| Follow Artist      | POST   | /api/artists/{id}/follow             | Follow action              | Follow artist          |
| Unfollow Artist    | DELETE | /api/artists/{id}/follow             | Unfollow action            | Unfollow artist        |
| Get Artist Tracks  | GET    | /api/tracks?artist_id={id}           | View all tracks            | Artist's track list    |

## Page Relationships

**From:**

- `/` (Home) → Click "AI Artists" menu item
- `/profile` → Click "AI Artists" quick action
- `/library` → Click artist name on track
- Deep link → `t.me/AIMusicVerseBot/app?startapp=artists` opens artists

**To:**

- `/library` → Click "View All Tracks" on artist
- `/profile` → Click artist avatar/name (public profile)
- `/` (Home) → Click back button or Telegram back button

**Data Coupling:**

- Artist list: Refreshed when artist created/edited
- Follow state: Independent per artist (no global cache invalidation)
- Public artists: Fetched from server (50 max, paginated)
- My artists: Fetched from server (all user's artists)

## Business Rules

1. **Artist Creation:**
   - Source track: Required (used for avatar generation)
   - Name uniqueness: No restriction (can have duplicate names)
   - Avatar: Auto-generated from track's Suno model
   - Public vs private: Default private, user can make public

2. **Artist Types:**
   - AI personas: Created from tracks using Suno AI models
   - Custom avatars: Generated based on track's style/mood
   - No manual upload: Avatars must be AI-generated (enforces consistency)

3. **Genre Tags:**
   - Multiple: Can have multiple genre tags
   - Options: Pop, Rock, Hip-Hop, Electronic, R&B, Jazz, Classical, Folk
   - Editable: Can add/remove tags after creation
   - Filter: Genre filter requires exact match

4. **Follow System:**
   - No limit: Can follow unlimited artists
   - Notifications: Artist owner notified when followed
   - Feed: Followed artists' tracks appear in community feed
   - Private artists: Can follow even if artist is private (owner sees follows)

5. **Artist Visibility:**
   - My Artists: Only user's own artists (regardless of public/private)
   - Discover: Only public artists (`is_public = true`)
   - Public artists: Visible to all users, searchable
   - Private artists: Only visible to owner

6. **Track Association:**
   - One-to-many: Artist can have many tracks
   - Many-to-one: Track can only have one artist
   - Assignment: Set during track generation or editing
   - Reassignment: Can change track's artist after creation

7. **Artist Deletion:**
   - Draft artists: Can delete immediately
   - Artists with tracks: Cannot delete (preserve track metadata)
   - Admin override: Admins can delete any artist
   - Tracks remain: When artist deleted, tracks become "unknown artist"

8. **Search Behavior:**
   - Scope: Searches artist name only
   - Case-insensitive: "john" matches "John" and "JOHN"
   - Real-time: Filters as user types
   - Client-side: Filtered in browser (not server query)

9. **Genre Filter:**
   - Exact match: Artist must have selected genre tag
   - Multiple genres: If artist has multiple genres, matches any
   - Combination: Search + genre filter work together (AND logic)

10. **Mobile Optimizations:**
    - Touch targets: Minimum 44×44px
    - FAB: Floating action button for create (bottom-right)
    - Bottom sheet: Artist details open from bottom (mobile only)
    - Haptic feedback: On all interactions
    - Safe areas: Padding for notch/island

11. **Preview Panel (Desktop):**
    - Sticky: Right panel stays visible while scrolling
    - Track limit: Shows first 12 tracks (click to view all)
    - Follow button: Prominent CTA for following
    - Bio truncation: 3 lines max with "Show more" (not implemented in current code)

12. **Artist-Track Relationship:**
    - Source track: Used for avatar generation during creation
    - Track list: Shows all tracks associated with artist
    - Association: Track assigned to artist during generation or editing
    - Unlinked tracks: Artists can exist without tracks (empty list shown)

---

**Next:** [Playlists Page](./09-playlists.md) → Batch 2 continues
