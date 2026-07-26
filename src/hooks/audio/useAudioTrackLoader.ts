import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Track } from "@/types/track";
import { logger } from "@/lib/logger";
import { recordError } from "@/lib/telemetry";

interface AudioTrackLoaderOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  lastTrackIdRef: MutableRefObject<string | null>;
  isLoadingRef: MutableRefObject<boolean>;
  playPromiseRef: MutableRefObject<Promise<void> | null>;
  activeTrack: Track | null;
  getAudioSource: () => string | null;
  /**
   * Increment to force a reload of the same track (retry after error).
   * When the value changes, the loader resets its "last track" cache and re-runs.
   */
  loadNonce?: number;
}

const truncateUrl = (s: string, max = 200): string => (s.length > max ? `${s.slice(0, max)}…` : s);

/**
 * Fade audio volume from current to target over `durationMs`.
 * Returns a promise that resolves when the transition window has elapsed.
 */
function fadeVolume(audio: HTMLAudioElement, target: number, durationMs = 150): Promise<void> {
  const start = audio.volume;
  const diff = target - start;
  const startTime = performance.now();
  return new Promise((resolve) => {
    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      // cubic ease-out
      audio.volume = start + diff * (1 - Math.pow(1 - t, 3));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        audio.volume = target;
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

export function useAudioTrackLoader({
  audioRef,
  lastTrackIdRef,
  isLoadingRef,
  playPromiseRef,
  activeTrack,
  getAudioSource,
  loadNonce = 0,
}: AudioTrackLoaderOptions) {
  const lastNonceRef = useRef<number>(-1);
  const lastSourceRef = useRef<string | null>(null);
  const restoreVolumeRef = useRef<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const trackId = activeTrack?.id ?? null;
    const source = getAudioSource();

    // No track — clear audio
    if (!activeTrack || !source) {
      audio.pause();
      if (audio.src) {
        audio.removeAttribute("src");
        audio.load();
      }
      lastTrackIdRef.current = null;
      isLoadingRef.current = false;
      return;
    }

    // Edge-detection: only proceed if track, nonce, or source actually changed
    const trackChanged = trackId !== lastTrackIdRef.current;
    const nonceChanged = loadNonce !== lastNonceRef.current;
    const sourceChanged = source !== lastSourceRef.current;
    if (!trackChanged && !nonceChanged && !sourceChanged) return;

    lastTrackIdRef.current = trackId;
    lastNonceRef.current = loadNonce;
    lastSourceRef.current = source;
    isLoadingRef.current = true;

    playPromiseRef.current = null;

    // --- Crossfade: fade out before changing source ---
    const prevVolume = audio.volume;
    restoreVolumeRef.current = prevVolume;

    (async () => {
      // Only fade if currently playing and not already silent
      if (!audio.paused && prevVolume > 0.05) {
        await fadeVolume(audio, 0, 150);
      }

      audio.pause();
      try {
        audio.src = source;
        audio.load();
      } catch (err) {
        const code = audio.error?.code ?? null;
        logger.error("Failed to set audio source", err, {
          trackId,
          src: truncateUrl(source),
          mediaErrorCode: code,
        });
        recordError("audio:load:set_src_failed", err instanceof Error ? err.message : String(err), {
          trackId,
          src: truncateUrl(source),
          mediaErrorCode: code,
        });
        isLoadingRef.current = false;
        return;
      }

      const handleCanPlayThrough = () => {
        isLoadingRef.current = false;
        audio.removeEventListener("canplaythrough", handleCanPlayThrough);
        // Fade volume back to previous level when playback is ready
        audio.volume = 0;
        fadeVolume(audio, restoreVolumeRef.current, 200);
      };
      audio.addEventListener("canplaythrough", handleCanPlayThrough);

      const handleLoadedData = () => {
        if (audio.readyState >= 2) isLoadingRef.current = false;
        audio.removeEventListener("loadeddata", handleLoadedData);
      };
      audio.addEventListener("loadeddata", handleLoadedData);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrack?.id, activeTrack?.title, getAudioSource, loadNonce]);
}
