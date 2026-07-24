/**
 * Human-readable labels for Suno callback skip / failure codes.
 * Kept small and dependency-free so both the callback handlers and the
 * status panel can share the same mapping without pulling react/i18n.
 */

export type GenerationSkipCode =
  | "missing_audio_url"
  | "missing_stream_url"
  | "missing_image_url"
  | "empty_clip"
  | "partial_delivery"
  | "retry_requested"
  | "unknown";

interface SkipCopy {
  title: string;
  hint: string;
}

export const GENERATION_SKIP_LABELS_RU: Record<GenerationSkipCode, SkipCopy> = {
  missing_audio_url: {
    title: "Не пришла ссылка на аудио",
    hint: "Suno ещё не отдал итоговый файл. Часто помогает «Повторить обработку» через пару минут.",
  },
  missing_stream_url: {
    title: "Нет потоковой ссылки",
    hint: "Стриминг для предпрослушивания недоступен. Финальный файл может прийти позже.",
  },
  missing_image_url: {
    title: "Не пришла обложка",
    hint: "Аудио сохранено, но обложка ещё не сгенерирована. Обычно приходит в течение минуты.",
  },
  empty_clip: {
    title: "Suno вернул пустой клип",
    hint: "Провайдер прислал элемент без данных. Попробуйте перегенерировать трек.",
  },
  partial_delivery: {
    title: "Частичная доставка",
    hint: "Пришла только часть версий. Остальные могут появиться позже — попробуйте повторить обработку.",
  },
  retry_requested: {
    title: "Повторная сборка",
    hint: "Запрошена повторная обработка задачи.",
  },
  unknown: {
    title: "Неизвестная причина",
    hint: "Код не распознан — проверьте детали в логах.",
  },
};

export function labelForSkipCode(
  code: string | null | undefined,
): SkipCopy {
  if (!code) return GENERATION_SKIP_LABELS_RU.unknown;
  return (
    GENERATION_SKIP_LABELS_RU[code as GenerationSkipCode] ??
    GENERATION_SKIP_LABELS_RU.unknown
  );
}
