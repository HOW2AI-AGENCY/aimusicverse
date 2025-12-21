import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface ChordDiagramEnhancedProps {
  chord: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFingers?: boolean;
  animated?: boolean;
  isActive?: boolean;
}

// Comprehensive guitar chord fingerings with finger positions
const CHORD_FINGERINGS: Record<string, { frets: number[]; fingers?: number[] }> = {
  // Special chords
  'N': { frets: [-1, -1, -1, -1, -1, -1], fingers: [0, 0, 0, 0, 0, 0] }, // No chord / silence
  
  // Major chords
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'F': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'B': { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },
  'C#': { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1] },
  'Db': { frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1] },
  'F#': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  'Bb': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] },
  
  // Minor chords
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Bm': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
  'Cm': { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1] },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1] },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1] },
  'C#m': { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1] },
  'Bbm': { frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1] },
  
  // 7th chords (dominant)
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'F7': { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1] },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1] },
  'Bb7': { frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1] },
  
  // Minor 7th chords
  'Am7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Bm7': { frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1] },
  'Cm7': { frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1] },
  'Dm7': { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'Em7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0] },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1] },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1] },
  'F#m7': { frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1] },
  
  // Major 7th chords
  'Amaj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'Cmaj7': { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'Dmaj7': { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 2, 1, 1, 0, 0] },
  'Fmaj7': { frets: [1, 3, 2, 2, 1, 1], fingers: [1, 4, 2, 3, 1, 1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },
  
  // Sus chords
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0] },
  
  // Power chords
  'A5': { frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
  'D5': { frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0] },
  'E5': { frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  'G5': { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  
  // Diminished
  'Adim': { frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  'Bdim': { frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] },
  'Ddim': { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  
  // Augmented
  'Caug': { frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  'Gaug': { frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] },
};

// Finger color mapping
const FINGER_COLORS = [
  'transparent',          // 0 - no finger
  'hsl(var(--primary))',  // 1 - index
  'hsl(142 76% 46%)',     // 2 - middle (green)
  'hsl(47 100% 50%)',     // 3 - ring (yellow)
  'hsl(262 83% 58%)',     // 4 - pinky (purple)
];

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

export function ChordDiagramEnhanced({ 
  chord, 
  className, 
  size = 'md',
  showFingers = false,
  animated = false,
  isActive = false,
}: ChordDiagramEnhancedProps) {
  const normalizedChord = normalizeChord(chord);
  const chordData = CHORD_FINGERINGS[normalizedChord];
  const fingering = chordData?.frets;
  const fingers = chordData?.fingers;
  
  const sizeConfig = {
    sm: { width: 60, height: 70, fontSize: 10, dotSize: 5, labelSize: 8 },
    md: { width: 80, height: 95, fontSize: 12, dotSize: 7, labelSize: 9 },
    lg: { width: 120, height: 140, fontSize: 16, dotSize: 10, labelSize: 12 },
    xl: { width: 160, height: 190, fontSize: 20, dotSize: 14, labelSize: 14 },
  }[size];

  const { width, height, fontSize, dotSize, labelSize } = sizeConfig;
  const stringSpacing = (width - 24) / 5;
  const fretSpacing = (height - 40) / 4;
  const startX = 12;
  const startY = 28;

  const MotionWrapper = animated ? motion.div : 'div';

  if (!fingering) {
    return (
      <MotionWrapper 
        className={cn(
          "flex flex-col items-center justify-center rounded-xl bg-muted/30 border border-border",
          isActive && "ring-2 ring-primary shadow-lg shadow-primary/20",
          className
        )}
        style={{ width, height }}
        {...(animated ? {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          whileHover: { scale: 1.02 },
        } : {})}
      >
        <span className="font-mono font-bold text-foreground" style={{ fontSize }}>
          {chord}
        </span>
        <span className="text-muted-foreground mt-1" style={{ fontSize: labelSize - 2 }}>
          Неизвестный
        </span>
      </MotionWrapper>
    );
  }

  const minFret = Math.min(...fingering.filter(f => f > 0));
  const maxFret = Math.max(...fingering);
  const baseFret = maxFret > 4 ? minFret : 1;

  return (
    <MotionWrapper 
      className={cn(
        "relative bg-gradient-to-b from-muted/20 to-muted/40 rounded-xl border p-2",
        isActive && "ring-2 ring-primary shadow-lg shadow-primary/20 border-primary/50",
        className
      )}
      {...(animated ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      } : {})}
    >
      {/* Chord name */}
      <div 
        className={cn(
          "text-center font-mono font-bold mb-1",
          isActive && "text-primary"
        )}
        style={{ fontSize: fontSize + 2 }}
      >
        {chord}
      </div>
      
      <svg width={width} height={height - 20} viewBox={`0 0 ${width} ${height - 20}`}>
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`fret-gradient-${chord}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground) / 0.3)" />
            <stop offset="100%" stopColor="hsl(var(--muted-foreground) / 0.1)" />
          </linearGradient>
          <filter id={`glow-${chord}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Fretboard background */}
        <rect
          x={startX - 4}
          y={startY - 2}
          width={stringSpacing * 5 + 8}
          height={fretSpacing * 4 + 4}
          rx={4}
          fill="url(#fret-gradient)"
          className="opacity-30"
        />

        {/* Nut (if at first position) */}
        {baseFret === 1 && (
          <rect
            x={startX - 2}
            y={startY - 4}
            width={stringSpacing * 5 + 4}
            height={5}
            rx={2}
            fill="currentColor"
            className="text-foreground"
          />
        )}

        {/* Base fret indicator */}
        {baseFret > 1 && (
          <text
            x={4}
            y={startY + fretSpacing / 2 + 4}
            fontSize={labelSize}
            className="fill-muted-foreground font-mono"
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
            strokeWidth={fret === 0 ? 2 : 1}
            className="text-muted-foreground/50"
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
            strokeWidth={1 + string * 0.15}
            className="text-muted-foreground/60"
          />
        ))}

        {/* Finger positions */}
        {fingering.map((fret, stringIndex) => {
          const x = startX + stringIndex * stringSpacing;
          const fingerNum = fingers?.[stringIndex] || 0;
          const fingerColor = showFingers ? FINGER_COLORS[fingerNum] || FINGER_COLORS[1] : 'hsl(var(--primary))';
          
          if (fret === -1) {
            return (
              <g key={`pos-${stringIndex}`}>
                <text
                  x={x}
                  y={startY - 8}
                  textAnchor="middle"
                  fontSize={labelSize}
                  className="fill-muted-foreground font-bold"
                >
                  ×
                </text>
              </g>
            );
          }
          
          if (fret === 0) {
            return (
              <circle
                key={`pos-${stringIndex}`}
                cx={x}
                cy={startY - 10}
                r={dotSize / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-foreground"
              />
            );
          }
          
          const displayFret = fret - baseFret + 1;
          const y = startY + (displayFret - 0.5) * fretSpacing;
          
          return (
            <g key={`pos-${stringIndex}`}>
              {/* Glow effect for active */}
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r={dotSize + 4}
                  fill="hsl(var(--primary) / 0.3)"
                  filter={`url(#glow-${chord})`}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r={dotSize}
                fill={fingerColor}
                {...(animated ? {
                  initial: { r: 0 },
                  animate: { r: dotSize },
                  transition: { delay: stringIndex * 0.05 }
                } : {})}
              />
              {/* Finger number */}
              {showFingers && fingerNum > 0 && (
                <text
                  x={x}
                  y={y + dotSize / 3}
                  textAnchor="middle"
                  fontSize={labelSize - 2}
                  fill="white"
                  fontWeight="bold"
                >
                  {fingerNum}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </MotionWrapper>
  );
}
