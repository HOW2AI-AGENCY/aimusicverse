/**
 * Stem Mixer Slice
 * 
 * Zustand slice for stem mixing state management.
 * Handles mute/solo/volume/pan per stem with effective volume calculation.
 * 
 * @see ADR-003 Performance Optimization Architecture
 */

import { StateCreator } from 'zustand';

// ============ Types ============

export interface StemState {
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
}

export interface StemMixerState {
  // Stem states keyed by stem ID
  stemStates: Record<string, StemState>;
  
  // Master controls
  masterVolume: number;
  masterMuted: boolean;
  masterPan: number;
  
  // Computed helpers (not stored, computed on access)
  hasSoloStems: boolean;
}

export interface StemMixerActions {
  // Stem actions
  setStemVolume: (stemId: string, volume: number) => void;
  setStemPan: (stemId: string, pan: number) => void;
  toggleStemMute: (stemId: string) => void;
  toggleStemSolo: (stemId: string) => void;
  setStemState: (stemId: string, state: Partial<StemState>) => void;
  
  // Batch operations
  initializeStemStates: (stemIds: string[]) => void;
  resetStemStates: () => void;
  muteAllStems: () => void;
  unmuteAllStems: () => void;
  clearAllSolo: () => void;
  
  // Master actions
  setMasterVolume: (volume: number) => void;
  setMasterPan: (pan: number) => void;
  toggleMasterMute: () => void;
  
  // Computed getters
  getEffectiveVolume: (stemId: string) => number;
  isStemEffectivelyMuted: (stemId: string) => boolean;
  getHasSoloStems: () => boolean;
}

export type StemMixerSlice = StemMixerState & StemMixerActions;

// ============ Default State ============

const DEFAULT_STEM_STATE: StemState = {
  volume: 1,
  pan: 0,
  muted: false,
  solo: false,
};

const DEFAULT_MIXER_STATE: StemMixerState = {
  stemStates: {},
  masterVolume: 0.85,
  masterMuted: false,
  masterPan: 0,
  hasSoloStems: false,
};

// ============ Slice Creator ============

export const createStemMixerSlice: StateCreator<
  StemMixerSlice,
  [],
  [],
  StemMixerSlice
> = (set, get) => ({
  ...DEFAULT_MIXER_STATE,

  // ============ Stem Actions ============

  setStemVolume: (stemId, volume) => {
    set((state) => ({
      stemStates: {
        ...state.stemStates,
        [stemId]: {
          ...(state.stemStates[stemId] || DEFAULT_STEM_STATE),
          volume: Math.max(0, Math.min(1, volume)),
        },
      },
    }));
  },

  setStemPan: (stemId, pan) => {
    set((state) => ({
      stemStates: {
        ...state.stemStates,
        [stemId]: {
          ...(state.stemStates[stemId] || DEFAULT_STEM_STATE),
          pan: Math.max(-1, Math.min(1, pan)),
        },
      },
    }));
  },

  toggleStemMute: (stemId) => {
    set((state) => {
      const currentState = state.stemStates[stemId] || DEFAULT_STEM_STATE;
      return {
        stemStates: {
          ...state.stemStates,
          [stemId]: {
            ...currentState,
            muted: !currentState.muted,
          },
        },
      };
    });
  },

  toggleStemSolo: (stemId) => {
    set((state) => {
      const currentState = state.stemStates[stemId] || DEFAULT_STEM_STATE;
      const newSoloState = !currentState.solo;
      
      const newStemStates = {
        ...state.stemStates,
        [stemId]: {
          ...currentState,
          solo: newSoloState,
        },
      };
      
      // Recalculate hasSoloStems
      const hasSoloStems = Object.values(newStemStates).some((s) => s.solo);
      
      return {
        stemStates: newStemStates,
        hasSoloStems,
      };
    });
  },

  setStemState: (stemId, state) => {
    set((prev) => ({
      stemStates: {
        ...prev.stemStates,
        [stemId]: {
          ...(prev.stemStates[stemId] || DEFAULT_STEM_STATE),
          ...state,
        },
      },
    }));
  },

  // ============ Batch Operations ============

  initializeStemStates: (stemIds) => {
    set((state) => {
      const newStates = { ...state.stemStates };
      let changed = false;
      
      for (const stemId of stemIds) {
        if (!newStates[stemId]) {
          newStates[stemId] = { ...DEFAULT_STEM_STATE };
          changed = true;
        }
      }
      
      return changed ? { stemStates: newStates } : state;
    });
  },

  resetStemStates: () => {
    set((state) => {
      const resetStates: Record<string, StemState> = {};
      for (const stemId of Object.keys(state.stemStates)) {
        resetStates[stemId] = { ...DEFAULT_STEM_STATE };
      }
      return {
        stemStates: resetStates,
        masterVolume: 0.85,
        masterMuted: false,
        masterPan: 0,
        hasSoloStems: false,
      };
    });
  },

  muteAllStems: () => {
    set((state) => {
      const mutedStates: Record<string, StemState> = {};
      for (const [stemId, stemState] of Object.entries(state.stemStates)) {
        mutedStates[stemId] = { ...stemState, muted: true };
      }
      return { stemStates: mutedStates };
    });
  },

  unmuteAllStems: () => {
    set((state) => {
      const unmutedStates: Record<string, StemState> = {};
      for (const [stemId, stemState] of Object.entries(state.stemStates)) {
        unmutedStates[stemId] = { ...stemState, muted: false };
      }
      return { stemStates: unmutedStates };
    });
  },

  clearAllSolo: () => {
    set((state) => {
      const clearedStates: Record<string, StemState> = {};
      for (const [stemId, stemState] of Object.entries(state.stemStates)) {
        clearedStates[stemId] = { ...stemState, solo: false };
      }
      return { stemStates: clearedStates, hasSoloStems: false };
    });
  },

  // ============ Master Actions ============

  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) });
  },

  setMasterPan: (pan) => {
    set({ masterPan: Math.max(-1, Math.min(1, pan)) });
  },

  toggleMasterMute: () => {
    set((state) => ({ masterMuted: !state.masterMuted }));
  },

  // ============ Computed Getters ============

  getEffectiveVolume: (stemId) => {
    const state = get();
    const stemState = state.stemStates[stemId];
    
    if (!stemState) return 0;
    
    // Master muted = all stems effectively muted
    if (state.masterMuted) return 0;
    
    // Stem explicitly muted
    if (stemState.muted) return 0;
    
    // If any stem is soloed and this one isn't, effectively muted
    if (state.hasSoloStems && !stemState.solo) return 0;
    
    // Calculate effective volume
    return stemState.volume * state.masterVolume;
  },

  isStemEffectivelyMuted: (stemId) => {
    const state = get();
    const stemState = state.stemStates[stemId];
    
    if (!stemState) return true;
    if (state.masterMuted) return true;
    if (stemState.muted) return true;
    if (state.hasSoloStems && !stemState.solo) return true;
    
    return false;
  },

  getHasSoloStems: () => {
    return get().hasSoloStems;
  },
});

// ============ Selectors ============

/**
 * Shallow-compare selector for stem state
 * Use with useStore(selector, shallow) for optimized re-renders
 */
export const selectStemState = (stemId: string) => (state: StemMixerSlice) =>
  state.stemStates[stemId] || DEFAULT_STEM_STATE;

export const selectMasterControls = (state: StemMixerSlice) => ({
  masterVolume: state.masterVolume,
  masterMuted: state.masterMuted,
  masterPan: state.masterPan,
});

export const selectHasSoloStems = (state: StemMixerSlice) => state.hasSoloStems;
