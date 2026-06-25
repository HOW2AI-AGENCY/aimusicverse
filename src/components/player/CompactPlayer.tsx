/**
 * CompactPlayer - Adaptive bottom dock with 3 variants
 *
 *   - mobile  (<640px)  : 2-row layout, waveform on top, controls below, × button
 *   - mid     (640-1023): single row, compact controls, × button
 *   - desktop (≥1024px) : wide dock with prev/play/next + time + waveform + like
 *                         + volume popover + expand + × button
 *
 * Click on cover / title / waveform-zone expands the player to fullscreen.
 * The × button (closePlayer) is always reachable and stopsPropagation so it
 * never accidentally triggers expand.
 */
import { memo, useCallback, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Music2,
  SkipForward,
  SkipBack,
  ChevronUp,
  X,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
} from "lucide-react";
import { useAudioTime } from "@/hooks/audio/useAudioTime";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useGestures } from "@/hooks/useGestures";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTracks } from "@/hooks/useTracks";
import type { Track } from "@/types/track";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { glass } from "@/lib/glass";
import { UnifiedTrackMenu } from "@/components/track-actions/UnifiedTrackMenu";
import { WaveformProgressBar } from "./WaveformProgressBar";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CompactPlayerProps {
  track: Track;
  onExpand: () => void;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};

export const CompactPlayer = memo(function CompactPlayer({ track, onExpand }: CompactPlayerProps) {
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, closePlayer, queue, volume, setVolume } =
    usePlayerStore();
  const { currentTime, duration, buffered, seek } = useAudioTime();
  const { toggleLike } = useTracks();
  const [showExpandHint, setShowExpandHint] = useState(false);

  const isMobile = useMediaQuery("(max-width: 639px)");
  const isMidRange = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isMobileLandscape = useMediaQuery("(max-width: 1023px) and (orientation: landscape) and (max-height: 500px)");
  const variant: "mobile" | "mid" | "desktop" = isDesktop ? "desktop" : isMidRange ? "mid" : "mobile";

  const hasNextTrack = queue.length > 0;

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticImpact("light");
      if (isPlaying) pauseTrack();
      else playTrack();
    },
    [isPlaying, playTrack, pauseTrack],
  );

  const handleNextTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticImpact("light");
      nextTrack();
    },
    [nextTrack],
  );

  const handlePrevTrack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticImpact("light");
      previousTrack();
    },
    [previousTrack],
  );

  const handleExpand = useCallback(() => {
    hapticImpact("light");
    onExpand();
  }, [onExpand]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticImpact("light");
      closePlayer();
    },
    [closePlayer],
  );

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hapticImpact("light");
      toggleLike({ trackId: track.id, isLiked: Boolean((track as any).is_liked) });
    },
    [toggleLike, track],
  );

  const handleSeek = useCallback(
    (time: number) => {
      hapticImpact("light");
      seek(time);
    },
    [seek],
  );

  const handleExpandKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleExpand();
      }
    },
    [handleExpand],
  );

  // Swipe gestures: up = expand, left = next, right = -10s
  const { gestureHandlers } = useGestures({
    onSwipeUp: handleExpand,
    onSwipeLeft: hasNextTrack ? nextTrack : undefined,
    onSwipeRight: () => {
      hapticImpact("light");
      seek(Math.max(0, currentTime - 10));
    },
    swipeThreshold: 40,
  });

  // Bottom offset uses the canonical `--bottom-nav-h` published by MainLayout
  // so the player always sits above the TabBar without re-deriving heights.
  // On desktop / mobile-landscape the nav var is 0 and we fall back to 1rem.
  const bottomBase = isDesktop || isMobileLandscape ? "1rem" : "calc(var(--bottom-nav-h, 64px) + 0.5rem)";
  const bottomStyle: React.CSSProperties = {
    bottom: `calc(${bottomBase} + max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px), 0.25rem))`,
  };

  // Like state from track (may not be loaded in queue items)
  const isLiked = Boolean((track as any).is_liked);

  const Cover = (
    <UnifiedTrackMenu
      track={track}
      trigger={
        <div
          className="relative flex-shrink-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          role="button"
          tabIndex={0}
          aria-label={`Меню трека: ${track.title || "Без названия"}`}
        >
          {track.cover_url ? (
            <motion.img
              src={track.cover_url}
              alt={track.title || "Обложка трека"}
              className={cn(
                "rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-primary/30 transition-all",
                variant === "desktop" ? "w-14 h-14" : variant === "mid" ? "w-11 h-11" : "w-12 h-12",
              )}
              animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ) : (
            <div
              className={cn(
                "rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-primary/30 transition-all",
                variant === "desktop" ? "w-14 h-14" : variant === "mid" ? "w-11 h-11" : "w-12 h-12",
              )}
            >
              <Music2 className="w-5 h-5 text-primary/60" aria-hidden="true" />
            </div>
          )}
          {isPlaying && (
            <motion.div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              aria-hidden="true"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-primary rounded-full"
                  animate={{ height: [3, 8, 3] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          )}
        </div>
      }
    />
  );

  const TitleBlock = (
    <div
      onClick={handleExpand}
      onKeyDown={handleExpandKey}
      className="flex-1 min-w-0 text-left cursor-pointer py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
      role="button"
      tabIndex={0}
      aria-label={`Развернуть плеер: ${track.title || "Без названия"}`}
      data-testid="compact-player-expand"
    >
      <p className={cn("font-medium line-clamp-1", variant === "desktop" ? "text-base" : "text-sm")}>
        {track.title || "Без названия"}
      </p>
      <p className={cn("text-muted-foreground line-clamp-1", variant === "desktop" ? "text-sm" : "text-xs")}>
        {track.style || "Без стиля"}
      </p>
    </div>
  );

  const PlayButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePlayPause}
      className={cn(
        "rounded-full bg-primary/10 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all",
        variant === "desktop" ? "h-12 w-12" : "h-11 w-11",
        "min-h-[44px] min-w-[44px]",
      )}
      aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
      data-testid="compact-player-play"
    >
      {isPlaying ? (
        <Pause className={cn(variant === "desktop" ? "h-6 w-6" : "h-5 w-5")} fill="currentColor" />
      ) : (
        <Play className={cn("ml-0.5", variant === "desktop" ? "h-6 w-6" : "h-5 w-5")} fill="currentColor" />
      )}
    </Button>
  );

  const NextButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleNextTrack}
      disabled={!hasNextTrack}
      className={cn(
        "h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 hover:scale-105 active:scale-95 transition-all",
        !hasNextTrack && "opacity-40",
      )}
      aria-label="Следующий трек"
    >
      <SkipForward className="h-4 w-4" />
    </Button>
  );

  const PrevButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePrevTrack}
      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 hover:scale-105 active:scale-95 transition-all"
      aria-label="Предыдущий трек"
    >
      <SkipBack className="h-4 w-4" />
    </Button>
  );

  const CloseButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClose}
      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-destructive/15 hover:text-destructive active:scale-95 transition-all"
      aria-label="Закрыть плеер"
      data-testid="compact-player-close"
    >
      <X className="h-4 w-4" />
    </Button>
  );

  const LikeButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLike}
      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 active:scale-95 transition-all"
      aria-label={isLiked ? "Убрать из избранного" : "В избранное"}
    >
      <Heart className={cn("h-4 w-4", isLiked && "fill-primary text-primary")} />
    </Button>
  );

  const VolumePopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 transition-all"
          aria-label="Громкость"
        >
          {volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : volume < 0.5 ? (
            <Volume1 className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-44 p-3" onClick={(e) => e.stopPropagation()}>
        <Slider
          value={[Math.round(volume * 100)]}
          onValueChange={(v) => setVolume(v[0] / 100)}
          min={0}
          max={100}
          step={1}
          aria-label="Уровень громкости"
        />
        <div className="mt-2 text-xs text-muted-foreground text-center tabular-nums">{Math.round(volume * 100)}%</div>
      </PopoverContent>
    </Popover>
  );

  const ExpandButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExpand}
      className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 transition-all"
      aria-label="Развернуть плеер"
    >
      <ChevronUp className="h-4 w-4" />
    </Button>
  );

  const Waveform = ({ heightClass }: { heightClass: string }) => (
    <div className={cn("flex-1 min-w-0", heightClass)}>
      <WaveformProgressBar
        audioUrl={track.streaming_url || track.audio_url}
        trackId={track.id}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        buffered={buffered}
        mode="minimal"
        showLabels={false}
        className="pointer-events-auto"
      />
    </div>
  );

  // ---- Layout per variant -----------------------------------------------
  let body: React.ReactNode;
  let maxWidth = "max-w-2xl";

  if (variant === "mobile") {
    body = (
      <>
        <div
          onClick={handleExpand}
          onKeyDown={handleExpandKey}
          className="px-3 pt-3 pb-1.5 cursor-pointer min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
          role="button"
          tabIndex={0}
          aria-label="Развернуть плеер"
        >
          <Waveform heightClass="h-6" />
          <motion.div
            className="ml-2 flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: showExpandHint ? 0.6 : 0.35 }}
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
        <div className="flex items-center gap-2 px-3 pb-3">
          {Cover}
          {TitleBlock}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {PlayButton}
            {NextButton}
            {CloseButton}
          </div>
        </div>
      </>
    );
  } else if (variant === "mid") {
    maxWidth = "max-w-3xl";
    body = (
      <div className="flex items-center gap-3 px-3 py-2.5">
        {Cover}
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          {TitleBlock}
          <Waveform heightClass="h-5" />
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {PlayButton}
          {NextButton}
          {CloseButton}
        </div>
      </div>
    );
  } else {
    maxWidth = "max-w-5xl";
    body = (
      <div className="flex items-center gap-4 px-4 py-2.5">
        {Cover}
        <div className="min-w-[160px] max-w-[220px]">{TitleBlock}</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {PrevButton}
          {PlayButton}
          {NextButton}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right flex-shrink-0">
          {formatTime(currentTime)}
        </span>
        <Waveform heightClass="h-8" />
        <span className="text-xs text-muted-foreground tabular-nums w-10 flex-shrink-0">{formatTime(duration)}</span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {LikeButton}
          {VolumePopover}
          {ExpandButton}
          {CloseButton}
        </div>
      </div>
    );
  }

  // Edge-rail offset when sidebar/rail is present (left padding so dock
  // doesn't tuck under the rail).
  const horizontalPadding: React.CSSProperties = {
    paddingLeft: isMobileLandscape ? "max(3.75rem, env(safe-area-inset-left, 0px))" : undefined,
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 right-0 z-player px-3 sm:px-4"
      style={{ ...bottomStyle, ...horizontalPadding }}
      role="region"
      aria-label="Музыкальный плеер"
      data-testid="compact-player"
      {...gestureHandlers}
      onMouseEnter={() => setShowExpandHint(true)}
      onMouseLeave={() => setShowExpandHint(false)}
    >
      <motion.div
        className={cn(
          "w-full mx-auto",
          maxWidth,
          glass.card,
          "shadow-lg shadow-black/10",
          "flex flex-col overflow-hidden",
          "touch-manipulation",
        )}
      >
        {body}
      </motion.div>
    </motion.div>
  );
});
