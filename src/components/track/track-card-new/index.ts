/**
 * Track Card New - Barrel Export
 * 
 * UnifiedTrackCard v2 with 7 variants:
 * - grid (default)
 * - list
 * - compact
 * - minimal
 * - professional
 * - enhanced
 * 
 * This is the NEW unified track card that replaces:
 * - TrackCard
 * - MinimalTrackCard
 * - PublicTrackCard
 * - TrackCardEnhanced
 * - Old UnifiedTrackCard
 */

// Main component - use this for all track card needs
export { UnifiedTrackCard } from './UnifiedTrackCard';

// Re-export as aliases for easier migration
export { UnifiedTrackCard as TrackCardNew } from './UnifiedTrackCard';

// Types
export type {
  UnifiedTrackCardProps,
  StandardTrackCardProps,
  ProfessionalTrackCardProps,
  EnhancedTrackCardProps,
  TrackData,
  MidiStatus,
} from './types';

// Variants (for direct use if needed)
export * from './variants';

// Reusable components
export * from './components';

// Hooks
export * from './hooks';
