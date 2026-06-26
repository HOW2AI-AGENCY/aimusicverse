/**
 * Hook for audio playback control: play/pause sync, volume, and AudioContext management.
 */

import { useEffect, useRef, type MutableRefObject } from "react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { playerAnalytics } from "@/lib/telemetry";
import type { Track } from "@/types/track";

interface UseAudioEffectsOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  isLoadingRef: MutableRefObject<boolean>;
  playPromiseRef: MutableRefObject<Promise<void> | null>;
  activeTrack: Track | null | undefined;
  isPlaying: boolean;
  volume: number;
  pauseTrack: () => void;
  isStartupPeriod: () => boolean;
}

export function useAudioEffects({
  audioRef, isLoadingRef, playPromiseRef,
  activeTrack, isPlaying, volume, pauseTrack, isStartupPeriod,
}: UseAudioEffectsOptions) {
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Sync volume from store to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && volume !== audio.volume) {
      audio.volume = volume;
      logger.debug("Volume synced from store", { volume });
    }
  }, [volume, audioRef]);

  // Play/pause control effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    let isCleanedUp = false;
    let playTimeoutId: NodeJS.Timeout | null = null;

    const attemptPlay = async () => {
      if (isCleanedUp) return;

      if (isLoadingRef.current) {
        const waitForLoad = new Promise<void>((resolve) => {
          const check = () => {
            if (!isLoadingRef.current || audio.readyState >= 2) { resolve(); return; }
            setTimeout(check, 50);
          };
          check();
        });
        await Promise.race([waitForLoad, new Promise((r) => setTimeout(r, 3000))]);
      }

      // Sync volume
      if (audio.volume !== volume) audio.volume = volume;
      if (audio.volume === 0) audio.volume = volume > 0 ? volume : 1.0;
      if (audio.muted) audio.muted = false;

      // Resume AudioContext
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");
        if (!(await resumeAudioContext(3))) await ensureAudioRoutedToDestination();
      } catch { /* ignore */ }

      // Wait for pending play promise
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch { /* ignore */ }
        playPromiseRef.current = null;
      }

      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
        logger.info("Playback started", { trackId: activeTrack?.id });
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
        return () => { isCleanedUp = true; audio.removeEventListener("canplay", handleCanPlay); if (playTimeoutId) clearTimeout(playTimeoutId); };
      }
    } else {
      if (playPromiseRef.current) playPromiseRef.current = null;
      audio.pause();
    }

    return () => { isCleanedUp = true; if (playTimeoutId) clearTimeout(playTimeoutId); };
  }, [isPlaying, activeTrack?.id, volume, pauseTrack, audioRef, isLoadingRef, playPromiseRef, isStartupPeriod]);
}
