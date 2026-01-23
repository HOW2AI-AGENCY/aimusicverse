/**
 * Design System Color Tokens
 * Feature: 032-professional-ui
 * 
 * Centralized color definitions for semantic UI elements.
 * All colors use semantic tokens from the design system.
 * 
 * IMPORTANT: These replace hardcoded color classes like:
 * - bg-red-500/10, text-red-500
 * - bg-gray-500/10, text-gray-400
 * 
 * Usage:
 * import { stemColors, sectionColors, rankColors } from '@/lib/design-colors';
 * className={stemColors.vocals.bg}
 */

// ============================================================================
// STEM COLORS (Audio Tracks)
// ============================================================================

/**
 * Color tokens for audio stem types
 * Used in: StemReferenceDialog, IntegratedStemTracks, StudioTrackRow, etc.
 */
export const stemColors = {
  vocals: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    gradient: 'from-primary/20 to-primary/5',
    combined: 'bg-primary/10 border-primary/30 text-primary',
  },
  drums: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    gradient: 'from-amber-500/20 to-amber-600/5',
    combined: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  },
  bass: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-500',
    gradient: 'from-violet-500/20 to-violet-600/5',
    combined: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
  },
  guitar: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    combined: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  },
  piano: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-600/5',
    combined: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  },
  strings: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-500',
    gradient: 'from-rose-500/20 to-rose-600/5',
    combined: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
  },
  synth: {
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-500',
    gradient: 'from-fuchsia-500/20 to-fuchsia-600/5',
    combined: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-500',
  },
  fx: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-500',
    gradient: 'from-teal-500/20 to-teal-600/5',
    combined: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  },
  instrumental: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-500',
    gradient: 'from-green-500/20 to-green-600/5',
    combined: 'bg-green-500/10 border-green-500/30 text-green-500',
  },
  melody: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-500',
    gradient: 'from-pink-500/20 to-pink-600/5',
    combined: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
  },
  atmosphere: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-500',
    gradient: 'from-sky-500/20 to-sky-600/5',
    combined: 'bg-sky-500/10 border-sky-500/30 text-sky-500',
  },
  other: {
    bg: 'bg-muted/50',
    border: 'border-muted-foreground/30',
    text: 'text-muted-foreground',
    gradient: 'from-muted/50 to-muted/20',
    combined: 'bg-muted/50 border-muted-foreground/30 text-muted-foreground',
  },
} as const;

export type StemColorKey = keyof typeof stemColors;

interface StemColorValue {
  bg: string;
  border: string;
  text: string;
  gradient: string;
  combined: string;
}

/**
 * Get stem color by type with fallback
 */
export function getStemColor(type: string): StemColorValue {
  const normalized = type.toLowerCase().replace(/[^a-z]/g, '');
  const colors = stemColors as Record<string, StemColorValue>;
  return colors[normalized] || stemColors.other;
}

// ============================================================================
// LYRICS SECTION COLORS
// ============================================================================

/**
 * Color tokens for lyrics sections
 * Used in: StructuredLyricsDisplay, LyricsEditor, etc.
 */
export const sectionColors = {
  intro: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-500',
    combined: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  },
  verse: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    combined: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  },
  'pre-chorus': {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-500',
    combined: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  },
  chorus: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    combined: 'bg-primary/10 border-primary/30 text-primary',
  },
  bridge: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    combined: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  },
  outro: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-500',
    combined: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
  },
  instrumental: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-500',
    combined: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  },
  solo: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    combined: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  },
  other: {
    bg: 'bg-muted/50',
    border: 'border-muted-foreground/30',
    text: 'text-muted-foreground',
    combined: 'bg-muted/50 border-muted-foreground/30 text-muted-foreground',
  },
} as const;

export type SectionColorKey = keyof typeof sectionColors;

interface SectionColorValue {
  bg: string;
  border: string;
  text: string;
  combined: string;
}

/**
 * Get section color by type with fallback
 */
export function getSectionColor(type: string): SectionColorValue {
  const normalized = type.toLowerCase().replace(/[^a-z-]/g, '');
  const colors = sectionColors as Record<string, SectionColorValue>;
  return colors[normalized] || sectionColors.other;
}

// ============================================================================
// RANK/LEADERBOARD COLORS
// ============================================================================

/**
 * Color tokens for leaderboard ranks
 * Used in: Leaderboard, LeaderboardWidget, Referral page
 */
export const rankColors = {
  gold: 'text-yellow-500',
  silver: 'text-muted-foreground',
  bronze: 'text-amber-600',
} as const;

export function getRankColor(rank: number): string {
  if (rank === 1) return rankColors.gold;
  if (rank === 2) return rankColors.silver;
  if (rank === 3) return rankColors.bronze;
  return 'text-muted-foreground';
}

// ============================================================================
// OVERLAY/GLASS COLORS
// ============================================================================

/**
 * Semantic overlay colors for glass effects
 * Replaces hardcoded bg-black/40, bg-black/60, etc.
 */
export const overlayColors = {
  /** Light overlay for cover image play buttons */
  light: 'bg-background/40 dark:bg-black/40',
  /** Medium overlay for badges on images */
  medium: 'bg-background/60 dark:bg-black/60',
  /** Heavy overlay for fullscreen backgrounds */
  heavy: 'bg-background/80 dark:bg-black/80',
  /** Backdrop blur overlay for modals */
  backdrop: 'bg-background/80 dark:bg-black/80 backdrop-blur-sm',
} as const;

// ============================================================================
// STATUS COLORS
// ============================================================================

/**
 * Semantic status colors
 */
export const statusColors = {
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/30',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/30',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
  info: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
} as const;

// ============================================================================
// VU METER COLORS (Audio Hardware UI)
// ============================================================================

/**
 * VU meter level colors
 */
export const vuMeterColors = {
  low: 'text-emerald-400',
  medium: 'text-yellow-400',
  high: 'text-destructive',
} as const;

export function getVuMeterColor(value: number): string {
  if (value > 0.9) return vuMeterColors.high;
  if (value > 0.7) return vuMeterColors.medium;
  return vuMeterColors.low;
}
