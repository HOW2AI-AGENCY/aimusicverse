/**
 * Realtime Chord Detection using Pitch Class Profiles (PCP)
 * Based on chroma feature extraction and template matching
 */

// Standard chord templates (binary representation for each pitch class)
// Index: C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11

export const CHORD_TEMPLATES: Record<string, number[]> = {
  // Major chords
  'C':  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  'C#': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  'D':  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  'D#': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
  'E':  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  'F':  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  'F#': [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  'G':  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  'G#': [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  'A':  [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  'A#': [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  'B':  [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
  
  // Minor chords
  'Cm':  [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
  'C#m': [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  'Dm':  [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  'D#m': [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
  'Em':  [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  'Fm':  [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  'F#m': [0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
  'Gm':  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0],
  'G#m': [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
  'Am':  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  'A#m': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  'Bm':  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  
  // 7th chords
  'C7':  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  'D7':  [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  'E7':  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1],
  'G7':  [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  'A7':  [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
  
  // Sus chords
  'Csus4': [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
  'Dsus4': [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  'Esus4': [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
  'Asus4': [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
};

export type ChordQuality = 'major' | 'minor' | 'dim' | 'aug' | '7' | 'sus4' | 'unknown';

export interface DetectedChord {
  name: string;
  root: string;
  quality: ChordQuality;
  confidence: number;
  chromagram: number[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Compute chromagram (Pitch Class Profile) from frequency data
 */
export function computeChromagram(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number
): number[] {
  const chromagram = new Array(12).fill(0);
  const minFreq = 80; // ~E2 (guitar low E)
  const maxFreq = 1200; // ~D#6
  
  // Frequency resolution
  const binWidth = sampleRate / fftSize;
  
  for (let i = 0; i < frequencyData.length; i++) {
    const freq = i * binWidth;
    if (freq < minFreq || freq > maxFreq) continue;
    
    // Convert frequency to MIDI note number
    const midiNote = 12 * Math.log2(freq / 440) + 69;
    
    // Get pitch class (0-11)
    const pitchClass = Math.round(midiNote) % 12;
    if (pitchClass >= 0 && pitchClass < 12) {
      // Use magnitude (convert from dB)
      const magnitude = Math.pow(10, frequencyData[i] / 20);
      chromagram[pitchClass] += magnitude;
    }
  }
  
  // Normalize
  const maxVal = Math.max(...chromagram);
  if (maxVal > 0) {
    for (let i = 0; i < 12; i++) {
      chromagram[i] /= maxVal;
    }
  }
  
  return chromagram;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Detect chord from chromagram using template matching
 */
export function detectChord(chromagram: number[]): DetectedChord {
  let bestMatch = 'N/C';
  let bestScore = 0;
  let bestQuality: ChordQuality = 'unknown';
  let bestRoot = '';
  
  // Check energy level - if too low, return no chord
  const energy = chromagram.reduce((a, b) => a + b, 0);
  if (energy < 0.1) {
    return {
      name: 'N/C',
      root: '',
      quality: 'unknown',
      confidence: 0,
      chromagram,
    };
  }
  
  for (const [chordName, template] of Object.entries(CHORD_TEMPLATES)) {
    const similarity = cosineSimilarity(chromagram, template);
    
    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = chordName;
      
      // Parse quality
      if (chordName.includes('m') && !chordName.includes('dim')) {
        bestQuality = 'minor';
        bestRoot = chordName.replace('m', '').replace('7', '');
      } else if (chordName.includes('7')) {
        bestQuality = '7';
        bestRoot = chordName.replace('7', '');
      } else if (chordName.includes('sus4')) {
        bestQuality = 'sus4';
        bestRoot = chordName.replace('sus4', '');
      } else {
        bestQuality = 'major';
        bestRoot = chordName;
      }
    }
  }
  
  return {
    name: bestMatch,
    root: bestRoot,
    quality: bestQuality,
    confidence: bestScore,
    chromagram,
  };
}

/**
 * Get chord color based on quality
 */
export function getChordColor(quality: ChordQuality): string {
  switch (quality) {
    case 'major':
      return 'hsl(200, 80%, 60%)';
    case 'minor':
      return 'hsl(280, 70%, 60%)';
    case '7':
      return 'hsl(30, 80%, 60%)';
    case 'sus4':
      return 'hsl(160, 70%, 50%)';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

/**
 * Get notes that make up a chord
 */
export function getChordNotes(chordName: string): string[] {
  const template = CHORD_TEMPLATES[chordName];
  if (!template) return [];
  
  const notes: string[] = [];
  template.forEach((val, idx) => {
    if (val === 1) {
      notes.push(NOTE_NAMES[idx]);
    }
  });
  
  return notes;
}
