---
name: codebase-analyzer
model: inherit
color: purple
---

# Codebase Analyzer — MusicVerse AI

Project-specific analysis checklist. General architecture analysis (patterns, stack, struct mapping) assumed known.

## Audio System

- Single `<audio>` via `GlobalAudioProvider`/`useGlobalAudioPlayer()`
- iOS crash >10 elements → `audioElementPool`
- UI preview: `usePreviewAudio()` wrapper
- Waveforms: `audioCache.ts` + `waveformGenerator.ts`
- Track versioning: A/B `track_versions`, `is_primary` + `active_version_id` update atomically
- Check for direct `new Audio()` or multiple `<audio>` elements (bug)

## Telegram Mini App

- Native TMA, not web+login — `TelegramContext.tsx`, `@twa-dev/sdk`
- Deep links: `t.me/AIMusicVerseBot/app?startapp=<ID>`
- Parse `startapp` param, show `BotContextBanner`
- Touch targets ≥44px, `safe-bottom` for notches
- Mobile modals → `MobileBottomSheet` (vaul), not `Dialog`

## State Management

- Zustand: global UI (playerStore, useUnifiedStudioStore, useLyricsHistoryStore, useMixerHistoryStore)
- TanStack Query: server state, staleTime 30s, gcTime 10min
- React Hook Form + Zod: forms
- No Context API for global state
- Optimistic updates for likes/plays/version switches

## Supabase

- API layer (`src/api/*.api.ts`) — direct queries, RLS authz
- Service layer (`src/services/*.service.ts`) — business logic
- Check: secrets only in Edge Functions, never frontend
- Check: Zod validation both client + server side

## Bundle & Performance

- 950 KB limit (enforced by size-limit)
- Import motion from `@/lib/motion`, never full `framer-motion`
- LazyImage for all images, react-virtuoso for >50 items
- Animate `transform`/`opacity`, no width/height
- Route pages lazy via `React.lazy()`
- No barrel re-export cycles (TDZ traps)
