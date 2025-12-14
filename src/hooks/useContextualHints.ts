/**
 * Contextual Hints System
 *
 * Периодические всплывающие подсказки для пользователей о возможностях платформы:
 * - Смена моделей AI
 * - AI функции (Lyrics Wizard, AI Artists, Audio Analysis)
 * - Проекты и планирование
 * - Социальные функции
 * - Продвинутые настройки
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export type HintCategory =
  | "model" // Напоминание о моделях AI
  | "ai-feature" // AI функции
  | "project" // Проекты
  | "artist" // AI артисты
  | "social" // Социальные функции
  | "advanced" // Продвинутые настройки
  | "tip"; // Общие советы

export interface ContextualHint {
  id: string;
  category: HintCategory;
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    route?: string;
  };
  // Условия показа
  showOnRoutes?: string[]; // На каких страницах показывать
  minVisits?: number; // Минимальное количество посещений перед показом
  cooldownHours?: number; // Минимальный интервал между показами (в часах)
  maxShows?: number; // Максимальное количество показов
  priority?: number; // Приоритет (больше = выше)
}

// Определение всех подсказок
export const CONTEXTUAL_HINTS: ContextualHint[] = [
  // Beta notice - highest priority
  {
    id: "beta-active-development",
    category: "tip",
    title: "⚡ Платформа в активной разработке",
    description:
      "Мы постоянно улучшаем MusicVerse AI! Некоторые функции могут работать нестабильно. Спасибо за ваше терпение и обратную связь — вы помогаете нам стать лучше!",
    showOnRoutes: ["/", "/library", "/generate", "/projects", "/community"],
    minVisits: 1,
    cooldownHours: 168, // 7 дней
    maxShows: 5,
    priority: 11, // Highest priority
  },
  // Model hints
  {
    id: "model-v5-available",
    category: "model",
    title: "🚀 Попробуйте новую модель V5!",
    description:
      "Suno V5 доступна для генерации! Она быстрее и создает более качественный звук. Откройте расширенные настройки при создании трека.",
    action: {
      label: "Создать трек",
      route: "/?generate=true",
    },
    showOnRoutes: ["/", "/library"],
    minVisits: 2,
    cooldownHours: 72, // 3 дня
    maxShows: 3,
    priority: 9,
  },
  {
    id: "model-selection-tip",
    category: "model",
    title: "💎 Выбор модели AI",
    description:
      "Разные модели подходят для разных задач: V5 для скорости, V4.5+ для богатого звука до 8 минут. Меняйте модель в Advanced Options.",
    showOnRoutes: ["/", "/library"],
    minVisits: 5,
    cooldownHours: 168, // 7 дней
    maxShows: 2,
    priority: 7,
  },

  // AI Features
  {
    id: "lyrics-wizard-intro",
    category: "ai-feature",
    title: "🎤 AI Lyrics Wizard",
    description:
      "Создавайте профессиональные тексты песен с помощью AI! Помощник сам определит структуру, добавит теги и предложит улучшения. 18 быстрых действий для творчества!",
    action: {
      label: "Попробовать",
      route: "/?generate=true",
    },
    showOnRoutes: ["/", "/library"],
    minVisits: 1,
    cooldownHours: 48,
    maxShows: 2,
    priority: 10,
  },
  {
    id: "audio-analysis-feature",
    category: "ai-feature",
    title: "🎵 Анализ музыки с AI",
    description:
      "Загрузите свою музыку для AI-анализа: определение аккордов, темпа, структуры композиции. Идеально для кавер-версий и ремиксов!",
    showOnRoutes: ["/library", "/studio"],
    minVisits: 3,
    cooldownHours: 96,
    maxShows: 2,
    priority: 8,
  },
  {
    id: "stem-separation-feature",
    category: "ai-feature",
    title: "🎛️ Разделение на стемы",
    description:
      "Разделите любой трек на отдельные дорожки: вокал, инструменты, бас, барабаны. Создавайте ремиксы и караоке версии!",
    action: {
      label: "Открыть Studio",
      route: "/stem-studio",
    },
    showOnRoutes: ["/library", "/"],
    minVisits: 4,
    cooldownHours: 120,
    maxShows: 2,
    priority: 8,
  },

  // AI Artists
  {
    id: "ai-artists-intro",
    category: "artist",
    title: "👤 Создайте AI Артиста",
    description:
      "AI артисты помогают создавать треки в узнаваемом стиле. Определите жанр, голос, визуальный стиль — и создавайте целые дискографии!",
    action: {
      label: "Создать артиста",
      route: "/artists",
    },
    showOnRoutes: ["/", "/library", "/artists"],
    minVisits: 2,
    cooldownHours: 72,
    maxShows: 3,
    priority: 9,
  },
  {
    id: "artists-from-track",
    category: "artist",
    title: "✨ Артист из трека",
    description:
      'Понравился стиль трека? Создайте AI артиста на его основе! Откройте меню трека → "Создать артиста из трека".',
    showOnRoutes: ["/library", "/"],
    minVisits: 5,
    cooldownHours: 96,
    maxShows: 2,
    priority: 7,
  },

  // Projects
  {
    id: "projects-planning",
    category: "project",
    title: "📁 Планирование альбома",
    description:
      "Создайте проект и распишите план треков с описанием каждого. AI поможет генерировать треки по очереди с учетом общей концепции альбома!",
    action: {
      label: "Создать проект",
      route: "/projects",
    },
    showOnRoutes: ["/", "/library"],
    minVisits: 3,
    cooldownHours: 96,
    maxShows: 3,
    priority: 8,
  },
  {
    id: "project-ai-actions",
    category: "project",
    title: "🤖 AI действия в проекте",
    description:
      "В проектах доступны AI действия: генерация обложки, создание описания, анализ треклиста. Используйте AI для полного цикла работы над альбомом!",
    showOnRoutes: ["/projects"],
    minVisits: 2,
    cooldownHours: 120,
    maxShows: 2,
    priority: 7,
  },

  // Social Features
  {
    id: "social-share",
    category: "social",
    title: "📤 Делитесь музыкой",
    description:
      "Публикуйте треки в сообществе, делитесь в Telegram Stories или отправляйте друзьям. Получайте лайки и комментарии!",
    showOnRoutes: ["/library", "/"],
    minVisits: 4,
    cooldownHours: 96,
    maxShows: 2,
    priority: 6,
  },
  {
    id: "playlists-feature",
    category: "social",
    title: "🎧 Создавайте плейлисты",
    description: "Собирайте треки в плейлисты, делитесь ими с друзьями. AI сгенерирует обложку для вашего плейлиста!",
    showOnRoutes: ["/library", "/"],
    minVisits: 5,
    cooldownHours: 120,
    maxShows: 2,
    priority: 6,
  },
  {
    id: "community-discover",
    category: "social",
    title: "🌍 Откройте сообщество",
    description: "Изучайте публичные треки других пользователей, находите вдохновение и делитесь своими работами!",
    action: {
      label: "В сообщество",
      route: "/community",
    },
    showOnRoutes: ["/", "/library"],
    minVisits: 3,
    cooldownHours: 96,
    maxShows: 2,
    priority: 7,
  },

  // Advanced Tips
  {
    id: "advanced-settings",
    category: "advanced",
    title: "⚙️ Продвинутые настройки",
    description:
      "В форме генерации доступны продвинутые настройки: референс аудио, вес стиля, negative tags, пол вокала. Экспериментируйте для точного результата!",
    showOnRoutes: ["/", "/library"],
    minVisits: 6,
    cooldownHours: 144,
    maxShows: 2,
    priority: 7,
  },
  {
    id: "quick-presets",
    category: "tip",
    title: "🎨 Быстрые пресеты",
    description:
      "Используйте готовые пресеты для быстрого старта! В форме генерации есть популярные стили: Pop, Rock, Hip-Hop и другие.",
    showOnRoutes: ["/"],
    minVisits: 2,
    cooldownHours: 96,
    maxShows: 2,
    priority: 7,
  },
  {
    id: "audio-reference-tip",
    category: "advanced",
    title: "🎧 Референс аудио",
    description:
      "Загрузите референс трек, чтобы AI создал музыку в похожем стиле! Это работает для голоса, мелодии и общего звучания.",
    showOnRoutes: ["/"],
    minVisits: 4,
    cooldownHours: 120,
    maxShows: 2,
    priority: 8,
  },
  {
    id: "keyboard-shortcuts",
    category: "tip",
    title: "⌨️ Горячие клавиши",
    description:
      'Используйте Space для паузы/воспроизведения, ← → для перемотки. Открывайте список горячих клавиш через "?" в плеере.',
    showOnRoutes: ["/library", "/"],
    minVisits: 7,
    cooldownHours: 168,
    maxShows: 1,
    priority: 5,
  },
  {
    id: "daily-rewards",
    category: "tip",
    title: "💎 Ежедневные бонусы",
    description:
      "Заходите каждый день, чтобы получать кредиты! Непрерывная серия посещений увеличивает награду. Смотрите прогресс в виджете геймификации.",
    showOnRoutes: ["/", "/library"],
    minVisits: 2,
    cooldownHours: 48,
    maxShows: 3,
    priority: 8,
  },
  {
    id: "version-comparison",
    category: "tip",
    title: "🔄 A/B версии",
    description:
      "Каждая генерация создает 2 версии трека (A и B). Сравнивайте их и выбирайте лучшую! Переключайте версии через значок A/B.",
    showOnRoutes: ["/library"],
    minVisits: 3,
    cooldownHours: 96,
    maxShows: 2,
    priority: 7,
  },
];

interface HintState {
  lastShown: number; // timestamp
  showCount: number; // сколько раз показано
  dismissed: boolean; // отклонена навсегда
}

const STORAGE_KEY = "musicverse-contextual-hints";
const VISITS_KEY = "musicverse-visit-count";

export function useContextualHints(currentRoute?: string) {
  const [hintStates, setHintStates] = useState<Record<string, HintState>>({});
  const [visitCount, setVisitCount] = useState(0);
  const [currentHint, setCurrentHint] = useState<ContextualHint | null>(null);

  // Load state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHintStates(JSON.parse(stored));
      }

      const visits = localStorage.getItem(VISITS_KEY);
      const count = visits ? parseInt(visits, 10) : 0;
      setVisitCount(count);

      // Increment visit count only once per session (check last visit timestamp)
      const lastVisitKey = "musicverse-last-visit";
      const lastVisit = localStorage.getItem(lastVisitKey);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Validate lastVisit is a number
      const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;
      const isValidTime = !isNaN(lastVisitTime) && lastVisitTime > 0;

      if (!isValidTime || now - lastVisitTime > fiveMinutes) {
        const newCount = count + 1;
        setVisitCount(newCount);
        localStorage.setItem(VISITS_KEY, newCount.toString());
        localStorage.setItem(lastVisitKey, now.toString());
      }
    } catch (e) {
      console.error("Failed to load hint states:", e);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((states: Record<string, HintState>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch (e) {
      console.error("Failed to save hint states:", e);
    }
  }, []);

  // Check if hint can be shown
  const canShowHint = useCallback(
    (hint: ContextualHint): boolean => {
      const state = hintStates[hint.id];

      // Check if dismissed forever
      if (state?.dismissed) {
        return false;
      }

      // Check max shows
      if (hint.maxShows && state?.showCount >= hint.maxShows) {
        return false;
      }

      // Check min visits
      if (hint.minVisits && visitCount < hint.minVisits) {
        return false;
      }

      // Check cooldown
      if (hint.cooldownHours && state?.lastShown) {
        const hoursSinceLastShow = (Date.now() - state.lastShown) / (1000 * 60 * 60);
        if (hoursSinceLastShow < hint.cooldownHours) {
          return false;
        }
      }

      // Check route (exact match or starts with route + /)
      // Ensures '/lib' doesn't match '/library'
      if (hint.showOnRoutes && currentRoute) {
        const matches = hint.showOnRoutes.some((route) => {
          // Exact match
          if (currentRoute === route) return true;
          // Sub-route match (must have / after route)
          if (currentRoute.startsWith(route + "/")) return true;
          return false;
        });
        if (!matches) {
          return false;
        }
      }

      return true;
    },
    [hintStates, visitCount, currentRoute],
  );

  // Get next hint to show
  const getNextHint = useCallback((): ContextualHint | null => {
    const availableHints = CONTEXTUAL_HINTS.filter(canShowHint).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return availableHints[0] || null;
  }, [canShowHint]);

  // Show hint
  const showHint = useCallback(
    (hint: ContextualHint) => {
      setCurrentHint(hint);

      // Update state
      const state = hintStates[hint.id] || { lastShown: 0, showCount: 0, dismissed: false };
      const updatedStates = {
        ...hintStates,
        [hint.id]: {
          ...state,
          lastShown: Date.now(),
          showCount: state.showCount + 1,
        },
      };
      setHintStates(updatedStates);
      saveState(updatedStates);
    },
    [hintStates, saveState],
  );

  // Dismiss current hint
  const dismissHint = useCallback(
    (forever: boolean = false) => {
      if (!currentHint) return;

      const currentState = hintStates[currentHint.id] || { lastShown: 0, showCount: 0, dismissed: false };
      const updatedStates = {
        ...hintStates,
        [currentHint.id]: {
          ...currentState,
          dismissed: forever,
          // Update lastShown only for temporary dismissal to trigger cooldown
          // Permanent dismissal doesn't need lastShown update since dismissed flag prevents reappearance
          lastShown: forever ? currentState.lastShown : Date.now(),
        },
      };
      setHintStates(updatedStates);
      saveState(updatedStates);

      setCurrentHint(null);
    },
    [currentHint, hintStates, saveState],
  );

  // Auto-show hint on route change (with delay)
  useEffect(() => {
    if (currentHint) return; // Don't show if already showing

    const timer = setTimeout(() => {
      const nextHint = getNextHint();
      if (nextHint) {
        showHint(nextHint);
      }
    }, 5000); // 5 seconds delay

    return () => clearTimeout(timer);
  }, [currentRoute, currentHint, getNextHint, showHint]);

  // Get all available hints for testing/debugging
  const availableHints = useMemo(() => {
    return CONTEXTUAL_HINTS.filter(canShowHint);
  }, [canShowHint]);

  // Reset all hints (for testing)
  const resetAllHints = useCallback(() => {
    setHintStates({});
    setVisitCount(0);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VISITS_KEY);
    setCurrentHint(null);
  }, []);

  return {
    currentHint,
    availableHints,
    visitCount,
    showHint,
    dismissHint,
    canShowHint,
    getNextHint,
    resetAllHints,
  };
}
