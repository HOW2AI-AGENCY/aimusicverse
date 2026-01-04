/**
 * useReliableGeneration - Ensures generation triggers reliably in Live mode
 * Handles debouncing, state tracking, and retry logic
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface UseReliableGenerationOptions {
  /** Minimum time between generation attempts in ms */
  debounceMs?: number;
  /** Maximum time to wait before forcing generation */
  maxWaitMs?: number;
  /** Callback when generation should be triggered */
  onTrigger: (prompt: string) => Promise<void>;
  /** Whether live mode is active */
  isLiveMode: boolean;
}

interface GenerationState {
  lastPrompt: string;
  lastTriggeredAt: number;
  pendingPrompt: string | null;
  isGenerating: boolean;
  failureCount: number;
}

export function useReliableGeneration({
  debounceMs = 2000,
  maxWaitMs = 5000,
  onTrigger,
  isLiveMode,
}: UseReliableGenerationOptions) {
  const stateRef = useRef<GenerationState>({
    lastPrompt: '',
    lastTriggeredAt: 0,
    pendingPrompt: null,
    isGenerating: false,
    failureCount: 0,
  });
  
  const [generationCount, setGenerationCount] = useState(0);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Execute generation
  const executeGeneration = useCallback(async (prompt: string) => {
    if (stateRef.current.isGenerating) {
      // Queue for later
      stateRef.current.pendingPrompt = prompt;
      return;
    }

    // Skip if same as last prompt
    if (prompt === stateRef.current.lastPrompt) {
      return;
    }

    stateRef.current.isGenerating = true;
    clearAllTimeouts();

    try {
      await onTrigger(prompt);
      
      // Success - update state
      stateRef.current.lastPrompt = prompt;
      stateRef.current.lastTriggeredAt = Date.now();
      stateRef.current.failureCount = 0;
      stateRef.current.pendingPrompt = null;
      setGenerationCount(c => c + 1);
      
    } catch (error) {
      console.error('Generation failed:', error);
      stateRef.current.failureCount++;
      
      // Retry with exponential backoff (max 3 retries)
      if (stateRef.current.failureCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, stateRef.current.failureCount), 8000);
        retryTimeoutRef.current = setTimeout(() => {
          if (isLiveMode) {
            executeGeneration(prompt);
          }
        }, retryDelay);
      }
    } finally {
      stateRef.current.isGenerating = false;
      
      // Process pending prompt if any
      if (stateRef.current.pendingPrompt && isLiveMode) {
        const pending = stateRef.current.pendingPrompt;
        stateRef.current.pendingPrompt = null;
        // Small delay before processing pending
        setTimeout(() => executeGeneration(pending), 100);
      }
    }
  }, [onTrigger, isLiveMode, clearAllTimeouts]);

  // Debounced trigger
  const debouncedTrigger = useDebouncedCallback(
    (prompt: string) => {
      if (isLiveMode) {
        executeGeneration(prompt);
      }
    },
    debounceMs,
    { leading: false, trailing: true }
  );

  // Request generation with debouncing
  const requestGeneration = useCallback((prompt: string) => {
    if (!isLiveMode) return;
    
    // Skip if same as last prompt
    if (prompt === stateRef.current.lastPrompt) return;
    
    // Store pending for max wait
    stateRef.current.pendingPrompt = prompt;
    
    // Clear existing max wait timeout
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }
    
    // Set max wait timeout - force generation if debounce keeps resetting
    maxWaitTimeoutRef.current = setTimeout(() => {
      if (stateRef.current.pendingPrompt && isLiveMode) {
        executeGeneration(stateRef.current.pendingPrompt);
      }
    }, maxWaitMs);
    
    // Request debounced generation
    debouncedTrigger(prompt);
  }, [isLiveMode, maxWaitMs, debouncedTrigger, executeGeneration]);

  // Force immediate generation (bypasses debounce)
  const forceGeneration = useCallback((prompt: string) => {
    if (!isLiveMode) return;
    clearAllTimeouts();
    debouncedTrigger.cancel();
    executeGeneration(prompt);
  }, [isLiveMode, clearAllTimeouts, debouncedTrigger, executeGeneration]);

  // Reset state
  const reset = useCallback(() => {
    clearAllTimeouts();
    debouncedTrigger.cancel();
    stateRef.current = {
      lastPrompt: '',
      lastTriggeredAt: 0,
      pendingPrompt: null,
      isGenerating: false,
      failureCount: 0,
    };
  }, [clearAllTimeouts, debouncedTrigger]);

  // Cleanup on unmount or mode change
  useEffect(() => {
    if (!isLiveMode) {
      reset();
    }
    return () => {
      clearAllTimeouts();
      debouncedTrigger.cancel();
    };
  }, [isLiveMode, reset, clearAllTimeouts, debouncedTrigger]);

  return {
    requestGeneration,
    forceGeneration,
    reset,
    isGenerating: stateRef.current.isGenerating,
    generationCount,
    lastPrompt: stateRef.current.lastPrompt,
  };
}
