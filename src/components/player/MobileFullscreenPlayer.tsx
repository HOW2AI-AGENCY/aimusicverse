/** Mobile Fullscreen Player - composes subcomponents for the fullscreen mobile experience. */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAudioTime } from "@/hooks/audio/useAudioTime";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useGlobalAudioPlayer } from "@/hooks/audio/useGlobalAudioPlayer";
import { useAudioVisualizer } from "@/hooks/audio/useAudioVisualizer";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useLyricsSynchronization } from "@/hooks/lyrics/useLyricsSynchronization";
import { useParsedLyrics } from "@/hooks/lyrics/useParsedLyrics";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { usePrefetchTrackCovers } from "@/hooks/audio/usePrefetchTrackCovers";
import { usePrefetchNextAudio } from "@/hooks/audio/usePrefetchNextAudio";
import { FullscreenBackground } from "./FullscreenBackground";
import { FullscreenVisualizer } from "./FullscreenVisualizer";
import { PlayerTrackInfo } from "./PlayerTrackInfo";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgress } from "./PlayerProgress";
import { PlayerActions } from "./PlayerActions";
import { Track } from "@/types/track";
import { motion, PanInfo } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { logger } from "@/lib/logger";
import "@/styles/lyrics-sync.css";

// Swipe thresholds
const DRAG_CLOSE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

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
  const [queueOpen, setQueueOpen] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [karaokeMode, setKaraokeMode] = useState(false);

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
    volume,
    preservedTime,
    clearPreservedTime,
    queue,
    currentIndex,
  } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();

  usePrefetchTrackCovers(queue, currentIndex, { count: 3 });
  usePrefetchNextAudio(queue, currentIndex, { enabled: true });

  const audioUrl = useMemo(() => track.streaming_url || track.audio_url, [track.streaming_url, track.audio_url]);

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

        const resumed = await resumeAudioContext(3);
        if (!resumed) {
          logger.warn("Failed to resume AudioContext on fullscreen open");
        }

        await ensureAudioRoutedToDestination();

        if (audioElement && mounted) {
          audioElement.volume = volume;

          const audioSrc = audioElement.src;
          const isBlobSource = audioSrc?.startsWith("blob:");
          const canonicalUrl = track.streaming_url || track.audio_url;

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

    const timer = setTimeout(ensureAudio, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visualizerData = useAudioVisualizer(audioElement, isPlaying, { barCount: 48, smoothing: 0.75 });

  const sunoTaskId = currentVersion?.suno_task_id ?? track.suno_task_id ?? null;
  const sunoId = currentVersion?.suno_id ?? track.suno_id ?? null;
  const trackLyrics = currentVersion?.lyrics ?? track.lyrics ?? null;
  const { data: lyricsData } = useTimestampedLyrics(sunoTaskId, sunoId);
  const { lyricsLines, plainLyrics } = useParsedLyrics(lyricsData?.alignedWords, trackLyrics);

  const flattenedWords = useMemo(() => {
    if (!lyricsLines) return [];
    return lyricsLines.flat();
  }, [lyricsLines]);

  const {
    activeLineIndex,
    activeWordIndex,
    currentTime: syncedTime,
    constants,
  } = useLyricsSynchronization({
    words: flattenedWords,
    enabled: !!lyricsLines?.length,
  });

  const handleWordClick = (t: number) => {
    hapticImpact("light");
    seek(t);
  };

  // Vertical swipe-to-close handler
  const handleVerticalDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-fullscreen flex flex-col bg-background overflow-hidden"
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
        <PlayerTrackInfo
          track={track}
          showVisualizer={showVisualizer}
          onToggleVisualizer={() => setShowVisualizer((prev) => !prev)}
          hasLyrics={!!lyricsLines}
          onKaraokeMode={() => setKaraokeMode(true)}
          onQueueOpen={() => setQueueOpen(true)}
          onClose={onClose}
        />

        <PlayerControls
          lyricsLines={lyricsLines}
          plainLyrics={plainLyrics}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          syncState={{ activeLineIndex, activeWordIndex, syncedTime, constants }}
          onSeek={seek}
          onNextTrack={nextTrack}
          onPreviousTrack={previousTrack}
        />

        <FullscreenVisualizer show={showVisualizer} isPlaying={isPlaying} visualizerData={visualizerData} />

        <PlayerProgress track={track} audioUrl={audioUrl} currentTime={currentTime} duration={duration} onSeek={seek} />
      </div>

      <PlayerActions
        queueOpen={queueOpen}
        onQueueOpenChange={setQueueOpen}
        karaokeMode={karaokeMode}
        onKaraokeModeClose={() => setKaraokeMode(false)}
        lyricsLines={lyricsLines}
        syncedTime={syncedTime}
        isPlaying={isPlaying}
        activeLineIndex={activeLineIndex}
        onSeek={handleWordClick}
      />
    </motion.div>
  );
}
