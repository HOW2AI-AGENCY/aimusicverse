/**
 * Guitar chord fingerings database
 * Shared across all chord diagram components
 */

export interface ChordFingering {
  frets: number[]; // -1 = muted, 0 = open, 1+ = fret position (6 strings: E A D G B e)
  fingers?: number[]; // 0 = no finger, 1-4 = finger number
  barres?: number[]; // Optional barre chord indicators
}

// Common guitar chord fingerings (6 strings: low E to high e)
export const CHORD_FINGERINGS: Record<string, ChordFingering> = {
  // Major chords
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barres: [2] },

  // Minor chords
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barres: [2] },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barres: [3] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barres: [3] },

  // 7th chords
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barres: [1] },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },

  // Minor 7th
  'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Bm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], barres: [2] },
  'Cm7': { frets: [-1, 3, 1, 3, 4, 3], fingers: [0, 2, 1, 3, 4, 3] },
  'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'Em7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0] },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barres: [1] },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barres: [3] },

  // Major 7th
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'Bmaj7': { frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], barres: [2] },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] },
  'Fmaj7': { frets: [1, 3, 2, 2, 1, 1], fingers: [1, 3, 2, 2, 1, 1], barres: [1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },

  // Sus chords
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 1, 1, 0, 0] },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3], fingers: [3, 3, 0, 0, 1, 4] },

  // Power chords (5)
  'A5': { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  'B5': { frets: [-1, 2, 4, 4, -1, -1], fingers: [0, 1, 3, 4, 0, 0] },
  'C5': { frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0] },
  'D5': { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0] },
  'E5': { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  'F5': { frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  'G5': { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },

  // Diminished
  'Adim': { frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  'Bdim': { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] },
  'Cdim': { frets: [-1, 3, 4, 2, 4, 2], fingers: [0, 2, 3, 1, 4, 1] },
  'Ddim': { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  'Edim': { frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },

  // Augmented
  'Caug': { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'Daug': { frets: [-1, -1, 0, 3, 3, 2], fingers: [0, 0, 0, 2, 3, 1] },
  'Eaug': { frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'Gaug': { frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] },

  // 9th chords
  'A9': { frets: [-1, 0, 2, 4, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  'D9': { frets: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] },
  'E9': { frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
  'G9': { frets: [3, 2, 0, 2, 0, 1], fingers: [3, 2, 0, 4, 0, 1] },

  // Add9
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  'Dadd9': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'Gadd9': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
};

// Finger color mapping for visual display
export const FINGER_COLORS = [
  'transparent',              // 0 - no finger
  'hsl(var(--primary))',      // 1 - index finger (blue/primary)
  'hsl(142 76% 46%)',         // 2 - middle finger (green)
  'hsl(47 100% 50%)',         // 3 - ring finger (yellow)
  'hsl(262 83% 58%)',         // 4 - pinky (purple)
];

// String names (low to high)
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

/**
 * Normalize chord name for lookup
 * Handles variations like:
 * - Bass notes: "G/B" -> "G"
 * - "min" -> "m"
 * - "maj" removed
 */
export function normalizeChord(chord: string): string {
  // Try exact match first
  if (CHORD_FINGERINGS[chord]) return chord;

  // Try without bass note (e.g., "G/B" -> "G")
  const withoutBass = chord.split('/')[0].trim();
  if (CHORD_FINGERINGS[withoutBass]) return withoutBass;

  // Try replacing 'min' with 'm' and removing 'maj'
  const normalized = withoutBass
    .replace(/min(?!or)/g, 'm')
    .replace(/maj(?!or)/g, '')
    .replace(/\s+/g, '');
  if (CHORD_FINGERINGS[normalized]) return normalized;

  // Return original if no match found
  return chord;
}

/**
 * Get fingering for a chord, with fallback
 */
export function getChordFingering(chord: string): ChordFingering | null {
  const normalized = normalizeChord(chord);
  return CHORD_FINGERINGS[normalized] || null;
}

/**
 * Check if a chord has fingering data
 */
export function hasChordFingering(chord: string): boolean {
  return !!getChordFingering(chord);
}

/**
 * Get all available chords
 */
export function getAllChords(): string[] {
  return Object.keys(CHORD_FINGERINGS).sort();
}

/**
 * Get chords by type
 */
export function getChordsByType(type: 'major' | 'minor' | '7th' | 'sus' | 'power' | 'other'): string[] {
  const chords = getAllChords();

  switch (type) {
    case 'major':
      return chords.filter(c => /^[A-G]$/.test(c));
    case 'minor':
      return chords.filter(c => c.endsWith('m') && !c.includes('7') && !c.includes('maj'));
    case '7th':
      return chords.filter(c => c.includes('7'));
    case 'sus':
      return chords.filter(c => c.includes('sus'));
    case 'power':
      return chords.filter(c => c.includes('5') && !c.includes('sus'));
    default:
      return chords.filter(c =>
        !(/^[A-G]$/.test(c)) &&
        !(c.endsWith('m') && !c.includes('7')) &&
        !c.includes('7') &&
        !c.includes('sus') &&
        !c.includes('5')
      );
  }
}
