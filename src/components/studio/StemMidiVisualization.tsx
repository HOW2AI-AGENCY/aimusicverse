/**
 * StemMidiVisualization - Enhanced unified MIDI/Notes visualization
 * 
 * Features:
 * - Piano Roll with playhead sync
 * - Staff Notation view
 * - Guitar Tab/Fretboard view
 * - Chord Progression display
 * - Download buttons for all formats
 * - Responsive mobile-first design
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { 
  Piano, Music2, ListMusic, Guitar, Download, 
  Play, Pause, Volume2, VolumeX, ZoomIn, ZoomOut,
  FileMusic, FileText, ChevronDown, Sparkles, Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMidiSynth } from '@/hooks/useMidiSynth';
import { toast } from 'sonner';

// Types
interface NoteData {
  pitch: number;
  startTime: number;
  endTime: number;
  duration: number;
  velocity: number;
}

interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
}

interface TranscriptionFiles {
  midiUrl?: string | null;
  midiQuantUrl?: string | null;
  pdfUrl?: string | null;
  gp5Url?: string | null;
  musicXmlUrl?: string | null;
}

interface StemMidiVisualizationProps {
  notes: NoteData[];
  duration: number;
  bpm?: number;
  keySignature?: string;
  timeSignature?: string;
  chords?: ChordData[];
  files?: TranscriptionFiles;
  stemType?: string;
  className?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

// Constants
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_RU = ['До', 'До#', 'Ре', 'Ре#', 'Ми', 'Фа', 'Фа#', 'Соль', 'Соль#', 'Ля', 'Ля#', 'Си'];

const CHORD_COLORS: Record<string, string> = {
  'C': 'bg-red-500/20 border-red-500/40 text-red-300',
  'D': 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  'E': 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  'F': 'bg-green-500/20 border-green-500/40 text-green-300',
  'G': 'bg-teal-500/20 border-teal-500/40 text-teal-300',
  'A': 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  'B': 'bg-purple-500/20 border-purple-500/40 text-purple-300',
};

function getChordColor(chord: string): string {
  const root = chord.charAt(0).toUpperCase();
  return CHORD_COLORS[root] || 'bg-muted border-border text-muted-foreground';
}

function getNoteName(pitch: number): string {
  return NOTE_NAMES[pitch % 12] + Math.floor(pitch / 12 - 1);
}

function getNoteNameRu(pitch: number): string {
  return NOTE_NAMES_RU[pitch % 12] + Math.floor(pitch / 12 - 1);
}

// ================== Piano Roll Component ==================
const PianoRollView = memo(function PianoRollView({
  notes,
  duration,
  currentTime,
  onSeek,
  height = 200,
}: {
  notes: NoteData[];
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  height?: number;
}) {
  const [zoom, setZoom] = useState(1);
  
  const { minPitch, maxPitch, pitchRange } = useMemo(() => {
    if (notes.length === 0) return { minPitch: 48, maxPitch: 72, pitchRange: 24 };
    const pitches = notes.map(n => n.pitch);
    const min = Math.max(0, Math.min(...pitches) - 2);
    const max = Math.min(127, Math.max(...pitches) + 2);
    return { minPitch: min, maxPitch: max, pitchRange: max - min || 24 };
  }, [notes]);

  const contentWidth = Math.max(300, duration * 20 * zoom);
  const rowHeight = Math.max(4, Math.min(10, (height - 40) / pitchRange));
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const progress = x / contentWidth;
    onSeek(Math.max(0, Math.min(duration, progress * duration)));
  }, [onSeek, duration, contentWidth]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Piano className="w-8 h-8 mr-2 opacity-50" />
        <span>Ноты не обнаружены</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(z => Math.min(4, z + 0.25))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {notes.length} нот · {formatTime(duration)}
        </div>
      </div>

      {/* Piano Roll Content */}
      <div className="flex flex-1 min-h-0">
        {/* Piano Keys */}
        <div className="w-8 shrink-0 bg-muted/40 border-r relative">
          {Array.from({ length: pitchRange + 1 }).map((_, i) => {
            const pitch = maxPitch - i;
            const isBlack = NOTE_NAMES[pitch % 12].includes('#');
            const isC = pitch % 12 === 0;
            return (
              <div
                key={pitch}
                className={cn(
                  "absolute left-0 right-0 border-b border-border/20 flex items-center justify-end pr-0.5",
                  isBlack ? "bg-foreground/10" : "bg-background/50"
                )}
                style={{ top: i * rowHeight, height: rowHeight }}
              >
                {isC && (
                  <span className="text-[7px] font-mono text-muted-foreground">
                    C{Math.floor(pitch / 12) - 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes Grid */}
        <div 
          className="flex-1 overflow-x-auto overflow-y-hidden cursor-crosshair"
          onClick={handleClick}
        >
          <div 
            className="relative" 
            style={{ width: contentWidth, height: pitchRange * rowHeight }}
          >
            {/* Grid lines */}
            {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-border/20"
                style={{ left: i * 20 * zoom }}
              />
            ))}

            {/* Notes */}
            {notes.map((note, i) => {
              const noteTop = (maxPitch - note.pitch) * rowHeight;
              const noteLeft = (note.startTime / duration) * contentWidth;
              const noteWidth = Math.max(3, (note.duration / duration) * contentWidth);
              const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
              const isPast = note.endTime < currentTime;
              const isBlack = NOTE_NAMES[note.pitch % 12].includes('#');

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "absolute rounded-sm transition-all duration-75",
                    isBlack 
                      ? "bg-primary/70 hover:bg-primary/90" 
                      : "bg-primary hover:brightness-110",
                    isPast && "opacity-40",
                    isActive && "ring-1 ring-white shadow-lg shadow-primary/50 brightness-125 z-10"
                  )}
                  style={{
                    top: noteTop,
                    left: noteLeft,
                    width: noteWidth,
                    height: rowHeight - 1,
                    opacity: isPast ? 0.4 : (0.5 + (note.velocity / 127) * 0.5),
                  }}
                  title={`${getNoteName(note.pitch)} (${formatTime(note.startTime)})`}
                />
              );
            })}

            {/* Playhead */}
            {currentTime > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
                style={{
                  left: (currentTime / duration) * contentWidth,
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ================== Chord Timeline Component ==================
const ChordTimelineView = memo(function ChordTimelineView({
  chords,
  duration,
  currentTime,
}: {
  chords: ChordData[];
  duration: number;
  currentTime: number;
}) {
  const uniqueChords = useMemo(() => [...new Set(chords.map(c => c.chord))], [chords]);
  const currentChord = useMemo(() => 
    chords.find(c => c.startTime <= currentTime && c.endTime > currentTime),
  [chords, currentTime]);

  if (chords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Music2 className="w-6 h-6 mr-2 opacity-50" />
        <span>Аккорды не обнаружены</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Current Chord */}
      {currentChord && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <p className="text-xs text-muted-foreground">Сейчас играет</p>
            <p className="text-2xl font-bold font-mono">{currentChord.chord}</p>
          </div>
        </div>
      )}

      {/* Chord Progression */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Прогрессия аккордов</p>
        <div className="flex flex-wrap gap-2">
          {uniqueChords.map((chord, i) => (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                "text-sm font-mono transition-all px-3 py-1",
                getChordColor(chord),
                currentChord?.chord === chord && "ring-2 ring-primary scale-110"
              )}
            >
              {chord}
            </Badge>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Таймлайн</p>
        <div className="relative h-12 rounded-lg bg-muted/30 border overflow-hidden">
          {chords.map((chord, i) => {
            const isActive = chord.startTime <= currentTime && chord.endTime > currentTime;
            const isPast = chord.endTime < currentTime;
            
            return (
              <div
                key={i}
                className={cn(
                  "absolute top-0 bottom-0 flex items-center justify-center",
                  "border-r border-border/30 transition-all",
                  getChordColor(chord.chord),
                  isPast && "opacity-50",
                  isActive && "ring-1 ring-inset ring-primary"
                )}
                style={{
                  left: `${(chord.startTime / duration) * 100}%`,
                  width: `${((chord.endTime - chord.startTime) / duration) * 100}%`,
                }}
              >
                <span className={cn(
                  "text-xs font-mono font-semibold truncate px-1",
                  isActive && "text-primary"
                )}>
                  {chord.chord}
                </span>
              </div>
            );
          })}
          
          {/* Playhead */}
          {currentTime > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

// ================== Notes List View ==================
const NotesListView = memo(function NotesListView({
  notes,
  currentTime,
  bpm,
  keySignature,
}: {
  notes: NoteData[];
  currentTime: number;
  bpm?: number;
  keySignature?: string;
}) {
  const sortedNotes = useMemo(() => 
    [...notes].sort((a, b) => a.startTime - b.startTime),
  [notes]);

  const pitchRange = useMemo(() => {
    if (notes.length === 0) return { min: 0, max: 127 };
    const pitches = notes.map(n => n.pitch);
    return { min: Math.min(...pitches), max: Math.max(...pitches) };
  }, [notes]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <ListMusic className="w-6 h-6 mr-2 opacity-50" />
        <span>Ноты не обнаружены</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          {notes.length} нот
        </Badge>
        {bpm && (
          <Badge variant="outline" className="text-xs">
            {bpm} BPM
          </Badge>
        )}
        {keySignature && (
          <Badge variant="outline" className="text-xs">
            {keySignature}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {getNoteName(pitchRange.min)} – {getNoteName(pitchRange.max)}
        </Badge>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedNotes.slice(0, 100).map((note, i) => {
            const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
            const isPast = note.endTime < currentTime;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                  isActive && "bg-primary/20 ring-1 ring-primary",
                  isPast && "opacity-50",
                  !isActive && !isPast && "hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold",
                  "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                )}>
                  {NOTE_NAMES[note.pitch % 12]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{getNoteName(note.pitch)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({getNoteNameRu(note.pitch)})
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(note.startTime)} – {formatTime(note.endTime)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">{note.duration.toFixed(2)}s</div>
                  <div className="text-xs text-muted-foreground">
                    v{note.velocity}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {sortedNotes.length > 100 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              ...и ещё {sortedNotes.length - 100} нот
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

// ================== Guitar Tab View ==================
const GuitarTabView = memo(function GuitarTabView({
  notes,
  bpm,
}: {
  notes: NoteData[];
  bpm?: number;
}) {
  // Standard guitar tuning: E2, A2, D3, G3, B3, E4
  const STRING_TUNING = [40, 45, 50, 55, 59, 64];
  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
  
  const findBestStringAndFret = useCallback((midiNote: number): { string: number; fret: number } | null => {
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
  }, []);

  const tabData = useMemo(() => {
    if (!notes.length) return [];

    const normalizedNotes = notes.map(n => ({
      pitch: n.pitch,
      time: n.startTime,
      duration: n.duration,
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
  }, [notes, findBestStringAndFret]);

  const fretPositions = useMemo(() => {
    const posMap = new Map<string, number>();
    for (const note of notes) {
      const pos = findBestStringAndFret(note.pitch);
      if (pos) {
        const key = `${pos.string}-${pos.fret}`;
        posMap.set(key, (posMap.get(key) || 0) + 1);
      }
    }
    return posMap;
  }, [notes, findBestStringAndFret]);

  const maxCount = Math.max(...Array.from(fretPositions.values()), 1);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Guitar className="w-6 h-6 mr-2 opacity-50" />
        <span>Ноты не обнаружены</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="tab" className="flex-1 flex flex-col">
        <div className="px-3 pt-3 shrink-0">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="tab" className="text-xs gap-1">
              <ListMusic className="w-3 h-3" />
              Табулатура
            </TabsTrigger>
            <TabsTrigger value="fretboard" className="text-xs gap-1">
              <Grid3X3 className="w-3 h-3" />
              Гриф
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tab" className="flex-1 m-0 p-3 overflow-auto">
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

        <TabsContent value="fretboard" className="flex-1 m-0 p-3 overflow-auto">
          <Card className="bg-gradient-to-b from-amber-900/20 to-amber-950/30 border-amber-900/20">
            <CardContent className="p-4 overflow-x-auto">
              {/* Fret numbers */}
              <div className="flex mb-2">
                <div className="w-7" />
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="w-9 text-center text-xs text-muted-foreground font-mono">
                    {i}
                  </div>
                ))}
              </div>

              {/* Strings */}
              {STRING_NAMES.map((name, stringIdx) => (
                <div key={stringIdx} className="flex items-center h-7">
                  <span className="w-7 text-xs font-bold text-primary pr-1 text-right">{name}</span>
                  {Array.from({ length: 12 }, (_, fretIdx) => {
                    const key = `${stringIdx}-${fretIdx}`;
                    const count = fretPositions.get(key) || 0;
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
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <div className="p-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {notes.length} нот
        </span>
        {bpm && <span>{bpm} BPM</span>}
      </div>
    </div>
  );
});

// ================== Download Files Card ==================
const DownloadFilesCard = memo(function DownloadFilesCard({
  files,
  stemType,
}: {
  files: TranscriptionFiles;
  stemType?: string;
}) {
  const handleDownload = (url: string, filename: string) => {
    window.open(url, '_blank');
    toast.success(`Скачивание ${filename}...`);
  };

  const availableFiles = [
    { key: 'midiUrl', label: 'MIDI', icon: FileMusic, ext: 'mid' },
    { key: 'midiQuantUrl', label: 'MIDI (Quantized)', icon: FileMusic, ext: 'mid' },
    { key: 'pdfUrl', label: 'PDF Ноты', icon: FileText, ext: 'pdf' },
    { key: 'gp5Url', label: 'Guitar Pro', icon: Guitar, ext: 'gp5' },
    { key: 'musicXmlUrl', label: 'MusicXML', icon: Music2, ext: 'xml' },
  ].filter(f => files[f.key as keyof TranscriptionFiles]);

  if (availableFiles.length === 0) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-muted/50 to-muted/30">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Download className="w-4 h-4" />
        Доступные файлы
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {availableFiles.map(({ key, label, icon: Icon, ext }) => (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => handleDownload(
              files[key as keyof TranscriptionFiles]!,
              `${stemType || 'track'}.${ext}`
            )}
            className="h-auto py-2 flex-col items-start gap-1"
          >
            <div className="flex items-center gap-1.5 w-full">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
});

// ================== Main Component ==================
export const StemMidiVisualization = memo(function StemMidiVisualization({
  notes,
  duration,
  bpm,
  keySignature,
  timeSignature,
  chords = [],
  files,
  stemType,
  className,
  currentTime = 0,
  isPlaying = false,
  onSeek,
}: StemMidiVisualizationProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'piano' | 'guitar' | 'chords' | 'list'>('piano');
  
  // Check if this is a guitar/bass stem for guitar tab view
  const isGuitarStem = useMemo(() => {
    if (!stemType) return false;
    const type = stemType.toLowerCase();
    return type.includes('guitar') || type.includes('bass');
  }, [stemType]);
  
  // Internal playback state
  const [internalTime, setInternalTime] = useState(0);
  const [internalPlaying, setInternalPlaying] = useState(false);
  
  const effectiveTime = currentTime || internalTime;
  const effectivePlaying = isPlaying || internalPlaying;

  // MIDI synth for playback
  const { stopAll, isReady: synthReady } = useMidiSynth();

  const handlePlayPause = useCallback(() => {
    if (effectivePlaying) {
      stopAll();
      setInternalPlaying(false);
    } else {
      // Simple playback - would need more sophisticated implementation
      setInternalPlaying(true);
    }
  }, [effectivePlaying, stopAll]);

  const hasChords = chords.length > 0;
  const hasNotes = notes.length > 0;
  
  // Dynamic tab count based on stem type
  const tabCount = isGuitarStem ? 4 : 3;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-3 pt-3 shrink-0">
          <TabsList className={cn("grid w-full h-9", isGuitarStem ? "grid-cols-4" : "grid-cols-3")}>
            <TabsTrigger value="piano" className="text-xs gap-1">
              <Piano className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Piano</span>
            </TabsTrigger>
            {isGuitarStem && (
              <TabsTrigger value="guitar" className="text-xs gap-1">
                <Guitar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tab</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="chords" className="text-xs gap-1" disabled={!hasChords}>
              <Music2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Аккорды</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs gap-1">
              <ListMusic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Список</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="piano" className="flex-1 m-0 mt-3 min-h-0">
          <PianoRollView
            notes={notes}
            duration={duration}
            currentTime={effectiveTime}
            onSeek={onSeek}
            height={isMobile ? 200 : 280}
          />
        </TabsContent>

        {/* Guitar Tab (only for guitar/bass stems) */}
        {isGuitarStem && (
          <TabsContent value="guitar" className="flex-1 m-0 min-h-0">
            <GuitarTabView
              notes={notes}
              bpm={bpm}
            />
          </TabsContent>
        )}

        <TabsContent value="chords" className="flex-1 m-0 min-h-0 overflow-auto">
          <ChordTimelineView
            chords={chords}
            duration={duration}
            currentTime={effectiveTime}
          />
        </TabsContent>

        <TabsContent value="list" className="flex-1 m-0 min-h-0">
          <NotesListView
            notes={notes}
            currentTime={effectiveTime}
            bpm={bpm}
            keySignature={keySignature}
          />
        </TabsContent>
      </Tabs>

      {/* Bottom Section: Files & Metadata */}
      {files && Object.values(files).some(Boolean) && (
        <div className="p-3 border-t shrink-0">
          <DownloadFilesCard files={files} stemType={stemType} />
        </div>
      )}

      {/* Metadata Footer */}
      <div className="px-3 pb-3 flex flex-wrap items-center gap-2 shrink-0">
        {hasNotes && (
          <Badge variant="secondary" className="text-xs">
            {notes.length} нот
          </Badge>
        )}
        {bpm && (
          <Badge variant="outline" className="text-xs">
            {bpm} BPM
          </Badge>
        )}
        {keySignature && (
          <Badge variant="outline" className="text-xs">
            {keySignature}
          </Badge>
        )}
        {timeSignature && (
          <Badge variant="outline" className="text-xs">
            {timeSignature}
          </Badge>
        )}
        {hasChords && (
          <Badge variant="outline" className="text-xs">
            {chords.length} аккордов
          </Badge>
        )}
      </div>
    </div>
  );
});

export default StemMidiVisualization;
