/**
 * Track components - unified exports
 */

// New UnifiedTrackCard (refactored)
export { UnifiedTrackCard as UnifiedTrackCardNew } from './track-card';
export type { UnifiedTrackCardProps } from './track-card.types';

// Legacy components (deprecated)
export { UnifiedTrackCard } from './UnifiedTrackCard';
export { TrackCover } from './TrackCover';
export { TrackInfo } from './TrackInfo';
export { useTrackCardLogic } from './hooks/useTrackCardLogic';

// Re-export DurationBadge for convenience
export { DurationBadge } from '@/components/library/shared/DurationBadge';
