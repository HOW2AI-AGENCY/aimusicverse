/**
 * Enhanced Variant for UnifiedTrackCard
 * Per task T034
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import type { EnhancedUnifiedTrackCardProps } from '../track-card.types';

export function EnhancedVariant({ track, onPlay, onFollow, onShare, className }: EnhancedUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder.png';

  return (
    <motion.div
      className={cn(
        'relative group bg-card rounded-lg overflow-hidden aspect-square',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="w-full h-1/2">
        <img src={coverUrl} alt={track.title || 'Track'} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{track.title}</h3>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button onClick={() => onShare?.(track.id)} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-secondary rounded-full">
          <Share2 className="w-4 h-4" />
        </button>
        <button onClick={() => onFollow?.((track as any).user_id)} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary rounded-full text-primary-foreground text-xs">
          Follow
        </button>
      </div>
    </motion.div>
  );
}
