# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MusicVerse AI** is a professional AI-powered music creation platform delivered as a Telegram Mini App. Built with React 19, TypeScript, and Vite, it integrates Suno AI v5 for music generation with extensive editing, mixing, and collaboration features.

- **Technology Stack:** React 19.2 + TypeScript 5.9 + Vite 5.0
- **Backend:** Supabase (PostgreSQL + Edge Functions + Storage)
- **UI Framework:** Tailwind CSS 3.4 + shadcn/ui + Radix UI
- **State Management:** Zustand 5.0 (global) + TanStack Query 5.90 (server state)
- **Audio Processing:** Tone.js 14.9, Wavesurfer.js 7.8
- **Telegram Integration:** @twa-dev/sdk 8.0.2
- **Testing:** Jest 30.2 (unit), Playwright 1.57 (E2E)

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 8080
npm install              # Install dependencies

# Building
npm run build            # Production build with optimizations
npm run build:dev        # Development build with sourcemaps
npm preview              # Preview production build

# Testing
npm test                 # Run Jest unit tests
npm run test:coverage    # Unit tests with coverage report
npm run test:e2e         # Run all Playwright E2E tests
npm run test:e2e:headed  # E2E tests with visible browser
npm run test:e2e:ui      # Playwright UI test runner
npm run test:e2e:mobile  # Mobile-specific E2E tests (Pixel 5, iPhone 12)
npm run test:e2e:report  # View HTML test report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Bundle Analysis
npm run size             # Check bundle size (950 KB limit)
npm run size:why         # Detailed bundle size analysis

# Component Development
npm run storybook        # Start Storybook on port 6006
npm run build-storybook  # Build Storybook static site
```

## Architecture & Code Organization

### High-Level Architecture

The application follows a layered architecture:

```
┌─────────────────────────────────────────────┐
│  Pages (40+)                                │  Route-level components with lazy loading
├─────────────────────────────────────────────┤
│  Components (890+)                          │  Feature-specific & UI components
├─────────────────────────────────────────────┤
│  Hooks (200+)                               │  Reusable React logic
├─────────────────────────────────────────────┤
│  Services (13)                              │  Business logic & data transformation
├─────────────────────────────────────────────┤
│  API Layer (13)                             │  Direct Supabase queries
├─────────────────────────────────────────────┤
│  Stores (8 Zustand)                         │  Global state (player, studio, lyrics)
└─────────────────────────────────────────────┘
```

**Data Flow Pattern:** API Layer → Service Layer → Hooks → Components
- **API Layer** (`src/api/*.api.ts`): Direct Supabase queries, type-safe
- **Service Layer** (`src/services/*.service.ts`): Business logic, data transformation
- **Hook Layer** (`src/hooks/*.ts`): React Query integration, state management
- **Component Layer** (`src/components/*.tsx`): UI presentation

### Critical Directory Purposes

- **`src/api/`** (13 files) - Direct Supabase database operations, type-safe queries
- **`src/services/`** (13 files) - Business logic layer, data transformation, complex operations
- **`src/hooks/`** (200+ files) - Custom React hooks for UI logic and state management
- **`src/stores/`** (8 files) - Zustand stores for complex global state (player, unified studio, lyrics)
- **`src/components/`** (890+ files) - React components organized by feature
  - `ui/` - shadcn/ui base components + custom components (LazyImage, GlowButton, etc.)
  - `player/` - Audio player (CompactPlayer, ExpandedPlayer, MobileFullscreenPlayer)
  - `generate-form/` - Music generation form modules
  - `stem-studio/` - Stem separation and mixing interface
  - `studio/unified/` - Unified Studio Mobile components
  - `library/` - Track library with virtualization
  - `track-actions/` - Unified action menus
- **`src/lib/`** (60+ files) - Utility functions (audio, logging, performance, error handling)
- **`src/pages/`** (40+ files) - Route pages with code splitting
- **`src/contexts/`** (10 files) - React Context providers (Auth, Theme, Telegram, Notification)

### Key Architecture Files

- **`src/App.tsx`** - Root component with lazy-loaded routes, global providers
- **`src/components/GlobalAudioProvider.tsx`** - Single HTMLAudioElement management (CRITICAL)
- **`src/hooks/audio/usePlayerState.ts`** - Zustand player store hook
- **`src/lib/motion.ts`** - Tree-shakeable framer-motion exports
- **`src/lib/logger.ts`** - Structured logging with Sentry integration

### State Management Strategy

**Use the right tool for the right job:**

1. **Global UI State:** Zustand stores
   - `playerStore` - Audio playback state, queue, current track
   - `useUnifiedStudioStore` - Complex studio state (38KB, largest store)
   - `useLyricsHistoryStore` - Lyrics editing history
   - `useMixerHistoryStore` - Mixer state history

2. **Server State:** TanStack Query with optimized caching
   - Default: `staleTime: 30s`, `gcTime: 10min`
   - Use `usePublicContentOptimized` for batched homepage queries
   - Optimistic updates for likes, plays, version switches

3. **Form State:** React Hook Form + Zod validation
   - Auto-save drafts to localStorage (30 min expiry)
   - `useGenerateDraft` for generation form persistence

4. **Component State:** React hooks (useState, useReducer)

### Audio System Architecture

**Single Audio Source Pattern** - The entire app uses ONE `<audio>` element managed by `GlobalAudioProvider`:

- **Provider:** `src/components/GlobalAudioProvider.tsx` (625 lines, comprehensive)
- **Hook:** `usePlayerStore()` from `src/hooks/audio/usePlayerState.ts` - Access player controls
- **Store:** `playerStore` (Zustand) - Playback state, queue, current track
- **Player Modes:** Compact → Expanded → Fullscreen (mobile)
- **Audio Element Pool:** `src/lib/audioElementPool.ts` - Reuse audio elements (iOS Safari crash prevention)
- **Audio Cache:** `src/lib/audioCache.ts` - Pre-computed waveforms, CDN optimization

**Important:** Never create multiple `<audio>` elements. Always use `usePlayerStore()` or `useGlobalAudioPlayer()`.

### Track Versioning System (A/B)

Every music generation creates **2 versions (A/B)**:

**Database Schema:**
- `tracks` table has `active_version_id` (FK to track_versions)
- `track_versions` table has `is_primary` (boolean), `version_label` ('A'/'B'), `clip_index` (0/1)
- Version A (clip_index: 0) is initially primary
- Switching versions updates BOTH `is_primary` AND `active_version_id`

**Key Hooks:**
- `useTrackVersions(trackId)` - Fetch all versions
- `useVersionSwitcher(trackId)` - Switch primary version
- `useActiveVersion(trackId)` - Get current active version

**Changelog:** All version changes logged to `track_change_log` table with `change_type`, `old_value`, `new_value`.

## Build System & Performance

### Vite Configuration Highlights

**Code Splitting Strategy** (`vite.config.ts`):
- Vendor chunks: `vendor-react`, `vendor-framer`, `vendor-tone`, `vendor-wavesurfer`, `vendor-query`, `vendor-radix`, `vendor-icons`, `vendor-supabase`, `vendor-forms`, `vendor-charts`
- Feature chunks: `feature-studio`, `feature-lyrics`, `feature-generation`
- React Priority Plugin ensures React vendor loads first

**Production Optimizations:**
- Terser minification (2-pass, console/debugger removal)
- Gzip + Brotli compression (10KB threshold)
- Bundle size limit: **950 KB** (enforced by size-limit)
- Tree-shaking enabled (no external modules)

### Performance Patterns

1. **Lazy Loading**
   - Route-level code splitting (React.lazy)
   - `src/components/lazy/` for heavy components
   - LazyImage component for all images (blur placeholder + shimmer)

2. **List Virtualization**
   - Use `react-virtuoso` for large lists (Library, Queue)
   - `<Virtuoso>` for vertical lists, `<VirtuosoGrid>` for grids

3. **Optimized Motion**
   - Import from `@/lib/motion` (tree-shaking wrapper for framer-motion)
   - Never import entire `framer-motion` package

4. **Batch Queries**
   - `usePublicContentOptimized` - Single query for homepage (Featured + New + Popular + AutoPlaylists)
   - `useTrackCounts` - Batch version/stem counts

5. **Denormalized Counters**
   - `likes_count`, `play_count` on tracks (updated via triggers)
   - `track_count`, `total_duration` on playlists (auto-updated)

## Mobile-First Development

### Telegram Mini App Integration

This is a **native Telegram Mini App**, not a web app with Telegram login:

**Key Files:**
- `src/contexts/TelegramContext.tsx` - Telegram Web App SDK integration
- `src/services/telegram-share.ts` - Stories, chat sharing, deep links
- `src/main.tsx` - Viewport height fixes, keyboard tracking

**Critical Mobile Patterns:**
- **Touch Targets:** Minimum 44×44px (iOS HIG standard)
- **Safe Areas:** Use `safe-bottom` spacing for notch/island
- **Keyboard Handling:** `visualViewport` API for keyboard height tracking
- **Gestures:** `@use-gesture/react` for swipe, long-press, pull-to-refresh
- **Audio Pooling:** iOS Safari crashes with >10 audio elements - use `audioElementPool`

**Mobile Components:**
- `src/components/mobile/` - General mobile components
- `src/components/studio/unified/Mobile*.tsx` - Unified Studio mobile UI
- `src/components/player/MobileFullscreenPlayer.tsx` - Mobile fullscreen player

### Responsive Design

**Tailwind Breakpoints:**
- `xs: 375px` (small phones)
- `sm: 640px`
- `md: 768px`
- `lg: 1024px`
- `xl: 1280px`
- `2xl: 1536px`

**Always design mobile-first, then progressively enhance.**

## Testing Strategy

### Unit Tests (Jest)

**Configuration:** `jest.config.cjs`
- Test environment: jsdom
- Path mapping: `@/` → `./src/`
- Timeout: 10s (for property-based tests)

**Test Patterns:**
- `**/__tests__/**/*.test.ts(x)`
- `**/*.spec.ts(x)`
- `**/tests/**/*.test.ts(x)`

**Testing Libraries:**
- `@testing-library/react` - Component testing
- `@testing-library/jest-dom` - DOM matchers
- `fast-check` - Property-based testing
- `axe-core` - Accessibility testing

### E2E Tests (Playwright)

**Configuration:** `playwright.config.ts`
- Test directory: `./tests/e2e`
- Base URL: `http://localhost:5173`
- Auto-start dev server

**Browser Coverage:**
- Desktop: Chrome, Firefox, Safari, Edge (1920×1080)
- Mobile: Pixel 5 (Chrome), iPhone 12 (Safari)

**Run Specific Tests:**
- `npm run test:e2e:chromium` - Chrome only
- `npm run test:e2e:mobile` - Mobile browsers only
- `npm run test:e2e:ui` - Interactive UI mode

## Common Development Tasks

### Working with Audio

**Always use the global audio player:**

```typescript
import { useGlobalAudioPlayer } from '@/contexts/GlobalAudioContext';

const { play, pause, currentTrack, isPlaying } = useGlobalAudioPlayer();

// Play a track
play(track);

// Pause
pause();

// Check playback state
if (isPlaying) { /* ... */ }
```

**Audio Utilities:**
- `src/lib/audioContextManager.ts` - Web Audio API context management
- `src/lib/audioElementPool.ts` - Audio element pooling (iOS Safari)
- `src/lib/audioCache.ts` - Waveform caching
- `src/lib/waveformGenerator.ts` - Waveform generation

### Working with Tracks

**Fetching Tracks:**

```typescript
import { useTracks } from '@/hooks/useTracks';

const { data, isLoading, error } = useTracks({
  userId: user?.id,
  isPublic: true,
  limit: 20
});
```

**Track Versions:**

```typescript
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';

const { data: versions } = useTrackVersions(trackId);
const { switchVersion, isPending } = useVersionSwitcher(trackId);

// Switch to version B
await switchVersion(versionB.id);
```

### Working with the Unified Studio

**The Unified Studio is the main editing interface** (`src/pages/studio-v2/UnifiedStudioPage.tsx`):

**Key Features:**
- Section replacement (regenerate parts of a track)
- Stem separation (vocals, drums, bass, instruments)
- Mixing (volume, pan, solo, mute)
- MIDI transcription (6 AI models)
- Waveform editing
- A/B comparison

**Store:** `useUnifiedStudioStore` (Zustand, 38KB)

**Mobile Version:** `src/components/studio/unified/Mobile*.tsx`

### Adding New Pages

1. Create page in `src/pages/YourPage.tsx`
2. Add lazy-loaded route in `src/App.tsx`:
   ```typescript
   const YourPage = lazy(() => import("./pages/YourPage"));
   ```
3. Add route in the router:
   ```typescript
   <Route path="/your-path" element={<YourPage />} />
   ```

### Creating New Components

**Follow shadcn/ui patterns:**

1. Base components go in `src/components/ui/`
2. Feature components go in `src/components/feature-name/`
3. Use `cn()` utility for className merging:
   ```typescript
   import { cn } from "@/lib/utils";
   className={cn("base-classes", conditional && "extra-class", className)}
   ```
4. For images, always use `LazyImage`:
   ```typescript
   import { LazyImage } from "@/components/ui/lazy-image";
   <LazyImage src={url} alt="..." />
   ```

### Working with Supabase

**API Layer** (`src/api/*.api.ts`):
- Direct Supabase queries
- Type-safe with generated types
- RLS policies handle authorization

**Service Layer** (`src/services/*.service.ts`):
- Business logic
- Data transformation
- Complex operations

**Example:**

```typescript
// API Layer (src/api/tracks.api.ts)
export const getTrackById = async (id: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*, track_versions(*)')
    .eq('id', id)
    .single();
  return { data, error };
};

// Service Layer (src/services/tracks.service.ts)
export const enrichTrackWithMetadata = async (track: Track) => {
  // Add computed fields, format data, etc.
  return enrichedTrack;
};

// Hook Layer (src/hooks/useTracks.ts)
export const useTrack = (id: string) => {
  return useQuery({
    queryKey: ['track', id],
    queryFn: () => getTrackById(id),
  });
};
```

## Key Conventions

### Import Paths

Always use `@/` alias for absolute imports:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { useTracks } from "@/hooks/useTracks";

// ❌ Incorrect
import { Button } from "../../components/ui/button";
```

### TypeScript

- **Strict mode enabled** - No `any` types
- **Path mapping:** `@/*` → `./src/*`
- All components should have proper type definitions
- Use Zod for runtime validation (forms, API responses)

### Styling

- **Tailwind CSS** for all styling
- **Dark mode:** Class-based (`dark:` prefix)
- **Custom colors:** `generate`, `library`, `projects`, `community`, `success`, `warning`
- **Custom animations:** `accordion`, `pulse-glow`, `shimmer`, `float`, `slide-up`, `vinyl-spin`, `pulse-ring`

### Logging

**Never use `console.log` directly.** Use the logger utility:

```typescript
import { logger } from '@/lib/logger';

logger.info('Operation completed', { trackId });
logger.warn('Potential issue', { context });
logger.error('Operation failed', { error, trackId });
```

Logger persists to sessionStorage and integrates with Sentry.

## Security & Best Practices

### Security

- **RLS Policies:** All tables with user data have Row Level Security enabled
- **Public Content:** Controlled by `is_public` field + `profiles.is_public`
- **Secrets:** Only in Edge Functions, never in frontend code
- **Input Validation:** Client-side (Zod) + Server-side (Edge Functions)
- **HTML Sanitization:** Use DOMPurify for user-generated content

### Performance

- **Bundle Size:** Keep under 950 KB (enforced by size-limit)
- **Code Splitting:** Lazy load heavy features
- **Image Optimization:** Always use LazyImage component
- **List Virtualization:** Use react-virtuoso for >50 items
- **Query Caching:** Use TanStack Query with appropriate stale times
- **Audio Element Pooling:** Reuse audio elements (iOS Safari limitation)

### Accessibility

- **Touch Targets:** Minimum 44×44px
- **Keyboard Navigation:** All interactive elements accessible via keyboard
- **ARIA Labels:** Proper labels for screen readers
- **Color Contrast:** WCAG AA compliant
- **Focus Indicators:** Visible focus states

## Documentation

**Full documentation available in:**

- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Complete documentation map
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current sprint status and progress
- [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md) - Project knowledge base
- [docs/ARCHITECTURE_DIAGRAMS.md](docs/ARCHITECTURE_DIAGRAMS.md) - Visual architecture diagrams
- [docs/DATABASE.md](docs/DATABASE.md) - Database schema and ERD
- [docs/PLAYER_ARCHITECTURE.md](docs/PLAYER_ARCHITECTURE.md) - Audio player architecture
- [docs/SUNO_API.md](docs/SUNO_API.md) - Suno AI integration
- [SPRINTS/](SPRINTS/) - Sprint planning and task tracking
- [specs/](specs/) - Technical specifications

**Current Status:**
- Sprint: 030 (Unified Studio Mobile) - 60% complete
- Health Score: 98/100
- Components: 890+
- Bundle Size Target: 950 KB
- Overall Progress: 95% (24/25 sprints complete)

## Telegram Bot Integration

**The Telegram bot is a separate component** that interacts with the Mini App:

**Edge Functions:**
- `supabase/functions/telegram-bot/` - Command handler (/generate, /library, etc.)
- `supabase/functions/suno-send-audio/` - Send audio files to Telegram
- `supabase/functions/send-telegram-notification/` - User notifications

**Deep Links:**
- Format: `t.me/AIMusicVerseBot/app?startapp=PARAM`
- Track: `startapp=track_ID`
- Playlist: `startapp=playlist_ID`
- Studio: `startapp=studio_ID`

**Bot Features:**
- Inline queries for track search
- Commands: `/generate`, `/cover`, `/extend`, `/library`
- Stories sharing
- Audio file sending (FormData multipart)

## Common Pitfalls

1. **Don't create multiple audio elements** - Use `useGlobalAudioPlayer()`
2. **Don't import entire framer-motion** - Use `@/lib/motion`
3. **Don't forget mobile touch targets** - Minimum 44×44px
4. **Don't use console.log** - Use `logger` utility
5. **Don't skip LazyImage** - All images should lazy load
6. **Don't batch version updates** - Update `is_primary` AND `active_version_id` together
7. **Don't exceed bundle limit** - Monitor with `npm run size`
8. **Don't create audio elements on iOS** - Use `audioElementPool`

## Getting Help

- Check existing documentation in `docs/` and `SPRINTS/`
- Review similar implementations in the codebase
- Test on multiple devices (desktop + mobile)
- Run `npm run size` before committing large features
- Run `npm test` and `npm run test:e2e` before pushing

---

**Last Updated:** 2026-01-05 (Sprint 030 - Unified Studio Mobile - 60% Complete)
