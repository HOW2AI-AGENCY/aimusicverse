import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Music } from 'lucide-react';

interface MidiNote {
  pitch: number;
  time: number;
  duration: number;
  velocity?: number;
  midi?: number;
}

interface GuitarTabVisualizationProps {
  notes: Array<{ pitch?: number; midi?: number; time?: number; duration?: number; velocity?: number }>;
  bpm?: number;
  className?: string;
  onExportTab?: () => void;
}

// Standard guitar tuning: E2, A2, D3, G3, B3, E4
const STRING_TUNING = [40, 45, 50, 55, 59, 64];
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

// Find optimal fret position for a MIDI note on guitar
function findBestStringAndFret(midiNote: number): { string: number; fret: number } | null {
  let bestString = -1;
  let bestFret = 999;

  for (let s = 0; s < 6; s++) {
    const fret = midiNote - STRING_TUNING[s];
    if (fret >= 0 && fret <= 24) {
      // Prefer lower frets and middle strings
      const penalty = Math.abs(s - 2.5) * 0.5 + fret * 0.1;
      if (bestString === -1 || fret + penalty < bestFret) {
        bestString = s;
        bestFret = fret;
      }
    }
  }

  if (bestString === -1) return null;
  return { string: bestString, fret: bestFret };
}

// Generate TAB from MIDI notes
function generateTab(notes: Array<{ pitch?: number; midi?: number; time?: number; duration?: number }>, beatsPerMeasure: number = 4): string[][] {
  if (!notes.length) return [];

  // Normalize notes to have pitch and time
  const normalizedNotes = notes.map(n => ({
    pitch: n.pitch ?? n.midi ?? 60,
    time: n.time ?? 0,
    duration: n.duration ?? 0.5,
  }));

  // Sort by time
  const sortedNotes = [...normalizedNotes].sort((a, b) => a.time - b.time);

  // Group notes by time (100ms resolution for chords)
  const timeResolution = 0.1;
  const timeGroups = new Map<number, MidiNote[]>();

  for (const note of sortedNotes) {
    const timeKey = Math.round(note.time / timeResolution);
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, []);
    }
    timeGroups.get(timeKey)!.push(note);
  }

  // Convert to TAB positions
  const tabPositions: { time: number; frets: (number | null)[] }[] = [];

  const sortedTimeKeys = Array.from(timeGroups.keys()).sort((a, b) => a - b);

  for (const timeKey of sortedTimeKeys) {
    const notesAtTime = timeGroups.get(timeKey)!;
    const frets: (number | null)[] = [null, null, null, null, null, null];

    for (const note of notesAtTime) {
      const position = findBestStringAndFret(note.pitch);
      if (position && frets[position.string] === null) {
        frets[position.string] = position.fret;
      }
    }

    tabPositions.push({
      time: timeKey * timeResolution,
      frets,
    });
  }

  // Build TAB strings (6 strings)
  const tabStrings: string[][] = STRING_NAMES.map((name, idx) => {
    const line: string[] = [`${name}|`];

    for (const pos of tabPositions) {
      const fret = pos.frets[idx];
      if (fret !== null) {
        line.push(fret.toString().padStart(2, '-'));
      } else {
        line.push('--');
      }
      line.push('-');
    }

    line.push('|');
    return line;
  });

  return tabStrings;
}

// Convert MIDI note to note name
function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

export function GuitarTabVisualization({
  notes,
  bpm = 120,
  className = '',
  onExportTab,
}: GuitarTabVisualizationProps) {
  const normalizedNotes = notes.map(n => ({
    pitch: n.pitch ?? n.midi ?? 60,
    time: n.time ?? 0,
    duration: n.duration ?? 0.5,
  }));

  const tabData = useMemo(() => generateTab(normalizedNotes), [notes]);

  const uniqueNotes = useMemo(() => {
    const noteSet = new Set<string>();
    normalizedNotes.forEach((n) => noteSet.add(midiToNoteName(n.pitch)));
    return Array.from(noteSet).slice(0, 12);
  }, [notes]);

  const tabText = useMemo(() => {
    return tabData.map((line) => line.join('')).join('\n');
  }, [tabData]);

  const handleCopyTab = () => {
    navigator.clipboard.writeText(tabText);
  };

  if (!notes.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Нет данных для TAB-визуализации</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🎸 Гитарная табулатура
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyTab}>
              Копировать
            </Button>
            {onExportTab && (
              <Button variant="outline" size="sm" onClick={onExportTab}>
                <Download className="h-4 w-4 mr-1" />
                Экспорт
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Detected notes */}
        <div className="flex flex-wrap gap-1.5">
          {uniqueNotes.map((note) => (
            <Badge key={note} variant="secondary" className="font-mono text-xs">
              {note}
            </Badge>
          ))}
        </div>

        {/* TAB visualization */}
        <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
          <pre className="font-mono text-sm leading-relaxed whitespace-pre text-foreground">
            {tabData.map((line, idx) => (
              <div key={idx} className="flex">
                <span className="text-primary font-bold w-4">{line[0]}</span>
                <span className="text-muted-foreground">
                  {line.slice(1).join('')}
                </span>
              </div>
            ))}
          </pre>
        </div>

        {/* Fretboard visualization */}
        <FretboardVisualization notes={normalizedNotes} />

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Нот: {notes.length}</span>
          <span>BPM: {bpm}</span>
          <span>
            Длительность: {normalizedNotes.length > 0 
              ? `${(Math.max(...normalizedNotes.map(n => n.time + n.duration))).toFixed(1)}s` 
              : '0s'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Fretboard visualization showing note positions
function FretboardVisualization({ notes }: { notes: Array<{ pitch: number; time: number; duration: number }> }) {
  const positions = useMemo(() => {
    const posMap = new Map<string, number>();

    for (const note of notes) {
      const pos = findBestStringAndFret(note.pitch);
      if (pos) {
        const key = `${pos.string}-${pos.fret}`;
        posMap.set(key, (posMap.get(key) || 0) + 1);
      }
    }

    return posMap;
  }, [notes]);

  const maxCount = Math.max(...Array.from(positions.values()), 1);
  const visibleFrets = 12;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Позиции на грифе</p>
      <div className="bg-gradient-to-b from-amber-900/30 to-amber-950/40 rounded-lg p-3 overflow-x-auto">
        {/* Fret numbers */}
        <div className="flex mb-1">
          <div className="w-6" />
          {Array.from({ length: visibleFrets }, (_, i) => (
            <div
              key={i}
              className="w-8 text-center text-xs text-muted-foreground font-mono"
            >
              {i}
            </div>
          ))}
        </div>

        {/* Strings */}
        {STRING_NAMES.map((name, stringIdx) => (
          <div key={stringIdx} className="flex items-center h-6">
            <span className="w-6 text-xs font-bold text-primary">{name}</span>
            {Array.from({ length: visibleFrets }, (_, fretIdx) => {
              const key = `${stringIdx}-${fretIdx}`;
              const count = positions.get(key) || 0;
              const intensity = count / maxCount;

              return (
                <div
                  key={fretIdx}
                  className="w-8 h-full flex items-center justify-center relative"
                >
                  {/* Fret wire */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-0.5 ${
                      fretIdx === 0 ? 'bg-zinc-200' : 'bg-zinc-600'
                    }`}
                  />
                  {/* String */}
                  <div
                    className="absolute left-0 right-0 h-px bg-zinc-400"
                    style={{
                      height: `${1 + stringIdx * 0.3}px`,
                    }}
                  />
                  {/* Note marker */}
                  {count > 0 && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${0.4 + intensity * 0.6})`,
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      {count > 1 ? count : ''}
                    </div>
                  )}
                  {/* Position markers (3, 5, 7, 9, 12) */}
                  {stringIdx === 3 && [3, 5, 7, 9].includes(fretIdx) && count === 0 && (
                    <div className="w-2 h-2 rounded-full bg-zinc-500/30" />
                  )}
                  {stringIdx === 2 && fretIdx === 12 && count === 0 && (
                    <div className="w-2 h-2 rounded-full bg-zinc-500/30" />
                  )}
                  {stringIdx === 4 && fretIdx === 12 && count === 0 && (
                    <div className="w-2 h-2 rounded-full bg-zinc-500/30" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuitarTabVisualization;
