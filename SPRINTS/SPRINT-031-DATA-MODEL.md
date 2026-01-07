# Sprint 031: Data Model

**Date**: 2026-01-07
**Status**: Phase 1 Design Artifact
**Related**: [SPRINT-031-RESEARCH.md](./SPRINT-031-RESEARCH.md), [SPRINT-031-PLAN.md](./SPRINT-031-PLAN.md)

---

## Overview

This document defines the data entities for Sprint 031 optimization features. All entities are TypeScript interfaces with clear validation rules and state transitions.

---

## Core Entities

### 1. UnifiedStudioStore (Zustand Store)

**Purpose:** Centralized state management for unified studio interface, combining playback, mixer, project, and history state.

```typescript
interface UnifiedStudioStore {
  // ============ Playback State ============
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopMode: 'none' | 'track' | 'region';
  playbackRate: number;

  // ============ Mixer State ============
  masterVolume: number;
  masterMuted: boolean;
  stemStates: Record<string, StemState>;
  hasSoloStems: boolean;

  // ============ Project State ============
  projectId: string | null;
  project: ProjectState | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // ============ Lyrics State ============
  lyrics: LyricsLineData[];
  activeLyricsIndex: number;
  isLyricsDirty: boolean;

  // ============ View State ============
  zoom: number;
  viewMode: 'player' | 'sections' | 'vocals' | 'stems' | 'midi' | 'mixer' | 'actions';

  // ============ Actions ============
  play(): void;
  pause(): void;
  seek(time: number): void;
  setLoopMode(mode: LoopMode): void;
  setMasterVolume(volume: number): void;
  setStemVolume(stemId: string, volume: number): void;
  toggleStemMute(stemId: string): void;
  toggleStemSolo(stemId: string): void;
  undo(): void;
  redo(): void;
  resetAll(): void;

  // ============ Selectors (computed) ============
  getEffectiveVolume(stemId: string): number;
  getIsMuted(stemId: string): boolean;
  getActiveStems(): string[];
}
```

**Validation Rules:**
- `currentTime`: Must be between 0 and `duration`
- `masterVolume`: Must be between 0 and 1
- `zoom`: Must be between 0.1 (10%) and 10 (1000%)
- `projectId`: Must be valid UUID if not null

**State Transitions:**
- `isPlaying: false → true`: User clicks play, calls `play()`
- `isPlaying: true → false`: User clicks pause, track ends, calls `pause()`
- `hasSoloStems: false → true`: Any stem solo is enabled
- `hasUnsavedChanges: false → true`: Any state modification

---

### 2. StemState (Mixer Channel)

**Purpose:** Represents individual audio stem with volume, pan, and effects state.

```typescript
interface StemState {
  id: string;                    // Unique stem identifier
  name: string;                  // Display name (e.g., "Vocals")
  shortName: string;             // Abbreviated name for compact UI
  icon: string;                  // Emoji icon (e.g., "🎤")
  color: string;                 // CSS color for visual identification
  url: string;                   // Audio file URL
  volume: number;                // 0 to 1 (linear)
  pan: number;                   // -1 (left) to 1 (right)
  muted: boolean;                // Mute toggle
  solo: boolean;                 // Solo toggle
  isPlaying: boolean;            // Currently playing
  hasEffects: boolean;           // Effects chain enabled
  waveform: number[] | null;     // Cached waveform data
  duration: number;              // Duration in seconds
}
```

**Validation Rules:**
- `id`: Must be unique across all stems
- `volume`: Must be between 0 and 1
- `pan`: Must be between -1 and 1
- `url`: Must be valid HTTPS URL
- `duration`: Must be greater than 0

**Computed Properties:**
```typescript
interface StemStateComputed {
  effectiveVolume: number;       // Actual output (accounts for solo/mute)
  isAudible: boolean;            // Can be heard in current mix
  panPosition: number;           // -50% to 50% for UI display
}
```

**State Transitions:**
- `muted: false → true`: User clicks mute button
- `solo: false → true`: User clicks solo button (clears other solos)
- `volume: x → y`: User drags volume slider

---

### 3. LyricsLineData (Lyrics Display)

**Purpose:** Represents single line of lyrics with timing and word-level sync.

```typescript
interface LyricsLineData {
  id: string;                    // Unique line identifier
  text: string;                  // Full lyrics text
  startTime: number;             // Start time in seconds
  endTime: number;               // End time in seconds
  words: WordSync[];             // Word-level sync data
  section: 'verse' | 'chorus' | 'bridge' | 'outro' | 'other';
  isActive: boolean;             // Currently being sung
  isNext: boolean;               // Next line to sing
  isPast: boolean;               // Already sung
}

interface WordSync {
  word: string;                  // Individual word
  startTime: number;             // Word start time
  endTime: number;               // Word end time
}
```

**Validation Rules:**
- `id`: Must be unique across all lines
- `text`: Must not be empty (min 1 character)
- `startTime`: Must be < `endTime`
- `endTime`: Must be ≤ track duration
- `words[].startTime`: Must be ≥ line `startTime`
- `words[].endTime`: Must be ≤ line `endTime`

**State Transitions:**
- `isActive: false → true`: Current playback time ≥ `startTime`
- `isNext: false → true`: Previous line became `isActive`
- `isPast: false → true`: Current playback time > `endTime`

---

### 4. WaveformCacheEntry (IndexedDB)

**Purpose:** Cached waveform data with metadata for IndexedDB persistence.

```typescript
interface WaveformCacheEntry {
  trackId: string;               // Track identifier (primary key)
  url: string;                   // Audio URL (alternate key)
  data: Uint8Array;              // Compressed waveform peaks (1 byte per sample)
  max: number;                   // Max amplitude for decompression
  peaks: number[];               // Decompressed peaks (memory cache only)
  duration: number;              // Audio duration in seconds
  sampleRate: number;            // Samples per second (e.g., 60 Hz)
  createdAt: number;             // Timestamp of cache creation (ms)
  lastAccessed: number;          // Timestamp of last access (ms)
  accessCount: number;           // Number of times accessed
  expiresAt: number;             // Expiration timestamp (7 days TTL)
  size: number;                  // Size in bytes
}
```

**Validation Rules:**
- `trackId`: Must be valid UUID
- `url`: Must be valid HTTPS URL
- `data.length`: Must be > 0
- `max`: Must be > 0
- `createdAt`: Must be ≤ `expiresAt`
- `expiresAt`: Must be `createdAt + 7 days`
- `size`: Must be ≤ 50MB (iOS Safari limit)

**State Transitions:**
- `lastAccessed`: Updated on every cache read
- `accessCount`: Incremented on every cache read
- Cache expires when `Date.now() > expiresAt`

**Decompression:**
```typescript
function decompress(entry: WaveformCacheEntry): number[] {
  return Array.from(entry.data).map(v => (v / 255) * entry.max);
}
```

---

### 5. BPMResult (Audio Analysis)

**Purpose:** BPM detection result with beat positions for snap-to-grid.

```typescript
interface BPMResult {
  bpm: number | null;            // Detected tempo (null if unknown)
  confidence: number;            // Detection confidence (0 to 1)
  beatPositions: number[];       // Beat times in seconds
  duration: number;              // Audio duration in seconds
  timeSignature: number;         // Beats per measure (default 4)
  analyzedAt: number;            // Analysis timestamp (ms)
}

interface BPMSnapResult {
  snappedTime: number;           // Time after snapping
  gridType: 'beat' | 'seconds';  // Which grid was used
  distanceToGrid: number;        // How far we snapped (seconds)
  resolution: SnapResolution;    // Snap resolution used
}

type SnapResolution = 'bar' | 'beat' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
```

**Validation Rules:**
- `bpm`: Must be > 0 if not null (typical range: 60-200)
- `confidence`: Must be between 0 and 1
- `beatPositions`: Must be sorted ascending, no duplicates
- `beatPositions[i]`: Must be between 0 and `duration`

**Fallback:**
- If `bpm === null` or `confidence < 0.3`, use seconds-based grid (1-second intervals)

---

### 6. TimelineMarker (Timeline Display)

**Purpose:** Visual marker on timeline for beats, bars, and sections.

```typescript
interface TimelineMarker {
  id: string;                    // Unique marker identifier
  time: number;                  // Time position in seconds
  label: string;                 // Display label (e.g., "1.1", "Verse")
  type: 'beat' | 'bar' | 'section' | 'custom';
  isVisible: boolean;            // Show/hide based on zoom level
  importance: 'primary' | 'secondary' | 'tertiary';
  color?: string;                // Optional color override
}

interface TimelineGrid {
  bpmResult: BPMResult | null;
  markers: TimelineMarker[];
  snapResolution: SnapResolution;
  zoom: number;                  // Pixels per second
}
```

**Validation Rules:**
- `time`: Must be ≥ 0
- `label`: Must not be empty
- `zoom`: Must be between 10 and 1000 px/sec

**Visibility Logic:**
- Beat markers: Visible when `zoom > 50 px/sec`
- Bar markers: Visible when `zoom > 20 px/sec`
- Section markers: Always visible

---

## Relationships

```
UnifiedStudioStore
├── contains → StemState[] (masterVolume applies to all)
├── contains → LyricsLineData[] (displayed in lyrics panel)
├── references → BPMResult (for timeline snap)
└── caches → WaveformCacheEntry[] (via IndexedDB)

StemState
└── references → WaveformCacheEntry (stem.waveform)

LyricsLineData
├── contains → WordSync[] (word-level sync)
└── references → BPMResult (for timing alignment)

BPMResult
├── calculated from → AudioBuffer (Tone.js / Web Audio API)
└── used by → TimelineMarker[] (grid generation)
```

---

## State Transitions

### Playback State Machine

```
[STOPPED] ─play()→ [PLAYING] ─pause()→ [STOPPED]
    ↑                                    ↓
    └────────── seek(0) ──────────────────┘
```

### Mixer Solo State Machine

```
[NONE_SOLOD] ─toggleSolo(A)→ [A_SOLOD] ─toggleSolo(B)→ [B_SOLOD]
     ↓                                      ↓
toggleSolo(A)                          toggleSolo(A)
     ↓                                      ↓
[A_SOLOD] ◄───────────────────────────── [B_SOLOD]
     └─toggleSolo(A)──→ [NONE_SOLOD] ←────toggleSolo(B)
```

### Cache State Machine

```
[NOT_CACHED] ─getWaveform()→ [FETCHING] ─success→ [CACHED]
                                │            │
                                │            └─7 days→ [EXPIRED]
                                │                     │
                                └─error→ [FAILED] ──────┘
```

---

## TypeScript Type Definitions

```typescript
// ============ Unified Studio Store ============
export interface UnifiedStudioStore extends
  PlaybackSlice,
  StemMixerSlice,
  HistorySlice,
  ProjectSlice,
  LyricsSlice {
  projectId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

// ============ Stem State ============
export interface StemState {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly icon: string;
  readonly color: string;
  readonly url: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  readonly isPlaying: boolean;
  readonly hasEffects: boolean;
  waveform: number[] | null;
  readonly duration: number;
}

// ============ Lyrics Data ============
export interface LyricsLineData {
  readonly id: string;
  text: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly words: readonly WordSync[];
  readonly section: LyricsSection;
  isActive: boolean;
  isNext: boolean;
  isPast: boolean;
}

export interface WordSync {
  readonly word: string;
  readonly startTime: number;
  readonly endTime: number;
}

export type LyricsSection = 'verse' | 'chorus' | 'bridge' | 'outro' | 'other';

// ============ Waveform Cache ============
export interface WaveformCacheEntry {
  readonly trackId: string;
  readonly url: string;
  data: Uint8Array;
  readonly max: number;
  peaks?: number[]; // Memory cache only (not persisted)
  readonly duration: number;
  readonly sampleRate: number;
  readonly createdAt: number;
  lastAccessed: number;
  accessCount: number;
  readonly expiresAt: number;
  readonly size: number;
}

// ============ BPM Detection ============
export interface BPMResult {
  bpm: number | null;
  confidence: number;
  readonly beatPositions: readonly number[];
  readonly duration: number;
  readonly timeSignature: number;
  readonly analyzedAt: number;
}

export interface BPMSnapResult {
  readonly snappedTime: number;
  readonly gridType: 'beat' | 'seconds';
  readonly distanceToGrid: number;
  readonly resolution: SnapResolution;
}

export type SnapResolution =
  | 'bar'
  | 'beat'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth';

// ============ Timeline Markers ============
export interface TimelineMarker {
  readonly id: string;
  readonly time: number;
  readonly label: string;
  readonly type: MarkerType;
  isVisible: boolean;
  readonly importance: MarkerImportance;
  readonly color?: string;
}

export type MarkerType = 'beat' | 'bar' | 'section' | 'custom';
export type MarkerImportance = 'primary' | 'secondary' | 'tertiary';
```

---

## Validation Functions

```typescript
// ============ Stem Validation ============
export function validateStemState(stem: StemState): boolean {
  return (
    stem.id.length > 0 &&
    stem.name.length > 0 &&
    stem.volume >= 0 && stem.volume <= 1 &&
    stem.pan >= -1 && stem.pan <= 1 &&
    stem.duration > 0
  );
}

// ============ Lyrics Validation ============
export function validateLyricsLine(line: LyricsLineData): boolean {
  return (
    line.id.length > 0 &&
    line.text.length > 0 &&
    line.startTime < line.endTime &&
    line.words.every(w => w.startTime >= line.startTime && w.endTime <= line.endTime)
  );
}

// ============ BPM Validation ============
export function validateBPMResult(result: BPMResult): boolean {
  if (result.bpm === null) return true; // Null is valid (no BPM detected)
  return (
    result.bpm > 0 &&
    result.bpm <= 300 &&
    result.confidence >= 0 &&
    result.confidence <= 1 &&
    result.beatPositions.every((t, i) => t >= 0 && t <= result.duration)
  );
}

// ============ Cache Validation ============
export function validateWaveformCache(entry: WaveformCacheEntry): boolean {
  const age = Date.now() - entry.createdAt;
  const isExpired = age > 7 * 24 * 60 * 60 * 1000; // 7 days
  return !isExpired && entry.data.length > 0 && entry.max > 0;
}
```

---

**Data Model Version**: 1.0.0
**Created**: 2026-01-07
**Status**: Ready for implementation
