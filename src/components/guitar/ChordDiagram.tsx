import { cn } from '@/lib/utils';

interface ChordDiagramProps {
  chord: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Comprehensive guitar chord fingerings (fret positions for each string, -1 = muted, 0 = open)
const CHORD_FINGERINGS: Record<string, number[]> = {
  // Special chords
  'N': [-1, -1, -1, -1, -1, -1], // No chord / silence
  
  // Major chords
  'C': [-1, 3, 2, 0, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3],
  'A': [-1, 0, 2, 2, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2],
  'C#': [-1, 4, 3, 1, 2, 1],
  'Db': [-1, 4, 3, 1, 2, 1],
  'D#': [-1, -1, 1, 3, 4, 3],
  'Eb': [-1, -1, 1, 3, 4, 3],
  'F#': [2, 4, 4, 3, 2, 2],
  'Gb': [2, 4, 4, 3, 2, 2],
  'G#': [4, 6, 6, 5, 4, 4],
  'Ab': [4, 6, 6, 5, 4, 4],
  'A#': [-1, 1, 3, 3, 3, 1],
  'Bb': [-1, 1, 3, 3, 3, 1],
  
  // Minor chords (both 'm' and 'min' formats are supported)
  'Am': [-1, 0, 2, 2, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2],
  'Cm': [-1, 3, 5, 5, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'Em': [0, 2, 2, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3],
  'C#m': [-1, 4, 6, 6, 5, 4],
  'Dbm': [-1, 4, 6, 6, 5, 4],
  'D#m': [-1, -1, 1, 3, 4, 2],
  'Ebm': [-1, -1, 1, 3, 4, 2],
  'F#m': [2, 4, 4, 2, 2, 2],
  'Gbm': [2, 4, 4, 2, 2, 2],
  'G#m': [4, 6, 6, 4, 4, 4],
  'Abm': [4, 6, 6, 4, 4, 4],
  'A#m': [-1, 1, 3, 3, 2, 1],
  'Bbm': [-1, 1, 3, 3, 2, 1],
  
  // 7th chords (dominant)
  'A7': [-1, 0, 2, 0, 2, 0],
  'B7': [-1, 2, 1, 2, 0, 2],
  'C7': [-1, 3, 2, 3, 1, 0],
  'D7': [-1, -1, 0, 2, 1, 2],
  'E7': [0, 2, 0, 1, 0, 0],
  'F7': [1, 3, 1, 2, 1, 1],
  'G7': [3, 2, 0, 0, 0, 1],
  'C#7': [-1, 4, 3, 4, 2, 0],
  'Db7': [-1, 4, 3, 4, 2, 0],
  'D#7': [-1, -1, 1, 3, 2, 3],
  'Eb7': [-1, -1, 1, 3, 2, 3],
  'F#7': [2, 4, 2, 3, 2, 2],
  'Gb7': [2, 4, 2, 3, 2, 2],
  'G#7': [4, 6, 4, 5, 4, 4],
  'Ab7': [4, 6, 4, 5, 4, 4],
  'A#7': [-1, 1, 3, 1, 3, 1],
  'Bb7': [-1, 1, 3, 1, 3, 1],
  
  // Minor 7th chords
  'Am7': [-1, 0, 2, 0, 1, 0],
  'Bm7': [-1, 2, 4, 2, 3, 2],
  'Cm7': [-1, 3, 5, 3, 4, 3],
  'Dm7': [-1, -1, 0, 2, 1, 1],
  'Em7': [0, 2, 0, 0, 0, 0],
  'Fm7': [1, 3, 1, 1, 1, 1],
  'Gm7': [3, 5, 3, 3, 3, 3],
  'F#m7': [2, 4, 2, 2, 2, 2],
  'G#m7': [4, 6, 4, 4, 4, 4],
  'C#m7': [-1, 4, 6, 4, 5, 4],
  'Bbm7': [-1, 1, 3, 1, 2, 1],
  
  // Major 7th chords
  'Amaj7': [-1, 0, 2, 1, 2, 0],
  'Bmaj7': [-1, 2, 4, 3, 4, 2],
  'Cmaj7': [-1, 3, 2, 0, 0, 0],
  'Dmaj7': [-1, -1, 0, 2, 2, 2],
  'Emaj7': [0, 2, 1, 1, 0, 0],
  'Fmaj7': [1, 3, 2, 2, 1, 1],
  'Gmaj7': [3, 2, 0, 0, 0, 2],
  
  // Diminished chords
  'Adim': [-1, 0, 1, 2, 1, -1],
  'Bdim': [-1, 2, 3, 4, 3, -1],
  'Cdim': [-1, 3, 4, 5, 4, -1],
  'Ddim': [-1, -1, 0, 1, 0, 1],
  'Edim': [0, 1, 2, 0, 2, 0],
  'Fdim': [1, 2, 3, 1, 3, 1],
  'Gdim': [3, 4, 5, 3, 5, 3],
  
  // Augmented chords
  'Aaug': [-1, 0, 3, 2, 2, 1],
  'Baug': [-1, 2, 5, 4, 4, 3],
  'Caug': [-1, 3, 2, 1, 1, 0],
  'Daug': [-1, -1, 0, 3, 3, 2],
  'Eaug': [0, 3, 2, 1, 1, 0],
  'Faug': [1, 4, 3, 2, 2, 1],
  'Gaug': [3, 2, 1, 0, 0, 3],
  
  // Sus chords
  'Asus2': [-1, 0, 2, 2, 0, 0],
  'Asus4': [-1, 0, 2, 2, 3, 0],
  'Dsus2': [-1, -1, 0, 2, 3, 0],
  'Dsus4': [-1, -1, 0, 2, 3, 3],
  'Esus2': [0, 2, 4, 4, 0, 0],
  'Esus4': [0, 2, 2, 2, 0, 0],
  'Gsus2': [3, 0, 0, 0, 3, 3],
  'Gsus4': [3, 3, 0, 0, 1, 3],
  
  // Power chords (5)
  'A5': [-1, 0, 2, 2, -1, -1],
  'B5': [-1, 2, 4, 4, -1, -1],
  'C5': [-1, 3, 5, 5, -1, -1],
  'D5': [-1, -1, 0, 2, 3, -1],
  'E5': [0, 2, 2, -1, -1, -1],
  'F5': [1, 3, 3, -1, -1, -1],
  'G5': [3, 5, 5, -1, -1, -1],
  
  // Add9 chords
  'Cadd9': [-1, 3, 2, 0, 3, 0],
  'Dadd9': [-1, -1, 0, 2, 3, 0],
  'Eadd9': [0, 2, 2, 1, 0, 2],
  'Gadd9': [3, 2, 0, 2, 0, 3],
  'Aadd9': [-1, 0, 2, 4, 2, 0],
};

// Normalize chord name for lookup - handles multiple formats
function normalizeChord(chord: string): string {
  // Handle empty or null
  if (!chord || chord === 'N' || chord === 'N/A' || chord === 'none' || chord === 'nc') {
    return 'N';
  }
  
  // Try exact match first
  if (CHORD_FINGERINGS[chord]) return chord;
  
  // Remove colon separator (e.g., "G:min" -> "Gmin", "D:7" -> "D7")
  let normalized = chord.replace(':', '');
  if (CHORD_FINGERINGS[normalized]) return normalized;
  
  // Try without bass note (e.g., "G/B" -> "G")
  const withoutBass = normalized.split('/')[0];
  if (CHORD_FINGERINGS[withoutBass]) return withoutBass;
  
  // Try replacing 'min' with 'm'
  normalized = withoutBass.replace('min', 'm').replace('maj', 'maj');
  if (CHORD_FINGERINGS[normalized]) return normalized;
  
  // Try adding 'm' for minor if it ends with 'min'
  if (chord.includes('min')) {
    const root = chord.replace(/:?min.*/, '');
    if (CHORD_FINGERINGS[root + 'm']) return root + 'm';
  }
  
  // Handle numbered chords like "D:7" -> "D7"
  const numMatch = chord.match(/^([A-Ga-g][#b]?):?(\d+)$/);
  if (numMatch) {
    const formatted = numMatch[1] + numMatch[2];
    if (CHORD_FINGERINGS[formatted]) return formatted;
  }
  
  // Try just the root note for major
  const rootMatch = chord.match(/^([A-Ga-g][#b]?)/);
  if (rootMatch && CHORD_FINGERINGS[rootMatch[1]]) {
    return rootMatch[1];
  }
  
  return chord;
}

export function ChordDiagram({ chord, className, size = 'md' }: ChordDiagramProps) {
  const normalizedChord = normalizeChord(chord);
  const fingering = CHORD_FINGERINGS[normalizedChord];
  
  const sizeConfig = {
    sm: { width: 50, height: 60, fontSize: 8, dotSize: 4 },
    md: { width: 70, height: 80, fontSize: 10, dotSize: 6 },
    lg: { width: 100, height: 110, fontSize: 12, dotSize: 8 },
  }[size];

  const { width, height, fontSize, dotSize } = sizeConfig;
  const stringSpacing = (width - 20) / 5;
  const fretSpacing = (height - 30) / 4;
  const startX = 10;
  const startY = 20;

  if (!fingering) {
    // Show chord name only if fingering not found
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted/50 border border-border",
          className
        )}
        style={{ width, height }}
      >
        <span className="font-mono font-bold text-muted-foreground" style={{ fontSize }}>
          {chord}
        </span>
      </div>
    );
  }

  const minFret = Math.min(...fingering.filter(f => f > 0));
  const maxFret = Math.max(...fingering);
  const baseFret = maxFret > 4 ? minFret : 1;

  return (
    <div className={cn("relative", className)}>
      {/* Chord name */}
      <div 
        className="text-center font-mono font-bold mb-1"
        style={{ fontSize: fontSize + 2 }}
      >
        {chord}
      </div>
      
      <svg width={width} height={height - 15} viewBox={`0 0 ${width} ${height - 15}`}>
        {/* Nut (if at first position) */}
        {baseFret === 1 && (
          <rect
            x={startX - 2}
            y={startY - 3}
            width={stringSpacing * 5 + 4}
            height={4}
            fill="currentColor"
            className="text-foreground"
          />
        )}

        {/* Base fret indicator */}
        {baseFret > 1 && (
          <text
            x={2}
            y={startY + fretSpacing / 2}
            fontSize={fontSize - 1}
            className="fill-muted-foreground"
          >
            {baseFret}
          </text>
        )}

        {/* Frets (horizontal lines) */}
        {[0, 1, 2, 3, 4].map(fret => (
          <line
            key={`fret-${fret}`}
            x1={startX}
            y1={startY + fret * fretSpacing}
            x2={startX + stringSpacing * 5}
            y2={startY + fret * fretSpacing}
            stroke="currentColor"
            strokeWidth={1}
            className="text-border"
          />
        ))}

        {/* Strings (vertical lines) */}
        {[0, 1, 2, 3, 4, 5].map(string => (
          <line
            key={`string-${string}`}
            x1={startX + string * stringSpacing}
            y1={startY}
            x2={startX + string * stringSpacing}
            y2={startY + fretSpacing * 4}
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted-foreground"
          />
        ))}

        {/* Finger positions */}
        {fingering.map((fret, stringIndex) => {
          const x = startX + stringIndex * stringSpacing;
          
          if (fret === -1) {
            // Muted string (X)
            return (
              <text
                key={`pos-${stringIndex}`}
                x={x}
                y={startY - 6}
                textAnchor="middle"
                fontSize={fontSize}
                className="fill-muted-foreground"
              >
                ×
              </text>
            );
          }
          
          if (fret === 0) {
            // Open string (O)
            return (
              <circle
                key={`pos-${stringIndex}`}
                cx={x}
                cy={startY - 8}
                r={dotSize / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-foreground"
              />
            );
          }
          
          // Fretted position
          const displayFret = fret - baseFret + 1;
          const y = startY + (displayFret - 0.5) * fretSpacing;
          
          return (
            <circle
              key={`pos-${stringIndex}`}
              cx={x}
              cy={y}
              r={dotSize}
              fill="currentColor"
              className="text-primary"
            />
          );
        })}
      </svg>
    </div>
  );
}
