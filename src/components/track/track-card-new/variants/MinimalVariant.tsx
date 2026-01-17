/**
 * MinimalVariant - Ultra-compact for quick lists
 * 
 * Features:
 * - Small cover
 * - Title + style
 * - Duration
 * - Type icons (inline)
 * - Version toggle (if > 1)
 * - Menu button
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { MoreHorizontal, Volume2, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/player-utils';
import { LazyImage } from '@/components/ui/lazy-image';
import { UnifiedVersionSelector } from '@/components/shared/UnifiedVersionSelector';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { useTrackCardState } from '../hooks/useTrackCardState';
import { TrackCoverImage } from '../components/TrackCoverImage';
import type { StandardTrackCardProps } from '../types';

export const MinimalVariant = memo(function MinimalVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  versionCount = 0,
  stemCount = 0,
  isPlaying: isPlayingProp,
  index = 0,
  className,
  showActions = true,
}: StandardTrackCardProps) {
  const {
    sheetOpen,
    setSheetOpen,
    isHovered,
    isCurrentlyPlaying,
    handlePlay,
    handleCardClick,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
    openSheet,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

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
          aria-label={`Трек ${track.title || 'Без названия'}, ${track.style || ''}`}
        >
          {/* Cover + Play */}
          <TrackCoverImage
            coverUrl={track.cover_url}
            title={track.title}
            size="xs"
            isPlaying={isCurrentlyPlaying}
            isHovered={isHovered}
            onPlay={handlePlay}
            showPlayingGlow={false}
          />

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
            {track.duration_seconds ? formatDuration(track.duration_seconds) : '--:--'}
          </span>

          {/* Version Toggle - using UnifiedVersionSelector */}
          {versionCount > 1 && (
            <UnifiedVersionSelector
              trackId={track.id}
              variant="inline"
              showLabels={false}
              className="flex-shrink-0"
            />
          )}

          {/* Menu button */}
          {showActions && (
            <Button
              size="icon"
              variant="ghost"
              className="w-11 h-11 min-h-[44px] min-w-[44px] opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation flex-shrink-0 -mr-2"
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
        track={track as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
});
