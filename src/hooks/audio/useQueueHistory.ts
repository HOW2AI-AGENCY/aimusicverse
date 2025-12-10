/**
 * Queue History Hook
 * 
 * Provides undo/redo functionality for queue operations.
 * Tracks history of queue states and allows reverting changes.
 * 
 * Features:
 * - Undo/redo queue modifications
 * - Limited history size (10 states)
 * - Automatic snapshot on changes
 * - Skip snapshot for certain operations
 */

import { useState, useCallback, useRef } from 'react';
import { usePlayerStore } from './usePlayerState';
import type { Track } from '@/hooks/useTracksOptimized';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'QueueHistory' });

const MAX_HISTORY_SIZE = 10;

interface QueueSnapshot {
  queue: Track[];
  currentIndex: number;
  timestamp: number;
}

/**
 * Hook for queue history and undo/redo functionality
 */
export function useQueueHistory() {
  const { queue, currentIndex } = usePlayerStore();
  
  const historyRef = useRef<QueueSnapshot[]>([]);
  const currentHistoryIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /**
   * Create snapshot of current queue state
   */
  const createSnapshot = useCallback((): QueueSnapshot => {
    return {
      queue: [...queue],
      currentIndex,
      timestamp: Date.now(),
    };
  }, [queue, currentIndex]);

  /**
   * Save current state to history
   */
  const saveState = useCallback(() => {
    const snapshot = createSnapshot();
    
    // If we're not at the end of history, remove everything after current position
    if (currentHistoryIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentHistoryIndexRef.current + 1);
    }

    // Add new snapshot
    historyRef.current.push(snapshot);
    
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current.shift();
    } else {
      currentHistoryIndexRef.current++;
    }

    // Update undo/redo availability
    setCanUndo(currentHistoryIndexRef.current > 0);
    setCanRedo(false); // Can't redo after new action

    log.debug('Queue state saved', {
      historySize: historyRef.current.length,
      currentIndex: currentHistoryIndexRef.current,
    });
  }, [createSnapshot]);

  /**
   * Restore a snapshot
   */
  const restoreSnapshot = useCallback((snapshot: QueueSnapshot) => {
    usePlayerStore.setState({
      queue: snapshot.queue,
      currentIndex: snapshot.currentIndex,
      // Update active track to match restored index
      activeTrack: snapshot.queue[snapshot.currentIndex] || null,
    });

    log.debug('Queue state restored', {
      queueSize: snapshot.queue.length,
      currentIndex: snapshot.currentIndex,
    });
  }, []);

  /**
   * Undo last queue operation
   */
  const undo = useCallback(() => {
    if (currentHistoryIndexRef.current <= 0) {
      log.warn('Cannot undo: at beginning of history');
      return false;
    }

    // Move back in history
    currentHistoryIndexRef.current--;
    const snapshot = historyRef.current[currentHistoryIndexRef.current];
    
    if (snapshot) {
      restoreSnapshot(snapshot);
      
      // Update undo/redo availability
      setCanUndo(currentHistoryIndexRef.current > 0);
      setCanRedo(currentHistoryIndexRef.current < historyRef.current.length - 1);
      
      log.info('Undo performed', {
        newIndex: currentHistoryIndexRef.current,
      });
      
      return true;
    }

    return false;
  }, [restoreSnapshot]);

  /**
   * Redo last undone operation
   */
  const redo = useCallback(() => {
    if (currentHistoryIndexRef.current >= historyRef.current.length - 1) {
      log.warn('Cannot redo: at end of history');
      return false;
    }

    // Move forward in history
    currentHistoryIndexRef.current++;
    const snapshot = historyRef.current[currentHistoryIndexRef.current];
    
    if (snapshot) {
      restoreSnapshot(snapshot);
      
      // Update undo/redo availability
      setCanUndo(currentHistoryIndexRef.current > 0);
      setCanRedo(currentHistoryIndexRef.current < historyRef.current.length - 1);
      
      log.info('Redo performed', {
        newIndex: currentHistoryIndexRef.current,
      });
      
      return true;
    }

    return false;
  }, [restoreSnapshot]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentHistoryIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    
    log.debug('Queue history cleared');
  }, []);

  /**
   * Get history info
   */
  const getHistoryInfo = useCallback(() => {
    return {
      size: historyRef.current.length,
      currentIndex: currentHistoryIndexRef.current,
      canUndo,
      canRedo,
    };
  }, [canUndo, canRedo]);

  /**
   * Wrapper for queue operations with automatic history tracking
   */
  const withHistory = useCallback(<T extends any[]>(
    operation: (...args: T) => void,
    saveAfter: boolean = true
  ) => {
    return (...args: T) => {
      // Save state before operation if we're doing something that modifies queue
      if (saveAfter && queue.length > 0) {
        saveState();
      }
      
      // Execute operation
      operation(...args);
    };
  }, [queue.length, saveState]);

  return {
    // Core operations
    saveState,
    undo,
    redo,
    clearHistory,
    
    // State
    canUndo,
    canRedo,
    historyInfo: getHistoryInfo(),
    
    // Utility
    withHistory,
  };
}
