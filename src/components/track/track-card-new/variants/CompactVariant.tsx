/**
 * CompactVariant - Compact list row with minimal info
 *
 * Features:
 * - Small cover
 * - Title + style
 * - Duration
 * - Menu button
 */

import { memo } from "react";
import { motion } from "@/lib/motion";
import { MoreHorizontal } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/player-utils";
import { UnifiedTrackSheet } from "@/components/track-actions";
import { QuickLikeButton } from "@/components/track/QuickLikeButton";
import { QuickQueueButton } from "@/components/track/QuickQueueButton";
import { useTrackCardState } from "../hooks/useTrackCardState";
import { TrackCoverImage } from "../components/TrackCoverImage";
import { CardFollowButton } from "../components/CardFollowButton";
import type { StandardTrackCardProps } from "../types";
import type { Track } from "@/types/track";

export const CompactVariant = memo(function CompactVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  isPlaying: isPlayingProp,
  index = 0,
  className,
  showActions = true,
  showFollowButton = true,
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
    isOwnTrack,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.18 }}
      >
        <div
          data-active={isCurrentlyPlaying ? "true" : undefined}
          className={cn("row-64 group cursor-pointer touch-manipulation select-none", className)}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`Трек ${track.title || "Без названия"}`}
        >
          <TrackCoverImage
            coverUrl={track.cover_url}
            title={track.title}
            size="xs"
            isPlaying={isCurrentlyPlaying}
            isHovered={isHovered}
            onPlay={handlePlay}
            showPlayingGlow={false}
          />

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <h3
              className={cn(
                "font-display text-sm leading-tight truncate tracking-tight",
                isCurrentlyPlaying ? "text-primary font-semibold" : "text-foreground font-medium",
              )}
            >
              {track.title || "Без названия"}
            </h3>
            <div className="flex items-center gap-1.5 min-w-0">
              {track.style && <span className="tag-chip shrink-0 max-w-36 truncate">{track.style.split(",")[0]}</span>}
              <span className="text-caption-sm text-muted-foreground/80 tabular-nums shrink-0">
                {track.duration_seconds ? formatDuration(track.duration_seconds) : "--:--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <QuickLikeButton
              trackId={track.id}
              isLiked={(track as Track & { user_liked?: boolean }).is_liked}
              size="sm"
              variant="minimal"
            />
            <QuickQueueButton track={track as unknown as Track} size="sm" variant="minimal" />
            {!isOwnTrack && (
              <CardFollowButton userId={track.user_id} isOwnTrack={isOwnTrack} show={showFollowButton} size="sm" />
            )}

            {showActions && (
              <Button
                size="icon"
                variant="ghost"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/[0.06]"
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet();
                }}
                aria-label="Открыть меню трека"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <UnifiedTrackSheet
        track={track as unknown as Track}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
});
