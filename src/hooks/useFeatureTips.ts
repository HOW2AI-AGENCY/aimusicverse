/**
 * useFeatureTips - Unified hook for managing feature discovery tips
 * 
 * Phase 4: Onboarding integration
 * - Combines hint tracking with tutorial dialogs
 * - Provides centralized tip management across the app
 * - Auto-shows tips on first page visit (library, studio, generation)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useHintTracking, HINT_IDS } from '@/hooks/useHintTracking';

export type FeatureTipId = 
  | 'swipe-gesture'
  | 'version-badge'
  | 'waveform-seek'
  | 'track-menu'
  | 'queue-management'
  | 'repeat-modes'
  | 'stem-mixing'
  | 'effects-panel'
  | 'quick-presets'
  | 'reference-audio'
  | 'share-options'
  | 'playlist-creation'
  | 'studio-first-open'
  | 'cover-action'
  | 'extend-action'
  | 'lyrics-ai'
  | 'recording'
  | 'chord-detection';

interface FeatureTip {
  id: FeatureTipId;
  title: string;
  message: string;
  emoji?: string;
  priority: number;
  context: 'library' | 'player' | 'studio' | 'generation' | 'social';
}

/**
 * Feature tips configuration
 */
export const FEATURE_TIPS: Record<FeatureTipId, FeatureTip> = {
  'swipe-gesture': {
    id: 'swipe-gesture',
    title: 'Жесты свайпа',
    message: 'Свайпните трек влево для добавления в очередь, вправо — для смены версии',
    emoji: '👆',
    priority: 1,
    context: 'library',
  },
  'version-badge': {
    id: 'version-badge',
    title: 'Версии A/B',
    message: 'Нажмите на бейдж версии для переключения между A и B вариантами',
    emoji: '🔄',
    priority: 2,
    context: 'library',
  },
  'waveform-seek': {
    id: 'waveform-seek',
    title: 'Перемотка по волне',
    message: 'Нажмите на waveform для перехода к нужному моменту трека',
    emoji: '📊',
    priority: 2,
    context: 'player',
  },
  'track-menu': {
    id: 'track-menu',
    title: 'Меню трека',
    message: 'Откройте меню для доступа к стемам, кавер, расширению и другим функциям',
    emoji: '⋮',
    priority: 1,
    context: 'library',
  },
  'queue-management': {
    id: 'queue-management',
    title: 'Очередь воспроизведения',
    message: 'Управляйте очередью: перетаскивайте треки для изменения порядка',
    emoji: '📋',
    priority: 3,
    context: 'player',
  },
  'repeat-modes': {
    id: 'repeat-modes',
    title: 'Режимы повтора',
    message: 'Нажимайте на кнопку повтора для переключения: все → один → выключено',
    emoji: '🔁',
    priority: 3,
    context: 'player',
  },
  'stem-mixing': {
    id: 'stem-mixing',
    title: 'Микшер стемов',
    message: 'Регулируйте громкость каждого стема для идеального микса',
    emoji: '🎚️',
    priority: 1,
    context: 'studio',
  },
  'effects-panel': {
    id: 'effects-panel',
    title: 'Эффекты',
    message: 'Добавляйте реверб, эхо и другие эффекты к отдельным стемам',
    emoji: '✨',
    priority: 2,
    context: 'studio',
  },
  'quick-presets': {
    id: 'quick-presets',
    title: 'Быстрые пресеты',
    message: 'Используйте готовые стили для мгновенной генерации',
    emoji: '⚡',
    priority: 1,
    context: 'generation',
  },
  'reference-audio': {
    id: 'reference-audio',
    title: 'Референсное аудио',
    message: 'Загрузите аудио-референс для создания трека в похожем стиле',
    emoji: '🎯',
    priority: 2,
    context: 'generation',
  },
  'share-options': {
    id: 'share-options',
    title: 'Поделиться',
    message: 'Делитесь треками в Telegram Stories или копируйте ссылку',
    emoji: '🚀',
    priority: 2,
    context: 'social',
  },
  'playlist-creation': {
    id: 'playlist-creation',
    title: 'Создание плейлиста',
    message: 'Организуйте треки в плейлисты для удобного доступа',
    emoji: '📂',
    priority: 3,
    context: 'social',
  },
  'studio-first-open': {
    id: 'studio-first-open',
    title: 'Добро пожаловать в Студию!',
    message: 'Здесь вы можете редактировать стемы, микшировать и экспортировать',
    emoji: '🎛️',
    priority: 1,
    context: 'studio',
  },
  'cover-action': {
    id: 'cover-action',
    title: 'AI-кавер',
    message: 'Создайте кавер-версию в любом жанре',
    emoji: '🎤',
    priority: 2,
    context: 'studio',
  },
  'extend-action': {
    id: 'extend-action',
    title: 'Расширение трека',
    message: 'Продлите трек, добавив новые секции',
    emoji: '➕',
    priority: 2,
    context: 'studio',
  },
  'lyrics-ai': {
    id: 'lyrics-ai',
    title: 'AI-помощник для текстов',
    message: 'Генерируйте и редактируйте тексты с помощью AI',
    emoji: '✍️',
    priority: 1,
    context: 'studio',
  },
  'recording': {
    id: 'recording',
    title: 'Запись',
    message: 'Записывайте вокал или инструменты прямо поверх трека',
    emoji: '🎙️',
    priority: 2,
    context: 'studio',
  },
  'chord-detection': {
    id: 'chord-detection',
    title: 'Определение аккордов',
    message: 'AI автоматически определит аккорды вашей записи',
    emoji: '🎸',
    priority: 3,
    context: 'studio',
  },
};

/**
 * Hook for managing a single feature tip
 */
export function useFeatureTip(tipId: FeatureTipId) {
  const { hasSeenHint, markAsSeen, resetHint } = useHintTracking(tipId);
  const tip = FEATURE_TIPS[tipId];

  return {
    tip,
    hasSeen: hasSeenHint,
    markAsSeen,
    resetHint,
    shouldShow: !hasSeenHint,
  };
}

/**
 * Hook for managing tips by context
 */
export function useContextTips(context: FeatureTip['context']) {
  const contextTips = useMemo(() => 
    Object.values(FEATURE_TIPS)
      .filter(tip => tip.context === context)
      .sort((a, b) => a.priority - b.priority),
    [context]
  );

  const [shownTipId, setShownTipId] = useState<FeatureTipId | null>(null);

  // Check which tips haven't been seen
  const getUnseenTips = useCallback(() => {
    return contextTips.filter(tip => {
      try {
        return localStorage.getItem(`hint_seen_${tip.id}`) !== 'true';
      } catch {
        return true;
      }
    });
  }, [contextTips]);

  // Show the highest priority unseen tip
  const showNextTip = useCallback(() => {
    const unseen = getUnseenTips();
    if (unseen.length > 0) {
      setShownTipId(unseen[0].id);
      return unseen[0];
    }
    return null;
  }, [getUnseenTips]);

  // Mark current tip as seen and optionally show next
  const dismissCurrentTip = useCallback((showNext = false) => {
    if (shownTipId) {
      try {
        localStorage.setItem(`hint_seen_${shownTipId}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }
    
    if (showNext) {
      const unseen = getUnseenTips().filter(t => t.id !== shownTipId);
      setShownTipId(unseen.length > 0 ? unseen[0].id : null);
    } else {
      setShownTipId(null);
    }
  }, [shownTipId, getUnseenTips]);

  const currentTip = shownTipId ? FEATURE_TIPS[shownTipId] : null;

  return {
    contextTips,
    currentTip,
    shownTipId,
    showNextTip,
    dismissCurrentTip,
    unseenCount: getUnseenTips().length,
  };
}

/**
 * Hook for managing tutorial dialog state
 */
export function useTutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [tutorialType, setTutorialType] = useState<string | null>(null);

  const openTutorial = useCallback((type: string) => {
    setTutorialType(type);
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setTutorialType(null);
  }, []);

  return {
    isOpen,
    tutorialType,
    openTutorial,
    closeTutorial,
  };
}

/**
 * Hook for auto-showing tips on first page visit
 * Use this in pages to trigger onboarding automatically
 */
export function useAutoShowTip(context: FeatureTip['context'], delayMs: number = 2000) {
  const { currentTip, showNextTip, dismissCurrentTip, unseenCount } = useContextTips(context);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  // Auto-show tip after delay on first visit
  useEffect(() => {
    if (hasTriggered || unseenCount === 0) return;
    
    const timer = setTimeout(() => {
      showNextTip();
      setHasTriggered(true);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [hasTriggered, unseenCount, showNextTip, delayMs]);
  
  return {
    currentTip,
    dismissCurrentTip,
    hasUnseen: unseenCount > 0,
  };
}

export default useFeatureTip;
