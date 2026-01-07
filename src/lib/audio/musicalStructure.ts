/**
 * Musical structure utilities for section detection
 * Creates sections based on typical song patterns when lyrics/words unavailable
 */

import type { DetectedSection, SectionType } from '@/types/sections';
import type { AlignedWord } from '@/hooks/useTimestampedLyrics';
import { getSectionLabel } from '@/types/sections';

interface SectionConfig {
  type: SectionType;
  counter: number;
  startTime: number;
  endTime: number;
}

/**
 * Create sections based on typical song structure
 * Used when no lyrics/words available
 */
export function createMusicalSections(duration: number): DetectedSection[] {
  if (duration <= 0) return [];

  const configs: SectionConfig[] = [];

  if (duration < 60) {
    // Short track - simple structure
    configs.push(
      { type: 'verse', counter: 1, startTime: 0, endTime: duration * 0.5 },
      { type: 'chorus', counter: 1, startTime: duration * 0.5, endTime: duration }
    );
  } else if (duration < 120) {
    // Medium track
    const intro = Math.min(8, duration * 0.05);
    const verse1End = intro + (duration - intro) * 0.35;
    const chorus1End = verse1End + (duration - intro) * 0.25;
    const verse2End = chorus1End + (duration - intro) * 0.25;

    if (intro > 3) {
      configs.push({ type: 'intro', counter: 1, startTime: 0, endTime: intro });
    }
    configs.push(
      { type: 'verse', counter: 1, startTime: intro || 0, endTime: verse1End },
      { type: 'chorus', counter: 1, startTime: verse1End, endTime: chorus1End },
      { type: 'verse', counter: 2, startTime: chorus1End, endTime: verse2End },
      { type: 'chorus', counter: 2, startTime: verse2End, endTime: duration }
    );
  } else {
    // Full length track - complete structure
    const intro = Math.min(10, duration * 0.04);
    const verse1End = intro + 25;
    const chorus1End = verse1End + 25;
    const verse2End = chorus1End + 25;
    const chorus2End = verse2End + 25;
    const bridgeEnd = Math.min(chorus2End + 20, duration - 30);
    const finalChorusEnd = Math.min(bridgeEnd + 30, duration - 10);

    if (intro > 3) {
      configs.push({ type: 'intro', counter: 1, startTime: 0, endTime: intro });
    }
    configs.push(
      { type: 'verse', counter: 1, startTime: intro || 0, endTime: verse1End },
      { type: 'chorus', counter: 1, startTime: verse1End, endTime: chorus1End },
      { type: 'verse', counter: 2, startTime: chorus1End, endTime: verse2End },
      { type: 'chorus', counter: 2, startTime: verse2End, endTime: chorus2End }
    );

    if (duration > 150) {
      configs.push(
        { type: 'bridge', counter: 1, startTime: chorus2End, endTime: bridgeEnd },
        { type: 'chorus', counter: 3, startTime: bridgeEnd, endTime: finalChorusEnd }
      );
      if (duration - finalChorusEnd > 5) {
        configs.push({ type: 'outro', counter: 1, startTime: finalChorusEnd, endTime: duration });
      }
    } else {
      configs.push({ type: 'outro', counter: 1, startTime: chorus2End, endTime: duration });
    }
  }

  return configs.map(c => ({
    type: c.type,
    label: getSectionLabel(c.type, c.counter),
    startTime: c.startTime,
    endTime: c.endTime,
    lyrics: '',
    words: [],
  }));
}

/**
 * Infer section type based on position, content, and history
 */
export function inferSectionType(
  sectionIndex: number,
  startTime: number,
  totalDuration: number,
  lyrics: string,
  history: SectionType[] = []
): SectionType {
  const position = startTime / totalDuration;
  const lowerLyrics = lyrics.toLowerCase();

  // Intro: first 8% of track
  if (sectionIndex === 0 && position < 0.08) {
    return 'intro';
  }

  // Outro: last 8% of track
  if (position > 0.92) {
    return 'outro';
  }

  // Check for chorus indicators
  const chorusPatterns = [
    'oh', 'yeah', 'hey', 'woah', 'la la', 'na na',
    'оо', 'эй', 'да', 'ла ла', 'на на', 'о-о', 'а-а',
    'baby', 'love', 'tonight', 'детка', 'любовь'
  ];
  const hasChorusPattern = chorusPatterns.some(p => lowerLyrics.includes(p));

  // Check repetition (choruses tend to repeat)
  const words = lowerLyrics.split(/\s+/).filter(w => w.length > 2);
  const uniqueRatio = words.length > 4 ? new Set(words).size / words.length : 1;
  const hasHighRepetition = uniqueRatio < 0.6;

  const isLikelyChorus = hasChorusPattern || hasHighRepetition;

  // Bridge detection - typically appears after 2nd chorus
  if (position > 0.55 && position < 0.8 && history.filter(h => h === 'chorus').length >= 2) {
    if (!isLikelyChorus && history[history.length - 1] === 'chorus') {
      return 'bridge';
    }
  }

  if (isLikelyChorus) {
    return 'chorus';
  }

  // Pre-chorus detection
  const lyricsLength = lyrics.length;
  if (lyricsLength < 100 && position > 0.15 && position < 0.35) {
    return 'pre-chorus';
  }

  // Alternate verse/chorus based on history
  if (history.length > 0) {
    const lastType = history[history.length - 1];
    if (lastType === 'verse') return 'chorus';
    if (lastType === 'chorus') return 'verse';
  }

  return 'verse';
}

/**
 * Detect sections from gaps in aligned words
 */
export function detectSectionsFromGaps(
  words: AlignedWord[],
  duration: number
): DetectedSection[] {
  if (!words.length) return [];

  const sections: DetectedSection[] = [];

  // Adaptive thresholds
  const isShortTrack = duration < 120;
  const GAP_THRESHOLD = isShortTrack ? 1.5 : 2.0;
  const MIN_SECTION_DURATION = isShortTrack ? 8 : 10;
  const MAX_SECTION_DURATION = 50;
  const MERGE_THRESHOLD = 0.8;

  let currentWords: AlignedWord[] = [];
  let sectionStart = words[0].startS;

  const typeCounters = { verse: 0, chorus: 0, bridge: 0, 'pre-chorus': 0 };
  const sectionHistory: SectionType[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    currentWords.push(word);

    const gap = nextWord ? (nextWord.startS - word.endS) : GAP_THRESHOLD + 1;
    const currentDuration = word.endS - sectionStart;
    const isLast = !nextWord;

    const hasNewlineMarker = word.word.includes('\n') || word.word.includes('\\n');
    const significantGap = gap >= GAP_THRESHOLD;
    const sectionTooLong = currentDuration >= MAX_SECTION_DURATION;
    const isSmallGap = gap > 0 && gap < MERGE_THRESHOLD;

    const shouldBreak = (
      ((significantGap && !isSmallGap) || hasNewlineMarker) && currentDuration >= MIN_SECTION_DURATION
    ) || sectionTooLong || isLast;

    if (shouldBreak) {
      if (currentWords.length > 0) {
        const lyrics = currentWords.map(w => w.word.replace(/[\n\\n]/g, ' ')).join(' ').trim();

        if (lyrics && lyrics.length > 5) {
          const type = inferSectionType(
            sections.length,
            sectionStart,
            duration,
            lyrics,
            sectionHistory
          );

          if (type in typeCounters) {
            typeCounters[type as keyof typeof typeCounters]++;
          }

          const counter = type === 'verse' ? typeCounters.verse :
            type === 'chorus' ? typeCounters.chorus :
            type === 'bridge' ? typeCounters.bridge :
            type === 'pre-chorus' ? typeCounters['pre-chorus'] : 1;

          // Check merge with previous
          const lastSection = sections[sections.length - 1];
          const shouldMerge = lastSection &&
            lastSection.type === type &&
            sectionStart - lastSection.endTime < MERGE_THRESHOLD;

          if (shouldMerge && lastSection) {
            lastSection.endTime = word.endS;
            lastSection.lyrics = (lastSection.lyrics + ' ' + lyrics).trim();
            lastSection.words = [...lastSection.words, ...currentWords];
          } else {
            sections.push({
              type,
              label: getSectionLabel(type, counter),
              startTime: sectionStart,
              endTime: word.endS,
              lyrics,
              words: [...currentWords],
            });
            sectionHistory.push(type);
          }
        }
      }

      currentWords = [];
      if (nextWord) {
        sectionStart = nextWord.startS;
      }
    }
  }

  // Too few sections - use musical structure
  if (sections.length < 2 && duration > 45) {
    return createMusicalSections(duration);
  }

  // Make sections continuous
  if (sections.length > 0) {
    sections[0].startTime = 0;
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i];
      const next = sections[i + 1];
      if (current.endTime < next.startTime) current.endTime = next.startTime;
    }
    sections[sections.length - 1].endTime = duration;
  }

  return sections;
}
