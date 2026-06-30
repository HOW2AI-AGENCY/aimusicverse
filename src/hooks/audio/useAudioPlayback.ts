import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Track } from "@/types/track";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { playerAnalytics } from "@/lib/telemetry";

interface AudioPlaybackOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  isLoadingRef: MutableRefObject<boolean>;
  isPlayingRef: MutableRefObject<boolean>;
  playPromiseRef: MutableRefObject<Promise<void> | null>;
  isPlaying: boolean;
  activeTrack: Track | null;
  volume: number;
  pauseTrack: () => void;
  isStartupPeriod: () => boolean;
}

export function useAudioPlayback({
  audioRef,
  isLoadingRef,
  isPlayingRef,
  playPromiseRef,
  isPlaying,
  activeTrack,
  volume,
  pauseTrack,
  isStartupPeriod,
}: AudioPlaybackOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    let isCleanedUp = false;
    let playTimeoutId: NodeJS.Timeout | null = null;

    const attemptPlay = async () => {
      if (isCleanedUp) return;

      if (isLoadingRef.current) {
        logger.debug("Waiting for audio to load before playing");
        const waitForLoad = new Promise<void>((resolve) => {
          const checkReady = () => {
            if (!isLoadingRef.current || audio.readyState >= 2) {
              resolve();
              return;
            }
            setTimeout(checkReady, 50);
          };
          checkReady();
        });
        await Promise.race([waitForLoad, new Promise((resolve) => setTimeout(resolve, 3000))]);
      }

      logger.debug("Attempting to play", {
        trackId: activeTrack?.id,
        readyState: audio.readyState,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
      });

      if (audio.volume !== volume) audio.volume = volume;
      if (audio.volume === 0) audio.volume = volume > 0 ? volume : 1.0;
      if (audio.muted) audio.muted = false;

      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");
        const contextResumed = await resumeAudioContext(3);
        if (!contextResumed) await ensureAudioRoutedToDestination();
      } catch {
        logger.warn("AudioContext resume issue");
      }

      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          /* ignore */
        }
        playPromiseRef.current = null;
      }

      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
        logger.info("Playback started successfully", { trackId: activeTrack?.id });
        playerAnalytics.trackPlay(activeTrack?.id || "", "global_provider");
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err.name === "AbortError" || isCleanedUp) return;
        logger.error("Playback failed", error, { errorName: err.name, trackId: activeTrack?.id });
        if (err.name === "NotAllowedError" && !isStartupPeriod()) {
          toast.error("Воспроизведение заблокировано", { description: "Нажмите на экран и попробуйте снова" });
        } else if (err.name === "NotSupportedError" && !isStartupPeriod()) {
          toast.error("Формат аудио не поддерживается");
        }
        pauseTrack();
      } finally {
        playPromiseRef.current = null;
      }
    };

    if (isPlaying) {
      if (audio.readyState >= 2 && !isLoadingRef.current) {
        attemptPlay();
      } else {
        const handleCanPlay = () => {
          if (!isCleanedUp && isPlayingRef.current) attemptPlay();
          audio.removeEventListener("canplay", handleCanPlay);
        };
        audio.addEventListener("canplay", handleCanPlay);

        playTimeoutId = setTimeout(() => {
          audio.removeEventListener("canplay", handleCanPlay);
          if (!isCleanedUp && isPlayingRef.current && audio.src) {
            isLoadingRef.current = false;
            attemptPlay();
          }
        }, 5000);

        return () => {
          isCleanedUp = true;
          audio.removeEventListener("canplay", handleCanPlay);
          if (playTimeoutId) clearTimeout(playTimeoutId);
        };
      }
    } else {
      playPromiseRef.current = null;
      audio.pause();
    }

    return () => {
      isCleanedUp = true;
      if (playTimeoutId) clearTimeout(playTimeoutId);
    };
  }, [isPlaying, activeTrack?.id, volume, pauseTrack, isStartupPeriod]);
}
