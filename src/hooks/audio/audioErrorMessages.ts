/**
 * Audio error message definitions by HTML5 MediaError code.
 */

export interface AudioErrorInfo {
  ru: string;
  action?: string;
  retryable?: boolean;
  errorType: string;
}

export const AUDIO_ERROR_MESSAGES: Record<number, AudioErrorInfo> = {
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

export const DEFAULT_ERROR_INFO: AudioErrorInfo = {
  ru: "Ошибка воспроизведения",
  errorType: "UNKNOWN",
};

/** Build error context object for logging/telemetry. */
export function buildErrorContext(
  audio: HTMLAudioElement,
  activeTrack: { id?: string; title?: string; streaming_url?: string; audio_url?: string; local_audio_url?: string } | null | undefined,
  extra: Record<string, unknown>,
) {
  const errorCode = audio.error?.code || 0;
  const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || DEFAULT_ERROR_INFO;

  return {
    errorCode,
    errorType: errorInfo.errorType,
    errorMessage: audio.error?.message,
    isPipelineError:
      audio.error?.message?.includes("PIPELINE_ERROR_READ") ||
      audio.error?.message?.includes("FFmpegDemuxer"),
    trackId: activeTrack?.id,
    title: activeTrack?.title,
    source: audio.src?.substring(0, 100),
    isBlobSource: audio.src?.startsWith("blob:"),
    hasStreamingUrl: !!activeTrack?.streaming_url,
    hasAudioUrl: !!activeTrack?.audio_url,
    hasLocalAudioUrl: !!activeTrack?.local_audio_url,
    readyState: audio.readyState,
    networkState: audio.networkState,
    bufferedRanges: audio.buffered.length,
    duration: audio.duration,
    currentTime: audio.currentTime,
    ...extra,
  };
}

/** Collect untried fallback URLs for a track. */
export function collectFallbackUrls(
  activeTrack: { streaming_url?: string; audio_url?: string; local_audio_url?: string } | null | undefined,
  attemptedUrls: Set<string>,
): string[] {
  return [
    activeTrack?.streaming_url,
    activeTrack?.audio_url,
    activeTrack?.local_audio_url,
  ].filter((url): url is string => !!url && !attemptedUrls.has(url));
}
