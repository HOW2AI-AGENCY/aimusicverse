import { memo } from 'react';
import { motion } from '@/lib/motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { TrackCardEnhanced } from './TrackCardEnhanced';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';

interface TracksGridSectionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconGradient?: string;
  tracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  maxTracks?: number;
  columns?: 2 | 3 | 4;
  showMoreLink?: string;
  showMoreLabel?: string;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export const TracksGridSection = memo(function TracksGridSection({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconGradient = 'from-primary/20 to-primary/5',
  tracks,
  isLoading,
  maxTracks = 8,
  columns = 4,
  showMoreLink,
  showMoreLabel = 'Все треки',
  onRemix,
  className,
}: TracksGridSectionProps) {
  const navigate = useNavigate();
  const displayTracks = tracks.slice(0, maxTracks);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  };

  if (!isLoading && displayTracks.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-soft",
              iconGradient
            )}
            whileHover={{ scale: 1.05, rotate: -5 }}
          >
            <Icon className={cn("w-5 h-5", iconColor)} />
          </motion.div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {showMoreLink && displayTracks.length >= maxTracks && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(showMoreLink)}
            className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
          >
            {showMoreLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Track Grid */}
      {isLoading ? (
        <div className={cn("grid gap-3", gridCols[columns])}>
          {[...Array(maxTracks)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn("grid gap-3", gridCols[columns])}
        >
          {displayTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
            >
              <TrackCardEnhanced
                track={track}
                onRemix={onRemix}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
});
