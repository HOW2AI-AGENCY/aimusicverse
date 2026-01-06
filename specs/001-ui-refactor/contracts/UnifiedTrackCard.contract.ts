/**
 * Contract: UnifiedTrackCard Component
 *
 * Consolidated track card component with variant support.
 * Replaces 5 duplicate track card implementations.
 */

import type { Track, PublicTrackWithCreator } from '@/types/track';

/**
 * Base props shared by all UnifiedTrackCard variants.
 */
interface BaseUnifiedTrackCardProps {
  /**
   * The track object to display.
   */
  track: Track | PublicTrackWithCreator;

  /**
   * Callback when the play button is clicked.
   */
  onPlay?: (track: Track | PublicTrackWithCreator) => void;

  /**
   * Callback when the delete button is clicked.
   */
  onDelete?: (trackId: string) => void;

  /**
   * Callback when the download button is clicked.
   */
  onDownload?: (trackId: string) => void;

  /**
   * Callback when a version switch occurs.
   */
  onVersionSwitch?: (versionId: string) => void;

  /**
   * Whether to show action buttons (like, share, more).
   * @default true
   */
  showActions?: boolean;

  /**
   * Additional CSS classes to apply.
   */
  className?: string;

  /**
   * Test ID for testing purposes.
   */
  testDataId?: string;
}

/**
 * Props for the 'enhanced' variant.
 * Shows additional social features (follow, share, add to playlist).
 */
interface EnhancedUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /**
   * Variant identifier.
   */
  variant: 'enhanced';

  /**
   * Callback when the remix button is clicked.
   */
  onRemix?: (trackId: string) => void;

  /**
   * Whether to show the follow button (for artist tracks).
   */
  showFollowButton?: boolean;

  /**
   * Callback when the follow button is clicked.
   */
  onFollow?: (userId: string) => void;

  /**
   * Callback when the share button is clicked.
   */
  onShare?: (trackId: string) => void;

  /**
   * Callback when "add to playlist" is clicked.
   */
  onAddToPlaylist?: (trackId: string) => void;
}

/**
 * Props for the 'professional' variant.
 * Shows MIDI/PDF status and version pills.
 */
interface ProfessionalUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /**
   * Variant identifier.
   */
  variant: 'professional';

  /**
   * MIDI/PDF/GP5 file availability status.
   */
  midiStatus?: {
    hasMidi: boolean;
    hasPdf: boolean;
    hasGp5: boolean;
  };

  /**
   * Whether to show version pills (A/B indicators).
   * @default true
   */
  showVersionPills?: boolean;
}

/**
 * Props for standard variants (grid, list, compact, minimal, default).
 */
interface StandardUnifiedTrackCardProps extends BaseUnifiedTrackCardProps {
  /**
   * Variant identifier.
   */
  variant: 'grid' | 'list' | 'compact' | 'minimal' | 'default';

  /**
   * Number of versions (for version switcher display).
   */
  versionCount?: number;

  /**
   * Number of stems (for stem indicator display).
   */
  stemCount?: number;

  /**
   * Index of the card in a list (for accessibility).
   */
  index?: number;

  /**
   * Alias for backward compatibility.
   * Maps 'grid' → variant='grid', 'list' → variant='list'
   */
  layout?: 'grid' | 'list';
}

/**
 * Discriminated union of all variant props.
 * TypeScript enforces that only one variant type can be used.
 */
export type UnifiedTrackCardProps =
  | EnhancedUnifiedTrackCardProps
  | ProfessionalUnifiedTrackCardProps
  | StandardUnifiedTrackCardProps;

/**
 * Variant configuration for internal use.
 */
export interface UnifiedTrackCardVariantConfig {
  /**
   * Visual layout (grid or list).
   */
  layout: 'grid' | 'list';

  /**
   * Whether to show the cover art image.
   */
  showCover: boolean;

  /**
   * Whether to show the track title.
   */
  showTitle: boolean;

  /**
   * Whether to show action buttons.
   */
  showActions: boolean;

  /**
   * Whether to show the version switcher (A/B).
   */
  showVersionToggle: boolean;

  /**
   * Whether to show the stem count indicator.
   */
  showStemCount: boolean;

  /**
   * Whether this is a compact variant.
   */
  compact: boolean;

  /**
   * Animation classes for different states.
   */
  animations: {
    /**
     * Initial animation (when card appears).
     */
    enter: string;

    /**
     * Hover animation (desktop only).
     */
    hover: string;

    /**
     * Tap/active animation (mobile).
     */
    tap: string;
  };
}

/**
 * Component contract for UnifiedTrackCard.
 *
 * @example
 * ```typescript
 * // Grid variant
 * <UnifiedTrackCard variant="grid" track={track} onPlay={handlePlay} />
 *
 * // List variant
 * <UnifiedTrackCard variant="list" track={track} />
 *
 * // Enhanced variant with social features
 * <UnifiedTrackCard
 *   variant="enhanced"
 *   track={track}
 *   onFollow={handleFollow}
 *   onShare={handleShare}
 * />
 *
 * // Professional variant with MIDI status
 * <UnifiedTrackCard
 *   variant="professional"
 *   track={track}
 *   midiStatus={{ hasMidi: true, hasPdf: false }}
 * />
 * ```
 */
export interface UnifiedTrackCardContract {
  /**
   * Component function.
   */
  (props: UnifiedTrackCardProps): JSX.Element;

  /**
   * Supported variants.
   */
  variants: readonly [
    'grid',
    'list',
    'compact',
    'minimal',
    'default',
    'enhanced',
    'professional'
  ];

  /**
   * Replaced components.
   */
  replaces: readonly [
    'TrackCard',
    'MinimalTrackCard',
    'PublicTrackCard',
    'TrackCardEnhanced',
    'UnifiedTrackCard (old version)'
  ];

  /**
   * Required hooks for this component.
   */
  dependencies: readonly [
    'useTrackCardLogic',
    'useTrackVersionSwitcher',
    'useRealtimeTrackUpdates',
    'useTrackActions'
  ];

  /**
   * Gesture support.
   */
  gestures: {
    /**
     * Swipe gestures for actions (like, delete).
     */
    swipe: boolean;

    /**
     * Double-tap to like.
     */
    doubleTap: boolean;

    /**
     * Long-press for context menu.
     */
    longPress: boolean;
  };

  /**
   * Accessibility requirements.
   */
  accessibility: {
    /**
     * Touch target size (44-56px minimum).
     */
    touchTargetSize: {
      min: number;
      max: number;
    };

    /**
     * ARIA labels required.
     */
    ariaLabels: readonly [
      'Play button',
      'Like button',
      'Share button',
      'More options button',
      'Version switcher'
    ];

    /**
     * Keyboard navigation support.
     */
    keyboardNavigation: readonly ['Enter', 'Space', 'Arrow keys'];
  };
}
