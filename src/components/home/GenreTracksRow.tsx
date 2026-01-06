import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Music2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { UnifiedTrackCard } from '@/components/track/track-card-new';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { CarouselSkeleton } from '@/components/ui/skeleton-components';

interface GenreTracksRowProps {
  genre: string;
  genreLabel: string;
  tracks: PublicTrackWithCreator[];
  color?: string;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export const GenreTracksRow = memo(function GenreTracksRow({
  genre,
  genreLabel,
  tracks,
  color = 'primary',
  onRemix,
  className,
}: GenreTracksRowProps) {
  const navigate = useNavigate();
  
  // Filter tracks by genre - prioritize computed_genre
  const genreTracks = useMemo(() => {
    const searchTerm = genre.toLowerCase();
    return tracks.filter(track => {
      // Priority: computed_genre (most reliable from DB)
      const computed = (track.computed_genre || '').toLowerCase();
      if (computed === searchTerm || computed.includes(searchTerm)) {
        return true;
      }
      // Fallback: style and tags
      const tags = (Array.isArray(track.tags) ? track.tags.join(' ') : (track.tags || '')).toLowerCase();
      const style = (track.style || '').toLowerCase();
      return tags.includes(searchTerm) || style.includes(searchTerm);
    }).slice(0, 12);
  }, [tracks, genre]);

  if (genreTracks.length < 2) {
    return null;
  }

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <section className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn("gap-1 text-xs font-medium", colors.bg, colors.text, colors.border)}
          >
            <Music2 className="w-3 h-3" />
            {genreLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {genreTracks.length} треков
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/community?genre=${genre}`)}
          className="text-xs text-muted-foreground hover:text-primary gap-1 rounded-xl h-7 px-2"
        >
          Ещё
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Horizontal scroll */}
      <ScrollArea className="-mx-3">
        <div className="flex gap-3 px-3 pb-2">
          {genreTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-[140px] sm:w-[160px]"
            >
              <UnifiedTrackCard
                variant="enhanced"
                track={track}
                onRemix={onRemix}
              />
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
});
