/**
 * usePreviewAudio — единый хук для превью-аудио в UI (диалоги, кнопки play, версии, стемы).
 *
 * Проблема: 28+ мест в `src/` создают `new Audio(...)` напрямую, минуя `audioElementPool`.
 * iOS Safari ограничивает количество одновременных `<audio>` элементов до 6-8 — при превышении
 * лимита плейер крашится.
 *
 * Решение: `usePreviewAudio` оборачивает `audioElementPool` + `useStudioAudio` и предоставляет
 * простой API `play/pause/seek/setVolume/onEnded`. При размонтировании элемент
 * автоматически возвращается в пул.
 *
 * Использование:
 * ```tsx
 * function PreviewButton({ url }: { url: string }) {
 *   const { isPlaying, play, pause } = usePreviewAudio({
 *     id: `preview-${url}`,
 *     src: url,
 *     priority: AudioPriority.LOW,
 *   });
 *   return <Button onClick={isPlaying ? pause : play}>{isPlaying ? "Stop" : "Play"}</Button>;
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { audioElementPool, AudioPriority, useAudioElement } from "@/lib/audioElementPool";
import { registerStudioAudio, unregisterStudioAudio } from "@/hooks/studio/useStudioAudio";
import { logger } from "@/lib/logger";

export interface UsePreviewAudioOptions {
  /** Уникальный ID (например, `preview-track-${trackId}`). Используется для acquire/release в пуле. */
  id: string;
  /** URL аудио. */
  src: string;
  /** Приоритет в пуле. LOW для превью, MEDIUM/HIGH для стемов. */
  priority?: AudioPriority;
  /** Автоплей при монтировании. */
  autoPlay?: boolean;
  /** Громкость 0..1. */
  volume?: number;
  /** Коллбэк завершения. */
  onEnded?: () => void;
  /** Коллбэк ошибки. */
  onError?: (message: string) => void;
}

export interface UsePreviewAudioReturn {
  /** Текущее состояние воспроизведения. */
  isPlaying: boolean;
  /** Текущая позиция (секунды). */
  currentTime: number;
  /** Длительность (секунды, 0 если не загружено). */
  duration: number;
  /** true пока идёт загрузка метаданных. */
  isLoading: boolean;
  /** Сообщение об ошибке или null. */
  error: string | null;
  /** Начать воспроизведение текущего src. */
  play: () => Promise<void>;
  /** Переключить src и сразу запустить воспроизведение. Для динамических плейлистов. */
  playUrl: (url: string) => Promise<void>;
  /** Поставить на паузу. */
  pause: () => void;
  /** Переключить play/pause. */
  toggle: () => Promise<void>;
  /** Перемотать на time (секунды). */
  seek: (time: number) => void;
  /** Установить громкость 0..1. */
  setVolume: (volume: number) => void;
  /** Ref на элемент (для waveform/visualizer). */
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

/**
 * Drop-in замена `new Audio()` для превью-кнопок в UI.
 *
 * - Берёт элемент из `audioElementPool` (защита от iOS Safari лимита).
 * - Регистрируется в `useStudioAudio` (пауза при старте глобального плейера).
 * - Освобождает ресурсы при unmount.
 */
export function usePreviewAudio({
  id,
  src,
  priority = AudioPriority.LOW,
  autoPlay = false,
  volume = 1,
  onEnded,
  onError,
}: UsePreviewAudioOptions): UsePreviewAudioReturn {
  const audioElement = useAudioElement(id, priority);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Храним callback-и через ref, чтобы не пересоздавать audio element при их изменении.
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  }, [onEnded, onError]);

  // Привязка событий + установка src.
  useEffect(() => {
    if (!audioElement) {
      audioRef.current = null;
      return;
    }
    if (!src) {
      // Нет валидного URL — не трогаем элемент, не грузим, не роняем ошибку.
      audioRef.current = audioElement;
      setIsLoading(false);
      setError(null);
      return;
    }
    audioRef.current = audioElement;

    // Регистрация в координаторе studio audio (пауза при старте глобального плейера).
    registerStudioAudio(
      id,
      () => {
        audioElement.pause();
        setIsPlaying(false);
      },
      () => !audioElement.paused,
    );

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration || 0);
      setIsLoading(false);
      setError(null);
    };
    const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEndedRef.current?.();
    };
    const handleError = () => {
      const msg = "Не удалось загрузить аудио";
      setIsLoading(false);
      setIsPlaying(false);
      setError(msg);
      onErrorRef.current?.(msg);
      logger.warn("usePreviewAudio: load failed", { id, src });
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    try {
      audioElement.volume = Math.max(0, Math.min(1, volume));
      audioElement.src = src;
      audioElement.load();
    } catch (err) {
      logger.warn("usePreviewAudio: failed to set src", { id, src, err });
      setError("Не удалось загрузить аудио");
      setIsLoading(false);
    }

    if (autoPlay) {
      audioElement.play().catch(() => {
        // autoplay заблокирован — это норма, ничего не делаем
      });
    }

    return () => {
      audioElement.pause();
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      unregisterStudioAudio(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioElement, id, src]);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch (err) {
      const msg = "Воспроизведение заблокировано";
      setError(msg);
      onErrorRef.current?.(msg);
      logger.warn("usePreviewAudio: play blocked", { id, err });
    }
  }, [id]);

  /**
   * Переключает src на новый URL и запускает воспроизведение.
   * Используется в динамических списках (TrackVersionsTab, CloudAudioPicker и т.п.),
   * где один пул-элемент используется для проигрывания разных треков по клику.
   */
  const playUrl = useCallback(
    async (newUrl: string) => {
      const el = audioRef.current;
      if (!el || !newUrl) return;
      try {
        el.src = newUrl;
        el.load();
        setCurrentTime(0);
        setError(null);
        await el.play();
      } catch (err) {
        const msg = "Воспроизведение заблокировано";
        setError(msg);
        onErrorRef.current?.(msg);
        logger.warn("usePreviewAudio: playUrl blocked", { id, newUrl, err });
      }
    },
    [id],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) pause();
    else await play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const el = audioRef.current;
    if (!el) return;
    const target = Math.max(0, Math.min(time, el.duration || 0));
    el.currentTime = target;
    setCurrentTime(target);
  }, []);

  const setVolume = useCallback((v: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = Math.max(0, Math.min(1, v));
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    play,
    playUrl,
    pause,
    toggle,
    seek,
    setVolume,
    audioRef,
  };
}

/**
 * Утилита для получения pool-статистики (для дев-тулзов и мониторинга).
 */
export function getPreviewPoolStats() {
  return audioElementPool.getStats();
}
