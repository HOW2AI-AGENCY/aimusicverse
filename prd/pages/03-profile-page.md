# Profile Page

> **Route:** `/profile`  
> **Module:** User Profile  
> **Generated:** 2026-06-26

## Overview

The Profile Page displays the current user's account information, statistics, and quick access to key features. It serves as a personal dashboard showing user avatar, name, subscription tier, creation stats (tracks, plays, likes), and navigation to artists, analytics, and settings. The page includes a referral invite card and admin panel access for administrators.

**Primary Use Cases:**

- View user profile information and subscription status
- Check personal statistics (tracks generated, plays, likes)
- Navigate to artists, analytics, and settings
- Access admin panel (for administrators)
- Invite friends via referral program
- Log out

## Layout

### Mobile Layout (Single Column)

```
┌──────────────────────────┐
│ HEADER: Back Button     │
├──────────────────────────┤
│ Profile Card             │
│ ┌──────────────────────┐ │
│ │ [Avatar]  Name        │ │
│ │           @username   │ │
│ │           [Premium]   │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Stats Grid (2×2)         │
│ ┌──────────┬──────────┐ │
│ │ Tracks   │ Plays    │ │
│ │ 124      │ 1.2K     │ │
│ ├──────────┼──────────┤ │
│ │ Likes    │ Gen/Mo   │ │
│ │ 89       │ 15       │ │
│ └──────────┴──────────┘ │
├──────────────────────────┤
│ Quick Stats Row          │
│ ┌─────┬──────┬─────┬────┐│
│ │Proj │Pl-list│Art │Pub ││
│ │  8  │   3   │ 2  │ 45 ││
│ └─────┴──────┴─────┴────┘│
├──────────────────────────┤
│ Menu Items (Cards)       │
│ ┌──────────────────────┐ │
│ │ [🎨] AI Artists    → │ │
│ │ [📊] Analytics     → │ │
│ │ [⚙️]  Settings      → │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Invite Friends Card      │
│ (Referral program)       │
├──────────────────────────┤
│ Admin Panel (if admin)   │
├──────────────────────────┤
│ Logout Button            │
└──────────────────────────┘
```

### Desktop Layout (Centered Container)

```
┌─────────────────────────────────────────────────┐
│  HEADER: Logo + Navigation                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Profile Card                                   │
│  ┌───────────────────────────────────────────┐ │
│  │ [Avatar Large]  John Doe                 │ │
│  │                @johndoe                  │ │
│  │                [Premium Badge]            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Stats Grid (4 columns)                         │
│  ┌────────┬──────────┬─────────┬──────────┐   │
│  │ Tracks │ Plays    │ Likes   | Gen/Mo   │   │
│  │  124   │ 1.2K     │  89     │  15      │   │
│  └────────┴──────────┴─────────┴──────────┘   │
│                                                 │
│  Quick Stats Row                                 │
│  ┌──────┬──────────┬──────────┬──────────┐    │
│  │ Proj │ Playlists│ Artists  │ Public   │    │
│  │   8  │    3     │    2     │   45     │    │
│  └──────┴──────────┴──────────┴──────────┘    │
│                                                 │
│  Menu Items (3 columns)                         │
│  ┌─────────────┬─────────────┬─────────────┐   │
│  │ AI Artists →│ Analytics → │ Settings →  │   │
│  └─────────────┴─────────────┴─────────────┘   │
│                                                 │
│  Invite Friends Card                            │
│                                                 │
│  Admin Panel (if admin)                         │
│                                                 │
│  Logout Button                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Fields

### Profile Card

| Field              | Type                                      | Notes                              |
| ------------------ | ----------------------------------------- | ---------------------------------- |
| Avatar             | Image (80×80px mobile, 112×112px desktop) | Telegram photo or default gradient |
| First Name         | Text (H1)                                 | From Telegram profile              |
| Last Name          | Text (H1)                                 | From Telegram profile              |
| Username           | Text (gray)                               | @username from profile             |
| Subscription Badge | Badge                                     | Free / Premium / Enterprise        |

### Stats Grid (2×2 Mobile, 4 Columns Desktop)

| Stat              | Icon          | Source                       | Notes                         |
| ----------------- | ------------- | ---------------------------- | ----------------------------- |
| Tracks            | Music icon    | `stats.totalTracks`          | Total tracks generated        |
| Plays             | Play icon     | `stats.totalPlays`           | Total plays across all tracks |
| Likes             | Heart icon    | `stats.totalLikes`           | Total likes received          |
| Generations/Month | Sparkles icon | `stats.generationsThisMonth` | Generations in current month  |

### Quick Stats Row

| Stat          | Icon             | Source                 | Notes                    |
| ------------- | ---------------- | ---------------------- | ------------------------ |
| Projects      | Folder icon      | `stats.totalProjects`  | Total projects created   |
| Playlists     | List music icon  | `stats.totalPlaylists` | Total playlists created  |
| Artists       | Users icon       | `stats.totalArtists`   | Total AI artists created |
| Public Tracks | Trending up icon | `stats.publicTracks`   | Public track count       |

### Menu Items

| Item       | Icon      | Description                      | Path         | Color  |
| ---------- | --------- | -------------------------------- | ------------ | ------ |
| AI Artists | Users     | Manage your AI artists           | `/artists`   | Purple |
| Analytics  | Bar chart | Detailed statistics              | `/analytics` | Blue   |
| Settings   | Settings  | Profile, notifications, Telegram | `/settings`  | Orange |

### Invite Friends Card

| Field         | Type   | Notes                                       |
| ------------- | ------ | ------------------------------------------- |
| Title         | Text   | "Invite Friends"                            |
| Description   | Text   | "Earn 10 credits for each friend who joins" |
| CTA Button    | Button | "Invite Now" → Opens share dialog           |
| Referral Code | Text   | Unique code for tracking                    |

### Admin Panel Link (Conditional)

| Condition                                          | Display                          |
| -------------------------------------------------- | -------------------------------- |
| User has admin role (`adminAuth.isAdmin === true`) | Show admin card with red styling |
| User is not admin                                  | Hide admin card                  |

---

## Interactions

### Page Load

**Behavior:**

1. Check authentication via `useAuth()`
2. Fetch user profile via `useProfile()`
3. Fetch user statistics via `useUserStats()`:
   - Total tracks
   - Total plays
   - Total likes
   - Generations this month
   - Total projects/playlists/artists
   - Public track count
4. Check admin authorization via `useAdminAuth()`
5. Setup Telegram Back Button for navigation
6. Display profile card with user info
7. Render stats with skeleton loading while fetching

**API Calls:**

- `GET /api/profiles/{userId}` — User profile data
- `GET /api/users/{userId}/stats` — User statistics
- `GET /api/admin/auth` — Admin check (hidden from user)

### Profile Card Interactions

**Avatar/Name Click:**

- **Behavior:** No action (display only)
- **Note:** To edit profile, user must go to Settings

**Subscription Badge Click:**

- **Trigger:** Click on Free/Premium/Enterprise badge
- **Behavior:** Navigate to `/subscription` page
- **Purpose:** Upgrade subscription tier

### Stats Grid Interactions

**Stat Card Hover:**

- **Behavior:** Scale up (1.02x), show shadow
- **Purpose:** Visual feedback for interactive cards

**Stat Card Click:**

- **Trigger:** Click on stat card
- **Behavior:** Navigate to `/analytics` page
- **Purpose:** View detailed analytics

### Menu Item Navigation

**Trigger:** Click on menu item card (AI Artists, Analytics, Settings)

**Behavior:**

1. Haptic feedback (light impact)
2. Navigate to respective route
3. Transition animation (slide right)

**Menu Items:**

- AI Artists → `/artists`
- Analytics → `/analytics`
- Settings → `/settings`

### Admin Panel Access

**Trigger:** Click admin panel card (visible only to admins)

**Behavior:**

1. Navigate to `/admin` (admin overview)
2. Haptic feedback (medium impact)
3. Red styling indicates administrative access

**Security:**

- Server-side check: Only users with `app_role = 'admin'` can access
- Client-side: Card hidden if `adminAuth.isAdmin === false`
- Route guard: `AdminRoute` component protects `/admin/*` routes

### Invite Friends

**Trigger:** Click "Invite Now" button in referral card

**Behavior:**

1. Open Telegram share dialog via `useTelegram()`
2. Pre-fill message with referral link:
   - "Join MusicVerse AI! Use my code {CODE} for 10 free credits:"
   - Deep link: `t.me/AIMusicVerseBot/app?startapp=referral={CODE}`
3. User selects contact(s) to share
4. On successful send: Show "Invitation sent!" toast
5. Track referral via `referral_code` parameter

**API Calls:**

- `GET /api/referrals/code` — Get user's referral code
- `POST /api/referrals/track` — Track referral click (when invite link opened)

### Logout

**Trigger:** Click "Logout" button at bottom of page

**Behavior:**

1. Show confirmation dialog: "Log out of MusicVerse AI?"
2. User confirms
3. Call `logout()` from `useAuth()`
4. Clear Supabase session
5. Clear Telegram auth state
6. Navigate to `/auth` page
7. Haptic feedback (medium impact)

**API Calls:**

- `POST /api/auth/logout` — Server-side session cleanup

### Telegram Back Button

**Behavior:**

1. Setup Telegram Back Button via `useTelegramBackButton()`
2. On click: Navigate to `/` (home page)
3. Fallback path: `/` if navigation fails
4. Visible: Always true on this page

### Hover Effects (Desktop)

**Profile Card:**

- Hover: Shadow increases, avatar scales up (1.05x)
- Transition: Smooth (300ms ease)

**Stat Cards:**

- Hover: Scale up (1.02x), shadow appears
- Transition: Smooth (200ms ease)

**Menu Cards:**

- Hover: Background changes, icon scales (1.1x), shadow appears
- Transition: Smooth (200ms ease)

## API Dependencies

| API               | Method | Path                      | Trigger            | Notes                        |
| ----------------- | ------ | ------------------------- | ------------------ | ---------------------------- |
| Get Profile       | GET    | /api/profiles/{userId}    | Page load          | Returns user profile data    |
| Get User Stats    | GET    | /api/users/{userId}/stats | Page load          | Returns all user statistics  |
| Admin Auth Check  | GET    | /api/admin/auth           | Page load          | Checks admin role            |
| Get Referral Code | GET    | /api/referrals/code       | Invite friends     | Returns user's referral code |
| Track Referral    | POST   | /api/referrals/track      | Invite link opened | Logs referral click          |
| Logout            | POST   | /api/auth/logout          | Logout action      | Clears server session        |

## Page Relationships

**From:**

- `/` (Home) → Click user avatar/name in header
- `/library` → Click profile icon in header
- `/settings` → Click "Back to Profile" button
- Deep link → `t.me/AIMusicVerseBot/app?startapp=profile` opens profile

**To:**

- `/artists` → Click "AI Artists" menu item
- `/analytics` → Click "Analytics" menu item or stat card
- `/settings` → Click "Settings" menu item
- `/subscription` → Click subscription badge
- `/admin/overview` → Click admin panel card (admins only)
- `/` (Home) → Click back button or Telegram back button
- `/auth` → After logout

**Data Coupling:**

- User stats: Fetched from analytics API (cached for 5 minutes)
- Profile data: Shared across all pages via `useProfile()` hook
- Admin state: Checked once per session (cached)
- Referral code: Static per user (generated once, never changes)

## Business Rules

1. **Profile Display:**
   - Avatar priority: Telegram photo → Profile photo → Default gradient
   - Name: Combine first_name + last_name from Telegram
   - Username: Display with @ prefix
   - Subscription: Always show badge (Free/Premium/Enterprise)

2. **Statistics Display:**
   - Real-time: Fetched from API on page load
   - Caching: Stats cached for 5 minutes (TanStack Query)
   - Loading: Show skeleton cards while fetching
   - Zero values: Display "0" (not empty)

3. **Subscription Badges:**
   - Free: Gray badge with "Free" text
   - Premium: Gold badge with "Premium" text
   - Enterprise: Purple badge with "Enterprise" text
   - Clickable: Navigate to subscription page

4. **Admin Access:**
   - Role check: Server-side via `app_role = 'admin'`
   - Client-side: Card hidden if not admin
   - Route protection: `AdminRoute` component guards all `/admin/*` routes
   - Styling: Red color scheme to indicate administrative access

5. **Referral Program:**
   - Code generation: Automatic on account creation
   - Format: 8-character alphanumeric code
   - Reward: 10 credits per successful referral
   - Tracking: Via `referral_code` URL parameter
   - Limit: No limit on referrals
   - Payout: Credits added when referred user generates first track

6. **Logout Behavior:**
   - Confirmation: Always show dialog before logout
   - Session cleanup: Clear both Supabase and Telegram sessions
   - Navigation: Redirect to `/auth` page
   - State reset: Clear all local state (Zustand stores, React Query cache)

7. **Mobile Optimizations:**
   - Touch targets: Minimum 44×44px for all interactive elements
   - Haptic feedback: On all navigation actions
   - Back button: Use Telegram Back Button (consistent with Telegram UX)
   - Safe areas: Padding for notch/island
   - Card spacing: 8px gap for better touch separation

8. **Loading States:**
   - Skeleton screens: While profile/stats loading
   - Staggered animation: Stats load with 100ms delay between cards
   - Empty states: Show placeholder if user has no data
   - Error handling: Show error toast if API call fails

9. **Navigation Behavior:**
   - Menu items: All navigate on click (no separate "Go" button)
   - Haptic feedback: Light impact for navigation
   - Transition: Slide right animation for page transitions
   - Back button: Always returns to home page

10. **Invited Friends Card:**
    - Always visible: Even if user has 0 referrals
    - Dynamic message: "You've invited X friends" (if >0)
    - CTA button: "Invite Now" opens Telegram share dialog
    - Reward display: Shows credits earned from referrals

---

**Next:** [Public Profile Page](./04-public-profile.md) → Public profile viewing
