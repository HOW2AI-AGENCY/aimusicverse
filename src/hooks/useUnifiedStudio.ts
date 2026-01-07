/**
 * useUnifiedStudio - Unified hook for studio playback and state management
 * 
 * Provides a facade that automatically determines the mode:
 * - Track Mode: Uses global player for single track playback
 * - Project Mode: Uses studio store for multi-track DAW functionality
 * 
 * This hook consolidates logic from usePlayerState and useUnifiedStudioStore
 * to provide a consistent API regardless of context.
 * 
 * @see ADR-012 for architecture decisions
 * @see SPRINT-030-UNIFIED-STUDIO-MOBILE.md for specification
 */

import { useCallback, useMemo } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useUnifiedStudioStore, StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';
import type { Track } from '@/types/track';

/**
 * Studio mode types
 */
export type StudioMode = 'track' | 'project' | 'idle';

/**
 * Playback state shared across modes
 */
export interface UnifiedPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

/**
 * Unified studio actions
 */
export interface UnifiedStudioActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

/**
 * Track info - normalized from either Track or StudioTrack
 */
export interface UnifiedTrackInfo {
  id: string;
  name: string;
  audioUrl: string | undefined;
  duration: number | undefined;
  coverUrl: string | undefined;
}

/**
 * Return type for useUnifiedStudio hook
 */
export interface UseUnifiedStudioResult {
  // Mode detection
  mode: StudioMode;
  isTrackMode: boolean;
  isProjectMode: boolean;
  isIdle: boolean;
  
  // Current content
  activeTrack: UnifiedTrackInfo | null;
  project: StudioProject | null;
  tracks: StudioTrack[];
  
  // Playback state (unified)
  playback: UnifiedPlaybackState;
  
  // Actions (unified)
  actions: UnifiedStudioActions;
  
  // Mode-specific access
  playerStore: ReturnType<typeof usePlayerStore>;
  studioStore: ReturnType<typeof useUnifiedStudioStore>;
}

/**
 * Options for useUnifiedStudio
 */
export interface UseUnifiedStudioOptions {
  /** Force a specific mode instead of auto-detecting */
  forceMode?: StudioMode;
  /** Project ID to load (if provided, forces project mode) */
  projectId?: string;
  /** Track to load (if provided, forces track mode) */
  track?: Track;
}

/**
 * useUnifiedStudio hook
 * 
 * Auto-detects and unifies studio state management across track and project modes.
 * 
 * @example
 * ```tsx
 * // Auto-detect mode
 * const { mode, playback, actions } = useUnifiedStudio();
 * 
 * // Force project mode
 * const { project, tracks } = useUnifiedStudio({ forceMode: 'project' });
 * 
 * // With specific project
 * const studio = useUnifiedStudio({ projectId: 'abc-123' });
 * ```
 */
export function useUnifiedStudio(options: UseUnifiedStudioOptions = {}): UseUnifiedStudioResult {
  const { forceMode, projectId, track } = options;
  
  // Get both stores
  const playerStore = usePlayerStore();
  const studioStore = useUnifiedStudioStore();
  
  // Determine mode
  const mode = useMemo<StudioMode>(() => {
    // Forced mode takes precedence
    if (forceMode) return forceMode;
    
    // Project ID forces project mode
    if (projectId) return 'project';
    
    // Track parameter forces track mode
    if (track) return 'track';
    
    // Auto-detect based on active state
    if (studioStore.project) return 'project';
    if (playerStore.activeTrack) return 'track';
    
    return 'idle';
  }, [forceMode, projectId, track, studioStore.project, playerStore.activeTrack]);
  
  const isTrackMode = mode === 'track';
  const isProjectMode = mode === 'project';
  const isIdle = mode === 'idle';
  
  // Normalize active track info
  const activeTrack = useMemo<UnifiedTrackInfo | null>(() => {
    if (isProjectMode && studioStore.project?.tracks?.[0]) {
      const t = studioStore.project.tracks[0];
      return {
        id: t.id,
        name: t.name,
        audioUrl: t.audioUrl || t.clips?.[0]?.audioUrl,
        duration: studioStore.project.durationSeconds,
        coverUrl: undefined,
      };
    }
    
    if (isTrackMode && playerStore.activeTrack) {
      const t = playerStore.activeTrack;
      return {
        id: t.id,
        name: t.title || 'Untitled',
        audioUrl: t.audio_url || undefined,
        duration: t.duration_seconds || undefined,
        coverUrl: t.cover_url || undefined,
      };
    }
    
    return null;
  }, [isProjectMode, isTrackMode, studioStore.project, playerStore.activeTrack]);
  
  // Unified playback state
  const playback = useMemo<UnifiedPlaybackState>(() => {
    if (isProjectMode) {
      return {
        isPlaying: studioStore.isPlaying,
        currentTime: studioStore.currentTime,
        duration: studioStore.project?.durationSeconds || 0,
        volume: studioStore.project?.masterVolume || 0.85,
      };
    }
    
    // Track mode or idle - use player store
    return {
      isPlaying: playerStore.isPlaying,
      currentTime: 0, // Time is managed by audio element in track mode
      duration: playerStore.activeTrack?.duration_seconds || 0,
      volume: playerStore.volume,
    };
  }, [
    isProjectMode,
    studioStore.isPlaying,
    studioStore.currentTime,
    studioStore.project?.durationSeconds,
    studioStore.project?.masterVolume,
    playerStore.isPlaying,
    playerStore.activeTrack?.duration_seconds,
    playerStore.volume,
  ]);
  
  // Unified actions
  const play = useCallback(() => {
    if (isProjectMode) {
      studioStore.play();
    } else {
      playerStore.playTrack();
    }
  }, [isProjectMode, studioStore, playerStore]);
  
  const pause = useCallback(() => {
    if (isProjectMode) {
      studioStore.pause();
    } else {
      playerStore.pauseTrack();
    }
  }, [isProjectMode, studioStore, playerStore]);
  
  const stop = useCallback(() => {
    if (isProjectMode) {
      studioStore.stop();
    } else {
      playerStore.pauseTrack();
      // Player doesn't have stop - pause and seek to 0 would require audio element access
    }
  }, [isProjectMode, studioStore, playerStore]);
  
  const seek = useCallback((time: number) => {
    if (isProjectMode) {
      studioStore.seek(time);
    }
    // Track mode seeking is handled by audio element directly
  }, [isProjectMode, studioStore]);
  
  const setVolume = useCallback((volume: number) => {
    if (isProjectMode) {
      studioStore.setMasterVolume(volume);
    } else {
      playerStore.setVolume(volume);
    }
  }, [isProjectMode, studioStore, playerStore]);
  
  const toggleMute = useCallback(() => {
    // Simple toggle between current volume and 0
    const currentVolume = isProjectMode 
      ? studioStore.project?.masterVolume || 0.85
      : playerStore.volume;
    
    if (currentVolume > 0) {
      setVolume(0);
    } else {
      setVolume(0.85);
    }
  }, [isProjectMode, studioStore.project?.masterVolume, playerStore.volume, setVolume]);
  
  const actions = useMemo<UnifiedStudioActions>(() => ({
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleMute,
  }), [play, pause, stop, seek, setVolume, toggleMute]);
  
  return {
    // Mode
    mode,
    isTrackMode,
    isProjectMode,
    isIdle,
    
    // Content
    activeTrack,
    project: studioStore.project,
    tracks: studioStore.project?.tracks || [],
    
    // Unified state
    playback,
    actions,
    
    // Direct store access for advanced usage
    playerStore,
    studioStore,
  };
}

export default useUnifiedStudio;
