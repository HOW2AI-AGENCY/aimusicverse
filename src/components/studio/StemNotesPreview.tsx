/**
 * StemNotesPreview - Compact inline notes visualization for stem cards
 * Shows mini piano roll, note count, BPM, and quick actions
 */

import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Eye, Download, FileMusic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { StemTranscription } from '@/hooks/useStemTranscription';

interface NoteForPreview {
  pitch: number;
  startTime: number;
  endTime: number;
}

interface StemNotesPreviewProps {
  transcription: StemTranscription | null;
  isLoading?: boolean;
  currentTime?: number;
  duration?: number;
  onViewFull?: () => void;
  onDownloadPdf?: () => void;
  className?: string;
}

// Mini piano roll - very compact visualization
const MiniPianoRoll = memo(({ 
  notes, 
  duration, 
  currentTime = 0,
  className 
}: { 
  notes: NoteForPreview[]; 
  duration: number; 
  currentTime?: number;
  className?: string;
}) => {
  const { minPitch, maxPitch, normalizedNotes } = useMemo(() => {
    if (!notes || notes.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [] };
    }

    const pitches = notes.map(n => n.pitch);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    const range = max - min || 1;

    return {
      minPitch: min,
      maxPitch: max,
      normalizedNotes: notes.map(n => ({
        x: (n.startTime / duration) * 100,
        width: ((n.endTime - n.startTime) / duration) * 100,
        y: ((max - n.pitch) / range) * 100,
      })),
    };
  }, [notes, duration]);

  if (normalizedNotes.length === 0) return null;

  const playheadPos = (currentTime / duration) * 100;

  return (
    <div 
      className={cn(
        "relative h-8 rounded overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10",
        className
      )}
    >
      {/* Notes */}
      {normalizedNotes.map((note, i) => (
        <div
          key={i}
          className="absolute bg-primary/60 rounded-[1px]"
          style={{
            left: `${note.x}%`,
            width: `${Math.max(note.width, 0.5)}%`,
            top: `${note.y}%`,
            height: '12%',
          }}
        />
      ))}

      {/* Playhead */}
      {currentTime > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-px bg-primary shadow-glow"
          style={{ left: `${playheadPos}%` }}
        />
      )}
    </div>
  );
});

MiniPianoRoll.displayName = 'MiniPianoRoll';

export const StemNotesPreview = memo(function StemNotesPreview({
  transcription,
  isLoading,
  currentTime = 0,
  duration = 0,
  onViewFull,
  onDownloadPdf,
  className,
}: StemNotesPreviewProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-2 pt-1", className)}>
        <Skeleton className="h-8 w-full rounded" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    );
  }

  // Show preview if we have MIDI, PDF, or notes
  const hasMidi = !!transcription?.midi_url;
  const hasPdf = !!transcription?.pdf_url;
  const hasNotes = !!(transcription?.notes && (transcription.notes as any[]).length > 0);
  
  if (!transcription || (!hasMidi && !hasPdf && !hasNotes)) {
    return null;
  }

  const notes = (transcription.notes as NoteForPreview[]) || [];
  const notesCount = transcription.notes_count || notes.length;
  const bpm = transcription.bpm;
  const keyDetected = transcription.key_detected;
  const noteDuration = transcription.duration_seconds || duration;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("pt-1.5 space-y-1.5", className)}
    >
      {/* Mini piano roll */}
      {notes.length > 0 && (
        <MiniPianoRoll
          notes={notes}
          duration={noteDuration}
          currentTime={currentTime}
        />
      )}

      {/* Info + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <Music2 className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground truncate">
            {notesCount > 0 && (
              <>
                {notesCount} {notesCount === 1 ? 'нота' : notesCount < 5 ? 'ноты' : 'нот'}
                {bpm && ` • ${Math.round(bpm)} BPM`}
                {keyDetected && ` • ${keyDetected}`}
              </>
            )}
            {notesCount === 0 && hasPdf && 'PDF ноты готовы'}
            {notesCount === 0 && !hasPdf && hasMidi && 'MIDI готов'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {transcription.pdf_url && onDownloadPdf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadPdf}
              className="h-5 w-5 p-0"
              title="Скачать PDF"
            >
              <FileMusic className="w-3 h-3" />
            </Button>
          )}
          
          {onViewFull && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewFull}
              className="h-5 gap-1 px-1.5 text-[10px]"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Ноты</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Loading placeholder for notes preview
 */
export const StemNotesPreviewSkeleton = memo(function StemNotesPreviewSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("pt-1.5 space-y-1.5", className)}>
      <div className="h-8 rounded bg-muted/50 animate-pulse flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted animate-pulse" />
          <div className="w-24 h-3 rounded bg-muted animate-pulse" />
        </div>
        <div className="w-12 h-5 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
});
