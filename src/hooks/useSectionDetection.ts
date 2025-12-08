/**
 * Hook for detecting song sections from timestamped lyrics
 * Parses [Verse], [Chorus], [Bridge] etc. tags and calculates time ranges
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

// Map common section tags to types (both English and Russian)
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
  'instrumental': 'unknown',
  'инструментал': 'unknown',
  'solo': 'unknown',
  'соло': 'unknown',
};

// Get section type from tag text - improved parsing
function getSectionType(tag: string): DetectedSection['type'] {
  // Remove brackets and numbers, normalize
  const normalized = tag.toLowerCase()
    .replace(/[\[\]()]/g, '')
    .replace(/\d+/g, '')
    .replace(/[:\-_]/g, ' ')
    .trim()
    .split(/\s+/)[0]; // Take first word
  
  return SECTION_TAG_MAP[normalized] || 'unknown';
}

// Get Russian label for section type with counter
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

// Check if word is a section tag - improved pattern matching
function isSectionTag(word: string): boolean {
  const trimmed = word.trim();
  // Match [Tag], (Tag), [Tag 1], etc.
  return /^[\[\(].*[\]\)]$/.test(trimmed);
}

// Create sections based on time gaps when no tags present
function createTimeBasedSections(words: AlignedWord[], duration: number): DetectedSection[] {
  if (!words.length) return [];
  
  const sections: DetectedSection[] = [];
  const MIN_SECTION_DURATION = 8; // Minimum 8 seconds per section
  const MAX_SECTIONS = 8; // Maximum number of sections
  const TIME_GAP_THRESHOLD = 1.5; // Gap in seconds to consider section break
  
  let currentWords: AlignedWord[] = [];
  let sectionStart = words[0].startS;
  let sectionIndex = 1;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    
    currentWords.push(word);
    
    // Check for natural break points
    const hasLargeGap = nextWord ? (nextWord.startS - word.endS) > TIME_GAP_THRESHOLD : true;
    const currentDuration = word.endS - sectionStart;
    const isLongEnough = currentDuration >= MIN_SECTION_DURATION;
    const hasNewline = word.word.includes('\n\n');
    const isLastWord = !nextWord;
    
    // Create section at natural break if long enough
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
  
  // If we only have one very long section, try to split it
  if (sections.length === 1 && duration > 60) {
    const targetSectionCount = Math.min(4, Math.floor(duration / 30));
    if (targetSectionCount > 1) {
      return splitIntoEqualSections(words, duration, targetSectionCount);
    }
  }
  
  return sections;
}

// Split words into roughly equal time sections
function splitIntoEqualSections(words: AlignedWord[], duration: number, count: number): DetectedSection[] {
  const sections: DetectedSection[] = [];
  const sectionDuration = duration / count;
  
  for (let i = 0; i < count; i++) {
    const startTime = i * sectionDuration;
    const endTime = (i + 1) * sectionDuration;
    
    const sectionWords = words.filter(w => 
      w.startS >= startTime && w.startS < endTime
    );
    
    if (sectionWords.length > 0) {
      const lyrics = sectionWords
        .map(w => w.word.replace(/\n/g, ' '))
        .join(' ')
        .trim();
      
      sections.push({
        type: 'unknown',
        label: `Секция ${i + 1}`,
        startTime: sectionWords[0].startS,
        endTime: sectionWords[sectionWords.length - 1].endS,
        lyrics,
        words: sectionWords,
      });
    }
  }
  
  return sections;
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
    let hasFoundTags = false;

    // Filter out structural tags from content words
    const filteredWords = alignedWords.filter(w => !isSectionTag(w.word.trim()));

    for (let i = 0; i < alignedWords.length; i++) {
      const word = alignedWords[i];
      const wordText = word.word.trim();

      if (isSectionTag(wordText)) {
        hasFoundTags = true;
        
        // Save previous section if exists
        if (currentSectionWords.length > 0 && currentSectionType) {
          const endTime = currentSectionWords[currentSectionWords.length - 1].endS;
          const lyrics = currentSectionWords
            .map(w => w.word.replace('\n', ' '))
            .join(' ')
            .trim();

          if (lyrics) {
            sections.push({
              type: currentSectionType,
              label: getSectionLabel(currentSectionType, typeCounters[currentSectionType] || 1),
              startTime: currentSectionStartTime,
              endTime,
              lyrics,
              words: [...currentSectionWords],
            });
          }
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

      if (lyrics) {
        sections.push({
          type: currentSectionType,
          label: getSectionLabel(currentSectionType, typeCounters[currentSectionType] || 1),
          startTime: currentSectionStartTime,
          endTime,
          lyrics,
          words: [...currentSectionWords],
        });
      }
    }

    // If no tags found, use time-based section detection
    if (!hasFoundTags || sections.length === 0) {
      return createTimeBasedSections(filteredWords, duration);
    }

    return sections;
  }, [alignedWords, duration]);
}

export default useSectionDetection;
