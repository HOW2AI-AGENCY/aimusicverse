/**
 * Enhanced Generation Hook with Error Handling & Retry
 * Integrates Sprint 32 error handling components
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  mapSunoError,
  type UserFriendlyError,
  isRetryableError,
} from '@/lib/suno-error-mapper';
import { useAutomaticRetry } from '@/hooks/useAutomaticRetry';
import { useUserCredits } from '@/hooks/useUserCredits';
import { expectGenerationResult } from '@/hooks/generation/useGenerationResult';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

export interface GenerationParams {
  prompt?: string;
  style?: string;
  lyrics?: string;
  title?: string;
  tags?: string[];
  hasVocals?: boolean;
  model?: string;
  negativeTags?: string;
  instrumental?: boolean;
  audioFile?: File | null;
  mode?: 'cover' | 'extend' | 'custom';
  referenceAudioId?: string;
}

export interface UseGenerationWithErrorHandlingOptions {
  onGenerationStarted?: () => void;
  onGenerationComplete?: (result: any) => void;
  onGenerationFailed?: (error: UserFriendlyError) => void;
  onErrorRetry?: (attempt: number) => void;
}

/**
 * Enhanced generation hook with error handling and automatic retry
 */
export function useGenerationWithErrorHandling(
  options: UseGenerationWithErrorHandlingOptions = {}
) {
  const {
    onGenerationStarted,
    onGenerationComplete,
    onGenerationFailed,
    onErrorRetry,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [result, setResult] = useState<any>(null);

  const navigate = useNavigate();
  const { trackEvent } = useAnalyticsTracking();

  // Automatic retry for retryable errors
  const { retry, state: retryState, cancelRetry } = useAutomaticRetry({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    onRetry: (attempt) => {
      logger.info('Retrying generation', { attempt });
      trackEvent('generation_retry_attempt', { attempt });
      onErrorRetry?.(attempt);

      toast.info(`Повторная попытка ${attempt}/3...`, {
        description: 'Генерация перезапускается',
      });
    },
    onRetrySuccess: (attempt) => {
      logger.info('Retry successful', { attempt });
      trackEvent('generation_retry_success', { attempt });
      toast.success('Успешно!', {
        description: `Генерация завершилась с ${attempt} попытки`,
      });
    },
    onRetryFailed: (error) => {
      logger.error('Retry failed', { error });
      trackEvent('generation_retry_failed', {
        attempts: retryState.retryCount,
      });
    },
  });

  /**
   * Execute generation with error handling
   */
  const generate = useCallback(
    async (params: GenerationParams): Promise<any> => {
      setLoading(true);
      setError(null);
      setResult(null);

      onGenerationStarted?.();

      trackEvent('generation_started', {
        mode: params.mode,
        hasLyrics: !!params.lyrics,
        model: params.model,
      });

      try {
        // Use automatic retry for the actual generation call
        const result = await retry(async () => {
          // Prepare request body
          const body: any = {
            prompt: params.prompt || '',
            tags: params.tags || [],
            mv: params.model || 'V4_5ALL',
            title: params.title,
          };

          if (params.style) {
            body.style = params.style;
          }

          if (params.lyrics && params.hasVocals !== false) {
            body.lyrics = params.lyrics;
          }

          if (params.negativeTags) {
            body.negative_tags = params.negativeTags;
          }

          if (params.instrumental) {
            body.instrumental = true;
          }

          // Handle different modes
          if (params.mode === 'cover' && params.referenceAudioId) {
            body.gpt_description_prompt = `Cover of: ${params.prompt || params.title}`;
            body.audio_reference_id = params.referenceAudioId;
          }

          if (params.mode === 'extend' && params.referenceAudioId) {
            body.gpt_description_prompt = `Continue: ${params.prompt || params.title}`;
            body.audio_reference_id = params.referenceAudioId;
            body.continue_at = params.extendAt || 'end';
          }

          // Call the generation API
          const { data, error: apiError } = await supabase.functions.invoke(
            'suno-generate',
            { body }
          );

          if (apiError) {
            throw apiError;
          }

          if (!data) {
            throw new Error('No data returned from generation API');
          }

          return data;
        });

        // Success
        setResult(result);
        setLoading(false);

        // Expect generation result for post-generation flow
        if (result?.generation_id) {
          expectGenerationResult(result.generation_id, {
            navigate,
            trackParams: params,
          });
        }

        onGenerationComplete?.(result);

        trackEvent('generation_completed', {
          generationId: result?.generation_id,
          mode: params.mode,
        });

        return result;
      } catch (err: any) {
        // Map error to user-friendly format
        const userError = mapSunoError(err, {
          // Add context if available
          requiredCredits: 5,
          balanceCredits: 0, // Would come from useUserCredits
        });

        setError(userError);
        setLoading(false);

        onGenerationFailed?.(userError);

        trackEvent('generation_failed', {
          errorCode: userError.code,
          retryable: userError.retryable,
        });

        // Show toast notification
        if (userError.retryable) {
          toast.error(userError.title, {
            description: userError.message,
            action: {
              label: userError.action,
              onClick: () => {
                // User clicked retry - trigger retry
                toast.dismiss();
                generate(params);
              },
            },
          });
        } else {
          toast.error(userError.title, {
            description: userError.message,
          });
        }

        logger.error('Generation failed', {
          errorCode: userError.code,
          retryable: userError.retryable,
          originalError: err,
        });

        throw userError;
      }
    },
    [
      retry,
      onGenerationStarted,
      onGenerationComplete,
      onGenerationFailed,
      onErrorRetry,
      trackEvent,
      navigate,
    ]
  );

  /**
   * Manual retry with same params
   */
  const manualRetry = useCallback(
    async (params: GenerationParams) => {
      cancelRetry(); // Cancel any ongoing retry
      return generate(params);
    },
    [generate, cancelRetry]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    cancelRetry();
  }, [cancelRetry]);

  return {
    generate,
    manualRetry,
    reset,
    loading,
    error,
    result,
    retryState,
  };
}
