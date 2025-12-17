/**
 * usePromptDJStore - Zustand store with persistence for PromptDJ state
 * Saves channels, settings, and history between sessions
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PromptChannel, GlobalSettings, GeneratedTrack, CHANNEL_TYPES, ChannelType } from './usePromptDJEnhanced';

// IndexedDB storage adapter for large audio buffers
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['store'], 'readonly');
        const store = transaction.objectStore('store');
        const request = store.get(name);
        request.onsuccess = () => resolve(request.result?.value || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['store'], 'readwrite');
        const store = transaction.objectStore('store');
        const request = store.put({ key: name, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['store'], 'readwrite');
        const store = transaction.objectStore('store');
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      localStorage.removeItem(name);
    }
  },
};

// Open IndexedDB
let dbPromise: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('promptdj-store', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('audioBuffers')) {
        db.createObjectStore('audioBuffers', { keyPath: 'key' });
      }
    };
  });
  
  return dbPromise;
}

// Default channels
const DEFAULT_CHANNELS: PromptChannel[] = [
  { id: 'ch1', type: 'genre', value: '', weight: 0.5, enabled: true },
  { id: 'ch2', type: 'instrument', value: '', weight: 0.5, enabled: true },
  { id: 'ch3', type: 'mood', value: '', weight: 0.5, enabled: true },
  { id: 'ch4', type: 'energy', value: '', weight: 0.5, enabled: true },
  { id: 'ch5', type: 'texture', value: '', weight: 0.3, enabled: false },
  { id: 'ch6', type: 'style', value: '', weight: 0.3, enabled: false },
  { id: 'ch7', type: 'instrument', value: '', weight: 0.3, enabled: false },
  { id: 'ch8', type: 'vocal', value: '', weight: 0.3, enabled: false },
  { id: 'ch9', type: 'custom', value: '', weight: 0.3, enabled: false },
];

const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: 'C',
  scale: 'minor',
  density: 0.5,
  brightness: 0.5,
  duration: 20,
};

// Prompt history entry
interface PromptHistoryEntry {
  id: string;
  prompt: string;
  channels: PromptChannel[];
  settings: GlobalSettings;
  audioUrl?: string;
  createdAt: number;
  rating?: number; // User rating 1-5
}

// User preset
interface UserPreset {
  id: string;
  name: string;
  channels: PromptChannel[];
  settings: GlobalSettings;
  createdAt: number;
}

interface PromptDJState {
  // Channels & settings
  channels: PromptChannel[];
  globalSettings: GlobalSettings;
  
  // History & presets
  promptHistory: PromptHistoryEntry[];
  userPresets: UserPreset[];
  
  // Generated tracks (session only, not persisted)
  generatedTracks: GeneratedTrack[];
  
  // UI state
  lastUsedPresetId: string | null;
  
  // Actions
  setChannels: (channels: PromptChannel[]) => void;
  updateChannel: (id: string, updates: Partial<PromptChannel>) => void;
  setGlobalSettings: (settings: GlobalSettings) => void;
  updateGlobalSettings: (updates: Partial<GlobalSettings>) => void;
  
  // History actions
  addToHistory: (entry: Omit<PromptHistoryEntry, 'id' | 'createdAt'>) => void;
  rateHistoryEntry: (id: string, rating: number) => void;
  clearHistory: () => void;
  
  // Preset actions
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  
  // Track actions
  addGeneratedTrack: (track: GeneratedTrack) => void;
  removeGeneratedTrack: (id: string) => void;
  clearGeneratedTracks: () => void;
  
  // Reset
  resetToDefaults: () => void;
}

export const usePromptDJStore = create<PromptDJState>()(
  persist(
    (set, get) => ({
      // Initial state
      channels: DEFAULT_CHANNELS,
      globalSettings: DEFAULT_SETTINGS,
      promptHistory: [],
      userPresets: [],
      generatedTracks: [],
      lastUsedPresetId: null,
      
      // Channel actions
      setChannels: (channels) => set({ channels }),
      
      updateChannel: (id, updates) => set((state) => ({
        channels: state.channels.map(ch => 
          ch.id === id ? { ...ch, ...updates } : ch
        ),
      })),
      
      // Settings actions
      setGlobalSettings: (settings) => set({ globalSettings: settings }),
      
      updateGlobalSettings: (updates) => set((state) => ({
        globalSettings: { ...state.globalSettings, ...updates },
      })),
      
      // History actions
      addToHistory: (entry) => set((state) => {
        const newEntry: PromptHistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        
        // Keep last 50 entries
        const history = [newEntry, ...state.promptHistory].slice(0, 50);
        return { promptHistory: history };
      }),
      
      rateHistoryEntry: (id, rating) => set((state) => ({
        promptHistory: state.promptHistory.map(entry =>
          entry.id === id ? { ...entry, rating } : entry
        ),
      })),
      
      clearHistory: () => set({ promptHistory: [] }),
      
      // Preset actions
      savePreset: (name) => set((state) => {
        const preset: UserPreset = {
          id: crypto.randomUUID(),
          name,
          channels: state.channels,
          settings: state.globalSettings,
          createdAt: Date.now(),
        };
        return { userPresets: [...state.userPresets, preset] };
      }),
      
      loadPreset: (id) => set((state) => {
        const preset = state.userPresets.find(p => p.id === id);
        if (preset) {
          return {
            channels: preset.channels,
            globalSettings: preset.settings,
            lastUsedPresetId: id,
          };
        }
        return {};
      }),
      
      deletePreset: (id) => set((state) => ({
        userPresets: state.userPresets.filter(p => p.id !== id),
      })),
      
      // Track actions
      addGeneratedTrack: (track) => set((state) => ({
        generatedTracks: [track, ...state.generatedTracks],
      })),
      
      removeGeneratedTrack: (id) => set((state) => ({
        generatedTracks: state.generatedTracks.filter(t => t.id !== id),
      })),
      
      clearGeneratedTracks: () => set({ generatedTracks: [] }),
      
      // Reset
      resetToDefaults: () => set({
        channels: DEFAULT_CHANNELS,
        globalSettings: DEFAULT_SETTINGS,
        lastUsedPresetId: null,
      }),
    }),
    {
      name: 'promptdj-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        channels: state.channels,
        globalSettings: state.globalSettings,
        promptHistory: state.promptHistory,
        userPresets: state.userPresets,
        lastUsedPresetId: state.lastUsedPresetId,
        // Don't persist generatedTracks - they're session-only
      }),
    }
  )
);

// Selectors for optimized subscriptions
export const selectChannels = (state: PromptDJState) => state.channels;
export const selectSettings = (state: PromptDJState) => state.globalSettings;
export const selectHistory = (state: PromptDJState) => state.promptHistory;
export const selectPresets = (state: PromptDJState) => state.userPresets;

// Derived selectors
export const selectTopRatedPrompts = (state: PromptDJState) => 
  state.promptHistory
    .filter(entry => entry.rating && entry.rating >= 4)
    .slice(0, 10);

export const selectRecentPrompts = (state: PromptDJState) =>
  state.promptHistory.slice(0, 5);
