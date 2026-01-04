/**
 * useUnifiedStudio - Unified Studio Hook
 * 
 * Consolidates logic from multiple studio stores and hooks into a single
 * interface for both track and project modes.
 * 
 * This hook provides:
 * - Project/Track data access
 * - Playback controls
 * - Track controls (mute/solo/volume)
 * - AI actions (stems, extend, cover, replace)
 * - Effects management
 * - History (undo/redo)
 * - Export functionality
 * 
 * @see ADR-011 for architecture decisions
 */

import { useCallback, useMemo } from 'react';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import type { StudioTrack, StudioProject, TrackType } from '@/stores/useUnifiedStudioStore';
import type { StemEffects } from '@/hooks/studio/types';

export interface UseUnifiedStudioOptions {
  mode: 'track' | 'project';
  id: string;
}

export interface UnifiedStudioAPI {
  // Data
  project: StudioProject | null;
  tracks: StudioTrack[];
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setMasterVolume: (volume: number) => void;
  
  // Track controls
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  setVolume: (trackId: string, volume: number) => void;
  setPan: (trackId: string, pan: number) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  
  // Version management
  setActiveVersion: (trackId: string, versionLabel: string) => void;
  
  // History
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  
  // Save/Export
  save: () => Promise<boolean>;
  
  // Helpers
  getTrackById: (trackId: string) => StudioTrack | undefined;
  getTracksByType: (type: TrackType) => StudioTrack[];
  hasStems: boolean;
  hasPendingTracks: boolean;
}

/**
 * Hook that provides unified access to studio functionality
 * for both track and project modes.
 */
export function useUnifiedStudio(options: UseUnifiedStudioOptions): UnifiedStudioAPI {
  const {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    seek,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    setTrackPan,
    setMasterVolume,
    removeTrack,
    reorderTracks,
    setTrackActiveVersion,
    saveProject,
    canUndo: canUndoFn,
    canRedo: canRedoFn,
    undo,
    redo,
  } = useUnifiedStudioStore();

  // Evaluate undo/redo state
  const canUndo = typeof canUndoFn === 'function' ? canUndoFn() : !!canUndoFn;
  const canRedo = typeof canRedoFn === 'function' ? canRedoFn() : !!canRedoFn;

  // Derived state with stem sorting (vocals always first)
  const tracks = useMemo(() => {
    const rawTracks = project?.tracks ?? [];
    
    // Sort tracks: vocals first, then by type priority
    const typeOrder: Record<string, number> = {
      // Vocals always first (priority 0-1)
      vocal: 0,
      vocals: 0,
      voice: 0,
      lead_vocal: 0,
      main_vocal: 0,
      backing_vocals: 1,
      backing_vocal: 1,
      harmonies: 1,
      // Instrumental next
      instrumental: 2,
      // Then by instrument
      drums: 3,
      bass: 4,
      guitar: 5,
      piano: 6,
      keyboard: 7,
      synth: 8,
      strings: 9,
      brass: 10,
      woodwinds: 11,
      percussion: 12,
      fx: 13,
      atmosphere: 14,
      other: 15,
      main: -1, // Main track always first if present
    };
    
    return [...rawTracks].sort((a, b) => {
      // Check both type and stemType (some tracks may use stemType)
      const typeA = (a as any).stemType || a.type || 'other';
      const typeB = (b as any).stemType || b.type || 'other';
      
      // Normalize to lowercase
      const normalizedA = typeA.toLowerCase();
      const normalizedB = typeB.toLowerCase();
      
      // Check if either contains 'vocal' anywhere in the name
      const isVocalA = normalizedA.includes('vocal') || normalizedA === 'voice';
      const isVocalB = normalizedB.includes('vocal') || normalizedB === 'voice';
      
      // Vocals always come first
      if (isVocalA && !isVocalB) return -1;
      if (!isVocalA && isVocalB) return 1;
      
      // Then sort by type order
      const orderA = typeOrder[normalizedA] ?? 99;
      const orderB = typeOrder[normalizedB] ?? 99;
      return orderA - orderB;
    });
  }, [project?.tracks]);
  
  const duration = useMemo(() => {
    if (project?.durationSeconds) return project.durationSeconds;
    // Calculate from tracks if not set
    const maxDuration = tracks.reduce((max, track) => {
      const trackDuration = track.clips?.reduce((clipMax, clip) => {
        return Math.max(clipMax, clip.startTime + clip.duration);
      }, 0) ?? 0;
      return Math.max(max, trackDuration);
    }, 0);
    return maxDuration || 180; // Default 3 minutes
  }, [project?.durationSeconds, tracks]);

  const masterVolume = project?.masterVolume ?? 0.85;

  // Check if stems exist
  const hasStems = useMemo(() => {
    const stemTypes = ['vocal', 'instrumental', 'drums', 'bass', 'other'];
    return tracks.some(t => stemTypes.includes(t.type));
  }, [tracks]);

  // Check for pending tracks
  const hasPendingTracks = useMemo(() => {
    return tracks.some(t => t.status === 'pending' || t.status === 'processing');
  }, [tracks]);

  // Helper functions
  const getTrackById = useCallback((trackId: string) => {
    return tracks.find(t => t.id === trackId);
  }, [tracks]);

  const getTracksByType = useCallback((type: TrackType) => {
    return tracks.filter(t => t.type === type);
  }, [tracks]);

  // Wrapped actions with mode-aware behavior
  const toggleMute = useCallback((trackId: string) => {
    toggleTrackMute(trackId);
  }, [toggleTrackMute]);

  const toggleSolo = useCallback((trackId: string) => {
    toggleTrackSolo(trackId);
  }, [toggleTrackSolo]);

  const setVolume = useCallback((trackId: string, volume: number) => {
    setTrackVolume(trackId, volume);
  }, [setTrackVolume]);

  const setPan = useCallback((trackId: string, pan: number) => {
    setTrackPan(trackId, pan);
  }, [setTrackPan]);

  const setActiveVersion = useCallback((trackId: string, versionLabel: string) => {
    setTrackActiveVersion(trackId, versionLabel);
  }, [setTrackActiveVersion]);

  const save = useCallback(async () => {
    return saveProject();
  }, [saveProject]);

  return {
    // Data
    project,
    tracks,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    
    // Playback
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    play,
    pause,
    stop,
    seek,
    setMasterVolume,
    
    // Track controls
    toggleMute,
    toggleSolo,
    setVolume,
    setPan,
    removeTrack,
    reorderTracks,
    
    // Version management
    setActiveVersion,
    
    // History
    canUndo,
    canRedo,
    undo,
    redo,
    
    // Save
    save,
    
    // Helpers
    getTrackById,
    getTracksByType,
    hasStems,
    hasPendingTracks,
  };
}

export type { StudioTrack, StudioProject, TrackType };
