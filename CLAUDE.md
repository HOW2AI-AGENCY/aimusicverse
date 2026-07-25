# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**MusicVerse AI** — professional AI music-creation platform delivered as a **native Telegram Mini App** (not a web app with Telegram login). Integrates Suno AI v5 for generation plus editing, mixing, stems, and collaboration.

- **Stack:** React 19.2 · TypeScript 5.9 (strict) · Vite 6.4.3
- **Backend:** Supabase (PostgreSQL + Edge Functions + Storage)
- **UI:** Tailwind 3.4 · shadcn/ui · Radix
- **State:** Zustand 5.0 (global UI) · TanStack Query 5.90 (server) · React Hook Form + Zod (forms)
- **Audio:** Tone.js 14.9 · Wavesurfer.js 7.8
- **Testing:** Vitest 4 (unit) · Playwright 1.61 (E2E)

Live metrics (sprint status, counts, audit findings) live in [PROJECT_STATUS.md](PROJECT_STATUS.md) — do not duplicate them here.

## Commands

```bash
npm run dev              # dev server on :8080
npm run build            # production build
npm test                 # Vitest unit tests
npm run test:coverage    # unit + coverage
npm run test:e2e         # Playwright E2E (auto-starts dev server, baseURL :5173)
npm run test:e2e:mobile  # mobile browsers only (Pixel 5, iPhone 12)
npm run lint             # ESLint
npm run format           # Prettier
npm run size             # bundle-size check (950 KB limit)
npm run storybook        # Storybook on :6006
```

## Architecture

**Layered, one-way data flow:** `API → Service → Hooks → Components`

- **`src/api/*.api.ts`** — direct Supabase queries, type-safe. RLS handles authz.
- **`src/services/*.service.ts`** — business logic, data transformation.
- **`src/hooks/*.ts`** — TanStack Query integration, UI state.
- **`src/components/*.tsx`** — presentation, organized by feature (`ui/`, `player/`, `generate-form/`, `stem-studio/`, `studio/unified/`, `library/`, `track-actions/`).
- **`src/stores/`** — Zustand stores for complex global state.
- **`src/pages/`** — route pages, all lazy-loaded via `React.lazy()`.
- **`src/lib/`** — utilities (audio, logging, performance, error handling).

**Key files:**

- `src/App.tsx` — root, lazy routes, global providers
- `src/components/GlobalAudioProvider.tsx` — single `<audio>` element manager (**critical**)
- `src/hooks/audio/usePlayerState.ts` — Zustand player store hook
- `src/lib/motion.ts` — tree-shakeable framer-motion exports
- `src/lib/logger.ts` — structured logging + Sentry

### State management — right tool per job

1. **Global UI state → Zustand** (`playerStore`, `useUnifiedStudioStore`, `useLyricsHistoryStore`, `useMixerHistoryStore`). Never use Context API for global state.
2. **Server state → TanStack Query** (`staleTime: 30s`, `gcTime: 10min`). Optimistic updates for likes/plays/version switches. Never raw `fetch`/`axios` for server state.
3. **Form state → React Hook Form + Zod.** Drafts auto-save to localStorage.
4. **Component state → `useState`/`useReducer`.**

### Audio system — single source pattern

The **entire app uses ONE `<audio>` element** managed by `GlobalAudioProvider`.

- Access playback via `useGlobalAudioPlayer()` (`@/contexts/GlobalAudioContext`) or `usePlayerStore()` — **never create `<audio>` elements directly.**
- iOS Safari crashes with >10 audio elements → use `src/lib/audioElementPool.ts`.
- **UI preview audio** (versions, stems, recordings, dialogs) → `usePreviewAudio()` (`src/hooks/audio/usePreviewAudio.ts`), which wraps the pool + studio-audio coordinator. Replaces `new Audio(...)`.
- Waveforms: `src/lib/audioCache.ts`, `src/lib/waveformGenerator.ts`.

### Track versioning (A/B)

Every generation creates **2 versions**. Schema: `tracks.active_version_id` FK → `track_versions`, which has `is_primary`, `version_label` ('A'/'B'), `clip_index` (0/1). Version A (clip_index 0) is initially primary.

**Switching versions must update `is_primary` AND `active_version_id` atomically** — never one without the other. Hooks: `useTrackVersions`, `useVersionSwitcher`, `useActiveVersion`. Changes logged to `track_change_log`.

## Build & performance

- **Bundle limit: 950 KB** (enforced by size-limit; run `npm run size` before large features).
- Code splitting in `vite.config.ts`: `vendor-*` and `feature-*` chunks; React Priority Plugin loads React first. Terser 2-pass, gzip + brotli.
- **Lazy-load** all pages and heavy components; images always via `LazyImage`.
- **Virtualize** lists >50 items with `react-virtuoso`.
- **Motion:** import from `@/lib/motion` — never the whole `framer-motion` package.
- **Animate `transform`/`opacity`**, not width/height (60 FPS).
- **TDZ traps** (check `npm run build` for "Circular chunk" warnings):
  - Don't create barrel re-export cycles — if a barrel re-exports a module that imports from the same barrel, import from the source module directly instead.
  - Don't split interdependent modules into separate `manualChunks` — merge them into one chunk with a comment.

## Mobile & Telegram

- **Native Telegram Mini App.** SDK integration: `src/contexts/TelegramContext.tsx`; sharing: `src/services/telegram-share.ts`; viewport/keyboard fixes: `src/main.tsx`.
- **Touch targets ≥ 44×44px.** Use `safe-bottom` for notch/island. Keyboard height via `visualViewport`. Gestures via `@use-gesture/react`. Haptics via `hapticImpact()` / `hapticNotification()`.
- **Mobile modals → `MobileBottomSheet` (vaul)**, not `Dialog`. All mobile screens need `MobileHeaderBar`.
- Mobile-first, then enhance. Breakpoints: `xs 375 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Always test in Telegram mobile, not just desktop.
- **Bot** (separate component): edge functions `telegram-bot/`, `suno-send-audio/`, `send-telegram-notification/`. Deep links `t.me/AIMusicVerseBot/app?startapp=<track_ID|playlist_ID|studio_ID>` — parse `startapp` and show `BotContextBanner`.

## Conventions

- **Imports:** always the `@/` alias (`@/* → ./src/*`), never relative `../../`.
- **TypeScript:** strict, no `any`; validate external data with Zod.
- **Styling:** Tailwind only; class-based dark mode (`dark:`). Merge classes with `cn()` (`@/lib/utils`). Custom colors: `generate`, `library`, `projects`, `community`, `success`, `warning`.
- **Logging:** never `console.log` — use `logger` from `@/lib/logger` (persists to sessionStorage + Sentry).
- **Components/stores:** split anything >500 lines. One version selector only: `UnifiedVersionSelector`.
- **Post-generation:** show `GenerationResultSheet` (must be in `MainLayout`); don't redirect straight to library.

## Security

- **RLS** on all user-data tables. Public content gated by `is_public` + `profiles.is_public`.
- **Secrets only in Edge Functions**, never in frontend code.
- **Validate input** client-side (Zod) and server-side (Edge Functions).
- **Sanitize** user-generated HTML with DOMPurify.

## Testing

<<<<<<< Updated upstream
- **Unit (Vitest):** jsdom, globals on, `@/`→`src/`. Setup mocks in `src/__tests__/vitest.setup.ts`. Patterns: `src/__tests__/**` and `tests/unit/**`. Libs: `@testing-library/react`, `jest-dom`, `fast-check`, `axe-core`, `fake-indexeddb`.
- **E2E (Playwright):** `tests/e2e`, baseURL `:5173`, auto-starts dev server. Desktop Chrome/Firefox/Safari/Edge + mobile Pixel 5 / iPhone 12.
- Run `npm test` and `npm run test:e2e` before pushing.

## Documentation

- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) — role-based navigation hub
- [ARCHITECTURE_HUB.md](ARCHITECTURE_HUB.md) — canonical architecture, Mermaid diagrams, ADRs
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — sprint status, metrics, audit findings
- [ROADMAP.md](ROADMAP.md) · [CHANGELOG.md](CHANGELOG.md) · [DEVLOG.md](DEVLOG.md) (client-facing journal)
- [docs/DATABASE.md](docs/DATABASE.md) · [docs/PLAYER_ARCHITECTURE.md](docs/PLAYER_ARCHITECTURE.md) · [docs/SUNO_API.md](docs/SUNO_API.md)
- After code changes, follow [MAINTENANCE.md](MAINTENANCE.md) to keep docs current.

## graphify

Knowledge graph at `graphify-out/`. For codebase questions run `graphify query "<question>"` (falls back to `graphify path "<A>" "<B>"` and `graphify explain "<concept>"`) before broad grepping — it returns a scoped subgraph. Use `graphify-out/wiki/index.md` for navigation, `GRAPH_REPORT.md` only for broad architecture review. After modifying code, run `graphify update .` (AST-only, no API cost).
=======
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

- **Unit:** Vitest (jsdom, globals), `src/__tests__/` → `npm test`
- **E2E:** Playwright, `tests/e2e/` → `npm run test:e2e`
- **Libs:** testing-library, fast-check, axe-core, fake-indexeddb
- **Specific:** `npm run test:e2e:chromium|mobile|ui`

## Common Development Tasks

### Working with Audio

**Always use the global audio player:** `useGlobalAudioPlayer()` from `@/contexts/GlobalAudioContext`
- Play: `play(track)` | Pause: `pause()` | State: `isPlaying`, `currentTrack`
- For UI preview audio (versions, stems, recordings): `usePreviewAudio()` from `src/hooks/audio/usePreviewAudio.ts`

**Audio Utilities:** `src/lib/audioContextManager.ts`, `audioElementPool.ts`, `audioCache.ts`, `waveformGenerator.ts`

### Working with Tracks

- **Fetch:** `useTracks({ userId, isPublic, limit })` from `@/hooks/useTracks`
- **Versions:** `useTrackVersions(trackId)`, `useVersionSwitcher(trackId)`, `useActiveVersion(trackId)` from `@/hooks/`
- Switch version: `switchVersion(versionB.id)` — atomically updates `is_primary` + `active_version_id`

### Working with the Unified Studio

**Main editing interface:** `src/pages/studio-v2/UnifiedStudioPage.tsx`
**Store:** `useUnifiedStudioStore` (Zustand)
**Mobile:** `src/components/studio/unified/Mobile*.tsx`
**Features:** Section replacement, stem separation, mixing (volume/pan/solo/mute), MIDI transcription (6 models), waveform editing, A/B comparison

### Adding Pages & Components

- **Pages:** `src/pages/YourPage.tsx` → lazy import in `src/App.tsx`: `const YourPage = lazy(() => import("./pages/YourPage"));`
- **Components:** Base → `src/components/ui/`; Feature → `src/components/feature-name/`; Use `cn()` from `@/lib/utils` for className merging; Always use `LazyImage` for images

### Working with Supabase

**API Layer** (`src/api/*.api.ts`) — Direct Supabase queries, type-safe, RLS handles auth
**Service Layer** (`src/services/*.service.ts`) — Business logic, data transformation
**Hook Layer** (`src/hooks/*.ts`) — TanStack Query wrappers around API calls

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
import { logger } from "@/lib/logger";

logger.info("Operation completed", { trackId });
logger.warn("Potential issue", { context });
logger.error("Operation failed", { error, trackId });
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
- [docs/ARCHITECTURE_DIAGRAMS.md](docs/ARCHITECTURE_DIAGRAMS.md) - Visual architecture diagrams
- [docs/DATABASE.md](docs/DATABASE.md) - Database schema and ERD
- [docs/PLAYER_ARCHITECTURE.md](docs/PLAYER_ARCHITECTURE.md) - Audio player architecture
- [docs/SUNO_API.md](docs/SUNO_API.md) - Suno AI integration
- [SPRINTS/](SPRINTS/) - Sprint planning and task tracking
- [specs/](specs/) - Technical specifications

**Current Status:**

- Sprint: **065** (Generate v2 + Home Redesign)
- Arch refactoring 2026-07-18: 6/7 done ✅ (deps, dirs merged, AudioRecordDialog decomposed, supabase types, any→unknown, sprint docs archived)
- tsc: 0 errors | Tests: 1810 passing (unit), 59 (E2E) | Bundle: ~508 KB gzip

## Telegram Bot Integration

**Edge Functions:** `supabase/functions/telegram-bot/` (commands), `suno-send-audio/` (file sending), `send-telegram-notification/`
**Deep Links:** `t.me/AIMusicVerseBot/app?startapp=track_ID|playlist_ID|studio_ID`
**Features:** Inline search, `/generate|cover|extend|library` commands, Stories sharing, FormData audio sending

## Common Pitfalls

- **Audio:** Always use `useGlobalAudioPlayer()` or `usePlayerStore()` — never multiple `<audio>`. iOS Safari crashes >10 elements, use `audioElementPool`. For UI preview: `usePreviewAudio()`.
- **Performance:** Import framer-motion from `@/lib/motion`, not `framer-motion`. Always lazy load. Use `LazyImage`. Animate with `transform: scale()`, not width/height. Virtualize lists >50 items with `react-virtuoso`. No barrel re-export cycles.
- **Mobile:** Touch targets 44-56px. Use `MobileBottomSheet` (vaul), not Dialog. Respect safe areas (`safe-bottom`). Use haptic feedback (`hapticImpact()`/`hapticNotification()`).
- **Component Architecture:** Use ONLY `UnifiedVersionSelector`. No custom modals — use `MobileBottomSheet` or `Dialog`. All mobile screens need `MobileHeaderBar`. Max 500 lines per component/store.
- **State & Data:** TanStack Query for server state, Zustand for global state. Update `is_primary` + `active_version_id` atomically. Use optimistic updates for likes, plays, version switches.
- **Security:** Zod for input validation. Secrets only in Edge Functions. DOMPurify for user content.
- **Post-Gen:** Use `GenerationResultSheet` in `MainLayout`. Call `expectGenerationResult()` before generation.
- **Telegram Bot:** Parse `startapp` params. Show `BotContextBanner`. User must know why they navigated from bot.



## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

>>>>>>> Stashed changes

<!-- BEGIN sqz-claude-guidance (auto-installed by sqz init; remove this block to disable) -->

## sqz — context compression

sqz compresses tool output. Prefer its MCP tools over the built-ins for anything sizeable:

- **`sqz_read_file`** over `Read` for files >~2KB or re-reads (repeat reads return a `§ref:HASH§` token).
- **`sqz_grep`** over `Grep` when matches may exceed a few lines.
- **`sqz_list_dir`** over `ls -la` for project layout.

Keep `Read`/`Grep`/`Glob` for tiny files, byte-exact reads, and globbing. Bash output is auto-piped through `sqz compress` by a hook. To expand a token: `sqz expand <HASH>` (or the `expand` MCP tool). If refs get in the way, call the `passthrough` MCP tool for raw text.
<!-- END sqz-claude-guidance -->
