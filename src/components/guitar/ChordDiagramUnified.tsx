/**
 * Unified ChordDiagram Component
 * Combines functionality from ChordDiagram and ChordDiagramEnhanced
 * Responsive, with optional finger colors, animations, and touch support
 */

import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import {
  getChordFingering,
  FINGER_COLORS,
  STRING_NAMES,
  type ChordFingering,
} from '@/lib/chord-data';

interface ChordDiagramUnifiedProps {
  chord: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFingers?: boolean;
  showStringNames?: boolean;
  animated?: boolean;
  isActive?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const SIZE_CONFIG = {
  sm: { width: 50, height: 60, fontSize: 8, dotSize: 4, spacing: 8 },
  md: { width: 70, height: 80, fontSize: 10, dotSize: 6, spacing: 11 },
  lg: { width: 100, height: 110, fontSize: 12, dotSize: 8, spacing: 16 },
  xl: { width: 130, height: 145, fontSize: 14, dotSize: 10, spacing: 21 },
};

export function ChordDiagramUnified({
  chord,
  className,
  size = 'md',
  showFingers = false,
  showStringNames = false,
  animated = false,
  isActive = false,
  interactive = false,
  onClick,
}: ChordDiagramUnifiedProps) {
  const fingering = getChordFingering(chord);
  const config = SIZE_CONFIG[size];

  if (!fingering) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-2',
          interactive && 'cursor-pointer hover:bg-muted/40 transition-colors',
          className
        )}
        style={{ width: config.width, height: config.height }}
        onClick={onClick}
      >
        <span className="text-xs font-semibold text-muted-foreground mb-1">{chord}</span>
        <span className="text-[8px] text-muted-foreground/70">N/A</span>
      </div>
    );
  }

  const { frets, fingers = [], barres = [] } = fingering;
  const maxFret = Math.max(...frets.filter(f => f > 0));
  const minFret = Math.min(...frets.filter(f => f > 0));
  const numFrets = 4;
  const startFret = minFret > 3 ? minFret : 1;

  const Component = animated ? motion.div : 'div';
  const componentProps = animated
    ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        whileTap: interactive ? { scale: 0.95 } : undefined,
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={cn(
        'flex flex-col items-center gap-1 select-none',
        interactive && 'cursor-pointer touch-manipulation',
        isActive && 'ring-2 ring-primary ring-offset-2 rounded-lg',
        className
      )}
      onClick={onClick}
      {...componentProps}
    >
      {/* Chord Name */}
      <div className={cn('font-bold text-center', isActive && 'text-primary')} style={{ fontSize: config.fontSize + 2 }}>
        {chord}
      </div>

      {/* Fretboard */}
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {/* String names (optional) */}
        {showStringNames && (
          <g>
            {STRING_NAMES.map((name, i) => (
              <text
                key={i}
                x={i * config.spacing + 5}
                y={config.height - 2}
                fontSize={config.fontSize - 2}
                fill="currentColor"
                className="text-muted-foreground"
                textAnchor="middle"
              >
                {name}
              </text>
            ))}
          </g>
        )}

        {/* Fret position indicator */}
        {startFret > 1 && (
          <text
            x={-8}
            y={20}
            fontSize={config.fontSize}
            fill="currentColor"
            className="text-muted-foreground"
          >
            {startFret}fr
          </text>
        )}

        {/* Strings (vertical lines) */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`string-${i}`}
            x1={i * config.spacing + 5}
            y1={5}
            x2={i * config.spacing + 5}
            y2={config.height - (showStringNames ? 15 : 5)}
            stroke="currentColor"
            strokeWidth={1}
            className="text-foreground/60"
          />
        ))}

        {/* Frets (horizontal lines) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`fret-${i}`}
            x1={5}
            y1={i * (config.height - (showStringNames ? 20 : 10)) / numFrets + 5}
            x2={5 * config.spacing + 5}
            y2={i * (config.height - (showStringNames ? 20 : 10)) / numFrets + 5}
            stroke="currentColor"
            strokeWidth={i === 0 && startFret === 1 ? 3 : 1}
            className="text-foreground/60"
          />
        ))}

        {/* Barre indicators */}
        {barres.map((barreFret, idx) => {
          const adjustedFret = barreFret - startFret + 1;
          if (adjustedFret < 0 || adjustedFret > numFrets) return null;

          const y = adjustedFret * (config.height - (showStringNames ? 20 : 10)) / numFrets;
          const firstString = frets.findIndex(f => f === barreFret);
          const lastString = frets.lastIndexOf(barreFret);

          if (firstString === -1 || lastString === -1 || firstString === lastString) return null;

          return (
            <line
              key={`barre-${idx}`}
              x1={firstString * config.spacing + 5}
              y1={y}
              x2={lastString * config.spacing + 5}
              y2={y}
              stroke={showFingers && fingers[firstString] ? FINGER_COLORS[fingers[firstString]] : 'currentColor'}
              strokeWidth={config.dotSize}
              strokeLinecap="round"
              className={!showFingers || !fingers[firstString] ? 'text-primary' : ''}
            />
          );
        })}

        {/* Finger positions */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) {
            // Muted string - X
            return (
              <g key={`muted-${stringIndex}`}>
                <line
                  x1={stringIndex * config.spacing + 2}
                  y1={-2}
                  x2={stringIndex * config.spacing + 8}
                  y2={4}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground"
                />
                <line
                  x1={stringIndex * config.spacing + 8}
                  y1={-2}
                  x2={stringIndex * config.spacing + 2}
                  y2={4}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground"
                />
              </g>
            );
          }

          if (fret === 0) {
            // Open string - O
            return (
              <circle
                key={`open-${stringIndex}`}
                cx={stringIndex * config.spacing + 5}
                cy={1}
                r={config.dotSize / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-muted-foreground"
              />
            );
          }

          // Finger on fret
          const adjustedFret = fret - startFret + 1;
          if (adjustedFret < 0 || adjustedFret > numFrets) return null;

          const y = adjustedFret * (config.height - (showStringNames ? 20 : 10)) / numFrets;
          const fingerNumber = fingers[stringIndex];
          const isBarreString = barres.some(b => b === fret);

          // Skip if it's part of a barre (already drawn)
          if (isBarreString && barres.includes(fret)) {
            const firstBarreString = frets.findIndex(f => f === fret);
            if (stringIndex !== firstBarreString && stringIndex !== frets.lastIndexOf(fret)) {
              return null;
            }
          }

          return (
            <g key={`finger-${stringIndex}`}>
              <circle
                cx={stringIndex * config.spacing + 5}
                cy={y}
                r={config.dotSize}
                fill={showFingers && fingerNumber ? FINGER_COLORS[fingerNumber] : 'currentColor'}
                className={!showFingers || !fingerNumber ? 'text-primary' : ''}
              />
              {showFingers && fingerNumber > 0 && (
                <text
                  x={stringIndex * config.spacing + 5}
                  y={y + 1}
                  fontSize={config.fontSize - 2}
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-bold"
                >
                  {fingerNumber}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Technique hint (optional) */}
      {showFingers && fingering.barres && fingering.barres.length > 0 && (
        <span className="text-[8px] text-muted-foreground">barre</span>
      )}
    </Component>
  );
}

// Export with backward compatibility
export { ChordDiagramUnified as ChordDiagram };
