/**
 * Professional Variant for UnifiedTrackCard
 * Per task T035
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { ProfessionalUnifiedTrackCardProps } from '../track-card.types';

export function ProfessionalVariant({
  track,
  onPlay,
  midiStatus,
  showVersionPills,
  className
}: ProfessionalUnifiedTrackCardProps) {
  // Support both cover_url (from Track) and image_url (from legacy types)
  const coverUrl = track.cover_url || (track as any).image_url || '/placeholder.png';

  return (
    <motion.div
      className={cn('relative bg-card rounded-lg overflow-hidden aspect-square', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="w-full h-1/2 relative">
        <img src={coverUrl} alt={track.title || 'Track'} className="w-full h-full object-cover" />
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
