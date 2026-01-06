/**
 * Minimal Variant for UnifiedTrackCard
 * Per task T033
 */

import { cn } from '@/lib/utils';
import type { BaseUnifiedTrackCardProps } from '../track-card.types';

export function MinimalVariant({ track, className }: BaseUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder.png';

  return (
    <div className={cn('relative bg-card rounded overflow-hidden', className)}>
      <div className="aspect-square">
        <img src={coverUrl} alt={track.title || 'Track'} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
