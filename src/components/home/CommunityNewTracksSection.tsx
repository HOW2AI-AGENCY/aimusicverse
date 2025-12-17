import { Users, Sparkles, ArrowRight, Flame, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicTrackCard } from './PublicTrackCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';

interface CommunityNewTracksSectionProps {
  tracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  onRemix?: (trackId: string) => void;
  maxTracks?: number;
}

export function CommunityNewTracksSection({ 
  tracks, 
  isLoading, 
  onRemix,
  maxTracks = 8 
}: CommunityNewTracksSectionProps) {
  const navigate = useNavigate();
  const displayTracks = tracks.slice(0, maxTracks);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i} 
              className="w-36 h-52 shrink-0 rounded-2xl" 
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!displayTracks.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header - Compact */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2.5">
          {/* Animated icon container - Compact */}
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 via-accent/15 to-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            {/* Live indicator */}
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <span className="text-gradient">Новые треки</span>
              <Badge 
                variant="secondary" 
                className="text-[9px] px-1.5 py-0 h-4 bg-gradient-to-r from-primary/15 to-accent/15 text-primary border border-primary/20"
              >
                <Flame className="w-2 h-2 mr-0.5" />
                {displayTracks.length}
              </Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              Свежие работы
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg px-2"
          onClick={() => navigate('/community')}
        >
          Все
          <ArrowRight className="w-3 h-3" />
        </Button>
      </motion.div>

      {/* Tracks - Horizontal scroll on mobile, grid on desktop */}
      <div className="relative -mx-3 sm:mx-0">
        {/* Gradient fade edges for scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none sm:hidden" />
        
        {/* Mobile: Horizontal scroll - Consistent card widths */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 sm:px-0 sm:hidden snap-x snap-mandatory pb-2">
          {displayTracks.map((track, index) => (
            <motion.div
              key={track.id}
              className="w-[140px] shrink-0 snap-start"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <PublicTrackCard
                track={track}
                onRemix={onRemix}
                compact
                className="h-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Desktop: Grid with stagger animation */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <PublicTrackCard
                track={track}
                onRemix={onRemix}
                compact={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
