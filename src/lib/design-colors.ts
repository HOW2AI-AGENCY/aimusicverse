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
    dot: 'bg-cyan-500',
    combined: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500',
  },
  verse: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    dot: 'bg-blue-500',
    combined: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
  },
  'pre-chorus': {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-500',
    dot: 'bg-indigo-500',
    combined: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
  },
  prechorus: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-500',
    dot: 'bg-indigo-500',
    combined: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500',
  },
  chorus: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-500',
    dot: 'bg-purple-500',
    combined: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  },
  hook: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-500',
    dot: 'bg-pink-500',
    combined: 'bg-pink-500/10 border-pink-500/30 text-pink-500',
  },
  bridge: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    dot: 'bg-amber-500',
    combined: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  },
  breakdown: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    dot: 'bg-orange-500',
    combined: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  },
  outro: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-500',
    dot: 'bg-rose-500',
    combined: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
  },
  instrumental: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-500',
    dot: 'bg-teal-500',
    combined: 'bg-teal-500/10 border-teal-500/30 text-teal-500',
  },
  interlude: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
    combined: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  },
  solo: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-500',
    dot: 'bg-violet-500',
    combined: 'bg-violet-500/10 border-violet-500/30 text-violet-500',
  },
  other: {
    bg: 'bg-muted/50',
    border: 'border-muted-foreground/30',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    combined: 'bg-muted/50 border-muted-foreground/30 text-muted-foreground',
  },
} as const;

export type SectionColorKey = keyof typeof sectionColors;

interface SectionColorValue {
  bg: string;
  border: string;
  text: string;
  dot: string;
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
// TAG CATEGORY COLORS
// ============================================================================

/**
 * Color tokens for tag categories (genre, mood, instrument, etc.)
 * Used in: ScrollableTagsRow, SimplifiedTagsRow, TagMenu
 */
export const tagColors = {
  genre: {
    bg: 'bg-primary/15',
    text: 'text-primary',
    hover: 'hover:bg-primary/25',
    combined: 'bg-primary/15 text-primary hover:bg-primary/25',
  },
  mood: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:bg-orange-500/25',
    combined: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25',
  },
  instrument: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:bg-blue-500/25',
    combined: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25',
  },
  vocal: {
    bg: 'bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    hover: 'hover:bg-pink-500/25',
    combined: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 hover:bg-pink-500/25',
  },
  tempo: {
    bg: 'bg-green-500/15',
    text: 'text-green-600 dark:text-green-400',
    hover: 'hover:bg-green-500/25',
    combined: 'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25',
  },
  structure: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:bg-purple-500/25',
    combined: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25',
  },
} as const;

export type TagColorKey = keyof typeof tagColors;

// ============================================================================
// HINT CATEGORY COLORS
// ============================================================================

/**
 * Color tokens for hint/tip categories
 * Used in: HintsSettings, FeatureHint
 */
export const hintColors = {
  model: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'ai-feature': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  project: 'bg-green-500/10 text-green-600 dark:text-green-400',
  artist: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  social: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  advanced: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  tip: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
} as const;

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
    solid: 'bg-green-500',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/30',
    solid: 'bg-yellow-500',
  },
  error: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    solid: 'bg-destructive',
  },
  info: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
    solid: 'bg-primary',
  },
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
    solid: 'bg-amber-500',
  },
} as const;

// ============================================================================
// EFFECT COLORS (Audio Processing)
// ============================================================================

/**
 * Color tokens for audio effects
 * Used in: EffectsIndicator, effect panels
 */
export const effectColors = {
  eq: 'bg-blue-500',
  compressor: 'bg-orange-500',
  reverb: 'bg-purple-500',
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

// ============================================================================
// ANALYSIS COLORS
// ============================================================================

/**
 * Color tokens for analysis sections
 * Used in: FullAnalysisResultCard
 */
export const analysisColors = {
  meaning: { 
    icon: 'text-blue-400', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30' 
  },
  rhythm: { 
    icon: 'text-orange-400', 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/30' 
  },
  rhymes: { 
    icon: 'text-cyan-400', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30' 
  },
  structure: { 
    icon: 'text-purple-400', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30' 
  },
} as const;

// ============================================================================
// EMOTIONAL MAP COLORS
// ============================================================================

/**
 * Color tokens for emotional quadrants
 * Used in: EmotionalMap
 */
export const emotionalColors = {
  happy: { bg: 'bg-green-500', text: 'text-green-700' },
  tense: { bg: 'bg-red-500', text: 'text-red-700' },
  calm: { bg: 'bg-blue-500', text: 'text-blue-700' },
  sad: { bg: 'bg-purple-500', text: 'text-purple-700' },
} as const;

// ============================================================================
// CHORD COLORS
// ============================================================================

/**
 * Color tokens for chord roots
 * Used in: ChordProgressionDisplay
 */
export const chordColors: Record<string, string> = {
  'C': 'bg-red-500/20 border-red-500/50 text-red-200',
  'D': 'bg-orange-500/20 border-orange-500/50 text-orange-200',
  'E': 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
  'F': 'bg-green-500/20 border-green-500/50 text-green-200',
  'G': 'bg-teal-500/20 border-teal-500/50 text-teal-200',
  'A': 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  'B': 'bg-purple-500/20 border-purple-500/50 text-purple-200',
} as const;

export function getChordColor(chord: string): string {
  const root = chord.charAt(0).toUpperCase();
  return chordColors[root] || 'bg-muted/50 border-border text-muted-foreground';
}
