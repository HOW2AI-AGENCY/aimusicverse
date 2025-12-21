/**
 * StaffNotation - Traditional sheet music notation view
 * Displays notes on a musical staff following proper music notation rules:
 * - Correct note positioning on staff lines/spaces
 * - Proper stem direction (up for notes below middle line, down for above)
 * - Ledger lines for notes outside the staff
 * - Key signatures with sharps/flats at clef
 * - Time signatures
 * - Measure bar lines
 * - Note duration representation (whole, half, quarter, eighth, sixteenth)
 * - Responsive line breaks based on container width
 */

import { memo, useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  endTime?: number;
  duration?: number;
  velocity?: number;
  noteName?: string;
}

interface StaffNotationProps {
  notes: NoteInput[];
  duration: number;
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number } | null;
  keySignature?: string | null;
  height?: number;
  className?: string;
}

// Constants for music notation
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Staff line positions (0 = bottom line E4 for treble, G2 for bass)
const TREBLE_BOTTOM_LINE_PITCH = 64; // E4
const BASS_BOTTOM_LINE_PITCH = 43; // G2

// Key signature to number of sharps/flats
const KEY_SIGNATURES: Record<string, { sharps: number; flats: number }> = {
  'C': { sharps: 0, flats: 0 }, 'Am': { sharps: 0, flats: 0 },
  'G': { sharps: 1, flats: 0 }, 'Em': { sharps: 1, flats: 0 },
  'D': { sharps: 2, flats: 0 }, 'Bm': { sharps: 2, flats: 0 },
  'A': { sharps: 3, flats: 0 }, 'F#m': { sharps: 3, flats: 0 },
  'E': { sharps: 4, flats: 0 }, 'C#m': { sharps: 4, flats: 0 },
  'B': { sharps: 5, flats: 0 }, 'G#m': { sharps: 5, flats: 0 },
  'F#': { sharps: 6, flats: 0 }, 'D#m': { sharps: 6, flats: 0 },
  'C#': { sharps: 7, flats: 0 }, 'A#m': { sharps: 7, flats: 0 },
  'F': { sharps: 0, flats: 1 }, 'Dm': { sharps: 0, flats: 1 },
  'Bb': { sharps: 0, flats: 2 }, 'Gm': { sharps: 0, flats: 2 },
  'Eb': { sharps: 0, flats: 3 }, 'Cm': { sharps: 0, flats: 3 },
  'Ab': { sharps: 0, flats: 4 }, 'Fm': { sharps: 0, flats: 4 },
  'Db': { sharps: 0, flats: 5 }, 'Bbm': { sharps: 0, flats: 5 },
  'Gb': { sharps: 0, flats: 6 }, 'Ebm': { sharps: 0, flats: 6 },
  'Cb': { sharps: 0, flats: 7 }, 'Abm': { sharps: 0, flats: 7 },
};

// Sharp/flat positions on treble clef staff
const SHARP_POSITIONS_TREBLE = [8, 5, 9, 6, 3, 7, 4];
const FLAT_POSITIONS_TREBLE = [4, 7, 3, 6, 2, 5, 1];

// Get staff position for a pitch (0 = bottom line, each step = line or space)
function getStaffPosition(pitch: number, clef: 'treble' | 'bass'): number {
  const basePitch = clef === 'treble' ? TREBLE_BOTTOM_LINE_PITCH : BASS_BOTTOM_LINE_PITCH;
  const noteInOctave = pitch % 12;
  const octave = Math.floor(pitch / 12);
  
  const baseNoteInOctave = basePitch % 12;
  const baseOctave = Math.floor(basePitch / 12);
  
  const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  
  const noteDiatonic = chromaticToDiatonic[noteInOctave] + (octave * 7);
  const baseDiatonic = chromaticToDiatonic[baseNoteInOctave] + (baseOctave * 7);
  
  return noteDiatonic - baseDiatonic;
}

// Check if pitch is sharp/flat
function isAccidental(pitch: number): 'sharp' | 'flat' | null {
  const noteInOctave = pitch % 12;
  if ([1, 3, 6, 8, 10].includes(noteInOctave)) {
    return 'sharp';
  }
  return null;
}

// Determine note type based on beat duration
function getNoteType(beatDuration: number): 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' {
  if (beatDuration >= 3.5) return 'whole';
  if (beatDuration >= 1.5) return 'half';
  if (beatDuration >= 0.75) return 'quarter';
  if (beatDuration >= 0.375) return 'eighth';
  return 'sixteenth';
}

// Check if stem should go up (notes below middle line)
function shouldStemUp(position: number): boolean {
  return position < 4;
}

interface ProcessedNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
  position: number;
  accidental: 'sharp' | 'flat' | null;
  noteType: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
  stemUp: boolean;
  measure: number;
  beatInMeasure: number;
}

export const StaffNotation = memo(function StaffNotation({
  notes,
  duration,
  bpm = 120,
  timeSignature = { numerator: 4, denominator: 4 },
  keySignature,
  height = 200,
  className,
}: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  
  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  const ts = timeSignature ?? { numerator: 4, denominator: 4 };
  
  const { processedNotes, clef, keyInfo } = useMemo(() => {
    if (notes.length === 0) {
      return { 
        processedNotes: [] as ProcessedNote[], 
        clef: 'treble' as const,
        keyInfo: { sharps: 0, flats: 0 }
      };
    }
    
    const secondsPerBeat = 60 / bpm;
    const secondsPerMeasure = ts.numerator * secondsPerBeat;
    
    const avgPitch = notes.reduce((sum, n) => sum + (n.pitch ?? n.midi ?? 60), 0) / notes.length;
    const useClef: 'treble' | 'bass' = avgPitch < 55 ? 'bass' : 'treble';
    
    const processed: ProcessedNote[] = notes.map(n => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.time ?? 0;
      const noteDuration = n.duration ?? 0.5;
      const beatDuration = noteDuration / secondsPerBeat;
      const position = getStaffPosition(pitch, useClef);
      
      return {
        pitch,
        startTime,
        duration: noteDuration,
        velocity: n.velocity ?? 100,
        position,
        accidental: isAccidental(pitch),
        noteType: getNoteType(beatDuration),
        stemUp: shouldStemUp(position),
        measure: Math.floor(startTime / secondsPerMeasure),
        beatInMeasure: (startTime % secondsPerMeasure) / secondsPerBeat,
      };
    }).sort((a, b) => a.startTime - b.startTime);
    
    const keyStr = keySignature?.replace(/m$/, 'm') || 'C';
    const ki = KEY_SIGNATURES[keyStr] || { sharps: 0, flats: 0 };
    
    return { processedNotes: processed, clef: useClef, keyInfo: ki };
  }, [notes, bpm, ts, keySignature]);

  // Layout constants
  const lineSpacing = 8;
  const staffHeight = lineSpacing * 4;
  const rowHeight = staffHeight + 70;
  const clefWidth = 32;
  const keySignatureWidth = (keyInfo.sharps + keyInfo.flats) * 9;
  const timeSignatureWidth = 22;
  const marginLeft = 10;
  const marginRight = 10;
  const minMeasureWidth = 80;
  const maxMeasureWidth = 160;
  
  // Calculate measures per row based on container width
  const availableWidth = containerWidth - marginLeft - marginRight - clefWidth - keySignatureWidth - timeSignatureWidth;
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = ts.numerator * secondsPerBeat;
  const totalMeasures = Math.max(1, Math.ceil(duration / secondsPerMeasure));
  
  // Calculate optimal measures per row
  const measuresPerRow = Math.max(1, Math.min(
    totalMeasures,
    Math.floor(availableWidth / minMeasureWidth)
  ));
  const measureWidth = Math.min(maxMeasureWidth, Math.max(minMeasureWidth, availableWidth / measuresPerRow));
  
  const totalRows = Math.ceil(totalMeasures / measuresPerRow);
  const svgHeight = Math.max(height, totalRows * rowHeight + 40);

  if (notes.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-2",
          className
        )}
        style={{ height }}
      >
        <span className="text-4xl opacity-30">𝄞</span>
        <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
      </div>
    );
  }

  // Render key signature symbols
  const renderKeySignature = (startX: number) => {
    const symbols: ReactNode[] = [];
    
    if (keyInfo.sharps > 0) {
      for (let i = 0; i < keyInfo.sharps; i++) {
        const pos = SHARP_POSITIONS_TREBLE[i];
        const y = staffHeight - (pos * lineSpacing / 2);
        symbols.push(
          <text
            key={`sharp-${i}`}
            x={startX + i * 8}
            y={y + 4}
            fontSize="12"
            className="fill-foreground"
          >
            ♯
          </text>
        );
      }
    } else if (keyInfo.flats > 0) {
      for (let i = 0; i < keyInfo.flats; i++) {
        const pos = FLAT_POSITIONS_TREBLE[i];
        const y = staffHeight - (pos * lineSpacing / 2);
        symbols.push(
          <text
            key={`flat-${i}`}
            x={startX + i * 8}
            y={y + 4}
            fontSize="12"
            className="fill-foreground"
          >
            ♭
          </text>
        );
      }
    }
    
    return symbols;
  };

  // Render a single note
  const renderNote = (note: ProcessedNote, x: number) => {
    // Clamp position to reasonable range to prevent rendering issues
    const clampedPosition = Math.max(-8, Math.min(16, note.position));
    const y = staffHeight - (clampedPosition * lineSpacing / 2);
    const isFilled = note.noteType === 'quarter' || note.noteType === 'eighth' || note.noteType === 'sixteenth';
    const hasFlag = note.noteType === 'eighth' || note.noteType === 'sixteenth';
    const stemLength = 24;
    const stemDirection = note.stemUp ? -1 : 1;
    const stemX = note.stemUp ? 4 : -4;
    
    const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
    
    // Calculate ledger lines - lines are at even positions (0, 2, 4, 6, 8 are staff lines)
    // Below staff: position -2, -4, -6... (also position 0 for middle C in treble)
    // Above staff: position 10, 12, 14...
    const ledgerLines: number[] = [];
    
    // Ledger lines below staff (position < 0)
    // Middle C (position -1 for treble) needs line at position 0
    if (clampedPosition <= 0) {
      for (let pos = 0; pos >= clampedPosition - 1; pos -= 2) {
        if (pos <= 0) {
          ledgerLines.push(pos);
        }
      }
    }
    
    // Ledger lines above staff (position > 8)
    if (clampedPosition >= 9) {
      for (let pos = 10; pos <= clampedPosition + 1; pos += 2) {
        ledgerLines.push(pos);
      }
    }
    
    return (
      <g key={`note-${note.startTime}-${note.pitch}`} transform={`translate(${x}, 0)`}>
        {/* Accidental */}
        {note.accidental === 'sharp' && (
          <text x="-12" y={y + 4} fontSize="11" className="fill-foreground">♯</text>
        )}
        {note.accidental === 'flat' && (
          <text x="-12" y={y + 4} fontSize="11" className="fill-foreground">♭</text>
        )}
        
        {/* Ledger lines */}
        {ledgerLines.map((linePos) => {
          const lineY = staffHeight - (linePos * lineSpacing / 2);
          return (
            <line
              key={`ledger-${linePos}`}
              x1="-7"
              y1={lineY}
              x2="7"
              y2={lineY}
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground/60"
            />
          );
        })}
        
        {/* Note head */}
        <ellipse
          cx="0"
          cy={y}
          rx="4.5"
          ry="3.5"
          className={cn(
            isFilled ? "fill-foreground" : "fill-background stroke-foreground stroke-[1.5]"
          )}
          transform={`rotate(-15, 0, ${y})`}
        />
        
        {/* Stem (not for whole notes) */}
        {note.noteType !== 'whole' && (
          <line
            x1={stemX}
            y1={y}
            x2={stemX}
            y2={y + stemDirection * stemLength}
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-foreground"
          />
        )}
        
        {/* Flag for eighth notes */}
        {hasFlag && (
          <path
            d={note.stemUp 
              ? `M ${stemX} ${y + stemDirection * stemLength} q 6 4 5 12 q -2 -6 -5 -8`
              : `M ${stemX} ${y + stemDirection * stemLength} q 6 -4 5 -12 q -2 6 -5 8`
            }
            className="fill-foreground"
          />
        )}
        
        {/* Double flag for sixteenth notes */}
        {note.noteType === 'sixteenth' && (
          <path
            d={note.stemUp 
              ? `M ${stemX} ${y + stemDirection * stemLength + 6} q 6 4 5 12 q -2 -6 -5 -8`
              : `M ${stemX} ${y + stemDirection * stemLength - 6} q 6 -4 5 -12 q -2 6 -5 8`
            }
            className="fill-foreground"
          />
        )}
        
        <title>{noteName}</title>
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={cn("bg-white dark:bg-slate-950 rounded-lg overflow-auto", className)}
      style={{ height }}
    >
      <svg 
        width={containerWidth}
        height={svgHeight}
        viewBox={`0 0 ${containerWidth} ${svgHeight}`}
        style={{ background: 'transparent' }}
      >
        {/* Title area */}
        <g transform={`translate(${containerWidth / 2}, 18)`}>
          <text 
            x="0" 
            y="0" 
            textAnchor="middle" 
            className="fill-muted-foreground"
            fontSize="10"
          >
            {keySignature || 'C'} · {bpm} BPM · {ts.numerator}/{ts.denominator}
          </text>
        </g>

        {/* Staff rows */}
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const rowY = 35 + rowIndex * rowHeight;
          const startMeasure = rowIndex * measuresPerRow;
          const endMeasure = Math.min(startMeasure + measuresPerRow, totalMeasures);
          const numMeasuresInRow = endMeasure - startMeasure;
          
          const staffStartX = marginLeft;
          const notesAreaStart = staffStartX + clefWidth + keySignatureWidth + (rowIndex === 0 ? timeSignatureWidth : 0);
          const staffWidth = notesAreaStart + numMeasuresInRow * measureWidth;
          
          return (
            <g key={rowIndex} transform={`translate(0, ${rowY})`}>
              {/* Staff lines (5 lines) */}
              {[0, 1, 2, 3, 4].map(lineIndex => (
                <line
                  key={lineIndex}
                  x1={staffStartX}
                  y1={lineIndex * lineSpacing}
                  x2={staffWidth}
                  y2={lineIndex * lineSpacing}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-foreground/40"
                />
              ))}
              
              {/* Clef */}
              <text 
                x={staffStartX + 3}
                y={clef === 'treble' ? staffHeight - 3 : staffHeight / 2 + 8}
                fontSize={clef === 'treble' ? '36' : '28'}
                className="fill-foreground"
              >
                {clef === 'treble' ? '𝄞' : '𝄢'}
              </text>
              
              {/* Key signature */}
              {renderKeySignature(staffStartX + clefWidth)}
              
              {/* Time signature (only on first row) */}
              {rowIndex === 0 && (
                <g transform={`translate(${staffStartX + clefWidth + keySignatureWidth + 3}, 0)`}>
                  <text 
                    x="0" 
                    y={lineSpacing * 1.5} 
                    fontSize="14" 
                    fontWeight="bold"
                    className="fill-foreground"
                  >
                    {ts.numerator}
                  </text>
                  <text 
                    x="0" 
                    y={lineSpacing * 3.5} 
                    fontSize="14" 
                    fontWeight="bold"
                    className="fill-foreground"
                  >
                    {ts.denominator}
                  </text>
                </g>
              )}
              
              {/* Measure bar lines */}
              {Array.from({ length: numMeasuresInRow + 1 }).map((_, i) => (
                <line
                  key={i}
                  x1={notesAreaStart + i * measureWidth}
                  y1={0}
                  x2={notesAreaStart + i * measureWidth}
                  y2={staffHeight}
                  stroke="currentColor"
                  strokeWidth={i === numMeasuresInRow && rowIndex === totalRows - 1 ? 2 : 1}
                  className="text-foreground/50"
                />
              ))}
              
              {/* Notes in this row */}
              {processedNotes
                .filter(note => note.measure >= startMeasure && note.measure < endMeasure)
                .map(note => {
                  const measureOffset = note.measure - startMeasure;
                  const measureX = notesAreaStart + measureOffset * measureWidth;
                  const beatProgress = note.beatInMeasure / ts.numerator;
                  const noteX = measureX + 12 + beatProgress * (measureWidth - 24);
                  
                  return renderNote(note, noteX);
                })}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default StaffNotation;
