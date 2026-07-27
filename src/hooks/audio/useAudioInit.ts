import { useEffect } from "react";
import type { RefObject, MutableRefObject } from "react";
import { clampPlayerVolume, usePlayerStore } from "@/hooks/audio/usePlayerState";
import { setGlobalAudioRef } from "@/hooks/audio/useAudioTime";
import { logAudioDiagnostics } from "@/lib/audioFormatUtils";
import { logger } from "@/lib/logger";

interface AudioInitOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  initialVolume: number;
  isMobileBrowser: boolean;
  mobileBrowserInfo: RefObject<{ browserName: string; osName: string }>;
}

export function useAudioInit({ audioRef, initialVolume, isMobileBrowser, mobileBrowserInfo }: AudioInitOptions) {
  useEffect(() => {
    const storedActiveTrack = usePlayerStore.getState().activeTrack;
    if (
      storedActiveTrack &&
      !storedActiveTrack.audio_url &&
      !storedActiveTrack.streaming_url &&
      !storedActiveTrack.local_audio_url
    ) {
      logger.info("Clearing invalid track from localStorage on startup", {
        trackId: storedActiveTrack.id,
        title: storedActiveTrack.title,
        status: storedActiveTrack.status,
      });
      usePlayerStore.getState().closePlayer();
    }

    try {
      const oldPlayerData = localStorage.getItem("player-storage");
      if (oldPlayerData) {
        localStorage.removeItem("player-storage");
        logger.info("Removed legacy player-storage from localStorage");
      }
    } catch {
      // Ignore localStorage errors
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.volume = clampPlayerVolume(initialVolume);
      audioRef.current.muted = false;

      logger.info("Audio element initialized", {
        volume: audioRef.current.volume,
        muted: audioRef.current.muted,
        readyState: audioRef.current.readyState,
        isMobile: isMobileBrowser,
        browser: mobileBrowserInfo.current?.browserName,
        os: mobileBrowserInfo.current?.osName,
      });

      if (isMobileBrowser) {
        logAudioDiagnostics();
      }

      setGlobalAudioRef(audioRef.current);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Don't set src="" — causes "Empty src attribute" error on some browsers
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        logger.debug("Audio element cleaned up");
      }
    };
  }, []); // intentionally empty — init runs once only
}
