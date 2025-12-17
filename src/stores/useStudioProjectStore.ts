/**
 * Studio Project Store - Zustand store for multi-track DAW state
 * Manages tracks, clips, and project settings with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClipType = 'main' | 'stem' | 'sfx' | 'instrumental' | 'vocal';

export interface StudioClip {
  id: string;
  trackId: string;
  audioUrl: string;
  name: string;
  startTime: number; // Position on timeline in seconds
  duration: number;
  trimStart: number; // Trim from beginning
  trimEnd: number; // Trim from end
  fadeIn: number;
  fadeOut: number;
  color?: string;
}

export interface StudioTrack {
  id: string;
  name: string;
  type: ClipType;
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
}

export interface StudioProject {
  id: string;
  trackId: string; // Main source track ID
  name: string;
  tracks: StudioTrack[];
  masterVolume: number;
  bpm: number;
  key?: string;
  scale?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

interface StudioProjectState {
  currentProject: StudioProject | null;
  isPlaying: boolean;
  currentTime: number;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  zoom: number; // Pixels per second
  snapToGrid: boolean;
  gridSize: number; // In beats
  
  // Actions
  createProject: (trackId: string, name: string, mainAudioUrl: string, duration: number) => void;
  loadProject: (project: StudioProject) => void;
  closeProject: () => void;
  
  // Track management
  addTrack: (track: Omit<StudioTrack, 'id' | 'clips'>) => string;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<StudioTrack>) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  
  // Clip management
  addClip: (trackId: string, clip: Omit<StudioClip, 'id' | 'trackId'>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<StudioClip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  trimClip: (clipId: string, trimStart: number, trimEnd: number) => void;
  duplicateClip: (clipId: string, newTrackId?: string) => string | null;
  
  // Playback
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  
  // Selection
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  
  // View
  setZoom: (zoom: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  
  // Master
  setMasterVolume: (volume: number) => void;
  setBpm: (bpm: number) => void;
}

const TRACK_COLORS: Record<ClipType, string> = {
  main: 'hsl(var(--primary))',
  stem: 'hsl(142 76% 36%)',
  sfx: 'hsl(38 92% 50%)',
  instrumental: 'hsl(262 83% 58%)',
  vocal: 'hsl(340 82% 52%)',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useStudioProjectStore = create<StudioProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      isPlaying: false,
      currentTime: 0,
      selectedClipId: null,
      selectedTrackId: null,
      zoom: 50, // 50px per second default
      snapToGrid: true,
      gridSize: 4, // Quarter notes
      
      createProject: (trackId, name, mainAudioUrl, duration) => {
        const mainTrack: StudioTrack = {
          id: generateId(),
          name: 'Main Track',
          type: 'main',
          volume: 1,
          pan: 0,
          muted: false,
          solo: false,
          color: TRACK_COLORS.main,
          clips: [{
            id: generateId(),
            trackId: '',
            audioUrl: mainAudioUrl,
            name: name,
            startTime: 0,
            duration,
            trimStart: 0,
            trimEnd: 0,
            fadeIn: 0,
            fadeOut: 0,
          }],
        };
        mainTrack.clips[0].trackId = mainTrack.id;

        const project: StudioProject = {
          id: generateId(),
          trackId,
          name,
          tracks: [mainTrack],
          masterVolume: 1,
          bpm: 120,
          duration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set({ currentProject: project, currentTime: 0, isPlaying: false });
      },
      
      loadProject: (project) => set({ currentProject: project, currentTime: 0, isPlaying: false }),
      
      closeProject: () => set({ 
        currentProject: null, 
        currentTime: 0, 
        isPlaying: false,
        selectedClipId: null,
        selectedTrackId: null,
      }),
      
      addTrack: (trackData) => {
        const trackId = generateId();
        set(state => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              tracks: [...state.currentProject.tracks, {
                ...trackData,
                id: trackId,
                clips: [],
                color: TRACK_COLORS[trackData.type] || 'hsl(var(--muted))',
              }],
              updatedAt: new Date().toISOString(),
            }
          };
        });
        return trackId;
      },
      
      removeTrack: (trackId) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.filter(t => t.id !== trackId),
            updatedAt: new Date().toISOString(),
          },
          selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
        };
      }),
      
      updateTrack: (trackId, updates) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.map(t =>
              t.id === trackId ? { ...t, ...updates } : t
            ),
            updatedAt: new Date().toISOString(),
          }
        };
      }),
      
      setTrackVolume: (trackId, volume) => {
        get().updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) });
      },
      
      setTrackPan: (trackId, pan) => {
        get().updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) });
      },
      
      toggleTrackMute: (trackId) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.map(t =>
              t.id === trackId ? { ...t, muted: !t.muted } : t
            ),
          }
        };
      }),
      
      toggleTrackSolo: (trackId) => set(state => {
        if (!state.currentProject) return state;
        const track = state.currentProject.tracks.find(t => t.id === trackId);
        if (!track) return state;
        
        const wasSolo = track.solo;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.map(t => ({
              ...t,
              solo: t.id === trackId ? !wasSolo : (wasSolo ? t.solo : false),
            })),
          }
        };
      }),
      
      addClip: (trackId, clipData) => {
        const clipId = generateId();
        set(state => {
          if (!state.currentProject) return state;
          return {
            currentProject: {
              ...state.currentProject,
              tracks: state.currentProject.tracks.map(t =>
                t.id === trackId ? {
                  ...t,
                  clips: [...t.clips, { ...clipData, id: clipId, trackId }],
                } : t
              ),
              updatedAt: new Date().toISOString(),
            }
          };
        });
        return clipId;
      },
      
      removeClip: (clipId) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.map(t => ({
              ...t,
              clips: t.clips.filter(c => c.id !== clipId),
            })),
            updatedAt: new Date().toISOString(),
          },
          selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
        };
      }),
      
      updateClip: (clipId, updates) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            tracks: state.currentProject.tracks.map(t => ({
              ...t,
              clips: t.clips.map(c =>
                c.id === clipId ? { ...c, ...updates } : c
              ),
            })),
            updatedAt: new Date().toISOString(),
          }
        };
      }),
      
      moveClip: (clipId, newTrackId, newStartTime) => set(state => {
        if (!state.currentProject) return state;
        
        let clipToMove: StudioClip | null = null;
        const tracksWithoutClip = state.currentProject.tracks.map(t => {
          const clip = t.clips.find(c => c.id === clipId);
          if (clip) {
            clipToMove = { ...clip, trackId: newTrackId, startTime: newStartTime };
            return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
          }
          return t;
        });
        
        if (!clipToMove) return state;
        
        return {
          currentProject: {
            ...state.currentProject,
            tracks: tracksWithoutClip.map(t =>
              t.id === newTrackId ? { ...t, clips: [...t.clips, clipToMove!] } : t
            ),
            updatedAt: new Date().toISOString(),
          }
        };
      }),
      
      trimClip: (clipId, trimStart, trimEnd) => {
        get().updateClip(clipId, { trimStart, trimEnd });
      },
      
      duplicateClip: (clipId, newTrackId) => {
        const state = get();
        if (!state.currentProject) return null;
        
        let originalClip: StudioClip | null = null;
        for (const track of state.currentProject.tracks) {
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
      
      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      
      selectClip: (clipId) => set({ selectedClipId: clipId }),
      selectTrack: (trackId) => set({ selectedTrackId: trackId }),
      
      setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(200, zoom)) }),
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      setGridSize: (size) => set({ gridSize: size }),
      
      setMasterVolume: (volume) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            masterVolume: Math.max(0, Math.min(1, volume)),
          }
        };
      }),
      
      setBpm: (bpm) => set(state => {
        if (!state.currentProject) return state;
        return {
          currentProject: {
            ...state.currentProject,
            bpm: Math.max(20, Math.min(300, bpm)),
          }
        };
      }),
    }),
    {
      name: 'studio-project-storage',
      partialize: (state) => ({ currentProject: state.currentProject }),
    }
  )
);
