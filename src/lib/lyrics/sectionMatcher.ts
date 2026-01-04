/**
 * Advanced Section-to-Timestamp Matcher
 * 
 * Provides high-precision matching between section lyrics 
 * and timestamped aligned words for accurate section replacement.
 */

import { AlignedWord } from '@/hooks/lyrics/useLyricsSynchronization';

export interface SectionMatch {
  startTimeS: number;
  endTimeS: number;
  matchedWords: AlignedWord[];
  confidence: number;        // 0-1 match quality
  startWordIndex: number;
  endWordIndex: number;
  matchDetails: {
    prefixMatches: number;
    suffixMatches: number;
    totalWords: number;
    gapScore: number;
  };
}

/**
 * Normalize text for matching
 * Handles Russian and English, removes punctuation
 */
export function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    // Remove all tags
    .replace(/\[([^\]]+)\]/g, '')
    .replace(/\(([^)]+)\)/g, '')
    // Remove punctuation but keep letters
    .replace(/[^\\wа-яёa-z\\s]/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[a.length][b.length];
}

/**
 * Fuzzy word match with tolerance
 */
function fuzzyWordMatch(word1: string, word2: string, threshold = 0.7): boolean {
  const a = normalizeForMatching(word1);
  const b = normalizeForMatching(word2);
  
  if (a === b) return true;
  if (!a || !b) return false;
  
  // Short word exact match
  if (a.length <= 2 || b.length <= 2) {
    return a === b;
  }
  
  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) {
    return true;
  }
  
  // Levenshtein-based similarity
  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  const similarity = 1 - distance / maxLen;
  
  return similarity >= threshold;
}

/**
 * Score a prefix/suffix match
 */
function scoreSequenceMatch(
  sectionWords: string[],
  alignedWords: AlignedWord[],
  startIndex: number,
  count: number
): number {
  if (startIndex < 0 || startIndex + count > alignedWords.length) {
    return 0;
  }
  
  let matches = 0;
  for (let i = 0; i < count && i < sectionWords.length; i++) {
    const sWord = sectionWords[i];
    const aWord = normalizeForMatching(alignedWords[startIndex + i].word);
    
    if (fuzzyWordMatch(sWord, aWord)) {
      matches++;
    }
  }
  
  return matches / count;
}

/**
 * Find best match position for section start
 */
function findBestStartPosition(
  sectionWords: string[],
  alignedWords: AlignedWord[],
  searchStart: number,
  searchEnd: number
): { index: number; score: number } {
  const WINDOW_SIZE = Math.min(5, sectionWords.length);
  let bestIndex = -1;
  let bestScore = 0;
  
  for (let i = searchStart; i <= searchEnd - WINDOW_SIZE; i++) {
    const score = scoreSequenceMatch(sectionWords, alignedWords, i, WINDOW_SIZE);
    
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
      
      // Early exit on high confidence
      if (score >= 0.9) break;
    }
  }
  
  return { index: bestIndex, score: bestScore };
}

/**
 * Find best match position for section end
 */
function findBestEndPosition(
  sectionWords: string[],
  alignedWords: AlignedWord[],
  startIndex: number,
  searchEnd: number
): { index: number; score: number } {
  const WINDOW_SIZE = Math.min(5, sectionWords.length);
  let bestIndex = startIndex;
  let bestScore = 0;
  
  // Get last N words of section
  const lastWords = sectionWords.slice(-WINDOW_SIZE);
  
  // Search from expected position outward
  const expectedEnd = Math.min(startIndex + sectionWords.length - 1, searchEnd);
  const searchRadius = Math.ceil(sectionWords.length * 0.5);
  
  for (let offset = 0; offset <= searchRadius; offset++) {
    for (const direction of [0, 1, -1]) {
      if (direction === 0 && offset !== 0) continue;
      
      const i = expectedEnd + offset * direction;
      if (i < startIndex || i > searchEnd || i - WINDOW_SIZE + 1 < startIndex) continue;
      
      const score = scoreSequenceMatch(
        lastWords,
        alignedWords,
        i - WINDOW_SIZE + 1,
        WINDOW_SIZE
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
        
        if (score >= 0.9) return { index: bestIndex, score: bestScore };
      }
    }
  }
  
  return { index: bestIndex, score: bestScore };
}

/**
 * Match a section's lyrics to aligned words with high precision
 */
export function matchSectionToWords(
  sectionLyrics: string,
  alignedWords: AlignedWord[],
  options: {
    searchStartIndex?: number;
    searchEndIndex?: number;
    minConfidence?: number;
    preferredStartTime?: number;
    preferredEndTime?: number;
  } = {}
): SectionMatch | null {
  const {
    searchStartIndex = 0,
    searchEndIndex = alignedWords.length - 1,
    minConfidence = 0.4,
    preferredStartTime,
    preferredEndTime,
  } = options;
  
  if (!sectionLyrics?.trim() || !alignedWords?.length) {
    return null;
  }
  
  // Normalize and split section lyrics
  const normalizedLyrics = normalizeForMatching(sectionLyrics);
  const sectionWords = normalizedLyrics.split(/\s+/).filter(Boolean);
  
  if (sectionWords.length === 0) return null;
  
  // Find start position
  let startSearch = searchStartIndex;
  let endSearch = Math.min(searchEndIndex, alignedWords.length - 1);
  
  // If we have a preferred start time, narrow search
  if (preferredStartTime !== undefined) {
    const nearIdx = alignedWords.findIndex(w => w.startS >= preferredStartTime - 2);
    if (nearIdx >= 0) {
      startSearch = Math.max(startSearch, nearIdx - 5);
      endSearch = Math.min(endSearch, nearIdx + sectionWords.length + 10);
    }
  }
  
  const startMatch = findBestStartPosition(sectionWords, alignedWords, startSearch, endSearch);
  
  if (startMatch.index < 0 || startMatch.score < minConfidence) {
    // Fallback: try wider search
    const widerStart = findBestStartPosition(sectionWords, alignedWords, searchStartIndex, searchEndIndex);
    if (widerStart.index < 0 || widerStart.score < minConfidence * 0.7) {
      return null;
    }
    startMatch.index = widerStart.index;
    startMatch.score = widerStart.score;
  }
  
  // Find end position
  const endMatch = findBestEndPosition(
    sectionWords,
    alignedWords,
    startMatch.index,
    Math.min(startMatch.index + sectionWords.length * 2, searchEndIndex)
  );
  
  if (endMatch.index < startMatch.index) {
    // Estimate end based on word count
    endMatch.index = Math.min(startMatch.index + sectionWords.length - 1, alignedWords.length - 1);
    endMatch.score = startMatch.score * 0.5;
  }
  
  // Extract matched words
  const matchedWords = alignedWords.slice(startMatch.index, endMatch.index + 1);
  
  if (matchedWords.length === 0) return null;
  
  // Calculate overall confidence
  const gapScore = calculateGapScore(matchedWords);
  const overallConfidence = (startMatch.score * 0.4 + endMatch.score * 0.4 + gapScore * 0.2);
  
  if (overallConfidence < minConfidence) {
    return null;
  }
  
  return {
    startTimeS: matchedWords[0].startS,
    endTimeS: matchedWords[matchedWords.length - 1].endS,
    matchedWords,
    confidence: overallConfidence,
    startWordIndex: startMatch.index,
    endWordIndex: endMatch.index,
    matchDetails: {
      prefixMatches: Math.round(startMatch.score * Math.min(5, sectionWords.length)),
      suffixMatches: Math.round(endMatch.score * Math.min(5, sectionWords.length)),
      totalWords: matchedWords.length,
      gapScore,
    },
  };
}

/**
 * Calculate continuity score based on gaps between words
 */
function calculateGapScore(words: AlignedWord[]): number {
  if (words.length <= 1) return 1;
  
  let normalGaps = 0;
  const MAX_NORMAL_GAP = 1; // 1 second
  
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].startS - words[i - 1].endS;
    if (gap >= 0 && gap <= MAX_NORMAL_GAP) {
      normalGaps++;
    }
  }
  
  return normalGaps / (words.length - 1);
}

/**
 * Align section boundaries to word boundaries
 * Ensures times are snapped to exact word start/end
 */
export function alignSectionBoundaries(
  startTimeS: number,
  endTimeS: number,
  alignedWords: AlignedWord[],
  options: {
    snapToWordStart?: boolean;
    snapToWordEnd?: boolean;
    expandToPhrase?: boolean;
  } = {}
): { startTimeS: number; endTimeS: number; startWord?: AlignedWord; endWord?: AlignedWord } {
  const {
    snapToWordStart = true,
    snapToWordEnd = true,
    expandToPhrase = false,
  } = options;
  
  if (!alignedWords?.length) {
    return { startTimeS, endTimeS };
  }
  
  let startWord: AlignedWord | undefined;
  let endWord: AlignedWord | undefined;
  let adjustedStart = startTimeS;
  let adjustedEnd = endTimeS;
  
  // Find word at start time
  for (let i = 0; i < alignedWords.length; i++) {
    const word = alignedWords[i];
    
    // Word contains or is just after start time
    if (word.endS >= startTimeS) {
      if (snapToWordStart) {
        // If start is within this word, snap to word start
        if (word.startS <= startTimeS && word.endS >= startTimeS) {
          startWord = word;
          adjustedStart = word.startS;
        } 
        // If start is before this word, snap to this word's start
        else if (word.startS > startTimeS) {
          // Check previous word
          const prev = alignedWords[i - 1];
          if (prev && startTimeS - prev.endS < word.startS - startTimeS) {
            startWord = prev;
            adjustedStart = prev.startS;
          } else {
            startWord = word;
            adjustedStart = word.startS;
          }
        }
      }
      break;
    }
  }
  
  // Find word at end time
  for (let i = alignedWords.length - 1; i >= 0; i--) {
    const word = alignedWords[i];
    
    // Word contains or is just before end time
    if (word.startS <= endTimeS) {
      if (snapToWordEnd) {
        // If end is within this word, snap to word end
        if (word.startS <= endTimeS && word.endS >= endTimeS) {
          endWord = word;
          adjustedEnd = word.endS;
        }
        // If end is after this word, snap to this word's end
        else if (word.endS < endTimeS) {
          // Check next word
          const next = alignedWords[i + 1];
          if (next && next.startS - endTimeS < endTimeS - word.endS) {
            endWord = next;
            adjustedEnd = next.endS;
          } else {
            endWord = word;
            adjustedEnd = word.endS;
          }
        }
      }
      break;
    }
  }
  
  // Optionally expand to phrase boundaries
  if (expandToPhrase && startWord && endWord) {
    const GAP_THRESHOLD = 0.5;
    
    // Expand start backward to phrase start
    const startIdx = alignedWords.indexOf(startWord);
    for (let i = startIdx - 1; i >= 0; i--) {
      const gap = alignedWords[i + 1].startS - alignedWords[i].endS;
      if (gap > GAP_THRESHOLD) break;
      startWord = alignedWords[i];
      adjustedStart = startWord.startS;
    }
    
    // Expand end forward to phrase end
    const endIdx = alignedWords.indexOf(endWord);
    for (let i = endIdx + 1; i < alignedWords.length; i++) {
      const gap = alignedWords[i].startS - alignedWords[i - 1].endS;
      if (gap > GAP_THRESHOLD) break;
      endWord = alignedWords[i];
      adjustedEnd = endWord.endS;
    }
  }
  
  return {
    startTimeS: Math.round(adjustedStart * 100) / 100,
    endTimeS: Math.round(adjustedEnd * 100) / 100,
    startWord,
    endWord,
  };
}

/**
 * Extract lyrics for a time range with word alignment
 */
export function extractLyricsForTimeRange(
  startTimeS: number,
  endTimeS: number,
  alignedWords: AlignedWord[]
): { lyrics: string; words: AlignedWord[] } {
  if (!alignedWords?.length) {
    return { lyrics: '', words: [] };
  }
  
  const words = alignedWords.filter(w => 
    w.startS >= startTimeS - 0.1 && w.endS <= endTimeS + 0.1
  );
  
  const lyrics = words
    .map(w => w.word.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
  
  return { lyrics, words };
}
