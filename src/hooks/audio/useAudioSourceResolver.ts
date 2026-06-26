/**
 * Hook to resolve the best audio source URL from a track.
 *
 * Handles mobile format compatibility checks, blob URL filtering,
 * URL validation (http, blob, data), and user-facing error toasts.
 */

import { useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { detectMobileBrowser, isAudioFormatSupported } from "@/lib/audioFormatUtils";
import type { Track } from "@/types/track";

export function useAudioSourceResolver(
  activeTrack: Track | null | undefined,
  isStartupPeriod: () => boolean,
) {
  const mobileBrowserInfo = useRef(detectMobileBrowser());
  const isMobileBrowser = mobileBrowserInfo.current.isMobile;

  const getAudioSource = useCallback((): string | null => {
    if (!activeTrack) {
      logger.debug("No active track");
      return null;
    }

    // Build fallback chain: prefer streaming_url > local_audio_url > audio_url
    const sources = [
      { url: activeTrack.local_audio_url, label: "local_audio_url (blob)" },
      { url: activeTrack.streaming_url, label: "streaming_url" },
      { url: activeTrack.audio_url, label: "audio_url" },
    ].filter((s) => s.url);

    if (sources.length === 0) {
      logger.warn("Track has no audio source", {
        trackId: activeTrack.id,
        title: activeTrack.title,
        status: activeTrack.status,
      });

      toast.error("Трек не готов к воспроизведению", {
        description:
          activeTrack.status === "processing"
            ? "Трек еще генерируется, подождите..."
            : "Файл трека отсутствует",
      });

      return null;
    }

    // On mobile devices, proactively check format compatibility
    if (isMobileBrowser) {
      const compatibleSources = sources.filter((s) => {
        const url = s.url!;

        if (url.startsWith("blob:") && sources.length > 1) {
          logger.debug("Skipping blob URL on mobile in favor of canonical URL", {
            trackId: activeTrack.id,
            availableSources: sources.length,
          });
          return false;
        }

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

      const finalSources =
        compatibleSources.length > 0 ? compatibleSources : sources;

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

    try {
      if (source.startsWith("blob:")) {
        logger.debug("Using blob URL", { trackId: activeTrack.id });
        return source;
      }

      if (source.startsWith("data:")) {
        if (source.startsWith("data:audio/")) {
          logger.debug("Using data URL", { trackId: activeTrack.id });
          return source;
        }
        logger.warn("Invalid data URL format", { trackId: activeTrack.id });
        return null;
      }

      const url = new URL(source);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        logger.warn("Invalid audio URL protocol", {
          protocol: url.protocol,
          trackId: activeTrack.id,
        });
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
      logger.error(
        "Invalid audio URL",
        err instanceof Error ? err : new Error(String(err)),
        {
          source: source.substring(0, 100),
          trackId: activeTrack.id,
        },
      );
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
