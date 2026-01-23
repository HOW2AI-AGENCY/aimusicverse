/**
 * GridVariant - Simplified grid card (Phase 2 Redesign)
 * 
 * Simplified design:
 * - Square cover with hover scale(1.02)
 * - Title (1 line) + 2 tags max
 * - Minimal badges (stems only when available)
 * - Swipe gestures preserved
 */

import { memo, useState, useCallback } from 'react';
import { motion, PanInfo } from '@/lib/motion';
import { Heart, Trash2, Play, Pause, MoreHorizontal, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticImpact, hapticNotification } from '@/lib/haptic';
import { notify } from '@/lib/notifications';
import { LazyImage } from '@/components/ui/lazy-image';
import { PlayOverlay } from '@/components/library/shared';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { QuickLikeButton } from '@/components/track/QuickLikeButton';
import { useTrackCardState } from '../hooks/useTrackCardState';
import { SimplifiedTagsRow } from './SimplifiedTagsRow';
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
  stemCount = 0,
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
        whileHover={!isMobile ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.2 }}
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
            'group overflow-hidden cursor-pointer touch-manipulation transition-all duration-200 rounded-2xl border-transparent',
            'hover:ring-2 hover:ring-primary/20 hover:shadow-lg hover:shadow-primary/5',
            isMobile && 'active:scale-[0.98]',
            isCurrentlyPlaying && 'ring-2 ring-primary shadow-glow',
            className
          )}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover Image - clean, no badges except stem indicator */}
          <div className="relative aspect-square overflow-hidden" data-play-button>
            <LazyImage
              src={track.cover_url || ''}
              alt={track.title || 'Track cover'}
              className={cn(
                'w-full h-full object-cover transition-transform duration-300',
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

            {/* Play Overlay */}
            <PlayOverlay
              isPlaying={isCurrentlyPlaying}
              isMobile={isMobile}
              onPlay={handlePlay}
            />

            {/* Stem badge - only when stems available */}
            {stemCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm border-0 gap-1"
              >
                <Layers className="w-3 h-3" />
                {stemCount}
              </Badge>
            )}
          </div>

          {/* Content - simplified */}
          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate flex-1">
                {track.title || 'Без названия'}
              </h3>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                {/* Quick Like */}
                <QuickLikeButton
                  trackId={track.id}
                  isLiked={(track as any).is_liked}
                  size="sm"
                  variant="minimal"
                />
                
                {/* More menu - visible on hover (desktop) or always (mobile) */}
                {showActions && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "w-9 h-9 min-w-[44px] min-h-[44px] flex-shrink-0 transition-opacity rounded-full",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      openSheet();
                    }}
                    aria-label="Дополнительные действия"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags - max 2 visible */}
            <SimplifiedTagsRow 
              style={track.style} 
              tags={track.tags} 
              onClick={onTagClick}
              maxTags={2}
            />
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
