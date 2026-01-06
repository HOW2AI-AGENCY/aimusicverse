/**
 * UnifiedTrackCard v2 - Type definitions
 * 
 * Discriminated union types for all 7 variants:
 * - grid: Standard grid card with cover
 * - list: Horizontal list row
 * - compact: Compact list row (minimal info)
 * - minimal: Ultra-compact for quick lists
 * - professional: Modern glassmorphism design
 * - enhanced: Rich card with social features
 * - default: Alias for grid
 */

import type { Track, TrackWithCreator } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

// ============================================================================
// Track Type (supports all formats)
// ============================================================================

export type TrackData = Track | TrackWithCreator | PublicTrackWithCreator;

// ============================================================================
// MIDI Status
// ============================================================================

export interface MidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
}

// ============================================================================
// Base Props (shared by all variants)
// ============================================================================

export interface BaseTrackCardProps {
  /** The track object to display */
  track: TrackData;

  /** Callback when play button is clicked */
  onPlay?: () => void;

  /** Callback when delete is triggered */
  onDelete?: () => void;

  /** Callback when download is triggered */
  onDownload?: () => void;

  /** Whether the track is currently playing */
  isPlaying?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Animation delay index for stagger */
  index?: number;

  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Standard Variants (grid, list, compact, minimal, default)
// ============================================================================

export interface StandardTrackCardProps extends BaseTrackCardProps {
  variant?: 'grid' | 'list' | 'compact' | 'minimal' | 'default';

  /** Number of versions for version switcher */
  versionCount?: number;

  /** Number of stems */
  stemCount?: number;

  /** MIDI/PDF/GP5 status */
  midiStatus?: MidiStatus;

  /** Callback for version switch */
  onVersionSwitch?: (versionId: string) => void;

  /** Callback for like toggle */
  onToggleLike?: () => void;

  /** Callback for tag click */
  onTagClick?: (tag: string) => void;

  /** Whether to show action menu */
  showActions?: boolean;

  /** Is first swipeable item (for onboarding) */
  isFirstSwipeableItem?: boolean;
}

// ============================================================================
// Professional Variant
// ============================================================================

export interface ProfessionalTrackCardProps extends BaseTrackCardProps {
  variant: 'professional';

  /** Number of versions */
  versionCount?: number;

  /** Number of stems */
  stemCount?: number;

  /** MIDI/PDF/GP5 status */
  midiStatus?: MidiStatus;

  /** Callback for version switch */
  onVersionSwitch?: (versionId: string) => void;

  /** Whether to show action menu */
  showActions?: boolean;
}

// ============================================================================
// Enhanced Variant (social features)
// ============================================================================

export interface EnhancedTrackCardProps extends BaseTrackCardProps {
  variant: 'enhanced';

  /** Track must be PublicTrackWithCreator for enhanced features */
  track: PublicTrackWithCreator;

  /** Callback when remix button is clicked */
  onRemix?: (trackId: string) => void;

  /** Whether to show follow button */
  showFollowButton?: boolean;

  /** Callback when follow is triggered */
  onFollow?: (userId: string) => void;

  /** Callback when share is triggered */
  onShare?: (trackId: string) => void;

  /** Callback when add to playlist is triggered */
  onAddToPlaylist?: (trackId: string) => void;

  /** Compact mode (less padding) */
  compact?: boolean;
}

// ============================================================================
// Discriminated Union
// ============================================================================

export type UnifiedTrackCardProps =
  | StandardTrackCardProps
  | ProfessionalTrackCardProps
  | EnhancedTrackCardProps;

// ============================================================================
// Variant Config (for internal use)
// ============================================================================

export interface TrackCardVariantConfig {
  showCover: boolean;
  showTitle: boolean;
  showStyle: boolean;
  showDuration: boolean;
  showVersionToggle: boolean;
  showStemCount: boolean;
  showMidiStatus: boolean;
  showTypeIcons: boolean;
  showActions: boolean;
  showCreator: boolean;
  showLikeButton: boolean;
  enableSwipe: boolean;
  coverSize: 'xs' | 'sm' | 'md' | 'lg';
  layout: 'grid' | 'horizontal';
}

export const VARIANT_CONFIGS: Record<string, TrackCardVariantConfig> = {
  grid: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: true,
    showStemCount: true,
    showMidiStatus: true,
    showTypeIcons: true,
    showActions: true,
    showCreator: false,
    showLikeButton: true,
    enableSwipe: true,
    coverSize: 'lg',
    layout: 'grid',
  },
  list: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: true,
    showStemCount: true,
    showMidiStatus: true,
    showTypeIcons: true,
    showActions: true,
    showCreator: false,
    showLikeButton: false,
    enableSwipe: true,
    coverSize: 'md',
    layout: 'horizontal',
  },
  compact: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: false,
    showStemCount: false,
    showMidiStatus: false,
    showTypeIcons: false,
    showActions: true,
    showCreator: false,
    showLikeButton: false,
    enableSwipe: false,
    coverSize: 'sm',
    layout: 'horizontal',
  },
  minimal: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: true,
    showStemCount: true,
    showMidiStatus: false,
    showTypeIcons: true,
    showActions: true,
    showCreator: false,
    showLikeButton: false,
    enableSwipe: false,
    coverSize: 'xs',
    layout: 'horizontal',
  },
  professional: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: true,
    showStemCount: true,
    showMidiStatus: true,
    showTypeIcons: true,
    showActions: true,
    showCreator: false,
    showLikeButton: false,
    enableSwipe: false,
    coverSize: 'sm',
    layout: 'horizontal',
  },
  enhanced: {
    showCover: true,
    showTitle: true,
    showStyle: false,
    showDuration: false,
    showVersionToggle: false,
    showStemCount: false,
    showMidiStatus: false,
    showTypeIcons: false,
    showActions: false,
    showCreator: true,
    showLikeButton: true,
    enableSwipe: false,
    coverSize: 'lg',
    layout: 'grid',
  },
  default: {
    showCover: true,
    showTitle: true,
    showStyle: true,
    showDuration: true,
    showVersionToggle: true,
    showStemCount: true,
    showMidiStatus: true,
    showTypeIcons: true,
    showActions: true,
    showCreator: false,
    showLikeButton: true,
    enableSwipe: true,
    coverSize: 'lg',
    layout: 'grid',
  },
};
