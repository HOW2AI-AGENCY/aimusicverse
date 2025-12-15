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
| usePlaylists | 🔄 Pending | |
| useProjects | 🔄 Pending | |
| useArtists | 🔄 Pending | |
