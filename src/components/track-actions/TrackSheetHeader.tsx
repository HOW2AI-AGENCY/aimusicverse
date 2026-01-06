/**
 * TrackSheetHeader - Track header with 64x64 cover, icons, tags
 * Matching TrackCard layout for consistency
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Track } from '@/types/track';
import { Clock, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrackTypeIcons } from '@/components/library/TrackTypeIcons';
import { ScrollableTagsRow } from '@/components/library/ScrollableTagsRow';

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TrackSheetHeaderProps {
  track: Track;
  stemCount?: number;
  hasMidi?: boolean;
  hasNotes?: boolean;
  className?: string;
}

export const TrackSheetHeader = memo(function TrackSheetHeader({
  track,
  stemCount = 0,
  hasMidi = false,
  hasNotes = false,
  className,
}: TrackSheetHeaderProps) {
  const navigate = useNavigate();
  const coverUrl = track.cover_url;
  const duration = track.duration_seconds ? formatDuration(track.duration_seconds) : null;
  const hasHD = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';

  // Navigate to community on tag click
  const handleTagClick = (tag: string) => {
    navigate(`/community?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <div className={cn("flex gap-3 py-2", className)}>
      {/* Cover Image - 64x64 matching TrackCard */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-16 h-16 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-primary/20 to-primary/5",
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
            className="absolute -top-1 -right-1 px-1 py-0 text-[8px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
        
        {/* Duration badge on cover */}
        {duration && (
          <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-medium">
            {duration}
          </div>
        )}
      </div>

      {/* Track Info - 3 rows like TrackCard */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {/* Row 1: Title */}
        <h3 className="text-sm font-semibold truncate leading-tight">
          {track.title || 'Без названия'}
        </h3>
        
        {/* Row 2: TrackTypeIcons */}
        <div className="flex items-center gap-1">
          <TrackTypeIcons 
            track={track} 
            compact 
            showModel 
            hasMidi={hasMidi} 
            hasPdf={hasNotes} 
          />
          {stemCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px] gap-0.5">
              {stemCount} stems
            </Badge>
          )}
        </div>
        
        {/* Row 3: Scrollable Tags */}
        <div className="min-w-0 w-full">
          <ScrollableTagsRow 
            style={track.style} 
            tags={track.tags}
            onClick={handleTagClick}
          />
        </div>
      </div>
    </div>
  );
});
