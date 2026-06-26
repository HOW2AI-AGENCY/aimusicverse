# Community Page

> **Route:** `/community`  
> **Module:** Content Discovery  
> **Generated:** 2026-06-26

## Overview

The Community Page displays social feed with public tracks from all users. Features activity feed, likes, comments, and follows. Similar to social media platform for music discovery.

**Primary Use Cases:**
- Discover new music from community
- Like and comment on tracks
- Follow interesting creators
- Browse trending and recent content

## Layout

### Mobile Layout (Feed)

```
┌──────────────────────────┐
│ HEADER: Back + "Community"│
├──────────────────────────┤
│ Feed Filters             │
│ [Trending][Recent][Following]│
├──────────────────────────┤
│ Activity Feed           │
│ ┌──────────────────────┐ │
│ │ [User Avatar] [Name] │ │
│ │ Shared a track       │ │
│ │ [Track Card]         │ │
│ │ [❤️ 12] [💬 3] [🔄]  │ │
│ ├──────────────────────┤ │
│ │ [User Avatar] [Name] │ │
│ │ Liked a track        │ │
│ │ [Track Card]         │ │
│ │ [❤️ 45] [💬 8] [🔄]  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Desktop Layout (Feed + Sidebar)

```
┌─────────────────────────────────────────────────┐
│  HEADER: "Community"                            │
├──────────────────────┬────────────────────────┤
│ Activity Feed         │ Sidebar (Right)          │
│ (Left Column)         │ ┌──────────────────────┐ │
│ ─────────────────────│ │ Trending Users        │ │
│ Feed Filters          │ │ • User One (245 tr)  │ │
│ [Trending][Recent].. │ │ • User Two (189 tr)  │ │
│ ─────────────────────│ │                        │ │
│ Activity Items        │ │ Popular Tags          │ │
│ [Track/Like/Comment] │ │ #pop #rock #electronic│ │
│ with interactions     │ │                        │ │
│                       │ │ Suggested Users       │ │
│                       │ │ • Follow • Follow     │ │
│                       │ └──────────────────────┘ │
└──────────────────────┴────────────────────────┘
```

## Fields

### Feed Filters

| Filter | Description |
|--------|-------------|
| Trending | Most liked/played tracks (weekly) |
| Recent | Latest activity chronologically |
| Following | Activity from followed users only |

### Activity Item

| Element | Type | Notes |
|---------|------|-------|
| User Avatar | Image (40×40px) | Click to view profile |
| User Name | Text (link) | @username |
| Action Type | Text | "shared a track", "liked a track", "commented" |
| Track Card | Component | Mini track preview |
| Interactions | Buttons | Like, comment, repost |
| Timestamp | Text | "2 hours ago" |

---

## Interactions

### Page Load

**Behavior:**
1. Fetch activity feed via API
2. Setup Telegram Back Button
3. Render feed with loading skeletons

**API Calls:**
- `GET /api/community/feed?filter=trending&limit=20` — Activity feed
- `GET /api/community/trending-users` — Sidebar content

### Filter Change

**Trigger:** Click feed filter (Trending, Recent, Following)

**Behavior:**
1. Update `filter` state
2. Refetch feed with new filter
3. Scroll to top

### Like Track

**Trigger:** Click heart icon on track in feed

**Behavior:**
1. Optimistic update: Toggle like
2. Call API: `POST /api/tracks/{id}/like`
3. Update like count

### Comment on Track

**Trigger:** Click comment icon

**Behavior:**
1. Open comment dialog/bottom sheet
2. User types comment
3. Call API: `POST /api/tracks/{id}/comments`
4. Refresh feed

### Follow User

**Trigger:** Click "Follow" on user in sidebar

**Behavior:**
1. Optimistic update: Show "Following"
2. Call API: `POST /api/social/follow`
3. Update follow button

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Feed | GET | /api/community/feed?filter={type} | Page load, filter change | Activity feed |
| Like Track | POST | /api/tracks/{id}/like | Like action | Toggle like |
| Add Comment | POST | /api/tracks/{id}/comments | Comment action | Create comment |
| Follow User | POST | /api/social/follow | Follow action | Follow user |
| Get Trending Users | GET | /api/community/trending-users | Page load | Sidebar content |

## Page Relationships

**From:**
- `/` (Home) → Click "Community" in navigation
- `/profile` → Click "View Community" on profile

**To:**
- `/profile/{userId}` → Click user avatar/name
- `/library` → Click "View Track" on track card
- `/` (Home) → Back button

## Business Rules

1. **Feed Types:**
   - Trending: Tracks with most likes/plays in last 7 days
   - Recent: All activity sorted by time (newest first)
   - Following: Only activity from followed users

2. **Activity Types:**
   - Track shared: User generated new track
   - Track liked: User liked existing track
   - Comment added: User commented on track

3. **Content Moderation:**
   - Reported content: Hidden from feed pending review
   - Spam filtering: Automated spam detection
   - NSFW filter: Blurs potentially explicit content

---

**Next:** [Album View Page](./12-album-view.md) → Batch 2 complete
