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
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      {/* View mode toggle - compact segmented control */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50 overflow-x-auto">
        <button
          onClick={() => setViewMode('piano')}
          className={cn(
            "flex-1 min-w-[80px] flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            viewMode === 'piano' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Piano className="w-3.5 h-3.5" />
          <span>Piano</span>
        </button>
        <button
          onClick={() => setViewMode('staff')}
          className={cn(
            "flex-1 min-w-[80px] flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            viewMode === 'staff' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Ноты</span>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            "flex-1 min-w-[80px] flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            viewMode === 'list' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Список</span>
        </button>
      </div>

      {/* Stats badges - horizontal scroll on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <Badge variant="secondary" className="text-[10px] font-medium flex-shrink-0">
          {stats?.total} нот
        </Badge>
        {bpm && (
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            {Math.round(bpm)} BPM
          </Badge>
        )}
        {keySignature && (
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            {keySignature}
          </Badge>
        )}
        {stats && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground flex-shrink-0">
            {stats.minNote}–{stats.maxNote}
          </Badge>
        )}
      </div>

      {/* Visualization area - scrollable container */}
      <div className="rounded-xl border overflow-hidden bg-background shadow-sm">
        <div
          className="overflow-x-auto overflow-y-hidden touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {viewMode === 'piano' && (
            <div className="min-w-[100%] xs:min-w-[350px]">
              <InteractivePianoRoll
                notes={notes}
                duration={duration}
                height={220}
                onNoteClick={handleNoteClick}
              />
            </div>
          )}

          {viewMode === 'staff' && (
            <div className="min-w-[100%] xs:min-w-[350px]">
              <StaffNotation
                notes={notes}
                duration={duration}
                bpm={bpm}
                timeSignature={parsedTimeSignature}
                keySignature={keySignature}
                height={220}
              />
            </div>
          )}
        </div>
        
        {viewMode === 'list' && (
          <ScrollArea className="h-[220px]">
            <div className="divide-y divide-border/50">
              {processedNotes.slice(0, 150).map((note, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 transition-colors active:bg-muted/50",
                    selectedNoteIndex === note.index && "bg-primary/5"
                  )}
                  onClick={() => setSelectedNoteIndex(note.index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-mono text-sm font-semibold text-primary">
                      {note.noteName}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{note.noteNameRu}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(note.startTime)} — {formatTime(note.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {(note.duration * 1000).toFixed(0)} мс
                    </span>
                    <div 
                      className="h-1.5 w-16 rounded-full bg-muted"
                      title={`Velocity: ${note.velocity}`}
                    >
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(note.velocity / 127) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {processedNotes.length > 150 && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center bg-muted/20">
                  +{processedNotes.length - 150} ещё нот...
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Actions - full width buttons for mobile */}
      <div className="grid grid-cols-2 gap-2">
        {midiUrl && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDownload(midiUrl, 'notes.mid')}
            className="h-12 gap-2"
          >
            <Download className="w-5 h-5" />
            <span>MIDI</span>
          </Button>
        )}
        
        {pdfUrl ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleDownload(pdfUrl, 'notes.pdf')}
            className="h-12 gap-2"
          >
            <FileText className="w-5 h-5" />
            <span>PDF</span>
          </Button>
        ) : onGeneratePdf && (
          <Button
            variant="outline"
            size="lg"
            onClick={onGeneratePdf}
            disabled={isGeneratingPdf}
            className="h-12 gap-2"
          >
            {isGeneratingPdf ? (
              <Zap className="w-5 h-5 animate-pulse" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            <span>{isGeneratingPdf ? 'Генерация...' : 'Создать PDF'}</span>
          </Button>
        )}
      </div>
    </div>
  );
});

export default MobileNotesViewer;
