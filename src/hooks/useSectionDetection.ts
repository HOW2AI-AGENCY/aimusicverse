/**
 * Hook for detecting song sections
 * 
 * Priority order:
 * 1. Parse tags from lyrics ([Verse], [Chorus], etc.)
 * 2. Use aligned words with gap detection
 * 3. Smart duration-based sections following typical song structure
 * 
 * Refactored: Core logic extracted to:
 * - src/types/sections.ts - Types and labels
 * - src/lib/audio/lyricsParser.ts - Lyrics parsing
 * - src/lib/audio/musicalStructure.ts - Structure detection
 */

import { useMemo } from 'react';
import type { AlignedWord } from '@/hooks/useTimestampedLyrics';
import type { DetectedSection } from '@/types/sections';
import { getSectionLabel } from '@/types/sections';
import {
  parseSectionsFromLyrics,
  filterTagWords,
  matchSectionToTimestamps,
} from '@/lib/audio/lyricsParser';
import {
  createMusicalSections,
  detectSectionsFromGaps,
} from '@/lib/audio/musicalStructure';
import { logger } from '@/lib/logger';

// Re-export types for backward compatibility
export type { DetectedSection } from '@/types/sections';
export { createMusicalSections } from '@/lib/audio/musicalStructure';

/**
 * Ensure sections are continuous with no gaps
 */
function makeSectionsContinuous(
  sections: DetectedSection[],
  duration: number
): DetectedSection[] {
  if (sections.length === 0) return sections;

  // First section starts at 0
  sections[0].startTime = 0;

  // Make sections continuous
  for (let i = 0; i < sections.length - 1; i++) {
    const current = sections[i];
    const next = sections[i + 1];

    // If gap, extend current to meet next
    if (current.endTime < next.startTime) {
      current.endTime = next.startTime;
    }

    // If overlap, clamp next start
    if (next.startTime < current.endTime) {
      next.startTime = current.endTime;
    }
  }

  // Last section extends to full duration
  sections[sections.length - 1].endTime = duration;

  return sections;
}

/**
 * Build sections from parsed lyrics with timestamp matching
 */
function buildSectionsFromParsedLyrics(
  parsedSections: ReturnType<typeof parseSectionsFromLyrics>,
  filteredWords: AlignedWord[],
  duration: number
): DetectedSection[] {
  const sections: DetectedSection[] = [];
  const typeCounters: Record<string, number> = {};
  let searchIndex = 0;

  for (const parsed of parsedSections) {
    typeCounters[parsed.type] = (typeCounters[parsed.type] || 0) + 1;
    const match = matchSectionToTimestamps(parsed.lyrics, filteredWords, searchIndex);
    const prevEnd = sections[sections.length - 1]?.endTime || 0;

    if (match && match.endTime > match.startTime) {
      const startTime = Math.max(match.startTime, prevEnd);

      if (match.endTime > startTime) {
        sections.push({
          type: parsed.type,
          label: getSectionLabel(parsed.type, typeCounters[parsed.type]),
          startTime,
          endTime: match.endTime,
          lyrics: parsed.lyrics.replace(/\n/g, ' ').trim(),
          words: match.words,
        });
        searchIndex = match.nextSearchIndex;
      }
    } else {
      // Estimate timing if match failed
      const estimatedDuration = Math.max(10, duration / parsedSections.length);
      const estimatedStart = prevEnd;
      const estimatedEnd = Math.min(duration, estimatedStart + estimatedDuration);

      if (estimatedEnd > estimatedStart) {
        sections.push({
          type: parsed.type,
          label: getSectionLabel(parsed.type, typeCounters[parsed.type]),
          startTime: estimatedStart,
          endTime: estimatedEnd,
          lyrics: parsed.lyrics.replace(/\n/g, ' ').trim(),
          words: [],
        });
      }
    }
  }

  return sections;
}

/**
 * Main hook for section detection
 */
export function useSectionDetection(
  originalLyrics: string | null | undefined,
  alignedWords: AlignedWord[] | undefined,
  duration: number
): DetectedSection[] {
  return useMemo(() => {
    try {
      const filteredWords = alignedWords ? filterTagWords(alignedWords) : [];

      // 1. Try parsing tags from lyrics first
      const parsedSections = parseSectionsFromLyrics(originalLyrics || '');

      if (parsedSections.length > 0 && filteredWords.length > 0) {
        const sections = buildSectionsFromParsedLyrics(
          parsedSections,
          filteredWords,
          duration
        );

        if (sections.length > 0) {
          return makeSectionsContinuous(sections, duration);
        }
      }

      // 2. Detect sections from word gaps
      if (filteredWords.length > 0) {
        return detectSectionsFromGaps(filteredWords, duration);
      }

      // 3. Create musical sections based on duration
      if (duration > 0) {
        return createMusicalSections(duration);
      }

      return [];
    } catch (error) {
      logger.error('Section detection error', error instanceof Error ? error : new Error(String(error)));
      return createMusicalSections(duration);
    }
  }, [originalLyrics, alignedWords, duration]);
}

export default useSectionDetection;
