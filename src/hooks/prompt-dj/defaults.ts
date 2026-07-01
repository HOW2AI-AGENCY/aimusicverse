/**
 * Дефолтные значения каналов и настроек PromptDJ.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042
 * (god-hook декомпозиция 1071 → ... LOC).
 */

import type { PromptChannel, GlobalSettings } from "./types";

/** 9 дефолтных каналов (3×3 сетка): жанр, инструмент, настроение и т.д. */
export const DEFAULT_CHANNELS: PromptChannel[] = [
  // Row 1
  { id: "ch1", type: "genre", value: "", weight: 0.5, enabled: true },
  { id: "ch2", type: "instrument", value: "", weight: 0.5, enabled: true },
  { id: "ch3", type: "mood", value: "", weight: 0.5, enabled: true },
  // Row 2
  { id: "ch4", type: "energy", value: "", weight: 0.5, enabled: true },
  { id: "ch5", type: "texture", value: "", weight: 0.3, enabled: false },
  { id: "ch6", type: "style", value: "", weight: 0.3, enabled: false },
  // Row 3
  { id: "ch7", type: "instrument", value: "", weight: 0.3, enabled: false },
  { id: "ch8", type: "vocal", value: "", weight: 0.3, enabled: false },
  { id: "ch9", type: "custom", value: "", weight: 0.3, enabled: false },
];

/** Дефолтные глобальные настройки: BPM 120, тональность C minor и т.д. */
export const DEFAULT_SETTINGS: GlobalSettings = {
  bpm: 120,
  key: "C",
  scale: "minor",
  density: 0.5,
  brightness: 0.5,
  duration: 20,
};
