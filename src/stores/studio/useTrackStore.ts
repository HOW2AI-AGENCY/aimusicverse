/**
 * Track Store
 *
 * Manages studio tracks and clips.
 * Extracted from useUnifiedStudioStore for better maintainability.
 *
 * @module stores/studio/useTrackStore
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger } from '@/lib/logger';
import type {
  StudioTrack,
  StudioClip,
  TrackType,
  TrackStatus,
  StudioTrackVersion,
} from './types';
import { TRACK_COLORS, generateId } from './types';

const trackLogger = logger.child({ module: 'TrackStore' });

// ============ State Interface ============

interface TrackState {
  // State
  tracks: StudioTrack[];
  selectedTrackId: string | null;
  selectedClipId: string | null;

  // Track Actions
  addTrack: (track: Omit<StudioTrack, 'id' | 'clips'>) => string;
  addPendingTrack: (params: { name: string; type: TrackType; taskId?: string }) => string;
  resolvePendingTrack: (taskId: string, versions: { label: string; audioUrl: string; duration?: number }[]) => void;
  updatePendingTrackTaskId: (trackId: string, taskId: string) => Promise<void>;
  setTrackActiveVersion: (trackId: string, versionLabel: string) => void;
  addTrackVersion: (trackId: string, label: string, audioUrl: string, duration?: number) => void;
  replaceTrackAudio: (trackId: string, audioUrl: string, duration?: number) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<StudioTrack>) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;

  // Clip Actions
  addClip: (trackId: string, clip: Omit<StudioClip, 'id' | 'trackId'>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<StudioClip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  trimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  duplicateClip: (clipId: string, newTrackId?: string) => string | null;

  // Selection
  selectTrack: (trackId: string | null) => void;
  selectClip: (clipId: string | null) => void;

  // Batch operations
  setTracks: (tracks: StudioTrack[]) => void;
  clearTracks: () => void;
}

// ============ Store Implementation ============

export const useTrackStore = create<TrackState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tracks: [],
    selectedTrackId: null,
    selectedClipId: null,

    // ============ Track Actions ============

    /**
     * Add a new track
     */
    addTrack: (trackData) => {
      const trackId = generateId();
      const newTrack: StudioTrack = {
        ...trackData,
        id: trackId,
        clips: [],
        color: trackData.color || TRACK_COLORS[trackData.type] || TRACK_COLORS.other,
        status: trackData.status || 'ready',
      };

      set({
        tracks: [...get().tracks, newTrack],
      });

      trackLogger.info('Track added', { trackId, name: newTrack.name, type: newTrack.type });
      return trackId;
    },

    /**
     * Add a pending track (awaiting generation)
     */
    addPendingTrack: ({ name, type, taskId }) => {
      const trackId = generateId();
      const newTrack: StudioTrack = {
        id: trackId,
        name,
        type,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type] || TRACK_COLORS.other,
        clips: [],
        status: 'pending',
        taskId,
      };

      set({
        tracks: [...get().tracks, newTrack],
      });

      trackLogger.info('Pending track added', { trackId, name, type, taskId });
      return trackId;
    },

    /**
     * Update pending track task ID
     */
    updatePendingTrackTaskId: async (trackId: string, taskId: string) => {
      set({
        tracks: get().tracks.map(t =>
          t.id === trackId ? { ...t, taskId } : t
        ),
      });

      trackLogger.debug('Track task ID updated', { trackId, taskId });
      // Note: Actual save will be handled by the project store
    },

    /**
     * Resolve pending track with generated versions
     */
    resolvePendingTrack: (taskId, versions) => {
      set({
        tracks: get().tracks.map(t => {
          if (t.taskId === taskId && t.status === 'pending') {
            return {
              ...t,
              status: 'ready' as TrackStatus,
              versions,
              audioUrl: versions[0]?.audioUrl,
              activeVersionLabel: versions[0]?.label || 'A',
              clips: versions[0] ? [{
                id: generateId(),
                trackId: t.id,
                audioUrl: versions[0].audioUrl,
                name: t.name,
                startTime: 0,
                duration: versions[0].duration || 180,
                trimStart: 0,
                trimEnd: 0,
                fadeIn: 0,
                fadeOut: 0,
              }] : [],
            };
          }
          return t;
        }),
      });

      trackLogger.info('Pending track resolved', { taskId, versionsCount: versions.length });
    },

    /**
     * Set active version for a track
     */
    setTrackActiveVersion: (trackId, versionLabel) => {
      set({
        tracks: get().tracks.map(t => {
          if (t.id === trackId && t.versions) {
            const version = t.versions.find(v => v.label === versionLabel);
            if (version) {
              return {
                ...t,
                activeVersionLabel: versionLabel,
                audioUrl: version.audioUrl,
                clips: t.clips.map((clip, i) =>
                  i === 0 ? { ...clip, audioUrl: version.audioUrl } : clip
                ),
              };
            }
          }
          return t;
        }),
      });

      trackLogger.debug('Track version switched', { trackId, versionLabel });
    },

    /**
     * Add a new version to a track
     */
    addTrackVersion: (trackId, label, audioUrl, duration) => {
      set({
        tracks: get().tracks.map(t => {
          if (t.id === trackId) {
            const existingVersions: StudioTrackVersion[] = t.versions || [
              { label: 'A', audioUrl: t.audioUrl || '', duration: t.clips[0]?.duration }
            ];
            return {
              ...t,
              versions: [...existingVersions, { label, audioUrl, duration }],
            };
          }
          return t;
        }),
      });

      trackLogger.info('Track version added', { trackId, label });
    },

    /**
     * Replace track audio
     */
    replaceTrackAudio: (trackId, audioUrl, duration) => {
      set({
        tracks: get().tracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              audioUrl,
              clips: t.clips.length > 0
                ? t.clips.map((clip, i) => i === 0
                    ? { ...clip, audioUrl, duration: duration || clip.duration }
                    : clip
                  )
                : [{
                    id: generateId(),
                    trackId: t.id,
                    audioUrl,
                    name: t.name,
                    startTime: 0,
                    duration: duration || 180,
                    trimStart: 0,
                    trimEnd: 0,
                    fadeIn: 0,
                    fadeOut: 0,
                  }],
            };
          }
          return t;
        }),
      });

      trackLogger.info('Track audio replaced', { trackId, duration });
    },

    /**
     * Remove a track
     */
    removeTrack: (trackId) => {
      set(state => ({
        tracks: state.tracks.filter(t => t.id !== trackId),
        selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
      }));

      trackLogger.info('Track removed', { trackId });
    },

    /**
     * Update track properties
     */
    updateTrack: (trackId, updates) => {
      set({
        tracks: get().tracks.map(t =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
      });

      trackLogger.debug('Track updated', { trackId, updates });
    },

    /**
     * Set track volume (clamped 0-1)
     */
    setTrackVolume: (trackId, volume) => {
      get().updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
    },

    /**
     * Set track pan (clamped -1 to 1)
     */
    setTrackPan: (trackId, pan) => {
      get().updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) });
    },

    /**
     * Toggle track mute
     */
    toggleTrackMute: (trackId) => {
      set({
        tracks: get().tracks.map(t =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        ),
      });

      trackLogger.debug('Track mute toggled', { trackId });
    },

    /**
     * Toggle track solo (only one track can be solo at a time)
     */
    toggleTrackSolo: (trackId) => {
      const track = get().tracks.find(t => t.id === trackId);
      if (!track) return;

      const wasSolo = track.solo;
      set({
        tracks: get().tracks.map(t => ({
          ...t,
          solo: t.id === trackId ? !wasSolo : false,
        })),
      });

      trackLogger.debug('Track solo toggled', { trackId, isNowSolo: !wasSolo });
    },

    /**
     * Reorder tracks
     */
    reorderTracks: (fromIndex, toIndex) => {
      const tracks = [...get().tracks];
      const [removed] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, removed);
      set({ tracks });

      trackLogger.debug('Tracks reordered', { fromIndex, toIndex });
    },

    // ============ Clip Actions ============

    /**
     * Add a clip to a track
     */
    addClip: (trackId, clipData) => {
      const clipId = generateId();
      set({
        tracks: get().tracks.map(t =>
          t.id === trackId ? {
            ...t,
            clips: [...t.clips, { ...clipData, id: clipId, trackId }],
          } : t
        ),
      });

      trackLogger.info('Clip added', { clipId, trackId });
      return clipId;
    },

    /**
     * Remove a clip
     */
    removeClip: (clipId) => {
      set(state => ({
        tracks: state.tracks.map(t => ({
          ...t,
          clips: t.clips.filter(c => c.id !== clipId),
        })),
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      }));

      trackLogger.info('Clip removed', { clipId });
    },

    /**
     * Update clip properties
     */
    updateClip: (clipId, updates) => {
      set({
        tracks: get().tracks.map(t => ({
          ...t,
          clips: t.clips.map(c =>
            c.id === clipId ? { ...c, ...updates } : c
          ),
        })),
      });

      trackLogger.debug('Clip updated', { clipId, updates });
    },

    /**
     * Move a clip to a different track/time
     */
    moveClip: (clipId, newTrackId, newStartTime) => {
      let clipToMove: StudioClip | null = null;
      const tracksWithoutClip = get().tracks.map(t => {
        const clip = t.clips.find(c => c.id === clipId);
        if (clip) {
          clipToMove = { ...clip, trackId: newTrackId, startTime: newStartTime };
          return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
        }
        return t;
      });

      if (!clipToMove) return;

      set({
        tracks: tracksWithoutClip.map(t =>
          t.id === newTrackId ? { ...t, clips: [...t.clips, clipToMove!] } : t
        ),
      });

      trackLogger.debug('Clip moved', { clipId, newTrackId, newStartTime });
    },

    /**
     * Trim a clip
     */
    trimClip: (clipId, trimStart, trimEnd) => {
      get().updateClip(clipId, { trimStart, trimEnd });
    },

    /**
     * Duplicate a clip
     */
    duplicateClip: (clipId, newTrackId) => {
      let originalClip: StudioClip | null = null;
      for (const track of get().tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          originalClip = clip;
          break;
        }
      }

      if (!originalClip) return null;

      const targetTrackId = newTrackId || originalClip.trackId;
      const newClipId = get().addClip(targetTrackId, {
        audioUrl: originalClip.audioUrl,
        name: `${originalClip.name} (copy)`,
        startTime: originalClip.startTime + originalClip.duration + 0.5,
        duration: originalClip.duration,
        trimStart: originalClip.trimStart,
        trimEnd: originalClip.trimEnd,
        fadeIn: originalClip.fadeIn,
        fadeOut: originalClip.fadeOut,
        color: originalClip.color,
      });

      trackLogger.info('Clip duplicated', { originalClipId: clipId, newClipId, targetTrackId });
      return newClipId;
    },

    // ============ Selection ============

    /**
     * Select a track
     */
    selectTrack: (trackId) => {
      set({ selectedTrackId: trackId });
    },

    /**
     * Select a clip
     */
    selectClip: (clipId) => {
      set({ selectedClipId: clipId });
    },

    // ============ Batch Operations ============

    /**
     * Replace all tracks
     */
    setTracks: (tracks) => {
      set({ tracks });
    },

    /**
     * Clear all tracks
     */
    clearTracks: () => {
      set({ tracks: [], selectedTrackId: null, selectedClipId: null });
    },
  }))
);
