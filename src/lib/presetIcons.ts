/**
 * Preset → Lucide icon mapping.
 * Replaces emoji placeholders on quick-start cards with consistent icons.
 */
import {
  Mic2,
  Headphones,
  Guitar,
  Piano,
  Music2,
  Flame,
  Moon,
  Heart,
  Sparkles,
  BookOpen,
  PartyPopper,
  Sun,
  Film,
  Radio,
  Mic,
  Drum,
  Zap,
  type LucideIcon,
} from "@/lib/icons";

// Track presets (genre chips/cards on home)
export const TRACK_PRESET_ICONS: Record<string, LucideIcon> = {
  pop: Mic2,
  lofi: Headphones,
  rock: Guitar,
  electro: Piano,
  rnb: Music2,
  hiphop: Flame,
  jazz: Music2,
  ambient: Moon,
};

export function getTrackPresetIcon(id: string): LucideIcon {
  return TRACK_PRESET_ICONS[id] ?? Music2;
}

// Lyrics presets
export const LYRICS_PRESET_ICONS: Record<string, LucideIcon> = {
  "love-ballad": Heart,
  "drill-banger": Flame,
  "lofi-vibes": Moon,
  "party-anthem": PartyPopper,
  storytelling: BookOpen,
  "emotional-pop": Heart,
  motivational: Zap,
  "summer-hit": Sun,
};

export function getLyricsPresetIcon(id: string): LucideIcon {
  return LYRICS_PRESET_ICONS[id] ?? Sparkles;
}

// Project presets — kept in sync with src/constants/projectPresets.ts
export const PROJECT_PRESET_ICONS: Record<string, LucideIcon> = {
  "drill-ep": Flame,
  "lofi-album": Headphones,
  "pop-single": Mic,
  "ost-collection": Film,
  "hiphop-mixtape": Mic2,
  "electronic-ep": Radio,
};

export function getProjectPresetIconById(id: string): LucideIcon {
  return PROJECT_PRESET_ICONS[id] ?? Drum;
}
