import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface NoteData {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  noteName?: string;
}

interface PianoRollPreviewProps {
  notes: NoteData[];
  duration: number;
  height?: number;
  className?: string;
  currentTime?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PianoRollPreview({ 
  notes, 
  duration, 
  height = 120,
  className,
  currentTime = 0,
}: PianoRollPreviewProps) {
  const { minPitch, maxPitch, normalizedNotes } = useMemo(() => {
    if (notes.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [] };
    }
    
    const pitches = notes.map(n => n.pitch);
    const min = Math.min(...pitches);
    const max = Math.max(...pitches);
    
    // Add padding
    const minP = Math.max(0, min - 2);
    const maxP = Math.min(127, max + 2);
    
    return { 
      minPitch: minP, 
      maxPitch: maxP,
      normalizedNotes: notes.map(n => ({
        ...n,
        normalizedPitch: (n.pitch - minP) / (maxP - minP),
        normalizedStart: n.startTime / duration,
        normalizedEnd: n.endTime / duration,
      })),
    };
  }, [notes, duration]);

  const pitchRange = maxPitch - minPitch;
  const octaveLines = useMemo(() => {
    const lines: number[] = [];
    for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
      if (pitch % 12 === 0) { // C notes
        lines.push((pitch - minPitch) / pitchRange);
      }
    }
    return lines;
  }, [minPitch, maxPitch, pitchRange]);

  if (notes.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm",
          className
        )}
        style={{ height }}
      >
        Нет данных нот
      </div>
    );
  }

  return (
    <div 
      className={cn("relative rounded-lg bg-background/50 border overflow-hidden", className)}
      style={{ height }}
    >
      {/* Grid lines (octaves) */}
      {octaveLines.map((pos, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-muted/30"
          style={{ bottom: `${pos * 100}%` }}
        />
      ))}
      
      {/* Playhead */}
      {currentTime > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-px bg-primary z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      )}
      
      {/* Notes */}
      {normalizedNotes.map((note, i) => {
        const isBlackKey = NOTE_NAMES[note.pitch % 12].includes('#');
        const isPast = note.endTime < currentTime;
        const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
        
        return (
          <div
            key={i}
            className={cn(
              "absolute rounded-sm transition-colors",
              isBlackKey ? "bg-primary/70" : "bg-primary",
              isPast && "opacity-50",
              isActive && "ring-2 ring-primary-foreground"
            )}
            style={{
              left: `${note.normalizedStart * 100}%`,
              width: `${Math.max(0.5, (note.normalizedEnd - note.normalizedStart) * 100)}%`,
              bottom: `${note.normalizedPitch * 100}%`,
              height: `${Math.max(4, 100 / pitchRange)}%`,
              opacity: 0.3 + (note.velocity / 127) * 0.7,
            }}
            title={`${note.noteName || NOTE_NAMES[note.pitch % 12]}${Math.floor(note.pitch / 12) - 1}`}
          />
        );
      })}
      
      {/* Time markers */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-muted/50 to-transparent flex items-end px-1">
        <span className="text-[10px] text-muted-foreground">0s</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{duration.toFixed(1)}s</span>
      </div>
    </div>
  );
}
