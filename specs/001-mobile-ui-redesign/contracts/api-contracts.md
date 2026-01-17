# API Contracts: Mobile-First Minimalist UI Redesign

**Feature**: Mobile-First Minimalist UI Redesign
**Branch**: `001-mobile-ui-redesign`
**Date**: 2026-01-17

## Overview

This is a UI/UX redesign feature. **No API changes are required.** All existing endpoints remain unchanged. This document catalogs the existing API contracts that will be used by the redesigned UI.

---

## Existing API Endpoints

### Tracks

#### GET /api/tracks
Fetch user's private tracks.

**Request**:
```typescript
interface GetTracksRequest {
  userId: string;
  limit?: number; // Default: 20
  offset?: number; // Default: 0
  sortBy?: 'recent' | 'name' | 'plays'; // Default: 'recent'
}
```

**Response**:
```typescript
interface GetTracksResponse {
  tracks: Track[];
  total: number;
  hasMore: boolean;
}

interface Track {
  id: string;
  title: string;
  style: string;
  duration: number;
  cover_art_url: string;
  is_public: boolean;
  active_version_id: string;
  created_at: string; // ISO timestamp
  play_count: number;
  likes_count: number;
  has_stems: boolean;
  versions: TrackVersion[];
}
```

**UI Usage**: Library page, recent plays section

---

#### GET /api/tracks/public
Fetch public tracks for featured/community sections.

**Request**:
```typescript
interface GetPublicTracksRequest {
  limit?: number; // Default: 10
  offset?: number;
  style?: string; // Filter by style
}
```

**Response**: Same as `GetTracksResponse`

**UI Usage**: Home page (Featured section), Community page

---

#### GET /api/tracks/:id/versions
Fetch A/B versions for a track.

**Request**:
```typescript
// URL parameter: track ID
```

**Response**:
```typescript
interface GetVersionsResponse {
  versions: TrackVersion[];
}

interface TrackVersion {
  id: string;
  track_id: string;
  version_label: 'A' | 'B';
  is_primary: boolean;
  clip_index: 0 | 1;
  audio_url: string;
  waveform_url: string;
  duration: number;
}
```

**UI Usage**: Version selector in player, track detail sheet

---

### Generation

#### POST /api/generate
Start music generation.

**Request**:
```typescript
interface GenerateRequest {
  prompt: string;
  style: string;
  lyrics?: string;
  reference_track_id?: string;
  custom_tags?: string[];
}
```

**Response**:
```typescript
interface GenerateResponse {
  generation_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimated_wait?: number; // seconds
}
```

**UI Usage**: Generation form submit

---

#### GET /api/generations/:id
Check generation status.

**Response**:
```typescript
interface GenerationStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-1
  tracks?: Track[]; // Available when completed
  error?: string; // Available when failed
}
```

**UI Usage**: Generation progress tracking, result sheet

---

### Projects

#### GET /api/projects
Fetch user's studio projects.

**Request**:
```typescript
interface GetProjectsRequest {
  userId: string;
  limit?: number;
  offset?: number;
}
```

**Response**:
```typescript
interface GetProjectsResponse {
  projects: Project[];
  total: number;
}

interface Project {
  id: string;
  name: string;
  track_id: string;
  created_at: string;
  updated_at: string;
  track: Track; // Associated track
}
```

**UI Usage**: Projects page, studio hub

---

### Style Presets

#### GET /api/styles
Fetch available music generation styles.

**Response**:
```typescript
interface GetStylesResponse {
  styles: StylePreset[];
  categories: string[];
}

interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  example_track_id?: string;
  popularity: number; // For sorting
}
```

**UI Usage**: Generation form style selector

---

## WebSocket / Realtime Subscriptions

### Supabase Realtime: New Tracks

Subscribe to new tracks for post-generation result display.

**Channel**: `tracks:user_id=USER_ID`

**Event**: `INSERT`

**Payload**:
```typescript
interface TrackInsertEvent {
  type: 'INSERT';
  table: 'tracks';
  record: Track;
  old: null;
}
```

**UI Usage**: `GenerationResultSheet` auto-open on completion

---

### Supabase Realtime: Generation Status

Subscribe to generation status updates.

**Channel**: `generations:id=GENERATION_ID`

**Events**: `UPDATE`, `INSERT`

**Payload**:
```typescript
interface GenerationUpdateEvent {
  type: 'UPDATE' | 'INSERT';
  table: 'generations';
  record: Generation;
  old: Generation | null;
}
```

**UI Usage**: Real-time progress bar in generation form

---

## Client-Only Operations

The following operations are handled client-side without API calls:

### Local Storage Drafts
- Generation form drafts auto-save
- UI preferences (expanded sections, last active tab)
- Recent plays cache

### Session State
- Player mode (compact/expanded/fullscreen)
- Active tab state
- Navigation history

### Telegram SDK Integration
- Haptic feedback calls (no network request)
- Safe area insets (CSS env() variables)
- Back button handling (local navigation)

---

## Error Handling

### Standard Error Response

All endpoints may return:

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

### HTTP Status Codes

| Code | Usage | UI Handling |
|------|-------|-------------|
| 200 | Success | Display data |
| 400 | Bad Request | Show inline validation error |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show "access denied" message |
| 404 | Not Found | Show empty state |
| 429 | Rate Limited | Show "try again later" with retry |
| 500 | Server Error | Show error with retry button |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/generate | 10 requests | 1 hour |
| GET /api/tracks | 100 requests | 1 minute |
| GET /api/tracks/public | 100 requests | 1 minute |

**UI Handling for Rate Limits**:
- Disable submit button with countdown
- Show toast notification with remaining time
- Retry automatically when limit expires

---

## Caching Strategy

### TanStack Query Cache Configuration

```typescript
// Static data (styles, categories)
{
  staleTime: Infinity,
  gcTime: Infinity,
}

// User tracks
{
  staleTime: 30_000, // 30 seconds
  gcTime: 600_000, // 10 minutes
  refetchOnWindowFocus: false,
}

// Public tracks
{
  staleTime: 60_000, // 1 minute
  gcTime: 300_000, // 5 minutes
}

// Generation status
{
  staleTime: 0, // Always fresh
  refetchInterval: 2000, // Poll every 2 seconds when active
}
```

---

## Summary

This redesign uses **existing API contracts without modification**. All changes are UI-layer only, focusing on:

1. Component restructuring and consolidation
2. Visual design system updates
3. Interaction pattern improvements
4. State management optimizations

No breaking changes to backend services or database schema.
