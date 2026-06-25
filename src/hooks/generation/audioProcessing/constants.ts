/**
 * Audio Processing Constants
 * Status messages and progress values for all operations
 */

import type { AudioProcessingOperation, ProcessingStatus } from "./types";

// ==========================================
// Status Messages
// ==========================================

export const STATUS_MESSAGES: Record<AudioProcessingOperation, Record<ProcessingStatus, string>> = {
  extend: {
    idle: "",
    submitting: "Отправляем запрос...",
    pending: "В очереди на обработку...",
    processing: "AI расширяет трек...",
    streaming_ready: "Почти готово...",
    completed: "Трек расширен!",
    error: "Ошибка при расширении трека",
  },
  cover: {
    idle: "",
    submitting: "Отправляем запрос...",
    pending: "В очереди на обработку...",
    processing: "AI создаёт кавер...",
    streaming_ready: "Почти готово...",
    completed: "Кавер готов!",
    error: "Ошибка при создании кавера",
  },
  add_vocals: {
    idle: "",
    submitting: "Отправляем запрос...",
    pending: "В очереди на обработку...",
    processing: "AI добавляет вокал...",
    streaming_ready: "Почти готово...",
    completed: "Вокал добавлен!",
    error: "Ошибка при добавлении вокала",
  },
  add_instrumental: {
    idle: "",
    submitting: "Отправляем запрос...",
    pending: "В очереди на обработку...",
    processing: "AI создаёт инструментал...",
    streaming_ready: "Почти готово...",
    completed: "Инструментал готов!",
    error: "Ошибка при создании инструментала",
  },
};

// ==========================================
// Progress Values
// ==========================================

export const STATUS_PROGRESS: Record<ProcessingStatus, number> = {
  idle: 0,
  submitting: 10,
  pending: 20,
  processing: 50,
  streaming_ready: 80,
  completed: 100,
  error: 0,
};

// ==========================================
// Operation Endpoints
// ==========================================

export const OPERATION_ENDPOINTS: Record<AudioProcessingOperation, string> = {
  extend: "suno-music-extend",
  cover: "suno-upload-cover",
  add_vocals: "suno-add-vocals",
  add_instrumental: "suno-add-instrumental",
};

// ==========================================
// Default Track Titles
// ==========================================

export const DEFAULT_TITLES: Record<AudioProcessingOperation, string> = {
  extend: "Расширенный трек",
  cover: "Кавер",
  add_vocals: "Трек с вокалом",
  add_instrumental: "Инструментал",
};

// ==========================================
// Query Keys to Invalidate
// ==========================================

export const INVALIDATE_QUERY_KEYS: Record<AudioProcessingOperation, string[][]> = {
  extend: [["user-tracks"], ["library"], ["tracks"]],
  cover: [["user-tracks"], ["library"], ["tracks"]],
  add_vocals: [["user-tracks"], ["library"], ["tracks"]],
  add_instrumental: [["user-tracks"], ["library"], ["tracks"], ["studio-projects"]],
};
