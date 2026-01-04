import { useState, useCallback, useRef } from 'react';
import { useHaptic } from './useHaptic';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error: Error | null;
}

interface UseOptimisticUpdateOptions<T> {
  /** Initial data value */
  initialData: T;
  /** Async function that performs the actual update */
  updateFn: (newData: T) => Promise<T>;
  /** Called on successful update */
  onSuccess?: (data: T) => void;
  /** Called on error (receives previous data for potential rollback UI) */
  onError?: (error: Error, previousData: T) => void;
  /** Enable haptic feedback on actions */
  hapticFeedback?: boolean;
}

interface UseOptimisticUpdateReturn<T> {
  /** Current data (optimistic or confirmed) */
  data: T;
  /** Whether current data is optimistic (not yet confirmed) */
  isOptimistic: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Perform an optimistic update */
  update: (newData: T) => Promise<void>;
  /** Reset to initial data */
  reset: () => void;
  /** Whether an update is in progress */
  isUpdating: boolean;
}

/**
 * Hook for optimistic UI updates with automatic rollback on failure
 */
export function useOptimisticUpdate<T>({
  initialData,
  updateFn,
  onSuccess,
  onError,
  hapticFeedback = true,
}: UseOptimisticUpdateOptions<T>): UseOptimisticUpdateReturn<T> {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const previousDataRef = useRef<T>(initialData);
  const { patterns } = useHaptic();

  const update = useCallback(async (newData: T) => {
    // Store previous data for potential rollback
    previousDataRef.current = state.data;
    
    // Optimistically update immediately
    setState({
      data: newData,
      isOptimistic: true,
      error: null,
    });
    setIsUpdating(true);

    if (hapticFeedback) {
      patterns.tap();
    }

    try {
      // Perform the actual update
      const confirmedData = await updateFn(newData);
      
      // Confirm the update
      setState({
        data: confirmedData,
        isOptimistic: false,
        error: null,
      });

      if (hapticFeedback) {
        patterns.success();
      }

      onSuccess?.(confirmedData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Rollback to previous data
      setState({
        data: previousDataRef.current,
        isOptimistic: false,
        error: err,
      });

      if (hapticFeedback) {
        patterns.error();
      }

      onError?.(err, previousDataRef.current);
    } finally {
      setIsUpdating(false);
    }
  }, [state.data, updateFn, onSuccess, onError, hapticFeedback, patterns]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isOptimistic: false,
      error: null,
    });
    previousDataRef.current = initialData;
  }, [initialData]);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    error: state.error,
    update,
    reset,
    isUpdating,
  };
}
