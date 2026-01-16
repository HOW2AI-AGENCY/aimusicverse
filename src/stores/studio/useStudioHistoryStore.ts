/**
 * Studio History Store
 *
 * Manages undo/redo functionality for the studio.
 * Uses the history middleware to track state changes.
 *
 * @module stores/studio/useStudioHistoryStore
 */

import { create } from 'zustand';
import { createHistorySlice, type HistoryState } from '@/lib/zustand/historyMiddleware';
import { logger } from '@/lib/logger';

const historyLogger = logger.child({ module: 'StudioHistoryStore' });

// Keys to exclude from history tracking
const EXCLUDED_KEYS = [
  'isLoading',
  'isSaving',
  'lastSavedAt',
  'hasUnsavedChanges',
  'isPlaying',
  'currentTime',
];

// ============ State Interface ============

interface StudioHistoryState extends HistoryState {
  // pushToHistory is from the historySlice
  pushToHistory: () => void;
}

// ============ Store Implementation ============

export const useStudioHistoryStore = create<StudioHistoryState>()((set, get) => {
  // Create the history slice using the middleware
  const historySlice = createHistorySlice(
    set as unknown as (partial: Record<string, unknown>) => void,
    get as unknown as () => Record<string, unknown>,
    {
      maxHistory: 30,
      exclude: EXCLUDED_KEYS,
    }
  );

  return {
    ...historySlice,

    // Override undo with logging
    undo: () => {
      const { canUndo } = get();
      if (!canUndo()) {
        historyLogger.debug('Cannot undo - at beginning of history');
        return;
      }

      historySlice.undo();
      historyLogger.info('Undo performed', { historyIndex: get()._historyIndex });
    },

    // Override redo with logging
    redo: () => {
      const { canRedo } = get();
      if (!canRedo()) {
        historyLogger.debug('Cannot redo - at end of history');
        return;
      }

      historySlice.redo();
      historyLogger.info('Redo performed', { historyIndex: get()._historyIndex });
    },

    // Override clearHistory with logging
    clearHistory: () => {
      historySlice.clearHistory();
      historyLogger.debug('History cleared');
    },
  };
});

// ============ Selectors ============

/**
 * Select history-related state for UI indicators
 */
export const selectHistoryState = (state: StudioHistoryState) => ({
  canUndo: state.canUndo(),
  canRedo: state.canRedo(),
  historyLength: state.getHistoryLength(),
  currentIndex: state._historyIndex,
});

/**
 * Select if undo is available
 */
export const selectCanUndo = (state: StudioHistoryState) => state.canUndo();

/**
 * Select if redo is available
 */
export const selectCanRedo = (state: StudioHistoryState) => state.canRedo();
