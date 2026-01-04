import { useState, useEffect, useCallback } from 'react';
import { TooltipConfig } from '@/components/tooltips/InteractiveTooltip';

const STORAGE_KEY = 'musicverse-tooltips-seen';
const NEW_USER_KEY = 'musicverse-new-user-tooltips';

export interface TooltipDefinition extends TooltipConfig {
  route?: string;
  elementId?: string;
  showOnce?: boolean;
}

// All available tooltips - organized by priority and UX flow
export const TOOLTIP_DEFINITIONS: TooltipDefinition[] = [
  // Phase 1: Core generation flow
  {
    id: 'generate-button',
    title: 'Создайте первый трек',
    description: 'Нажмите, чтобы открыть форму генерации. Опишите желаемую музыку — AI создаст её за 2-3 минуты.',
    position: 'bottom',
    route: '/',
    elementId: 'generate-button',
    priority: 1,
    showOnce: true
  },
  {
    id: 'voice-input',
    title: 'Голосовой ввод',
    description: 'Нажмите на микрофон, чтобы надиктовать описание трека вместо набора текста.',
    position: 'left',
    elementId: 'voice-input-button',
    priority: 2,
    showOnce: true
  },
  
  // Phase 2: Library interactions  
  {
    id: 'library-swipe',
    title: 'Свайп для действий',
    description: 'Проведите по карточке трека влево или вправо для быстрых действий.',
    position: 'top',
    route: '/library',
    priority: 1,
    showOnce: true
  },
  {
    id: 'version-switch',
    title: 'Переключение версий',
    description: 'Нажмите A/B чтобы переключаться между вариантами трека.',
    position: 'left',
    elementId: 'version-badge',
    priority: 2,
    showOnce: true
  },
  {
    id: 'quick-studio-access',
    title: 'Быстрый доступ к Studio',
    description: 'Нажмите на иконку палочки, чтобы открыть Stem Studio для трека.',
    position: 'top',
    route: '/library',
    priority: 3,
    showOnce: true
  },
  
  // Phase 3: Studio features
  {
    id: 'stem-studio',
    title: 'Разделите на дорожки',
    description: 'Откройте Stem Studio чтобы разделить трек на вокал, ударные, бас и инструменты.',
    position: 'top',
    route: '/studio-v2',
    priority: 1,
    showOnce: true
  },
  
  // Phase 4: Navigation
  {
    id: 'more-menu',
    title: 'Все разделы',
    description: 'Здесь находятся все студии, настройки, блог и профиль.',
    position: 'top',
    elementId: 'more-menu-button',
    priority: 4,
    showOnce: true
  },
  {
    id: 'projects-plan',
    title: 'Планируйте треки',
    description: 'Создайте план альбома с описанием каждого трека, затем генерируйте их по очереди.',
    position: 'bottom',
    route: '/projects',
    priority: 1,
    showOnce: true
  },
  
  // Phase 5: Player and rewards
  {
    id: 'player-queue',
    title: 'Очередь воспроизведения',
    description: 'Нажмите на иконку списка, чтобы управлять очередью треков.',
    position: 'top',
    elementId: 'queue-button',
    priority: 5,
    showOnce: true
  },
  {
    id: 'daily-checkin',
    title: 'Ежедневные бонусы',
    description: 'Заходите каждый день чтобы получать кредиты и поддерживать streak!',
    position: 'bottom',
    elementId: 'credits-balance',
    priority: 6,
    showOnce: true
  }
];

export function useInteractiveTooltips(currentRoute?: string) {
  const [seenTooltips, setSeenTooltips] = useState<Set<string>>(new Set());
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Load seen tooltips from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSeenTooltips(new Set(JSON.parse(stored)));
      }
      
      // Check if new user (first visit)
      const newUserFlag = localStorage.getItem(NEW_USER_KEY);
      if (!newUserFlag) {
        setIsNewUser(true);
        localStorage.setItem(NEW_USER_KEY, 'false');
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Save seen tooltips to storage
  const markAsSeen = useCallback((tooltipId: string) => {
    setSeenTooltips(prev => {
      const updated = new Set(prev);
      updated.add(tooltipId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch (e) {
        // Ignore storage errors
      }
      return updated;
    });
    setActiveTooltipId(null);
  }, []);

  // Get available tooltips for current route
  const getAvailableTooltips = useCallback(() => {
    return TOOLTIP_DEFINITIONS
      .filter(t => {
        // Filter by route if specified
        if (t.route && currentRoute && t.route !== currentRoute) return false;
        // Filter out already seen (if showOnce)
        if (t.showOnce && seenTooltips.has(t.id)) return false;
        return true;
      })
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }, [currentRoute, seenTooltips]);

  // Get next tooltip to show
  const getNextTooltip = useCallback(() => {
    const available = getAvailableTooltips();
    return available[0] || null;
  }, [getAvailableTooltips]);

  // Show specific tooltip
  const showTooltip = useCallback((tooltipId: string) => {
    setActiveTooltipId(tooltipId);
  }, []);

  // Dismiss current tooltip and show next
  const dismissAndShowNext = useCallback(() => {
    if (activeTooltipId) {
      markAsSeen(activeTooltipId);
    }
    const next = getNextTooltip();
    if (next) {
      // Small delay before showing next
      setTimeout(() => setActiveTooltipId(next.id), 300);
    }
  }, [activeTooltipId, markAsSeen, getNextTooltip]);

  // Check if tooltip should be shown
  const shouldShowTooltip = useCallback((tooltipId: string) => {
    if (!isNewUser) return false;
    return activeTooltipId === tooltipId;
  }, [activeTooltipId, isNewUser]);

  // Get tooltip config by id
  const getTooltipConfig = useCallback((tooltipId: string) => {
    return TOOLTIP_DEFINITIONS.find(t => t.id === tooltipId);
  }, []);

  // Reset all tooltips (for testing)
  const resetAllTooltips = useCallback(() => {
    setSeenTooltips(new Set());
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NEW_USER_KEY);
    setIsNewUser(true);
  }, []);

  // Auto-show first tooltip for new users after delay
  useEffect(() => {
    if (isNewUser && !activeTooltipId) {
      const timer = setTimeout(() => {
        const first = getNextTooltip();
        if (first) {
          setActiveTooltipId(first.id);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, activeTooltipId, getNextTooltip]);

  return {
    activeTooltipId,
    seenTooltips,
    isNewUser,
    markAsSeen,
    showTooltip,
    dismissAndShowNext,
    shouldShowTooltip,
    getTooltipConfig,
    getAvailableTooltips,
    getNextTooltip,
    resetAllTooltips
  };
}
