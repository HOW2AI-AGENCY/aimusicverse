import { cn } from '@/lib/utils';

interface ChordDiagramProps {
  chord: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Common guitar chord fingerings (fret positions for each string, -1 = muted, 0 = open)
const CHORD_FINGERINGS: Record<string, number[]> = {
  // Major chords
  'C': [-1, 3, 2, 0, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3],
  'A': [-1, 0, 2, 2, 2, 0],
  'B': [-1, 2, 4, 4, 4, 2],
  
  // Minor chords
  'Am': [-1, 0, 2, 2, 1, 0],
  'Bm': [-1, 2, 4, 4, 3, 2],
  'Cm': [-1, 3, 5, 5, 4, 3],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'Em': [0, 2, 2, 0, 0, 0],
  'Fm': [1, 3, 3, 1, 1, 1],
  'Gm': [3, 5, 5, 3, 3, 3],
  
  // 7th chords
  'A7': [-1, 0, 2, 0, 2, 0],
  'B7': [-1, 2, 1, 2, 0, 2],
  'C7': [-1, 3, 2, 3, 1, 0],
  'D7': [-1, -1, 0, 2, 1, 2],
  'E7': [0, 2, 0, 1, 0, 0],
  'G7': [3, 2, 0, 0, 0, 1],
  
  // Minor 7th
  'Am7': [-1, 0, 2, 0, 1, 0],
  'Dm7': [-1, -1, 0, 2, 1, 1],
  'Em7': [0, 2, 0, 0, 0, 0],
  
  // Sus chords
  'Asus2': [-1, 0, 2, 2, 0, 0],
  'Asus4': [-1, 0, 2, 2, 3, 0],
  'Dsus2': [-1, -1, 0, 2, 3, 0],
  'Dsus4': [-1, -1, 0, 2, 3, 3],
  
  // Power chords (5)
  'A5': [-1, 0, 2, 2, -1, -1],
  'C5': [-1, 3, 5, 5, -1, -1],
  'D5': [-1, -1, 0, 2, 3, -1],
  'E5': [0, 2, 2, -1, -1, -1],
  'G5': [3, 5, 5, -1, -1, -1],
};

// Normalize chord name for lookup
function normalizeChord(chord: string): string {
  // Try exact match first
  if (CHORD_FINGERINGS[chord]) return chord;
  
  // Try without bass note (e.g., "G/B" -> "G")
  const withoutBass = chord.split('/')[0];
  if (CHORD_FINGERINGS[withoutBass]) return withoutBass;
  
  // Try replacing 'min' with 'm'
  const normalized = withoutBass.replace('min', 'm').replace('maj', '');
  if (CHORD_FINGERINGS[normalized]) return normalized;
  
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
