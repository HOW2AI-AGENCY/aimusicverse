/**
 * TrackSheetHeader - Compact track header with cover image
 * Optimized for mobile: smaller cover, single-line meta
 */

import { memo } from 'react';
import { Track } from '@/types/track';
import { motion } from '@/lib/motion';
import { Clock, Tag, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TrackSheetHeaderProps {
  track: Track;
  className?: string;
}

export const TrackSheetHeader = memo(function TrackSheetHeader({
  track,
  className,
}: TrackSheetHeaderProps) {
  const coverUrl = track.cover_url;
  const duration = track.duration_seconds ? formatDuration(track.duration_seconds) : null;
  const hasHD = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 py-2",
        className
      )}
    >
      {/* Cover Image - Compact 56x56 */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-14 h-14 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "shadow-md shadow-black/10",
          "ring-1 ring-white/10"
        )}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={track.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary/60" />
            </div>
          )}
        </div>
        
        {/* HD Badge */}
        {hasHD && (
          <Badge 
            className="absolute -top-1 -right-1 px-1 py-0 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
      </div>

      {/* Track Info - Compact */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-base font-semibold truncate leading-tight">
          {track.title || 'Без названия'}
        </h3>
        
        {/* Single line meta: style • duration */}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {track.style && (
            <>
              <span className="truncate max-w-[120px]">{track.style}</span>
              {duration && <span>•</span>}
            </>
          )}
          {duration && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          )}
          {track.is_public && (
            <>
              <span>•</span>
              <span className="text-green-600 flex-shrink-0">Публичный</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});
