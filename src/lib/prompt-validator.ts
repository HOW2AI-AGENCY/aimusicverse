import { logger } from "@/lib/logger";

export interface PromptValidationResult {
  valid: boolean;
  errors: PromptValidationError[];
  warnings: PromptValidationWarning[];
  sanitizedPrompt: string;
}

export interface PromptValidationError {
  code: string;
  message: string;
  suggestion?: string;
}

export interface PromptValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export type PromptType = "prompt" | "lyrics" | "style";

interface PromptValidationOptions {
  type?: PromptType;
}

const LENGTH_LIMITS: Record<PromptType, { min: number; max: number }> = {
  prompt: { min: 3, max: 500 },
  lyrics: { min: 3, max: 3000 },
  style: { min: 1, max: 200 },
};

const VAGUE_SINGLE_WORDS = new Set([
  "music",
  "song",
  "track",
  "beat",
  "tune",
  "audio",
  "sound",
  "музыка",
  "песня",
  "трек",
  "бит",
  "мелодия",
  "звук",
]);

const CONTRADICTORY_PAIRS: [RegExp, RegExp][] = [
  [/\b(fast|быстр\w*)\b/i, /\b(slow|медленн\w*)\b/i],
  [/\b(happy|весел\w*|радостн\w*)\b/i, /\b(sad|грустн\w*|печальн\w*)\b/i],
  [/\b(loud|громк\w*)\b/i, /\b(quiet|тих\w*)\b/i],
  [/\b(aggressive|агрессивн\w*)\b/i, /\b(calm|спокойн\w*)\b/i],
  [/\b(major|мажорн\w*)\b/i, /\b(minor|минорн\w*)\b/i],
  [/\b(acoustic|акустическ\w*)\b/i, /\b(electronic|электронн\w*)\b/i],
  [/\b(upbeat|бодр\w*)\b/i, /\b(melancholic|меланхоличн\w*)\b/i],
];

const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{2,4}/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/i;

// eslint-disable-next-line no-misleading-character-class -- intentionally matching zero-width chars
const ZERO_WIDTH_PATTERN = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064]/g;
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const MULTI_SPACE_PATTERN = /[^\S\n]{2,}/g;
const MULTI_NEWLINE_PATTERN = /\n{4,}/g;

const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;

function sanitize(text: string): string {
  let result = text.trim();
  result = result.replace(ZERO_WIDTH_PATTERN, "");
  result = result.replace(CONTROL_CHAR_PATTERN, "");
  result = result.replace(MULTI_SPACE_PATTERN, " ");
  result = result.replace(MULTI_NEWLINE_PATTERN, "\n\n\n");
  return result;
}

function countEmojis(text: string): number {
  const matches = text.match(EMOJI_PATTERN);
  return matches ? matches.length : 0;
}

function getSpecialCharRatio(text: string): number {
  if (text.length === 0) return 0;
  const withoutSpaces = text.replace(/\s/g, "");
  if (withoutSpaces.length === 0) return 0;
  const alphanumeric = withoutSpaces.replace(/[a-zA-Za-яА-ЯёЁ0-9]/g, "");
  return alphanumeric.length / withoutSpaces.length;
}

function findRepeatedWords(text: string, threshold: number): string | null {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = new Map<string, number>();

  for (const word of words) {
    if (word.length < 2) continue;
    const count = (counts.get(word) || 0) + 1;
    counts.set(word, count);
    if (count >= threshold) return word;
  }

  return null;
}

function validateLength(text: string, type: PromptType, errors: PromptValidationError[]): void {
  const limits = LENGTH_LIMITS[type];
  const typeLabels: Record<PromptType, string> = {
    prompt: "Описание",
    lyrics: "Текст песни",
    style: "Теги стиля",
  };
  const label = typeLabels[type];

  if (text.length < limits.min) {
    errors.push({
      code: "TOO_SHORT",
      message: `${label} слишком короткое (минимум ${limits.min} символов)`,
      suggestion:
        type === "style"
          ? "Добавьте хотя бы один тег стиля, например: pop, rock, electronic"
          : "Добавьте больше деталей для лучшего результата",
    });
  }

  if (text.length > limits.max) {
    errors.push({
      code: "TOO_LONG",
      message: `${label} слишком длинное (максимум ${limits.max} символов, сейчас ${text.length})`,
      suggestion: `Сократите ${label.toLowerCase()} до ${limits.max} символов`,
    });
  }
}

function validateEncoding(text: string, errors: PromptValidationError[], warnings: PromptValidationWarning[]): void {
  if (CONTROL_CHAR_PATTERN.test(text)) {
    errors.push({
      code: "CONTROL_CHARS",
      message: "Текст содержит непечатаемые символы",
      suggestion: "Скопируйте текст заново из чистого источника",
    });
  }

  const emojiCount = countEmojis(text);
  if (emojiCount > 10 || (text.length > 0 && emojiCount / text.length > 0.2)) {
    warnings.push({
      code: "EXCESSIVE_EMOJI",
      message: `Слишком много эмодзи (${emojiCount}) - это может ухудшить результат`,
      suggestion: "Замените эмодзи словами для более точной генерации",
    });
  }
}

function validateContentQuality(text: string, type: PromptType, warnings: PromptValidationWarning[]): void {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  if (type === "prompt" && words.length === 1 && VAGUE_SINGLE_WORDS.has(words[0].toLowerCase())) {
    warnings.push({
      code: "TOO_VAGUE",
      message: "Слишком общее описание - результат может быть непредсказуемым",
      suggestion: 'Добавьте жанр, настроение или инструменты, например: "энергичный поп-рок с электрогитарой"',
    });
  }

  if (type === "style") {
    for (const [patternA, patternB] of CONTRADICTORY_PAIRS) {
      if (patternA.test(trimmed) && patternB.test(trimmed)) {
        warnings.push({
          code: "CONTRADICTORY_TAGS",
          message: "Обнаружены противоречивые теги стиля",
          suggestion: "Выберите одно направление для более точного результата",
        });
        break;
      }
    }
  }

  const repeatedWord = findRepeatedWords(trimmed, 5);
  if (repeatedWord) {
    warnings.push({
      code: "EXCESSIVE_REPETITION",
      message: `Слово "${repeatedWord}" повторяется слишком часто`,
      suggestion: "Используйте синонимы или уберите лишние повторения",
    });
  }
}

function validateForbiddenContent(text: string, errors: PromptValidationError[]): void {
  if (PHONE_PATTERN.test(text)) {
    errors.push({
      code: "PHONE_NUMBER",
      message: "Текст содержит номер телефона",
      suggestion: "Удалите номер телефона из текста",
    });
  }

  if (EMAIL_PATTERN.test(text)) {
    errors.push({
      code: "EMAIL_ADDRESS",
      message: "Текст содержит email-адрес",
      suggestion: "Удалите email из текста",
    });
  }

  if (URL_PATTERN.test(text)) {
    errors.push({
      code: "URL_DETECTED",
      message: "Текст содержит URL-ссылку",
      suggestion: "Удалите ссылку из текста",
    });
  }

  const ratio = getSpecialCharRatio(text);
  if (ratio > 0.3) {
    errors.push({
      code: "EXCESSIVE_SPECIAL_CHARS",
      message: "Слишком много спецсимволов в тексте",
      suggestion: "Используйте больше обычного текста вместо символов",
    });
  }
}

export function validatePrompt(prompt: string, options?: PromptValidationOptions): PromptValidationResult {
  const type = options?.type ?? "prompt";
  const sanitizedPrompt = sanitize(prompt);
  const errors: PromptValidationError[] = [];
  const warnings: PromptValidationWarning[] = [];

  if (sanitizedPrompt.length === 0) {
    return {
      valid: false,
      errors: [
        {
          code: "EMPTY",
          message: "Текст не может быть пустым",
          suggestion: "Введите описание для генерации музыки",
        },
      ],
      warnings: [],
      sanitizedPrompt: "",
    };
  }

  validateLength(sanitizedPrompt, type, errors);
  validateEncoding(prompt, errors, warnings);
  validateContentQuality(sanitizedPrompt, type, warnings);
  validateForbiddenContent(sanitizedPrompt, errors);

  const valid = errors.length === 0;

  if (!valid) {
    logger.warn("Prompt validation failed", {
      type,
      errorCodes: errors.map((e) => e.code),
      promptLength: prompt.length,
    });
  }

  return { valid, errors, warnings, sanitizedPrompt };
}
