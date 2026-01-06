/**
 * UnifiedTrackCard v2 - Single unified track card with 7 variants
 * 
 * Replaces:
 * - TrackCard
 * - MinimalTrackCard
 * - PublicTrackCard
 * - TrackCardEnhanced
 * - Old UnifiedTrackCard
 */

import { memo } from 'react';
import {
  GridVariant,
  ListVariant,
  CompactVariant,
  MinimalVariant,
  ProfessionalVariant,
  EnhancedVariant,
} from './variants';
import type { UnifiedTrackCardProps, StandardTrackCardProps, ProfessionalTrackCardProps, EnhancedTrackCardProps } from './types';

export const UnifiedTrackCard = memo(function UnifiedTrackCard(props: UnifiedTrackCardProps) {
  const variant = props.variant || 'default';

  switch (variant) {
    case 'enhanced':
      return <EnhancedVariant {...(props as EnhancedTrackCardProps)} />;

    case 'professional':
      return <ProfessionalVariant {...(props as ProfessionalTrackCardProps)} />;

    case 'list':
      return <ListVariant {...(props as StandardTrackCardProps)} />;

    case 'compact':
      return <CompactVariant {...(props as StandardTrackCardProps)} />;

    case 'minimal':
      return <MinimalVariant {...(props as StandardTrackCardProps)} />;

    case 'grid':
    case 'default':
    default:
      return <GridVariant {...(props as StandardTrackCardProps)} />;
  }
});

// Re-export types
export type { UnifiedTrackCardProps, StandardTrackCardProps, ProfessionalTrackCardProps, EnhancedTrackCardProps } from './types';
