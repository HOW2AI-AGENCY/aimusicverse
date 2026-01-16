/**
 * Studio Stores
 *
 * Composed stores for the unified studio functionality.
 * Each store handles a specific domain for better maintainability.
 *
 * @module stores/studio
 *
 * Migration from useUnifiedStudioStore:
 * - Old: import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore'
 * - New: import { useProjectStore, useTrackStore, ... } from '@/stores/studio'
 *
 * Backward compatibility is maintained via the composed store below.
 */

// Export types
export * from './types';

// Export individual stores
export { useProjectStore } from './useProjectStore';
export { useTrackStore } from './useTrackStore';
export { useViewStore } from './useViewStore';
export { usePlaybackStore } from './usePlaybackStore';
export { useLyricsStore } from './useLyricsStore';
export { useStudioHistoryStore, selectHistoryState, selectCanUndo, selectCanRedo } from './useStudioHistoryStore';

// Re-export for convenience
export { useProjectStore as useStudioProjectStore };
export { useTrackStore as useStudioTrackStore };
export { useViewStore as useStudioViewStore };
export { usePlaybackStore as useStudioPlaybackStore };
export { useLyricsStore as useStudioLyricsStore };
export { useStudioHistoryStore as useStudioHistoryStore };

/**
 * COMPOSED STORE (Backward Compatibility)
 *
 * This composes all individual stores into a single store interface
 * that matches the original useUnifiedStudioStore API.
 *
 * Usage:
 * ```typescript
 * // Old way (still works via composition)
 * import { useUnifiedStudioStore } from '@/stores/studio';
 *
 * // New way (granular access)
 * import { useProjectStore, useTrackStore } from '@/stores/studio';
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useProjectStore } from './useProjectStore';
import { useTrackStore } from './useTrackStore';
import { useViewStore } from './useViewStore';
import { usePlaybackStore } from './usePlaybackStore';
import { useLyricsStore } from './useLyricsStore';
import { useStudioHistoryStore } from './useStudioHistoryStore';
import { logger } from '@/lib/logger';

const composedLogger = logger.child({ module: 'ComposedStudioStore' });

/**
 * Composed store that combines all studio stores
 * Provides backward compatibility with useUnifiedStudioStore
 */
export const useUnifiedStudioStore = create<
  // Combine all store states
  ReturnType<typeof useProjectStore.getState> &
  ReturnType<typeof useTrackStore.getState> &
  ReturnType<typeof useViewStore.getState> &
  ReturnType<typeof usePlaybackStore.getState> &
  ReturnType<typeof useLyricsStore.getState> &
  ReturnType<typeof useStudioHistoryStore.getState>
>()(
  devtools((set, get) => {
    // Subscribe to individual stores and sync state
    const syncFromStores = () => {
      const projectState = useProjectStore.getState();
      const trackState = useTrackStore.getState();
      const viewState = useViewStore.getState();
      const playbackState = usePlaybackStore.getState();
      const lyricsState = useLyricsStore.getState();
      const historyState = useStudioHistoryStore.getState();

      return {
        ...projectState,
        ...trackState,
        ...viewState,
        ...playbackState,
        ...lyricsState,
        ...historyState,
      };
    };

    // Initialize with current store states
    const initialState = syncFromStores();

    return {
      ...initialState,

      // Proxy actions to individual stores
      // Project actions
      createProject: useProjectStore.getState().createProject,
      loadProject: useProjectStore.getState().loadProject,
      loadProjectFromData: useProjectStore.getState().loadProjectFromData,
      saveProject: useProjectStore.getState().saveProject,
      closeProject: useProjectStore.getState().closeProject,
      deleteProject: useProjectStore.getState().deleteProject,
      setProjectStatus: useProjectStore.getState().setProjectStatus,
      setMasterVolume: useProjectStore.getState().setMasterVolume,
      setBpm: useProjectStore.getState().setBpm,

      // Track actions
      addTrack: useTrackStore.getState().addTrack,
      addPendingTrack: useTrackStore.getState().addPendingTrack,
      resolvePendingTrack: useTrackStore.getState().resolvePendingTrack,
      updatePendingTrackTaskId: useTrackStore.getState().updatePendingTrackTaskId,
      setTrackActiveVersion: useTrackStore.getState().setTrackActiveVersion,
      addTrackVersion: useTrackStore.getState().addTrackVersion,
      replaceTrackAudio: useTrackStore.getState().replaceTrackAudio,
      removeTrack: useTrackStore.getState().removeTrack,
      updateTrack: useTrackStore.getState().updateTrack,
      setTrackVolume: useTrackStore.getState().setTrackVolume,
      setTrackPan: useTrackStore.getState().setTrackPan,
      toggleTrackMute: useTrackStore.getState().toggleTrackMute,
      toggleTrackSolo: useTrackStore.getState().toggleTrackSolo,
      reorderTracks: useTrackStore.getState().reorderTracks,

      // Clip actions
      addClip: useTrackStore.getState().addClip,
      removeClip: useTrackStore.getState().removeClip,
      updateClip: useTrackStore.getState().updateClip,
      moveClip: useTrackStore.getState().moveClip,
      trimClip: useTrackStore.getState().trimClip,
      duplicateClip: useTrackStore.getState().duplicateClip,

      // Playback actions
      play: usePlaybackStore.getState().play,
      pause: usePlaybackStore.getState().pause,
      stop: usePlaybackStore.getState().stop,
      seek: usePlaybackStore.getState().seek,

      // View actions
      setZoom: useViewStore.getState().setZoom,
      setViewMode: useViewStore.getState().setViewMode,
      setSnapToGrid: useViewStore.getState().setSnapToGrid,
      setGridSize: useViewStore.getState().setGridSize,

      // Lyrics actions
      setCurrentLyrics: useLyricsStore.getState().setCurrentLyrics,
      setCurrentVersionId: useLyricsStore.getState().setCurrentVersionId,
      markLyricsDirty: useLyricsStore.getState().markLyricsDirty,
      markLyricsClean: useLyricsStore.getState().markLyricsClean,
      addSectionNote: useLyricsStore.getState().addSectionNote,
      updateSectionNote: useLyricsStore.getState().updateSectionNote,
      deleteSectionNote: useLyricsStore.getState().deleteSectionNote,
      setActiveNoteId: useLyricsStore.getState().setActiveNoteId,

      // History actions
      pushToHistory: useStudioHistoryStore.getState().pushToHistory,
      undo: useStudioHistoryStore.getState().undo,
      redo: useStudioHistoryStore.getState().redo,
      canUndo: useStudioHistoryStore.getState().canUndo,
      canRedo: useStudioHistoryStore.getState().canRedo,
      clearHistory: useStudioHistoryStore.getState().clearHistory,
      getHistoryLength: useStudioHistoryStore.getState().getHistoryLength,
    };
  }, { name: 'ComposedStudioStore' })
);

// Subscribe to individual stores and update composed store
useProjectStore.subscribe(
  (state) => ({ project: state.project, projectId: state.projectId, isLoading: state.isLoading, isSaving: state.isSaving }),
  (projectState) => {
    useUnifiedStudioStore.setState(projectState as any);
  }
);

useTrackStore.subscribe(
  (state) => ({ tracks: state.tracks, selectedTrackId: state.selectedTrackId, selectedClipId: state.selectedClipId }),
  (trackState) => {
    useUnifiedStudioStore.setState(trackState as any);
  }
);

useViewStore.subscribe(
  (state) => ({ zoom: state.zoom, viewMode: state.viewMode, snapToGrid: state.snapToGrid, gridSize: state.gridSize }),
  (viewState) => {
    useUnifiedStudioStore.setState(viewState as any);
  }
);

usePlaybackStore.subscribe(
  (state) => ({ isPlaying: state.isPlaying, currentTime: state.currentTime }),
  (playbackState) => {
    useUnifiedStudioStore.setState(playbackState as any);
  }
);

useLyricsStore.subscribe(
  (state) => ({ currentLyrics: state.currentLyrics, lyricsVersions: state.lyricsVersions, isLyricsDirty: state.isLyricsDirty }),
  (lyricsState) => {
    useUnifiedStudioStore.setState(lyricsState as any);
  }
);

composedLogger.info('Studio stores composed successfully');
