/**
 * UnifiedTrackCard Component Types
 *
 * Discriminated union for 7 variants (grid, list, compact, minimal, default, enhanced, professional)
 */

import type { Track, TrackWithCreator } from '@/types/track';

// ============================================================================
// Base Props (shared by all variants)
// ============================================================================

export interface BaseUnifiedTrackCardProps {
  /** The track object to display */
  track: Track | TrackWithCreator;

  /** Callback when the play button is clicked */
  onPlay?: (track: Track | TrackWithCreator) => void;

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
