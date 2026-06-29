/**
 * useAudioSourceResolver
 *
 * Resolves the best audio URL from track data with fallback chain and mobile format filtering.
 * Extracted from GlobalAudioProvider for modularity.
 */

import { useCallback, useRef } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { detectMobileBrowser, isAudioFormatSupported } from "@/lib/audioFormatUtils";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";

interface UseAudioSourceResolverOptions {
  /** Function that returns true during startup period (suppresses toasts) */
  isStartupPeriod: () => boolean;
}

export function useAudioSourceResolver({ isStartupPeriod }: UseAudioSourceResolverOptions) {
  const activeTrack = usePlayerStore((s) => s.activeTrack);

  const mobileBrowserInfo = useRef(detectMobileBrowser());
  const isMobileBrowser = mobileBrowserInfo.current.isMobile;

  const getAudioSource = useCallback(() => {
    if (!activeTrack) {
      logger.debug("No active track");
      return null;
    }

    // Build fallback chain: prefer streaming_url > local_audio_url > audio_url
    // On mobile with format errors, we'll skip blob URLs in favor of canonical URLs
    const sources = [
      { url: activeTrack.local_audio_url, label: "local_audio_url (blob)" },
      { url: activeTrack.streaming_url, label: "streaming_url" },
      { url: activeTrack.audio_url, label: "audio_url" },
    ].filter((s) => s.url); // Remove null/undefined sources

    // If no sources available, show error
    if (sources.length === 0) {
      logger.warn("Track has no audio source", {
        trackId: activeTrack.id,
        title: activeTrack.title,
        status: activeTrack.status,
      });

      toast.error("Трек не готов к воспроизведению", {
        description:
          activeTrack.status === "processing" ? "Трек еще генерируется, подождите..." : "Файл трека отсутствует",
      });

      return null;
    }

    // On mobile devices, proactively check format compatibility
    if (isMobileBrowser) {
      // Filter out sources that are known to be incompatible
      const compatibleSources = sources.filter((s) => {
        const url = s.url!;

        // Skip blob URLs on mobile if we have canonical URLs available
        if (url.startsWith("blob:") && sources.length > 1) {
          logger.debug("Skipping blob URL on mobile in favor of canonical URL", {
            trackId: activeTrack.id,
            availableSources: sources.length,
          });
          return false;
        }

        // Check format compatibility for non-blob URLs
        if (!url.startsWith("blob:")) {
          const isSupported = isAudioFormatSupported(url);
          if (!isSupported) {
            logger.warn("Audio format may not be supported on mobile", {
              trackId: activeTrack.id,
              url: url.substring(0, 60),
              browser: mobileBrowserInfo.current.browserName,
            });
          }
          return isSupported;
        }

        return true;
      });

      // If we filtered everything out, use original list (let browser try)
      const finalSources = compatibleSources.length > 0 ? compatibleSources : sources;

      // Use first compatible source
      const selectedSource = finalSources[0];
      logger.info("Selected audio source for mobile", {
        trackId: activeTrack.id,
        selectedSource: selectedSource.label,
        url: selectedSource.url!.substring(0, 60),
        totalSources: sources.length,
        compatibleSources: compatibleSources.length,
      });

      return selectedSource.url!;
    }

    // On desktop, use first available source
    const source = sources[0].url!;

    // Check for valid URL format
    try {
      // For blob URLs, just check prefix
      if (source.startsWith("blob:")) {
        logger.debug("Using blob URL", { trackId: activeTrack.id });
        return source;
      }

      // For data URLs, check format
      if (source.startsWith("data:")) {
        if (source.startsWith("data:audio/")) {
          logger.debug("Using data URL", { trackId: activeTrack.id });
          return source;
        }
        logger.warn("Invalid data URL format", { trackId: activeTrack.id });
        return null;
      }

      // For HTTP(S) URLs, validate
      const url = new URL(source);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        logger.warn("Invalid audio URL protocol", { protocol: url.protocol, trackId: activeTrack.id });
        if (!isStartupPeriod()) {
          toast.error("Неверный формат URL аудио");
        }
        return null;
      }

      logger.debug("Using HTTP(S) URL", {
        trackId: activeTrack.id,
        protocol: url.protocol,
        hostname: url.hostname,
      });
      return source;
    } catch (err) {
      logger.error("Invalid audio URL", err instanceof Error ? err : new Error(String(err)), {
        source: source.substring(0, 100),
        trackId: activeTrack.id,
      });
      if (!isStartupPeriod()) {
        toast.error("Ошибка URL аудио", {
          description: "Неверный формат ссылки на аудиофайл",
        });
      }
      return null;
    }
  }, [activeTrack, isMobileBrowser, isStartupPeriod]);

  return { getAudioSource, isMobileBrowser, mobileBrowserInfo };
}
