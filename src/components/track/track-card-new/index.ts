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
 */

// Main component
export { UnifiedTrackCard } from './UnifiedTrackCard';

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
