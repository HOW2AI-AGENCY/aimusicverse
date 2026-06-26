/**
 * Global Audio Provider
 *
 * @description
 * Manages the singleton HTMLAudioElement and synchronizes it with the Zustand player store.
 * This component MUST be mounted at the app root level to ensure a single audio source
 * across the entire application, preventing multiple audio elements from playing simultaneously.
 *
 * Logic is delegated to focused hooks:
 * - useAudioSourceResolver: Resolves the best audio URL from a track
 * - useAudioEffects: Play/pause control, volume sync, AudioContext management
 * - useAudioQueue: Track-ended handling (repeat, next track)
 * - useAudioErrorRecovery: Error handling, retry logic, stall recovery
 * - useOptimizedAudioPlayer: Caching and prefetching
 * - usePlaybackPosition: Position persistence across sessions
 * - usePlayerAnalytics: Analytics tracking
 *
 * @usage
 * ```tsx
 * // App.tsx (root level)
 * function App() {
 *   return (
 *     <GlobalAudioProvider>
 *       <YourApp />
 *     </GlobalAudioProvider>
 *   );
 * }
 *
 * // Anywhere in the app
 * const { activeTrack, isPlaying, play, pause } = usePlayerStore();
 * ```
 *
 * @see {@link usePlayerStore} for the Zustand store API
 */

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { setGlobalAudioRef } from "@/hooks/audio/useAudioTime";
import { useOptimizedAudioPlayer } from "@/hooks/audio/useOptimizedAudioPlayer";
import { usePlaybackPosition } from "@/hooks/audio/usePlaybackPosition";
import { usePlayerAnalytics } from "@/hooks/audio/usePlayerAnalytics";
import { useAudioSourceResolver } from "@/hooks/audio/useAudioSourceResolver";
import { useAudioEffects } from "@/hooks/audio/useAudioEffects";
import { useAudioQueue } from "@/hooks/audio/useAudioQueue";
import { useAudioErrorRecovery } from "@/hooks/audio/useAudioErrorRecovery";
import { logger } from "@/lib/logger";
import { detectMobileBrowser, logAudioDiagnostics } from "@/lib/audioFormatUtils";

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = useCallback(() => Date.now() - mountTimeRef.current < 2000, []);

  const isLoadingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const mobileBrowserInfoInit = useRef(detectMobileBrowser());
  const isMobileBrowserInit = mobileBrowserInfoInit.current.isMobile;

  const { activeTrack, isPlaying, repeat, volume, pauseTrack, nextTrack } = usePlayerStore();

  // Resolve audio source URL from track
  const { getAudioSource, isMobileBrowser, mobileBrowserInfo } = useAudioSourceResolver(
    activeTrack,
    isStartupPeriod,
  );

  // Optimized audio player with caching and prefetch
  useOptimizedAudioPlayer({
    enablePrefetch: true,
    enableCache: true,
    crossfadeDuration: 0.3,
  });

  // Playback position persistence
  usePlaybackPosition();

  // Player analytics tracking
  usePlayerAnalytics();

  // Volume sync and play/pause control
  useAudioEffects({
    audioRef,
    isLoadingRef,
    playPromiseRef,
    activeTrack,
    isPlaying,
    volume,
    pauseTrack,
    isStartupPeriod,
  });

  // Queue advancement on track end
  useAudioQueue({
    audioRef,
    activeTrack,
    isPlaying,
    repeat,
    nextTrack,
  });

  // Error handling, retry logic, stall recovery
  useAudioErrorRecovery({
    audioRef,
    playPromiseRef,
    activeTrack,
    isPlaying,
    isMobileBrowser,
    mobileBrowserInfo,
    pauseTrack,
    nextTrack,
    isStartupPeriod,
  });

  // Initialize audio element once and clean up invalid tracks from localStorage
  useEffect(() => {
    // Clean up invalid tracks from persisted state on startup
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

    // Clean up legacy localStorage keys
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
      audioRef.current.volume = volume;
      audioRef.current.muted = false;

      logger.info("Audio element initialized", {
        volume: audioRef.current.volume,
        muted: audioRef.current.muted,
        readyState: audioRef.current.readyState,
        isMobile: isMobileBrowserInit,
        browser: mobileBrowserInfoInit.current.browserName,
        os: mobileBrowserInfoInit.current.osName,
      });

      if (isMobileBrowserInit) {
        logAudioDiagnostics();
      }

      setGlobalAudioRef(audioRef.current);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        logger.debug("Audio element cleaned up");
      }
    };
  }, []);

  // Effect for loading new tracks - only triggers on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();

    if (!source) {
      logger.debug("No source available, clearing audio");
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

    if (trackChanged) {
      lastTrackIdRef.current = activeTrack?.id || null;
      isLoadingRef.current = true;

      logger.debug("Loading new track", {
        trackId: activeTrack?.id,
        title: activeTrack?.title,
      });

      playPromiseRef.current = null;

      audio.pause();
      audio.src = source;
      audio.load();

      const handleCanPlayThrough = () => {
        isLoadingRef.current = false;
        audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      };
      audio.addEventListener("canplaythrough", handleCanPlayThrough);

      const handleLoadedData = () => {
        if (audio.readyState >= 2) {
          isLoadingRef.current = false;
        }
        audio.removeEventListener("loadeddata", handleLoadedData);
      };
      audio.addEventListener("loadeddata", handleLoadedData);
    }
  }, [activeTrack?.id, activeTrack?.title, getAudioSource]);

  return <>{children}</>;
}
