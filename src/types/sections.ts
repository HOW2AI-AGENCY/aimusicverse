/**
 * Section types and interfaces for song structure detection
 */

import type { AlignedWord } from '@/hooks/useTimestampedLyrics';

export type SectionType = 
  | 'verse' 
  | 'chorus' 
  | 'bridge' 
  | 'intro' 
  | 'outro' 
  | 'pre-chorus' 
  | 'hook' 
  | 'instrumental' 
  | 'interlude' 
  | 'breakdown' 
  | 'drop' 
  | 'unknown';

export interface DetectedSection {
  type: SectionType;
  label: string;
  startTime: number;
  endTime: number;
  lyrics: string;
  words: AlignedWord[];
}

export interface ParsedSection {
  type: SectionType;
  tag: string;
  lyrics: string;
  index: number;
}

export interface TimestampMatch {
  startTime: number;
  endTime: number;
  words: AlignedWord[];
  nextSearchIndex: number;
}

// Section labels in Russian
export const SECTION_LABELS: Record<SectionType, string> = {
  'verse': 'Куплет',
  'chorus': 'Припев',
  'bridge': 'Бридж',
  'intro': 'Интро',
  'outro': 'Аутро',
  'pre-chorus': 'Пре-припев',
  'hook': 'Хук',
  'instrumental': 'Инструментал',
  'interlude': 'Интерлюдия',
  'breakdown': 'Брейкдаун',
  'drop': 'Дроп',
  'unknown': 'Часть',
};

/**
 * Get localized label for section type with counter
 */
export function getSectionLabel(type: SectionType, counter: number): string {
  const base = SECTION_LABELS[type];
  // Only add counter for types that can repeat
  const needsCounter = ['verse', 'chorus', 'pre-chorus', 'hook', 'unknown'].includes(type);
  return needsCounter ? `${base} ${counter}` : base;
}
