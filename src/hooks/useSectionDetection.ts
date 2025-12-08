/**
 * Hook for detecting song sections from timestamped lyrics
 * Parses [Verse], [Chorus], [Bridge] etc. tags and calculates time ranges
 */

import { useMemo } from 'react';
import { AlignedWord } from '@/hooks/useTimestampedLyrics';

export interface DetectedSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'hook' | 'unknown';
  label: string;
  startTime: number;
  endTime: number;
  lyrics: string;
  words: AlignedWord[];
}

// Map common section tags to types
const SECTION_TAG_MAP: Record<string, DetectedSection['type']> = {
  'verse': 'verse',
  'куплет': 'verse',
  'chorus': 'chorus',
  'припев': 'chorus',
  'bridge': 'bridge',
  'бридж': 'bridge',
  'intro': 'intro',
  'интро': 'intro',
  'outro': 'outro',
  'аутро': 'outro',
  'pre-chorus': 'pre-chorus',
  'пре-припев': 'pre-chorus',
  'hook': 'hook',
  'хук': 'hook',
};

// Get section type from tag text
function getSectionType(tag: string): DetectedSection['type'] {
  const normalized = tag.toLowerCase().replace(/[\[\]0-9]/g, '').trim();
  return SECTION_TAG_MAP[normalized] || 'unknown';
}

// Get Russian label for section type
function getSectionLabel(type: DetectedSection['type'], index: number): string {
  const labels: Record<DetectedSection['type'], string> = {
    'verse': `Куплет ${index}`,
    'chorus': `Припев ${index}`,
    'bridge': `Бридж ${index}`,
    'intro': 'Интро',
    'outro': 'Аутро',
    'pre-chorus': `Пре-припев ${index}`,
    'hook': `Хук ${index}`,
    'unknown': `Секция ${index}`,
  };
  return labels[type];
}

// Check if word is a section tag
function isSectionTag(word: string): boolean {
  return /^\[.*\]$/.test(word.trim());
}

export function useSectionDetection(
  alignedWords: AlignedWord[] | undefined,
  duration: number
): DetectedSection[] {
  return useMemo(() => {
    if (!alignedWords?.length) return [];

    const sections: DetectedSection[] = [];
    let currentSectionWords: AlignedWord[] = [];
    let currentSectionType: DetectedSection['type'] | null = null;
    let currentSectionStartTime = 0;
    const typeCounters: Record<string, number> = {};

    for (let i = 0; i < alignedWords.length; i++) {
      const word = alignedWords[i];
      const wordText = word.word.trim();

      if (isSectionTag(wordText)) {
        // Save previous section if exists
        if (currentSectionWords.length > 0 && currentSectionType) {
          const endTime = currentSectionWords[currentSectionWords.length - 1].endS;
          const lyrics = currentSectionWords
            .map(w => w.word.replace('\n', ' '))
            .join(' ')
            .trim();

          sections.push({
            type: currentSectionType,
            label: getSectionLabel(currentSectionType, typeCounters[currentSectionType] || 1),
            startTime: currentSectionStartTime,
            endTime,
            lyrics,
            words: [...currentSectionWords],
          });
        }

        // Start new section
        currentSectionType = getSectionType(wordText);
        typeCounters[currentSectionType] = (typeCounters[currentSectionType] || 0) + 1;
        currentSectionWords = [];
        currentSectionStartTime = word.endS; // Start after the tag
      } else {
        // Add word to current section
        if (currentSectionType) {
          if (currentSectionWords.length === 0) {
            currentSectionStartTime = word.startS;
          }
          currentSectionWords.push(word);
        }
      }
    }

    // Save last section
    if (currentSectionWords.length > 0 && currentSectionType) {
      const endTime = currentSectionWords[currentSectionWords.length - 1].endS;
      const lyrics = currentSectionWords
        .map(w => w.word.replace('\n', ' '))
        .join(' ')
        .trim();

      sections.push({
        type: currentSectionType,
        label: getSectionLabel(currentSectionType, typeCounters[currentSectionType] || 1),
        startTime: currentSectionStartTime,
        endTime,
        lyrics,
        words: [...currentSectionWords],
      });
    }

    // If no sections detected, create one section for entire track
    if (sections.length === 0 && alignedWords.length > 0) {
      const filteredWords = alignedWords.filter(w => !isSectionTag(w.word));
      if (filteredWords.length > 0) {
        sections.push({
          type: 'unknown',
          label: 'Весь трек',
          startTime: filteredWords[0].startS,
          endTime: filteredWords[filteredWords.length - 1].endS,
          lyrics: filteredWords.map(w => w.word.replace('\n', ' ')).join(' ').trim(),
          words: filteredWords,
        });
      }
    }

    return sections;
  }, [alignedWords, duration]);
}

export default useSectionDetection;
