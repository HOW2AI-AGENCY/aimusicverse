import React, { useCallback, useEffect } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { getGlobalAudioRef } from "@/hooks/audio/useAudioTime";
import { AnimatePresence } from "@/lib/motion";
import { logger } from "@/lib/logger";

// Lazy load player surfaces
const CompactPlayer = React.lazy(() => import("./player/CompactPlayer").then((m) => ({ default: m.CompactPlayer })));
const FullscreenPlayer = React.lazy(() =>
  import("./player/FullscreenPlayer").then((m) => ({ default: m.FullscreenPlayer })),
);

export const ResizablePlayer = () => {
  const { activeTrack, closePlayer, playerMode, setPlayerMode, preserveTime, volume, isPlaying } = usePlayerStore();

  // Preserve current time before mode switch to avoid audio restart
  const preserveCurrentTime = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (audio && !isNaN(audio.currentTime) && audio.currentTime > 0) {
      logger.debug("Preserving playback time for mode switch", { time: audio.currentTime });
      preserveTime(audio.currentTime);
    }
  }, [preserveTime]);

  // Ensure audio context is ready when player mode changes
  useEffect(() => {
    if (playerMode === "minimized" || !activeTrack) return;

    const ensureAudioReady = async () => {
      const audio = getGlobalAudioRef();
      if (!audio) return;

      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");

        const resumed = await resumeAudioContext(3);
        if (!resumed) {
          logger.warn("AudioContext resume failed during mode change");
        }

        await ensureAudioRoutedToDestination();

        if (audio.volume !== volume) {
          audio.volume = volume;
        }

        // Resume playback if it should be playing
        if (isPlaying && audio.paused && audio.src) {
          logger.info("Resuming playback after mode switch");
          try {
            await audio.play();
          } catch (playErr) {
            logger.error("Failed to resume playback after mode switch", playErr);
          }
        }

        logger.debug("Audio ready after mode change", {
          mode: playerMode,
          isPlaying,
          audioPaused: audio.paused,
          volume: audio.volume,
        });
      } catch (err) {
        logger.error("Error ensuring audio on mode change", err);
      }
    };

    const timer = setTimeout(ensureAudioReady, 150);
    return () => clearTimeout(timer);
  }, [playerMode, activeTrack, volume, isPlaying]);

  const handleMaximize = useCallback(() => {
    preserveCurrentTime();
    setPlayerMode("fullscreen");
  }, [preserveCurrentTime, setPlayerMode]);

  const handleMinimize = useCallback(() => {
    preserveCurrentTime();
    setPlayerMode("compact");
  }, [preserveCurrentTime, setPlayerMode]);

  if (!activeTrack) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <AnimatePresence mode="wait">
        {/* Compact mode - minimal bottom bar */}
        {playerMode === "compact" && <CompactPlayer key="compact" track={activeTrack} onExpand={handleMaximize} />}

        {/* Fullscreen mode - unified entry, dispatches to mobile/desktop layout internally */}
        {playerMode === "fullscreen" && (
          <FullscreenPlayer key="fullscreen" track={activeTrack} onClose={handleMinimize} />
        )}
      </AnimatePresence>
    </React.Suspense>
  );
};
