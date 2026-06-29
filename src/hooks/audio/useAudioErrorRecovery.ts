/**
 * useAudioErrorRecovery
 *
 * Handles audio error recovery including:
 * - Track ended → repeat or next
 * - Network retry with fallback URLs + cache-busting
 * - Format error recovery with fallback chain
 * - Stall recovery
 * - Auto-skip on persistent errors
 *
 * Extracted from GlobalAudioProvider for modularity.
 */

import { useEffect } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { AUDIO_ERROR_MESSAGES } from "@/hooks/audio/usePlaybackStatusSync";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { playerAnalytics, recordError } from "@/lib/telemetry";

interface UseAudioErrorRecoveryOptions {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playPromiseRef: React.MutableRefObject<Promise<void> | null>;
  isMobileBrowser: boolean;
  mobileBrowserInfo: React.MutableRefObject<ReturnType<typeof import("@/lib/audioFormatUtils").detectMobileBrowser>>;
  isStartupPeriod: () => boolean;
}

export function useAudioErrorRecovery({
  audioRef,
  playPromiseRef,
  isMobileBrowser,
  mobileBrowserInfo,
  isStartupPeriod,
}: UseAudioErrorRecoveryOptions) {
  const { activeTrack, isPlaying, repeat, nextTrack, pauseTrack } = usePlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug("Track ended", { trackId: activeTrack?.id });
      playerAnalytics.trackComplete(activeTrack?.id || "", audio.currentTime, audio.duration);
      if (repeat === "one") {
        // Ensure audio is still available and valid before repeating
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

    // Track retry attempts for failed loads
    let networkRetryCount = 0;
    let formatRetryCount = 0;
    const MAX_NETWORK_RETRIES = 3;
    const MAX_FORMAT_RETRIES = 2;
    let retryTimeoutId: NodeJS.Timeout | null = null;

    let hasAttemptedBlobRecovery = false;
    const attemptedUrls = new Set<string>();

    const handleError = () => {
      const currentSrc = audio.src || "";
      if (!currentSrc || currentSrc === "" || currentSrc === window.location.href) {
        logger.debug("Ignoring error for empty/invalid src");
        return;
      }

      const inStartupPeriod = isStartupPeriod();

      const errorCode = audio.error?.code || 0;
      const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || {
        ru: "Ошибка воспроизведения",
      };

      const isBlobSource = audio.src?.startsWith("blob:");
      const isPipelineError =
        audio.error?.message?.includes("PIPELINE_ERROR_READ") || audio.error?.message?.includes("FFmpegDemuxer");

      const errorContext = {
        errorCode,
        errorType: (errorInfo as { errorType?: string }).errorType,
        errorMessage: audio.error?.message,
        isPipelineError,
        trackId: activeTrack?.id,
        title: activeTrack?.title,
        source: audio.src?.substring(0, 100),
        isBlobSource,
        hasStreamingUrl: !!activeTrack?.streaming_url,
        hasAudioUrl: !!activeTrack?.audio_url,
        hasLocalAudioUrl: !!activeTrack?.local_audio_url,
        networkRetryCount,
        formatRetryCount,
        isMobile: isMobileBrowser,
        browser: mobileBrowserInfo.current.browserName,
        os: mobileBrowserInfo.current.osName,
        readyState: audio.readyState,
        networkState: audio.networkState,
        bufferedRanges: audio.buffered.length,
        duration: audio.duration,
        currentTime: audio.currentTime,
      };

      const suppressToast = inStartupPeriod;

      // Phase 2.1: Enhanced network error handling (code 2) with cache-busting retry
      if (errorCode === 2 && networkRetryCount < MAX_NETWORK_RETRIES) {
        networkRetryCount++;

        const allAudioUrls = [activeTrack?.streaming_url, activeTrack?.audio_url, activeTrack?.local_audio_url].filter(
          (url) => url && !attemptedUrls.has(url),
        );

        if (allAudioUrls.length > 0) {
          const fallbackUrl = allAudioUrls[0]!;
          attemptedUrls.add(fallbackUrl);

          logger.info("Network error (code 2), trying alternative URL", {
            ...errorContext,
            fallbackUrl: fallbackUrl.substring(0, 60),
            attempt: networkRetryCount,
            maxRetries: MAX_NETWORK_RETRIES,
          });

          const currentTime = audio.currentTime;
          const wasPlaying = isPlaying;

          audio.src = fallbackUrl;
          audio.load();

          audio.addEventListener(
            "canplay",
            async function onCanPlay() {
              audio.removeEventListener("canplay", onCanPlay);

              if (currentTime > 0 && !isNaN(currentTime)) {
                audio.currentTime = currentTime;
              }

              if (wasPlaying) {
                try {
                  await audio.play();
                  logger.info("Playback recovered after network error with alternative URL", {
                    trackId: activeTrack?.id,
                    fallbackUrl: fallbackUrl.substring(0, 60),
                  });
                } catch (playErr) {
                  logger.warn("Recovery play after network error failed", {
                    error: playErr instanceof Error ? playErr.message : String(playErr),
                  });
                }
              }
            },
            { once: true },
          );

          return;
        }

        // No alternative URLs, try cache-busting retry
        const currentUrl = audio.src;
        if (currentUrl && !currentUrl.includes("retry=")) {
          const urlSeparator = currentUrl.includes("?") ? "&" : "?";
          const cacheBustingUrl = `${currentUrl}${urlSeparator}retry=${Date.now()}`;

          logger.info("Network error (code 2), retrying with cache-busting", {
            ...errorContext,
            attempt: networkRetryCount,
            maxRetries: MAX_NETWORK_RETRIES,
          });

          const retryDelay = Math.pow(2, networkRetryCount - 1) * 1000;

          retryTimeoutId = setTimeout(() => {
            audio.src = cacheBustingUrl;
            audio.load();

            if (isPlaying) {
              audio.play().catch((playErr) => {
                logger.warn("Cache-busting retry play failed", playErr);
              });
            }

            if (!suppressToast) {
              toast.info("Повторная попытка загрузки...", {
                description: `Попытка ${networkRetryCount} из ${MAX_NETWORK_RETRIES}`,
              });
            }
          }, retryDelay);

          return;
        }
      }

      // Handle format error (code 4) with automatic recovery using fallback chain
      if (errorCode === 4 && !hasAttemptedBlobRecovery && formatRetryCount < MAX_FORMAT_RETRIES) {
        hasAttemptedBlobRecovery = true;
        formatRetryCount++;

        const allAudioUrls = [activeTrack?.streaming_url, activeTrack?.audio_url, activeTrack?.local_audio_url].filter(
          (url) => url && !attemptedUrls.has(url),
        );

        const uniqueUrls = Array.from(new Set(allAudioUrls));
        let fallbackChain = uniqueUrls.filter((url) => url !== audio.src);

        let isRetryingSameUrl = false;
        if (fallbackChain.length === 0 && uniqueUrls.length > 0) {
          const baseUrl = uniqueUrls[0]!;
          const urlSeparator = baseUrl.includes("?") ? "&" : "?";
          const cacheBustingUrl = `${baseUrl}${urlSeparator}retry=${Date.now()}`;
          fallbackChain = [cacheBustingUrl];
          isRetryingSameUrl = true;

          logger.info("All audio URLs are identical, retrying with cache-busting", {
            trackId: activeTrack?.id,
            originalUrl: baseUrl.substring(0, 60),
            uniqueUrlsCount: uniqueUrls.length,
            isMobile: isMobileBrowser,
          });
        }

        if (fallbackChain.length > 0) {
          const fallbackUrl = fallbackChain[0]!;
          attemptedUrls.add(fallbackUrl);

          logger.info("Format error (code 4), attempting fallback to next URL in chain", {
            ...errorContext,
            currentSource: isBlobSource ? "blob URL" : "canonical URL",
            fallbackUrl: fallbackUrl?.substring(0, 60),
            fallbacksRemaining: fallbackChain.length,
            recoveryAttempt: true,
            isRetryingSameUrl,
            strategy: isRetryingSameUrl ? "cache-busting-retry" : "alternative-url",
          });

          const currentTime = audio.currentTime;
          const wasPlaying = isPlaying;

          audio.src = fallbackUrl;
          audio.load();

          audio.addEventListener(
            "canplay",
            async function onCanPlay() {
              audio.removeEventListener("canplay", onCanPlay);

              if (currentTime > 0 && !isNaN(currentTime)) {
                audio.currentTime = currentTime;
              }

              if (wasPlaying) {
                try {
                  await audio.play();
                  logger.info("Playback recovered successfully after format error", {
                    trackId: activeTrack?.id,
                    isMobile: isMobileBrowser,
                    fallbackUsed: fallbackUrl?.substring(0, 60),
                    wasRetryingSameUrl: isRetryingSameUrl,
                  });
                } catch (playErr) {
                  logger.error("Recovery play after format error failed", playErr, {
                    ...errorContext,
                    fallbackUrl: fallbackUrl?.substring(0, 60),
                    wasRetryingSameUrl: isRetryingSameUrl,
                  });
                  recordError(
                    `audio:${errorCode}:recovery_failed`,
                    audio.error?.message || "Recovery failed after format error",
                    {
                      ...errorContext,
                      fallbackUrl: fallbackUrl?.substring(0, 60),
                      wasRetryingSameUrl: isRetryingSameUrl,
                    },
                  );
                }
              }
            },
            { once: true },
          );

          return;
        } else {
          logger.error("Format error (code 4) with no fallback URLs available", null, errorContext);
        }
      }

      // Log error with full context
      logger.error("Audio playback error", null, errorContext);

      if (!inStartupPeriod) {
        recordError(`audio:${errorCode}`, audio.error?.message || "Unknown audio error", errorContext);
      }

      if (!suppressToast) {
        toast.error(errorInfo.ru, {
          description: errorInfo.action,
        });
      }

      pauseTrack();

      // Auto-skip to next track after 2 seconds for better UX
      retryTimeoutId = setTimeout(() => {
        logger.debug("Auto-skipping to next track after error");
        nextTrack();
      }, 2000);
    };

    const handleStalled = async () => {
      logger.warn("Audio playback stalled", {
        trackId: activeTrack?.id,
        currentTime: audio.currentTime,
        buffered: audio.buffered.length,
      });

      // Wait for any pending play promise before attempting recovery
      if (playPromiseRef.current) {
        logger.debug("Waiting for pending play promise before stall recovery");
        try {
          await playPromiseRef.current;
        } catch (err) {
          logger.debug(
            "Pending play promise rejected during stall recovery",
            err instanceof Error ? { message: err.message } : undefined,
          );
        }
        playPromiseRef.current = null;
      }

      const currentTime = audio.currentTime;
      audio.load();
      audio.currentTime = currentTime;

      if (isPlaying) {
        audio.play().catch((err) => {
          logger.error("Failed to recover from stall", err);
        });
      }
    };

    const handleSuspend = () => {
      logger.debug("Audio loading suspended", {
        trackId: activeTrack?.id,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("suspend", handleSuspend);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("suspend", handleSuspend);

      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [
    repeat,
    nextTrack,
    pauseTrack,
    activeTrack,
    isPlaying,
    audioRef,
    playPromiseRef,
    isMobileBrowser,
    mobileBrowserInfo,
    isStartupPeriod,
  ]);
}
