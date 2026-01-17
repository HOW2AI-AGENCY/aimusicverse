/**
 * VersionsSection - Track version selection section
 * Now uses UnifiedVersionSelector as the single source of truth
 */

import { memo } from 'react';
import type { Track } from '@/types/track';
import { UnifiedVersionSelector } from '@/components/shared/UnifiedVersionSelector';

interface VersionsSectionProps {
  track: Track;
  compact?: boolean;
}

export const VersionsSection = memo(function VersionsSection({ 
  track, 
  compact = false 
}: VersionsSectionProps) {
  return (
    <UnifiedVersionSelector 
      trackId={track.id}
      variant={compact ? 'compact' : 'inline'}
      showLabels
    />
  );
});
