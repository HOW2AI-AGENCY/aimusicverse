/**
 * Lyrics parsing utilities for section detection
 * Supports English and Russian tags
 */

import type { AlignedWord } from '@/hooks/useTimestampedLyrics';
import type { SectionType, ParsedSection, TimestampMatch } from '@/types/sections';

// Tag patterns - English and Russian (expanded)
const TAG_PATTERN = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|post-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|пост-?припев|хук|instrumental|инструментал|interlude|интерлюдия|solo|соло|refrain|рефрен|breakdown|брейкдаун|drop|дроп|break|брейк)(?:\s*\d+)?[\]\)]/gi;

const TAG_FILTER_PATTERN = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук)(?:\s*\d+)?[\]\)]/i;

/**
 * Convert tag text to section type
 */
export function getTypeFromTag(tagText: string): SectionType {
  const lower = tagText.toLowerCase();
  if (/verse|куплет/i.test(lower)) return 'verse';
  if (/chorus|припев|refrain|рефрен/i.test(lower)) return 'chorus';
  if (/bridge|бридж/i.test(lower)) return 'bridge';
  if (/intro|интро/i.test(lower)) return 'intro';
  if (/outro|аутро|концовка/i.test(lower)) return 'outro';
  if (/pre-?chorus|пре-?припев/i.test(lower)) return 'pre-chorus';
  if (/post-?chorus|пост-?припев/i.test(lower)) return 'hook';
  if (/hook|хук/i.test(lower)) return 'hook';
  if (/instrumental|инструментал|solo|соло/i.test(lower)) return 'instrumental';
  if (/interlude|интерлюдия/i.test(lower)) return 'interlude';
  if (/breakdown|брейкдаун|break|брейк/i.test(lower)) return 'breakdown';
  if (/drop|дроп/i.test(lower)) return 'drop';
  return 'unknown';
}

/**
 * Parse sections from lyrics with tags like [Verse], [Chorus], etc.
 */
export function parseSectionsFromLyrics(lyrics: string): ParsedSection[] {
  if (!lyrics?.trim()) return [];

  const sections: ParsedSection[] = [];
  const tagMatches: { tag: string; index: number; endIndex: number }[] = [];
  
  let match;
  const regex = new RegExp(TAG_PATTERN.source, 'gi');
  
  while ((match = regex.exec(lyrics)) !== null) {
    tagMatches.push({
      tag: match[0],
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  if (tagMatches.length === 0) return [];

  for (let i = 0; i < tagMatches.length; i++) {
    const current = tagMatches[i];
    const next = tagMatches[i + 1];
    const textEnd = next ? next.index : lyrics.length;
    const sectionLyrics = lyrics.slice(current.endIndex, textEnd).trim();

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

/**
 * Filter out tag words from aligned words
 */
export function filterTagWords(words: AlignedWord[]): AlignedWord[] {
  return words.filter(w => !TAG_FILTER_PATTERN.test(w.word.trim()));
}

/**
 * Normalize text for matching
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\wа-яё\s]/gi, '').replace(/\s+/g, ' ').trim();
}

/**
 * Match section lyrics to aligned word timestamps
 */
export function matchSectionToTimestamps(
  sectionLyrics: string,
  alignedWords: AlignedWord[],
  searchStartIndex: number
): TimestampMatch | null {
  if (!alignedWords.length || !sectionLyrics) return null;

  const normalizedSection = normalizeText(sectionLyrics);
  const sectionWords = normalizedSection.split(/\s+/).filter(Boolean);
  if (sectionWords.length === 0) return null;

  const lastWord = sectionWords[sectionWords.length - 1];

  // Score a short prefix window against aligned words
  const prefixLen = Math.min(6, sectionWords.length);
  let bestIdx = -1;
  let bestScore = 0;

  const maxStart = Math.max(searchStartIndex, 0);
  const maxI = Math.max(0, alignedWords.length - prefixLen);

  for (let i = maxStart; i <= maxI; i++) {
    let matches = 0;
    for (let j = 0; j < prefixLen; j++) {
      const aw = normalizeText(alignedWords[i + j]?.word || '');
      const sw = sectionWords[j];
      if (!aw || !sw) continue;
      if (aw === sw || aw.includes(sw) || sw.includes(aw)) matches++;
    }

    const score = matches / prefixLen;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
      if (bestScore >= 0.9) break;
    }
  }

  if (bestIdx === -1 || bestScore < 0.5) return null;

  const startIdx = bestIdx;

  // Find end word
  let endIdx = startIdx;
  const maxSearch = Math.min(alignedWords.length, startIdx + sectionWords.length * 2);

  for (let i = startIdx; i < maxSearch; i++) {
    const normalized = normalizeText(alignedWords[i].word);
    if (normalized === lastWord || normalized.includes(lastWord) || lastWord.includes(normalized)) {
      endIdx = i;
    }
  }

  if (endIdx === startIdx && sectionWords.length > 1) {
    endIdx = Math.min(alignedWords.length - 1, startIdx + sectionWords.length - 1);
  }

  const matchedWords = alignedWords.slice(startIdx, endIdx + 1);
  if (matchedWords.length === 0) return null;

  return {
    startTime: matchedWords[0].startS,
    endTime: matchedWords[matchedWords.length - 1].endS,
    words: matchedWords,
    nextSearchIndex: endIdx + 1,
  };
}
