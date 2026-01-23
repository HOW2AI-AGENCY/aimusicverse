/**
 * Feature Hints System
 * Shows contextual hints when user first encounters a feature
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'musicverse_feature_hints';

export type FeatureHintId = 
  | 'generate_prompt'
  | 'library_swipe'
  | 'stem_studio'
  | 'quick_presets'
  | 'ab_versions'
  | 'lyrics_tags'
  // New hints for Sprint 2
  | 'first_studio'
  | 'cover_action'
  | 'extend_action'
  | 'midi_export'
  | 'subscription_benefits'
  | 'daily_checkin'
  | 'referral_program';

interface FeatureHintState {
  [key: string]: boolean;
}

export function useFeatureHints() {
  const [seenHints, setSeenHints] = useState<FeatureHintState>({});
  const [activeHint, setActiveHint] = useState<FeatureHintId | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSeenHints(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load feature hints:', e);
    }
  }, []);

  // Save to localStorage when hints change
  const saveHints = useCallback((hints: FeatureHintState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hints));
    } catch (e) {
      console.error('Failed to save feature hints:', e);
    }
  }, []);

  const hasSeenHint = useCallback((hintId: FeatureHintId): boolean => {
    return seenHints[hintId] === true;
  }, [seenHints]);

  const markHintSeen = useCallback((hintId: FeatureHintId) => {
    setSeenHints(prev => {
      const updated = { ...prev, [hintId]: true };
      saveHints(updated);
      return updated;
    });
    setActiveHint(null);
  }, [saveHints]);

  const showHint = useCallback((hintId: FeatureHintId): boolean => {
    if (seenHints[hintId]) {
      return false;
    }
    setActiveHint(hintId);
    return true;
  }, [seenHints]);

  const dismissHint = useCallback(() => {
    if (activeHint) {
      markHintSeen(activeHint);
    }
  }, [activeHint, markHintSeen]);

  const resetAllHints = useCallback(() => {
    setSeenHints({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    activeHint,
    hasSeenHint,
    markHintSeen,
    showHint,
    dismissHint,
    resetAllHints
  };
}

// Hint content configuration
export const FEATURE_HINTS: Record<FeatureHintId, {
  title: string;
  description: string;
  icon?: string;
}> = {
  generate_prompt: {
    title: 'Опишите трек',
    description: 'Напишите желаемый стиль, настроение и инструменты. AI создаст музыку по вашему описанию.',
    icon: '✨'
  },
  library_swipe: {
    title: 'Свайп-жесты',
    description: 'Свайпните влево для добавления в очередь, вправо — для смены версии A/B.',
    icon: '👆'
  },
  stem_studio: {
    title: 'Разделение на стемы',
    description: 'Нажмите на дорожку для mute/solo. Создавайте уникальные миксы!',
    icon: '🎚️'
  },
  quick_presets: {
    title: 'Быстрые пресеты',
    description: 'Выберите готовый стиль для мгновенной генерации трека.',
    icon: '⚡'
  },
  ab_versions: {
    title: 'Версии A/B',
    description: 'AI создаёт 2 варианта — сравните и выберите лучший.',
    icon: '🔄'
  },
  lyrics_tags: {
    title: 'Теги для генерации',
    description: 'Добавьте мета-теги [verse], [chorus] для структуры трека.',
    icon: '🏷️'
  },
  // New hints
  first_studio: {
    title: 'Добро пожаловать в студию!',
    description: 'Здесь вы можете редактировать стемы, заменять секции и экспортировать MIDI.',
    icon: '🎛️'
  },
  cover_action: {
    title: 'Создание кавера',
    description: 'Загрузите свой трек или запись, и AI создаст новую версию в выбранном стиле.',
    icon: '🎤'
  },
  extend_action: {
    title: 'Расширение трека',
    description: 'AI продолжит ваш трек, добавив новые части в том же стиле.',
    icon: '➕'
  },
  midi_export: {
    title: 'MIDI экспорт',
    description: 'Экспортируйте ноты в MIDI для редактирования в DAW. Требуется PRO подписка.',
    icon: '🎹'
  },
  subscription_benefits: {
    title: 'Преимущества подписки',
    description: 'PRO: HD качество, больше кредитов, MIDI экспорт. PREMIUM: Ultra HD, все модели AI.',
    icon: '👑'
  },
  daily_checkin: {
    title: 'Ежедневный бонус',
    description: 'Заходите каждый день и получайте бесплатные кредиты. Серия увеличивает награду!',
    icon: '🎁'
  },
  referral_program: {
    title: 'Приглашайте друзей',
    description: 'Получите 15 кредитов за каждого приглашённого друга. Они тоже получат бонус!',
    icon: '🤝'
  },
};
