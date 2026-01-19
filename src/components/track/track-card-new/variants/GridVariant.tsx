/**
 * GridVariant - Standard grid card with cover
 * 
 * Features:
 * - Square cover with hover effects
 * - Title + style
 * - Badges (type, stem count, version)
 * - Swipe gestures on mobile
 * - Like/delete on swipe
 */

import { memo, useState, useCallback } from 'react';
import { motion, PanInfo } from '@/lib/motion';
import { Heart, Trash2, Play, Pause, MoreHorizontal, Wand2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticImpact, hapticNotification } from '@/lib/haptic';
import { notify } from '@/lib/notifications';
import { LazyImage } from '@/components/ui/lazy-image';
import { TrackBadges, DurationBadge, PlayOverlay } from '@/components/library/shared';
import { UnifiedVersionSelector } from '@/components/shared/UnifiedVersionSelector';
import { TrackTypeIcons } from '@/components/library/TrackTypeIcons';
import { ScrollableTagsRow } from '@/components/library/ScrollableTagsRow';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { QuickLikeButton } from '@/components/track/QuickLikeButton';
import { useTrackCardState } from '../hooks/useTrackCardState';
import type { StandardTrackCardProps } from '../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const GridVariant = memo(function GridVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onTagClick,
  versionCount = 0,
  stemCount = 0,
  midiStatus,
  isPlaying: isPlayingProp,
  className,
  showActions = true,
}: StandardTrackCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    sheetOpen,
    setSheetOpen,
    isHovered,
    isMobile,
    isCurrentlyPlaying,
    handlePlay,
    handleCardClick,
    handleMouseEnter,
    handleMouseLeave,
    openSheet,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

  // Swipe handlers
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      const offset = info.offset.x;

      setSwipeOffset(0);

      if (Math.abs(offset) >= threshold) {
        if (offset < -threshold) {
          // Swipe left: Like/Unlike
          hapticImpact('medium');
          onToggleLike?.();
          notify.trackLiked(!(track as any).is_liked);
        } else if (offset > threshold) {
          // Swipe right: Delete (with confirmation)
          hapticImpact('heavy');
          setDeleteDialogOpen(true);
        }
      }
    },
    [onToggleLike, track]
  );

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setSwipeOffset(info.offset.x);
    },
    []
  );

  const handleDelete = useCallback(() => {
    hapticNotification('success');
    onDelete?.();
    setDeleteDialogOpen(false);
    notify.trackDeleted();
  }, [onDelete]);

  return (
    <>
      <motion.div
        drag={isMobile && !sheetOpen ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative"
      >
        {/* Swipe action indicators */}
        {isMobile && (
          <>
            {/* Left swipe indicator (Like) */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-16 bg-red-500/20 flex items-center justify-center rounded-l-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeOffset < -20 ? 1 : 0 }}
            >
              <Heart className="w-6 h-6 text-red-500" />
            </motion.div>

            {/* Right swipe indicator (Delete) */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-16 bg-destructive/20 flex items-center justify-center rounded-r-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeOffset > 20 ? 1 : 0 }}
            >
              <Trash2 className="w-6 h-6 text-destructive" />
            </motion.div>
          </>
        )}

        <Card
          className={cn(
            'group overflow-hidden cursor-pointer touch-manipulation transition-all duration-300 rounded-2xl border-transparent',
            !isMobile && 'hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1',
            isMobile && 'active:scale-[0.98] active:shadow-md',
            isCurrentlyPlaying &&
              'ring-2 ring-primary shadow-glow relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-primary/10 before:via-generate/10 before:to-primary/10 before:animate-pulse before:-z-10',
            className
          )}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover Image */}
          <div className="relative aspect-square overflow-hidden" data-play-button>
            <LazyImage
              src={track.cover_url || ''}
              alt={track.title || 'Track cover'}
              className={cn(
                'w-full h-full object-cover cursor-pointer transition-transform duration-500',
                !isMobile && 'group-hover:scale-105'
              )}
              containerClassName="w-full h-full"
              coverSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl">{track.title?.charAt(0) || '♪'}</span>
                </div>
              }
            />

            {/* Duration Badge */}
            <DurationBadge seconds={track.duration_seconds} className="absolute bottom-2 right-2" />

            {/* Play Overlay */}
            <PlayOverlay
              isPlaying={isCurrentlyPlaying}
              isMobile={isMobile}
              onPlay={handlePlay}
            />

            {/* Top badges */}
            <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start">
              {/* Type icons */}
              <TrackTypeIcons
                track={track as any}
                compact
                hasMidi={midiStatus?.hasMidi}
                hasPdf={midiStatus?.hasPdf}
                hasGp5={midiStatus?.hasGp5}
              />

              {/* Version toggle - using UnifiedVersionSelector */}
              {versionCount > 1 && (
                <UnifiedVersionSelector
                  trackId={track.id}
                  variant="inline"
                  showLabels={false}
                />
              )}
            </div>

            {/* Stem count badge */}
            {stemCount > 0 && (
              <Badge
                variant="outline"
                className="absolute top-1.5 right-1.5 text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm border-primary/50"
              >
                🎛️ {stemCount}
              </Badge>
            )}
          </div>

          {/* Content - increased padding for mobile touch */}
          <div className="p-3 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm sm:text-xs truncate flex-1">{track.title || 'Без названия'}</h3>

              <div className="flex items-center gap-1">
                {/* Quick Like Button - one tap */}
                <QuickLikeButton
                  trackId={track.id}
                  isLiked={(track as any).is_liked}
                  size="sm"
                  variant="minimal"
                />
                
                {showActions && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "w-10 h-10 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex-shrink-0 transition-opacity",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSheet();
                    }}
                    aria-label="Дополнительные действия"
                  >
                    <MoreHorizontal className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags */}
            <ScrollableTagsRow style={track.style} tags={track.tags} onClick={onTagClick} />
          </div>
        </Card>
      </motion.div>

      {/* Track Sheet */}
      <UnifiedTrackSheet
        track={track as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить трек?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить "{track.title}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
