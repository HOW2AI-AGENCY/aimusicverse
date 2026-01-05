/**
 * UnifiedTrackCard - Single track card component with multiple variants
 * 
 * Replaces:
 * - TrackCard (basic)
 * - MinimalTrackCard (grid/list)
 * - TrackCardEnhanced (public/enhanced)
 * 
 * Variants:
 * - 'minimal': Ultra-compact for quick lists
 * - 'grid': Standard grid card with cover
 * - 'list': Horizontal list row
 * - 'enhanced': Rich card with social features (for public tracks)
 */

import { memo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/player-utils';
import { useTrackCardLogic } from './hooks/useTrackCardLogic';
import { TrackCover } from './TrackCover';
import { TrackInfo } from './TrackInfo';
import { InlineVersionToggle } from '@/components/library/InlineVersionToggle';
import { UnifiedTrackSheet } from '@/components/track-actions';
import type { Track } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

type TrackType = Track | PublicTrackWithCreator;

interface UnifiedTrackCardProps {
  track: TrackType;
  variant?: 'minimal' | 'grid' | 'list' | 'enhanced';
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  versionCount?: number;
  stemCount?: number;
  index?: number;
  className?: string;
  /** Show actions menu button */
  showActions?: boolean;
}

export const UnifiedTrackCard = memo(function UnifiedTrackCard({
  track,
  variant = 'grid',
  onPlay,
  onDelete,
  onDownload,
  versionCount = 0,
  stemCount = 0,
  index = 0,
  className,
  showActions = true,
}: UnifiedTrackCardProps) {
  const {
    sheetOpen,
    setSheetOpen,
    isHovered,
    isCurrentlyPlaying,
    handleCardClick,
    handlePlay,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    openSheet,
  } = useTrackCardLogic({ track, onPlay, onDelete });

  // List layout
  if (variant === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <Card
            className={cn(
              'group flex items-center gap-3 p-2 transition-all cursor-pointer touch-manipulation',
              'hover:bg-muted/50 active:bg-muted rounded-xl border-0 bg-transparent',
              isCurrentlyPlaying && 'bg-primary/5 border-primary/20',
              className
            )}
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`Трек ${track.title || 'Без названия'}`}
          >
            <TrackCover
              coverUrl={track.cover_url}
              title={track.title}
              isPlaying={isCurrentlyPlaying}
              isHovered={isHovered}
              onPlay={handlePlay}
              size="xs"
              showDuration={false}
              showPlayingIndicator={false}
            />

            <TrackInfo
              track={track}
              variant="default"
              stemCount={stemCount}
              className="flex-1"
            />

            {/* Duration */}
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {track.duration_seconds ? formatDuration(track.duration_seconds) : '--:--'}
            </span>

            {/* Version Toggle */}
            {versionCount > 1 && (
              <InlineVersionToggle
                trackId={track.id}
                activeVersionId={(track as any).active_version_id}
                versionCount={versionCount}
                className="flex-shrink-0"
              />
            )}

            {/* Menu button */}
            {showActions && (
              <Button
                size="icon"
                variant="ghost"
                className="w-11 h-11 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet();
                }}
                aria-label="Открыть меню трека"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            )}
          </Card>
        </motion.div>

        <UnifiedTrackSheet
          track={track as Track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // Grid layout (default)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        <Card
          className={cn(
            'group overflow-hidden cursor-pointer touch-manipulation transition-all duration-200',
            'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0',
            isCurrentlyPlaying && 'ring-2 ring-primary shadow-lg shadow-primary/20',
            className
          )}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover */}
          <div className="relative aspect-square">
            <TrackCover
              coverUrl={track.cover_url}
              title={track.title}
              duration={track.duration_seconds}
              isPlaying={isCurrentlyPlaying}
              isHovered={isHovered}
              onPlay={handlePlay}
              size="md"
              className="rounded-none"
            />

            {/* Top badges */}
            <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none">
              <div className="flex gap-0.5 pointer-events-auto">
                {track.is_instrumental && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm">
                    Инстр
                  </Badge>
                )}
                {stemCount > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm border-primary/50">
                    {stemCount} стемов
                  </Badge>
                )}
              </div>
              
              {versionCount > 1 && (
                <div className="pointer-events-auto">
                  <InlineVersionToggle
                    trackId={track.id}
                    activeVersionId={(track as any).active_version_id}
                    versionCount={versionCount}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-2">
            <TrackInfo
              track={track}
              variant="compact"
              showIcons={false}
              isHovered={isHovered}
            />
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {track.style || track.tags?.split(',')[0] || '--'}
            </p>
          </div>
        </Card>
      </motion.div>

      <UnifiedTrackSheet
        track={track as Track}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
});
