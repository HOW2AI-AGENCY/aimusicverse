/**
 * GridVariant - Simplified grid card (Phase 2 Redesign)
 *
 * Simplified design:
 * - Square cover with hover scale(1.02)
 * - Title (1 line) + 2 tags max
 * - Minimal badges (stems only when available)
 * - Swipe gestures preserved
 */

import { memo, useState, useCallback, lazy, Suspense } from "react";
import { motion, PanInfo } from "@/lib/motion";
import { Heart, Trash2, MoreHorizontal, Layers, Music2 } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { hapticImpact, hapticNotification } from "@/lib/haptic";
import { notify } from "@/lib/notifications";
import { LazyImage } from "@/components/ui/lazy-image";
import { PlayOverlay, DurationBadge } from "@/components/library/shared";

// Lazy — heavy track-actions tree (~30KB+), only 1% of cards have sheet open at once
const UnifiedTrackSheet = lazy(() =>
  import("@/components/track-actions").then((m) => ({ default: m.UnifiedTrackSheet })),
);
import { QuickLikeButton } from "@/components/track/QuickLikeButton";
import { QuickQueueButton } from "@/components/track/QuickQueueButton";
import { useTrackCardState } from "../hooks/useTrackCardState";
import { SimplifiedTagsRow } from "./SimplifiedTagsRow";
import { CardCoverActionBar } from "../components/CardCoverActionBar";
import { CardFollowButton } from "../components/CardFollowButton";
import type { StandardTrackCardProps } from "../types";
import type { Track } from "@/types/track";

// Lazy — AlertDialog only renders on delete swipe (~0.5% of cards)
const AlertDialog = lazy(() => import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialog })));
const AlertDialogAction = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogAction })),
);
const AlertDialogCancel = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogCancel })),
);
const AlertDialogContent = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogContent })),
);
const AlertDialogDescription = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogDescription })),
);
const AlertDialogFooter = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogFooter })),
);
const AlertDialogHeader = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogHeader })),
);
const AlertDialogTitle = lazy(() =>
  import("@/components/ui/alert-dialog").then((m) => ({ default: m.AlertDialogTitle })),
);

export const GridVariant = memo(function GridVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onTagClick,
  stemCount = 0,
  versionCount = 0,
  isPlaying: isPlayingProp,
  className,
  showActions = true,
  showFollowButton = true,
  priority = false,
}: StandardTrackCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    sheetOpen,
    setSheetOpen,
    isMobile,
    isCurrentlyPlaying,
    handlePlay,
    handleCardClick,
    handleMouseEnter,
    handleMouseLeave,
    openSheet,
    isOwnTrack,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

  // Only enable delete swipe for own tracks
  const canDelete = isOwnTrack && onDelete;

  // Swipe handlers
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      const offset = info.offset.x;

      setSwipeOffset(0);

      if (Math.abs(offset) >= threshold) {
        if (offset < -threshold) {
          // Swipe left: Like/Unlike
          hapticImpact("medium");
          onToggleLike?.();
          notify.trackLiked(!(track as Track & { user_liked?: boolean }).is_liked);
        } else if (offset > threshold && canDelete) {
          // Swipe right: Delete (with confirmation) - ONLY for own tracks
          hapticImpact("heavy");
          setDeleteDialogOpen(true);
        }
      }
    },
    [onToggleLike, track, canDelete],
  );

  const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setSwipeOffset(info.offset.x);
  }, []);

  const handleDelete = useCallback(() => {
    hapticNotification("success");
    onDelete?.();
    setDeleteDialogOpen(false);
    notify.trackDeleted();
  }, [onDelete]);

  return (
    <>
      <motion.div
        drag={isMobile && !sheetOpen && showActions ? "x" : false}
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
              className="absolute left-0 top-0 bottom-0 w-16 bg-primary/20 flex items-center justify-center rounded-l-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeOffset < -20 ? 1 : 0 }}
            >
              <Heart className="w-6 h-6 text-primary" />
            </motion.div>

            {/* Right swipe indicator (Delete) - only for own tracks */}
            {canDelete && (
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-16 bg-destructive/20 flex items-center justify-center rounded-r-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: swipeOffset > 20 ? 1 : 0 }}
              >
                <Trash2 className="w-6 h-6 text-destructive" />
              </motion.div>
            )}
          </>
        )}

        <Card
          className={cn(
            "group overflow-hidden cursor-pointer touch-manipulation transition-all duration-200 rounded-2xl",
            "bg-card/80 backdrop-blur-sm border-border/40",
            "hover:shadow-md hover:shadow-primary/10",
            isMobile && "active:scale-[0.98]",
            !isMobile && "hover:bg-card/95",
            isCurrentlyPlaying && "ring-2 ring-primary shadow-glow bg-primary/5",
            "card-waveform-hover",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
            className,
          )}
          data-playing={isCurrentlyPlaying ? "true" : undefined}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover Image - clean, no badges except stem indicator */}
          <div className="relative aspect-square overflow-hidden" data-play-button>
            <LazyImage
              src={track.cover_url || ""}
              alt={track.title || "Track cover"}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                !isMobile && "group-hover:scale-105",
              )}
              containerClassName="w-full h-full"
              coverSize="medium"
              priority={priority}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Music2 className="w-10 h-10 text-primary/40" aria-hidden="true" />
                </div>
              }
            />

            {/* Play Overlay */}
            <PlayOverlay isPlaying={isCurrentlyPlaying} isMobile={isMobile} onPlay={handlePlay} />

            {/* Top action bar - Like / Queue / Follow, visible only when showActions */}
            {showActions && (
              <CardCoverActionBar position="top" align="between">
                <QuickLikeButton
                  trackId={track.id}
                  isLiked={(track as Track & { user_liked?: boolean }).is_liked}
                  size="sm"
                  variant="overlay"
                />
                <div className="flex items-center gap-1.5">
                  <QuickQueueButton track={track as unknown as Track} size="sm" variant="overlay" />
                  {!isOwnTrack && (
                    <CardFollowButton
                      userId={track.user_id}
                      isOwnTrack={isOwnTrack}
                      show={showFollowButton}
                      size="sm"
                    />
                  )}
                </div>
              </CardCoverActionBar>
            )}

            {/* Stem badge - only when stems available, kept off the action row */}
            {stemCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute bottom-2 left-2 text-overline px-1.5 py-0.5 bg-background/90 backdrop-blur-sm border-0 gap-1"
              >
                <Layers className="w-3 h-3" />
                {stemCount}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-3 flex flex-col gap-1 min-h-[48px]">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-h-0">
              <h3
                className="font-semibold text-xs sm:text-sm flex-1 min-w-0 leading-tight truncate"
                title={track.title || undefined}
              >
                {track.title || "Без названия"}
              </h3>

              {/* More menu - visible on hover (desktop) or always (mobile) */}
              {showActions && (
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "w-8 h-8 min-w-8 min-h-8 flex-shrink-0 -mt-1 transition-opacity rounded-full flex items-center justify-center",
                    isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSheet();
                  }}
                  aria-label="Дополнительные действия"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Ещё</span>
                </Button>
              )}
            </div>

            {/* Tags - single row, capped width, never wraps */}
            <SimplifiedTagsRow
              style={track.style}
              tags={track.tags}
              onClick={onTagClick}
              maxTags={2}
              className="mt-auto"
            />

            {/* Duration — only when available */}
            {"duration_seconds" in track && track.duration_seconds && (
              <DurationBadge seconds={track.duration_seconds} className="mt-1" />
            )}
          </div>
        </Card>
      </motion.div>

      {/* Track Sheet — only in library/feature context, not discovery */}
      <Suspense fallback={null}>
        {showActions && (
          <UnifiedTrackSheet
            track={track as unknown as Track}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        )}

        {/* Delete Confirmation — only when delete is possible */}
        {canDelete && (
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
        )}
      </Suspense>
    </>
  );
});
