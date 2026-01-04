/**
 * Unified Studio Store
 * 
 * Zustand store for the unified DAW studio with:
 * - Multi-track management
 * - Persistence (localStorage + database sync)
 * - History/undo-redo support
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { createHistorySlice } from '@/lib/zustand/historyMiddleware';
import { Json } from '@/integrations/supabase/types';

// ============ Types ============

export type TrackType = 'main' | 'vocal' | 'instrumental' | 'stem' | 'sfx' | 'drums' | 'bass' | 'other';
export type ProjectStatus = 'draft' | 'mixing' | 'mastering' | 'completed' | 'archived';
export type StemsMode = 'none' | 'simple' | 'detailed';
export type ViewMode = 'timeline' | 'mixer' | 'compact';

export interface StudioClip {
  id: string;
  trackId: string;
  audioUrl: string;
  name: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  color?: string;
  waveformData?: number[];
}

export interface StudioTrackVersion {
  id?: string; // ID from track_versions table (optional)
  label: string;
  audioUrl: string;
  duration?: number;
  metadata?: {
    suno_id?: string;
    version_type?: string;
    created_at?: string;
  };
}

export type TrackStatus = 'ready' | 'pending' | 'processing' | 'failed';

export interface StudioTrack {
  id: string;
  name: string;
  type: TrackType;
  audioUrl?: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  clips: StudioClip[];
  effects?: {
    eq?: boolean;
    reverb?: number;
    compression?: number;
  };
  // Pending/version fields
  status?: TrackStatus;
  taskId?: string;
  versions?: StudioTrackVersion[];
  activeVersionLabel?: string;
  errorMessage?: string;
}

export interface StudioProject {
  id: string;
  userId: string;
  sourceTrackId?: string;
  name: string;
  description?: string;
  bpm: number;
  keySignature?: string;
  timeSignature: string;
  durationSeconds?: number;
  masterVolume: number;
  tracks: StudioTrack[];
  status: ProjectStatus;
  stemsMode: StemsMode;
  viewSettings: ViewSettings;
  createdAt: string;
  updatedAt: string;
  openedAt?: string;
}

export interface ViewSettings {
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  viewMode: ViewMode;
}

export interface CreateProjectParams {
  name: string;
  sourceTrackId?: string;
  sourceAudioUrl?: string;
  duration?: number;
  tracks?: Omit<StudioTrack, 'id' | 'clips'>[];
}

// ============ Track Colors ============

export const TRACK_COLORS: Record<TrackType, string> = {
  main: 'hsl(var(--primary))',
  vocal: 'hsl(340 82% 52%)',
  instrumental: 'hsl(262 83% 58%)',
  stem: 'hsl(142 76% 36%)',
  sfx: 'hsl(38 92% 50%)',
  drums: 'hsl(24 95% 53%)',
  bass: 'hsl(201 96% 32%)',
  other: 'hsl(var(--muted))',
};

// ============ Helpers ============

const generateId = () => crypto.randomUUID();

const createDefaultViewSettings = (): ViewSettings => ({
  zoom: 50,
  snapToGrid: true,
  gridSize: 4,
  viewMode: 'timeline',
});

// ============ Store Interface ============

interface UnifiedStudioState {
  // Current project
  project: StudioProject | null;
  projectId: string | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  
  // Playback
  isPlaying: boolean;
  currentTime: number;
  
  // Selection
  selectedTrackId: string | null;
  selectedClipId: string | null;
  
  // View
  zoom: number;
  viewMode: ViewMode;
  snapToGrid: boolean;
  gridSize: number;
  
  // History (from middleware)
  _history: unknown[];
  _historyIndex: number;
  _maxHistory: number;
  pushToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getHistoryLength: () => number;
  
  // Project Actions
  createProject: (params: CreateProjectParams) => Promise<string | null>;
  loadProject: (projectId: string) => Promise<boolean>;
  loadProjectFromData: (data: StudioProject) => void;
  saveProject: () => Promise<boolean>;
  closeProject: () => void;
  deleteProject: (projectId: string) => Promise<boolean>;
  
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
  
  // Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  
  // Selection
  selectTrack: (trackId: string | null) => void;
  selectClip: (clipId: string | null) => void;
  
  // View
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  
  // Master
  setMasterVolume: (volume: number) => void;
  setBpm: (bpm: number) => void;
  setProjectStatus: (status: ProjectStatus) => void;
  
  // DB Sync
  syncToDatabase: () => Promise<boolean>;
}

// ============ Store Implementation ============

export const useUnifiedStudioStore = create<UnifiedStudioState>()(
  subscribeWithSelector(
    persist(
      (set, get) => {
        // Get history slice
        const historySlice = createHistorySlice(
          set as unknown as (partial: Record<string, unknown>) => void,
          get as unknown as () => Record<string, unknown>,
          { maxHistory: 30, exclude: ['isLoading', 'isSaving', 'lastSavedAt', 'hasUnsavedChanges'] }
        );

        return {
          // Initial state
          project: null,
          projectId: null,
          isLoading: false,
          isSaving: false,
          lastSavedAt: null,
          hasUnsavedChanges: false,
          isPlaying: false,
          currentTime: 0,
          selectedTrackId: null,
          selectedClipId: null,
          zoom: 50,
          viewMode: 'timeline',
          snapToGrid: true,
          gridSize: 4,
          
          // History slice
          ...historySlice,

          // ============ Project Actions ============
          
          createProject: async (params) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const projectId = generateId();
            const tracks: StudioTrack[] = [];

            // Check if we have explicit tracks passed (like from AudioRecordDialog)
            const hasExplicitTracks = params.tracks && params.tracks.length > 0;

            // Add source track as Main Track ONLY if no explicit tracks provided
            // This prevents duplicate tracks (Main + Vocal with same audio)
            if (params.sourceAudioUrl && !hasExplicitTracks) {
              tracks.push({
                id: generateId(),
                name: 'Main Track',
                type: 'main',
                audioUrl: params.sourceAudioUrl,
                volume: 1,
                pan: 0,
                muted: false,
                solo: false,
                color: TRACK_COLORS.main,
                clips: [{
                  id: generateId(),
                  trackId: '',
                  audioUrl: params.sourceAudioUrl,
                  name: params.name,
                  startTime: 0,
                  duration: params.duration || 180,
                  trimStart: 0,
                  trimEnd: 0,
                  fadeIn: 0,
                  fadeOut: 0,
                }],
              });
              tracks[0].clips[0].trackId = tracks[0].id;
            }

            // Add additional tracks (takes priority over auto-generated Main Track)
            if (params.tracks) {
              for (const track of params.tracks) {
                const trackId = generateId();
                tracks.push({
                  ...track,
                  id: trackId,
                  clips: track.audioUrl ? [{
                    id: generateId(),
                    trackId,
                    audioUrl: track.audioUrl,
                    name: track.name,
                    startTime: 0,
                    duration: params.duration || 180,
                    trimStart: 0,
                    trimEnd: 0,
                    fadeIn: 0,
                    fadeOut: 0,
                  }] : [],
                } as StudioTrack);
              }
            }

            const project: StudioProject = {
              id: projectId,
              userId: user.id,
              sourceTrackId: params.sourceTrackId,
              name: params.name,
              bpm: 120,
              timeSignature: '4/4',
              durationSeconds: params.duration,
              masterVolume: 0.85,
              tracks,
              status: 'draft',
              stemsMode: 'none',
              viewSettings: createDefaultViewSettings(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            set({
              project,
              projectId,
              isPlaying: false,
              currentTime: 0,
              selectedTrackId: null,
              selectedClipId: null,
              hasUnsavedChanges: true,
            });

            // Save to database
            try {
              const { error } = await supabase.from('studio_projects').insert({
                id: projectId,
                user_id: user.id,
                source_track_id: params.sourceTrackId,
                name: params.name,
                bpm: 120,
                time_signature: '4/4',
                duration_seconds: params.duration,
                master_volume: 0.85,
                tracks: tracks as unknown as Json,
                status: 'draft',
                stems_mode: 'none',
                view_settings: createDefaultViewSettings() as unknown as Json,
              });

              if (error) throw error;
              
              set({ hasUnsavedChanges: false, lastSavedAt: new Date().toISOString() });
              get().clearHistory();
              get().pushToHistory();
              
              return projectId;
            } catch (err) {
              console.error('Failed to save project to database:', err);
              // Import toast dynamically to avoid circular dependency
              import('sonner').then(({ toast }) => {
                toast.error('Не удалось создать проект', {
                  description: 'Проверьте подключение к интернету'
                });
              });
              // Clear the in-memory project since it wasn't saved
              set({ project: null, projectId: null, hasUnsavedChanges: false });
              return null;
            }
          },

          loadProject: async (projectId) => {
            set({ isLoading: true });
            
            try {
              const { data, error } = await supabase
                .from('studio_projects')
                .select('*')
                .eq('id', projectId)
                .single();

              if (error) throw error;
              if (!data) throw new Error('Project not found');

              const project: StudioProject = {
                id: data.id,
                userId: data.user_id,
                sourceTrackId: data.source_track_id || undefined,
                name: data.name,
                description: data.description || undefined,
                bpm: data.bpm || 120,
                keySignature: data.key_signature || undefined,
                timeSignature: data.time_signature || '4/4',
                durationSeconds: data.duration_seconds || undefined,
                masterVolume: Number(data.master_volume) || 0.85,
                tracks: (data.tracks as unknown as StudioTrack[]) || [],
                status: (data.status as ProjectStatus) || 'draft',
                stemsMode: (data.stems_mode as StemsMode) || 'none',
                viewSettings: (data.view_settings as unknown as ViewSettings) || createDefaultViewSettings(),
                createdAt: data.created_at || new Date().toISOString(),
                updatedAt: data.updated_at || new Date().toISOString(),
                openedAt: data.opened_at || undefined,
              };

              set({
                project,
                projectId,
                isLoading: false,
                isPlaying: false,
                currentTime: 0,
                selectedTrackId: null,
                selectedClipId: null,
                zoom: project.viewSettings.zoom,
                viewMode: project.viewSettings.viewMode,
                snapToGrid: project.viewSettings.snapToGrid,
                gridSize: project.viewSettings.gridSize,
                hasUnsavedChanges: false,
                lastSavedAt: data.updated_at,
              });

              // Update opened_at
              await supabase
                .from('studio_projects')
                .update({ opened_at: new Date().toISOString() })
                .eq('id', projectId);

              get().clearHistory();
              get().pushToHistory();
              
              return true;
            } catch (err) {
              console.error('Failed to load project:', err);
              set({ isLoading: false });
              return false;
            }
          },

          loadProjectFromData: (data) => {
            set({
              project: data,
              projectId: data.id,
              isPlaying: false,
              currentTime: 0,
              selectedTrackId: null,
              selectedClipId: null,
              zoom: data.viewSettings.zoom,
              viewMode: data.viewSettings.viewMode,
              snapToGrid: data.viewSettings.snapToGrid,
              gridSize: data.viewSettings.gridSize,
              hasUnsavedChanges: false,
            });
            get().clearHistory();
            get().pushToHistory();
          },

          saveProject: async () => {
            const { project } = get();
            if (!project) return false;

            set({ isSaving: true });

            try {
              const { error } = await supabase
                .from('studio_projects')
                .update({
                  name: project.name,
                  description: project.description,
                  bpm: project.bpm,
                  key_signature: project.keySignature,
                  time_signature: project.timeSignature,
                  duration_seconds: project.durationSeconds,
                  master_volume: project.masterVolume,
                  tracks: project.tracks as unknown as Json,
                  status: project.status,
                  stems_mode: project.stemsMode,
                  view_settings: project.viewSettings as unknown as Json,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', project.id);

              if (error) throw error;

              set({
                isSaving: false,
                hasUnsavedChanges: false,
                lastSavedAt: new Date().toISOString(),
              });
              return true;
            } catch (err) {
              console.error('Failed to save project:', err);
              set({ isSaving: false });
              return false;
            }
          },

          closeProject: () => {
            set({
              project: null,
              projectId: null,
              isPlaying: false,
              currentTime: 0,
              selectedTrackId: null,
              selectedClipId: null,
              hasUnsavedChanges: false,
            });
            get().clearHistory();
          },

          deleteProject: async (projectId) => {
            try {
              const { error } = await supabase
                .from('studio_projects')
                .delete()
                .eq('id', projectId);

              if (error) throw error;

              const { project } = get();
              if (project?.id === projectId) {
                get().closeProject();
              }
              return true;
            } catch (err) {
              console.error('Failed to delete project:', err);
              return false;
            }
          },

          // ============ Track Actions ============

          addTrack: (trackData) => {
            const trackId = generateId();
            set(state => {
              if (!state.project) return state;
              
              const newTrack: StudioTrack = {
                ...trackData,
                id: trackId,
                clips: [],
                color: trackData.color || TRACK_COLORS[trackData.type] || TRACK_COLORS.other,
                status: trackData.status || 'ready',
              };
              
              return {
                project: {
                  ...state.project,
                  tracks: [...state.project.tracks, newTrack],
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            return trackId;
          },

          addPendingTrack: ({ name, type, taskId }) => {
            const trackId = generateId();
            set(state => {
              if (!state.project) return state;

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

              return {
                project: {
                  ...state.project,
                  tracks: [...state.project.tracks, newTrack],
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            return trackId;
          },

          updatePendingTrackTaskId: async (trackId, taskId) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t =>
                    t.id === trackId ? { ...t, taskId } : t
                  ),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            // Auto-save to persist taskId to database for realtime updates
            await get().saveProject();
          },

          resolvePendingTrack: (taskId, versions) => {
            set(state => {
              if (!state.project) return state;

              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => {
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
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            // Auto-save after resolving pending track
            get().saveProject();
          },

          setTrackActiveVersion: (trackId, versionLabel) => {
            set(state => {
              if (!state.project) return state;

              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => {
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
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          addTrackVersion: (trackId, label, audioUrl, duration) => {
            set(state => {
              if (!state.project) return state;

              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => {
                    if (t.id === trackId) {
                      const existingVersions = t.versions || [
                        { label: 'A', audioUrl: t.audioUrl || '', duration: t.clips[0]?.duration }
                      ];
                      return {
                        ...t,
                        versions: [...existingVersions, { label, audioUrl, duration }],
                      };
                    }
                    return t;
                  }),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            get().saveProject();
          },

          replaceTrackAudio: (trackId, audioUrl, duration) => {
            set(state => {
              if (!state.project) return state;

              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => {
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
                              id: crypto.randomUUID(),
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
                  durationSeconds: duration || state.project.durationSeconds,
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            get().saveProject();
          },

          removeTrack: (trackId) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.filter(t => t.id !== trackId),
                  updatedAt: new Date().toISOString(),
                },
                selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
          },

          updateTrack: (trackId, updates) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t =>
                    t.id === trackId ? { ...t, ...updates } : t
                  ),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          setTrackVolume: (trackId, volume) => {
            get().updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
          },

          setTrackPan: (trackId, pan) => {
            get().updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) });
          },

          toggleTrackMute: (trackId) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t =>
                    t.id === trackId ? { ...t, muted: !t.muted } : t
                  ),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          toggleTrackSolo: (trackId) => {
            set(state => {
              if (!state.project) return state;
              const track = state.project.tracks.find(t => t.id === trackId);
              if (!track) return state;

              const wasSolo = track.solo;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => ({
                    ...t,
                    // When enabling solo on a track, reset solo on ALL other tracks
                    // When disabling solo, just toggle this track off
                    solo: t.id === trackId ? !wasSolo : false,
                  })),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          reorderTracks: (fromIndex, toIndex) => {
            set(state => {
              if (!state.project) return state;
              const tracks = [...state.project.tracks];
              const [removed] = tracks.splice(fromIndex, 1);
              tracks.splice(toIndex, 0, removed);
              return {
                project: {
                  ...state.project,
                  tracks,
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
          },

          // ============ Clip Actions ============

          addClip: (trackId, clipData) => {
            const clipId = generateId();
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t =>
                    t.id === trackId ? {
                      ...t,
                      clips: [...t.clips, { ...clipData, id: clipId, trackId }],
                    } : t
                  ),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
            return clipId;
          },

          removeClip: (clipId) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => ({
                    ...t,
                    clips: t.clips.filter(c => c.id !== clipId),
                  })),
                  updatedAt: new Date().toISOString(),
                },
                selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
          },

          updateClip: (clipId, updates) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  tracks: state.project.tracks.map(t => ({
                    ...t,
                    clips: t.clips.map(c =>
                      c.id === clipId ? { ...c, ...updates } : c
                    ),
                  })),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          moveClip: (clipId, newTrackId, newStartTime) => {
            set(state => {
              if (!state.project) return state;

              let clipToMove: StudioClip | null = null;
              const tracksWithoutClip = state.project.tracks.map(t => {
                const clip = t.clips.find(c => c.id === clipId);
                if (clip) {
                  clipToMove = { ...clip, trackId: newTrackId, startTime: newStartTime };
                  return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
                }
                return t;
              });

              if (!clipToMove) return state;

              return {
                project: {
                  ...state.project,
                  tracks: tracksWithoutClip.map(t =>
                    t.id === newTrackId ? { ...t, clips: [...t.clips, clipToMove!] } : t
                  ),
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
            get().pushToHistory();
          },

          trimClip: (clipId, trimStart, trimEnd) => {
            get().updateClip(clipId, { trimStart, trimEnd });
            get().pushToHistory();
          },

          duplicateClip: (clipId, newTrackId) => {
            const { project } = get();
            if (!project) return null;

            let originalClip: StudioClip | null = null;
            for (const track of project.tracks) {
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

            return newClipId;
          },

          // ============ Playback ============

          play: () => set({ isPlaying: true }),
          pause: () => set({ isPlaying: false }),
          stop: () => set({ isPlaying: false, currentTime: 0 }),
          seek: (time) => set({ currentTime: Math.max(0, time) }),

          // ============ Selection ============

          selectTrack: (trackId) => set({ selectedTrackId: trackId }),
          selectClip: (clipId) => set({ selectedClipId: clipId }),

          // ============ View ============

          setZoom: (zoom) => {
            const clampedZoom = Math.max(10, Math.min(200, zoom));
            set(state => {
              if (!state.project) return { zoom: clampedZoom };
              return {
                zoom: clampedZoom,
                project: {
                  ...state.project,
                  viewSettings: { ...state.project.viewSettings, zoom: clampedZoom },
                },
              };
            });
          },

          setViewMode: (mode) => {
            set(state => {
              if (!state.project) return { viewMode: mode };
              return {
                viewMode: mode,
                project: {
                  ...state.project,
                  viewSettings: { ...state.project.viewSettings, viewMode: mode },
                },
              };
            });
          },

          setSnapToGrid: (snap) => {
            set(state => {
              if (!state.project) return { snapToGrid: snap };
              return {
                snapToGrid: snap,
                project: {
                  ...state.project,
                  viewSettings: { ...state.project.viewSettings, snapToGrid: snap },
                },
              };
            });
          },

          setGridSize: (size) => {
            set(state => {
              if (!state.project) return { gridSize: size };
              return {
                gridSize: size,
                project: {
                  ...state.project,
                  viewSettings: { ...state.project.viewSettings, gridSize: size },
                },
              };
            });
          },

          // ============ Master ============

          setMasterVolume: (volume) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  masterVolume: Math.max(0, Math.min(1, volume)),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          setBpm: (bpm) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  bpm: Math.max(20, Math.min(300, bpm)),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          setProjectStatus: (status) => {
            set(state => {
              if (!state.project) return state;
              return {
                project: {
                  ...state.project,
                  status,
                  updatedAt: new Date().toISOString(),
                },
                hasUnsavedChanges: true,
              };
            });
          },

          // ============ DB Sync ============

          syncToDatabase: async () => {
            return get().saveProject();
          },
        };
      },
      {
        name: 'unified-studio-storage',
        partialize: (state) => ({
          projectId: state.projectId,
          zoom: state.zoom,
          viewMode: state.viewMode,
          snapToGrid: state.snapToGrid,
          gridSize: state.gridSize,
        }),
      }
    )
  )
);

// ============ Auto-save subscription ============

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useUnifiedStudioStore.subscribe(
  (state) => state.hasUnsavedChanges,
  (hasChanges) => {
    if (hasChanges) {
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        useUnifiedStudioStore.getState().saveProject();
      }, 5000); // Auto-save after 5 seconds of no changes
    }
  }
);
