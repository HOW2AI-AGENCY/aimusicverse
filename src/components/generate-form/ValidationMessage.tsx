/**
 * ValidationMessage - Inline validation message component
 * Provides WCAG AA compliant error/warning messages with proper contrast
 */

import { memo } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkForBlockedArtists } from '@/lib/errorHandling';

export type ValidationLevel = 'error' | 'warning' | 'info';

interface ValidationMessageProps {
  message: string;
  level?: ValidationLevel;
  fieldId?: string;
  className?: string;
}

const levelConfig: Record<ValidationLevel, {
  icon: typeof AlertCircle;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800/50',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
  },
};

export const ValidationMessage = memo(function ValidationMessage({
  message,
  level = 'error',
  fieldId,
  className,
}: ValidationMessageProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div
      id={fieldId ? `${fieldId}-error` : undefined}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg border text-xs',
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1 leading-tight">{message}</span>
    </div>
  );
});

/**
 * Validation rules for generate form fields
 */
/**
 * Check for blocked artist names in text
 * Returns validation result if artist found
 */
export function checkArtistValidation(text: string): { message: string; level: ValidationLevel; suggestion?: string } | null {
  if (!text) return null;
  
  const blockedArtist = checkForBlockedArtists(text);
  if (blockedArtist) {
    return {
      message: `Нельзя использовать имя "${blockedArtist}". Опишите стиль без упоминания артистов.`,
      level: 'error',
      suggestion: 'Например: "мелодичный рэп" вместо имени артиста',
    };
  }
  
  return null;
}

export const validation = {
  description: {
    minLength: 10,
    maxLength: 500,
    getMessage: (length: number, text?: string): { message: string; level: ValidationLevel; suggestion?: string } | null => {
      // First check for blocked artists (priority error)
      if (text) {
        const artistCheck = checkArtistValidation(text);
        if (artistCheck) return artistCheck;
      }
      
      if (length === 0) {
        return null; // Empty is allowed
      }
      if (length < validation.description.minLength) {
        return {
          message: `Минимум ${validation.description.minLength} символов для точной генерации`,
          level: 'warning',
        };
      }
      if (length > validation.description.maxLength) {
        return {
          message: 'Превышен лимит символов. Сократите описание или переключитесь в Полный режим',
          level: 'error',
        };
      }
      if (length > validation.description.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.description.maxLength - length} символов`,
          level: 'warning',
        };
      }
      return null;
    },
  },
  
  title: {
    maxLength: 80,
    getMessage: (length: number): { message: string; level: ValidationLevel } | null => {
      if (length > validation.title.maxLength) {
        return {
          message: `Название слишком длинное (максимум ${validation.title.maxLength} символов)`,
          level: 'error',
        };
      }
      if (length > validation.title.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.title.maxLength - length} символов`,
          level: 'info',
        };
      }
      return null;
    },
  },
  
  style: {
    minLength: 10,
    maxLength: 500,
    getMessage: (length: number, text?: string): { message: string; level: ValidationLevel; suggestion?: string } | null => {
      // First check for blocked artists (priority error)
      if (text) {
        const artistCheck = checkArtistValidation(text);
        if (artistCheck) return artistCheck;
      }
      
      if (length === 0) {
        return null; // Empty is allowed
      }
      if (length < validation.style.minLength) {
        return {
          message: `Минимум ${validation.style.minLength} символов для точной генерации стиля`,
          level: 'warning',
        };
      }
      if (length > validation.style.maxLength) {
        return {
          message: 'Превышен лимит символов. Сократите описание стиля',
          level: 'error',
        };
      }
      if (length > validation.style.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.style.maxLength - length} символов`,
          level: 'warning',
        };
      }
      return null;
    },
  },
  
  lyrics: {
    minLength: 20,
    maxLength: 3000,
    getMessage: (length: number, hasVocals: boolean): { message: string; level: ValidationLevel } | null => {
      if (!hasVocals) {
        return null; // Lyrics not needed for instrumental
      }
      if (length === 0) {
        return {
          message: 'Для вокального трека требуется текст песни',
          level: 'warning',
        };
      }
      if (length < validation.lyrics.minLength) {
        return {
          message: `Минимум ${validation.lyrics.minLength} символов для полноценной песни`,
          level: 'warning',
        };
      }
      if (length > validation.lyrics.maxLength) {
        return {
          message: 'Превышен лимит символов. Сократите текст песни',
          level: 'error',
        };
      }
      if (length > validation.lyrics.maxLength * 0.9) {
        return {
          message: `Осталось ${validation.lyrics.maxLength - length} символов`,
          level: 'info',
        };
      }
      return null;
    },
  },
};
