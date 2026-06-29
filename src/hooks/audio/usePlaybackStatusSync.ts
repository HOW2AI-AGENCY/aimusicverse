/**
 * usePlaybackStatusSync
 *
 * Attaches audio element event listeners to sync playback status
 * (loading, buffering, playing, paused, idle, error) to the Zustand player store.
 * Extracted from GlobalAudioProvider for modularity.
 */

import { useEffect } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

// Audio error messages by error code with detailed recovery info
export const AUDIO_ERROR_MESSAGES: Record<
  number,
  {
    ru: string;
    action?: string;
    retryable?: boolean;
    errorType: string;
  }
> = {
  1: {
    ru: "Загрузка аудио прервана",
    action: "Попробуйте еще раз",
    retryable: true,
    errorType: "MEDIA_ERR_ABORTED",
  },
  2: {
    ru: "Сетевая ошибка при загрузке",
    action: "Проверьте подключение",
    retryable: true,
    errorType: "MEDIA_ERR_NETWORK",
  },
  3: {
    ru: "Ошибка декодирования аудио",
    action: "Файл может быть поврежден",
    retryable: false,
    errorType: "MEDIA_ERR_DECODE",
  },
  4: {
    ru: "Формат аудио не поддерживается",
    action: "Попробуйте другой трек",
    retryable: true,
    errorType: "MEDIA_ERR_SRC_NOT_SUPPORTED",
  },
};

export function usePlaybackStatusSync(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const setPlaybackStatus = usePlayerStore((s) => s.setPlaybackStatus);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadStart = () => setPlaybackStatus(activeTrack ? "loading" : "idle");
    const onWaiting = () => setPlaybackStatus("buffering");
    const onPlaying = () => setPlaybackStatus("playing");
    const onPause = () => {
      // Don't override 'loading'/'buffering' with 'paused' if we never started.
      if (audio.currentTime > 0 || audio.readyState >= 2) setPlaybackStatus("paused");
    };
    const onEnded = () => setPlaybackStatus("idle");
    const onCanPlay = () => {
      if (audio.paused) setPlaybackStatus("paused");
    };
    const onErr = () => {
      const msg = audio.error?.message || AUDIO_ERROR_MESSAGES[audio.error?.code || 0]?.ru || "Ошибка воспроизведения";
      setPlaybackStatus("error", msg);
    };

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onErr);

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onErr);
    };
  }, [activeTrack, setPlaybackStatus, audioRef]);
}
