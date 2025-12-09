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

// Unified section tag pattern - matches [Tag], [Tag 1], (Tag), etc.
// Case-insensitive and supports both English and Russian tags
// Note: No 'g' flag here as it's used in test(), not exec() loop
const TAG_PATTERN = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук|instrumental|инструментал|solo|соло)(?:\s*\d+)?[\]\)]/i;

// Get section type from tag text
function getTypeFromTag(tagText: string): DetectedSection['type'] {
  const lower = tagText.toLowerCase();
  
  if (/verse|куплет/i.test(lower)) return 'verse';
  if (/chorus|припев/i.test(lower)) return 'chorus';
  if (/bridge|бридж/i.test(lower)) return 'bridge';
  if (/intro|интро/i.test(lower)) return 'intro';
  if (/outro|аутро|концовка/i.test(lower)) return 'outro';
  if (/pre-?chorus|пре-?припев/i.test(lower)) return 'pre-chorus';
  if (/hook|хук/i.test(lower)) return 'hook';
  
  return 'unknown';
}

interface ParsedSection {
  type: DetectedSection['type'];
  tag: string;
  lyrics: string;
  index: number;
}

// Parse sections from original lyrics text
function parseSectionsFromLyrics(lyrics: string): ParsedSection[] {
  if (!lyrics?.trim()) return [];

  const sections: ParsedSection[] = [];
  
  // Find all tag positions using global regex
  const globalTagRegex = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук|instrumental|инструментал|solo|соло)(?:\s*\d+)?[\]\)]/gi;
  
  const tagMatches: Array<{ tag: string; index: number; endIndex: number }> = [];
  let match;
  
  while ((match = globalTagRegex.exec(lyrics)) !== null) {
    tagMatches.push({
      tag: match[0],
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  if (tagMatches.length === 0) return [];

  // Extract text between tags
  for (let i = 0; i < tagMatches.length; i++) {
    const current = tagMatches[i];
    const next = tagMatches[i + 1];
    
    const textStart = current.endIndex;
    const textEnd = next ? next.index : lyrics.length;
    const sectionLyrics = lyrics.slice(textStart, textEnd).trim();

    if (sectionLyrics) {
      sections.push({
        type: getTypeFromTag(current.tag),
        tag: current.tag,
        lyrics: sectionLyrics,
        index: i,
      });
    }
  }

  return sections;
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

// Normalize text for comparison - improved for multi-language support
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\[\]()]/g, '') // Remove brackets
    .replace(/[^\wа-яё\s]/gi, '') // Keep letters, numbers, and spaces (English + Russian)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Fuzzy match for word similarity using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// Similarity threshold for fuzzy word matching (0.7 = 70% similar)
const FUZZY_MATCH_THRESHOLD = 0.7;

function fuzzyMatch(word1: string, word2: string, threshold = FUZZY_MATCH_THRESHOLD): boolean {
  // Quick check: if one contains the other
  if (word1.includes(word2) || word2.includes(word1)) return true;
  
  const maxLen = Math.max(word1.length, word2.length);
  if (maxLen === 0) return true;
  
  // Calculate similarity using Levenshtein distance
  const distance = levenshteinDistance(word1, word2);
  const similarity = 1 - distance / maxLen;
  
  return similarity >= threshold;
}

// Check if word is a section tag
function isTagWord(word: string): boolean {
  return TAG_PATTERN.test(word.trim());
}

// Filter out section tags from aligned words
function filterTagWords(words: AlignedWord[]): AlignedWord[] {
  return words.filter(w => !isTagWord(w.word));
}

// Match section lyrics to aligned words for timing
function matchSectionToTimestamps(
  sectionLyrics: string,
  alignedWords: AlignedWord[],
  searchStartIndex: number
): { startTime: number; endTime: number; words: AlignedWord[]; nextSearchIndex: number } | null {
  if (!alignedWords.length || !sectionLyrics) return null;

  const normalizedSection = normalizeText(sectionLyrics);
  const sectionWordList = normalizedSection.split(/\s+/).filter(Boolean);

  if (sectionWordList.length === 0) return null;

  const firstSectionWord = sectionWordList[0];
  const lastSectionWord = sectionWordList[sectionWordList.length - 1];

  // Find first word match with fuzzy matching
  let startWordIndex = -1;
  for (let i = searchStartIndex; i < alignedWords.length; i++) {
    const normalizedAligned = normalizeText(alignedWords[i].word);
    if (normalizedAligned === firstSectionWord || 
        normalizedAligned.startsWith(firstSectionWord) || 
        firstSectionWord.startsWith(normalizedAligned) ||
        fuzzyMatch(normalizedAligned, firstSectionWord)) {
      startWordIndex = i;
      break;
    }
  }

  // Fallback: search from beginning if not found after searchStartIndex
  if (startWordIndex === -1) {
    for (let i = 0; i < searchStartIndex && i < alignedWords.length; i++) {
      const normalizedAligned = normalizeText(alignedWords[i].word);
      if (normalizedAligned === firstSectionWord || 
          normalizedAligned.startsWith(firstSectionWord) || 
          firstSectionWord.startsWith(normalizedAligned) ||
          fuzzyMatch(normalizedAligned, firstSectionWord)) {
        startWordIndex = i;
        break;
      }
    }
  }

  if (startWordIndex === -1) return null;

  // Find end word - search for last word of section with fuzzy matching
  let endWordIndex = startWordIndex;
  const maxSearchLength = Math.min(alignedWords.length, startWordIndex + sectionWordList.length * 4);

  for (let i = startWordIndex; i < maxSearchLength; i++) {
    const normalizedAligned = normalizeText(alignedWords[i].word);
    
    if (normalizedAligned === lastSectionWord || 
        normalizedAligned.endsWith(lastSectionWord) || 
        lastSectionWord.endsWith(normalizedAligned) ||
        fuzzyMatch(normalizedAligned, lastSectionWord)) {
      endWordIndex = i;
    }
  }

  // If we couldn't find the end word, estimate based on word count
  if (endWordIndex === startWordIndex && sectionWordList.length > 1) {
    endWordIndex = Math.min(alignedWords.length - 1, startWordIndex + sectionWordList.length - 1);
  }

  const matchedWords = alignedWords.slice(startWordIndex, endWordIndex + 1);
  if (matchedWords.length === 0) return null;

  return {
    startTime: matchedWords[0].startS,
    endTime: matchedWords[matchedWords.length - 1].endS,
    words: matchedWords,
    nextSearchIndex: endWordIndex + 1,
  };
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

/**
 * Main hook - uses originalLyrics as single source of truth
 * 
 * @param originalLyrics - track.lyrics (source of section tags)
 * @param alignedWords - timestamped words from API (source of timing)
 * @param duration - total track duration
 */
export function useSectionDetection(
  originalLyrics: string | null | undefined,
  alignedWords: AlignedWord[] | undefined,
  duration: number
): DetectedSection[] {
  return useMemo(() => {
    try {
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
            // Validate that this section doesn't overlap with previous
            const prevSection = sections[sections.length - 1];
            const startTime = prevSection ? Math.max(match.startTime, prevSection.endTime) : match.startTime;
            
            // Ensure end time is after start time
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
            // Even if we can't match timestamps, add the section with estimated timing
            const prevSection = sections[sections.length - 1];
            const estimatedStart = prevSection 
              ? prevSection.endTime 
              : duration * (parsed.index / parsedSections.length);
            const estimatedEnd = Math.min(
              duration,
              duration * ((parsed.index + 1) / parsedSections.length)
            );
            
            // Only add if there's a valid time range
            if (estimatedStart < estimatedEnd) {
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

        if (sections.length > 0) {
          return sections;
        }
      }

      // 2. Fallback: time-based detection from aligned words
      if (filteredWords.length > 0) {
        return createTimeBasedSections(filteredWords, duration);
      }

      return [];
    } catch (error) {
      console.error('Error in section detection:', error);
      return [];
    }
  }, [originalLyrics, alignedWords, duration]);
}

export default useSectionDetection;
