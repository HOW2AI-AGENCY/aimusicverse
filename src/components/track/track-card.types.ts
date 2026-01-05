/**
 * UnifiedTrackCard Component Types
 *
 * Per contracts/UnifiedTrackCard.contract.ts:
 * Discriminated union for 7 variants (grid, list, compact, minimal, default, enhanced, professional)
 */

import type { Track, PublicTrackWithCreator } from '@/types/track';

// ============================================================================
// Base Props (shared by all variants)
// ============================================================================

export interface BaseUnifiedTrackCardProps {
  /** The track object to display */
  track: Track | PublicTrackWithCreator;

  /** Callback when the play button is clicked */
  onPlay?: (track: Track | PublicTrackWithCreator) => void;

  /** Callback when the delete button is clicked */
  onDelete?: (trackId: string) => void;

  /** Callback when the download button is clicked */
  onDownload?: (trackId: string) => void;

  /** Callback when a version switch occurs */
  onVersionSwitch?: (versionId: string) => void;

  /** Whether to show action buttons (like, share, more) */
  showActions?: boolean;

  /** Additional CSS classes to apply */
  className?: string;

  /** Test ID for testing purposes */
  testDataId?: string;
}

// ============================================================================
// Enhanced Variant Props
// ============================================================================

export interface EnhancedUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /** Variant identifier */
  variant: 'enhanced';

  /** Callback when the remix button is clicked */
  onRemix?: (trackId: string) => void;

  /** Whether to show the follow button (for artist tracks) */
  showFollowButton?: boolean;

  /** Callback when the follow button is clicked */
  onFollow?: (userId: string) => void;

  /** Callback when the share button is clicked */
  onShare?: (trackId: string) => void;

  /** Callback when "add to playlist" is clicked */
  onAddToPlaylist?: (trackId: string) => void;
}

// ============================================================================
// Professional Variant Props
// ============================================================================

export interface MidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
}

export interface ProfessionalUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /** Variant identifier */
  variant: 'professional';

  /** MIDI/PDF/GP5 file availability status */
  midiStatus?: MidiStatus;

  /** Whether to show version pills (A/B indicators) */
  showVersionPills?: boolean;
}

// ============================================================================
// Standard Variant Props
// ============================================================================

export interface StandardUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /** Variant identifier */
  variant: 'grid' | 'list' | 'compact' | 'minimal' | 'default';

  /** Number of versions (for version switcher display) */
  versionCount?: number;

  /** Number of stems (for stem indicator display) */
  stemCount?: number;

  /** Index of the card in a list (for accessibility) */
  index?: number;

  /** Alias for backward compatibility */
  layout?: 'grid' | 'list';
}

// ============================================================================
// Discriminated Union
// ============================================================================

export type UnifiedTrackCardProps =
  | EnhancedUnifiedTrackCardProps
  | ProfessionalUnifiedTrackCardProps
  | StandardUnifiedTrackCardProps;

// ============================================================================
// Variant Configuration
// ============================================================================

export interface UnifiedTrackCardVariantConfig {
  /** Visual layout */
  layout: 'grid' | 'list';

  /** Whether to show the cover art image */
  showCover: boolean;

  /** Whether to show the track title */
  showTitle: boolean;

  /** Whether to show action buttons */
  showActions: boolean;

  /** Whether to show the version switcher (A/B) */
  showVersionToggle: boolean;

  /** Whether to show the stem count indicator */
  showStemCount: boolean;

  /** Whether this is a compact variant */
  compact: boolean;

  /** Animation classes for different states */
  animations: {
    /** Initial animation (when card appears) */
    enter: string;

    /** Hover animation (desktop only) */
    hover: string;

    /** Tap/active animation (mobile) */
    tap: string;
  };
}

// ============================================================================
// Gesture Handlers
// ============================================================================

export interface TrackCardGestures {
  /** Swipe right to like */
  onSwipeRight?: () => void;

  /** Swipe left to delete */
  onSwipeLeft?: () => void;

  /** Double tap to like */
  onDoubleTap?: () => void;

  /** Long press for context menu */
  onLongPress?: () => void;
}

// ============================================================================
// Internal State
// ============================================================================

export interface TrackCardState {
  /** Whether the card is currently being hovered */
  isHovered: boolean;

  /** Whether the card is currently being pressed */
  isPressed: boolean;

  /** Current animation state */
  animationState: 'idle' | 'entering' | 'exiting';

  /** Swipe offset in pixels */
  swipeOffset: number;

  /** Whether swipe is in progress */
  isSwiping: boolean;
}
