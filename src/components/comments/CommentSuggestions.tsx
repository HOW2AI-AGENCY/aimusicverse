/**
 * Comment Suggestions Component
 * Feature: Sprint 32 - US-006 Comment Prompt Suggestions
 *
 * Provides tap-to-insert suggestions for comments
 * Context-aware based on track style and mood
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Lightbulb, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

/**
 * Comment suggestion presets by genre
 */
export const COMMENT_SUGGESTIONS = {
  // General suggestions (work for any genre)
  general: [
    'Отличный трек! 🔥',
    'Люблю эту мелодию! 🎵',
    'Хочу ремикс!',
    'Добавил в плейлист 👍',
    'Очень атмосферно ✨',
    'На репите!',
  ],

  // Electronic/EDM
  electronic: [
    'Просто огонь! 🔥🔥🔥',
    'Дроп просто бомба!',
    'Бас убивает 💀',
    'Идеально для тренировки!',
    'Хочется танцевать 💃',
    'Energy +1000',
  ],

  // Pop
  pop: [
    'Держу голову на повторе!',
    'Очень кэтчево! 😍',
    'Залетело в голову на весь день',
    'Мгновенный фаворит!',
    'Хит!',
    'Радио хит качество!',
  ],

  // Rock
  rock: [
    'Жестко! 🤘',
    'Гитары просто топ!',
    'Рок-н-ролл жив!',
    'Power!',
    'Крутое соло!',
    'Энергия на максимум!',
  ],

  // Hip-Hop/Rap
  hip_hop: [
    'Бит огонь! 🔥',
    'Флоу чистый!',
    'Топ!',
    'Грязно звучит!',
    'Понравился бит',
    'Стильно!',
  ],

  // Lo-Fi/Chill
  lofi: [
    'Вайб высокий ✨',
    'Идеально для учебы 📚',
    'Очень атмосферно',
    'Расслабляет 🌊',
    'Lo-Fi aesthetic!',
    'Cozy vibes',
  ],

  // Jazz/Blues
  jazz: [
    'Джаз в сердце 🎷',
    'Очень душевно',
    'Классика!',
    'Сакс просто топ!',
    'Уютно звучит',
    'Improvisation goals',
  ],

  // Classical
  classical: [
    'Величественно! 🎻',
    'Очень красиво',
    'Профессионально звучит',
    'Оркестр на высоте',
    'Магия музыки 🪄',
    'Классический шедевр',
  ],

  // Country/Folk
  folk: [
    'Душевно! 🎸',
    'Очень мелодично',
    'Акустическая красота',
    'Warm vibes',
    'Заботит!',
    'Folk masterpiece',
  ],

  // Ambient/Chillout
  ambient: [
    'Космические вайбы 🌌',
    'Медитативно',
    'Очень расслабляет',
    'Space vibes',
    'Ethereal!',
    'Zen mode on',
  ],
};

export type CommentCategory = keyof typeof COMMENT_SUGGESTIONS;

/**
 * Get suggestions for a specific genre
 */
export function getSuggestionsForGenre(
  genre?: string
): string[] {
  if (!genre) return COMMENT_SUGGESTIONS.general;

  const normalizedGenre = genre.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Try to find matching category
  for (const [key, suggestions] of Object.entries(COMMENT_SUGGESTIONS)) {
    if (key !== 'general' && normalizedGenre.includes(key)) {
      return suggestions;
    }
  }

  // Fallback to general + mix of others
  return [
    ...COMMENT_SUGGESTIONS.general.slice(0, 3),
    ...COMMENT_SUGGESTIONS.electronic.slice(0, 2),
  ];
}

interface CommentSuggestionsProps {
  trackStyle?: string;
  trackMood?: string;
  onSuggestionSelect: (suggestion: string) => void;
  maxSuggestions?: number;
  className?: string;
  variant?: 'chips' | 'list' | 'compact';
}

/**
 * Comment Suggestions Component
 *
 * Displays tap-to-insert comment suggestions
 *
 * @example
 * ```tsx
 * <CommentSuggestions
 *   trackStyle="Pop"
 *   trackMood="Energetic"
 *   onSuggestionSelect={(suggestion) => setComment(suggestion)}
 * />
 * ```
 */
export const CommentSuggestions = memo(function CommentSuggestions({
  trackStyle,
  trackMood,
  onSuggestionSelect,
  maxSuggestions = 4,
  className,
  variant = 'chips',
}: CommentSuggestionsProps) {
  const { hapticFeedback } = useTelegram();
  const { trackEvent } = useAnalyticsTracking();

  // Get context-aware suggestions
  const suggestions = getSuggestionsForGenre(trackStyle).slice(0, maxSuggestions);

  const handleSuggestionClick = useCallback(
    (suggestion: string, index: number) => {
      hapticFeedback?.('light');
      trackEvent({
        eventType: 'feature_used',
        eventName: 'comment_suggestion_used',
        metadata: { suggestion, index, trackStyle },
      });

      logger.info('Comment suggestion selected', {
        suggestion,
        trackStyle,
        index,
      });

      onSuggestionSelect(suggestion);
    },
    [hapticFeedback, trackEvent, trackStyle, onSuggestionSelect]
  );

  const variants = {
    chips: (
      <div
        className={cn('flex flex-wrap gap-2', className)}
        role="list"
        aria-label="Comment suggestions"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            onClick={() => handleSuggestionClick(suggestion, index)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-xs sm:text-sm font-medium',
              'bg-primary/10 text-primary hover:bg-primary/20',
              'active:scale-95',
              'transition-all duration-150',
              'border border-primary/20'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            role="listitem"
          >
            <Wand2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{suggestion}</span>
          </motion.button>
        ))}
      </div>
    ),

    list: (
      <div className={cn('space-y-1.5', className)} role="list">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            onClick={() => handleSuggestionClick(suggestion, index)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg',
              'text-sm text-muted-foreground hover:text-foreground',
              'bg-muted/50 hover:bg-muted',
              'transition-colors duration-150',
              'flex items-center gap-2'
            )}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            role="listitem"
          >
            <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{suggestion}</span>
          </motion.button>
        ))}
      </div>
    ),

    compact: (
      <div
        className={cn('flex gap-2 overflow-x-auto pb-1', className)}
        role="list"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            onClick={() => handleSuggestionClick(suggestion, index)}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-md',
              'text-xs text-muted-foreground',
              'bg-muted hover:bg-muted/80',
              'active:scale-95',
              'transition-all duration-150'
            )}
            whileTap={{ scale: 0.95 }}
            role="listitem"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    ),
  };

  return variants[variant];
});

/**
 * Inline comment suggestions (for compact spaces)
 */
export const InlineCommentSuggestions = memo(function InlineCommentSuggestions({
  trackStyle,
  onSuggestionSelect,
  className,
}: {
  trackStyle?: string;
  onSuggestionSelect: (suggestion: string) => void;
  className?: string;
}) {
  const suggestions = getSuggestionsForGenre(trackStyle).slice(0, 3);

  return (
    <div className={cn('flex gap-1.5', className)}>
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onSuggestionSelect(suggestion)}
          className="text-xs text-primary hover:underline"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
});
