/**
 * Analysis Service Layer
 * Business logic for audio analysis and melody recognition
 */

import * as analysisApi from '@/api/analysis.api';

// ==========================================
// Types
// ==========================================

export interface NoteData {
  pitch: number;      // MIDI pitch (0-127)
  startTime: number;  // seconds
  endTime: number;    // seconds
  velocity: number;   // 0-127
  noteName: string;   // e.g., "C4", "A#3"
}

export interface ChordData {
  chord: string;      // e.g., "Am", "G", "F", "C"
  startTime: number;
  endTime: number;
}

export interface MelodyAnalysisResult {
  notes: NoteData[];
  chords: ChordData[];
  bpm: number;
  key: string;           // e.g., "A minor", "C major"
  timeSignature: string; // e.g., "4/4"
  generatedTags: string[];
}

// ==========================================
// Constants
// ==========================================

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Major scale profile (Krumhansl-Schmuckler)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
// Minor scale profile
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// ==========================================
// Music Theory Helpers
// ==========================================

/**
 * Convert MIDI pitch to note name
 */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Detect key from notes using Krumhansl-Schmuckler algorithm
 */
export function detectKey(notes: NoteData[]): string {
  if (notes.length === 0) return 'Unknown';
  
  const pitchClasses = new Array(12).fill(0);
  notes.forEach(note => {
    const pitchClass = note.pitch % 12;
    pitchClasses[pitchClass] += note.endTime - note.startTime;
  });
  
  let bestKey = 'C major';
  let bestScore = -Infinity;
  
  for (let root = 0; root < 12; root++) {
    // Rotate pitch classes
    const rotated = [...pitchClasses.slice(root), ...pitchClasses.slice(0, root)];
    
    // Calculate correlation with major and minor profiles
    let majorScore = 0;
    let minorScore = 0;
    for (let i = 0; i < 12; i++) {
      majorScore += rotated[i] * MAJOR_PROFILE[i];
      minorScore += rotated[i] * MINOR_PROFILE[i];
    }
    
    if (majorScore > bestScore) {
      bestScore = majorScore;
      bestKey = `${NOTE_NAMES[root]} major`;
    }
    if (minorScore > bestScore) {
      bestScore = minorScore;
      bestKey = `${NOTE_NAMES[root]} minor`;
    }
  }
  
  return bestKey;
}

/**
 * Detect BPM via onset intervals
 */
export function detectBPM(notes: NoteData[]): number {
  if (notes.length < 4) return 120;
  
  const onsets = notes.map(n => n.startTime).sort((a, b) => a - b);
  const intervals: number[] = [];
  
  for (let i = 1; i < onsets.length; i++) {
    const interval = onsets[i] - onsets[i - 1];
    if (interval > 0.1 && interval < 2) {
      intervals.push(interval);
    }
  }
  
  if (intervals.length === 0) return 120;
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60 / avgInterval);
  
  // Clamp to reasonable range
  return Math.max(60, Math.min(200, bpm));
}

/**
 * Detect chord progression from notes
 */
export function detectChords(notes: NoteData[], duration: number): ChordData[] {
  const chords: ChordData[] = [];
  const segmentLength = 2; // seconds per segment
  const numSegments = Math.ceil(duration / segmentLength);
  
  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentLength;
    const endTime = Math.min((i + 1) * segmentLength, duration);
    
    const segmentNotes = notes.filter(n => 
      n.startTime < endTime && n.endTime > startTime
    );
    
    if (segmentNotes.length >= 2) {
      const pitchClasses = new Set<number>();
      segmentNotes.forEach(n => pitchClasses.add(n.pitch % 12));
      
      const chord = identifyChord(Array.from(pitchClasses));
      if (chord) {
        chords.push({ chord, startTime, endTime });
      }
    }
  }
  
  return chords;
}

/**
 * Identify chord from pitch classes
 */
function identifyChord(pitchClasses: number[]): string | null {
  if (pitchClasses.length < 2) return null;
  
  const sorted = [...pitchClasses].sort((a, b) => a - b);
  const root = sorted[0];
  const intervals = sorted.slice(1).map(p => (p - root + 12) % 12);
  
  const rootName = NOTE_NAMES[root];
  
  // Major: [4, 7]
  if (intervals.includes(4) && intervals.includes(7)) return rootName;
  // Minor: [3, 7]
  if (intervals.includes(3) && intervals.includes(7)) return `${rootName}m`;
  // Diminished: [3, 6]
  if (intervals.includes(3) && intervals.includes(6)) return `${rootName}dim`;
  // Augmented: [4, 8]
  if (intervals.includes(4) && intervals.includes(8)) return `${rootName}aug`;
  // Sus4: [5, 7]
  if (intervals.includes(5) && intervals.includes(7)) return `${rootName}sus4`;
  // Sus2: [2, 7]
  if (intervals.includes(2) && intervals.includes(7)) return `${rootName}sus2`;
  
  return rootName;
}

/**
 * Generate style tags from analysis
 */
export function generateTagsFromAnalysis(
  analysis: Omit<MelodyAnalysisResult, 'generatedTags'>
): string[] {
  const tags: string[] = [];
  
  // Add key and BPM
  tags.push(`[Key: ${analysis.key}]`);
  tags.push(`[BPM: ${analysis.bpm}]`);
  
  // Add chord progression
  if (analysis.chords.length > 0) {
    const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
    tags.push(`[Chords: ${uniqueChords.slice(0, 4).join('-')}]`);
  }
  
  // Determine tempo feel
  if (analysis.bpm < 80) {
    tags.push('slow tempo', 'ballad');
  } else if (analysis.bpm < 110) {
    tags.push('mid-tempo', 'groove');
  } else if (analysis.bpm < 140) {
    tags.push('upbeat', 'energetic');
  } else {
    tags.push('fast tempo', 'driving');
  }
  
  // Determine mood from key
  if (analysis.key.includes('minor')) {
    tags.push('melancholic', 'emotional');
  } else if (analysis.key.includes('major')) {
    tags.push('uplifting', 'bright');
  }
  
  return tags;
}

// ==========================================
// Analysis Workflow
// ==========================================

/**
 * Analyze audio file completely
 */
export async function analyzeAudioFile(
  file: File,
  userId: string
): Promise<MelodyAnalysisResult> {
  // Upload audio
  const audioUrl = await analysisApi.uploadAudioForAnalysis(file, userId);
  
  // Create temp track
  const trackId = await analysisApi.createTempAnalysisTrack(userId, audioUrl);
  
  try {
    // Run MIDI transcription
    const result = await analysisApi.invokeMidiTranscription({
      trackId,
      audioUrl,
      modelType: 'basic-pitch',
    });
    
    if (!result.success) {
      throw new Error(result.error || 'MIDI transcription failed');
    }
    
    // For now, generate synthetic analysis
    const mockNotes = generateMockNotes();
    const key = detectKey(mockNotes);
    const bpm = detectBPM(mockNotes);
    const chords = detectChords(mockNotes, 30);
    
    const analysisResult: MelodyAnalysisResult = {
      notes: mockNotes,
      chords,
      bpm,
      key,
      timeSignature: '4/4',
      generatedTags: [],
    };
    
    analysisResult.generatedTags = generateTagsFromAnalysis(analysisResult);
    
    return analysisResult;
  } finally {
    // Clean up temp track
    await analysisApi.deleteTempAnalysisTrack(trackId);
  }
}

/**
 * Generate mock notes for testing
 */
function generateMockNotes(): NoteData[] {
  const notes: NoteData[] = [];
  const baseNote = 60; // Middle C
  const scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale
  
  for (let i = 0; i < 16; i++) {
    const pitch = baseNote + scale[i % scale.length] + Math.floor(i / scale.length) * 12;
    notes.push({
      pitch,
      startTime: i * 0.5,
      endTime: i * 0.5 + 0.4,
      velocity: 80 + Math.random() * 40,
      noteName: midiToNoteName(pitch),
    });
  }
  
  return notes;
}

// Re-export API functions
export {
  fetchTrackAnalysis,
  createAudioAnalysis,
  uploadAudioForAnalysis,
  deleteTempAnalysisTrack,
} from '@/api/analysis.api';
