/**
 * Hook for detecting song sections from original lyrics (single source of truth)
 * Parses [Verse], [Chorus], [Bridge] tags from track.lyrics
 * Matches to alignedWords for precise timing
 * Falls back to time-based segmentation if no tags present
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

// Section tag patterns - English and Russian
const SECTION_PATTERNS: Array<{ pattern: RegExp; type: DetectedSection['type'] }> = [
  // English
  { pattern: /\[(verse|куплет)(?:\s*\d+)?\]/gi, type: 'verse' },
  { pattern: /\[(chorus|припев)(?:\s*\d+)?\]/gi, type: 'chorus' },
  { pattern: /\[(bridge|бридж)(?:\s*\d+)?\]/gi, type: 'bridge' },
  { pattern: /\[(intro|интро)\]/gi, type: 'intro' },
  { pattern: /\[(outro|аутро|концовка)\]/gi, type: 'outro' },
  { pattern: /\[(pre-?chorus|пре-?припев)(?:\s*\d+)?\]/gi, type: 'pre-chorus' },
  { pattern: /\[(hook|хук)(?:\s*\d+)?\]/gi, type: 'hook' },
  // With parentheses
  { pattern: /\((verse|куплет)(?:\s*\d+)?\)/gi, type: 'verse' },
  { pattern: /\((chorus|припев)(?:\s*\d+)?\)/gi, type: 'chorus' },
  { pattern: /\((bridge|бридж)(?:\s*\d+)?\)/gi, type: 'bridge' },
];

// Master regex for any section tag
const SECTION_TAG_REGEX = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук|instrumental|инструментал|solo|соло)(?:\s*\d+)?[\]\)]/gi;

interface ParsedSection {
  type: DetectedSection['type'];
  originalTag: string;
  lyrics: string;
  startIndex: number;
}

// Parse sections from original lyrics text
function parseSectionsFromLyrics(lyrics: string): ParsedSection[] {
  if (!lyrics?.trim()) return [];

  const sections: ParsedSection[] = [];
  const matches: Array<{ tag: string; index: number; type: DetectedSection['type'] }> = [];

  // Find all section tags
  let match;
  SECTION_TAG_REGEX.lastIndex = 0;
  while ((match = SECTION_TAG_REGEX.exec(lyrics)) !== null) {
    const tagContent = match[1].toLowerCase().replace(/\d+/g, '').trim();
    let type: DetectedSection['type'] = 'unknown';

    if (/verse|куплет/i.test(tagContent)) type = 'verse';
    else if (/chorus|припев/i.test(tagContent)) type = 'chorus';
    else if (/bridge|бридж/i.test(tagContent)) type = 'bridge';
    else if (/intro|интро/i.test(tagContent)) type = 'intro';
    else if (/outro|аутро|концовка/i.test(tagContent)) type = 'outro';
    else if (/pre-?chorus|пре-?припев/i.test(tagContent)) type = 'pre-chorus';
    else if (/hook|хук/i.test(tagContent)) type = 'hook';

    matches.push({ tag: match[0], index: match.index, type });
  }

  if (matches.length === 0) return [];

  // Extract text between tags
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const endIndex = next ? next.index : lyrics.length;
    const startIndex = current.index + current.tag.length;

    const sectionLyrics = lyrics.slice(startIndex, endIndex).trim();

    if (sectionLyrics) {
      sections.push({
        type: current.type,
        originalTag: current.tag,
        lyrics: sectionLyrics,
        startIndex: current.index,
      });
    }
  }

  return sections;
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\[\]()]/g, '')
    .replace(/[^\wа-яё\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Match section lyrics to aligned words
function matchSectionToTimestamps(
  sectionLyrics: string,
  alignedWords: AlignedWord[],
  searchStartIndex: number
): { startTime: number; endTime: number; words: AlignedWord[]; nextSearchIndex: number } | null {
  if (!alignedWords.length || !sectionLyrics) return null;

  const normalizedSection = normalizeText(sectionLyrics);
  const sectionWords = normalizedSection.split(/\s+/).filter(Boolean);

  if (sectionWords.length === 0) return null;

  // Find first word match (start from searchStartIndex for sequential matching)
  let startWordIndex = -1;
  const firstWord = sectionWords[0];

  for (let i = searchStartIndex; i < alignedWords.length; i++) {
    const normalizedAligned = normalizeText(alignedWords[i].word);
    if (normalizedAligned.includes(firstWord) || firstWord.includes(normalizedAligned)) {
      startWordIndex = i;
      break;
    }
  }

  if (startWordIndex === -1) {
    // Fallback: search from beginning
    for (let i = 0; i < searchStartIndex; i++) {
      const normalizedAligned = normalizeText(alignedWords[i].word);
      if (normalizedAligned.includes(firstWord) || firstWord.includes(normalizedAligned)) {
        startWordIndex = i;
        break;
      }
    }
  }

  if (startWordIndex === -1) return null;

  // Find end word - match last few words of section
  let endWordIndex = startWordIndex;
  const lastWord = sectionWords[sectionWords.length - 1];

  // Search for last word starting from startWordIndex
  for (let i = startWordIndex; i < alignedWords.length; i++) {
    const normalizedAligned = normalizeText(alignedWords[i].word);
    
    // Check if this could be the last word
    if (normalizedAligned.includes(lastWord) || lastWord.includes(normalizedAligned)) {
      endWordIndex = i;
    }
    
    // Stop if we've gone too far (more than 3x the expected words)
    if (i > startWordIndex + sectionWords.length * 3) break;
  }

  // Collect all words in range
  const matchedWords = alignedWords.slice(startWordIndex, endWordIndex + 1);

  if (matchedWords.length === 0) return null;

  return {
    startTime: matchedWords[0].startS,
    endTime: matchedWords[matchedWords.length - 1].endS,
    words: matchedWords,
    nextSearchIndex: endWordIndex + 1,
  };
}

// Get Russian label for section type
function getSectionLabel(type: DetectedSection['type'], counter: number): string {
  const labels: Record<DetectedSection['type'], string> = {
    'verse': `Куплет ${counter}`,
    'chorus': `Припев ${counter}`,
    'bridge': `Бридж ${counter}`,
    'intro': 'Интро',
    'outro': 'Аутро',
    'pre-chorus': `Пре-припев ${counter}`,
    'hook': `Хук ${counter}`,
    'unknown': `Секция ${counter}`,
  };
  return labels[type];
}

// Create sections based on time when no tags present
function createTimeBasedSections(words: AlignedWord[], duration: number): DetectedSection[] {
  if (!words.length) return [];

  const MIN_SECTION_DURATION = 10;
  const MAX_SECTIONS = 6;
  const TIME_GAP_THRESHOLD = 2;

  const sections: DetectedSection[] = [];
  let currentWords: AlignedWord[] = [];
  let sectionStart = words[0].startS;
  let sectionIndex = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];

    currentWords.push(word);

    const hasLargeGap = nextWord ? (nextWord.startS - word.endS) > TIME_GAP_THRESHOLD : true;
    const currentDuration = word.endS - sectionStart;
    const isLongEnough = currentDuration >= MIN_SECTION_DURATION;
    const hasNewline = word.word.includes('\n\n');
    const isLastWord = !nextWord;

    if ((isLongEnough && (hasLargeGap || hasNewline)) || isLastWord) {
      if (currentWords.length > 0 && sections.length < MAX_SECTIONS) {
        const lyrics = currentWords
          .map(w => w.word.replace(/\n/g, ' '))
          .join(' ')
          .trim();

        if (lyrics) {
          sections.push({
            type: 'unknown',
            label: `Секция ${sectionIndex}`,
            startTime: sectionStart,
            endTime: word.endS,
            lyrics,
            words: [...currentWords],
          });
          sectionIndex++;
        }
      }

      currentWords = [];
      if (nextWord) {
        sectionStart = nextWord.startS;
      }
    }
  }

  return sections;
}

// Filter out section tags from aligned words
function filterTagWords(words: AlignedWord[]): AlignedWord[] {
  return words.filter(w => !SECTION_TAG_REGEX.test(w.word.trim()));
}

/**
 * Main hook - uses originalLyrics as single source of truth
 */
export function useSectionDetection(
  originalLyrics: string | null | undefined,
  alignedWords: AlignedWord[] | undefined,
  duration: number
): DetectedSection[] {
  return useMemo(() => {
    // Filter out tag words from aligned data
    const filteredWords = alignedWords ? filterTagWords(alignedWords) : [];

    // 1. Try to parse sections from original lyrics
    const parsedSections = parseSectionsFromLyrics(originalLyrics || '');

    if (parsedSections.length > 0 && filteredWords.length > 0) {
      // Match parsed sections to timestamps
      const sections: DetectedSection[] = [];
      const typeCounters: Record<string, number> = {};
      let searchIndex = 0;

      for (const parsed of parsedSections) {
        typeCounters[parsed.type] = (typeCounters[parsed.type] || 0) + 1;

        const match = matchSectionToTimestamps(parsed.lyrics, filteredWords, searchIndex);

        if (match) {
          sections.push({
            type: parsed.type,
            label: getSectionLabel(parsed.type, typeCounters[parsed.type]),
            startTime: match.startTime,
            endTime: match.endTime,
            lyrics: parsed.lyrics.replace(/\n/g, ' ').trim(),
            words: match.words,
          });
          searchIndex = match.nextSearchIndex;
        }
      }

      if (sections.length > 0) {
        return sections;
      }
    }

    // 2. Fallback: time-based detection from aligned words
    if (filteredWords.length > 0) {
      return createTimeBasedSections(filteredWords, duration);
    }

    return [];
  }, [originalLyrics, alignedWords, duration]);
}

export default useSectionDetection;
