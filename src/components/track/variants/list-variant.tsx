/**
 * List Variant for UnifiedTrackCard
 * Per task T031
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { BaseUnifiedTrackCardProps } from '../track-card.types';

export function ListVariant({ track, onPlay, className }: BaseUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder.png';

  return (
    <motion.div
      className={cn(
        'relative group flex items-center gap-3 bg-card rounded-lg p-3',
        'hover:bg-accent transition-colors',
        className
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden">
        <img src={coverUrl} alt={track.title || 'Track'} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{track.title}</h3>
        <p className="text-xs text-muted-foreground truncate">Artist Name</p>
      </div>
      <button
        onClick={() => onPlay?.(track)}
        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-full"
      >
        ▶
      </button>
    </motion.div>
  );
}
