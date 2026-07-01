/**
 * Типы для PromptDJ-экосистемы.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042
 * (god-hook декомпозиция 1071 → ... LOC).
 */

import type { CHANNEL_TYPES } from "./constants";

export type ChannelType = (typeof CHANNEL_TYPES)[number]["type"];

export interface PromptChannel {
  id: string;
  type: ChannelType;
  value: string;
  /** Вес канала при генерации: 0..1 */
  weight: number;
  enabled: boolean;
  deck?: "A" | "B" | "both";
}

export interface GlobalSettings {
  bpm: number;
  key: string;
  scale: string;
  density: number;
  brightness: number;
  duration: number;
}

export interface GeneratedTrack {
  id: string;
  prompt: string;
  audioUrl: string;
  createdAt: Date;
}
