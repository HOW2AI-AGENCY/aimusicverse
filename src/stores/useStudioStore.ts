import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Studio State Store - Unified state management for Studio components
 * Part of Sprint 015-A: Unified Studio Architecture
 */

export type StudioMode = 'track' | 'stem';
export type StudioTab = 'player' | 'mixer' | 'editor' | 'tools' | 'export' | 'ai';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
}

export interface TrackInfo {
  id: string;
  title: string;
  audioUrl: string | null;
  coverUrl: string | null;
  lyrics: string | null;
  style: string | null;
  sunoId: string | null;
  sunoTaskId: string | null;
}

export interface StudioState {
  // Mode
  mode: StudioMode;
  activeTab: StudioTab;
  
  // Track info
  track: TrackInfo | null;
  hasStems: boolean;
  
  // Audio state
  audio: AudioState;
  
  // UI state
  isLoading: boolean;
  isMobile: boolean;
  showTutorial: boolean;
  effectsEnabled: boolean;
  
  // Processing states
  isSeparating: boolean;
  isExporting: boolean;
  isAnalyzing: boolean;
  
  // Actions
  setMode: (mode: StudioMode) => void;
  setActiveTab: (tab: StudioTab) => void;
  setTrack: (track: TrackInfo | null) => void;
  setHasStems: (hasStems: boolean) => void;
  
  // Audio actions
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  
  // UI actions
  setIsLoading: (loading: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  
  // Processing actions
  setIsSeparating: (separating: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  
  // Reset
  reset: () => void;
}

const initialAudioState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.85,
  muted: false,
};

const initialState = {
  mode: 'track' as StudioMode,
  activeTab: 'player' as StudioTab,
  track: null,
  hasStems: false,
  audio: initialAudioState,
  isLoading: true,
  isMobile: false,
  showTutorial: false,
  effectsEnabled: false,
  isSeparating: false,
  isExporting: false,
  isAnalyzing: false,
};

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Mode actions
    setMode: (mode) => set({ mode }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setTrack: (track) => set({ track }),
    setHasStems: (hasStems) => set({ 
      hasStems, 
      mode: hasStems ? 'stem' : 'track' 
    }),
    
    // Audio actions
    setIsPlaying: (isPlaying) => set((state) => ({ 
      audio: { ...state.audio, isPlaying } 
    })),
    setCurrentTime: (currentTime) => set((state) => ({ 
      audio: { ...state.audio, currentTime } 
    })),
    setDuration: (duration) => set((state) => ({ 
      audio: { ...state.audio, duration } 
    })),
    setVolume: (volume) => set((state) => ({ 
      audio: { ...state.audio, volume } 
    })),
    setMuted: (muted) => set((state) => ({ 
      audio: { ...state.audio, muted } 
    })),
    togglePlay: () => set((state) => ({ 
      audio: { ...state.audio, isPlaying: !state.audio.isPlaying } 
    })),
    toggleMute: () => set((state) => ({ 
      audio: { ...state.audio, muted: !state.audio.muted } 
    })),
    
    // UI actions
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsMobile: (isMobile) => set({ isMobile }),
    setShowTutorial: (showTutorial) => set({ showTutorial }),
    setEffectsEnabled: (effectsEnabled) => set({ effectsEnabled }),
    
    // Processing actions
    setIsSeparating: (isSeparating) => set({ isSeparating }),
    setIsExporting: (isExporting) => set({ isExporting }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    
    // Reset
    reset: () => set(initialState),
  }))
);

// Selectors for optimized re-renders
export const selectAudio = (state: StudioState) => state.audio;
export const selectTrack = (state: StudioState) => state.track;
export const selectMode = (state: StudioState) => state.mode;
export const selectActiveTab = (state: StudioState) => state.activeTab;
export const selectIsPlaying = (state: StudioState) => state.audio.isPlaying;
export const selectCurrentTime = (state: StudioState) => state.audio.currentTime;
export const selectDuration = (state: StudioState) => state.audio.duration;
