/**
 * Hook for detecting song sections
 * 
 * Priority order:
 * 1. Parse tags from lyrics ([Verse], [Chorus], etc.)
 * 2. Use aligned words with gap detection
 * 3. Smart duration-based sections following typical song structure
 */

import { useMemo } from 'react';
import { AlignedWord } from '@/hooks/useTimestampedLyrics';
import { logger } from '@/lib/logger';

export interface DetectedSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'hook' | 'unknown';
  label: string;
  startTime: number;
  endTime: number;
  lyrics: string;
  words: AlignedWord[];
}

// Tag patterns - English and Russian
const TAG_PATTERN = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук|instrumental|инструментал|solo|соло|refrain|рефрен)(?:\s*\d+)?[\]\)]/gi;

function getTypeFromTag(tagText: string): DetectedSection['type'] {
  const lower = tagText.toLowerCase();
  if (/verse|куплет/i.test(lower)) return 'verse';
  if (/chorus|припев|refrain|рефрен/i.test(lower)) return 'chorus';
  if (/bridge|бридж/i.test(lower)) return 'bridge';
  if (/intro|интро/i.test(lower)) return 'intro';
  if (/outro|аутро|концовка/i.test(lower)) return 'outro';
  if (/pre-?chorus|пре-?припев/i.test(lower)) return 'pre-chorus';
  if (/hook|хук/i.test(lower)) return 'hook';
  return 'unknown';
}

// Russian labels for sections
function getSectionLabel(type: DetectedSection['type'], counter: number): string {
  const labels: Record<DetectedSection['type'], string> = {
    'verse': `Куплет ${counter}`,
    'chorus': `Припев ${counter}`,
    'bridge': `Бридж`,
    'intro': 'Интро',
    'outro': 'Аутро',
    'pre-chorus': `Пре-припев ${counter}`,
    'hook': `Хук ${counter}`,
    'unknown': `Секция ${counter}`,
  };
  return labels[type];
}

// Parse sections from lyrics with tags
function parseSectionsFromLyrics(lyrics: string): { type: DetectedSection['type']; tag: string; lyrics: string; index: number }[] {
  if (!lyrics?.trim()) return [];

  const sections: { type: DetectedSection['type']; tag: string; lyrics: string; index: number }[] = [];
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

// Filter out tag words from aligned words
function filterTagWords(words: AlignedWord[]): AlignedWord[] {
  const tagPattern = /[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|концовка|пре-?припев|хук)(?:\s*\d+)?[\]\)]/i;
  return words.filter(w => !tagPattern.test(w.word.trim()));
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\wа-яё\s]/gi, '').replace(/\s+/g, ' ').trim();
}

// Match section to timestamps using aligned words
function matchSectionToTimestamps(
  sectionLyrics: string,
  alignedWords: AlignedWord[],
  searchStartIndex: number
): { startTime: number; endTime: number; words: AlignedWord[]; nextSearchIndex: number } | null {
  if (!alignedWords.length || !sectionLyrics) return null;

  const normalizedSection = normalizeText(sectionLyrics);
  const sectionWords = normalizedSection.split(/\s+/).filter(Boolean);
  if (sectionWords.length === 0) return null;

  const firstWord = sectionWords[0];
  const lastWord = sectionWords[sectionWords.length - 1];

  // Better start match: score a short prefix window against aligned words
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
      // Early exit on near-perfect match
      if (bestScore >= 0.9) break;
    }
  }

  if (bestIdx === -1 || bestScore < 0.5) return null;

  const startIdx = bestIdx;

  // Find end word (prefer lastWord match, otherwise approximate by length)
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

/**
 * Smart section detection based on gaps in aligned words
 * Uses silence gaps and line breaks as section boundaries
 */
function detectSectionsFromGaps(words: AlignedWord[], duration: number): DetectedSection[] {
  if (!words.length) return [];

  const sections: DetectedSection[] = [];
  
  // Adaptive thresholds based on track duration
  const isShortTrack = duration < 120;
  const GAP_THRESHOLD = isShortTrack ? 1.2 : 1.5; // Reduced from 2.0 for better detection
  const MIN_SECTION_DURATION = isShortTrack ? 6 : 8; // Reduced from 10
  const MAX_SECTION_DURATION = 45; // Force split if section is too long
  
  let currentWords: AlignedWord[] = [];
  let sectionStart = words[0].startS;
  
  // Track type counters and history for pattern detection
  const typeCounters = { verse: 0, chorus: 0, bridge: 0 };
  const sectionHistory: DetectedSection['type'][] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    currentWords.push(word);

    const gap = nextWord ? (nextWord.startS - word.endS) : GAP_THRESHOLD + 1;
    const currentDuration = word.endS - sectionStart;
    const isLast = !nextWord;
    
    // Check for newline markers which often indicate section boundaries
    const hasNewlineMarker = word.word.includes('\n') || word.word.includes('\\n');
    const significantGap = gap >= GAP_THRESHOLD;
    const sectionTooLong = currentDuration >= MAX_SECTION_DURATION;

    // Break section on significant gap, newline marker, section too long, or end
    const shouldBreak = (
      ((significantGap || hasNewlineMarker) && currentDuration >= MIN_SECTION_DURATION) ||
      sectionTooLong ||
      isLast
    );

    if (shouldBreak) {
      if (currentWords.length > 0) {
        const lyrics = currentWords.map(w => w.word.replace(/[\n\\n]/g, ' ')).join(' ').trim();
        
        if (lyrics && lyrics.length > 5) {
          const sectionIndex = sections.length;
          const type = inferSectionTypeFromContext(
            sectionIndex, 
            sectionStart, 
            duration, 
            lyrics,
            sectionHistory
          );
          
          if (type === 'verse') typeCounters.verse++;
          else if (type === 'chorus') typeCounters.chorus++;
          else if (type === 'bridge') typeCounters.bridge++;
          
          const counter = type === 'verse' ? typeCounters.verse : 
                         type === 'chorus' ? typeCounters.chorus : 
                         type === 'bridge' ? typeCounters.bridge : 1;

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

      currentWords = [];
      if (nextWord) {
        sectionStart = nextWord.startS;
      }
    }
  }

  // If we got too few sections, subdivide
  if (sections.length < 2 && duration > 45) {
    return createMusicalSections(duration);
  }

  return sections;
}

/**
 * Infer section type based on position, content, and history
 */
function inferSectionTypeFromContext(
  sectionIndex: number,
  startTime: number,
  totalDuration: number,
  lyrics: string,
  history: DetectedSection['type'][] = []
): DetectedSection['type'] {
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
  
  // Check for chorus indicators - expanded patterns
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
  
  // Check if lyrics seem similar to previous chorus (repeated chorus)
  const isLikelyChorus = hasChorusPattern || hasHighRepetition;
  
  // Bridge detection - typically appears after 2nd chorus, position 60-80%
  if (position > 0.55 && position < 0.8 && history.filter(h => h === 'chorus').length >= 2) {
    // Check if this is different from typical verse/chorus pattern
    if (!isLikelyChorus && history[history.length - 1] === 'chorus') {
      return 'bridge';
    }
  }
  
  if (isLikelyChorus) {
    return 'chorus';
  }
  
  // Pre-chorus detection - short section before chorus
  const lyricsLength = lyrics.length;
  if (lyricsLength < 100 && position > 0.15 && position < 0.35) {
    const nextPosition = (history.length + 1) * (totalDuration / 8) / totalDuration;
    if (nextPosition > position && nextPosition - position < 0.15) {
      return 'pre-chorus';
    }
  }
  
  // Default to verse, but try to alternate based on history
  if (history.length > 0) {
    const lastType = history[history.length - 1];
    if (lastType === 'verse') return 'chorus';
    if (lastType === 'chorus') return 'verse';
  }
  
  return 'verse';
}

/**
 * Create sections based on typical song structure
 * Used when no lyrics/words available
 * @public Exported for use as fallback in components
 */
export function createMusicalSections(duration: number): DetectedSection[] {
  if (duration <= 0) return [];

  const sections: DetectedSection[] = [];
  
  // Typical pop song structure timings
  // Intro: 0-8 sec
  // Verse 1: 8-30 sec
  // Pre-chorus: 30-38 sec (optional)
  // Chorus 1: 38-60 sec
  // Verse 2: 60-90 sec
  // Chorus 2: 90-120 sec
  // Bridge: 120-140 sec
  // Final Chorus: 140-180 sec
  // Outro: 180+ sec

  if (duration < 60) {
    // Short track - simple structure
    sections.push({
      type: 'verse',
      label: 'Куплет 1',
      startTime: 0,
      endTime: duration * 0.5,
      lyrics: '',
      words: [],
    });
    sections.push({
      type: 'chorus',
      label: 'Припев 1',
      startTime: duration * 0.5,
      endTime: duration,
      lyrics: '',
      words: [],
    });
  } else if (duration < 120) {
    // Medium track
    const intro = Math.min(8, duration * 0.05);
    const verse1End = intro + (duration - intro) * 0.35;
    const chorus1End = verse1End + (duration - intro) * 0.25;
    const verse2End = chorus1End + (duration - intro) * 0.25;
    
    if (intro > 3) {
      sections.push({ type: 'intro', label: 'Интро', startTime: 0, endTime: intro, lyrics: '', words: [] });
    }
    sections.push({ type: 'verse', label: 'Куплет 1', startTime: intro || 0, endTime: verse1End, lyrics: '', words: [] });
    sections.push({ type: 'chorus', label: 'Припев 1', startTime: verse1End, endTime: chorus1End, lyrics: '', words: [] });
    sections.push({ type: 'verse', label: 'Куплет 2', startTime: chorus1End, endTime: verse2End, lyrics: '', words: [] });
    sections.push({ type: 'chorus', label: 'Припев 2', startTime: verse2End, endTime: duration, lyrics: '', words: [] });
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
      sections.push({ type: 'intro', label: 'Интро', startTime: 0, endTime: intro, lyrics: '', words: [] });
    }
    sections.push({ type: 'verse', label: 'Куплет 1', startTime: intro || 0, endTime: verse1End, lyrics: '', words: [] });
    sections.push({ type: 'chorus', label: 'Припев 1', startTime: verse1End, endTime: chorus1End, lyrics: '', words: [] });
    sections.push({ type: 'verse', label: 'Куплет 2', startTime: chorus1End, endTime: verse2End, lyrics: '', words: [] });
    sections.push({ type: 'chorus', label: 'Припев 2', startTime: verse2End, endTime: chorus2End, lyrics: '', words: [] });
    
    if (duration > 150) {
      sections.push({ type: 'bridge', label: 'Бридж', startTime: chorus2End, endTime: bridgeEnd, lyrics: '', words: [] });
      sections.push({ type: 'chorus', label: 'Припев 3', startTime: bridgeEnd, endTime: finalChorusEnd, lyrics: '', words: [] });
      
      if (duration - finalChorusEnd > 5) {
        sections.push({ type: 'outro', label: 'Аутро', startTime: finalChorusEnd, endTime: duration, lyrics: '', words: [] });
      }
    } else {
      sections.push({ type: 'outro', label: 'Аутро', startTime: chorus2End, endTime: duration, lyrics: '', words: [] });
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
        const sections: DetectedSection[] = [];
        const typeCounters: Record<string, number> = {};
        let searchIndex = 0;

        for (const parsed of parsedSections) {
          typeCounters[parsed.type] = (typeCounters[parsed.type] || 0) + 1;
          const match = matchSectionToTimestamps(parsed.lyrics, filteredWords, searchIndex);
          const prevEnd = sections[sections.length - 1]?.endTime || 0;

          if (match && match.endTime > match.startTime) {
            // Use matched timing, ensuring no overlap with previous section
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
            // Estimate timing if match failed - section starts RIGHT where previous ended
            const estimatedDuration = Math.max(10, duration / parsedSections.length);
            const estimatedStart = prevEnd; // NO GAP - start right where previous ended
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

        // CRITICAL: Ensure sections cover full track duration with NO GAPS
        if (sections.length > 0) {
          // 1. First section MUST start from 0
          if (sections[0].startTime > 0) {
            // Create intro section for the beginning gap
            sections.unshift({
              type: 'intro',
              label: 'Интро',
              startTime: 0,
              endTime: sections[0].startTime,
              lyrics: '',
              words: [],
            });
          }
          
          // 2. Fill ALL gaps between sections
          const filledSections: DetectedSection[] = [];
          for (let i = 0; i < sections.length; i++) {
            const current = sections[i];
            const prev = filledSections[filledSections.length - 1];
            
            // If there's a gap between previous and current, fill it
            if (prev && current.startTime > prev.endTime) {
              filledSections.push({
                type: 'unknown',
                label: 'Переход',
                startTime: prev.endTime,
                endTime: current.startTime,
                lyrics: '',
                words: [],
              });
            }
            
            // Add current section (adjusting start if needed to connect)
            filledSections.push({
              ...current,
              startTime: prev ? Math.max(current.startTime, prev.endTime) : current.startTime,
            });
          }
          
          // 3. Last section MUST extend to full duration
          const lastSection = filledSections[filledSections.length - 1];
          if (lastSection.endTime < duration) {
            lastSection.endTime = duration;
          }
          
          return filledSections;
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
      return createMusicalSections(duration); // Fallback on error
    }
  }, [originalLyrics, alignedWords, duration]);
}

export default useSectionDetection;
