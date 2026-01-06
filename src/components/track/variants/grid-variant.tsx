/**
 * Grid Variant for UnifiedTrackCard
 *
 * Per task T030: Grid layout with animations
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { BaseUnifiedTrackCardProps } from '../track-card.types';

export function GridVariant({ track, onPlay, className, testDataId }: BaseUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder-cover.png';

  return (
    <motion.div
      data-testid={testDataId}
      className={cn(
        'relative group bg-card rounded-lg overflow-hidden aspect-square',
        'hover:shadow-lg transition-shadow',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Cover Image */}
      <div className="w-full h-1/2 relative">
        <img
          src={coverUrl}
          alt={track.title || 'Track'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{track.title}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {track.user_id && 'Artist Name'}
        </p>
      </div>

      {/* Play Button Overlay */}
      <button
        onClick={() => onPlay?.(track)}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-full">
          <span className="text-2xl">▶</span>
        </div>
      </button>
    </motion.div>
  );
}
