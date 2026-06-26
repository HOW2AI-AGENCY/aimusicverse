/**
 * Hook for audio queue advancement on track end.
 *
 * Handles the "ended" event: repeats the current track (repeat-one mode)
 * or advances to the next track in the queue, and fires completion analytics.
 */

import { useEffect, type MutableRefObject } from "react";
import { logger } from "@/lib/logger";
import { playerAnalytics } from "@/lib/telemetry";
import type { Track } from "@/types/track";

interface UseAudioQueueOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  activeTrack: Track | null | undefined;
  isPlaying: boolean;
  repeat: "none" | "one" | "all";
  nextTrack: () => void;
}

export function useAudioQueue({ audioRef, activeTrack, isPlaying, repeat, nextTrack }: UseAudioQueueOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug("Track ended", { trackId: activeTrack?.id });
      playerAnalytics.trackComplete(activeTrack?.id || "", audio.currentTime, audio.duration);

      if (repeat === "one") {
        if (audio.src && audio.duration > 0) {
          audio.currentTime = 0;
          if (isPlaying) {
            audio.play().catch((err) => {
              logger.warn("Repeat play failed", err);
              if (err.name !== "AbortError") {
                nextTrack();
              }
            });
          }
        } else {
          logger.warn("Cannot repeat track: invalid source");
          nextTrack();
        }
      } else {
        nextTrack();
      }
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, repeat, nextTrack, activeTrack, isPlaying]);
}
