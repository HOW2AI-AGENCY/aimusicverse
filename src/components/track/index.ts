/**
 * Track components - unified exports
 */

// Legacy components
export { UnifiedTrackCard } from './UnifiedTrackCard';
export { TrackCover } from './TrackCover';
export { TrackInfo } from './TrackInfo';
export { useTrackCardLogic } from './hooks/useTrackCardLogic';

// Variants
export * from './variants';

// Re-export DurationBadge for convenience
export { DurationBadge } from '@/components/library/shared/DurationBadge';
