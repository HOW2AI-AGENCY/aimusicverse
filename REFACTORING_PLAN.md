# Refactoring Plan: Split useUnifiedStudioStore

## Current State
- **File**: `src/stores/useUnifiedStudioStore.ts`
- **Size**: 1,343 lines (~38KB)
- **Problem**: Violates Single Responsibility Principle, difficult to maintain

## Analysis

### Current Responsibilities
1. **Project Management** (CRUD operations, loading, saving)
2. **Track Management** (add, update, remove, reorder, versions)
3. **Clip Management** (add, remove, update, move, trim, duplicate)
4. **Playback Control** (play, pause, stop, seek)
5. **Selection State** (track/clip selection)
6. **View Settings** (zoom, view mode, snap to grid)
7. **Lyrics Management** (versions, section notes)
8. **History/Undo-Redo** (30 levels)
9. **Database Sync** (Supabase integration)

### Dependencies
- `zustand` (state management)
- `zustand/middleware` (persist, subscribeWithSelector)
- `@/lib/zustand/historyMiddleware` (undo/redo)
- `@/integrations/supabase/client` (database)
- `@/types/studio-entities` (types)

## Proposed Architecture

### New Store Structure
```
src/stores/studio/
├── index.ts                      # Main export, composes all stores
├── types.ts                      # Shared types
├── useProjectStore.ts            # Project CRUD operations (~300 lines)
├── useTrackStore.ts              # Track & clip management (~400 lines)
├── usePlaybackStore.ts           # Playback control (~200 lines)
├── useViewStore.ts               # View settings (~150 lines)
├── useLyricsStore.ts             # Lyrics & section notes (~200 lines)
└── useStudioHistoryStore.ts      # History/undo-redo (~100 lines)
```

### Store Responsibilities

#### 1. useProjectStore (~300 lines)
**State:**
```typescript
interface ProjectState {
  project: StudioProject | null;
  projectId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
}
```

**Actions:**
- `createProject(params)` - Create new project
- `loadProject(projectId)` - Load from database
- `loadProjectFromData(data)` - Load from object
- `saveProject()` - Save to database
- `closeProject()` - Clear current project
- `deleteProject(projectId)` - Delete from database

**Dependencies:** Supabase client

---

#### 2. useTrackStore (~400 lines)
**State:**
```typescript
interface TrackState {
  tracks: StudioTrack[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
}
```

**Actions:**
- `addTrack(track)` - Add new track
- `addPendingTrack(params)` - Add track with pending status
- `resolvePendingTrack(taskId, versions)` - Resolve pending track
- `updatePendingTrackTaskId(trackId, taskId)` - Update task ID
- `removeTrack(trackId)` - Remove track
- `updateTrack(trackId, updates)` - Update track properties
- `setTrackVolume(trackId, volume)` - Set volume
- `setTrackPan(trackId, pan)` - Set pan
- `toggleTrackMute(trackId)` - Toggle mute
- `toggleTrackSolo(trackId)` - Toggle solo
- `reorderTracks(fromIndex, toIndex)` - Reorder tracks
- `setTrackActiveVersion(trackId, versionLabel)` - Switch version
- `addTrackVersion(trackId, label, audioUrl, duration)` - Add version
- `replaceTrackAudio(trackId, audioUrl, duration)` - Replace audio

**Clip Actions:**
- `addClip(trackId, clip)` - Add clip to track
- `removeClip(clipId)` - Remove clip
- `updateClip(clipId, updates)` - Update clip
- `moveClip(clipId, newTrackId, newStartTime)` - Move clip
- `trimClip(clipId, trimStart, trimEnd)` - Trim clip
- `duplicateClip(clipId, newTrackId)` - Duplicate clip

---

#### 3. usePlaybackStore (~200 lines)
**State:**
```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  masterVolume: number;
  bpm: number;
}
```

**Actions:**
- `play()` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop playback
- `seek(time)` - Seek to time
- `setMasterVolume(volume)` - Set master volume
- `setBpm(bpm)` - Set BPM

---

#### 4. useViewStore (~150 lines)
**State:**
```typescript
interface ViewState {
  zoom: number;
  viewMode: ViewMode;
  snapToGrid: boolean;
  gridSize: number;
}
```

**Actions:**
- `setZoom(zoom)` - Set zoom level
- `setViewMode(mode)` - Set view mode
- `setSnapToGrid(snap)` - Toggle snap to grid
- `setGridSize(size)` - Set grid size

---

#### 5. useLyricsStore (~200 lines)
**State:**
```typescript
interface LyricsState {
  currentLyrics: string | null;
  lyricsVersions: StudioLyricVersion[];
  currentVersionId: string | null;
  isLyricsDirty: boolean;
  sectionNotes: StudioSectionNote[];
  activeNoteId: string | null;
}
```

**Actions:**
- `setCurrentLyrics(content)` - Set current lyrics
- `setCurrentVersionId(versionId)` - Set active version
- `markLyricsDirty()` - Mark as dirty
- `markLyricsClean()` - Mark as clean
- `addSectionNote(note)` - Add section note
- `updateSectionNote(noteId, updates)` - Update note
- `deleteSectionNote(noteId)` - Delete note
- `setActiveNoteId(noteId)` - Set active note

---

#### 6. useStudioHistoryStore (~100 lines)
**State:**
```typescript
interface HistoryState {
  _history: unknown[];
  _historyIndex: number;
  _maxHistory: number;
}
```

**Actions:**
- `pushToHistory()` - Push state to history
- `undo()` - Undo last action
- `redo()` - Redo last action
- `canUndo()` - Check if can undo
- `canRedo()` - Check if can redo
- `clearHistory()` - Clear history
- `getHistoryLength()` - Get history length

**Note:** This store will use the existing `createHistorySlice` from `@/lib/zustand/historyMiddleware`.

---

## Implementation Steps

### Phase 1: Create Shared Types
1. Create `src/stores/studio/types.ts` with all shared types
2. Export types from existing store

### Phase 2: Create Individual Stores
1. Create `useProjectStore.ts` - Extract project management logic
2. Create `useTrackStore.ts` - Extract track/clip logic
3. Create `usePlaybackStore.ts` - Extract playback logic
4. Create `useViewStore.ts` - Extract view settings
5. Create `useLyricsStore.ts` - Extract lyrics logic
6. Create `useStudioHistoryStore.ts` - Extract history logic

### Phase 3: Create Composition Store
1. Create `index.ts` that composes all stores
2. Maintain backward compatibility with existing API

### Phase 4: Migration
1. Update all imports from `useUnifiedStudioStore` to new stores
2. Test all functionality
3. Remove old `useUnifiedStudioStore.ts`

### Phase 5: Cleanup
1. Remove unused code
2. Update documentation
3. Run tests

## Backward Compatibility Strategy

To ensure smooth migration, the composed store will maintain the same API:

```typescript
// Old way (still works)
import { useUnifiedStudioStore } from '@/stores/studio';

// New way (granular access)
import { useProjectStore, useTrackStore, usePlaybackStore } from '@/stores/studio';
```

## Testing Checklist

- [ ] Project CRUD operations
- [ ] Track add/update/remove
- [ ] Clip operations
- [ ] Playback controls
- [ ] Selection state
- [ ] View settings
- [ ] Lyrics versions
- [ ] Section notes
- [ ] Undo/redo (30 levels)
- [ ] Database sync
- [ ] Persistence (localStorage)

## Estimated Timeline

- **Phase 1**: 1 day (types extraction)
- **Phase 2**: 3-4 days (store creation)
- **Phase 3**: 1 day (composition)
- **Phase 4**: 2-3 days (migration and testing)
- **Phase 5**: 1 day (cleanup)

**Total**: 8-10 days

## Benefits

1. **Maintainability**: Each store has single responsibility
2. **Performance**: Smaller stores = faster re-renders
3. **Testability**: Easier to test individual concerns
4. **Developer Experience**: Clearer API, better IDE support
5. **Bundle Size**: Potential for tree-shaking unused stores

## Risks & Mitigation

### Risk 1: Breaking existing functionality
**Mitigation**: Comprehensive testing, gradual migration

### Risk 2: Store interdependencies
**Mitigation**: Use Zustand's subscribe pattern for cross-store communication

### Risk 3: Performance regression
**Mitigation**: Benchmark before/after, optimize selectors

## Success Criteria

- [ ] All tests passing
- [ ] No functionality regressions
- [ ] Store size <500 lines each
- [ ] Improved type safety
- [ ] Better documentation

---

**Created**: 2026-01-16
**Status**: Planning
**Next Steps**: Begin Phase 1 - Types Extraction
