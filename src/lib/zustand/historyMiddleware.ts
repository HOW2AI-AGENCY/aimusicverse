/**
 * Zustand History Middleware
 * 
 * Provides undo/redo functionality for any Zustand store.
 * Captures state snapshots and allows time travel through history.
 */

export interface HistoryState {
  // History data
  _history: unknown[];
  _historyIndex: number;
  _maxHistory: number;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  getHistoryLength: () => number;
}

interface HistoryOptions {
  maxHistory?: number;
  exclude?: string[];
}

// Keys to exclude from history by default (internal state, not user actions)
const DEFAULT_EXCLUDE_KEYS = [
  '_history',
  '_historyIndex', 
  '_maxHistory',
  'undo',
  'redo',
  'canUndo',
  'canRedo',
  'clearHistory',
  'getHistoryLength',
  'isPlaying',
  'currentTime',
];

/**
 * Creates history state and actions for a Zustand store
 * Use this as a pattern to add undo/redo to existing stores
 */
export function createHistorySlice(
  set: (partial: Record<string, unknown>) => void,
  get: () => Record<string, unknown>,
  options: HistoryOptions = {}
) {
  const maxHistory = options.maxHistory ?? 50;
  const excludeKeys = new Set([...DEFAULT_EXCLUDE_KEYS, ...(options.exclude ?? [])]);

  // Filter state to only include tracked keys
  const getTrackedState = (state: Record<string, unknown>): Record<string, unknown> => {
    const tracked: Record<string, unknown> = {};
    for (const key of Object.keys(state)) {
      if (!excludeKeys.has(key) && typeof state[key] !== 'function') {
        tracked[key] = state[key];
      }
    }
    return tracked;
  };

  // Deep clone state for history
  const cloneState = (state: Record<string, unknown>): Record<string, unknown> => {
    try {
      return JSON.parse(JSON.stringify(state));
    } catch {
      return { ...state };
    }
  };

  return {
    _history: [] as unknown[],
    _historyIndex: -1,
    _maxHistory: maxHistory,

    pushToHistory: () => {
      const state = get();
      const tracked = getTrackedState(state);
      const history = [...(state._history as unknown[] || [])];
      const historyIndex = (state._historyIndex as number) ?? -1;

      // Remove any future history if we're not at the end
      if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1);
      }

      // Add new state
      history.push(cloneState(tracked));

      // Trim history if too long
      while (history.length > maxHistory) {
        history.shift();
      }

      set({
        _history: history,
        _historyIndex: history.length - 1,
      });
    },

    undo: () => {
      const state = get();
      const historyIndex = state._historyIndex as number;
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const history = state._history as Record<string, unknown>[];
        const historicState = history[newIndex];
        set({
          ...historicState,
          _historyIndex: newIndex,
        });
      }
    },

    redo: () => {
      const state = get();
      const history = state._history as unknown[];
      const historyIndex = state._historyIndex as number;
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const historicState = (history as Record<string, unknown>[])[newIndex];
        set({
          ...historicState,
          _historyIndex: newIndex,
        });
      }
    },

    canUndo: () => {
      const state = get();
      return (state._historyIndex as number) > 0;
    },

    canRedo: () => {
      const state = get();
      const history = state._history as unknown[];
      return (state._historyIndex as number) < history.length - 1;
    },

    clearHistory: () => {
      const state = get();
      const currentTracked = getTrackedState(state);
      set({
        _history: [cloneState(currentTracked)],
        _historyIndex: 0,
      });
    },

    getHistoryLength: () => {
      const state = get();
      return (state._history as unknown[])?.length ?? 0;
    },
  };
}
