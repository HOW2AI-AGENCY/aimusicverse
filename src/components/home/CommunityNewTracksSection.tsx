import { Users, Sparkles, ArrowRight } from 'lucide-react';
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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-36 h-48 shrink-0 rounded-xl" />
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
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
              Новые треки сообщества
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-none">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                {displayTracks.length}
              </Badge>
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Свежие работы от музыкантов
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/community')}
        >
          Все
          <ArrowRight className="w-3 h-3" />
        </Button>
      </motion.div>

      {/* Tracks - Horizontal scroll on mobile, grid on desktop */}
      <div className="relative -mx-3 sm:mx-0">
        {/* Gradient fade edges for scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
        
        {/* Mobile: Horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 sm:px-0 sm:hidden snap-x snap-mandatory pb-2">
          {displayTracks.map((track, index) => (
            <motion.div
              key={track.id}
              className="w-36 shrink-0 snap-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <PublicTrackCard
                track={track}
                onRemix={onRemix}
                compact={false}
                className="h-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Desktop: Grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
