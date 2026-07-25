import { useEffect } from "react";
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

export function useAudioTrackLoader({
  audioRef,
  lastTrackIdRef,
  isLoadingRef,
  playPromiseRef,
  activeTrack,
  getAudioSource,
  loadNonce = 0,
}: AudioTrackLoaderOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();
    const trackId = activeTrack?.id ?? null;

    const isValidSource = (s: string | null | undefined): s is string => {
      if (!s || typeof s !== "string") return false;
      const trimmed = s.trim();
      if (!trimmed) return false;
      return /^(https?:|blob:|data:audio\/|\/)/i.test(trimmed);
    };

    if (!isValidSource(source)) {
      if (source) {
        // Invalid but non-empty source — this is a bug or bad data upstream.
        logger.warn("Audio source rejected — invalid URL", {
          trackId,
          title: activeTrack?.title,
          source: truncateUrl(source),
        });
        recordError("audio:load:invalid_src", "Invalid audio source rejected", {
          trackId,
          source: truncateUrl(source),
        });
      } else if (activeTrack) {
        // Active track but no playable source — telemetry, not just debug.
        logger.warn("Audio source missing for active track", { trackId, title: activeTrack.title });
        recordError("audio:load:empty_src", "Active track has no playable source", {
          trackId,
          title: activeTrack.title ?? null,
        });
      } else {
        logger.debug("No source available, clearing audio");
      }
      audio.pause();
      if (audio.src) {
        audio.removeAttribute("src");
        audio.load();
      }
      lastTrackIdRef.current = null;
      isLoadingRef.current = false;
      return;
    }

    // Force reload when loadNonce changes (retry path) even for the same track id.
    const trackChanged = trackId !== lastTrackIdRef.current;
    if (!trackChanged && loadNonce === 0) return;

    lastTrackIdRef.current = trackId;
    isLoadingRef.current = true;

    logger.debug("Loading new track", {
      trackId,
      title: activeTrack?.title,
      loadNonce,
      src: truncateUrl(source),
    });

    playPromiseRef.current = null;
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
    };
    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    const handleLoadedData = () => {
      if (audio.readyState >= 2) isLoadingRef.current = false;
      audio.removeEventListener("loadeddata", handleLoadedData);
    };
    audio.addEventListener("loadeddata", handleLoadedData);
  }, [activeTrack?.id, activeTrack?.title, getAudioSource, loadNonce]);
}
