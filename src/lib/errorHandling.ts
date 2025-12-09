/**
 * Centralized error handling utilities for the application
 */

import { toast } from 'sonner';
import { logger } from './logger';
import { 
  toAppError, 
  AppError, 
  NetworkError, 
  InsufficientCreditsError,
  GenerationError,
  ErrorCode 
} from './errors/AppError';

/**
 * Display a standardized error toast for generation failures
 * Enhanced with AppError hierarchy (IMP039)
 */
export function showGenerationError(error: unknown): void {
  const appError = toAppError(error);
  logger.error('Generation error', appError.toJSON());

  // Use type-specific error messages
  if (appError instanceof InsufficientCreditsError) {
    toast.error('Недостаточно кредитов', {
      description: appError.toUserMessage(),
    });
  } else if (appError instanceof NetworkError) {
    toast.error('Ошибка сети', {
      description: appError.toUserMessage(),
    });
  } else if (appError instanceof GenerationError) {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage(),
    });
  } else {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage() || 'Попробуйте еще раз',
    });
  }
}

/**
 * Clean up localStorage for audio references in error scenarios
 */
export function cleanupAudioReference(): void {
  try {
    localStorage.removeItem('stem_audio_reference');
    logger.info('Audio reference cleaned up from localStorage');
  } catch (error) {
    logger.error('Failed to cleanup audio reference', { error });
  }
}
