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
 * - Beam grouping for eighth and sixteenth notes
 */

import { memo, useMemo, type ReactNode } from 'react';
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
// Each step is a half-space (line or space)
const TREBLE_BOTTOM_LINE_PITCH = 64; // E4
const BASS_BOTTOM_LINE_PITCH = 43; // G2

// Key signature sharps/flats order
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

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

// Sharp positions on treble clef (line/space from bottom, 0-indexed)
const SHARP_POSITIONS_TREBLE = [8, 5, 9, 6, 3, 7, 4]; // F5, C5, G5, D5, A4, E5, B4
const FLAT_POSITIONS_TREBLE = [4, 7, 3, 6, 2, 5, 1];  // Bb4, Eb5, Ab4, Db5, Gb4, Cb5, Fb4

// Get staff position for a pitch (0 = bottom line, each step = line or space)
function getStaffPosition(pitch: number, clef: 'treble' | 'bass'): number {
  const basePitch = clef === 'treble' ? TREBLE_BOTTOM_LINE_PITCH : BASS_BOTTOM_LINE_PITCH;
  const noteInOctave = pitch % 12;
  const octave = Math.floor(pitch / 12);
  
  const baseNoteInOctave = basePitch % 12;
  const baseOctave = Math.floor(basePitch / 12);
  
  // Map chromatic pitch to diatonic position (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  
  const noteDiatonic = chromaticToDiatonic[noteInOctave] + (octave * 7);
  const baseDiatonic = chromaticToDiatonic[baseNoteInOctave] + (baseOctave * 7);
  
  return noteDiatonic - baseDiatonic;
}

// Check if pitch is sharp/flat (black key)
function isAccidental(pitch: number): 'sharp' | 'flat' | null {
  const noteInOctave = pitch % 12;
  // Black keys: C#, D#, F#, G#, A#
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

// Check if stem should go up (notes below middle line B4 for treble)
function shouldStemUp(position: number): boolean {
  // Middle line is at position 4 (B4 for treble clef)
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
    
    // Determine clef based on average pitch
    const avgPitch = notes.reduce((sum, n) => sum + (n.pitch ?? n.midi ?? 60), 0) / notes.length;
    const useClef: 'treble' | 'bass' = avgPitch < 55 ? 'bass' : 'treble';
    
    // Process notes
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
    
    // Get key signature info
    const keyStr = keySignature?.replace(/m$/, 'm') || 'C';
    const ki = KEY_SIGNATURES[keyStr] || { sharps: 0, flats: 0 };
    
    return { processedNotes: processed, clef: useClef, keyInfo: ki };
  }, [notes, bpm, ts, keySignature]);

  // Layout constants
  const lineSpacing = 8; // pixels between staff lines
  const staffHeight = lineSpacing * 4; // 5 lines = 4 spaces
  const rowHeight = staffHeight + 80; // Extra space for ledger lines and row gap
  const measureWidth = 160;
  const measuresPerRow = 4;
  const clefWidth = 35;
  const keySignatureWidth = keyInfo.sharps * 10 + keyInfo.flats * 10;
  const timeSignatureWidth = 25;
  const marginLeft = 15;
  
  // Calculate total measures and rows
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = ts.numerator * secondsPerBeat;
  const totalMeasures = Math.max(1, Math.ceil(duration / secondsPerMeasure));
  const totalRows = Math.ceil(totalMeasures / measuresPerRow);
  
  const svgWidth = 800;
  const svgHeight = Math.max(200, totalRows * rowHeight + 60);

  if (notes.length === 0) {
    return (
      <div 
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
  const renderKeySignature = (startX: number, rowIndex: number) => {
    const symbols: ReactNode[] = [];
    
    if (keyInfo.sharps > 0) {
      for (let i = 0; i < keyInfo.sharps; i++) {
        const pos = SHARP_POSITIONS_TREBLE[i];
        const y = staffHeight - (pos * lineSpacing / 2);
        symbols.push(
          <text
            key={`sharp-${i}`}
            x={startX + i * 9}
            y={y + 4}
            fontSize="14"
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
            x={startX + i * 9}
            y={y + 4}
            fontSize="14"
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
    const y = staffHeight - (note.position * lineSpacing / 2);
    const isFilled = note.noteType === 'quarter' || note.noteType === 'eighth' || note.noteType === 'sixteenth';
    const hasFlag = note.noteType === 'eighth' || note.noteType === 'sixteenth';
    const stemLength = 28;
    const stemDirection = note.stemUp ? -1 : 1;
    const stemX = note.stemUp ? 5 : -5;
    
    const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
    
    return (
      <g key={`note-${note.startTime}-${note.pitch}`} transform={`translate(${x}, ${y})`}>
        {/* Accidental */}
        {note.accidental === 'sharp' && (
          <text x="-14" y="4" fontSize="12" className="fill-foreground">♯</text>
        )}
        {note.accidental === 'flat' && (
          <text x="-14" y="4" fontSize="12" className="fill-foreground">♭</text>
        )}
        
        {/* Ledger lines */}
        {note.position < 0 && Array.from({ length: Math.ceil(-note.position / 2) }).map((_, i) => (
          <line
            key={`ledger-below-${i}`}
            x1="-8"
            y1={(i + 1) * lineSpacing}
            x2="8"
            y2={(i + 1) * lineSpacing}
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground/60"
          />
        ))}
        {note.position > 8 && Array.from({ length: Math.ceil((note.position - 8) / 2) }).map((_, i) => (
          <line
            key={`ledger-above-${i}`}
            x1="-8"
            y1={-(i + 1) * lineSpacing + staffHeight - 8 * lineSpacing / 2}
            x2="8"
            y2={-(i + 1) * lineSpacing + staffHeight - 8 * lineSpacing / 2}
            stroke="currentColor"
            strokeWidth="1"
            className="text-foreground/60"
          />
        ))}
        
        {/* Note head */}
        <ellipse
          cx="0"
          cy="0"
          rx="5"
          ry="4"
          className={cn(
            isFilled ? "fill-foreground" : "fill-background stroke-foreground stroke-[1.5]"
          )}
          transform="rotate(-15)"
        />
        
        {/* Stem (not for whole notes) */}
        {note.noteType !== 'whole' && (
          <line
            x1={stemX}
            y1="0"
            x2={stemX}
            y2={stemDirection * stemLength}
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground"
          />
        )}
        
        {/* Flag for eighth/sixteenth notes */}
        {hasFlag && (
          <path
            d={note.stemUp 
              ? `M ${stemX} ${stemDirection * stemLength} q 8 5 6 15 q -2 -8 -6 -10`
              : `M ${stemX} ${stemDirection * stemLength} q 8 -5 6 -15 q -2 8 -6 10`
            }
            className="fill-foreground"
          />
        )}
        
        {/* Double flag for sixteenth notes */}
        {note.noteType === 'sixteenth' && (
          <path
            d={note.stemUp 
              ? `M ${stemX} ${stemDirection * stemLength + 8} q 8 5 6 15 q -2 -8 -6 -10`
              : `M ${stemX} ${stemDirection * stemLength - 8} q 8 -5 6 -15 q -2 8 -6 10`
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
      className={cn("bg-white dark:bg-slate-950 rounded-lg overflow-auto", className)}
      style={{ height }}
    >
      <svg 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full min-w-[600px]"
        style={{ background: 'transparent' }}
      >
        {/* Title area */}
        <g transform={`translate(${svgWidth / 2}, 20)`}>
          <text 
            x="0" 
            y="0" 
            textAnchor="middle" 
            className="fill-muted-foreground"
            fontSize="11"
          >
            {keySignature || 'C'} · {bpm} BPM · {ts.numerator}/{ts.denominator}
          </text>
        </g>

        {/* Staff rows */}
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const rowY = 45 + rowIndex * rowHeight;
          const startMeasure = rowIndex * measuresPerRow;
          const endMeasure = Math.min(startMeasure + measuresPerRow, totalMeasures);
          const numMeasuresInRow = endMeasure - startMeasure;
          
          // Calculate staff width
          const staffStartX = marginLeft;
          const notesAreaStart = staffStartX + clefWidth + keySignatureWidth + timeSignatureWidth;
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
                x={staffStartX + 5}
                y={clef === 'treble' ? staffHeight - 5 : staffHeight / 2 + 10}
                fontSize={clef === 'treble' ? '42' : '32'}
                className="fill-foreground"
              >
                {clef === 'treble' ? '𝄞' : '𝄢'}
              </text>
              
              {/* Key signature */}
              {renderKeySignature(staffStartX + clefWidth, rowIndex)}
              
              {/* Time signature (only on first row) */}
              {rowIndex === 0 && (
                <g transform={`translate(${staffStartX + clefWidth + keySignatureWidth + 5}, 0)`}>
                  <text 
                    x="0" 
                    y={lineSpacing * 1.5} 
                    fontSize="16" 
                    fontWeight="bold"
                    className="fill-foreground"
                  >
                    {ts.numerator}
                  </text>
                  <text 
                    x="0" 
                    y={lineSpacing * 3.5} 
                    fontSize="16" 
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
                  strokeWidth={i === numMeasuresInRow ? 2 : 1}
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
                  const noteX = measureX + 15 + beatProgress * (measureWidth - 30);
                  
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
