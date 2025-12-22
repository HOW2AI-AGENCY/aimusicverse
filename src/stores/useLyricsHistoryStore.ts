/**
 * Lyrics History Store
 * Local undo/redo history for lyrics editing
 * Keeps last 50 snapshots for quick navigation
 */

import { create } from 'zustand';
import { LyricsSection } from '@/components/lyrics-workspace/LyricsWorkspace';

export interface LyricsHistoryEntry {
  sections: LyricsSection[];
  tags: string[];
  timestamp: number;
  changeType: 'edit' | 'ai' | 'reorder' | 'add' | 'delete' | 'restore' | 'initial';
  changeDescription?: string;
  sectionId?: string; // Which section was changed
}

interface LyricsHistoryState {
  // History stack
  history: LyricsHistoryEntry[];
  historyIndex: number;
  maxHistory: number;
  
  // Context identifiers
  projectTrackId: string | null;
  lyricsTemplateId: string | null;
  
  // Actions
  initialize: (params: {
    sections: LyricsSection[];
    tags: string[];
    projectTrackId?: string | null;
    lyricsTemplateId?: string | null;
  }) => void;
  
  pushSnapshot: (entry: Omit<LyricsHistoryEntry, 'timestamp'>) => void;
  
  undo: () => LyricsHistoryEntry | null;
  redo: () => LyricsHistoryEntry | null;
  
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  getCurrentState: () => LyricsHistoryEntry | null;
  getHistoryLength: () => number;
  getHistoryIndex: () => number;
  
  clearHistory: () => void;
  reset: () => void;
}

const MAX_HISTORY = 50;

export const useLyricsHistoryStore = create<LyricsHistoryState>((set, get) => ({
  history: [],
  historyIndex: -1,
  maxHistory: MAX_HISTORY,
  projectTrackId: null,
  lyricsTemplateId: null,
  
  initialize: ({ sections, tags, projectTrackId, lyricsTemplateId }) => {
    const initialEntry: LyricsHistoryEntry = {
      sections: JSON.parse(JSON.stringify(sections)),
      tags: [...tags],
      timestamp: Date.now(),
      changeType: 'initial',
      changeDescription: 'Начальное состояние',
    };
    
    set({
      history: [initialEntry],
      historyIndex: 0,
      projectTrackId: projectTrackId || null,
      lyricsTemplateId: lyricsTemplateId || null,
    });
  },
  
  pushSnapshot: (entry) => {
    const state = get();
    const newEntry: LyricsHistoryEntry = {
      ...entry,
      sections: JSON.parse(JSON.stringify(entry.sections)),
      tags: [...entry.tags],
      timestamp: Date.now(),
    };
    
    // If we're not at the end of history, truncate future entries
    let newHistory = state.history.slice(0, state.historyIndex + 1);
    
    // Add new entry
    newHistory.push(newEntry);
    
    // Keep only last maxHistory entries
    if (newHistory.length > state.maxHistory) {
      newHistory = newHistory.slice(newHistory.length - state.maxHistory);
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return null;
    
    const newIndex = state.historyIndex - 1;
    set({ historyIndex: newIndex });
    
    return state.history[newIndex] || null;
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return null;
    
    const newIndex = state.historyIndex + 1;
    set({ historyIndex: newIndex });
    
    return state.history[newIndex] || null;
  },
  
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },
  
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },
  
  getCurrentState: () => {
    const state = get();
    return state.history[state.historyIndex] || null;
  },
  
  getHistoryLength: () => {
    return get().history.length;
  },
  
  getHistoryIndex: () => {
    return get().historyIndex;
  },
  
  clearHistory: () => {
    const state = get();
    const current = state.history[state.historyIndex];
    
    if (current) {
      set({
        history: [current],
        historyIndex: 0,
      });
    }
  },
  
  reset: () => {
    set({
      history: [],
      historyIndex: -1,
      projectTrackId: null,
      lyricsTemplateId: null,
    });
  },
}));
