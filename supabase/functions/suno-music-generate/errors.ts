// User-friendly error mapping + retry classification for Suno generation

export const ERROR_MESSAGES: Record<string, string> = {
  "model error": "Ошибка модели AI. Пробуем другую модель...",
  "Audio generation failed": "Генерация не удалась. Попробуйте изменить описание.",
  malformed: "Проверьте текст песни. Он должен содержать структуру (куплеты, припевы).",
  "artist name": "Нельзя использовать имена известных артистов. Измените описание.",
  copyrighted: "Текст содержит защищённый материал. Измените слова.",
  "rate limit": "Слишком много запросов. Подождите минуту.",
  credits: "Недостаточно кредитов на балансе.",
  voice: "Кастомный голос недоступен или был отозван. Выберите другой голос или отключите его.",
};

export function getUserFriendlyError(errorMsg: string): string {
  const lowerError = errorMsg.toLowerCase();
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (lowerError.includes(key.toLowerCase())) return message;
  }
  return errorMsg;
}

export function isRetriableModelError(errorMsg: string): boolean {
  const lowerError = errorMsg.toLowerCase();
  return (
    lowerError.includes("model error") ||
    lowerError.includes("audio generation failed") ||
    lowerError.includes("malformed")
  );
}

export function isTransientError(status: number | null, errorMsg: string): boolean {
  if (!status) return false;
  if (status >= 500 && status < 600) return true;
  if (status === 429) return true;
  const lowerError = errorMsg.toLowerCase();
  return lowerError.includes("timeout") || lowerError.includes("network") || lowerError.includes("econnreset");
}

export function classifyErrorCode(errorMsg: string): string {
  const lowerError = errorMsg.toLowerCase();
  if (lowerError.includes("artist name")) return "ARTIST_NAME_NOT_ALLOWED";
  if (lowerError.includes("copyrighted")) return "COPYRIGHTED_CONTENT";
  if (lowerError.includes("malformed")) return "MALFORMED_LYRICS";
  if (lowerError.includes("voice")) return "VOICE_UNAVAILABLE";
  return "GENERATION_FAILED";
}

export const NON_RETRIABLE_ERROR_CODES = [
  "ARTIST_NAME_NOT_ALLOWED",
  "COPYRIGHTED_CONTENT",
  "MALFORMED_LYRICS",
  "VOICE_UNAVAILABLE",
];

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
