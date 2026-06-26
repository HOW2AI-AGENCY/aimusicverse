/**
 * Hook for audio error handling, retry logic, and stall recovery.
 *
 * Handles network errors (code 2), format errors (code 4), stalls,
 * and auto-skips to next track after unrecoverable failures.
 */

import { useEffect, useRef, type MutableRefObject } from "react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { recordError } from "@/lib/telemetry";
import {
  AUDIO_ERROR_MESSAGES,
  DEFAULT_ERROR_INFO,
  buildErrorContext,
  collectFallbackUrls,
} from "./audioErrorMessages";
import type { Track } from "@/types/track";

interface UseAudioErrorRecoveryOptions {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  playPromiseRef: MutableRefObject<Promise<void> | null>;
  activeTrack: Track | null | undefined;
  isPlaying: boolean;
  isMobileBrowser: boolean;
  mobileBrowserInfo: MutableRefObject<{ isMobile: boolean; browserName: string; osName: string }>;
  pauseTrack: () => void;
  nextTrack: () => void;
  isStartupPeriod: () => boolean;
}

const MAX_NETWORK_RETRIES = 3;
const MAX_FORMAT_RETRIES = 2;

export function useAudioErrorRecovery({
  audioRef, playPromiseRef, activeTrack, isPlaying,
  isMobileBrowser, mobileBrowserInfo, pauseTrack, nextTrack, isStartupPeriod,
}: UseAudioErrorRecoveryOptions) {
  const retryStateRef = useRef({
    networkRetryCount: 0, formatRetryCount: 0,
    hasAttemptedBlobRecovery: false, attemptedUrls: new Set<string>(),
  });
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrack?.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = activeTrack?.id || null;
      retryStateRef.current = {
        networkRetryCount: 0, formatRetryCount: 0,
        hasAttemptedBlobRecovery: false, attemptedUrls: new Set<string>(),
      };
    }

    let retryTimeoutId: NodeJS.Timeout | null = null;

    /** Try to play from a fallback URL, restoring position. */
    const recoverWithUrl = (fallbackUrl: string, context: Record<string, unknown>) => {
      const currentTime = audio.currentTime;
      const wasPlaying = isPlaying;
      audio.src = fallbackUrl;
      audio.load();
      audio.addEventListener("canplay", async function onCanPlay() {
        audio.removeEventListener("canplay", onCanPlay);
        if (currentTime > 0 && !isNaN(currentTime)) audio.currentTime = currentTime;
        if (wasPlaying) {
          try { await audio.play(); logger.info("Playback recovered", context); }
          catch (e) { logger.warn("Recovery play failed", { error: e instanceof Error ? e.message : String(e) }); }
        }
      }, { once: true });
    };

    const handleError = () => {
      const state = retryStateRef.current;
      const currentSrc = audio.src || "";
      if (!currentSrc || currentSrc === window.location.href) return;

      const inStartup = isStartupPeriod();
      const errorCode = audio.error?.code || 0;
      const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || DEFAULT_ERROR_INFO;
      const extraCtx = {
        networkRetryCount: state.networkRetryCount, formatRetryCount: state.formatRetryCount,
        isMobile: isMobileBrowser, browser: mobileBrowserInfo.current.browserName, os: mobileBrowserInfo.current.osName,
      };
      const errorContext = buildErrorContext(audio, activeTrack, extraCtx);

      // --- Network error recovery (code 2) ---
      if (errorCode === 2 && state.networkRetryCount < MAX_NETWORK_RETRIES) {
        state.networkRetryCount++;
        const fallbacks = collectFallbackUrls(activeTrack, state.attemptedUrls);
        if (fallbacks.length > 0) {
          state.attemptedUrls.add(fallbacks[0]);
          logger.info("Network error, trying alternative URL", { ...errorContext, fallbackUrl: fallbacks[0].substring(0, 60) });
          recoverWithUrl(fallbacks[0], { trackId: activeTrack?.id, fallbackUrl: fallbacks[0].substring(0, 60) });
          return;
        }
        const cur = audio.src;
        if (cur && !cur.includes("retry=")) {
          const sep = cur.includes("?") ? "&" : "?";
          const retryDelay = Math.pow(2, state.networkRetryCount - 1) * 1000;
          retryTimeoutId = setTimeout(() => {
            audio.src = `${cur}${sep}retry=${Date.now()}`;
            audio.load();
            if (isPlaying) audio.play().catch(() => {});
            if (!inStartup) toast.info("Повторная попытка загрузки...", { description: `Попытка ${state.networkRetryCount} из ${MAX_NETWORK_RETRIES}` });
          }, retryDelay);
          return;
        }
      }

      // --- Format error recovery (code 4) ---
      if (errorCode === 4 && !state.hasAttemptedBlobRecovery && state.formatRetryCount < MAX_FORMAT_RETRIES) {
        state.hasAttemptedBlobRecovery = true;
        state.formatRetryCount++;
        const uniqueUrls = Array.from(new Set(collectFallbackUrls(activeTrack, new Set())));
        let chain = uniqueUrls.filter((u) => u !== audio.src);
        let isRetry = false;
        if (chain.length === 0 && uniqueUrls.length > 0) {
          const base = uniqueUrls[0];
          chain = [`${base}${base.includes("?") ? "&" : "?"}retry=${Date.now()}`];
          isRetry = true;
        }
        if (chain.length > 0) {
          state.attemptedUrls.add(chain[0]);
          logger.info("Format error, attempting fallback", { ...errorContext, fallbackUrl: chain[0].substring(0, 60), isRetry });
          const ct = audio.currentTime;
          const wp = isPlaying;
          audio.src = chain[0];
          audio.load();
          audio.addEventListener("canplay", async function onCanPlay() {
            audio.removeEventListener("canplay", onCanPlay);
            if (ct > 0 && !isNaN(ct)) audio.currentTime = ct;
            if (wp) {
              try { await audio.play(); logger.info("Recovered after format error", { trackId: activeTrack?.id }); }
              catch (e) {
                logger.error("Format recovery play failed", e, errorContext);
                recordError(`audio:${errorCode}:recovery_failed`, audio.error?.message || "Recovery failed", errorContext);
              }
            }
          }, { once: true });
          return;
        }
        logger.error("Format error with no fallbacks", null, errorContext);
      }

      // --- Unrecoverable ---
      logger.error("Audio playback error", null, errorContext);
      if (!inStartup) recordError(`audio:${errorCode}`, audio.error?.message || "Unknown audio error", errorContext);
      if (!inStartup) toast.error(errorInfo.ru, { description: errorInfo.action });
      pauseTrack();
      retryTimeoutId = setTimeout(() => { nextTrack(); }, 2000);
    };

    const handleStalled = async () => {
      logger.warn("Audio playback stalled", { trackId: activeTrack?.id, currentTime: audio.currentTime });
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch { /* ignore */ }
        playPromiseRef.current = null;
      }
      const ct = audio.currentTime;
      audio.load();
      audio.currentTime = ct;
      if (isPlaying) audio.play().catch((e) => logger.error("Stall recovery failed", e));
    };

    const handleSuspend = () => {
      logger.debug("Audio loading suspended", { trackId: activeTrack?.id, networkState: audio.networkState });
    };

    audio.addEventListener("error", handleError);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("suspend", handleSuspend);

    return () => {
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("suspend", handleSuspend);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [audioRef, playPromiseRef, activeTrack, isPlaying, isMobileBrowser, mobileBrowserInfo, pauseTrack, nextTrack, isStartupPeriod]);
}
