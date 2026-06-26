# Settings Page

> **Route:** `/settings`  
> **Module:** User Profile  
> **Generated:** 2026-06-26

## Overview

The Settings Page allows users to manage their account settings across multiple categories. Features tabbed navigation with profile editing, subscription management, privacy controls, notification preferences, Telegram integration, theme settings, and MIDI configuration. Desktop uses a sidebar layout, while mobile uses horizontal tabs.

**Primary Use Cases:**
- Edit profile (name, username, bio, avatar, banner)
- Manage subscription and billing
- Configure privacy settings (public/private profile)
- Set notification preferences
- Customize Telegram integration
- Adjust theme and appearance
- Configure MIDI download settings

## Layout

### Desktop Layout (Sidebar + Content)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Settings Title                                │
├──────────────────┬──────────────────────────────────────┤
│ Sidebar (Nav)    │ Content Area                           │
│ ─────────────────│ ┌────────────────────────────────────┐ │
│ • Profile        │ │ Profile Tab Content                │ │
│ • Subscription   │ │ [Edit profile form]                │ │
│ • Stats          │ │                                     │ │
│ • Appearance     │ │                                     │ │
│ • Privacy        │ │                                     │ │
│ • Notifications  │ │                                     │ │
│ • Telegram       │ │                                     │ │
│ • MIDI           │ │                                     │ │
│                  │ └────────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

### Mobile Layout (Tabs + Content)

```
┌──────────────────────────┐
│ HEADER: Back Button      │
├──────────────────────────┤
│ Horizontal Tabs          │
│ [Profile][Sub][Stats]... │
├──────────────────────────┤
│ Tab Content              │
│ ┌──────────────────────┐ │
│ │ Profile Form         │ │
│ │ • First Name         │ │
│ │ • Last Name          │ │
│ │ • Username           │ │
│ │ • Bio                │ │
│ │ • Avatar Upload      │ │
│ │ • Banner Upload      │ │
│ │ [Save Changes]       │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

## Fields

### Navigation Tabs

| Tab | Icon | Description | Mobile | Desktop |
|-----|------|-------------|--------|---------|
| Profile | User | Edit name, username, bio, avatar | Yes | Yes |
| Subscription | CreditCard | Manage subscription, billing | Yes | Yes |
| Stats | BarChart3 | View usage statistics | Yes | Yes |
| Appearance | Palette | Theme, language, preferences | Yes | Yes |
| Privacy | Shield | Public profile, data controls | Yes | Yes |
| Notifications | Bell | Push notification prefs | Yes | Yes |
| Telegram | Send | Bot commands, deep links | Yes | Yes |
| MIDI | Music | MIDI/PDF download settings | Yes | Yes |

### Profile Tab

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| First Name | Text input | Yes | Max 100 chars | From Telegram profile |
| Last Name | Text input | No | Max 100 chars | From Telegram profile |
| Username | Text input | Yes | Alphanumeric, underscore, 3-20 chars | Unique across platform |
| Display Name | Text input | No | Max 100 chars | Public display name |
| Bio | Textarea | No | Max 500 chars | Short description |
| Avatar | File upload | No | JPG/PNG, max 5MB, 1:1 ratio | Circular avatar |
| Banner | File upload | No | JPG/PNG, max 10MB, 16:9 ratio | Profile banner |
| Save Button | Button | — | — | Saves all profile fields |

### Subscription Tab

| Component | Description |
|-----------|-------------|
| Subscription Management | Current tier, upgrade button, billing history |
| Invite Friends Card | Referral program, referral code, credits earned |

### Stats Tab

| Stat | Source | Notes |
|------|--------|-------|
| Total Tracks | Track count | All time |
| Total Plays | Play count | All time |
| Total Likes | Like count | All time |
| Credits Used | Sum of generations | Current month |
| Generations | Generation count | Current month |
| Storage Used | File storage | In MB |

### Appearance Tab

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Theme | Select | Light, Dark, System | System | App-wide theme |
| Language | Select | EN, RU, ES, DE, FR, ZH | EN | Interface language |
| Compact Mode | Toggle | — | Off | Dense UI layout |
| Animations | Toggle | — | On | Motion preferences |

### Privacy Tab

| Field | Type | Options | Default | Notes |
|-------|------|---------|---------|-------|
| Public Profile | Toggle | — | On | Profile visibility in search |
| Show Activity | Toggle | — | On | Display recent activity |
| Allow Messages | Toggle | — | On | Receive DMs from followers |
| Data Export | Button | — | — | Download all data (ZIP) |
| Account Deletion | Button | — | — | Request account deletion |

### Notifications Tab

| Setting | Type | Options | Default | Notes |
|---------|------|---------|---------|-------|
| Generation Complete | Toggle | — | On | Push when track ready |
| New Follower | Toggle | — | On | Push when followed |
| New Like | Toggle | — | Off | Push when track liked |
| New Comment | Toggle | — | On | Push when commented |
| Weekly Digest | Toggle | — | On | Weekly stats email |
| Telegram Notifications | Toggle | — | On | Via Telegram bot |

### Telegram Tab

| Setting | Type | Options | Default | Notes |
|---------|------|---------|---------|-------|
| Bot Commands | Toggle | — | On | Enable /generate, /library |
| Deep Links | Toggle | — | On | Allow startapp= links |
| Story Sharing | Toggle | — | On | Share tracks to stories |
| Auto-Open | Toggle | — | Off | Auto-open bot links |
| Unlink Account | Button | — | — | Disconnect Telegram |

### MIDI Tab

| Setting | Type | Options | Default | Notes |
|---------|------|---------|---------|-------|
| MIDI Format | Select | MIDI 0, MIDI 1 | MIDI 0 | File format |
| PDF Format | Toggle | — | On | Include PDF notation |
| notation | Select | Standard, Tab | Standard | Notation type |
| Auto-Download | Toggle | — | Off | Auto-save MIDI after generation |

---

## Interactions

### Page Load

**Behavior:**
1. Fetch user profile via `useSettingsPage()` hook
2. Load notification settings
3. Check subscription status
4. Initialize active tab from URL param or default to "profile"
5. Render settings with loading state if data fetching

**API Calls:**
- `GET /api/profiles/{userId}` — User profile data
- `GET /api/users/{userId}/notification-settings` — Notification preferences
- `GET /api/users/{userId}/subscription` — Subscription status

### Tab Switching

**Trigger:** Click tab trigger (mobile) or sidebar item (desktop)

**Behavior:**
1. Update `activeTab` state
2. Update URL query param: `?tab={tabName}`
3. Load tab content (if not cached)
4. Haptic feedback (light impact)
5. Scroll to top of content area

### Profile Tab - Save Profile

**Trigger:** Click "Save Changes" button

**Behavior:**
1. Validate all required fields (first name, username)
2. Check username uniqueness (if changed)
3. Show loading state on button (spinner)
4. Call API: `PATCH /api/profiles/{userId}`
5. On success:
   - Show "Profile saved!" toast
   - Update local state
   - Reset button state
6. On error:
   - Show error message
   - Highlight invalid fields
   - Reset button state

**API Request:**
```typescript
PATCH /api/profiles/{userId}
{
  first_name: string;
  last_name?: string;
  username: string;
  display_name?: string;
  bio?: string;
  photo_url?: string;  // If avatar uploaded
  banner_url?: string;  // If banner uploaded
}
```

**Validation:**
- Username: 3-20 chars, alphanumeric + underscore only, unique
- First name: Required, max 100 chars
- Bio: Max 500 chars
- Avatar: JPG/PNG, max 5MB, 1:1 ratio preferred
- Banner: JPG/PNG, max 10MB, 16:9 ratio preferred

### Avatar Upload

**Trigger:** Click avatar area, select file

**Behavior:**
1. Open file picker (images only)
2. User selects image file
3. Validate file (JPG/PNG, max 5MB)
4. Show upload progress
5. Upload to Supabase Storage
6. Get public URL
7. Preview new avatar
8. Save on "Save Changes" button click

**API Calls:**
- `POST /api/storage/upload-avatar` — Upload to Supabase
- `PATCH /api/profiles/{userId}` — Update profile with new URL

### Banner Upload

**Trigger:** Click banner area, select file

**Behavior:**
1. Open file picker (images only)
2. User selects image file
3. Validate file (JPG/PNG, max 10MB)
4. Show upload progress
5. Upload to Supabase Storage
6. Get public URL
7. Preview new banner
8. Save on "Save Changes" button click

**API Calls:**
- `POST /api/storage/upload-banner` — Upload to Supabase
- `PATCH /api/profiles/{userId}` — Update profile with new URL

### Subscription Tab - Upgrade

**Trigger:** Click "Upgrade to Premium" button

**Behavior:**
1. Navigate to `/subscription` page
2. Haptic feedback (light impact)
3. Pass source param: `?source=settings`

### Privacy Tab - Toggle Public Profile

**Trigger:** Toggle "Public Profile" switch

**Behavior:**
1. Show warning dialog if turning OFF public:
   - "Your profile will be hidden from other users. Continue?"
2. User confirms
3. Optimistic update: Toggle switch immediately
4. Call API: `PATCH /api/profiles/{userId}` with `is_public: false`
5. On error: Revert toggle
6. Show success/error toast

**Special Rules:**
- Public tracks remain public even if profile is private
- Profile owner always sees own profile (even if private)
- Followers can still see profile if was previously public

### Privacy Tab - Export Data

**Trigger:** Click "Export All Data" button

**Behavior:**
1. Show loading dialog: "Preparing your data..."
2. Call API: `POST /api/users/export-data`
3. Generate ZIP file with:
   - Profile information
   - All tracks (audio files + metadata)
   - All projects
   - All playlists
   - All artists
   - Activity history
4. Download file to device
5. Show "Data exported!" toast
6. Send email with download link (expires in 24h)

**API Calls:**
- `POST /api/users/export-data` — Trigger export job
- `GET /api/users/export-data/{jobId}/download` — Download file

### Privacy Tab - Delete Account

**Trigger:** Click "Delete Account" button

**Behavior:**
1. Show confirmation dialog:
   - "This will permanently delete your account and all data. Are you sure?"
2. User types "DELETE" to confirm
3. Show final warning:
   - "This action cannot be undone. All your tracks, projects, and data will be deleted."
4. User confirms
5. Call API: `DELETE /api/users/{userId}`
6. Log out user
7. Navigate to `/` (home)
8. Show "Account deleted" toast

**API Calls:**
- `DELETE /api/users/{userId}` — Schedule account deletion (30-day grace period)

**Special Rules:**
- Grace period: 30 days to cancel deletion
- Data removal: All user data deleted after grace period
- Content policy: Public tracks >100 likes preserved (transfer to system account)

### Notifications Tab - Toggle Notifications

**Trigger:** Toggle notification switch

**Behavior:**
1. Optimistic update: Toggle switch immediately
2. Call API: `PATCH /api/users/{userId}/notification-settings`
3. On error: Revert toggle
4. Show success toast

**API Request:**
```typescript
PATCH /api/users/{userId}/notification-settings
{
  generation_complete: boolean;
  new_follower: boolean;
  new_like: boolean;
  new_comment: boolean;
  weekly_digest: boolean;
  telegram_notifications: boolean;
}
```

### Telegram Tab - Unlink Account

**Trigger:** Click "Unlink Telegram Account" button

**Behavior:**
1. Show confirmation dialog:
   - "You'll need to re-authenticate with Telegram to continue using MusicVerse AI. Continue?"
2. User confirms
3. Call API: `POST /api/auth/unlink-telegram`
4. Clear Telegram auth state
5. Navigate to `/auth` page
6. Show "Telegram unlinked" toast

**API Calls:**
- `POST /api/auth/unlink-telegram` — Remove Telegram link

### Appearance Tab - Theme Change

**Trigger:** Select theme option (Light/Dark/System)

**Behavior:**
1. Update local theme state immediately
2. Save to localStorage
3. Call API: `PATCH /api/users/{userId}/settings`
4. Apply theme across app

**Special Rules:**
- System: Respects OS dark mode preference
- Light/Dark: Overrides OS preference
- Persistence: Saved per device (localStorage)

### MIDI Tab - Settings Update

**Trigger:** Change MIDI format, notation, or auto-download

**Behavior:**
1. Update local state
2. Save to localStorage
3. Show "Settings saved" toast

**API Calls:**
- No API call (client-side only, applies on next MIDI generation)

## API Dependencies

| API | Method | Path | Trigger | Notes |
|-----|--------|------|---------|-------|
| Get Profile | GET | /api/profiles/{userId} | Page load | User profile data |
| Update Profile | PATCH | /api/profiles/{userId} | Save profile | Update name, username, bio |
| Upload Avatar | POST | /api/storage/upload-avatar | Avatar upload | Returns public URL |
| Upload Banner | POST | /api/storage/upload-banner | Banner upload | Returns public URL |
| Get Notification Settings | GET | /api/users/{userId}/notification-settings | Page load | Current notification prefs |
| Update Notification Settings | PATCH | /api/users/{userId}/notification-settings | Toggle notification | Update preferences |
| Get Subscription | GET | /api/users/{userId}/subscription | Page load | Current tier, billing |
| Export Data | POST | /api/users/export-data | Export button | Triggers ZIP generation |
| Download Export | GET | /api/users/export-data/{jobId}/download | Auto-download | ZIP file download |
| Delete Account | DELETE | /api/users/{userId} | Delete account | Schedules deletion |
| Unlink Telegram | POST | /api/auth/unlink-telegram | Unlink button | Removes Telegram link |

## Page Relationships

**From:**
- `/profile` → Click "Settings" menu item
- `/` (Home) → Click settings icon in header
- Deep link → `t.me/AIMusicVerseBot/app?startapp=settings` opens settings

**To:**
- `/subscription` → Click "Upgrade to Premium" button
- `/settings/blocked-users` → Click "Manage Blocked Users" (Privacy tab)
- `/` (Home) → Click back button or Telegram back button
- `/auth` → After unlinking Telegram or deleting account

**Data Coupling:**
- Profile data: Shared across all pages via `useProfile()` hook
- Notification settings: Fetched on settings page load, used globally
- Theme settings: Applied immediately across all pages
- Privacy settings: Affects profile visibility across platform

## Business Rules

1. **Profile Editing:**
   - Username: Unique across platform, 3-20 chars, alphanumeric + underscore
   - Display name: Optional, defaults to first_name + last_name
   - Bio: Max 500 chars, plain text only
   - Avatar/Banner: Uploads go to Supabase Storage, public URLs saved to profile

2. **Username Uniqueness:**
   - Real-time validation: Check availability as user types
   - Reserved names: System usernames reserved (admin, system, support, etc.)
   - Case-insensitive: "JohnDoe" and "johndoe" considered same
   - Change limit: Once per 30 days (to prevent abuse)

3. **Avatar/Banner Uploads:**
   - File types: JPG, PNG only
   - Size limits: Avatar 5MB, Banner 10MB
   - Dimensions: Avatar 1:1 preferred, Banner 16:9 preferred
   - Storage: Supabase Storage (public bucket)
   - Processing: Auto-resize if too large (Avatar max 400×400, Banner max 2000×1125)

4. **Privacy Settings:**
   - Public profile: Visible in search, browseable by all users
   - Private profile: Only visible to owner, followers lose access
   - Public tracks: Remain public even if profile is private
   - Activity status: Optional (can hide online status)

5. **Notification Settings:**
   - Generation complete: Push when track finishes generating
   - New follower: Push when someone follows user
   - New like: Push when someone likes track (default OFF to avoid spam)
   - Weekly digest: Email summary of stats and activity
   - Telegram notifications: Via Telegram bot (separate from push)

6. **Telegram Integration:**
   - Bot commands: Enable/disable /generate, /library, /help
   - Deep links: Allow/disallow startapp= parameter routing
   - Story sharing: Enable/disable share to Telegram Stories
   - Unlink: Requires re-authentication to use app again

7. **Theme Settings:**
   - System mode: Respects OS dark mode preference
   - Light mode: Always light theme
   - Dark mode: Always dark theme
   - Persistence: Saved per device (localStorage)
   - Animation: Can be disabled for performance/accessibility

8. **MIDI Settings:**
   - Format: MIDI 0 (single track) or MIDI 1 (multi-track)
   - PDF: Include notation sheet (additional file)
   - Notation: Standard notation or guitar tablature
   - Auto-download: Automatically save MIDI after generation (vs manual download)
   - Client-side: Settings stored in localStorage, applied on next generation

9. **Account Deletion:**
   - Grace period: 30 days to cancel deletion
   - Data removal: All user data deleted after grace period
   - Content preservation: Public tracks with >100 likes transferred to system account
   - Cancellation: User can cancel deletion within grace period
   - Notification: Email confirmation sent when deletion scheduled

10. **Data Export:**
    - Format: ZIP file containing JSON (metadata) + audio files
    - Contents: All tracks, projects, playlists, artists, activity history
    - Expiry: Download link expires in 24 hours
    - Email: Copy sent to user's email
    - Size: Can be large (hundreds of MB) for active users

11. **Subscription Management:**
    - Tiers: Free, Premium, Enterprise
    - Billing: Via Telegram Stars or external payment
    - Upgrade: Immediate (prorated if mid-period)
    - Downgrade: Effective at period end
    - Cancellation: Access until period end

12. **Mobile Optimizations:**
    - Tabs: Horizontal scrolling tab bar
    - Touch targets: Minimum 44×44px
    - Haptic feedback: On all toggle switches
    - Safe areas: Padding for notch/island
    - Keyboard: Adapts when keyboard open (scrolls focused field into view)

---

**Next:** [Projects Page](./06-projects.md) → Project management
