# GitHub Copilot Instructions for MusicVerse AI

## Project Overview

MusicVerse AI is a professional AI-powered music creation platform built as a Telegram Mini App. The platform integrates with Suno AI v5 to generate music with advanced controls including 174+ meta tags, 277+ musical styles, and support for 75+ languages.

**Key Technologies:**
- React 19 + TypeScript 5
- Vite for build tooling
- Lovable Cloud (Supabase-based backend) for database, auth, edge functions, storage
- Telegram Mini App SDK (@twa-dev/sdk)
- TanStack Query for data management with optimized caching
- Tailwind CSS + shadcn/ui components
- Zustand for state management
- Framer Motion for animations
- react-virtuoso for list virtualization

**Infrastructure Notes:**
- Backend runs on Lovable Cloud, which provides Supabase functionality
- Edge Functions deploy automatically on code changes
- Database uses PostgreSQL with RLS (Row Level Security)
- Track versioning uses `is_primary` field and `active_version_id` on tracks table
- Changelog stored in `track_change_log` table
- Playlists use `playlists` and `playlist_tracks` tables

## Architecture Overview

### State Management Stores (Zustand)
```
src/stores/
├── playerStore.ts       # Global audio player state (currentTrack, queue, playback)
├── lyricsWizardStore.ts # AI Lyrics Wizard 5-step pipeline state
└── planTrackStore.ts    # Project track planning context
```

### Key Hooks Categories

**Audio & Playback:**
- `useAudioTime.ts` - Shared audio time state
- `useGlobalAudioPlayer.ts` - Global audio player controls
- `usePlaybackQueue.ts` - Queue management (Play Next, Add to Queue)
- `usePlayerState.ts` - Player UI state

**Track Management:**
- `useTracksInfinite.tsx` - Infinite scroll with virtualization support
- `useTrackVersions.ts` - A/B versioning system
- `useVersionSwitcher.ts` - Version switching with is_primary + active_version_id sync
- `useTrackStems.tsx` - Stem separation status
- `useTrackCounts.ts` - Batch version/stem counts (optimized)
- `useActiveVersion.ts` - Active version resolution

**Content Discovery:**
- `usePublicContentOptimized.ts` - Single query for Featured/New/Popular tracks
- `useAutoPlaylists.ts` - Auto-generated genre playlists
- `usePlaylists.ts` - User playlist CRUD operations

**Generation:**
- `useActiveGenerations.ts` - Active task tracking
- `useGenerateDraft.ts` - Auto-save form drafts to localStorage
- `useSyncStaleTasks.ts` - Recovery of stuck generation tasks

### Component Architecture

```
src/components/
├── ui/                    # shadcn/ui base components + custom
│   ├── lazy-image.tsx    # Lazy loading with blur placeholder
│   └── ...
├── player/               # Audio player components
│   ├── MobileFullscreenPlayer.tsx
│   ├── ExpandedPlayer.tsx
│   └── ...
├── library/              # Library page components
│   └── VirtualizedTrackList.tsx  # react-virtuoso grid/list
├── playlist/             # Playlist management
├── stem-studio/          # Stem separation studio
├── generate-form/        # Music generation form
├── lyrics/               # AI Lyrics Wizard
├── home/                 # Homepage sections (optimized)
│   ├── FeaturedSectionOptimized.tsx
│   ├── NewReleasesSectionOptimized.tsx
│   ├── PopularSectionOptimized.tsx
│   └── AutoPlaylistsSectionOptimized.tsx
├── onboarding/           # User onboarding flow
└── track/                # Track cards, actions, details
```

## Performance Optimization Patterns

### 1. Data Fetching (TanStack Query)
```typescript
// Optimized caching strategy
{
  staleTime: 30 * 1000,      // 30 seconds
  gcTime: 10 * 60 * 1000,    // 10 minutes
  refetchOnWindowFocus: false,
}
```

### 2. List Virtualization
```typescript
// Use react-virtuoso for large lists
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
```

### 3. Lazy Image Loading
```typescript
// Use LazyImage component with blur placeholder
import { LazyImage } from '@/components/ui/lazy-image';
```

### 4. Batch Queries
```typescript
// Single query for related data instead of N+1
const { data } = usePublicContentOptimized(); // Returns featured, recent, popular, autoPlaylists
```

## Development Commands

### Essential Commands
```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

## Code Style and Standards

### TypeScript/JavaScript
- Use **Prettier** for all formatting
- Follow ESLint rules
- Use strict TypeScript settings

### React Best Practices
- Follow [React Hooks rules](https://reactjs.org/docs/hooks-rules.html)
- Use functional components with hooks
- All hooks called at top level before conditionals
- Use custom hooks for reusable logic

### Naming Conventions
- **Components:** `PascalCase.tsx`
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Hooks:** `use` prefix (e.g., `usePlayerState`)
- **Stores:** `Store` suffix (e.g., `playerStore`)

### Import Organization
1. External dependencies (React, libraries)
2. Internal absolute imports (from `@/`)
3. Relative imports
4. Style imports

## Key Features Implementation

### Track Versioning (A/B System)
- Each generation creates 2 versions (A/B)
- `track_versions` table with `version_label`, `clip_index`, `is_primary`
- `tracks.active_version_id` points to current version
- Version switch updates both `is_primary` AND `active_version_id`

### Playlist System
- `playlists` table with auto-updated stats (track_count, total_duration)
- `playlist_tracks` with position for drag-drop reordering
- Deep linking: `t.me/AIMusicVerseBot/app?startapp=playlist_ID`
- AI-generated covers via `generate-playlist-cover` edge function

### Stem Separation
- `track_stems` table stores separated stems
- `stem_separation_tasks` tracks async separation jobs
- `has_stems` flag on tracks indicates availability
- Studio interface for mixing with volume controls

### Auto-Playlists by Genre
- Dynamic playlists from public community tracks
- Genre extracted from track style/tags
- AI-generated playlist covers
- Displayed on homepage for discovery

### Onboarding System
- 9-step guided tour for new users
- LocalStorage persistence (show once)
- Manual restart from profile settings
- Framer-motion animations

### Telegram Integration
- Portrait orientation lock
- Native sharing (Stories, shareURL, downloadFile)
- Deep linking with startapp parameters
- File ID caching for efficient media reuse
- MarkdownV2 message formatting with proper escaping

## Database Conventions

### Core Tables
- `tracks` - Main track data with `active_version_id`
- `track_versions` - A/B versions with `is_primary`, `version_label`
- `track_stems` - Separated audio stems
- `track_change_log` - Audit trail for changes
- `playlists` - User playlists
- `playlist_tracks` - Playlist track associations
- `artists` - AI artist personas
- `audio_analysis` - AI music analysis results
- `generation_tasks` - Generation job tracking

### RLS Policies
- `profiles.is_public` controls public visibility
- User data protected by `auth.uid()` checks
- Public content requires explicit `is_public = true`

## Security Guidelines

- Never commit secrets
- Use environment variables
- Validate input on client and server
- RLS policies on all tables with user data
- `is_public` field controls visibility

## Edge Functions

Key functions in `supabase/functions/`:
- `suno-music-callback` - Generation completion handler
- `suno-send-audio` - Telegram audio sending (FormData)
- `send-telegram-notification` - User notifications
- `telegram-bot` - Bot command handler
- `generate-playlist-cover` - AI cover generation
- `generate-artist-portrait` - AI artist portraits
- `suno-boost-style` - Style prompt enhancement (Russian, 450 char limit)

## Resources

- [Project Specification](../docs/PROJECT_SPECIFICATION.md)
- [Database Schema](../docs/DATABASE.md)
- [Suno API](../docs/SUNO_API.md)
- [Telegram Bot Architecture](../docs/TELEGRAM_BOT_ARCHITECTURE.md)
- [Player Architecture](../docs/PLAYER_ARCHITECTURE.md)

---

**Last Updated:** 2025-12-05
