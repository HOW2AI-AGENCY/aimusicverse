import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Music, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NoteInput {
  pitch?: number;
  midi?: number;
  time?: number;
  startTime?: number;
  duration?: number;
  velocity?: number;
}

interface GuitarTabVisualizationProps {
  notes: NoteInput[];
  bpm?: number;
  className?: string;
  onExportTab?: () => void;
}

// Standard guitar tuning: E2, A2, D3, G3, B3, E4
const STRING_TUNING = [40, 45, 50, 55, 59, 64];
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function findBestStringAndFret(midiNote: number): { string: number; fret: number } | null {
  let bestString = -1;
  let bestFret = 999;

  for (let s = 0; s < 6; s++) {
    const fret = midiNote - STRING_TUNING[s];
    if (fret >= 0 && fret <= 24) {
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

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function generateTab(notes: NoteInput[]): string[][] {
  if (!notes.length) return [];

  const normalizedNotes = notes.map(n => ({
    pitch: n.pitch ?? n.midi ?? 60,
    time: n.time ?? n.startTime ?? 0,
    duration: n.duration ?? 0.5,
  }));

  const sortedNotes = [...normalizedNotes].sort((a, b) => a.time - b.time);
  const timeResolution = 0.1;
  const timeGroups = new Map<number, typeof normalizedNotes>();

  for (const note of sortedNotes) {
    const timeKey = Math.round(note.time / timeResolution);
    if (!timeGroups.has(timeKey)) {
      timeGroups.set(timeKey, []);
    }
    timeGroups.get(timeKey)!.push(note);
  }

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

    tabPositions.push({ time: timeKey * timeResolution, frets });
  }

  return STRING_NAMES.map((name, idx) => {
    const line: string[] = [`${name}|`];
    for (const pos of tabPositions) {
      const fret = pos.frets[idx];
      line.push(fret !== null ? fret.toString().padStart(2, '-') : '--');
      line.push('-');
    }
    line.push('|');
    return line;
  });
}

export function GuitarTabVisualization({
  notes,
  bpm = 120,
  className = '',
  onExportTab,
}: GuitarTabVisualizationProps) {
  const [activeView, setActiveView] = useState<'tab' | 'fretboard'>('tab');

  const normalizedNotes = useMemo(() => notes.map(n => ({
    pitch: n.pitch ?? n.midi ?? 60,
    time: n.time ?? n.startTime ?? 0,
    duration: n.duration ?? 0.5,
  })), [notes]);

  const tabData = useMemo(() => generateTab(notes), [notes]);
  
  const tabText = useMemo(() => 
    tabData.map(line => line.join('')).join('\n'), 
  [tabData]);

  const uniqueNotes = useMemo(() => {
    const noteSet = new Set<string>();
    normalizedNotes.forEach(n => noteSet.add(midiToNoteName(n.pitch)));
    return Array.from(noteSet).slice(0, 12);
  }, [normalizedNotes]);

  const handleCopyTab = () => {
    navigator.clipboard.writeText(tabText);
    toast.success('Табулатура скопирована');
  };

  if (!notes.length) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        className
      )}>
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Ноты не обнаружены</p>
        <p className="text-xs text-muted-foreground mt-1">
          Попробуйте записать более длинный фрагмент
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with notes and actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {uniqueNotes.slice(0, 8).map(note => (
            <Badge key={note} variant="outline" className="font-mono text-xs">
              {note}
            </Badge>
          ))}
          {uniqueNotes.length > 8 && (
            <Badge variant="secondary" className="text-xs">
              +{uniqueNotes.length - 8}
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopyTab} className="h-8 px-2">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {onExportTab && (
            <Button variant="ghost" size="sm" onClick={onExportTab} className="h-8 px-2">
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="tab" className="text-xs gap-1.5">
            <Music className="w-3.5 h-3.5" />
            Табулатура
          </TabsTrigger>
          <TabsTrigger value="fretboard" className="text-xs gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5" />
            Гриф
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tab" className="mt-3">
          <Card className="bg-gradient-to-br from-amber-950/20 to-background border-amber-900/20">
            <CardContent className="p-4 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre">
                {tabData.map((line, idx) => (
                  <div key={idx} className="flex">
                    <span className="text-primary font-bold w-5">{line[0]}</span>
                    <span className="text-foreground/80">{line.slice(1).join('')}</span>
                  </div>
                ))}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fretboard" className="mt-3">
          <FretboardVisualization notes={normalizedNotes} />
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {notes.length} нот
        </span>
        <span>{bpm} BPM</span>
        {normalizedNotes.length > 0 && (
          <span>
            {Math.max(...normalizedNotes.map(n => n.time + n.duration)).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}

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
    <Card className="bg-gradient-to-b from-amber-900/20 to-amber-950/30 border-amber-900/20">
      <CardContent className="p-4 overflow-x-auto">
        {/* Fret numbers */}
        <div className="flex mb-2">
          <div className="w-7" />
          {Array.from({ length: visibleFrets }, (_, i) => (
            <div key={i} className="w-9 text-center text-xs text-muted-foreground font-mono">
              {i}
            </div>
          ))}
        </div>

        {/* Strings */}
        {STRING_NAMES.map((name, stringIdx) => (
          <div key={stringIdx} className="flex items-center h-7">
            <span className="w-7 text-xs font-bold text-primary pr-1 text-right">{name}</span>
            {Array.from({ length: visibleFrets }, (_, fretIdx) => {
              const key = `${stringIdx}-${fretIdx}`;
              const count = positions.get(key) || 0;
              const intensity = count / maxCount;

              return (
                <div key={fretIdx} className="w-9 h-full flex items-center justify-center relative">
                  {/* Fret wire */}
                  <div className={cn(
                    "absolute right-0 top-0 bottom-0 w-0.5",
                    fretIdx === 0 ? "bg-zinc-300" : "bg-zinc-600/50"
                  )} />
                  {/* String */}
                  <div 
                    className="absolute left-0 right-0 bg-zinc-400/60"
                    style={{ height: `${1 + stringIdx * 0.4}px` }}
                  />
                  {/* Note marker */}
                  {count > 0 && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-lg"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${0.5 + intensity * 0.5})`,
                        color: 'hsl(var(--primary-foreground))',
                        boxShadow: `0 0 ${4 + intensity * 8}px hsl(var(--primary) / 0.5)`,
                      }}
                    >
                      {count > 1 ? count : ''}
                    </div>
                  )}
                  {/* Position markers */}
                  {count === 0 && stringIdx === 3 && [3, 5, 7, 9].includes(fretIdx) && (
                    <div className="w-2 h-2 rounded-full bg-zinc-500/30" />
                  )}
                  {count === 0 && [2, 4].includes(stringIdx) && fretIdx === 12 && (
                    <div className="w-2 h-2 rounded-full bg-zinc-500/30" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default GuitarTabVisualization;
