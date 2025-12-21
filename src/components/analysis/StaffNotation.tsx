/**
 * StaffNotation - Traditional sheet music notation view
 * Displays notes on a musical staff (treble/bass clef)
 */

import { memo, useMemo } from 'react';
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
  timeSignature?: { numerator: number; denominator: number };
  keySignature?: string;
  height?: number;
  className?: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Treble clef middle line is B4 (71), lines go E4, G4, B4, D5, F5
// Bass clef middle line is D3 (50), lines go G2, B2, D3, F3, A3
const TREBLE_MIDDLE_LINE = 71; // B4
const BASS_MIDDLE_LINE = 50; // D3

function getNotePosition(pitch: number, clef: 'treble' | 'bass'): number {
  // Returns position in half-steps from middle line
  const middleLine = clef === 'treble' ? TREBLE_MIDDLE_LINE : BASS_MIDDLE_LINE;
  
  // Calculate position on staff (0 = middle line, positive = up, negative = down)
  const noteWithinOctave = pitch % 12;
  const octave = Math.floor(pitch / 12);
  
  // Map note to position (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
  const notePositions = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const notePos = notePositions[noteWithinOctave] + (octave - 5) * 7;
  
  const middleNoteWithinOctave = middleLine % 12;
  const middleOctave = Math.floor(middleLine / 12);
  const middlePos = notePositions[middleNoteWithinOctave] + (middleOctave - 5) * 7;
  
  return notePos - middlePos;
}

function isSharp(pitch: number): boolean {
  const noteWithinOctave = pitch % 12;
  return [1, 3, 6, 8, 10].includes(noteWithinOctave);
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
  const { processedNotes, useBassClef, useTrebleClef } = useMemo(() => {
    if (notes.length === 0) return { processedNotes: [], useBassClef: false, useTrebleClef: true };
    
    const processed = notes.map(n => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.time ?? 0;
      return { 
        pitch, 
        startTime,
        duration: n.duration ?? 0.5,
        velocity: n.velocity ?? 100,
      };
    }).sort((a, b) => a.startTime - b.startTime);

    // Determine which clefs to use
    const avgPitch = processed.reduce((sum, n) => sum + n.pitch, 0) / processed.length;
    const needBass = avgPitch < 55 || processed.some(n => n.pitch < 48);
    const needTreble = avgPitch >= 55 || processed.some(n => n.pitch >= 60);
    
    return { 
      processedNotes: processed, 
      useBassClef: needBass && !needTreble, 
      useTrebleClef: !needBass || needTreble,
    };
  }, [notes]);

  // Calculate measures
  const beatsPerMeasure = timeSignature.numerator;
  const secondsPerBeat = 60 / bpm;
  const secondsPerMeasure = beatsPerMeasure * secondsPerBeat;
  const totalMeasures = Math.ceil(duration / secondsPerMeasure);
  
  const measuresPerRow = 4;
  const totalRows = Math.ceil(totalMeasures / measuresPerRow);
  
  const staffHeight = 60;
  const lineSpacing = 10;
  const clef = useTrebleClef ? 'treble' : 'bass';

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

  return (
    <div 
      className={cn("bg-white dark:bg-slate-950 rounded-lg overflow-auto", className)}
      style={{ height }}
    >
      <svg 
        viewBox={`0 0 800 ${Math.max(200, totalRows * (staffHeight + 60) + 60)}`}
        className="w-full min-w-[600px]"
        style={{ background: 'transparent' }}
      >
        {/* Title area */}
        <g transform="translate(400, 25)">
          {keySignature && (
            <text 
              x="0" 
              y="0" 
              textAnchor="middle" 
              className="fill-muted-foreground text-xs"
              fontSize="12"
            >
              {keySignature} · {bpm} BPM · {timeSignature.numerator}/{timeSignature.denominator}
            </text>
          )}
        </g>

        {/* Staff rows */}
        {Array.from({ length: totalRows }).map((_, rowIndex) => {
          const rowY = 60 + rowIndex * (staffHeight + 60);
          const startMeasure = rowIndex * measuresPerRow;
          const endMeasure = Math.min(startMeasure + measuresPerRow, totalMeasures);
          const measureWidth = 180;
          
          return (
            <g key={rowIndex} transform={`translate(40, ${rowY})`}>
              {/* Clef */}
              <text 
                x="5" 
                y={staffHeight / 2 + 12} 
                fontSize="48"
                className="fill-foreground"
              >
                {useTrebleClef ? '𝄞' : '𝄢'}
              </text>

              {/* Staff lines */}
              {[0, 1, 2, 3, 4].map(lineIndex => (
                <line
                  key={lineIndex}
                  x1="0"
                  y1={lineIndex * lineSpacing + 10}
                  x2={(endMeasure - startMeasure) * measureWidth + 50}
                  y2={lineIndex * lineSpacing + 10}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-foreground/40"
                />
              ))}

              {/* Measure bar lines */}
              {Array.from({ length: endMeasure - startMeasure + 1 }).map((_, i) => (
                <line
                  key={i}
                  x1={50 + i * measureWidth}
                  y1={10}
                  x2={50 + i * measureWidth}
                  y2={10 + 4 * lineSpacing}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-foreground/40"
                />
              ))}

              {/* Notes in this row */}
              {processedNotes
                .filter(note => {
                  const measure = Math.floor(note.startTime / secondsPerMeasure);
                  return measure >= startMeasure && measure < endMeasure;
                })
                .map((note, noteIndex) => {
                  const measure = Math.floor(note.startTime / secondsPerMeasure);
                  const beatInMeasure = (note.startTime % secondsPerMeasure) / secondsPerBeat;
                  
                  const measureX = 50 + (measure - startMeasure) * measureWidth;
                  const noteX = measureX + 20 + (beatInMeasure / beatsPerMeasure) * (measureWidth - 40);
                  
                  // Calculate Y position based on pitch
                  const position = getNotePosition(note.pitch, clef);
                  const middleLineY = 10 + 2 * lineSpacing; // Third line from top
                  const noteY = middleLineY - position * (lineSpacing / 2);
                  
                  const isSharpNote = isSharp(note.pitch);
                  const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
                  
                  // Determine note type based on duration
                  const beatDuration = note.duration / secondsPerBeat;
                  const isWhole = beatDuration >= 3.5;
                  const isHalf = beatDuration >= 1.5 && beatDuration < 3.5;
                  const isFilled = beatDuration < 1.5;
                  
                  return (
                    <g key={noteIndex} transform={`translate(${noteX}, ${noteY})`}>
                      {/* Sharp symbol if needed */}
                      {isSharpNote && (
                        <text 
                          x="-12" 
                          y="4" 
                          fontSize="14"
                          className="fill-foreground"
                        >
                          ♯
                        </text>
                      )}
                      
                      {/* Ledger lines if outside staff */}
                      {noteY < 10 && Array.from({ length: Math.ceil((10 - noteY) / lineSpacing) }).map((_, i) => (
                        <line
                          key={`ledger-up-${i}`}
                          x1="-8"
                          y1={-noteY + 10 - i * lineSpacing}
                          x2="8"
                          y2={-noteY + 10 - i * lineSpacing}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-foreground/60"
                        />
                      ))}
                      {noteY > 50 && Array.from({ length: Math.ceil((noteY - 50) / lineSpacing) }).map((_, i) => (
                        <line
                          key={`ledger-down-${i}`}
                          x1="-8"
                          y1={-noteY + 50 + (i + 1) * lineSpacing}
                          x2="8"
                          y2={-noteY + 50 + (i + 1) * lineSpacing}
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
                          isFilled ? "fill-foreground" : "fill-none stroke-foreground stroke-[1.5]"
                        )}
                        transform="rotate(-15)"
                      />
                      
                      {/* Stem (not for whole notes) */}
                      {!isWhole && (
                        <line
                          x1="5"
                          y1="0"
                          x2="5"
                          y2={position < 0 ? 25 : -25}
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-foreground"
                        />
                      )}
                      
                      {/* Note name tooltip */}
                      <title>{noteName}</title>
                    </g>
                  );
                })}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default StaffNotation;
