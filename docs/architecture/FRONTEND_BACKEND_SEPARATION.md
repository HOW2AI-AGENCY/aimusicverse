# Architecture: Frontend/Backend Separation

## Overview

This document describes the layered architecture for separating frontend (UI) from backend (data/business logic).

## Layer Structure

```
src/
├── api/              # Layer 1: Raw API calls
│   ├── tracks.api.ts
│   ├── credits.api.ts
│   └── index.ts
│
├── services/         # Layer 2: Business logic
│   ├── tracks.service.ts
│   ├── credits.service.ts
│   └── index.ts
│
├── hooks/           # Layer 3: UI state management
│   ├── useTracks.ts
│   ├── useCredits.ts
│   └── ...
│
└── components/      # Layer 4: UI components
    └── ...
```

## Layer Responsibilities

### Layer 1: API (`src/api/`)
- **Purpose**: Raw database/API operations
- **Contains**: Direct Supabase queries, edge function calls
- **No**: Business logic, UI state, React hooks, toasts
- **Example**: `fetchTracks()`, `toggleTrackLike()`, `fetchUserCredits()`

```typescript
// src/api/tracks.api.ts
export async function fetchTracks(filters: TrackFilters): Promise<TracksResponse> {
  const { data, error } = await supabase.from('tracks').select('*');
  return { data, error };
}
```

### Layer 2: Services (`src/services/`)
- **Purpose**: Business logic and data transformations
- **Contains**: Calculations, validation, data enrichment, complex operations
- **No**: React hooks, UI state, toasts, haptic feedback
- **Example**: `fetchTracksWithLikes()`, `processDailyCheckin()`, `canAffordGeneration()`

```typescript
// src/services/credits.service.ts
export function getLevelFromExperience(exp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(exp / 100)) + 1);
}

export async function processDailyCheckin(userId: string) {
  // Complex business logic with streak calculation, rewards, etc.
}
```

### Layer 3: Hooks (`src/hooks/`)
- **Purpose**: UI state management, React Query integration
- **Contains**: useQuery/useMutation, cache invalidation, optimistic updates, toasts
- **No**: Direct Supabase calls, complex business logic
- **Example**: `useTracks()`, `useCredits()`, `useCheckin()`

```typescript
// src/hooks/useTracks.ts
export function useTracks(params) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tracks', user?.id],
    queryFn: () => tracksService.fetchTracksWithLikes(user.id, params),
  });
}
```

## Migration Guide

### Before (Mixed concerns)
```typescript
// ❌ OLD: Everything in one hook
export function useTracksUnified() {
  // Direct Supabase query
  const { data } = await supabase.from('tracks').select('*');
  
  // Business logic mixed in
  const enrichedTracks = data.map(t => ({
    ...t,
    likes_count: calculateLikes(t),
  }));
  
  // UI feedback
  toast.success('Loaded!');
}
```

### After (Separated)
```typescript
// ✅ NEW: Separated layers

// api/tracks.api.ts
export async function fetchTracks() {
  return supabase.from('tracks').select('*');
}

// services/tracks.service.ts
export async function fetchTracksWithLikes(userId) {
  const tracks = await tracksApi.fetchTracks();
  const likes = await tracksApi.fetchTrackLikes(trackIds);
  return tracks.map(t => ({ ...t, likes_count: likes[t.id] }));
}

// hooks/useTracks.ts
export function useTracks() {
  return useQuery({
    queryFn: () => tracksService.fetchTracksWithLikes(userId),
    onSuccess: () => toast.success('Loaded!'),
  });
}
```

## Benefits

1. **Testability**: Services can be unit tested without React
2. **Reusability**: Same service logic across hooks and edge functions
3. **Maintainability**: Clear separation of concerns
4. **Performance**: Easier to optimize specific layers
5. **Type Safety**: Strong typing at each layer boundary

## Existing Hooks Migration Status

| Hook | Status | Notes |
|------|--------|-------|
| useTracksUnified | ✅ Migrated | → useTracks |
| useGamification | ✅ Migrated | → useCredits |
| useUserCredits | ✅ Migrated | → useCredits |
| useAchievements | ✅ Migrated | → useCredits |
| useLeaderboard | ✅ Migrated | → useCredits |
| usePublicTracks | ✅ Migrated | → useTracks |
| usePlaylists | ✅ API/Service created | playlists.api.ts, playlists.service.ts |
| useProjects | ✅ API/Service created | projects.api.ts, projects.service.ts |
| useArtists | ✅ API/Service created | artists.api.ts, artists.service.ts |
| useStudio | ✅ API/Service created | studio.api.ts, studio.service.ts |
| useAdminAuth | ✅ Migrated | → admin.api.ts |
| useBotMetrics | ✅ Migrated | → admin.api.ts |
| useUserBalanceSummary | ✅ Migrated | → admin.api.ts |
| useAnalyticsTracking | ✅ Migrated | → analytics.api.ts, analytics.service.ts |
| useDeeplinkAnalytics | ✅ Migrated | → analytics.api.ts |
| useJourneyTracking | ✅ Migrated | → analytics.api.ts, analytics.service.ts |
| useGenerationLogs | ✅ Migrated | → generation.api.ts, generation.service.ts |
| usePlaybackTracking | ✅ Migrated | → tracks.api.ts |
| useMelodyAnalysis | ✅ Migrated | → analysis.api.ts, analysis.service.ts |
| useStudioActivityLogger | ✅ Partial | Uses supabase for track_change_log only |

## File Structure

```
src/api/
├── index.ts
├── tracks.api.ts      # Track CRUD, likes, play counts
├── credits.api.ts     # User credits, achievements, leaderboard
├── playlists.api.ts   # Playlist CRUD, track management
├── projects.api.ts    # Music project CRUD, AI concept
├── artists.api.ts     # AI artist CRUD, portrait generation
├── studio.api.ts      # Section replacement, stems, versions
├── admin.api.ts       # Admin role checks, user management, bot metrics
├── analytics.api.ts   # User behavior, deeplinks, journey tracking
├── generation.api.ts  # Generation tasks, logs, statistics
└── analysis.api.ts    # Audio analysis, melody recognition

src/services/
├── index.ts
├── tracks.service.ts      # Track business logic, enrichment
├── credits.service.ts     # XP/level calculations, rewards
├── playlists.service.ts   # Playlist operations
├── projects.service.ts    # Project types, progress tracking
├── artists.service.ts     # Artist creation with portraits
├── studio.service.ts      # Section detection, validation
├── starsPaymentService.ts # Telegram Stars payments
├── telegram-auth.ts       # Telegram authentication
├── telegram-share.ts      # Telegram sharing
├── admin.service.ts       # Admin dashboard, user management
├── analytics.service.ts   # Session management, funnel analysis
├── generation.service.ts  # Generation activity, duration analysis
└── analysis.service.ts    # Music theory, melody analysis

supabase/functions/_shared/
├── economy.ts         # MODEL_COSTS, generation costs (NEW)
├── auth.ts            # Request validation, admin checks (NEW)
├── cors.ts            # CORS headers
├── logger.ts          # Logging utilities
└── ...
```
