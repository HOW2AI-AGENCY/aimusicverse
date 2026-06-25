/**
 * Chat-specific constants and context helpers.
 * Uses unified constants from @/lib/lyrics/constants for GENRES, MOODS, STRUCTURES.
 */

import type { QuickOption, ProjectContext, TrackContext } from "./types";

// Re-export from unified constants for backwards compatibility
export {
  GENRES,
  MOODS,
  STRUCTURES,
  STRUCTURE_MAP,
  SECTION_TYPES,
  DYNAMIC_TAGS,
  EMOTIONAL_CUES,
  messageVariants,
  buttonVariants,
  badgeVariants,
} from "@/lib/lyrics/constants";

// VOCAL_STYLE_TAGS is now in @/constants/sunoMetaTags.ts with full metadata
export { VOCAL_STYLE_TAGS } from "@/constants/sunoMetaTags";

// ==================== CHAT-SPECIFIC CONSTANTS ====================

export const INITIAL_MESSAGE_OPTIONS: QuickOption[] = [
  { label: "💕 Любовь", value: "Песня о любви и отношениях", action: "setTheme" },
  { label: "✨ Мечты", value: "Песня о погоне за мечтой", action: "setTheme" },
  { label: "🌃 Ночной город", value: "Песня о ночном городе", action: "setTheme" },
  { label: "🦋 Свобода", value: "Песня о свободе", action: "setTheme" },
  { label: "💔 Расставание", value: "Песня о расставании и боли", action: "setTheme" },
  { label: "🚀 Успех", value: "Песня о пути к успеху", action: "setTheme" },
];

// Genre-specific theme suggestions
export const GENRE_THEME_MAP: Record<string, QuickOption[]> = {
  pop: [
    { label: "💕 Любовь", value: "Песня о современной любви", action: "setTheme" },
    { label: "💃 Танцы", value: "Песня для танцпола", action: "setTheme" },
    { label: "🌟 Звёзды", value: "Песня о славе и успехе", action: "setTheme" },
  ],
  rock: [
    { label: "🔥 Бунт", value: "Песня о бунте и свободе", action: "setTheme" },
    { label: "🛣️ Дорога", value: "Песня о путешествии", action: "setTheme" },
    { label: "⚡ Энергия", value: "Песня о силе и энергии", action: "setTheme" },
  ],
  "hip-hop": [
    { label: "💰 Успех", value: "Песня о пути наверх", action: "setTheme" },
    { label: "🏙️ Улицы", value: "Песня о городской жизни", action: "setTheme" },
    { label: "👑 Корона", value: "Песня о достижениях", action: "setTheme" },
  ],
  electronic: [
    { label: "🌌 Космос", value: "Песня о космосе и будущем", action: "setTheme" },
    { label: "🌃 Неон", value: "Песня о ночном городе", action: "setTheme" },
    { label: "💫 Эйфория", value: "Песня об эйфории", action: "setTheme" },
  ],
  indie: [
    { label: "🍂 Осень", value: "Песня об осенней меланхолии", action: "setTheme" },
    { label: "📷 Воспоминания", value: "Песня о воспоминаниях", action: "setTheme" },
    { label: "🌙 Ночь", value: "Песня о ночных размышлениях", action: "setTheme" },
  ],
  folk: [
    { label: "🏔️ Природа", value: "Песня о природе и гармонии", action: "setTheme" },
    { label: "📜 История", value: "Песня-история", action: "setTheme" },
    { label: "🏠 Дом", value: "Песня о родном доме", action: "setTheme" },
  ],
};

// Dynamic context-based options generator
export function getContextualOptions(projectContext?: ProjectContext, trackContext?: TrackContext): QuickOption[] {
  const options: QuickOption[] = [];

  // Genre-specific themes
  if (projectContext?.genre && GENRE_THEME_MAP[projectContext.genre]) {
    options.push(...GENRE_THEME_MAP[projectContext.genre].slice(0, 2));
  }

  // Continuation option if there are existing tracks
  if (projectContext?.existingTracks && projectContext.existingTracks.length > 0) {
    const lastTrack = projectContext.existingTracks[projectContext.existingTracks.length - 1];
    options.push({
      label: `📎 Связать с "${lastTrack.title.slice(0, 15)}..."`,
      value: `Продолжение темы трека "${lastTrack.title}"`,
      action: "useContext",
    });
  }

  // Tag-based option
  if (trackContext?.recommendedTags && trackContext.recommendedTags.length > 0) {
    options.push({
      label: `🏷️ ${trackContext.recommendedTags.slice(0, 2).join(", ")}`,
      value: `Песня в стиле: ${trackContext.recommendedTags.join(", ")}`,
      action: "useContext",
    });
  }

  // Project concept option
  if (projectContext?.concept) {
    options.push({
      label: "📚 По концепции проекта",
      value: `Песня в рамках концепции: ${projectContext.concept}`,
      action: "useContext",
    });
  }

  // Fill with defaults if not enough options
  if (options.length < 3) {
    const defaults = INITIAL_MESSAGE_OPTIONS.filter((opt) => !options.some((o) => o.value === opt.value));
    options.push(...defaults.slice(0, 3 - options.length));
  }

  return options.slice(0, 4);
}
