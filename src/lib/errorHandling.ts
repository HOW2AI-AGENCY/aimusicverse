/**
 * Centralized error handling utilities for the application
 */

import { toast } from 'sonner';
import { logger } from './logger';

/**
 * Display a standardized error toast for generation failures
 */
export function showGenerationError(error: unknown): void {
  logger.error('Generation error', { error });

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('429') || errorMessage.includes('credits')) {
    toast.error('Недостаточно кредитов', {
      description: 'Пополните баланс SunoAPI для продолжения',
    });
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    toast.error('Ошибка сети', {
      description: 'Проверьте подключение к интернету',
    });
  } else {
    toast.error('Ошибка генерации', {
      description: errorMessage || 'Попробуйте еще раз',
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
