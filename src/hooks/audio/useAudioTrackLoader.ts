import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Track } from "@/types/track";
import { logger } from "@/lib/logger";

interface AudioTrackLoaderOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  lastTrackIdRef: MutableRefObject<string | null>;
  isLoadingRef: MutableRefObject<boolean>;
  playPromiseRef: MutableRefObject<Promise<void> | null>;
  activeTrack: Track | null;
  getAudioSource: () => string | null;
}

export function useAudioTrackLoader({
  audioRef,
  lastTrackIdRef,
  isLoadingRef,
  playPromiseRef,
  activeTrack,
  getAudioSource,
}: AudioTrackLoaderOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();

    const isValidSource = (s: string | null | undefined): s is string => {
      if (!s || typeof s !== "string") return false;
      const trimmed = s.trim();
      if (!trimmed) return false;
      return /^(https?:|blob:|data:audio\/|\/)/i.test(trimmed);
    };

    if (!isValidSource(source)) {
      if (source) {
        logger.warn("Audio source rejected — invalid URL", { trackId: activeTrack?.id, source });
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

    const trackChanged = activeTrack?.id !== lastTrackIdRef.current;
    if (!trackChanged) return;

    lastTrackIdRef.current = activeTrack?.id || null;
    isLoadingRef.current = true;

    logger.debug("Loading new track", { trackId: activeTrack?.id, title: activeTrack?.title });

    playPromiseRef.current = null;
    audio.pause();
    try {
      audio.src = source;
      audio.load();
    } catch (err) {
      logger.error("Failed to set audio source", err, { trackId: activeTrack?.id });
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
  }, [activeTrack?.id, activeTrack?.title, getAudioSource]);
}
