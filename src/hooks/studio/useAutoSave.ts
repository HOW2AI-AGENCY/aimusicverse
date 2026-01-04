/**
 * useAutoSave - Automatic project saving with debounce
 * 
 * Features:
 * - Debounced saves (30 seconds after last change)
 * - Status indicator
 * - Tab close protection
 * - Manual save trigger
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { logger } from '@/lib/logger';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveComplete?: (success: boolean) => void;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<boolean>;
  timeSinceLastSave: number | null;
}

export function useAutoSave({
  enabled = true,
  debounceMs = 30000, // 30 seconds
  onSaveStart,
  onSaveComplete,
}: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<number | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastChangeTimeRef = useRef<number | null>(null);
  
  const {
    project,
    hasUnsavedChanges,
    lastSavedAt,
    saveProject,
  } = useUnifiedStudioStore();

  // Calculate time since last save
  useEffect(() => {
    if (!lastSavedAt) {
      setTimeSinceLastSave(null);
      return;
    }

    const updateTime = () => {
      const savedTime = new Date(lastSavedAt).getTime();
      const now = Date.now();
      setTimeSinceLastSave(Math.floor((now - savedTime) / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Trigger save
  const doSave = useCallback(async (): Promise<boolean> => {
    if (!project || !hasUnsavedChanges) {
      return true;
    }

    setStatus('saving');
    onSaveStart?.();
    
    logger.info('AutoSave: saving project', { projectId: project.id });
    
    try {
      const success = await saveProject();
      
      if (success) {
        setStatus('saved');
        logger.info('AutoSave: project saved successfully');
        
        // Reset to idle after a delay
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        logger.error('AutoSave: save failed');
        
        // Reset to pending after a delay to retry
        setTimeout(() => setStatus('pending'), 5000);
      }
      
      onSaveComplete?.(success);
      return success;
    } catch (error) {
      setStatus('error');
      logger.error('AutoSave: exception during save', error);
      onSaveComplete?.(false);
      return false;
    }
  }, [project, hasUnsavedChanges, saveProject, onSaveStart, onSaveComplete]);

  // Schedule save when changes occur
  useEffect(() => {
    if (!enabled || !project || !hasUnsavedChanges) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    lastChangeTimeRef.current = Date.now();
    setStatus('pending');

    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      doSave();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, project, hasUnsavedChanges, debounceMs, doSave]);

  // Tab close protection
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'У вас есть несохранённые изменения. Вы уверены, что хотите выйти?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, hasUnsavedChanges]);

  // Visibility change - save when tab becomes hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        logger.info('AutoSave: tab hidden, saving immediately');
        doSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, hasUnsavedChanges, doSave]);

  return {
    status,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow: doSave,
    timeSinceLastSave,
  };
}
