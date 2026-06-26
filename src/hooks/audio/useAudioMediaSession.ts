/**
 * Hook for Media Session API integration.
 *
 * Sets up navigator.mediaSession metadata and action handlers so the
 * browser/OS media controls (lock screen, notification shade) can
 * control playback.
 *
 * Currently a placeholder — Media Session support will be added in a
 * future sprint. The hook is safe to call and does nothing when the
 * Media Session API is unavailable.
 */

import { useEffect } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { logger } from "@/lib/logger";

export function useAudioMediaSession() {
  const { activeTrack, isPlaying, pauseTrack, nextTrack, previousTrack } =
    usePlayerStore();

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Set metadata when active track changes
    if (activeTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeTrack.title || "Unknown Track",
        artist: "MusicVerse AI",
        artwork: activeTrack.cover_url
          ? [{ src: activeTrack.cover_url, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [activeTrack, isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => { usePlayerStore.getState().playTrack(usePlayerStore.getState().activeTrack!); }],
      ["pause", () => { pauseTrack(); }],
      ["nexttrack", () => { nextTrack(); }],
      ["previoustrack", () => { previousTrack(); }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        logger.debug(`Media Session: ${action} handler not supported`);
      }
    }

    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
      }
    };
  }, [pauseTrack, nextTrack, previousTrack]);
}
