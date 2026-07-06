/**
 * Music notation constants and utilities
 * Extracted from UnifiedNotesViewer.tsx — Sprint 051 T056
 */

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const NOTE_NAMES_RU = ["До", "До#", "Ре", "Ре#", "Ми", "Фа", "Фа#", "Соль", "Соль#", "Ля", "Ля#", "Си"];

export function parseTimeSignature(ts: { numerator: number; denominator: number } | string | undefined): {
  numerator: number;
  denominator: number;
} {
  if (!ts) return { numerator: 4, denominator: 4 };
  if (typeof ts === "object") return ts;
  const parts = ts.split("/");
  if (parts.length === 2) {
    return { numerator: parseInt(parts[0], 10) || 4, denominator: parseInt(parts[1], 10) || 4 };
  }
  return { numerator: 4, denominator: 4 };
}

export function getNoteName(pitch: number): string {
  return `${NOTE_NAMES[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

export function getNoteNameRu(pitch: number): string {
  return `${NOTE_NAMES_RU[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}
