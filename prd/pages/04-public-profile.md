# Public Profile Page

> **Route:** `/profile/:userId`  
> **Module:** User Profile  
> **Generated:** 2026-06-26

## Overview

The Public Profile Page displays a user's public profile information, statistics, and creative content. Visitors can view the user's bio, social links, tracks, projects, artists, and playlists. The page features a tabbed interface with infinite scroll for content, follow functionality, and sharing capabilities. Profile owners see an "Edit Profile" button, while visitors see a follow button.

**Primary Use Cases:**

- View another user's public profile and content
- Follow/unfollow users
- Browse user's public tracks, projects, artists, playlists
- Share profile via Telegram
- Access own public profile (as profile owner)

## Layout

### Mobile Layout (Single Column with Tabs)

```
┌──────────────────────────┐
│ HEADER: Back Button      │
├──────────────────────────┤
│ Banner Image (top)       │
│ ┌──────────────────────┐ │
│ │   Profile Banner     │ │
│ │   (160px height)     │ │
│ └──────────────────────┘ │
│ Avatar (-40px overlap)   │
│ [Avatar Large]           │
│                          │
│ Name: John Doe           │
│ @johndoe                 │
│ [Premium] [Follow]       │
│                          │
│ Stats Row                │
│ ┌────┬──────┬─────┬────┐│
│ │Trk │Likes │Proj │Pl  ││
│ │124 │ 1.2K │ 8  │ 3  ││
│ └────┴──────┴─────┴────┘│
│                          │
│ Bio (truncated, 3 lines)│
│ "Music producer... [more]"│
│                          │
│ Social Links             │
│ [IG] [TW] [YT] [Web]    │
│                          │
│ Tabs: [Tracks|Projects|Artists|Playlists] │
├──────────────────────────┤
│ Tab Content (Grid/List)  │
│ ┌──────────────────────┐ │
│ │ [Track Card 1]       │ │
│ │ [Track Card 2]       │ │
│ │ ...                  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Centered Container)

```
┌─────────────────────────────────────────────────┐
│  Banner Image (200px height)                    │
│  ┌───────────────────────────────────────────┐  │
│  │           Profile Banner                   │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [Avatar]  Name    [Edit] [Follow] [Share]    │
│             @johndoe  [Premium]                 │
│                                                 │
│  Stats: 124 tracks • 1.2K likes • 8 projects   │
│                                                 │
│  Bio (full text)                                │
│  "Music producer based in LA..."               │
│                                                 │
│  Social Links: [Instagram] [Twitter] [YouTube] │
│                                                 │
│  Tabs: [Tracks] [Projects] [Artists] [Playlists]│
│  ─────────────────────────────────────────────  │
│                                                 │
│  Tab Content (3-column grid)                    │
│  ┌──────────┬──────────┬──────────┐            │
│  │ Track 1  │ Track 2  │ Track 3  │            │
│  ├──────────┼──────────┼──────────┤            │
│  │ Track 4  │ Track 5  │ Track 6  │            │
│  └──────────┴──────────┴──────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Fields

### Header Section

| Field              | Type                                    | Notes                                      |
| ------------------ | --------------------------------------- | ------------------------------------------ |
| Banner Image       | Image (160px H mobile, 200px H desktop) | User's banner or default gradient          |
| Avatar             | Image (100×100px overlapping banner)    | User's photo or default initials           |
| Display Name       | Text (H2)                               | `display_name` or `first_name + last_name` |
| Username           | Text (gray)                             | @username from profile                     |
| Subscription Badge | Badge                                   | Free / Premium / Enterprise                |
| Follow Button      | Button                                  | "Follow" / "Following" (visitors only)     |
| Edit Button        | Button                                  | "Edit Profile" (profile owner only)        |
| Share Button       | Icon button                             | Share profile via Telegram                 |

### Stats Row

| Stat        | Icon            | Source                 | Notes                         |
| ----------- | --------------- | ---------------------- | ----------------------------- |
| Tracks      | Music icon      | `stats.tracksCount`    | Total public tracks           |
| Likes       | Heart icon      | `stats.likesReceived`  | Total likes received          |
| Projects    | Folder icon     | `stats.projectsCount`  | Total public projects         |
| Playlists   | List music icon | `stats.playlistsCount` | Total public playlists        |
| Total Plays | Play icon       | `stats.totalPlays`     | Total plays across all tracks |

### Bio Section

| Field       | Type              | Notes                                      |
| ----------- | ----------------- | ------------------------------------------ |
| Bio Text    | Text (multi-line) | User's bio, truncated at 3 lines on mobile |
| "Show More" | Link              | Expands full bio text (mobile only)        |

### Social Links

| Platform  | Icon           | Field                    | Notes             |
| --------- | -------------- | ------------------------ | ----------------- |
| Instagram | Instagram icon | `social_links.instagram` | Opens profile URL |
| Twitter   | Twitter icon   | `social_links.twitter`   | Opens profile URL |
| YouTube   | YouTube icon   | `social_links.youtube`   | Opens channel URL |
| Website   | Globe icon     | `social_links.website`   | Opens website URL |

### Tabs

| Tab       | Content               | Default |
| --------- | --------------------- | ------- |
| Tracks    | Public tracks grid    | Yes     |
| Projects  | Public projects list  | No      |
| Artists   | AI artists grid       | No      |
| Playlists | Public playlists list | No      |

### Tab Content: Tracks

| Column      | Format             | Notes                |
| ----------- | ------------------ | -------------------- |
| Cover Art   | Image (200×200px)  | Click to play        |
| Title       | Text               | Truncated at 2 lines |
| Play Count  | Number             | "1.2K" format        |
| Likes       | Heart icon + count | Optimistic update    |
| Duration    | Text (MM:SS)       | Audio length         |
| Play Button | Overlay            | Appears on hover/tap |

### Tab Content: Projects

| Column      | Format | Notes                              |
| ----------- | ------ | ---------------------------------- |
| Cover Art   | Image  | Project cover or first track cover |
| Title       | Text   | Project name                       |
| Track Count | Badge  | "12 tracks"                        |
| Created At  | Date   | "Jan 15, 2026"                     |
| Open Button | Button | Opens project detail               |

### Tab Content: Artists

| Column       | Format            | Notes                 |
| ------------ | ----------------- | --------------------- |
| Avatar       | Image (100×100px) | AI-generated portrait |
| Name         | Text              | Artist name           |
| Style        | Text (chips)      | Genre tags            |
| Tracks Count | Badge             | "45 tracks"           |

### Tab Content: Playlists

| Column      | Format       | Notes                                  |
| ----------- | ------------ | -------------------------------------- |
| Cover Art   | Image        | Playlist cover or grid of track covers |
| Title       | Text         | Playlist name                          |
| Track Count | Badge        | "20 tracks"                            |
| Duration    | Text (MM:SS) | Total duration                         |
| Owner       | Text         | Username (if not profile owner)        |

---

## Interactions

### Page Load

**Behavior:**

1. Extract `userId` from URL params
2. Fetch profile data via `useQuery()`:
   - User info (name, username, bio, banner, social links)
   - Profile stats (tracks, likes, projects, playlists counts)
3. Check if current user is profile owner via `isOwner` flag
4. Fetch tab content based on `activeTab` state:
   - Tracks: Public tracks with pagination
   - Projects: Public projects
   - Artists: AI artists
   - Playlists: Public playlists
5. Setup Telegram Back Button
6. Render profile with loading skeletons

**API Calls:**

- `GET /api/profiles/{userId}` — Profile data
- `GET /api/profiles/{userId}/stats` — Profile statistics
- `GET /api/tracks?user_id={userId}&is_public=true` — Public tracks
- `GET /api/projects?user_id={userId}&is_public=true` — Public projects
- `GET /api/artists?user_id={userId}&is_public=true` — Public artists
- `GET /api/playlists?user_id={userId}&is_public=true` — Public playlists

### Tab Switching

**Trigger:** Click tab trigger (Tracks, Projects, Artists, Playlists)

**Behavior:**

1. Update `activeTab` state
2. Fetch tab content (if not cached)
3. Show loading skeleton for tab content
4. Render content when fetched
5. Haptic feedback (light impact)

**Persistence:**

- Tab selection NOT persisted (resets to "tracks" on page load)

### Follow / Unfollow

**Trigger:** Click follow button (visitors only)

**Behavior:**

1. Check if current user is following profile owner
2. If not following:
   - Optimistic update: Show "Following" immediately
   - Call API: `POST /api/social/follow`
   - On error: Revert to "Follow"
   - Increment `followers_count` by 1
3. If following:
   - Show confirmation dialog: "Unfollow @{username}?"
   - User confirms
   - Optimistic update: Show "Follow" immediately
   - Call API: `DELETE /api/social/follow`
   - On error: Revert to "Following"
   - Decrement `followers_count` by 1
4. Haptic feedback (medium impact)

**API Calls:**

- `POST /api/social/follow` — Follow user
- `DELETE /api/social/follow` — Unfollow user

**Special Rules:**

- Cannot follow self (button hidden for profile owner)
- Follow count updates in real-time (optimistic)
- Follow state persisted to database

### Edit Profile

**Trigger:** Click "Edit Profile" button (profile owner only)

**Behavior:**

1. Navigate to `/settings?tab=profile`
2. Scroll to profile edit section
3. Haptic feedback (light impact)

**Visibility:**

- Only shown when `isOwner === true`
- Replaces follow button for profile owners

### Share Profile

**Trigger:** Click share button

**Behavior:**

1. Generate share link: `https://t.me/AIMusicVerseBot/app?startapp=profile={userId}`
2. Open Telegram share dialog via `useTelegram()`
3. Pre-fill message: "Check out @{username}'s profile on MusicVerse AI!"
4. User selects contact(s) to share
5. On success: Show "Profile shared!" toast
6. Haptic feedback (light impact)

### Bio Expansion

**Trigger:** Click "Show more" / "Show less" link (mobile only)

**Behavior:**

1. Toggle `showFullBio` state
2. Expand/collapse bio text
3. Update link text accordingly
4. Smooth height transition

**Desktop:**

- Bio always shown in full (no truncation)
- No "Show more" link

### Social Links

**Trigger:** Click social link icon

**Behavior:**

1. Open URL in new tab
2. Haptic feedback (light impact)
3. External link icon indicator

**Validation:**

- Only show icons for platforms with valid URLs
- Handle invalid URLs gracefully (show error toast)

### Track Card Interactions (Tracks Tab)

**Play Track:**

- Trigger: Click play button or cover art
- Behavior: Start global audio player, update mini player

**Like Track:**

- Trigger: Click heart icon
- Behavior: Optimistic update, API call, revert on error

**Open Track:**

- Trigger: Click track title
- Behavior: Navigate to `/library` (opens track detail panel)

### Infinite Scroll (All Tabs)

**Trigger:** Scroll to bottom of tab content

**Behavior:**

1. Check `hasNextPage` flag
2. If true: Fetch next page (12 items)
3. Show loading spinner at bottom
4. Append new items to list
5. Update virtualized list
6. If false: Show "End of list" message

### Empty States

**No Content:**

- Trigger: Tab has no public content
- Behavior: Show empty state with:
  - Icon (music note, folder, user, list)
  - Message: "No public tracks yet"
  - Subtext: (for profile owner) "Make your tracks public to share them"

**Profile Not Public:**

- Trigger: Profile owner has `is_public = false`
- Behavior: Show warning to visitors:
  - "This profile is private"
  - (Profile owner sees: "Your profile is private. Make it public in settings.")

### Profile Owner Actions

**Visibility Differences:**

- **Follow Button:** Replaced with "Edit Profile" button
- **Private Profile Warning:** Only visitors see warning
- **Empty State Messaging:** Different for owner vs visitors

## API Dependencies

| API                  | Method | Path                                           | Trigger         | Notes                       |
| -------------------- | ------ | ---------------------------------------------- | --------------- | --------------------------- |
| Get Profile          | GET    | /api/profiles/{userId}                         | Page load       | Returns profile data        |
| Get Profile Stats    | GET    | /api/profiles/{userId}/stats                   | Page load       | Returns statistics          |
| Get Public Tracks    | GET    | /api/tracks?user_id={userId}&is_public=true    | Tab load        | Paginated (12/page)         |
| Get Public Projects  | GET    | /api/projects?user_id={userId}&is_public=true  | Tab load        | Paginated                   |
| Get Public Artists   | GET    | /api/artists?user_id={userId}&is_public=true   | Tab load        | Paginated                   |
| Get Public Playlists | GET    | /api/playlists?user_id={userId}&is_public=true | Tab load        | Paginated                   |
| Follow User          | POST   | /api/social/follow                             | Follow action   | Creates follow relationship |
| Unfollow User        | DELETE | /api/social/follow                             | Unfollow action | Removes follow relationship |
| Check Follow Status  | GET    | /api/social/follow-status?userId={userId}      | Page load       | Returns isFollowing boolean |

## Page Relationships

**From:**

- `/library` → Click artist name on track card
- `/` (Home) → Click username in track card
- Deep link → `t.me/AIMusicVerseBot/app?startapp=profile={userId}` opens profile
- Other profiles → Click username in comments/mentions

**To:**

- `/settings?tab=profile` → Click "Edit Profile" (profile owner only)
- `/library` → Click track in Tracks tab
- `/projects/{id}` → Click project in Projects tab
- `/artists` → Click artist in Artists tab
- `/playlists/{id}` → Click playlist in Playlists tab
- `/` (Home) → Click back button or Telegram back button

**Data Coupling:**

- Follow state: Fetched on page load, updates via API calls
- Profile stats: Cached for 5 minutes (TanStack Query)
- Tab content: Each tab cached independently (invalidated on follow/unfollow)

## Business Rules

1. **Privacy Controls:**
   - Public profiles: Visible to all users, searchable
   - Private profiles: Only visible to profile owner (visitors see warning)
   - Content filter: Only public content displayed (`is_public = true`)
   - Profile owner: Always sees own profile (even if private)

2. **Follow System:**
   - Mutual follow: No restriction (unlike Twitter's "follow back" model)
   - Follow limit: No limit on following/followers
   - Notifications: Profile owner notified when followed
   - Feed: Following users' tracks appears in community feed

3. **Content Display:**
   - Tracks only: Show `is_public = true` tracks
   - Pagination: 12 items per page, infinite scroll
   - Sort order: Tracks by `created_at DESC` (newest first)
   - Empty state: Show appropriate message based on ownership

4. **Social Links:**
   - Display: All platforms shown if URL present
   - Validation: URLs validated before save
   - Open in: New tab (external links)
   - Tracking: Link clicks tracked for analytics

5. **Profile Stats:**
   - Real-time: Fetched from API on page load
   - Caching: 5-minute cache (TanStack Query)
   - Scope: Only public content counted
   - Zero values: Display "0" (not hidden)

6. **Bio Display:**
   - Mobile: Truncated at 3 lines with "Show more" link
   - Desktop: Always shown in full
   - Empty bio: Show "No bio yet" (for owner) or hide (for visitors)
   - Formatting: Plain text only (no markdown/HTML)

7. **Banner Image:**
   - Default: Gradient pattern if no custom banner
   - Dimensions: 160px H (mobile), 200px H (desktop)
   - Upload: Via settings page (profile owner only)
   - Ratio: 16:9 recommended

8. **Avatar Display:**
   - Overlap: Positioned -40px from bottom of banner
   - Size: 100×100px (circles)
   - Default: Initials from username if no photo
   - Upload: Via Telegram profile or settings page

9. **Tab Content:**
   - Independent loading: Each tab fetches its own data
   - Caching: Tab content cached on first load (5 min)
   - Reset: Tab selection resets to "tracks" on page load
   - Empty states: Different message per tab type

10. **Share Functionality:**
    - Link format: Deep link with `startapp=profile={userId}`
    - Message: Pre-filled with username
    - Platform: Telegram native share dialog
    - Tracking: Share events logged for analytics

11. **Mobile Optimizations:**
    - Touch targets: Minimum 44×44px
    - Haptic feedback: On all interactive elements
    - Safe areas: Padding for notch/island
    - Bio truncation: 3 lines max with expand button
    - Tab bar: Sticky at top (scrolls with page)

12. **Profile Owner vs Visitor:**
    - Edit button: Only for profile owner
    - Follow button: Only for visitors
    - Private profile: Warning for visitors, owner sees normal view
    - Empty states: Different messaging based on ownership

---

**Next:** [Settings Page](./05-settings.md) → User settings management
