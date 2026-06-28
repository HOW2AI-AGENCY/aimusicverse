/**
 * Genre & Mood → Lucide icon mapping
 * Replaces emoji usage across generation form / wizard / lyrics steps
 * Keeps a single source of truth so visuals stay consistent.
 */
import {
  Mic2,
  Guitar,
  Piano,
  Headphones,
  Heart,
  Music2,
  Moon,
  Zap,
  Cloud,
  Smile,
  Frown,
  Sparkles,
  Mountain,
  Wind,
  Drum,
  type LucideIcon,
} from "@/lib/icons";

export const GENRE_ICONS: Record<string, LucideIcon> = {
  pop: Mic2,
  rock: Guitar,
  electronic: Piano,
  hiphop: Headphones,
  "hip-hop": Headphones,
  rnb: Heart,
  jazz: Music2,
  classical: Music2,
  ambient: Moon,
};

export const MOOD_ICONS: Record<string, LucideIcon> = {
  energetic: Zap,
  chill: Wind,
  happy: Smile,
  sad: Frown,
  romantic: Heart,
  dark: Moon,
  epic: Mountain,
  dreamy: Sparkles,
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  rock: Guitar,
  pop: Mic2,
  electronic: Drum,
  jazz: Music2,
  classical: Music2,
  "hip-hop": Headphones,
};

export function getGenreIcon(id: string | null | undefined): LucideIcon {
  if (!id) return Music2;
  return GENRE_ICONS[id] ?? Music2;
}

export function getMoodIcon(id: string | null | undefined): LucideIcon {
  if (!id) return Sparkles;
  return MOOD_ICONS[id] ?? Sparkles;
}

export function getCategoryIcon(id: string | null | undefined): LucideIcon {
  if (!id) return Music2;
  return CATEGORY_ICONS[id] ?? Music2;
}
