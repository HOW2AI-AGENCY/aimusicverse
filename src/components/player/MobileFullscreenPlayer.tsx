/**
 * Mobile Fullscreen Player
 *
 * Redesigned fullscreen player optimized for mobile devices.
 * Features:
 * - Blurred album cover background
 * - Synchronized lyrics with word highlighting (improved sync)
 * - Large touch-friendly controls
 * - Audio visualizer with equalizer
 * - Clear timeline visualization
 */

import { lazy, Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ListMusic, ChevronLeft, ChevronRight, Mic2, Music2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { PlayerProgress } from "./PlayerProgress";
import { Track } from "@/types/track";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useAudioTime } from "@/hooks/audio/useAudioTime";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useGlobalAudioPlayer } from "@/hooks/audio/useGlobalAudioPlayer";
import { useAudioVisualizer } from "@/hooks/audio/useAudioVisualizer";
import { useLyricsSynchronization } from "@/hooks/lyrics/useLyricsSynchronization";
import { useParsedLyrics } from "@/hooks/lyrics/useParsedLyrics";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { usePrefetchTrackCovers } from "@/hooks/audio/usePrefetchTrackCovers";
import { usePrefetchNextAudio } from "@/hooks/audio/usePrefetchNextAudio";
import { SynchronizedWord } from "@/components/lyrics/SynchronizedWord";
import { FullscreenBackground } from "./FullscreenBackground";
import { VersionSwitcher } from "./VersionSwitcher";
import { UnifiedPlayerControls } from "./UnifiedPlayerControls";
import { PlayerActionsBar } from "./PlayerActionsBar";
import { DoubleTapSeekFeedback } from "./DoubleTapSeekFeedback";
import { PlayerGestureHints } from "./PlayerGestureHints";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import { glassButton } from "@/lib/glass";
import { motion, AnimatePresence, PanInfo } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { logger } from "@/lib/logger";
import { useKeyboardGestureControls } from "@/hooks/useKeyboardGestureControls";
import "@/styles/lyrics-sync.css";

const FullscreenVisualizer = lazy(() =>
  import("./FullscreenVisualizer").then((module) => ({ default: module.FullscreenVisualizer })),
);
const QueueSheet = lazy(() => import("./QueueSheet").then((module) => ({ default: module.QueueSheet })));
const KaraokeView = lazy(() => import("./KaraokeView").then((module) => ({ default: module.KaraokeView })));

// Swipe thresholds
const DRAG_CLOSE_THRESHOLD = 100; // px distance for vertical close
const VELOCITY_THRESHOLD = 500; // px/s velocity for vertical close
const HORIZONTAL_SWIPE_THRESHOLD = 80; // px distance for track switch
const HORIZONTAL_VELOCITY_THRESHOLD = 400; // px/s velocity for track switch

// Double-tap seek constants
const DOUBLE_TAP_DELAY = 300; // ms between taps
const SEEK_AMOUNT = 10; // seconds to seek

interface MobileFullscreenPlayerProps {
  track: Track;
  onClose: () => void;
  /** Optional master/active version used to source lyrics & suno IDs for correct sync. */
  currentVersion?: {
    suno_task_id?: string | null;
    suno_id?: string | null;
    lyrics?: string | null;
  } | null;
}

export function MobileFullscreenPlayer({ track, onClose, currentVersion }: MobileFullscreenPlayerProps) {
  const navigate = useNavigate();
  const [queueOpen, setQueueOpen] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [horizontalDragOffset, setHorizontalDragOffset] = useState(0);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const isProgrammaticScrollRef = useRef(false);

  // Telegram BackButton integration - closes fullscreen player
  useTelegramBackButton({
    onClick: onClose,
    visible: true,
  });
  const { currentTime, duration, seek } = useAudioTime();
  const {
    isPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    repeat,
    shuffle,
    toggleRepeat,
    toggleShuffle,
    volume,
    preservedTime,
    clearPreservedTime,
    queue,
    currentIndex,
  } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();

  // Keyboard gesture controls for desktop accessibility
  useKeyboardGestureControls({
    seekAmount: SEEK_AMOUNT,
    onSeekForward: () => seek(Math.min(duration, currentTime + SEEK_AMOUNT)),
    onSeekBackward: () => seek(Math.max(0, currentTime - SEEK_AMOUNT)),
    onNextTrack: nextTrack,
    onPrevTrack: previousTrack,
    onTogglePlay: () => (isPlaying ? pauseTrack() : playTrack(track)),
    onClose,
  });

  // Prefetch covers for smooth transitions
  usePrefetchTrackCovers(queue, currentIndex, { count: 3 });

  // Prefetch next audio for instant track switching
  usePrefetchNextAudio(queue, currentIndex, { enabled: true });

  // Get audio URL for waveform
  const audioUrl = useMemo(() => {
    return track.streaming_url || track.audio_url;
  }, [track.streaming_url, track.audio_url]);

  // Restore preserved time on mount (from mode switch)
  useEffect(() => {
    if (preservedTime !== null && audioElement && !isNaN(preservedTime)) {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        if (audioElement && preservedTime !== null) {
          audioElement.currentTime = preservedTime;
          clearPreservedTime();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [preservedTime, audioElement, clearPreservedTime]);

  // CRITICAL: Resume AudioContext and ensure audio routing when fullscreen opens
  // With blob URL recovery for format errors
  useEffect(() => {
    let mounted = true;
    let hasRecovered = false;

    const ensureAudio = async () => {
      if (!audioElement || !mounted) {
        logger.warn("No audio element available on fullscreen open");
        return;
      }

      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");

        // Resume AudioContext
        const resumed = await resumeAudioContext(3);
        if (!resumed) {
          logger.warn("Failed to resume AudioContext on fullscreen open");
        }

        // Ensure audio is routed to destination
        await ensureAudioRoutedToDestination();

        // Sync volume with audio element
        if (audioElement && mounted) {
          audioElement.volume = volume;

          const audioSrc = audioElement.src;
          const isBlobSource = audioSrc?.startsWith("blob:");
          const canonicalUrl = track.streaming_url || track.audio_url;

          // Try to resume playback
          if (isPlaying && audioElement.paused && audioSrc) {
            logger.info("Attempting to resume audio on mobile fullscreen open", {
              isBlobSource,
              src: audioSrc.substring(0, 60),
            });

            try {
              await audioElement.play();
              logger.info("Mobile fullscreen playback resumed successfully");
            } catch (playErr) {
              const error = playErr as Error;

              // If blob URL fails with format error, recover with canonical URL
              if (
                (error.name === "NotSupportedError" || audioElement.error?.code === 4) &&
                isBlobSource &&
                canonicalUrl &&
                !hasRecovered
              ) {
                hasRecovered = true;
                logger.info("Blob URL failed, recovering with canonical URL", {
                  canonicalUrl: canonicalUrl.substring(0, 60),
                });

                const currentTime = preservedTime ?? audioElement.currentTime;
                audioElement.src = canonicalUrl;
                audioElement.load();

                // Wait for audio to be ready, then restore position and play
                audioElement.addEventListener(
                  "canplay",
                  async function onCanPlay() {
                    audioElement.removeEventListener("canplay", onCanPlay);
                    if (!mounted) return;

                    if (currentTime > 0 && !isNaN(currentTime)) {
                      audioElement.currentTime = currentTime;
                    }
                    clearPreservedTime();

                    try {
                      await audioElement.play();
                      logger.info("Mobile playback recovered successfully after blob error");
                    } catch (retryErr) {
                      logger.error("Mobile recovery play failed", retryErr);
                    }
                  },
                  { once: true },
                );

                return;
              }

              if (error.name !== "AbortError") {
                logger.error("Failed to resume audio on mobile fullscreen", playErr);
              }
            }
          }

          logger.info("Mobile fullscreen player audio initialized", {
            volume,
            isPlaying,
            audioPaused: audioElement.paused,
            hasAudioElement: true,
            isBlobSource,
          });
        }
      } catch (err) {
        logger.error("Error initializing fullscreen audio", err);
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(ensureAudio, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Audio visualizer data — lazy-enabled, so fullscreen opens without RAF pressure.
  const visualizerData = useAudioVisualizer(showVisualizer ? audioElement : null, showVisualizer && isPlaying, {
    barCount: 32,
    smoothing: 0.75,
  });

  // Prefer master/active version's suno IDs and lyrics when provided (correct A/B sync)
  const sunoTaskId = currentVersion?.suno_task_id ?? track.suno_task_id ?? null;
  const sunoId = currentVersion?.suno_id ?? track.suno_id ?? null;
  const trackLyrics = currentVersion?.lyrics ?? track.lyrics ?? null;

  const { data: lyricsData } = useTimestampedLyrics(sunoTaskId, sunoId);

  // Parse lyrics using extracted hook
  const { lyricsLines, plainLyrics } = useParsedLyrics(lyricsData?.alignedWords, trackLyrics);

  // Flatten words from parsed lines for synchronization hook
  const flattenedWords = useMemo(() => {
    if (!lyricsLines) return [];
    return lyricsLines.flat();
  }, [lyricsLines]);

  // Use unified synchronization hook for precise timing
  // Enable when we have lyrics (sync works even when paused for highlighting)
  const {
    activeLineIndex,
    activeWordIndex,
    currentTime: syncedTime,
    isWordActive,
    isWordPast,
    constants,
  } = useLyricsSynchronization({
    words: flattenedWords,
    enabled: !!lyricsLines?.length,
  });

  // Handle user scroll detection
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Ignore programmatic scrolls
      if (isProgrammaticScrollRef.current) return;

      const currentScrollTop = container.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);

      if (scrollDelta > 5) {
        setUserScrolling(true);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Increased timeout to 5 seconds for better UX
        scrollTimeoutRef.current = setTimeout(() => {
          setUserScrolling(false);
        }, 5000);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    const handleTouchStart = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleTouchEnd = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Increased timeout to 5 seconds
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 5000);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to active word/line - keep in upper third of screen
  // Works both when playing AND paused (highlighting should persist)
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsContainerRef.current || userScrolling) return;

    // Only auto-scroll when playing, but highlighting still works when paused
    if (!isPlaying) return;

    const container = lyricsContainerRef.current;

    // Try word-level scroll first for more precision
    const activeWord = container.querySelector(`[data-word-index="${activeWordIndex}"]`) as HTMLElement;
    const activeLine = activeLineRef.current;
    const targetElement = activeWord || activeLine;

    if (!targetElement) return;

    // Use requestAnimationFrame for smoother scroll timing
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();

      // Calculate where the element currently is relative to container
      const elementTopInContainer = elementRect.top - containerRect.top + container.scrollTop;

      // Target: position active element at 30% from top of visible area
      const targetScrollTop = elementTopInContainer - containerRect.height * 0.3;

      // Check if element is already roughly in view (between 20%-50% from top)
      const currentElementPos = elementRect.top - containerRect.top;
      const isInView = currentElementPos > containerRect.height * 0.2 && currentElementPos < containerRect.height * 0.5;

      // Only scroll if element is not already in the target area
      if (!isInView) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });

        // Reset programmatic flag after scroll completes
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    });
  }, [activeLineIndex, activeWordIndex, userScrolling, isPlaying]);

  const handleWordClick = (startTime: number) => {
    hapticImpact("light");
    seek(startTime);
  };

  // Vertical swipe-to-close handler (for header area)
  const handleVerticalDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { velocity, offset } = info;

      // Close if dragged down far enough or fast enough
      if (offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
        hapticImpact("light");
        onClose();
      }
    },
    [onClose],
  );

  // Horizontal swipe for track switching (Spotify/Apple Music style)
  const handleHorizontalDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { velocity, offset } = info;
      setHorizontalDragOffset(0);

      // Swipe left = next track
      if (offset.x < -HORIZONTAL_SWIPE_THRESHOLD || velocity.x < -HORIZONTAL_VELOCITY_THRESHOLD) {
        hapticImpact("medium");
        nextTrack();
        return;
      }

      // Swipe right = previous track
      if (offset.x > HORIZONTAL_SWIPE_THRESHOLD || velocity.x > HORIZONTAL_VELOCITY_THRESHOLD) {
        hapticImpact("medium");
        previousTrack();
        return;
      }
    },
    [nextTrack, previousTrack],
  );

  // Track horizontal drag for visual feedback
  const handleHorizontalDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setHorizontalDragOffset(info.offset.x);
  }, []);

  // Double-tap seek handler (like YouTube/TikTok)
  const handleDoubleTapSeek = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const now = Date.now();
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX === undefined) return;

      const screenWidth = window.innerWidth;
      const isLeftSide = clientX < screenWidth / 2;

      // Check for double-tap
      if (now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        e.stopPropagation();

        const seekDelta = isLeftSide ? -SEEK_AMOUNT : SEEK_AMOUNT;
        const newTime = Math.max(0, Math.min(currentTime + seekDelta, duration));

        seek(newTime);
        hapticImpact("medium");

        // Visual feedback
        setDoubleTapSide(isLeftSide ? "left" : "right");
        setTimeout(() => setDoubleTapSide(null), 500);

        lastTapRef.current = { time: 0, x: 0 };
      } else {
        lastTapRef.current = { time: now, x: clientX };
      }
    },
    [currentTime, duration, seek],
  );

  return (
    <motion.div
      initial={{ opacity: 1, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-fullscreen flex flex-col overflow-hidden bg-background"
      data-testid="mobile-fullscreen-player"
    >
      {/* Drag Handle Indicator - visual swipe-to-close zone */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.5 }}
        onDragEnd={handleVerticalDragEnd}
        className="absolute top-0 left-0 right-0 h-14 z-20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-manipulation"
        aria-label="Потяните вниз чтобы закрыть"
      >
        {/* Visible drag indicator */}
        <motion.div
          className="w-12 h-1.5 bg-muted-foreground/40 rounded-full mt-3 shadow-sm"
          whileHover={{ width: 48, backgroundColor: "hsl(var(--muted-foreground) / 0.6)" }}
          whileTap={{ width: 56, backgroundColor: "hsl(var(--primary) / 0.6)" }}
          transition={{ duration: 0.2 }}
        />
        <span className="text-[10px] text-muted-foreground/50 mt-1">↓ свайп</span>
      </motion.div>
      <FullscreenBackground coverUrl={track.cover_url} />

      {/* Content */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header with glass effect - Telegram safe area */}
        <motion.header
          className="grid grid-cols-[44px_minmax(0,1fr)_88px] items-center gap-2 px-4 pb-2"
          style={{
            paddingTop:
              "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.75rem)",
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact("light");
                onClose();
              }}
              className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
              aria-label="Закрыть плеер"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div
            className="min-w-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="truncate font-display text-[16px] font-semibold leading-tight text-foreground">
              {track.title || "Без названия"}
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground/80">{track.style || ""}</p>
            <div className="mt-1 flex justify-center">
              <VersionSwitcher track={track} size="compact" />
            </div>
          </motion.div>

          <div className="flex items-center justify-end gap-1">
            {/* Karaoke mode button */}
            {lyricsLines && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact("light");
                    setKaraokeMode(true);
                  }}
                  className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
                  aria-label="Режим караоке"
                >
                  <Mic2 className="h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {/* Queue button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact("light");
                  setQueueOpen(true);
                }}
                className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
                aria-label="Открыть очередь"
              >
                <ListMusic className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Lyrics Section with Horizontal Swipe and Double-Tap Seek */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.2, right: 0.2 }}
          onDrag={handleHorizontalDrag}
          onDragEnd={handleHorizontalDragEnd}
          onTouchStart={handleDoubleTapSeek}
          className="flex-1 relative min-h-0 flex flex-col touch-pan-y"
        >
          {/* Double-tap seek feedback */}
          <AnimatePresence>
            {doubleTapSide && <DoubleTapSeekFeedback side={doubleTapSide} seekAmount={SEEK_AMOUNT} />}
          </AnimatePresence>
          {/* Swipe indicators */}
          <AnimatePresence>
            {Math.abs(horizontalDragOffset) > 20 && (
              <>
                {horizontalDragOffset > 20 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: Math.min(horizontalDragOffset / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                  >
                    <ChevronLeft className="w-8 h-8 text-muted-foreground" />
                  </motion.div>
                )}
                {horizontalDragOffset < -20 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: Math.min(Math.abs(horizontalDragOffset) / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6,
                    }}
                    exit={{ opacity: 0 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-muted-foreground" />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

          {/* User scroll indicator with re-enable button */}
          <AnimatePresence>
            {userScrolling && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 right-2 z-10 flex items-center gap-2"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUserScrolling(false)}
                  className="h-7 px-2 text-xs bg-muted/90 backdrop-blur-sm"
                >
                  Вкл. автоскролл
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            ref={lyricsContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3"
            style={{
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            {lyricsLines ? (
              // Synchronized lyrics with improved timing using useLyricsSynchronization
              <div className="flex flex-col items-center text-center space-y-1 pb-32 lyrics-container-enter">
                {(() => {
                  let globalWordIndex = 0;
                  return lyricsLines.map((line, lineIndex) => {
                    const isActiveLine = lineIndex === activeLineIndex;
                    const isPastLine = activeLineIndex > -1 && lineIndex < activeLineIndex;
                    const lineStart = line[0]?.startS ?? 0;

                    return (
                      <motion.div
                        key={lineIndex}
                        ref={isActiveLine ? activeLineRef : null}
                        onClick={() => handleWordClick(lineStart)}
                        animate={{
                          scale: isActiveLine ? 1.02 : 1,
                          opacity: isActiveLine ? 1 : isPastLine ? 0.35 : 0.5,
                        }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                          "px-3 py-1 rounded-lg cursor-pointer w-full lyric-line",
                          "will-change-[transform,opacity,background-color] transform-gpu",
                          isActiveLine && "bg-primary/10 lyric-line--active",
                        )}
                      >
                        <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                          {line.map((word, wordIndex) => {
                            const currentGlobalIndex = globalWordIndex++;
                            // Use sync hook's look-ahead timing
                            const adjustedTime = syncedTime + constants.WORD_LOOK_AHEAD_MS / 1000;
                            const endTolerance = constants.WORD_END_TOLERANCE_MS / 1000;
                            const isActiveWord =
                              isActiveLine && adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance;
                            const isPastWord = syncedTime > word.endS + endTolerance;

                            return (
                              <SynchronizedWord
                                key={`${lineIndex}-${wordIndex}-${word.startS}`}
                                word={word.word}
                                isActive={isActiveWord}
                                isPast={isPastWord}
                                data-word-index={currentGlobalIndex}
                                className="text-lg font-medium"
                                activeClassName="text-primary scale-110 font-bold"
                                pastClassName="text-foreground/70"
                                futureClassName="text-foreground/50"
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            ) : plainLyrics ? (
              // Plain text lyrics
              <div className="flex min-h-full items-center justify-center">
                <p className="whitespace-pre-wrap text-center text-lg leading-relaxed text-foreground/90">
                  {plainLyrics}
                </p>
              </div>
            ) : (
              <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
                {track.cover_url ? (
                  <LazyImage
                    src={track.cover_url}
                    alt={track.title || "Обложка трека"}
                    coverSize="large"
                    priority
                    aspectRatio="1/1"
                    containerClassName="h-[min(58vw,15rem)] w-[min(58vw,15rem)] rounded-2xl bg-muted/40 shadow-xl shadow-black/15 ring-1 ring-border/40"
                    className="h-full w-full rounded-2xl object-cover"
                    width={320}
                    height={320}
                    fallback={<Music2 className="h-12 w-12 text-muted-foreground/60" aria-hidden />}
                  />
                ) : (
                  <div className="flex h-[min(58vw,15rem)] w-[min(58vw,15rem)] items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/40">
                    <Music2 className="h-12 w-12 text-muted-foreground/60" aria-hidden />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Текст песни недоступен</p>
              </div>
            )}
          </div>
        </motion.div>

        <Suspense fallback={null}>
          {showVisualizer && (
            <FullscreenVisualizer show={showVisualizer} isPlaying={isPlaying} visualizerData={visualizerData} />
          )}
        </Suspense>

        {/* Controls Section — lighter, safe-area aware */}
        <motion.div
          className={cn(
            "relative space-y-3 border-t border-border/40 px-4 pt-3",
            "bg-background/90 backdrop-blur-xl",
          )}
          style={{
            paddingBottom:
              "calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))",
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Subtle glow strip at the top edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
          {/* Unified waveform timeline */}
          <div data-testid="player-timeline">
            <PlayerProgress
              audioUrl={audioUrl}
              trackId={track.id}
              currentTime={currentTime}
              duration={duration}
              onSeek={(time) => seek(time)}
              density="fullscreen"
              mode="standard"
              showBeatGrid={false}
              showLabels
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                hapticImpact("light");
                setShowVisualizer((prev) => !prev);
              }}
              className={cn("h-8 rounded-full px-3 text-xs", showVisualizer && "bg-primary/15 text-primary")}
              aria-label={showVisualizer ? "Скрыть визуализацию" : "Показать визуализацию"}
            >
              Визуализация
            </Button>
          </div>

          <div data-testid="player-transport">
            <UnifiedPlayerControls
              variant="fullscreen"
              size="md"
              showVolume={false}
              showShuffleRepeat={true}
              showSeekButtons={false}
              seekSeconds={10}
            />
          </div>

          <PlayerActionsBar track={track} variant="horizontal" size="sm" showStudioButton={false} />
        </motion.div>
      </div>

      {/* First-run gesture cheatsheet */}
      <PlayerGestureHints />

      {/* Queue Sheet */}
      <Suspense fallback={null}>{queueOpen && <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />}</Suspense>

      {/* Karaoke Mode */}
      <AnimatePresence>
        {karaokeMode && lyricsLines && (
          <Suspense fallback={null}>
            <KaraokeView
              lyricsLines={lyricsLines}
              currentTime={syncedTime}
              isPlaying={isPlaying}
              activeLineIndex={activeLineIndex}
              onClose={() => setKaraokeMode(false)}
              onSeek={handleWordClick}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
