/**
 * Manages the singleton HTMLAudioElement and synchronises it with the Zustand player store.
 * Must be mounted at the app root. All audio control goes through usePlayerStore().
 *
 * Extracted hooks:
 * - useAudioInit          — element creation, legacy-storage cleanup, teardown
 * - useAudioTrackLoader   — src swap when active track changes
 * - useAudioPlayback      — play/pause, volume, AudioContext resume, error toasts
 * - usePlaybackStatusSync — audio events → store status
 * - useAudioSourceResolver — URL resolution with mobile-format filtering
 * - useAudioErrorRecovery — stall/error/ended recovery, auto-skip
 * - useOptimizedAudioPlayer — IndexedDB cache + prefetch
 */

import { useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { clampPlayerVolume, usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useOptimizedAudioPlayer } from "@/hooks/audio/useOptimizedAudioPlayer";
import { usePlaybackPosition } from "@/hooks/audio/usePlaybackPosition";
import { usePlayerAnalytics } from "@/hooks/audio/usePlayerAnalytics";
import { usePlaybackStatusSync } from "@/hooks/audio/usePlaybackStatusSync";
import { useAudioSourceResolver } from "@/hooks/audio/useAudioSourceResolver";
import { useAudioErrorRecovery } from "@/hooks/audio/useAudioErrorRecovery";
import { useAudioInit } from "@/hooks/audio/useAudioInit";
import { useAudioTrackLoader } from "@/hooks/audio/useAudioTrackLoader";
import { useAudioPlayback } from "@/hooks/audio/useAudioPlayback";
import { logger } from "@/lib/logger";

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = useCallback(() => Date.now() - mountTimeRef.current < 2000, []);

  const { activeTrack, isPlaying, volume: storedVolume, pauseTrack } = usePlayerStore();
  const volume = clampPlayerVolume(storedVolume);

  // Stable ref so playback callbacks read current isPlaying without re-subscribing
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  usePlaybackStatusSync(audioRef);

  const { getAudioSource, isMobileBrowser, mobileBrowserInfo } = useAudioSourceResolver({ isStartupPeriod });

  useOptimizedAudioPlayer({ enablePrefetch: true, enableCache: true, crossfadeDuration: 0.3 });
  usePlaybackPosition();
  usePlayerAnalytics();

  useAudioErrorRecovery({ audioRef, playPromiseRef, isMobileBrowser, mobileBrowserInfo, isStartupPeriod });

  useAudioInit({ audioRef, initialVolume: volume, isMobileBrowser, mobileBrowserInfo });

  // Keep hardware volume in sync with store
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && volume !== audio.volume) {
      audio.volume = volume;
      logger.debug("Volume synced from store", { volume });
    }
  }, [volume]);

  const loadNonce = usePlayerStore((s) => s.loadNonce);
  useAudioTrackLoader({ audioRef, lastTrackIdRef, isLoadingRef, playPromiseRef, activeTrack, getAudioSource, loadNonce });

  useAudioPlayback({
    audioRef,
    isLoadingRef,
    isPlayingRef,
    playPromiseRef,
    isPlaying,
    activeTrack,
    volume,
    pauseTrack,
    isStartupPeriod,
  });

  return <>{children}</>;
}
