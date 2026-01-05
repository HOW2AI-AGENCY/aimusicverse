/**
 * Track components - unified exports
 * 
 * MIGRATION GUIDE:
 * - Use UnifiedTrackCard from './track-card-new' for all new code
 * - Legacy UnifiedTrackCard from './UnifiedTrackCard' is deprecated
 */

// NEW: Unified Track Card v2 - USE THIS
export { 
  UnifiedTrackCard as UnifiedTrackCardNew,
  TrackCardNew,
} from './track-card-new';
export type {
  UnifiedTrackCardProps as UnifiedTrackCardNewProps,
  StandardTrackCardProps,
  ProfessionalTrackCardProps,
  EnhancedTrackCardProps,
} from './track-card-new';

// Legacy components (deprecated - will be removed)
export { UnifiedTrackCard } from './UnifiedTrackCard';
export { TrackCover } from './TrackCover';
export { TrackInfo } from './TrackInfo';
export { useTrackCardLogic } from './hooks/useTrackCardLogic';

// Variants
export * from './variants';

// Re-export DurationBadge for convenience
export { DurationBadge } from '@/components/library/shared/DurationBadge';
