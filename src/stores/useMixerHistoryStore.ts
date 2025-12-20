/**
 * Mixer History Store
 * 
 * Dedicated store for stem mixer state with undo/redo support.
 * Tracks volume, mute, solo, and pan changes for each stem.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';

export interface StemMixerState {
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
}

interface MixerHistoryEntry {
  stemStates: Record<string, StemMixerState>;
  masterVolume: number;
  masterMuted: boolean;
  timestamp: number;
}

interface MixerHistoryState {
  // Current state
  stemStates: Record<string, StemMixerState>;
  masterVolume: number;
  masterMuted: boolean;
  
  // History
  history: MixerHistoryEntry[];
  historyIndex: number;
  maxHistory: number;
  
  // Actions
  setStemState: (stemId: string, state: Partial<StemMixerState>) => void;
  setMasterVolume: (volume: number) => void;
  setMasterMuted: (muted: boolean) => void;
  toggleStemMute: (stemId: string) => void;
  toggleStemSolo: (stemId: string) => void;
  setStemVolume: (stemId: string, volume: number) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Batch operations
  initializeStems: (stemIds: string[]) => void;
  resetToDefaults: () => void;
  
  // Presets
  savePreset: (name: string) => MixerHistoryEntry;
  loadPreset: (preset: MixerHistoryEntry) => void;
}

const DEFAULT_STEM_STATE: StemMixerState = {
  volume: 0.8,
  muted: false,
  solo: false,
  pan: 0,
};

const MAX_HISTORY = 30;

export const useMixerHistoryStore = create<MixerHistoryState>()(
  persist(
    (set, get) => {
      // Helper to push current state to history
      const pushToHistory = () => {
        const state = get();
        const entry: MixerHistoryEntry = {
          stemStates: JSON.parse(JSON.stringify(state.stemStates)),
          masterVolume: state.masterVolume,
          masterMuted: state.masterMuted,
          timestamp: Date.now(),
        };
        
        let newHistory = [...state.history];
        
        // If we're not at the end, remove future entries
        if (state.historyIndex < newHistory.length - 1) {
          newHistory = newHistory.slice(0, state.historyIndex + 1);
        }
        
        newHistory.push(entry);
        
        // Trim if too long
        while (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      };

      return {
        stemStates: {},
        masterVolume: 1,
        masterMuted: false,
        history: [],
        historyIndex: -1,
        maxHistory: MAX_HISTORY,

        setStemState: (stemId, updates) => {
          set(state => {
            const currentState = state.stemStates[stemId] || DEFAULT_STEM_STATE;
            const newStates = {
              ...state.stemStates,
              [stemId]: { ...currentState, ...updates },
            };
            return {
              stemStates: newStates,
              ...pushToHistory(),
            };
          });
        },

        setMasterVolume: (volume) => {
          set(state => ({
            masterVolume: Math.max(0, Math.min(1, volume)),
            ...pushToHistory(),
          }));
        },

        setMasterMuted: (muted) => {
          set(state => ({
            masterMuted: muted,
            ...pushToHistory(),
          }));
        },

        toggleStemMute: (stemId) => {
          set(state => {
            const current = state.stemStates[stemId] || DEFAULT_STEM_STATE;
            return {
              stemStates: {
                ...state.stemStates,
                [stemId]: { ...current, muted: !current.muted },
              },
              ...pushToHistory(),
            };
          });
        },

        toggleStemSolo: (stemId) => {
          set(state => {
            const current = state.stemStates[stemId] || DEFAULT_STEM_STATE;
            const wasSolo = current.solo;
            
            // If enabling solo, disable solo on other stems
            const newStates = { ...state.stemStates };
            if (!wasSolo) {
              Object.keys(newStates).forEach(id => {
                if (id !== stemId) {
                  newStates[id] = { ...newStates[id], solo: false };
                }
              });
            }
            newStates[stemId] = { ...(newStates[stemId] || DEFAULT_STEM_STATE), solo: !wasSolo };
            
            return {
              stemStates: newStates,
              ...pushToHistory(),
            };
          });
        },

        setStemVolume: (stemId, volume) => {
          set(state => {
            const current = state.stemStates[stemId] || DEFAULT_STEM_STATE;
            return {
              stemStates: {
                ...state.stemStates,
                [stemId]: { ...current, volume: Math.max(0, Math.min(1, volume)) },
              },
              ...pushToHistory(),
            };
          });
        },

        undo: () => {
          const state = get();
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            const entry = state.history[newIndex];
            if (entry) {
              logger.info('Mixer undo', { from: state.historyIndex, to: newIndex });
              set({
                stemStates: JSON.parse(JSON.stringify(entry.stemStates)),
                masterVolume: entry.masterVolume,
                masterMuted: entry.masterMuted,
                historyIndex: newIndex,
              });
            }
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            const entry = state.history[newIndex];
            if (entry) {
              logger.info('Mixer redo', { from: state.historyIndex, to: newIndex });
              set({
                stemStates: JSON.parse(JSON.stringify(entry.stemStates)),
                masterVolume: entry.masterVolume,
                masterMuted: entry.masterMuted,
                historyIndex: newIndex,
              });
            }
          }
        },

        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },

        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },

        clearHistory: () => {
          const state = get();
          const currentEntry: MixerHistoryEntry = {
            stemStates: JSON.parse(JSON.stringify(state.stemStates)),
            masterVolume: state.masterVolume,
            masterMuted: state.masterMuted,
            timestamp: Date.now(),
          };
          set({
            history: [currentEntry],
            historyIndex: 0,
          });
        },

        initializeStems: (stemIds) => {
          set(state => {
            const newStates = { ...state.stemStates };
            stemIds.forEach(id => {
              if (!newStates[id]) {
                newStates[id] = { ...DEFAULT_STEM_STATE };
              }
            });
            return { stemStates: newStates };
          });
        },

        resetToDefaults: () => {
          set(state => {
            const newStates: Record<string, StemMixerState> = {};
            Object.keys(state.stemStates).forEach(id => {
              newStates[id] = { ...DEFAULT_STEM_STATE };
            });
            return {
              stemStates: newStates,
              masterVolume: 1,
              masterMuted: false,
              ...pushToHistory(),
            };
          });
        },

        savePreset: (name) => {
          const state = get();
          return {
            stemStates: JSON.parse(JSON.stringify(state.stemStates)),
            masterVolume: state.masterVolume,
            masterMuted: state.masterMuted,
            timestamp: Date.now(),
          };
        },

        loadPreset: (preset) => {
          set({
            stemStates: JSON.parse(JSON.stringify(preset.stemStates)),
            masterVolume: preset.masterVolume,
            masterMuted: preset.masterMuted,
            ...pushToHistory(),
          });
        },
      };
    },
    {
      name: 'mixer-history-storage',
      partialize: (state) => ({
        stemStates: state.stemStates,
        masterVolume: state.masterVolume,
        masterMuted: state.masterMuted,
      }),
    }
  )
);
