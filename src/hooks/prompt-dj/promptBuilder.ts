/**
 * Построитель промпта для PromptDJ из активных каналов и глобальных настроек.
 *
 * Pure function — никаких React зависимостей. Используется в
 * usePromptDJEnhanced и может переиспользоваться в Storybook / unit-тестах.
 *
 * Извлечено из src/hooks/usePromptDJEnhanced.ts в Sprint 042
 * (god-hook декомпозиция 1071 → ... LOC).
 */

import type { PromptChannel, GlobalSettings } from "./types";
import { NOTE_NAMES } from "./constants";

/**
 * Собирает промпт из активных каналов + глобальных настроек.
 *
 * Каналы с `weight < 0.1` игнорируются. Каналы с `weight > 0.7` получают префикс "very",
 * каналы с `weight <= 0.4` — "subtle". Всегда добавляются BPM, key/scale, и
 * текстовые подсказки по density/brightness.
 */
export function buildWeightedPrompt(channels: PromptChannel[], globalSettings: GlobalSettings): string {
  const parts: string[] = [];

  channels.forEach((channel) => {
    if (!channel.enabled || !channel.value || channel.weight < 0.1) return;

    // Apply weight emphasis
    const emphasis = channel.weight > 0.7 ? "very " : channel.weight > 0.4 ? "" : "subtle ";
    parts.push(`${emphasis}${channel.value.toLowerCase()}`);
  });

  // Add global settings
  parts.push(`${globalSettings.bpm} BPM`);
  parts.push(`${globalSettings.key} ${globalSettings.scale}`);

  if (globalSettings.density < 0.3) parts.push("sparse, minimal");
  else if (globalSettings.density > 0.7) parts.push("dense, layered");

  if (globalSettings.brightness < 0.3) parts.push("warm, mellow");
  else if (globalSettings.brightness > 0.7) parts.push("bright, crisp");

  return parts.filter(Boolean).join(", ");
}

/**
 * Вычисляет MIDI-подобные имена нот для заданных key/scale.
 *
 * Например: computeScaleNotes("C", "minor") => ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4"].
 * Используется в Pattern-генераторе usePromptDJEnhanced.
 *
 * Pure function — никаких React зависимостей.
 */
export function computeScaleNotes(key: string, scale: string, octave: number = 4): string[] {
  const rootIndex = NOTE_NAMES.indexOf(key);
  const scaleIntervals =
    scale === "major"
      ? [0, 2, 4, 5, 7, 9, 11]
      : scale === "minor"
        ? [0, 2, 3, 5, 7, 8, 10]
        : scale === "dorian"
          ? [0, 2, 3, 5, 7, 9, 10]
          : scale === "pentatonic"
            ? [0, 2, 4, 7, 9]
            : [0, 2, 3, 5, 7, 8, 10]; // default minor

  return scaleIntervals.map((interval) => {
    const noteIndex = (rootIndex + interval) % 12;
    const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
    return `${NOTE_NAMES[noteIndex]}${noteOctave}`;
  });
}
