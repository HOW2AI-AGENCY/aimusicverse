# Home / Generation Form

> **Route:** `/`  
> **Module:** Home & Generation  
> **Generated:** 2026-06-26

## Overview

The home page is the primary entry point for MusicVerse AI, serving as both a content discovery hub and the main music generation interface. Users can generate new tracks using Suno AI, browse featured and new content, continue previous drafts, and access creative presets. The page adapts between new user onboarding flow and experienced user dashboard.

**Primary Use Cases:**

- New users: Complete onboarding and generate first track
- Returning users: Quickly continue draft, generate new music, or browse content
- All users: Discover trending tracks, access creative tools, view daily stats

## Layout

### Desktop Layout (8/4 Split)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER: Logo + User Menu + Credits Balance              │
├──────────────────────────────┬──────────────────────────┤
│ Main Column (8/12)           │ Sidebar (4/12)            │
│ ──────────────────────────  │ ──────────────────────── │
│ • New User Hero (if new)     │ • Stats Highlight Banner │
│ • New User Progress (if new)  │ • Gamification Bar       │
│ • Continue Draft Card        │ • Daily Tip Card         │
│ • Quick Create Button        │ • Recent Tracks (5)      │
│ • Creative Presets           │ • Quick Start Cards      │
│ • Featured Tracks            │                          │
│ • New Tracks Grid            │                          │
└──────────────────────────────┴──────────────────────────┘
```

### Mobile Layout (Single Column)

```
┌──────────────────────────┐
│ HEADER                  │
├──────────────────────────┤
│ Gamification Bar         │
│ New User Hero (if new)   │
│ New User Progress        │
│ Continue Draft Card      │
│ Quick Create Button      │
│ Stats Highlight Banner   │
│ Creative Presets         │
│ Featured Tracks          │
│ New Tracks Grid          │
│ Daily Tip Card           │
│ Recent Tracks (5)        │
│ Quick Start Cards        │
└──────────────────────────┘
```

## Fields

### Sections (Conditional Display)

| Section                | Visibility Condition     | Description                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| Gamification Bar       | Authenticated users only | Display daily progress, streak, XP                   |
| New User Hero          | New users only           | Large call-to-action for first generation            |
| New User Progress      | New users only           | Onboarding checklist (profile setup, first track)    |
| Continue Draft Card    | Returning users only     | Resume last generation form from localStorage        |
| Quick Create Button    | Returning users only     | Open generation sheet with one tap                   |
| Stats Highlight Banner | All users                | Platform statistics (tracks generated, active users) |
| Creative Presets       | All users                | Genre cards (Pop, Rock, Electronic, etc.)            |
| Featured Tracks        | All users                | Top tracks with likes/plays                          |
| New Tracks Grid        | All users                | Latest community tracks                              |
| Daily Tip Card         | Returning users only     | Daily generation tip or trick                        |
| Recent Tracks          | Authenticated users only | User's last 5 generated tracks                       |
| Quick Start Cards      | Returning users only     | Action cards (Remix, Extend, Lyrics)                 |

### Quick Create Button (Returning Users)

| Element     | Type         | Behavior                                   |
| ----------- | ------------ | ------------------------------------------ |
| Primary CTA | Large button | Opens GenerateSheet (full generation form) |
| Icon        | Sparkles     | Visual indicator for AI generation         |

### Creative Presets Section

| Field       | Type            | Options                                                                   | Default | Notes                                    |
| ----------- | --------------- | ------------------------------------------------------------------------- | ------- | ---------------------------------------- |
| Genre Cards | Clickable cards | Pop, Rock, Electronic, Hip-Hop, R&B, Jazz, Classical, Country, Lo-Fi, EDM | -       | Pre-fills style field in generation form |

### Featured Tracks Section

| Column      | Format             | Sortable | Filterable | Notes                             |
| ----------- | ------------------ | -------- | ---------- | --------------------------------- |
| Cover Art   | Image (100×100px)  | No       | No         | Lazy-loaded with blur placeholder |
| Title       | Text               | No       | No         | Truncated at 2 lines              |
| Artist      | Text (link)        | No       | No         | Links to artist profile           |
| Play Count  | Number (formatted) | Yes      | No         | "1.2K", "345" format              |
| Likes Count | Number             | No       | No         | Heart icon + count                |
| Duration    | Text (MM:SS)       | No       | No         | Audio length                      |

### New Tracks Grid Section

| Column      | Format       | Sortable | Filterable | Notes                                      |
| ----------- | ------------ | -------- | ---------- | ------------------------------------------ |
| Cover Art   | Image        | No       | No         | 2 columns mobile, 3 columns desktop        |
| Title       | Text         | No       | No         | Truncated at 1 line                        |
| Artist      | Text         | No       | No         | Smaller font below title                   |
| Play Button | Overlay icon | No       | No         | Appears on hover (desktop) or tap (mobile) |

### Recent Tracks Section (Sidebar)

| Column    | Format              | Notes               |
| --------- | ------------------- | ------------------- |
| Cover Art | Thumbnail (48×48px) | Square aspect ratio |
| Title     | Text                | Truncated at 1 line |
| Duration  | Text (MM:SS)        | Gray text           |

---

## Interactions

### Page Load

**Behavior:**

1. Check authentication state via `useAuth()`
2. Load user profile via `useProfile()`
3. Determine if new user via `useUserJourneyState()`
4. Fetch homepage data via `useHomePageData()`:
   - Recent tracks (paginated, 20 per page)
   - Popular/featured tracks (paginated, 20 per page)
5. Load saved draft from localStorage (if exists, < 30 min old)
6. Display sections based on user state

**API Calls:**

- `GET /api/tracks?is_public=true&limit=20&sort=popular` — Featured tracks
- `GET /api/tracks?is_public=true&limit=20&sort=recent` — New tracks
- `GET /api/profiles/{userId}` — User profile data

### Quick Create / Generation Form

**Trigger:** User clicks "Create Track" button (Quick Create) or any genre preset card

**Behavior:**

1. Open `GenerateSheet` (bottom sheet on mobile, modal on desktop)
2. Pre-fill form fields:
   - If genre preset clicked: Set `style` field to genre description
   - If draft exists: Restore all fields from localStorage
3. Display generation form with tabs:
   - **Simple Mode:** Title, Style, Lyrics (optional), Privacy toggle
   - **Custom Mode:** All fields + Advanced Settings

**Generation Form Fields (Custom Mode):**

| Field                | Type       | Required | Default | Validation                  | Notes                       |
| -------------------- | ---------- | -------- | ------- | --------------------------- | --------------------------- |
| Title                | Text input | No       | —       | Max 255 chars               | Auto-generated if empty     |
| Style                | Textarea   | Yes      | —       | Min 10 chars, Max 500 chars | Main prompt field           |
| Lyrics               | Textarea   | No       | —       | Max 5000 chars              | Only if hasVocals=true      |
| Has Vocals           | Toggle     | No       | true    | —                           | Shows/hides lyrics section  |
| Is Public            | Toggle     | No       | true    | —                           | Privacy control             |
| Negative Tags        | Text input | No       | —       | Comma-separated             | Exclude styles/instruments  |
| Vocal Gender         | Select     | No       | —       | "m" / "f" / ""              | Male, female, or neutral    |
| Style Weight         | Slider     | No       | [50]    | 0-100                       | Influence of style prompt   |
| Weirdness Constraint | Slider     | No       | [5]     | 0-10                        | Experimental/creative level |
| Audio Weight         | Slider     | No       | [50]    | 0-100                       | Reference audio influence   |
| Custom Voice ID      | Select     | No       | null    | —                           | Voice cloning model ID      |

**Form Validation:**

| Rule                 | Field | Error Message                                      |
| -------------------- | ----- | -------------------------------------------------- |
| Min length           | Style | "Слишком короткое описание (минимум 10 символов)"  |
| Max length           | Style | "Слишком длинное описание (максимум 500 символов)" |
| Artist names         | Style | "Укажите стиль вместо имён артистов"               |
| Brand names          | Style | "Используйте описание стиля, а не бренды"          |
| Insufficient credits | All   | "Недостаточно кредитов. Требуется X, осталось Y"   |

**Additional Features:**

- **AI Style Boost:** Button to enhance style prompt with AI (adds genre, mood, instruments)
- **Lyrics Assistant:** AI chat interface to generate/edit lyrics
- **Style Presets:** Browse 277+ music styles and 174+ meta-tags
- **Reference Audio:** Upload audio file to influence generation
- **Custom Voice:** Select voice clone model for vocal style
- **Prompt History:** Recent generation prompts (stored in localStorage)
- **Save Template:** Save current settings as reusable template

**Form Submission:**

1. User clicks "Generate" button
2. Validate all required fields
3. Check user has sufficient credits (display warning if not)
4. Show confirmation dialog if credits < 10
5. Call API: `POST /api/generation/generate`
6. Close sheet, show loading toast
7. Poll for completion (every 3 seconds)
8. On success: Show `GenerationResultSheet` with 2 generated tracks
9. Auto-play first track
10. Save prompt to history

**API Request (Generation):**

```typescript
POST /api/generation/generate
{
  prompt: string;           // Style description (required)
  title?: string;           // Track title (optional)
  lyrics?: string;          // Lyrics text (optional)
  is_instrumental: boolean; // false = has vocals
  is_public: boolean;
  model_name?: string;      // "suno-v5" (default)
  custom_voice_id?: string; // Voice clone model ID
  negative_tags?: string;   // Excluded styles
  // Advanced parameters
  vocal_gender?: "m" | "f";
  style_weight?: number;    // 0-100
  weirdness?: number;       // 0-10
  audio_weight?: number;    // 0-100
  reference_audio_id?: string;
}
```

**API Response:**

```typescript
{
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  estimated_time: number; // seconds
  credits_used: number;
}
```

### Track Card Interactions

**Play Button:**

- **Trigger:** Tap/click play icon on track card
- **Behavior:**
  - Stop current track (if playing)
  - Start playback via `usePlayerStore()`
  - Update global audio player state
  - Show mini player at bottom of screen

**Remix Action:**

- **Trigger:** Click "Remix" button on track card
- **Behavior:**
  - Open `GenerateSheet`
  - Pre-fill style field with original track's style
  - Set reference audio to original track
  - Enable "Remix" mode

**Like Action:**

- **Trigger:** Click heart icon
- **Behavior:**
  - Optimistic update (UI updates immediately)
  - Call API: `POST /api/tracks/{id}/like`
  - On error: Revert optimistic update
  - Haptic feedback (light impact)

### Infinite Scroll (Tracks Grid)

**Trigger:** Scroll to bottom of featured/new tracks section

**Behavior:**

1. Check `hasMore` flag
2. If true, call `fetchMore()` function
3. Show loading spinner at bottom
4. Append new tracks to existing list
5. Update `hasMore` flag

### Pull-to-Refresh

**Trigger:** Pull down on mobile (via `PullToRefreshWrapper`)

**Behavior:**

1. Show refresh indicator
2. Call `refresh()` function
3. Refetch all homepage data
4. Reset scroll position to top
5. Hide indicator

### Genre Preset Selection

**Trigger:** Click on genre preset card (Pop, Rock, Electronic, etc.)

**Behavior:**

1. Open `GenerateSheet`
2. Pre-fill style field with genre-specific template:
   - Pop: "Catchy pop song with memorable chorus, modern production, upbeat rhythm"
   - Rock: "Energetic rock with electric guitars, powerful drums, strong vocals"
   - Electronic: "Electronic track with synths, bass, drum machines, danceable beat"
3. Set title to "New {Genre} Track"
4. Focus on style textarea for easy editing

### Continue Draft

**Trigger:** Click "Continue Draft" card (returning users only)

**Conditions:**

- Draft exists in localStorage
- Draft is less than 30 minutes old
- User is authenticated

**Behavior:**

1. Open `GenerateSheet`
2. Restore all form fields from localStorage draft
3. Show "Draft restored" toast
4. Allow user to edit and submit

### New User Flow

**For New Users (first visit):**

1. Display `FirstTimeHeroCard` with large "Create First Track" button
2. Show `NewUserProgress` with checklist:
   - ✅ Set username
   - ⬜ Generate first track
   - ⬜ Explore library
3. Hide Continue Draft, Daily Tip, Recent Tracks sections
4. Simplify layout to focus on first generation

**After First Generation:**

5. Transition to returning user layout
6. Show "🎉 First Track Created!" celebration
7. Highlight "Explore Library" button
8. Update progress checklist

## API Dependencies

| API                 | Method | Path                                             | Trigger        | Notes                   |
| ------------------- | ------ | ------------------------------------------------ | -------------- | ----------------------- |
| Get Featured Tracks | GET    | /api/tracks?is_public=true&sort=popular&limit=20 | Page load      | Paginated               |
| Get New Tracks      | GET    | /api/tracks?is_public=true&sort=recent&limit=20  | Page load      | Paginated               |
| Get Recent Tracks   | GET    | /api/tracks?user_id={userId}&limit=5             | Page load      | Authenticated only      |
| Generate Track      | POST   | /api/generation/generate                         | Form submit    | Creates generation task |
| Like Track          | POST   | /api/tracks/{id}/like                            | Like action    | Optimistic update       |
| Get User Profile    | GET    | /api/profiles/{userId}                           | Page load      | For username, credits   |
| Save Draft          | POST   | /api/drafts/save                                 | Form auto-save | Every 30 seconds        |

## Page Relationships

**From:**

- `/auth` → After authentication, redirect to home
- `/generate` → Legacy redirect (now redirects to home with params)
- Deep links → `t.me/AIMusicVerseBot/app?startapp=generate` opens generation form

**To:**

- `/library` → Click "Explore Library" button or "Library" in nav
- `/studio-v2/track/{trackId}` → Click "Edit in Studio" on track card
- `/profile` → Click username/artist link
- `/artists` → Click artist name on track card
- `/templates` → Click "Save as Template" in generation form
- `/buy-credits` → Click "Get Credits" in insufficient credits warning

**Data Coupling:**

- Global player state: Playing track from card updates player in all pages
- Draft persistence: Form state saved to localStorage, restored across sessions
- Credits balance: Updates after generation affects display globally

## Business Rules

1. **Credit Cost:**
   - Standard generation: 5 credits per track
   - Custom voice: +2 credits (7 total)
   - Reference audio: +1 credit (6 total)
   - Each generation creates 2 versions (A/B), total cost ×2

2. **Generation Time:**
   - Estimated: 60-120 seconds
   - Polling interval: Every 3 seconds
   - Timeout after: 10 minutes
   - Max concurrent: 3 generations per user

3. **Content Policy:**
   - Artist names: Not allowed (trigger warning with replacement suggestions)
   - Brand names: Not allowed
   - Explicit content: Not allowed
   - Copyrighted lyrics: Not allowed
   - Violations: Show error with examples how to fix

4. **Privacy:**
   - Default: All tracks public (`is_public: true`)
   - Private tracks: Require PRO subscription or 10 credits per track
   - Public tracks: Visible in library, searchable, shareable

5. **Draft Persistence:**
   - Auto-save: Every 30 seconds while form open
   - Expiry: 30 minutes after last edit
   - Max drafts: 1 per user (latest only)
   - Storage: localStorage (client-side)

6. **New User Detection:**
   - Criteria: User has < 3 generated tracks
   - Benefits: Simplified UI, onboarding checklist, first track highlighted
   - Transition: After 3rd track, show full returning user layout

7. **Daily Tips:**
   - Rotation: 30 tips total, one per day
   - Topics: Style prompts, lyrics writing, using presets, vocal settings
   - Format: Short title + actionable advice
   - Dismiss: User can dismiss, shows next tip on reload

8. **Genre Presets:**
   - Total: 10 presets (Pop, Rock, Electronic, Hip-Hop, R&B, Jazz, Classical, Country, Lo-Fi, EDM)
   - Templates: Pre-defined style prompts for each genre
   - Customization: User can edit pre-filled style before submission
   - Analytics: Track which presets most used

9. **Track Display:**
   - Featured: Top 20 by likes (weekly recalculation)
   - New: Latest 20 by creation date
   - Recent: User's last 5 tracks
   - Pagination: Load 20 more per scroll (max 100 total)

10. **Mobile Optimizations:**
    - Touch targets: Minimum 44×44px
    - Safe areas: Padding for notch/island
    - Keyboard: Form adapts when keyboard open (scrolls field into view)
    - Haptics: Feedback on all key actions

---

**Next:** [Library Page](./02-library.md) → Track browsing and management
