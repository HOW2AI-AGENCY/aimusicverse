/**
 * Track components - unified exports
 * 
 * USE: UnifiedTrackCard from './track-card-new' for all track card needs
 */

// Primary export - UnifiedTrackCard v2
export { 
  UnifiedTrackCard,
  TrackCardNew,
} from './track-card-new';

export type {
  UnifiedTrackCardProps,
  StandardTrackCardProps,
  ProfessionalTrackCardProps,
  EnhancedTrackCardProps,
  TrackData,
  MidiStatus,
} from './track-card-new';

// Re-export components for convenience
export * from './track-card-new/components';
export * from './track-card-new/hooks';
export * from './track-card-new/variants';

// Shared components
export { TrackCover } from './TrackCover';
export { TrackInfo } from './TrackInfo';

// Re-export DurationBadge for convenience
export { DurationBadge } from '@/components/library/shared/DurationBadge';
