import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, MoreHorizontal, Volume2, Layers } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { useState } from 'react';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { InlineVersionToggle } from './InlineVersionToggle';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { motion } from '@/lib/motion';

interface MinimalTrackCardProps {
  track: Track;
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onToggleLike?: () => void;
  isPlaying?: boolean;
  layout?: 'grid' | 'list';
  versionCount?: number;
  stemCount?: number;
  index?: number;
}

export const MinimalTrackCard = ({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  isPlaying,
  layout = 'grid',
  versionCount = 0,
  stemCount = 0,
  index = 0,
}: MinimalTrackCardProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-play-button]')) {
      return;
    }
    
    if (isMobile) {
      triggerHapticFeedback('light');
    }
    setSheetOpen(true);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    onPlay?.();
  };

  // List layout - ultra compact
  if (layout === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <Card
            className={cn(
              "group flex items-center gap-3 p-2 transition-all cursor-pointer touch-manipulation",
              "hover:bg-muted/50 active:bg-muted rounded-xl border-0 bg-transparent",
              isPlaying && "bg-primary/5 border-primary/20"
            )}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Cover + Play */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
              <LazyImage
                src={track.cover_url || ''}
                alt={track.title || 'Track'}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-lg">🎵</span>
                  </div>
                }
              />
              <motion.div
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
                initial={false}
                animate={{ opacity: isPlaying || isHovered ? 1 : 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full text-white"
                  onClick={handlePlay}
                  data-play-button
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Title & Style */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-sm truncate">
                  {track.title || 'Без названия'}
                </h3>
                {/* Type icons inline */}
                {track.is_instrumental && (
                  <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
                {!track.has_vocals && !track.is_instrumental && (
                  <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
                {stemCount > 0 && (
                  <Layers className="w-3 h-3 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {track.style || track.tags?.split(',')[0] || '--'}
              </p>
            </div>

            {/* Duration */}
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {formatDuration(track.duration_seconds)}
            </span>

            {/* Version Toggle (if versions > 1) */}
            {versionCount > 1 && (
              <InlineVersionToggle
                trackId={track.id}
                activeVersionId={(track as any).active_version_id}
                versionCount={versionCount}
                className="flex-shrink-0"
              />
            )}

            {/* Menu button */}
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                triggerHapticFeedback('light');
                setSheetOpen(true);
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </Card>
        </motion.div>
        
        <UnifiedTrackSheet
          track={track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // Grid layout - minimal card
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        <Card
          className={cn(
            "group overflow-hidden cursor-pointer touch-manipulation transition-all duration-200",
            "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0",
            isPlaying && "ring-2 ring-primary shadow-lg shadow-primary/20"
          )}
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cover */}
          <div className="relative aspect-square">
            <LazyImage
              src={track.cover_url || ''}
              alt={track.title || 'Track'}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl">{track.title?.charAt(0) || '♪'}</span>
                </div>
              }
            />
            
            {/* Overlay with play button */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-3"
              initial={false}
              animate={{ opacity: isPlaying || isHovered ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="icon"
                className={cn(
                  "w-10 h-10 rounded-full transition-all",
                  isPlaying ? "bg-primary" : "bg-white/90 hover:bg-white text-black"
                )}
                onClick={handlePlay}
                data-play-button
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              
              {/* Duration badge */}
              <span className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                {formatDuration(track.duration_seconds)}
              </span>
            </motion.div>

            {/* Top badges - version and type */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              {/* Type badges */}
              <div className="flex gap-1">
                {track.is_instrumental && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm">
                    <Volume2 className="w-2.5 h-2.5 mr-0.5" />
                    Инстр
                  </Badge>
                )}
                {stemCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm border-primary/50">
                    <Layers className="w-2.5 h-2.5 mr-0.5" />
                    {stemCount}
                  </Badge>
                )}
              </div>
              
              {/* Version toggle */}
              {versionCount > 1 && (
                <InlineVersionToggle
                  trackId={track.id}
                  activeVersionId={(track as any).active_version_id}
                  versionCount={versionCount}
                />
              )}
            </div>
          </div>

          {/* Title only - ultra minimal */}
          <div className="p-3">
            <h3 className="font-medium text-sm truncate">{track.title || 'Без названия'}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {track.style || track.tags?.split(',')[0] || '--'}
            </p>
          </div>
        </Card>
      </motion.div>

      <UnifiedTrackSheet
        track={track}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
};