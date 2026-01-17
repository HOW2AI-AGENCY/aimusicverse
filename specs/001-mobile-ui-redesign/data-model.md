# Data Model: Mobile-First Minimalist UI Redesign

**Feature**: Mobile-First Minimalist UI Redesign
**Branch**: `001-mobile-ui-redesign`
**Date**: 2026-01-17

## Overview

This is a UI/UX redesign feature. No database schema changes are required. The data model documents the existing entities and their usage in the redesigned UI components.

---

## Key Entities

### 1. Track

**Description**: Represents a music track with metadata, versions, and audio files.

**Attributes**:
| Attribute | Type | Description | UI Usage |
|-----------|------|-------------|----------|
| `id` | UUID | Primary key | Not displayed |
| `title` | string | Track title | Displayed in track card (max 2 lines) |
| `style` | string | Music style/genre | Displayed as badge in track card |
| `duration` | number | Duration in seconds | Displayed as formatted time (MM:SS) |
| `cover_art_url` | string | CDN URL to cover image | LazyImage with blur placeholder |
| `is_public` | boolean | Public visibility flag | Controls share menu visibility |
| `active_version_id` | UUID | FK to active version | Used by UnifiedVersionSelector |
| `created_at` | timestamp | Creation date | Displayed in detailed view |
| `play_count` | number | Play count (denormalized) | Displayed in detailed view |
| `likes_count` | number | Likes count (denormalized) | Displayed in detailed view |

**Relationships**:
- `track_versions` (1:N) - Two versions per track (A/B)
- `user` (N:1) - Creator of the track
- `playlists` (N:M) - Playlist membership

**UI State**:
```typescript
interface TrackCardData {
  id: string;
  title: string;
  style: string;
  duration: number; // seconds
  coverArtUrl: string;
  hasStems: boolean; // For stem indicator
  versionCount: number; // Always 2 for A/B
  isActive: boolean; // Currently playing
}
```

---

### 2. TrackVersion

**Description**: Represents one of two versions (A or B) of a track.

**Attributes**:
| Attribute | Type | Description | UI Usage |
|-----------|------|-------------|----------|
| `id` | UUID | Primary key | Used for version switching |
| `track_id` | UUID | Parent track FK | Association |
| `version_label` | enum | 'A' or 'B' | Displayed in version selector |
| `is_primary` | boolean | Primary version flag | Visual indicator (badge) |
| `clip_index` | number | 0 or 1 | Internal use |
| `audio_url` | string | CDN URL to audio file | Used by player |
| `waveform_url` | string | CDN URL to waveform JSON | Waveform visualization |

**Relationships**:
- `track` (N:1) - Parent track

**UI State**:
```typescript
interface VersionData {
  id: string;
  label: 'A' | 'B';
  isPrimary: boolean;
  duration: number;
  audioUrl: string;
  waveformUrl?: string;
}
```

---

### 3. Project

**Description**: Represents a music creation project in the studio.

**Attributes**:
| Attribute | Type | Description | UI Usage |
|-----------|------|-------------|----------|
| `id` | UUID | Primary key | Navigation |
| `name` | string | Project name | Displayed in project list |
| `track_id` | UUID | Primary track FK | Association |
| `created_at` | timestamp | Creation date | Displayed in list |
| `updated_at` | timestamp | Last modified | Displayed in list |

**Relationships**:
- `track` (1:1) - Associated track
- `user` (N:1) - Creator

**UI State**:
```typescript
interface ProjectCardData {
  id: string;
  name: string;
  trackTitle: string;
  coverArtUrl: string;
  lastModified: string; // Formatted relative time
  trackCount: number; // Usually 1
}
```

---

### 4. StylePreset

**Description**: Represents a music generation style/genre preset.

**Attributes**:
| Attribute | Type | Description | UI Usage |
|-----------|------|-------------|----------|
| `id` | UUID | Primary key | Selection value |
| `name` | string | Style name | Displayed in selector |
| `description` | string | Style description | Tooltip or subtitle |
| `category` | string | Category grouping | Section headers |
| `example_track_id` | UUID | Example track FK | Preview audio |
| `icon` | string | Icon identifier | Visual in card |

**UI State**:
```typescript
interface StylePresetCard {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  exampleTrackUrl?: string;
  isSelected: boolean;
}
```

---

### 5. UserSession

**Description**: Client-side state for user session (not persisted to database).

**Attributes**:
| Attribute | Type | Description | Persistence |
|-----------|------|-------------|-------------|
| `recent_plays` | Track[] | Last 5 played tracks | sessionStorage |
| `drafts` | DraftData | Generation form drafts | localStorage (30min) |
| `ui_preferences` | UIPrefs | Theme, nav state, etc | Telegram CloudStorage |
| `active_generation` | Generation | Current generation status | sessionStorage |

**UI State**:
```typescript
interface UserSessionState {
  recentPlays: string[]; // Track IDs
  drafts: {
    generate: DraftData;
  };
  uiPreferences: {
    expandedSections: string[];
    lastActiveTab: string;
    preferredStyle?: string;
  };
}

interface DraftData {
  prompt: string;
  styleId: string;
  lyrics?: string;
  isAdvanced: boolean; // Whether advanced mode was last used
  expiresAt: number; // Timestamp
}
```

---

## UI Component State Models

### HomeScreen State

```typescript
interface HomeScreenState {
  sections: {
    quickCreate: boolean; // Always visible
    featured: Track[];
    recentPlays: Track[];
    quickStart: QuickStartCard[];
  };
  loading: {
    featured: boolean;
    recentPlays: boolean;
  };
  error: {
    featured?: Error;
    recentPlays?: Error;
  };
}
```

### Navigation State

```typescript
interface NavigationState {
  activeTab: 'home' | 'library' | 'projects' | 'more';
  fabActive: boolean; // Is FAB menu expanded
  badgeCounts: {
    more: number; // Notifications
  };
}
```

### Player State

```typescript
interface PlayerState {
  mode: 'compact' | 'expanded' | 'fullscreen';
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0-1
  queue: Track[];
  queueIndex: number;
  version: {
    showSwitcher: boolean;
    selectedId: string | null;
  };
}
```

### GenerationForm State

```typescript
interface GenerationFormState {
  mode: 'simple' | 'advanced';
  values: {
    prompt: string;
    styleId: string;
    lyrics?: string;
    referenceTrackId?: string;
    customTags?: string[];
  };
  ui: {
    isAdvancedExpanded: boolean;
    isSubmitting: boolean;
    validationResult: ValidationResult;
  };
  draft: {
    isDirty: boolean;
    lastSaved: number;
  };
}
```

### LibraryState

```typescript
interface LibraryState {
  tracks: Track[];
  filters: {
    search: string;
    style?: string;
    sortBy: 'recent' | 'name' | 'plays';
  };
  ui: {
    viewMode: 'list' | 'grid';
    selectedIndex: number | null; // For swipe actions
  };
  pagination: {
    page: number;
    hasMore: boolean;
  };
}
```

### StudioState

```typescript
interface StudioState {
  project: Project | null;
  activeTab: 'edit' | 'sections' | 'mixer' | 'export';
  isSheetOpen: boolean;
  mix: {
    stems: StemMix[];
    isSoloActive: boolean;
  };
  undoStack: string[];
  redoStack: string[];
}

interface StemMix {
  stemType: 'vocals' | 'drums' | 'bass' | 'other';
  volume: number; // 0-1
  isMuted: boolean;
  isSolo: boolean;
}
```

---

## Validation Rules

### Track Display
- Title: Truncate to 2 lines with ellipsis
- Style: Display as badge (max 20 chars)
- Duration: Format as MM:SS

### Generation Form
- Prompt: Required, min 10 chars, max 500 chars
- Style: Required, must select from presets
- Lyrics: Optional, max 2000 chars

### Navigation
- Tabs: Exactly 4 items (configurable in future)
- FAB: Always visible, disabled only when offline

### Player
- Progress: 0-1 range
- Volume: 0-1 range
- Queue: Max 100 tracks

---

## State Transitions

### Player Mode Transitions

```
[None] → (user plays track)
   ↓
[Compact] → (user swipes up 100px or taps)
   ↓
[Expanded] → (user continues swiping up)
   ↓
[Fullscreen]

Reverse transitions via swipe down:
[Fullscreen] → [Expanded] → [Compact] → [None] (user stops)
```

### Generation Form Mode Transitions

```
[Simple Mode] → (user taps "Advanced Options")
   ↓
[Advanced Mode] ←→ (user taps "Basic Options")
   ↓
[Persisted in localStorage]
```

### Navigation State Transitions

```
[Tab A Active] → (user taps Tab B)
   ↓
[Tab B Active] → (200-300ms animation)
   ↓
[Tab B Content Visible]
```

---

## Local Storage Schema

### Session Storage (volatile)

```typescript
// Key: "musicverse_session"
{
  "activeGenerationId": string | null,
  "expectedResult": boolean,
  "navigationHistory": string[],
  "playerMode": "compact" | "expanded" | "fullscreen"
}
```

### Local Storage (persistent)

```typescript
// Key: "musicverse_drafts"
{
  "generate": {
    "prompt": string,
    "styleId": string,
    "lyrics": string | null,
    "isAdvanced": boolean,
    "expiresAt": number
  }
}

// Key: "musicverse_prefs"
{
  "theme": "dark" | "light",
  "expandedSections": string[],
  "lastActiveTab": string,
  "preferredStyle": string | null
}
```

---

## API Contracts

Note: No API changes required. All existing endpoints remain unchanged. The redesigned UI will use existing data structures.

### Key Endpoints Used

1. **GET /api/tracks** - Fetch user's tracks (library)
2. **GET /api/tracks/public** - Fetch public tracks (featured, community)
3. **GET /api/tracks/:id/versions** - Fetch track versions (A/B)
4. **POST /api/generate** - Start music generation
5. **GET /api/projects** - Fetch user's projects
6. **GET /api/styles** - Fetch style presets

---

## Migration Notes

**No database migration required.** This is a UI-only redesign.

**Component migration notes**:
- `UnifiedTrackCard` will replace existing track card variants
- `BottomNavigation` will be updated to reduce from 5 to 4 tabs
- `GenerateForm` will be updated with collapsible advanced section
- `MobileHeaderBar` will be standardized across all screens
- `MobileBottomSheet` will be used for studio tabs

**State migration notes**:
- Existing Zustand stores will be maintained
- No breaking changes to state management
- localStorage format remains compatible
