/**
 * MobileFullscreenPlayer
 *
 * Three-page minimalist fullscreen player: Cover ⇄ Lyrics ⇄ Details.
 * Horizontal swipe changes pages (NOT tracks). Vertical swipe-down closes.
 *
 * The audio init logic (AudioContext resume + blob URL recovery) is kept
 * untouched — this redesign is purely presentation.
 */

import { lazy, Suspense, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, ListMusic, Music2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { PlayerProgress } from "./PlayerProgress";
import { FullscreenBackground } from "./FullscreenBackground";
import { UnifiedPlayerControls } from "./UnifiedPlayerControls";
import { FullscreenPager, type PagerPage } from "./FullscreenPager";
import { CoverPage } from "./pages/CoverPage";
import { LyricsPage } from "./pages/LyricsPage";
import { DetailsPage } from "./pages/DetailsPage";
import { Track } from "@/types/track";
import { useAudioTime } from "@/hooks/audio/useAudioTime";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useGlobalAudioPlayer } from "@/hooks/audio/useGlobalAudioPlayer";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { usePrefetchTrackCovers } from "@/hooks/audio/usePrefetchTrackCovers";
import { usePrefetchNextAudio } from "@/hooks/audio/usePrefetchNextAudio";
import { cn } from "@/lib/utils";
import { glassButton } from "@/lib/glass";
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { logger } from "@/lib/logger";
import { perfMark, perfEvent } from "@/lib/perfMarks";
import { useKeyboardGestureControls } from "@/hooks/useKeyboardGestureControls";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useParsedLyrics } from "@/hooks/lyrics/useParsedLyrics";
import { useLyricsSynchronization } from "@/hooks/lyrics/useLyricsSynchronization";
import "@/styles/lyrics-sync.css";

perfMark("fullscreen:moduleEval");

const QueueSheet = lazy(() => import("./QueueSheet").then((m) => ({ default: m.QueueSheet })));
const KaraokeView = lazy(() => import("./KaraokeView").then((m) => ({ default: m.KaraokeView })));

const DRAG_CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;
const SEEK_AMOUNT = 10;

interface MobileFullscreenPlayerProps {
  track: Track;
  onClose: () => void;
  currentVersion?: {
    suno_task_id?: string | null;
    suno_id?: string | null;
    lyrics?: string | null;
  } | null;
}

export function MobileFullscreenPlayer({ track, onClose, currentVersion }: MobileFullscreenPlayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    perfMark("fullscreen:mount");
    const raf = requestAnimationFrame(() => perfEvent("fullscreen", "firstPaint"));
    // Focus the close button so screen-reader and keyboard users land in the dialog.
    const focusTimer = setTimeout(() => closeButtonRef.current?.focus(), 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focusTimer);
    };
  }, []);

  const [page, setPage] = useState<PagerPage>("cover");
  const [queueOpen, setQueueOpen] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState(false);

  useTelegramBackButton({ onClick: onClose, visible: true });


  const { currentTime, duration, seek } = useAudioTime();
  const {
    isPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    volume,
    preservedTime,
    clearPreservedTime,
    queue,
    currentIndex,
  } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();

  useKeyboardGestureControls({
    seekAmount: SEEK_AMOUNT,
    onSeekForward: () => seek(Math.min(duration, currentTime + SEEK_AMOUNT)),
    onSeekBackward: () => seek(Math.max(0, currentTime - SEEK_AMOUNT)),
    onNextTrack: nextTrack,
    onPrevTrack: previousTrack,
    onTogglePlay: () => (isPlaying ? pauseTrack() : playTrack(track)),
    onClose,
  });

  usePrefetchTrackCovers(queue, currentIndex, { count: 3 });
  usePrefetchNextAudio(queue, currentIndex, { enabled: true });

  const audioUrl = useMemo(() => track.streaming_url || track.audio_url, [track.streaming_url, track.audio_url]);

  // Lyrics data — only used here to feed the Karaoke overlay.
  // The active LyricsPage owns its own synchronization loop; running a second
  // useLyricsSynchronization in parallel here causes the active line to flicker
  // because two RAF loops fight over the shared time smoother.
  const sunoTaskId = currentVersion?.suno_task_id ?? track.suno_task_id ?? null;
  const sunoId = currentVersion?.suno_id ?? track.suno_id ?? null;
  const trackLyrics = currentVersion?.lyrics ?? track.lyrics ?? null;
  const { data: lyricsData } = useTimestampedLyrics(sunoTaskId, sunoId);
  const { lyricsLines } = useParsedLyrics(lyricsData?.alignedWords, trackLyrics);
  const flat = useMemo(() => (lyricsLines ? lyricsLines.flat() : []), [lyricsLines]);
  const { activeLineIndex, currentTime: syncedTime } = useLyricsSynchronization({
    words: flat,
    enabled: karaokeMode && !!lyricsLines?.length,
  });

  // Restore preserved time
  useEffect(() => {
    if (preservedTime !== null && audioElement && !isNaN(preservedTime)) {
      const timer = setTimeout(() => {
        if (audioElement && preservedTime !== null) {
          audioElement.currentTime = preservedTime;
          clearPreservedTime();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [preservedTime, audioElement, clearPreservedTime]);

  // Resume AudioContext + blob recovery (preserved)
  useEffect(() => {
    let mounted = true;
    let hasRecovered = false;
    const ensureAudio = async () => {
      if (!audioElement || !mounted) return;
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");
        await resumeAudioContext(3);
        await ensureAudioRoutedToDestination();
        if (audioElement && mounted) {
          audioElement.volume = volume;
          const audioSrc = audioElement.src;
          const isBlobSource = audioSrc?.startsWith("blob:");
          const canonicalUrl = track.streaming_url || track.audio_url;
          if (isPlaying && audioElement.paused && audioSrc) {
            try {
              await audioElement.play();
            } catch (playErr) {
              const error = playErr as Error;
              if (
                (error.name === "NotSupportedError" || audioElement.error?.code === 4) &&
                isBlobSource &&
                canonicalUrl &&
                !hasRecovered
              ) {
                hasRecovered = true;
                const ct = preservedTime ?? audioElement.currentTime;
                audioElement.src = canonicalUrl;
                audioElement.load();
                audioElement.addEventListener(
                  "canplay",
                  async function onCanPlay() {
                    audioElement.removeEventListener("canplay", onCanPlay);
                    if (!mounted) return;
                    if (ct > 0 && !isNaN(ct)) audioElement.currentTime = ct;
                    clearPreservedTime();
                    try {
                      await audioElement.play();
                    } catch (e) {
                      logger.error("Mobile recovery play failed", e);
                    }
                  },
                  { once: true },
                );
                return;
              }
              if (error.name !== "AbortError") logger.error("Failed to resume audio", playErr);
            }
          }
        }
      } catch (e) {
        logger.error("Error initializing fullscreen audio", e);
      }
    };
    const timer = setTimeout(ensureAudio, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerticalDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { velocity, offset } = info;
      if (offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
        hapticImpact("light");
        onClose();
      }
    },
    [onClose],
  );

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0, y: 0 } : { opacity: 1, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: "100%" }}
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : { type: "spring", damping: 30, stiffness: 300 }
      }
      className="fixed inset-0 z-fullscreen flex flex-col overflow-hidden bg-background"
      data-testid="mobile-fullscreen-player"
      role="dialog"
      aria-modal="true"
      aria-label="Полноэкранный плеер"
    >
      <FullscreenBackground coverUrl={track.cover_url} />

      {/* Drag-to-close strip */}
      <motion.div
        drag={prefersReducedMotion ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.5 }}
        onDragEnd={handleVerticalDragEnd}
        className="absolute top-0 left-0 right-0 z-20 flex h-10 cursor-grab items-start justify-center pt-2 active:cursor-grabbing"
        role="button"
        tabIndex={-1}
        aria-label="Потяните вниз чтобы закрыть"
      >
        <div className="h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
      </motion.div>

      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        {/* Header — symmetric 44 / 1fr / 44+44 */}
        <header
          className="grid grid-cols-[44px_minmax(0,1fr)_92px] items-center gap-2 px-4 pb-1 pt-3"
          style={{
            paddingTop:
              "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.75rem)",
          }}
        >
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticImpact("light");
              onClose();
            }}
            className={cn("h-11 w-11 rounded-full touch-manipulation", glassButton.default)}
            aria-label="Закрыть плеер"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="min-w-0 text-center" aria-live="polite">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/60">
              {page === "cover" ? "Сейчас играет" : page === "lyrics" ? "Текст" : "О треке"}
            </p>
          </div>

          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact("light");
                setQueueOpen(true);
              }}
              className={cn("h-11 w-11 rounded-full touch-manipulation", glassButton.default)}
              aria-label="Открыть очередь воспроизведения"
              aria-haspopup="dialog"
              aria-expanded={queueOpen}
            >
              <ListMusic className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        {/* Pager: Cover / Lyrics / Details */}
        <FullscreenPager
          page={page}
          onChange={setPage}
          cover={<CoverPage track={track} />}
          lyrics={
            <LyricsPage
              track={track}
              currentVersion={currentVersion}
              isActive={page === "lyrics"}
              isPlaying={isPlaying}
              onOpenKaraoke={() => setKaraokeMode(true)}
            />
          }
          details={<DetailsPage track={track} />}
        />

        {/* Bottom transport — unified rhythm */}
        <motion.div
          className="relative space-y-3 border-t border-border/40 bg-background/85 px-4 pt-3 backdrop-blur-xl"
          style={{
            paddingBottom:
              "calc(max(var(--tg-safe-area-inset-bottom, 0px) + 0.75rem, env(safe-area-inset-bottom, 0px) + 0.75rem))",
          }}
          initial={prefersReducedMotion ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.15, duration: 0.25 }}
          role="region"
          aria-label="Управление воспроизведением"
        >
          <div data-testid="player-timeline">
            <PlayerProgress
              audioUrl={audioUrl}
              trackId={track.id}
              currentTime={currentTime}
              duration={duration}
              onSeek={(t) => seek(t)}
              density="fullscreen"
              mode="standard"
              showBeatGrid={false}
              showLabels
            />
          </div>

          <div data-testid="player-transport">
            <UnifiedPlayerControls
              variant="fullscreen"
              size="md"
              showVolume={false}
              showShuffleRepeat
              showSeekButtons={false}
              seekSeconds={10}
            />
          </div>
        </motion.div>
      </div>

      {/* Queue Sheet */}
      <Suspense fallback={null}>
        {queueOpen && <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />}
      </Suspense>

      {/* Karaoke */}
      <AnimatePresence>
        {karaokeMode && lyricsLines && (
          <Suspense fallback={null}>
            <KaraokeView
              lyricsLines={lyricsLines}
              currentTime={syncedTime}
              isPlaying={isPlaying}
              activeLineIndex={activeLineIndex}
              onClose={() => setKaraokeMode(false)}
              onSeek={(t) => {
                hapticImpact("light");
                seek(t);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Music2 placeholder — re-exported for tree-shake safety on lazy paths */}
      <span hidden aria-hidden>
        <Music2 className="h-0 w-0" />
      </span>
    </motion.div>
  );
}
