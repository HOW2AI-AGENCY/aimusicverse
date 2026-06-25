/**
 * Application Configuration
 * Central configuration for app version, feature flags, and beta settings
 */

export const APP_CONFIG = {
  // Version info
  version: "1.0.0-beta",
  versionName: "Beta",
  buildDate: "2025-12-23",

  // Beta settings
  beta: {
    enabled: true,
    feedbackUrl: "https://t.me/musicverse_support",
  },

  // Feature flags for beta
  features: {
    // Fully implemented features
    musicGeneration: true,
    stemSeparation: true,
    guitarStudio: true,
    lyricsStudio: true,
    vocalRecording: true,
    gamification: true,
    socialFeatures: true,

    // Coming soon / Partially implemented
    midiTranscription: false, // Coming soon
    advancedMastering: false, // Coming soon
    aiMixing: false, // Coming soon
    cloudCollaboration: false, // Coming soon
    mobileRecording: false, // Coming soon
    liveStreaming: false, // Coming soon
  },

  // Performance settings
  performance: {
    lazyLoadImages: true,
    prefetchRoutes: true,
    cacheAudio: true,
    reducedMotionRespect: true,
  },

  // Analytics & Monitoring
  monitoring: {
    sentryEnabled: !!import.meta.env.VITE_SENTRY_DSN,
    loggingLevel: import.meta.env.MODE === "production" ? "warn" : "debug",
  },
} as const;

export type FeatureKey = keyof typeof APP_CONFIG.features;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return APP_CONFIG.features[feature] ?? false;
}

/**
 * Get coming soon features list
 */
export function getComingSoonFeatures(): FeatureKey[] {
  return (Object.entries(APP_CONFIG.features) as [FeatureKey, boolean][])
    .filter(([, enabled]) => !enabled)
    .map(([key]) => key);
}

/**
 * Feature metadata for UI display
 */
export const FEATURE_METADATA: Record<FeatureKey, { name: string; description: string; icon?: string }> = {
  musicGeneration: {
    name: "Генерация музыки",
    description: "AI создаёт уникальные треки по вашему описанию",
    icon: "🎵",
  },
  stemSeparation: {
    name: "Разделение на стемы",
    description: "Разделите любой трек на отдельные инструменты",
    icon: "🎚️",
  },
  guitarStudio: {
    name: "Гитарная студия",
    description: "Анализ и транскрипция гитарных партий",
    icon: "🎸",
  },
  lyricsStudio: {
    name: "Студия текстов",
    description: "AI-помощник для написания текстов песен",
    icon: "📝",
  },
  vocalRecording: {
    name: "Запись вокала",
    description: "Записывайте вокал прямо в приложении",
    icon: "🎤",
  },
  gamification: {
    name: "Геймификация",
    description: "Достижения, уровни и награды",
    icon: "🏆",
  },
  socialFeatures: {
    name: "Социальные функции",
    description: "Подписки, лайки и комментарии",
    icon: "👥",
  },
  midiTranscription: {
    name: "MIDI транскрипция",
    description: "Конвертация аудио в MIDI-формат",
    icon: "🎹",
  },
  advancedMastering: {
    name: "Мастеринг",
    description: "Профессиональная обработка треков",
    icon: "🔊",
  },
  aiMixing: {
    name: "AI Микширование",
    description: "Автоматическое сведение треков",
    icon: "🎛️",
  },
  cloudCollaboration: {
    name: "Облачная коллаборация",
    description: "Совместная работа над проектами",
    icon: "☁️",
  },
  mobileRecording: {
    name: "Мобильная запись",
    description: "Профессиональная запись с телефона",
    icon: "📱",
  },
  liveStreaming: {
    name: "Прямые трансляции",
    description: "Стримы и живые выступления",
    icon: "📺",
  },
};
