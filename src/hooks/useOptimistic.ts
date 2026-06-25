/**
 * Optimistic Updates Hook
 * Feature: 032-professional-ui
 *
 * Provides instant UI feedback for async operations.
 * Rolls back on error for reliable UX.
 */

import { useState, useCallback, useRef } from "react";
import { toast } from "@/components/ui/ux-components";

interface OptimisticOptions<T> {
  /** Current value */
  value: T;
  /** Async mutation function */
  mutation: (newValue: T) => Promise<void>;
  /** Rollback on error (default: true) */
  rollbackOnError?: boolean;
  /** Success message */
  successMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: (value: T) => void;
  /** Callback on error */
  onError?: (error: Error, originalValue: T) => void;
}

interface OptimisticResult<T> {
  /** Current optimistic value */
  value: T;
  /** Whether mutation is in progress */
  isPending: boolean;
  /** Last error if any */
  error: Error | null;
  /** Apply optimistic update */
  update: (newValue: T) => Promise<void>;
  /** Reset error state */
  clearError: () => void;
}

/**
 * useOptimistic - Apply instant UI updates with async backup
 *
 * @example
 * const { value: isLiked, isPending, update } = useOptimistic({
 *   value: track.isLiked,
 *   mutation: async (liked) => {
 *     await toggleLike(track.id, liked);
 *   },
 *   successMessage: isLiked ? 'Removed from favorites' : 'Added to favorites',
 * });
 *
 * <button onClick={() => update(!isLiked)} disabled={isPending}>
 *   <Heart className={cn(isLiked && 'fill-current text-red-500')} />
 * </button>
 */
export function useOptimistic<T>(options: OptimisticOptions<T>): OptimisticResult<T> {
  const {
    value: initialValue,
    mutation,
    rollbackOnError = true,
    successMessage,
    errorMessage = "Произошла ошибка",
    onSuccess,
    onError,
  } = options;

  const [optimisticValue, setOptimisticValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const originalValueRef = useRef<T>(initialValue);

  // Sync with external value changes
  const prevValueRef = useRef(initialValue);
  if (prevValueRef.current !== initialValue && !isPending) {
    prevValueRef.current = initialValue;
    setOptimisticValue(initialValue);
    originalValueRef.current = initialValue;
  }

  const update = useCallback(
    async (newValue: T) => {
      // Store original for potential rollback
      originalValueRef.current = optimisticValue;

      // Apply optimistic update immediately
      setOptimisticValue(newValue);
      setIsPending(true);
      setError(null);

      try {
        await mutation(newValue);

        if (successMessage) {
          toast.success(successMessage);
        }

        onSuccess?.(newValue);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (rollbackOnError) {
          setOptimisticValue(originalValueRef.current);
        }

        toast.error(errorMessage, {
          description: error.message,
        });

        onError?.(error, originalValueRef.current);
      } finally {
        setIsPending(false);
      }
    },
    [optimisticValue, mutation, rollbackOnError, successMessage, errorMessage, onSuccess, onError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    value: optimisticValue,
    isPending,
    error,
    update,
    clearError,
  };
}

/**
 * useOptimisticList - Optimistic updates for list operations
 *
 * @example
 * const { items, add, remove, update } = useOptimisticList({
 *   items: tracks,
 *   onAdd: (track) => api.createTrack(track),
 *   onRemove: (id) => api.deleteTrack(id),
 * });
 */
export function useOptimisticList<T extends { id: string }>(options: {
  items: T[];
  onAdd?: (item: T) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
  onUpdate?: (item: T) => Promise<void>;
}) {
  const { items: initialItems, onAdd, onRemove, onUpdate } = options;
  const [optimisticItems, setOptimisticItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Sync with external changes
  const prevItemsRef = useRef(initialItems);
  if (prevItemsRef.current !== initialItems && pendingIds.size === 0) {
    prevItemsRef.current = initialItems;
    setOptimisticItems(initialItems);
  }

  const add = useCallback(
    async (item: T) => {
      const tempId = item.id || `temp-${Date.now()}`;
      const newItem = { ...item, id: tempId };

      setOptimisticItems((prev) => [newItem, ...prev]);
      setPendingIds((prev) => new Set(prev).add(tempId));

      try {
        await onAdd?.(item);
      } catch (err) {
        setOptimisticItems((prev) => prev.filter((i) => i.id !== tempId));
        toast.error("Не удалось добавить");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    },
    [onAdd],
  );

  const remove = useCallback(
    async (id: string) => {
      const itemToRemove = optimisticItems.find((i) => i.id === id);
      if (!itemToRemove) return;

      setOptimisticItems((prev) => prev.filter((i) => i.id !== id));
      setPendingIds((prev) => new Set(prev).add(id));

      try {
        await onRemove?.(id);
        toast.success("Удалено");
      } catch (err) {
        setOptimisticItems((prev) => [itemToRemove, ...prev]);
        toast.error("Не удалось удалить");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [optimisticItems, onRemove],
  );

  const update = useCallback(
    async (item: T) => {
      const originalItem = optimisticItems.find((i) => i.id === item.id);
      if (!originalItem) return;

      setOptimisticItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setPendingIds((prev) => new Set(prev).add(item.id));

      try {
        await onUpdate?.(item);
      } catch (err) {
        setOptimisticItems((prev) => prev.map((i) => (i.id === item.id ? originalItem : i)));
        toast.error("Не удалось обновить");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [optimisticItems, onUpdate],
  );

  return {
    items: optimisticItems,
    pendingIds,
    isPending: (id: string) => pendingIds.has(id),
    add,
    remove,
    update,
  };
}

export default useOptimistic;
