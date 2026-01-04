/**
 * useUndoRedo Hook
 * 
 * Provides keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) for undo/redo
 * and exposes the undo/redo state from the mixer history store.
 */

import { useEffect, useCallback } from 'react';
import { useMixerHistoryStore } from '@/stores/useMixerHistoryStore';
import { toast } from 'sonner';

interface UseUndoRedoOptions {
  enabled?: boolean;
  showToasts?: boolean;
}

interface UseUndoRedoReturn {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  historyIndex: number;
  clearHistory: () => void;
}

export function useUndoRedo(options: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const { enabled = true, showToasts = false } = options;
  
  const {
    undo: storeUndo,
    redo: storeRedo,
    canUndo: checkCanUndo,
    canRedo: checkCanRedo,
    history,
    historyIndex,
    clearHistory,
  } = useMixerHistoryStore();
  
  const canUndo = checkCanUndo();
  const canRedo = checkCanRedo();
  
  const undo = useCallback(() => {
    if (canUndo) {
      storeUndo();
      if (showToasts) {
        toast.success('Отменено', { duration: 1500 });
      }
    }
  }, [canUndo, storeUndo, showToasts]);
  
  const redo = useCallback(() => {
    if (canRedo) {
      storeRedo();
      if (showToasts) {
        toast.success('Повторено', { duration: 1500 });
      }
    }
  }, [canRedo, storeRedo, showToasts]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (modKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (modKey && e.key === 'y') {
        // Alternative redo shortcut (Windows style)
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, undo, redo]);
  
  return {
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    historyIndex,
    clearHistory,
  };
}
