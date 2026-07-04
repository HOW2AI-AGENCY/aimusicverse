# MusicVerse AI — Product Requirements Document

> **Generated:** 2026-06-26  
> **Version:** 1.0  
> **Framework:** React 19 + TypeScript 5.9 + Vite 5.0  
> **Backend:** Supabase (PostgreSQL + Edge Functions)  
> **Platform:** Telegram Mini App

---

## System Overview

**MusicVerse AI** is a professional AI-powered music creation platform delivered as a Telegram Mini App. The application enables users to generate original music using Suno AI v5, edit tracks with advanced stem separation, manage creative projects, and share content with a global community.

### Core Value Proposition

- **AI Music Generation**: Generate original tracks (30-90 seconds) using text prompts with 277+ musical styles and 174+ meta-tags
- **Advanced Editing Studio**: Unified Studio with stem separation (vocals, drums, bass, instruments), waveform editing, MIDI transcription (6 AI models), and A/B version comparison
- **Social Features**: Public profiles, artist personas, playlists, community feed, likes, comments, and following
- **Telegram Integration**: Deep linking, bot commands, inline search, stories sharing, and Stars payment integration
- **Monetization**: Credit-based system with PRO subscription tiers, Stars payments via Telegram, and referral rewards

### Primary Users

| User Type                  | Description                            | Key Features                                                         |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| **Casual Creators**        | Amateur musicians exploring AI music   | Quick generation form, preset templates, basic editing               |
| **Professional Musicians** | Producers and artists using AI as tool | Advanced studio, stem mixing, MIDI transcription, version management |
| **Community Members**      | Listeners and discoverers              | Public library, playlists, artist profiles, social features          |
| **Administrators**         | Platform moderators and operators      | Admin dashboard, user management, content moderation, analytics      |

### Platform Context

**Telegram Mini App Architecture** - The application runs entirely within Telegram's webview, with specific mobile constraints:

- Touch-first UI with 44×44px minimum targets
- Safe area handling for notches/islands
- Keyboard height tracking for input forms
- Audio element pooling (iOS Safari limit of 10 concurrent elements)
- Single global audio player managed by `GlobalAudioProvider`
- Deep linking via `t.me/AIMusicVerseBot/app?startapp=PARAM`

---

## Module Overview

| Module                          | Pages                                                                                                | Core Functionality                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Authentication & Onboarding** | Auth, Onboarding                                                                                     | Telegram OAuth integration, new user flow, profile setup                                                 |
| **Home & Generation**           | Index (Home)                                                                                         | Music generation form with Suno AI integration, real-time result display                                 |
| **Library & Discovery**         | Library, Artists, Playlists, Blog, Community                                                         | Browse public tracks, discover artists, explore playlists, read blog, community feed                     |
| **User Profile**                | ProfilePage, PublicProfilePage, Settings                                                             | Manage profile, view public profiles, configure settings, blocked users                                  |
| **Projects & Creativity**       | Projects, ProjectDetail, Templates, MusicLab, LyricsStudio, VoiceLibraryPage, VoiceHistoryPage       | Organize creative work, use templates, experiment in Music Lab, edit lyrics, voice cloning               |
| **Studio V2**                   | StudioHubPage, NewStudioProjectPage, UnifiedStudioPage, GuitarStudio, AudioHub, ReferenceAudioDetail | Advanced editing with stem separation, mixing, MIDI transcription, section replacement                   |
| **Player & Playback**           | MobilePlayerPage                                                                                     | Fullscreen mobile player with waveform visualization                                                     |
| **Analytics**                   | Analytics                                                                                            | Personal creation statistics, performance insights                                                       |
| **Rewards & Growth**            | Rewards, Referral                                                                                    | Daily bonuses, achievement system, referral program                                                      |
| **Admin**                       | 18 admin pages                                                                                       | System overview, user management, content moderation, analytics dashboards, economy, bot/telegram config |
| **Payments**                    | BuyCredits, Subscription, MobilePaymentScreen, PaymentSuccess, PaymentFail                           | Credit purchases, subscription management, Stars integration                                             |
| **Legal**                       | Terms, Privacy, Pricing                                                                              | Legal documentation and pricing information                                                              |
| **Utility**                     | NotFound, ErrorPage                                                                                  | Error handling and 404 pages                                                                             |

---

## Page Inventory

### Core User Pages (10 pages)

| #   | Page Name              | Route              | Module                      | Doc Link                                |
| --- | ---------------------- | ------------------ | --------------------------- | --------------------------------------- |
| 1   | Home / Generation Form | `/`                | Home & Generation           | [→](./pages/01-home-generation-form.md) |
| 2   | Library                | `/library`         | Library & Discovery         | [→](./pages/02-library.md)              |
| 3   | Profile Page           | `/profile`         | User Profile                | [→](./pages/03-profile-page.md)         |
| 4   | Public Profile         | `/profile/:userId` | User Profile                | [→](./pages/04-public-profile.md)       |
| 5   | Settings               | `/settings`        | User Profile                | [→](./pages/05-settings.md)             |
| 6   | Projects               | `/projects`        | Projects & Creativity       | [→](./pages/06-projects.md)             |
| 7   | Project Detail         | `/projects/:id`    | Projects & Creativity       | [→](./pages/07-project-detail.md)       |
| 8   | Onboarding             | `/onboarding`      | Authentication & Onboarding | [→](./pages/08-onboarding.md)           |
| 9   | Analytics              | `/analytics`       | Analytics                   | [→](./pages/09-analytics.md)            |
| 10  | Auth                   | `/auth`            | Authentication & Onboarding | [→](./pages/10-auth.md)                 |

### Content Discovery Pages (5 pages)

| #   | Page Name  | Route        | Module              | Doc Link                      |
| --- | ---------- | ------------ | ------------------- | ----------------------------- |
| 11  | Artists    | `/artists`   | Library & Discovery | [→](./pages/11-artists.md)    |
| 12  | Playlists  | `/playlists` | Library & Discovery | [→](./pages/12-playlists.md)  |
| 13  | Blog       | `/blog`      | Library & Discovery | [→](./pages/13-blog.md)       |
| 14  | Community  | `/community` | Library & Discovery | [→](./pages/14-community.md)  |
| 15  | Album View | `/album/:id` | Library & Discovery | [→](./pages/15-album-view.md) |

### Creative Tools Pages (7 pages)

| #   | Page Name                 | Route                  | Module                | Doc Link                                   |
| --- | ------------------------- | ---------------------- | --------------------- | ------------------------------------------ |
| 16  | Templates                 | `/templates`           | Projects & Creativity | [→](./pages/16-templates.md)               |
| 17  | Music Lab                 | `/music-lab`           | Projects & Creativity | [→](./pages/17-music-lab.md)               |
| 18  | Lyrics Studio             | `/lyrics-studio`       | Projects & Creativity | [→](./pages/18-lyrics-studio.md)           |
| 19  | Voice Library             | `/voices`              | Projects & Creativity | [→](./pages/19-voice-library.md)           |
| 20  | Voice History             | `/voices/history`      | Projects & Creativity | [→](./pages/20-voice-history.md)           |
| 21  | Creative Tools (Redirect) | `/creative-tools`      | Projects & Creativity | [→](./pages/21-creative-tools-redirect.md) |
| 22  | Professional Dashboard    | `/professional-studio` | Projects & Creativity | [→](./pages/22-professional-dashboard.md)  |

### Studio Pages (7 pages)

| #   | Page Name                | Route                           | Module    | Doc Link                                  |
| --- | ------------------------ | ------------------------------- | --------- | ----------------------------------------- |
| 23  | Studio Hub               | `/studio-v2`                    | Studio V2 | [→](./pages/23-studio-hub.md)             |
| 24  | New Studio Project       | `/studio-v2/new`                | Studio V2 | [→](./pages/24-new-studio-project.md)     |
| 25  | Unified Studio (Project) | `/studio-v2/project/:projectId` | Studio V2 | [→](./pages/25-unified-studio-project.md) |
| 26  | Unified Studio (Track)   | `/studio-v2/track/:trackId`     | Studio V2 | [→](./pages/26-unified-studio-track.md)   |
| 27  | Guitar Studio            | `/guitar-studio`                | Studio V2 | [→](./pages/27-guitar-studio.md)          |
| 28  | Audio Hub                | `/audio-hub`                    | Studio V2 | [→](./pages/28-audio-hub.md)              |
| 29  | Reference Audio Detail   | `/reference/:id`                | Studio V2 | [→](./pages/29-reference-audio-detail.md) |

### Player Pages (1 page)

| #   | Page Name     | Route              | Module            | Doc Link                         |
| --- | ------------- | ------------------ | ----------------- | -------------------------------- |
| 30  | Mobile Player | `/player/:trackId` | Player & Playback | [→](./pages/30-mobile-player.md) |

### Rewards & Growth Pages (2 pages)

| #   | Page Name | Route       | Module           | Doc Link                    |
| --- | --------- | ----------- | ---------------- | --------------------------- |
| 31  | Rewards   | `/rewards`  | Rewards & Growth | [→](./pages/31-rewards.md)  |
| 32  | Referral  | `/referral` | Rewards & Growth | [→](./pages/32-referral.md) |

### Payment Pages (5 pages)

| #   | Page Name             | Route              | Module   | Doc Link                                 |
| --- | --------------------- | ------------------ | -------- | ---------------------------------------- |
| 33  | Buy Credits           | `/buy-credits`     | Payments | [→](./pages/33-buy-credits.md)           |
| 34  | Subscription          | `/subscription`    | Payments | [→](./pages/34-subscription.md)          |
| 35  | Mobile Payment Screen | `/payment`         | Payments | [→](./pages/35-mobile-payment-screen.md) |
| 36  | Payment Success       | `/payment/success` | Payments | [→](./pages/36-payment-success.md)       |
| 37  | Payment Fail          | `/payment/fail`    | Payments | [→](./pages/37-payment-fail.md)          |

### Legal & Info Pages (4 pages)

| #   | Page Name        | Route          | Module | Doc Link                       |
| --- | ---------------- | -------------- | ------ | ------------------------------ |
| 38  | Terms of Service | `/terms`       | Legal  | [→](./pages/38-terms.md)       |
| 39  | Privacy Policy   | `/privacy`     | Legal  | [→](./pages/39-privacy.md)     |
| 40  | Pricing          | `/pricing`     | Legal  | [→](./pages/40-pricing.md)     |
| 41  | Music Graph      | `/music-graph` | Legal  | [→](./pages/41-music-graph.md) |

### Settings Sub-pages (1 page)

| #   | Page Name     | Route                     | Module       | Doc Link                         |
| --- | ------------- | ------------------------- | ------------ | -------------------------------- |
| 42  | Blocked Users | `/settings/blocked-users` | User Profile | [→](./pages/42-blocked-users.md) |

### Admin Pages (18 pages)

| #   | Page Name             | Route                     | Module | Doc Link                                 |
| --- | --------------------- | ------------------------- | ------ | ---------------------------------------- |
| 43  | Admin Overview        | `/admin/overview`         | Admin  | [→](./pages/43-admin-overview.md)        |
| 44  | Admin Analytics       | `/admin/analytics`        | Admin  | [→](./pages/44-admin-analytics.md)       |
| 45  | Generation Stats      | `/admin/generation-stats` | Admin  | [→](./pages/45-generation-stats.md)      |
| 46  | Performance Dashboard | `/admin/performance`      | Admin  | [→](./pages/46-performance-dashboard.md) |
| 47  | Economy               | `/admin/economy`          | Admin  | [→](./pages/47-economy.md)               |
| 48  | Users                 | `/admin/users`            | Admin  | [→](./pages/48-admin-users.md)           |
| 49  | User Balances         | `/admin/balances`         | Admin  | [→](./pages/49-user-balances.md)         |
| 50  | Tracks                | `/admin/tracks`           | Admin  | [→](./pages/50-admin-tracks.md)          |
| 51  | Moderation            | `/admin/moderation`       | Admin  | [→](./pages/51-admin-moderation.md)      |
| 52  | Feedback              | `/admin/feedback`         | Admin  | [→](./pages/52-admin-feedback.md)        |
| 53  | Tariffs               | `/admin/tariffs`          | Admin  | [→](./pages/53-tariffs.md)               |
| 54  | Bot                   | `/admin/bot`              | Admin  | [→](./pages/54-bot.md)                   |
| 55  | Telegram              | `/admin/telegram`         | Admin  | [→](./pages/55-telegram.md)              |
| 56  | Payments              | `/admin/payments`         | Admin  | [→](./pages/56-payments.md)              |
| 57  | Logs                  | `/admin/logs`             | Admin  | [→](./pages/57-logs.md)                  |
| 58  | Deeplinks             | `/admin/deeplinks`        | Admin  | [→](./pages/58-deeplinks.md)             |
| 59  | Alerts                | `/admin/alerts`           | Admin  | [→](./pages/59-alerts.md)                |
| 60  | Broadcast             | `/admin/broadcast`        | Admin  | [→](./pages/60-broadcast.md)             |

### Utility Pages (3 pages)

| #   | Page Name         | Route       | Module  | Doc Link                             |
| --- | ----------------- | ----------- | ------- | ------------------------------------ |
| 61  | Not Found (404)   | `*`         | Utility | [→](./pages/61-not-found.md)         |
| 62  | Error Page        | `/error`    | Utility | [→](./pages/62-error-page.md)        |
| 63  | Generate Redirect | `/generate` | Utility | [→](./pages/63-generate-redirect.md) |

**Total Pages: 63**

---

## Global Notes

### Technology Stack

**Frontend:**

- React 19.2 + TypeScript 5.9
- Vite 5.0 (build system, dev server)
- React Router 6 (client-side routing)
- Tailwind CSS 3.4 (styling)
- shadcn/ui + Radix UI (component library)
- TanStack Query 5.90 (server state)
- Zustand 5.0 (global state)
- Tone.js 14.9 (audio processing)
- Wavesurfer.js 7.8 (waveform visualization)
- @twa-dev/sdk 8.0.2 (Telegram Mini App SDK)

**Backend:**

- Supabase (PostgreSQL database)
- Supabase Edge Functions (serverless)
- Supabase Storage (file hosting)
- Supabase Auth (authentication)
- Row Level Security (RLS) policies

**State Management Architecture:**

| Layer               | Technology                | Purpose                                          |
| ------------------- | ------------------------- | ------------------------------------------------ |
| **Global State**    | Zustand stores (8 stores) | Complex UI state (player, studio, mixer, lyrics) |
| **Server State**    | TanStack Query            | API responses, caching, optimistic updates       |
| **Form State**      | React Hook Form + Zod     | Form validation, draft persistence               |
| **Component State** | React hooks (useState)    | Local component state                            |

**Key Zustand Stores:**

- `playerStore` — Audio playback state, queue, current track
- `useUnifiedStudioStore` — Studio state (38KB, largest store)
- `useLyricsHistoryStore` — Lyrics editing history
- `useMixerHistoryStore` — Mixer state history
- `useStudioProjectStore` — Project management
- `useStemMixerStore` — Stem mixing controls
- `usePlaybackStore` — Playback controls
- `generationWizardStore` — Generation form flow

### Audio System Architecture

**Single Audio Source Pattern** — The entire app uses ONE `<audio>` element managed by `GlobalAudioProvider`:

- **Provider:** `src/components/GlobalAudioProvider.tsx`
- **Hook:** `usePlayerStore()` or `useGlobalAudioPlayer()`
- **Store:** `playerStore` (Zustand)
- **Player Modes:** Compact → Expanded → Fullscreen (mobile)
- **Audio Element Pool:** `src/lib/audioElementPool.ts` — Reuse audio elements (iOS Safari crash prevention)
- **Audio Cache:** `src/lib/audioCache.ts` — Pre-computed waveforms, CDN optimization

**Critical:** Never create multiple `<audio>` elements. Always use `usePlayerStore()` or `useGlobalAudioPlayer()`.

### Track Versioning System (A/B)

Every music generation creates **2 versions (A/B)**:

**Database Schema:**

- `tracks` table has `active_version_id` (FK to track_versions)
- `track_versions` table has `is_primary` (boolean), `version_label` ('A'/'B'), `clip_index` (0/1)
- Version A (clip_index: 0) is initially primary
- Switching versions updates BOTH `is_primary` AND `active_version_id`

**Key Hooks:**

- `useTrackVersions(trackId)` — Fetch all versions
- `useVersionSwitcher(trackId)` — Switch primary version
- `useActiveVersion(trackId)` — Get current active version

**Changelog:** All version changes logged to `track_change_log` table with `change_type`, `old_value`, `new_value`.

### Permission Model

**Authentication:**

- Telegram OAuth via `@twa-dev/sdk`
- Supabase Auth with RLS policies
- User sessions managed via `AuthContext`

**Access Control:**

| Role                   | Access Level          | Protected Routes                                            |
| ---------------------- | --------------------- | ----------------------------------------------------------- |
| **Guest**              | Public content only   | `/artists`, `/playlists`, `/blog`, `/community` (read-only) |
| **Authenticated User** | Full user features    | All routes except `/admin/*`                                |
| **Admin**              | System administration | `/admin/*` routes                                           |

**Route Guards:**

- `ProtectedRoute` — Requires authentication
- `AdminRoute` — Requires admin role
- `ProfileSetupGuard` — Ensures profile completion

**Row Level Security (RLS):**

- All user-specific tables have RLS enabled
- Users can only access their own data unless `is_public = true`
- Admins bypass RLS via service role keys

### Common Interaction Patterns

**Global Rules:**

1. **Delete Operations** — All deletes require confirmation dialog
2. **List Pagination** — Default page size: 20 items, sortable by `created_at DESC`
3. **Optimistic Updates** — Likes, follows, version switches update UI immediately
4. **Error Handling** — User-friendly messages via `mapSunoError()` with actionable hints
5. **Loading States** — Skeleton screens during data fetch, spinners for actions
6. **Mobile-First** — Minimum touch target 44×44px, safe areas for notches
7. **Audio Playback** — Only one track plays globally; starting new track stops previous
8. **Draft Persistence** — Generation forms auto-save to localStorage (30 min expiry)
9. **Search Debounce** — 300ms debounce on search inputs
10. **Image Lazy Loading** — All images use `LazyImage` component with blur placeholder

**Success Feedback:**

- Toast notifications for all successful actions
- Haptic feedback on mobile (light impact for taps, notification for successes)
- Sound effects for key actions (generation complete, version switch)

**Error Recovery:**

- Retry buttons for retryable errors (rate limits, network errors)
- Contextual hints for non-retryable errors (credits, content policy)
- FAQ links for common issues
- Examples for content policy violations (how to fix prompts)

### API Integration Strategy

**Case 1: Real API Integration** (Direct Supabase queries)

- All API files in `src/api/*.api.ts` execute real Supabase queries
- Type-safe with generated TypeScript types
- RLS policies handle authorization

**Case 2: Mock Data** (Development/testing)

- Components with `*.mock.*` files or `Promise.resolve()` stubs
- Timeout-based simulations for development
- These indicate **unimplemented features** requiring backend development

**Service Layer Pattern:**

```
API Layer (src/api/*.api.ts) → Service Layer (src/services/*.service.ts) → Hooks (src/hooks/*.ts) → Components
```

- **API Layer:** Direct Supabase queries
- **Service Layer:** Business logic, data transformation
- **Hook Layer:** TanStack Query integration, state management

---

## Appendix

- **[Enum Dictionary](./appendix/enum-dictionary.md)** — All status codes, type mappings, constants
- **[Page Relationships](./appendix/page-relationships.md)** — Navigation map between pages
- **[API Inventory](./appendix/api-inventory.md)** — Complete API reference
- **[Component Inventory](./appendix/component-inventory.md)** — Key components and their purposes

---

## Document Status

| Section                   | Status         | Last Updated |
| ------------------------- | -------------- | ------------ |
| System Overview           | ✅ Complete    | 2026-06-26   |
| Page Inventory            | ✅ Complete    | 2026-06-26   |
| Global Context            | ✅ Complete    | 2026-06-26   |
| Core User Pages (1-10)    | 🔄 In Progress | -            |
| Content Discovery (11-15) | ⏳ Pending     | -            |
| Creative Tools (16-22)    | ⏳ Pending     | -            |
| Studio Pages (23-29)      | ⏳ Pending     | -            |
| Player & Rewards (30-32)  | ⏳ Pending     | -            |
| Payment Pages (33-37)     | ⏳ Pending     | -            |
| Legal & Settings (38-42)  | ⏳ Pending     | -            |
| Admin Pages (43-60)       | ⏳ Pending     | -            |
| Utility Pages (61-63)     | ⏳ Pending     | -            |
| Appendix Files            | ⏳ Pending     | -            |

---

**Next Steps:** Proceed to Phase 2 — Page-by-Page Deep Analysis, starting with Core User Pages (1-10).
