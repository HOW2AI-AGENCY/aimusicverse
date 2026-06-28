# Data Model: Sprint 035 — Stabilization & Architecture Cleanup

**Date**: 2026-06-28 | **Spec**: [spec.md](spec.md)

## Entities

### PlaybackStore (consolidated)

Single Zustand store at `src/stores/usePlaybackStore.ts`.

**State**:
- `isPlaying: boolean`
- `currentTrackId: string | null`
- `currentTime: number`
- `duration: number`
- `volume: number`
- `isMuted: boolean`
- `repeatMode: 'none' | 'one' | 'all'`
- `isShuffled: boolean`
- `isLoading: boolean`
- `error: string | null`
- `loopStart: number | null`
- `loopEnd: number | null`
- `isLooping: boolean`

**Selectors** (exported hooks for render optimization):
- `usePlaybackStatus()` → `{ isPlaying, currentTrackId }`
- `usePlaybackControls()` → `{ play, pause, toggle, seek, setVolume, toggleMute }`
- `useLoopControls()` → `{ setLoop, clearLoop, isLooping, loopStart, loopEnd }`
- `usePlaybackProgress()` → `{ currentTime, duration, progress }`
- `usePlaybackLoadingState()` → `{ isLoading, error }`

### QueryKeyFactory

Typed object at `src/lib/queryKeys.ts`.

**Domains**:
- `tracks` — all, list(filters), detail(id), versions(id), stems(id)
- `playlists` — all, list(filters), detail(id), tracks(playlistId)
- `users` — all, profile(id), me, stats(id)
- `generation` — tasks(userId), task(id), status(taskId), drafts
- `studio` — projects(userId), project(id), sections(projectId)
- `voices` — all, list(userId), detail(id), history(userId)
- `social` — comments(trackId), likes(trackId), followers(userId)
- `payments` — plans, history(userId), subscription(userId)
- `admin` — metrics, failurePatterns, experiments

**staleTime defaults** (in `src/lib/queryDefaults.ts`):
| Domain | staleTime | gcTime | Rationale |
|--------|-----------|--------|-----------|
| Default | 30s | 10min | Standard |
| User profile | 5min | 30min | Rarely changes |
| Generation status | 2s | 1min | Real-time polling |
| Static (genres) | 10min | 1hr | Near-static content |
| Admin metrics | 1min | 5min | Dashboard refresh |

### ProtectedRoute

Existing component at `src/components/ProtectedRoute.tsx`. No model changes — just additional route wrapping.

## Relationships

```
PlaybackStore ← used by → GlobalAudioProvider
PlaybackStore ← used by → CompactPlayer, ExpandedPlayer, MobileFullscreenPlayer
PlaybackStore ← used by → Studio (SortableTrackList, StemMixer)
PlaybackStore ← used by → Library (TrackCard, TrackActions)

QueryKeyFactory ← used by → all TanStack Query hooks (347 hooks)
QueryKeyFactory ← invalidated by → mutation hooks (optimistic updates)

ProtectedRoute ← wraps → /payment, /payment/buy routes
ProtectedRoute ← wraps → /studio/*, /player/* routes (existing)
```
