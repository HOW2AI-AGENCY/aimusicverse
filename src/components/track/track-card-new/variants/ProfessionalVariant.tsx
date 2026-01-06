/**
 * ProfessionalVariant - Modern glassmorphism design for library
 * 
 * Features:
 * - Horizontal layout with cover + info + status icons + actions
 * - Version pills for A/B switching
 * - Status icons (vocals, stems, MIDI, etc.)
 * - Glassmorphism styling
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { MoreHorizontal, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { hapticImpact } from '@/lib/haptic';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { useTrackCardState } from '../hooks/useTrackCardState';
import { TrackCoverImage } from '../components/TrackCoverImage';
import { StatusIcons } from '../components/StatusIcons';
import { VersionPills } from '../components/VersionPills';
import type { ProfessionalTrackCardProps } from '../types';

export const ProfessionalVariant = memo(function ProfessionalVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  onVersionSwitch,
  versionCount = 0,
  stemCount = 0,
  midiStatus,
  isPlaying: isPlayingProp,
  className,
  showActions = true,
}: ProfessionalTrackCardProps) {
  const {
    sheetOpen,
    setSheetOpen,
    isHovered,
    isCurrentlyPlaying,
    handlePlay,
    handleCardClick,
    handleMouseEnter,
    handleMouseLeave,
    openSheet,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    handlePlay();
  }, [handlePlay]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openSheet();
  }, [openSheet]);

  return (
    <>
      <motion.div
        className={cn(
          'group relative flex items-center gap-3 p-2.5 rounded-xl transition-all',
          'bg-card/50 backdrop-blur-sm border border-transparent',
          'hover:bg-card hover:border-border/50 hover:shadow-lg hover:shadow-primary/5',
          isCurrentlyPlaying && 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/10',
          className
        )}
        onHoverStart={handleMouseEnter}
        onHoverEnd={handleMouseLeave}
        whileTap={{ scale: 0.995 }}
        onClick={handleCardClick}
      >
        {/* Cover Image */}
        <TrackCoverImage
          coverUrl={track.cover_url}
          title={track.title}
          size="sm"
          isPlaying={isCurrentlyPlaying}
          isHovered={isHovered}
          onPlay={handlePlayClick}
        />

        {/* Track Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate leading-tight">
              {track.title || 'Без названия'}
            </h3>

            {/* Version Switcher */}
            {versionCount > 1 && (
              <VersionPills
                count={versionCount}
                onSwitch={(i) => onVersionSwitch?.(String(i))}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {track.style || 'Нет стиля'}
            </span>

            {track.duration_seconds && (
              <span className="text-xs text-muted-foreground/70 font-mono">
                {formatTime(track.duration_seconds)}
              </span>
            )}
          </div>
        </div>

        {/* Status Icons */}
        <StatusIcons
          track={track}
          stemCount={stemCount}
          midiStatus={midiStatus}
        />

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant={isCurrentlyPlaying ? 'default' : 'ghost'}
            className={cn(
              'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-all touch-manipulation',
              isCurrentlyPlaying && 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            )}
            onClick={handlePlayClick}
            aria-label={isCurrentlyPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {showActions && (
            <Button
              size="icon"
              variant="ghost"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full touch-manipulation"
              onClick={handleMenuClick}
              aria-label="Меню"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          )}
        </div>
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
