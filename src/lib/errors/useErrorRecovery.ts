/**
 * React hook for standardized error handling with recovery
 * Phase 4: IMP027 - Integrates with AppError hierarchy
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  AppError, 
  toAppError, 
  NetworkError,
  ErrorCode,
  RecoveryStrategy,
} from './AppError';
import { showErrorWithRecovery, getRecoveryAction } from '@/lib/errorHandling';
import { logger } from '@/lib/logger';

interface ErrorRecoveryOptions {
  /** Auto-retry retryable errors */
  autoRetry?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Callback on retry */
  onRetry?: () => Promise<void>;
  /** Callback on error */
  onError?: (error: AppError) => void;
  /** Context for logging */
  context?: string;
}

interface ErrorRecoveryState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const { 
    autoRetry = false, 
    maxRetries = 3, 
    onRetry, 
    onError,
    context = 'operation' 
  } = options;

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const clearError = useCallback(() => {
    setState({ error: null, isRetrying: false, retryCount: 0 });
  }, []);

  const handleError = useCallback(async (error: unknown) => {
    const appError = toAppError(error);
    
    logger.error(`${context} error`, appError.toJSON());
    
    setState(prev => ({ 
      ...prev, 
      error: appError,
      isRetrying: false,
    }));

    onError?.(appError);

    // Get recovery strategy from error metadata
    const metadata = appError.metadata;
    const recoveryStrategy = metadata.recoveryStrategy || RecoveryStrategy.NONE;

    // Auto-retry if enabled and error is retryable
    if (autoRetry && metadata?.retryable && state.retryCount < maxRetries && onRetry) {
      const delay = metadata.retryAfterMs || 1000 * Math.pow(2, state.retryCount);
      
      setState(prev => ({ ...prev, isRetrying: true }));
      
      toast.info('Повторная попытка...', {
        description: `Попытка ${state.retryCount + 1} из ${maxRetries}`,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        await onRetry();
        clearError();
        return;
      } catch (retryError) {
        setState(prev => ({ 
          ...prev, 
          retryCount: prev.retryCount + 1,
          isRetrying: false,
        }));
        // Recursively handle if still within retry limit
        if (state.retryCount + 1 < maxRetries) {
          await handleError(retryError);
          return;
        }
      }
    }

    // Show error with recovery options
    showErrorWithRecovery(appError);
  }, [context, autoRetry, maxRetries, onRetry, onError, state.retryCount, clearError]);

  const retry = useCallback(async () => {
    if (!onRetry) return;
    
    setState(prev => ({ ...prev, isRetrying: true }));
    
    try {
      await onRetry();
      clearError();
    } catch (error) {
      await handleError(error);
    }
  }, [onRetry, clearError, handleError]);

  return {
    error: state.error,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    
    handleError,
    clearError,
    retry,
    
    // Helper to check if error is of specific type
    isNetworkError: state.error instanceof NetworkError,
    isRetryable: state.error ? state.error.metadata.retryable ?? false : false,
    
    // Recovery action for UI
    recoveryAction: state.error ? getRecoveryAction(state.error) : null,
  };
}

/**
 * Wrapper for async operations with automatic error handling
 */
export function useAsyncWithRecovery<T>(
  asyncFn: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const recovery = useErrorRecovery({
    ...options,
    onRetry: async () => {
      const result = await asyncFn();
      setData(result);
    },
  });

  const execute = useCallback(async () => {
    setIsLoading(true);
    recovery.clearError();
    
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (error) {
      await recovery.handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, recovery]);

  return {
    data,
    isLoading,
    execute,
    ...recovery,
  };
}
