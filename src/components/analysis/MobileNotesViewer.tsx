/**
 * MobileNotesViewer - Optimized mobile-first notes viewer
 * Combines piano roll, staff notation, and list view
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { 
  Music, 
  Piano, 
  ListMusic, 
  FileText, 
  Download, 
  ChevronDown,
  Zap,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InteractivePianoRoll } from './InteractivePianoRoll';
import { StaffNotation } from './StaffNotation';
import { toast } from 'sonner';

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

type ViewMode = 'piano' | 'staff' | 'list';

interface MobileNotesViewerProps {
  notes: NoteInput[];
  duration: number;
  bpm?: number;
  timeSignature?: { numerator: number; denominator: number } | string;
  keySignature?: string;
  midiUrl?: string | null;
  pdfUrl?: string | null;
  className?: string;
  onGeneratePdf?: () => void;
  isGeneratingPdf?: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_RU = ['До', 'До#', 'Ре', 'Ре#', 'Ми', 'Фа', 'Фа#', 'Соль', 'Соль#', 'Ля', 'Ля#', 'Си'];

function parseTimeSignature(ts: { numerator: number; denominator: number } | string | undefined): { numerator: number; denominator: number } {
  if (!ts) return { numerator: 4, denominator: 4 };
  if (typeof ts === 'object') return ts;
  const parts = ts.split('/');
  if (parts.length === 2) {
    return { numerator: parseInt(parts[0], 10) || 4, denominator: parseInt(parts[1], 10) || 4 };
  }
  return { numerator: 4, denominator: 4 };
}

export const MobileNotesViewer = memo(function MobileNotesViewer({
  notes,
  duration,
  bpm = 120,
  timeSignature,
  keySignature,
  midiUrl,
  pdfUrl,
  className,
  onGeneratePdf,
  isGeneratingPdf = false,
}: MobileNotesViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('piano');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);

  const parsedTimeSignature = parseTimeSignature(timeSignature);

  // Process notes for display
  const processedNotes = useMemo(() => {
    return notes.map((n, index) => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.time ?? 0;
      const endTime = n.endTime ?? (startTime + (n.duration ?? 0.5));
      const noteName = NOTE_NAMES[pitch % 12];
      const noteNameRu = NOTE_NAMES_RU[pitch % 12];
      const octave = Math.floor(pitch / 12) - 1;
      
      return {
        index,
        pitch,
        startTime,
        endTime,
        duration: endTime - startTime,
        velocity: n.velocity ?? 100,
        noteName: `${noteName}${octave}`,
        noteNameRu: `${noteNameRu}${octave}`,
        original: n,
      };
    }).sort((a, b) => a.startTime - b.startTime);
  }, [notes]);

  // Stats
  const stats = useMemo(() => {
    if (processedNotes.length === 0) return null;
    
    const pitches = processedNotes.map(n => n.pitch);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    
    // Most common note
    const noteCounts: Record<string, number> = {};
    processedNotes.forEach(n => {
      const key = NOTE_NAMES[n.pitch % 12];
      noteCounts[key] = (noteCounts[key] || 0) + 1;
    });
    const mostCommon = Object.entries(noteCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      total: processedNotes.length,
      minNote: `${NOTE_NAMES[minPitch % 12]}${Math.floor(minPitch / 12) - 1}`,
      maxNote: `${NOTE_NAMES[maxPitch % 12]}${Math.floor(maxPitch / 12) - 1}`,
      range: maxPitch - minPitch,
      mostCommon: mostCommon ? `${mostCommon[0]} (${mostCommon[1]}×)` : null,
    };
  }, [processedNotes]);

  const handleNoteClick = useCallback((note: NoteInput, index: number) => {
    setSelectedNoteIndex(index);
    // Could play note here with synth
  }, []);

  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Скачивание начато');
  }, []);

  if (notes.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-3 p-6",
          className
        )}
      >
        <Music className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground text-center">Ноты не обнаружены</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header with stats and view toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {stats?.total} нот
          </Badge>
          {bpm && (
            <Badge variant="outline" className="text-xs">
              {Math.round(bpm)} BPM
            </Badge>
          )}
          {keySignature && (
            <Badge variant="outline" className="text-xs">
              {keySignature}
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {viewMode === 'piano' && <Piano className="w-4 h-4" />}
              {viewMode === 'staff' && <Music className="w-4 h-4" />}
              {viewMode === 'list' && <ListMusic className="w-4 h-4" />}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewMode('piano')}>
              <Piano className="w-4 h-4 mr-2" />
              Piano Roll
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode('staff')}>
              <Music className="w-4 h-4 mr-2" />
              Нотный стан
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode('list')}>
              <ListMusic className="w-4 h-4 mr-2" />
              Список нот
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Visualization area */}
      <div className="rounded-lg border overflow-hidden bg-background">
        {viewMode === 'piano' && (
          <InteractivePianoRoll
            notes={notes}
            duration={duration}
            height={200}
            onNoteClick={handleNoteClick}
          />
        )}
        
        {viewMode === 'staff' && (
          <StaffNotation
            notes={notes}
            duration={duration}
            bpm={bpm}
            timeSignature={parsedTimeSignature}
            keySignature={keySignature}
            height={200}
          />
        )}
        
        {viewMode === 'list' && (
          <ScrollArea className="h-[200px]">
            <div className="divide-y divide-border">
              {processedNotes.slice(0, 100).map((note, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                    selectedNoteIndex === note.index && "bg-primary/10"
                  )}
                  onClick={() => setSelectedNoteIndex(note.index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center font-mono text-xs font-medium">
                      {note.noteName}
                    </div>
                    <div>
                      <p className="font-medium">{note.noteNameRu}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(note.startTime)} — {formatTime(note.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {(note.duration * 1000).toFixed(0)} мс
                    </p>
                    <div 
                      className="h-1 w-12 rounded-full bg-muted mt-1"
                      title={`Velocity: ${note.velocity}`}
                    >
                      <div 
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${(note.velocity / 127) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {processedNotes.length > 100 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  +{processedNotes.length - 100} ещё...
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Диапазон</p>
            <p className="text-sm font-medium">{stats.minNote} — {stats.maxNote}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Интервал</p>
            <p className="text-sm font-medium">{stats.range} полутонов</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Частая нота</p>
            <p className="text-sm font-medium">{stats.mostCommon || '—'}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {midiUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(midiUrl, 'notes.mid')}
            className="flex-1 min-w-[120px]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            MIDI
          </Button>
        )}
        
        {pdfUrl ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(pdfUrl, 'notes.pdf')}
            className="flex-1 min-w-[120px]"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
        ) : onGeneratePdf && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[120px]"
          >
            {isGeneratingPdf ? (
              <Zap className="w-4 h-4 mr-1.5 animate-pulse" />
            ) : (
              <FileText className="w-4 h-4 mr-1.5" />
            )}
            {isGeneratingPdf ? 'Генерация...' : 'Создать PDF'}
          </Button>
        )}
      </div>
    </div>
  );
});

export default MobileNotesViewer;
