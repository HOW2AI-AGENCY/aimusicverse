/**
 * TrackSheetHeader - Beautiful track header with cover image
 * Shows track cover, title, artist, and key metadata
 */

import { memo } from 'react';
import { Track } from '@/types/track';
import { motion } from '@/lib/motion';
import { Clock, Music2, Tag, Sparkles } from 'lucide-react';
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
  const modelUsed = (track as any).model_used as string | undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 p-4 -mx-4 -mt-2 mb-2",
        "bg-gradient-to-b from-primary/5 to-transparent",
        "border-b border-border/30",
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative flex-shrink-0">
        <motion.div
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-20 h-20 rounded-xl overflow-hidden",
            "bg-gradient-to-br from-primary/20 to-primary/5",
            "shadow-lg shadow-black/20",
            "ring-1 ring-white/10"
          )}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={track.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-8 h-8 text-primary/60" />
            </div>
          )}
        </motion.div>
        
        {/* HD Badge */}
        {hasHD && (
          <Badge 
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-lg font-semibold truncate pr-2">
          {track.title || 'Без названия'}
        </h3>
        
        {track.style && (
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {track.style}
          </p>
        )}
        
        {/* Meta Info Row */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {duration && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          )}
          
          {modelUsed && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {modelUsed === 'chirp-v4' ? 'v4' : 
               modelUsed === 'chirp-v3-5' ? 'v3.5' : 
               modelUsed?.split('-').pop() || 'AI'}
            </Badge>
          )}
          
          {track.is_public && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-green-500/50 text-green-600">
              Публичный
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
});
