/**
 * Global Audio Provider
 *
 * @description
 * Manages the singleton HTMLAudioElement and synchronizes it with the Zustand player store.
 * This component MUST be mounted at the app root level to ensure a single audio source
 * across the entire application, preventing multiple audio elements from playing simultaneously.
 *
 * @architecture
 * - Single Responsibility: Manages ONE global audio element for the entire app
 * - State Sync: Bi-directional sync between HTML5 Audio API and Zustand store
 * - Performance: Debounced time updates to reduce re-renders (60Hz → ~10Hz)
 * - Caching: Integrates with IndexedDB audio cache for offline playback
 * - Prefetching: Automatically prefetches next tracks in queue
 *
 * Hooks extracted for modularity:
 * - usePlaybackStatusSync: audio event → store status sync
 * - useAudioSourceResolver: URL resolution with mobile format filtering
 * - useAudioErrorRecovery: error handling, stall recovery, auto-skip
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
 * @see {@link useOptimizedAudioPlayer} for the caching/prefetching implementation
 * @see {@link usePlaybackPosition} for position persistence
 *
 * @author MusicVerse AI Team
 * @since 1.0.0
 */

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { setGlobalAudioRef } from "@/hooks/audio/useAudioTime";
import { useOptimizedAudioPlayer } from "@/hooks/audio/useOptimizedAudioPlayer";
import { usePlaybackPosition } from "@/hooks/audio/usePlaybackPosition";
import { usePlayerAnalytics } from "@/hooks/audio/usePlayerAnalytics";
import { usePlaybackStatusSync } from "@/hooks/audio/usePlaybackStatusSync";
import { useAudioSourceResolver } from "@/hooks/audio/useAudioSourceResolver";
import { useAudioErrorRecovery } from "@/hooks/audio/useAudioErrorRecovery";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { playerAnalytics } from "@/lib/telemetry";
import { logAudioDiagnostics } from "@/lib/audioFormatUtils";

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  // Suppress errors during initial startup to avoid stale data toasts
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = useCallback(() => Date.now() - mountTimeRef.current < 2000, []);

  const { activeTrack, isPlaying, volume, pauseTrack } = usePlayerStore();

  // --- Extracted hooks ---

  // Sync granular playback status from <audio> events → store
  usePlaybackStatusSync(audioRef);

  // Resolve audio source URL with mobile format filtering
  const { getAudioSource, isMobileBrowser, mobileBrowserInfo } = useAudioSourceResolver({ isStartupPeriod });

  // Use optimized audio player with caching and prefetch
  useOptimizedAudioPlayer({
    enablePrefetch: true,
    enableCache: true,
    crossfadeDuration: 0.3,
  });

  // Use playback position persistence
  usePlaybackPosition();

  // Use player analytics tracking
  usePlayerAnalytics();

  // Stable ref for isPlaying to avoid effect re-runs
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Ref to track if we're currently loading a new track
  const isLoadingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Error recovery (ended, error, stalled, suspend)
  useAudioErrorRecovery({
    audioRef,
    playPromiseRef,
    isMobileBrowser,
    mobileBrowserInfo,
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

    // Also clean up legacy localStorage keys that may contain stale data
    try {
      const oldPlayerData = localStorage.getItem("player-storage");
      if (oldPlayerData) {
        localStorage.removeItem("player-storage");
        logger.info("Removed legacy player-storage from localStorage");
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";

      // CRITICAL: Set initial volume from store
      audioRef.current.volume = volume;
      audioRef.current.muted = false;

      // Log audio element state for debugging
      logger.info("Audio element initialized", {
        volume: audioRef.current.volume,
        muted: audioRef.current.muted,
        readyState: audioRef.current.readyState,
        isMobile: isMobileBrowser,
        browser: mobileBrowserInfo.current.browserName,
        os: mobileBrowserInfo.current.osName,
      });

      // Log audio diagnostics for debugging mobile issues
      if (isMobileBrowser) {
        logAudioDiagnostics();
      }

      setGlobalAudioRef(audioRef.current);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // CRITICAL: Don't set src to empty string to avoid "Empty src attribute" error
        // Instead, just leave it as-is during cleanup
        audioRef.current.removeAttribute("src");
        audioRef.current.load(); // Reset internal state without triggering error
        logger.debug("Audio element cleaned up");
      }
    };
  }, []);

  // Sync volume from store to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && volume !== audio.volume) {
      audio.volume = volume;
      logger.debug("Volume synced from store", { volume });
    }
  }, [volume]);

  // Effect for loading new tracks - only triggers on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();

    // Handle no source
    if (!source) {
      logger.debug("No source available, clearing audio");
      audio.pause();
      // CRITICAL: Use removeAttribute instead of setting empty string to avoid error
      if (audio.src) {
        audio.removeAttribute("src");
        audio.load(); // Reset internal state
      }
      lastTrackIdRef.current = null;
      isLoadingRef.current = false;
      return;
    }

    const trackChanged = activeTrack?.id !== lastTrackIdRef.current;

    // Only load if track actually changed
    if (trackChanged) {
      lastTrackIdRef.current = activeTrack?.id || null;
      isLoadingRef.current = true;

      logger.debug("Loading new track", {
        trackId: activeTrack?.id,
        title: activeTrack?.title,
      });

      // Cancel any pending play promise
      playPromiseRef.current = null;

      // Pause before changing source to prevent conflicts
      audio.pause();
      audio.src = source;
      audio.load();

      // Mark loading complete when audio is ready
      const handleCanPlayThrough = () => {
        isLoadingRef.current = false;
        audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      };
      audio.addEventListener("canplaythrough", handleCanPlayThrough);

      // Also mark ready on loadeddata for faster response
      const handleLoadedData = () => {
        if (audio.readyState >= 2) {
          isLoadingRef.current = false;
        }
        audio.removeEventListener("loadeddata", handleLoadedData);
      };
      audio.addEventListener("loadeddata", handleLoadedData);
    }
  }, [activeTrack?.id, activeTrack?.title, getAudioSource]);

  // Separate effect for play/pause control - avoids race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    let isCleanedUp = false;
    let playTimeoutId: NodeJS.Timeout | null = null;

    const attemptPlay = async () => {
      if (isCleanedUp) return;

      // CRITICAL: Wait for loading to complete before playing
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

        await Promise.race([
          waitForLoad,
          new Promise((resolve) => setTimeout(resolve, 3000)), // 3s timeout
        ]);
      }

      // Log detailed audio state before play attempt
      logger.debug("Attempting to play", {
        trackId: activeTrack?.id,
        readyState: audio.readyState,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
      });

      // CRITICAL FIX: Sync volume from store
      if (audio.volume !== volume) {
        logger.debug("Syncing volume from store", { storeVolume: volume, audioVolume: audio.volume });
        audio.volume = volume;
      }

      // Ensure volume is audible
      if (audio.volume === 0) {
        logger.warn("Volume was 0, setting to store value or 1.0");
        audio.volume = volume > 0 ? volume : 1.0;
      }
      if (audio.muted) {
        logger.warn("Audio was muted, unmuting");
        audio.muted = false;
      }

      // Resume AudioContext
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import("@/lib/audioContextManager");
        const contextResumed = await resumeAudioContext(3);
        if (!contextResumed) {
          await ensureAudioRoutedToDestination();
        }
      } catch {
        logger.warn("AudioContext resume issue");
      }

      // Wait for any pending play promise
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore
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
        if (err.name === "AbortError" || isCleanedUp) {
          return;
        }

        logger.error("Playback failed", error, {
          errorName: err.name,
          trackId: activeTrack?.id,
        });

        if (err.name === "NotAllowedError") {
          if (!isStartupPeriod()) {
            toast.error("Воспроизведение заблокировано", {
              description: "Нажмите на экран и попробуйте снова",
            });
          }
        } else if (err.name === "NotSupportedError") {
          if (!isStartupPeriod()) {
            toast.error("Формат аудио не поддерживается");
          }
        }

        pauseTrack();
      } finally {
        playPromiseRef.current = null;
      }
    };

    if (isPlaying) {
      // Wait for audio to be ready if needed
      if (audio.readyState >= 2 && !isLoadingRef.current) {
        attemptPlay();
      } else {
        const handleCanPlay = () => {
          if (!isCleanedUp && isPlayingRef.current) {
            attemptPlay();
          }
          audio.removeEventListener("canplay", handleCanPlay);
        };
        audio.addEventListener("canplay", handleCanPlay);

        // Cleanup timeout to prevent stale handlers
        playTimeoutId = setTimeout(() => {
          audio.removeEventListener("canplay", handleCanPlay);
          // If still not ready after 5s, try anyway
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
      // Cancel any pending play
      if (playPromiseRef.current) {
        playPromiseRef.current = null;
      }
      audio.pause();
    }

    return () => {
      isCleanedUp = true;
      if (playTimeoutId) clearTimeout(playTimeoutId);
    };
  }, [isPlaying, activeTrack?.id, volume, pauseTrack, isStartupPeriod]);

  return <>{children}</>;
}
