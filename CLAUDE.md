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

<!-- BEGIN sqz-claude-guidance (auto-installed by sqz init; remove this block to disable) -->

## sqz — context compression

sqz compresses tool output. Prefer its MCP tools over the built-ins for anything sizeable:

- **`sqz_read_file`** over `Read` for files >~2KB or re-reads (repeat reads return a `§ref:HASH§` token).
- **`sqz_grep`** over `Grep` when matches may exceed a few lines.
- **`sqz_list_dir`** over `ls -la` for project layout.

Keep `Read`/`Grep`/`Glob` for tiny files, byte-exact reads, and globbing. Bash output is auto-piped through `sqz compress` by a hook. To expand a token: `sqz expand <HASH>` (or the `expand` MCP tool). If refs get in the way, call the `passthrough` MCP tool for raw text.
<!-- END sqz-claude-guidance -->
