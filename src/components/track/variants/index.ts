/**
 * List Variant for UnifiedTrackCard
 * Per task T031
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { BaseUnifiedTrackCardProps } from '../track-card.types';

export function ListVariant({ track, onPlay, className }: BaseUnifiedTrackCardProps) {
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
        <img src={track.image_url || '/placeholder.png'} alt={track.title} />
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

/**
 * Compact Variant for UnifiedTrackCard
 * Per task T032
 */

export function CompactVariant({ track, onPlay, className }: BaseUnifiedTrackCardProps) {
  return (
    <motion.div
      className={cn('relative flex flex-col bg-card rounded-md overflow-hidden p-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="aspect-square rounded overflow-hidden mb-2">
        <img src={track.image_url || '/placeholder.png'} alt={track.title} />
      </div>
      <h4 className="text-xs font-medium truncate">{track.title}</h4>
    </motion.div>
  );
}

/**
 * Minimal Variant for UnifiedTrackCard
 * Per task T033
 */

export function MinimalVariant({ track, className }: BaseUnifiedTrackCardProps) {
  return (
    <div className={cn('relative bg-card rounded overflow-hidden', className)}>
      <div className="aspect-square">
        <img src={track.image_url || '/placeholder.png'} alt={track.title} />
      </div>
    </div>
  );
}

/**
 * Enhanced Variant for UnifiedTrackCard
 * Per task T034
 */

import type { EnhancedUnifiedTrackCardProps } from '../track-card.types';
import { Heart, Share2 } from 'lucide-react';

export function EnhancedVariant({ track, onPlay, onFollow, onShare, className }: EnhancedUnifiedTrackCardProps) {
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
        <img src={track.image_url || '/placeholder.png'} alt={track.title} />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{track.title}</h3>
      </div>
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button onClick={() => onShare?.(track.id)} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-secondary rounded-full">
          <Share2 className="w-4 h-4" />
        </button>
        <button onClick={() => onFollow?.((track as any).user_id)} className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary rounded-full">
          Follow
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Professional Variant for UnifiedTrackCard
 * Per task T035
 */

import type { ProfessionalUnifiedTrackCardProps } from '../track-card.types';

export function ProfessionalVariant({
  track,
  onPlay,
  midiStatus,
  showVersionPills,
  className
}: ProfessionalUnifiedTrackCardProps) {
  return (
    <motion.div
      className={cn('relative bg-card rounded-lg overflow-hidden aspect-square', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="w-full h-1/2 relative">
        <img src={track.image_url || '/placeholder.png'} alt={track.title} />
        {midiStatus && (
          <div className="absolute top-2 left-2 flex gap-1">
            {midiStatus.hasMidi && <span className="px-2 py-1 text-xs bg-purple-500 text-white rounded-full">MIDI</span>}
            {midiStatus.hasPdf && <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">PDF</span>}
            {midiStatus.hasGp5 && <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">GP5</span>}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{track.title}</h3>
        {showVersionPills && (
          <div className="flex gap-1 mt-2">
            <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">A</span>
            <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">B</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
