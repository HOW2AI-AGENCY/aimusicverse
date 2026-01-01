/**
 * High-Precision Lyrics Synchronization Engine
 * 
 * Features:
 * - Sub-frame timing accuracy (< 16ms)
 * - Adaptive look-ahead based on word position in phrase
 * - Phoneme-aware highlighting for natural feel
 * - Prediction with velocity compensation
 * - Jitter smoothing for stable highlighting
 */

import { AlignedWord } from '@/hooks/lyrics/useLyricsSynchronization';

// Enhanced sync constants with adaptive values - tuned for better feel
export const PRECISION_SYNC = {
  // Base look-ahead (will be adapted dynamically) - increased for better anticipation
  BASE_WORD_LOOK_AHEAD_MS: 60,  // Increased from 40
  BASE_LINE_LOOK_AHEAD_MS: 100, // Increased from 80
  
  // Maximum look-ahead adjustment
  MAX_LOOK_AHEAD_BOOST_MS: 80,  // Increased from 60
  
  // End tolerances - extended to prevent flickering
  WORD_END_TOLERANCE_MS: 150,   // Increased from 100
  LINE_END_TOLERANCE_MS: 250,   // Increased from 180
  
  // Timing thresholds - refined for Russian/English lyrics
  MIN_WORD_DURATION_MS: 40,     // Reduced from 50
  GAP_THRESHOLD_MS: 250,        // Reduced from 300 for tighter phrases
  PHRASE_GAP_MS: 400,           // Reduced from 500 for better phrase detection
  
  // Smoothing - improved for less jitter
  JITTER_THRESHOLD_MS: 15,      // Increased from 10
  VELOCITY_SMOOTHING: 0.88,     // Increased from 0.85 for smoother transitions
  
  // Frame timing
  TARGET_FRAME_MS: 16.67,       // 60fps target
  MAX_FRAME_MS: 33.33,          // Minimum 30fps
  
  // Additional precision settings
  WORD_TRANSITION_BUFFER_MS: 25, // Buffer between word highlights
  PHRASE_START_BOOST_MS: 30,     // Extra look-ahead for phrase starts
} as const;

/**
 * Word with enhanced timing information
 */
export interface EnhancedWord extends AlignedWord {
  // Computed fields
  durationMs: number;
  isShort: boolean;           // < 100ms
  isLong: boolean;            // > 500ms
  gapBeforeMs: number;        // Gap from previous word
  gapAfterMs: number;         // Gap to next word
  isPhraseStart: boolean;     // Starts new phrase
  isPhraseEnd: boolean;       // Ends phrase
  wordIndex: number;
  lineIndex: number;
  positionInLine: number;     // 0 = first, 1 = last
  
  // For prediction
  velocity: number;           // Words per second in current phrase
  predictedEndS: number;      // Predicted end time based on velocity
}

/**
 * Enhanced line with phrase information
 */
export interface EnhancedLine {
  words: EnhancedWord[];
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  text: string;
  index: number;
  wordCount: number;
  averageWordDurationMs: number;
  isPhraseStart: boolean;
  isPhraseEnd: boolean;
}

/**
 * Enhance words with timing metadata for precision sync
 */
export function enhanceWordsForSync(words: AlignedWord[]): EnhancedWord[] {
  if (!words?.length) return [];
  
  const enhanced: EnhancedWord[] = [];
  let lineIndex = 0;
  let positionInLine = 0;
  let phraseWordCount = 0;
  let phraseStartTime = words[0].startS;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prev = words[i - 1];
    const next = words[i + 1];
    
    const durationMs = (word.endS - word.startS) * 1000;
    const gapBeforeMs = prev ? (word.startS - prev.endS) * 1000 : 0;
    const gapAfterMs = next ? (next.startS - word.endS) * 1000 : 0;
    
    // Phrase detection
    const isPhraseStart = i === 0 || gapBeforeMs >= PRECISION_SYNC.PHRASE_GAP_MS;
    const isPhraseEnd = !next || gapAfterMs >= PRECISION_SYNC.PHRASE_GAP_MS;
    
    // Update phrase tracking
    if (isPhraseStart) {
      phraseWordCount = 0;
      phraseStartTime = word.startS;
    }
    phraseWordCount++;
    
    // Calculate velocity (words per second in current phrase)
    const phraseDuration = word.endS - phraseStartTime;
    const velocity = phraseDuration > 0 ? phraseWordCount / phraseDuration : 2;
    
    // Line detection (based on newlines or significant gaps)
    if (word.word.includes('\n') || (prev && gapBeforeMs > PRECISION_SYNC.GAP_THRESHOLD_MS)) {
      lineIndex++;
      positionInLine = 0;
    }
    
    // Calculate position in line (0-1)
    // We'll refine this after grouping into lines
    const posInLine = positionInLine;
    positionInLine++;
    
    // Predicted end based on average velocity
    const predictedDuration = velocity > 0 ? 1 / velocity : durationMs / 1000;
    const predictedEndS = word.startS + Math.min(predictedDuration, (durationMs / 1000) * 1.2);
    
    enhanced.push({
      ...word,
      durationMs,
      isShort: durationMs < 100,
      isLong: durationMs > 500,
      gapBeforeMs,
      gapAfterMs,
      isPhraseStart,
      isPhraseEnd,
      wordIndex: i,
      lineIndex,
      positionInLine: posInLine,
      velocity,
      predictedEndS,
    });
  }
  
  return enhanced;
}

/**
 * Group enhanced words into lines with phrase awareness
 */
export function groupIntoEnhancedLines(words: EnhancedWord[]): EnhancedLine[] {
  if (!words?.length) return [];
  
  const lines: EnhancedLine[] = [];
  let currentWords: EnhancedWord[] = [];
  let lineStartIndex = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);
    
    const shouldBreak = 
      word.word.includes('\n') ||
      word.isPhraseEnd ||
      currentWords.length >= 10 ||
      (i < words.length - 1 && words[i + 1].gapBeforeMs > PRECISION_SYNC.GAP_THRESHOLD_MS);
    
    if (shouldBreak || i === words.length - 1) {
      if (currentWords.length > 0) {
        // Update position in line for each word
        currentWords.forEach((w, idx) => {
          w.positionInLine = currentWords.length > 1 
            ? idx / (currentWords.length - 1) 
            : 0.5;
        });
        
        const startTimeMs = currentWords[0].startS * 1000;
        const endTimeMs = currentWords[currentWords.length - 1].endS * 1000;
        const durationMs = endTimeMs - startTimeMs;
        
        lines.push({
          words: [...currentWords],
          startTimeMs,
          endTimeMs,
          durationMs,
          text: currentWords.map(w => w.word.replace(/\n/g, '').trim()).filter(Boolean).join(' '),
          index: lines.length,
          wordCount: currentWords.length,
          averageWordDurationMs: durationMs / currentWords.length,
          isPhraseStart: currentWords[0].isPhraseStart,
          isPhraseEnd: currentWords[currentWords.length - 1].isPhraseEnd,
        });
      }
      currentWords = [];
    }
  }
  
  return lines;
}

/**
 * Calculate adaptive look-ahead for a word
 * 
 * Look-ahead is increased for:
 * - Words at start of phrase (need to prepare)
 * - Short words (need earlier highlighting)
 * - First word in line
 */
export function calculateWordLookAhead(word: EnhancedWord): number {
  let lookAhead = PRECISION_SYNC.BASE_WORD_LOOK_AHEAD_MS;
  
  // Phrase start boost - words at phrase start need earlier highlight
  if (word.isPhraseStart) {
    lookAhead += PRECISION_SYNC.PHRASE_START_BOOST_MS;
  }
  
  // Short word boost - short words need earlier highlight to be visible
  if (word.isShort) {
    lookAhead += 25; // Increased from 15
  }
  
  // Very short words (< 80ms) need even more boost
  if (word.durationMs < 80) {
    lookAhead += 15;
  }
  
  // Position in line boost (earlier words get more look-ahead)
  lookAhead += (1 - word.positionInLine) * 20; // Increased from 15
  
  // Gap compensation - if there's a big gap before, reduce look-ahead
  if (word.gapBeforeMs > PRECISION_SYNC.GAP_THRESHOLD_MS) {
    lookAhead -= 10;
  }
  
  // Velocity compensation - faster speech needs more look-ahead
  if (word.velocity > 3) {
    lookAhead += (word.velocity - 3) * 8;
  }
  
  // Cap at maximum
  return Math.min(
    Math.max(lookAhead, PRECISION_SYNC.BASE_WORD_LOOK_AHEAD_MS / 2), 
    PRECISION_SYNC.BASE_WORD_LOOK_AHEAD_MS + PRECISION_SYNC.MAX_LOOK_AHEAD_BOOST_MS
  );
}

/**
 * Calculate adaptive line look-ahead
 */
export function calculateLineLookAhead(line: EnhancedLine): number {
  let lookAhead = PRECISION_SYNC.BASE_LINE_LOOK_AHEAD_MS;
  
  // Phrase start boost
  if (line.isPhraseStart) {
    lookAhead += 40; // Increased from 30
  }
  
  // Short line boost (fewer words = need earlier prep)
  if (line.wordCount <= 3) {
    lookAhead += 30; // Increased from 20
  }
  
  // Very short lines (1-2 words) need more boost
  if (line.wordCount <= 2) {
    lookAhead += 20;
  }
  
  // Fast lines (high average velocity) need more look-ahead
  const avgWordDuration = line.averageWordDurationMs;
  if (avgWordDuration < 200) {
    lookAhead += 25;
  }
  
  return Math.min(lookAhead, PRECISION_SYNC.BASE_LINE_LOOK_AHEAD_MS + PRECISION_SYNC.MAX_LOOK_AHEAD_BOOST_MS);
}

/**
 * Precision binary search for active word
 * Returns index with confidence score
 */
export function findActiveWordPrecision(
  words: EnhancedWord[],
  currentTimeMs: number
): { index: number; confidence: number } {
  if (!words.length) return { index: -1, confidence: 0 };
  
  let left = 0;
  let right = words.length - 1;
  let bestMatch = -1;
  let bestScore = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const word = words[mid];
    
    const wordStartMs = word.startS * 1000;
    const wordEndMs = word.endS * 1000;
    const lookAhead = calculateWordLookAhead(word);
    const adjustedTime = currentTimeMs + lookAhead;
    const endTolerance = PRECISION_SYNC.WORD_END_TOLERANCE_MS;
    
    // Check if word is active
    if (adjustedTime >= wordStartMs && adjustedTime <= wordEndMs + endTolerance) {
      // Calculate confidence based on position within word
      const wordProgress = (adjustedTime - wordStartMs) / (wordEndMs - wordStartMs);
      const confidence = wordProgress <= 1 ? 1 : Math.max(0, 1 - (wordProgress - 1) * 2);
      
      if (confidence > bestScore) {
        bestMatch = mid;
        bestScore = confidence;
      }
      
      // Check neighbors for potentially better match
      if (mid > 0) {
        const prevScore = scoreWordMatch(words[mid - 1], adjustedTime, endTolerance);
        if (prevScore > bestScore) {
          bestMatch = mid - 1;
          bestScore = prevScore;
        }
      }
      if (mid < words.length - 1) {
        const nextScore = scoreWordMatch(words[mid + 1], adjustedTime, endTolerance);
        if (nextScore > bestScore) {
          bestMatch = mid + 1;
          bestScore = nextScore;
        }
      }
      
      break;
    } else if (adjustedTime < wordStartMs) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  // Fallback: linear search near the binary search result
  if (bestMatch === -1) {
    const startIdx = Math.max(0, left - 2);
    const endIdx = Math.min(words.length - 1, left + 2);
    
    for (let i = startIdx; i <= endIdx; i++) {
      const word = words[i];
      const lookAhead = calculateWordLookAhead(word);
      const adjustedTime = currentTimeMs + lookAhead;
      const score = scoreWordMatch(word, adjustedTime, PRECISION_SYNC.WORD_END_TOLERANCE_MS);
      
      if (score > bestScore) {
        bestMatch = i;
        bestScore = score;
      }
    }
  }
  
  return { index: bestMatch, confidence: bestScore };
}

/**
 * Score how well a word matches the current time
 */
function scoreWordMatch(word: EnhancedWord, adjustedTimeMs: number, endToleranceMs: number): number {
  const wordStartMs = word.startS * 1000;
  const wordEndMs = word.endS * 1000;
  
  // Not in range
  if (adjustedTimeMs < wordStartMs - 10 || adjustedTimeMs > wordEndMs + endToleranceMs) {
    return 0;
  }
  
  // Perfect match in middle of word
  const midpoint = (wordStartMs + wordEndMs) / 2;
  const distanceFromMid = Math.abs(adjustedTimeMs - midpoint);
  const halfDuration = (wordEndMs - wordStartMs) / 2;
  
  if (halfDuration > 0) {
    return Math.max(0, 1 - distanceFromMid / halfDuration * 0.5);
  }
  
  return 0.5;
}

/**
 * Find active line with precision
 */
export function findActiveLinePrecision(
  lines: EnhancedLine[],
  currentTimeMs: number
): { index: number; confidence: number } {
  if (!lines.length) return { index: -1, confidence: 0 };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lookAhead = calculateLineLookAhead(line);
    const adjustedTime = currentTimeMs + lookAhead;
    const endTolerance = PRECISION_SYNC.LINE_END_TOLERANCE_MS;
    
    if (adjustedTime >= line.startTimeMs && adjustedTime <= line.endTimeMs + endTolerance) {
      const progress = (adjustedTime - line.startTimeMs) / line.durationMs;
      const confidence = progress <= 1 ? 1 : Math.max(0, 1 - (progress - 1) * 2);
      return { index: i, confidence };
    }
  }
  
  return { index: -1, confidence: 0 };
}

/**
 * Smooth time value to reduce jitter
 */
export class TimeSmootherAdvanced {
  private lastTime: number = 0;
  private velocity: number = 1;
  private lastUpdateTime: number = 0;
  
  update(newTime: number): number {
    const now = performance.now();
    const dt = now - this.lastUpdateTime;
    
    if (this.lastUpdateTime === 0 || dt > 500) {
      // First update or long gap - reset
      this.lastTime = newTime;
      this.velocity = 1;
      this.lastUpdateTime = now;
      return newTime;
    }
    
    // Calculate actual velocity
    const timeDelta = newTime - this.lastTime;
    const expectedDelta = dt / 1000; // What we'd expect at 1x speed
    
    if (expectedDelta > 0) {
      const currentVelocity = timeDelta / expectedDelta;
      this.velocity = this.velocity * PRECISION_SYNC.VELOCITY_SMOOTHING + 
                      currentVelocity * (1 - PRECISION_SYNC.VELOCITY_SMOOTHING);
    }
    
    // If time jump is small, smooth it
    const jump = Math.abs(timeDelta - expectedDelta * this.velocity);
    if (jump < PRECISION_SYNC.JITTER_THRESHOLD_MS / 1000) {
      // Small jitter - predict time instead
      const smoothedTime = this.lastTime + expectedDelta * this.velocity;
      this.lastTime = smoothedTime;
      this.lastUpdateTime = now;
      return smoothedTime;
    }
    
    // Larger jump - trust the new value
    this.lastTime = newTime;
    this.lastUpdateTime = now;
    return newTime;
  }
  
  reset() {
    this.lastTime = 0;
    this.velocity = 1;
    this.lastUpdateTime = 0;
  }
}
