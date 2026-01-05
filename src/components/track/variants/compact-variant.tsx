/**
 * Compact Variant for UnifiedTrackCard
 * Per task T032
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { BaseUnifiedTrackCardProps } from '../track-card.types';

export function CompactVariant({ track, onPlay, className }: BaseUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder.png';

  return (
    <motion.div
      className={cn('relative flex flex-col bg-card rounded-md overflow-hidden p-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="aspect-square rounded overflow-hidden mb-2">
        <img src={coverUrl} alt={track.title || 'Track'} className="w-full h-full object-cover" />
      </div>
      <h4 className="text-xs font-medium truncate">{track.title}</h4>
    </motion.div>
  );
}
