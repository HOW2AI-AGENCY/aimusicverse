import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Music } from 'lucide-react';

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

interface PianoRollPreviewProps {
  notes: NoteInput[];
  duration: number;
  height?: number;
  className?: string;
  currentTime?: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function PianoRollPreview({ 
  notes, 
  duration, 
  height = 150,
  className,
  currentTime = 0,
}: PianoRollPreviewProps) {
  const { minPitch, maxPitch, normalizedNotes, pitchRange } = useMemo(() => {
    if (notes.length === 0) {
      return { minPitch: 48, maxPitch: 72, normalizedNotes: [], pitchRange: 24 };
    }
    
    const processed = notes.map(n => {
      const pitch = n.pitch ?? n.midi ?? 60;
      const startTime = n.startTime ?? n.time ?? 0;
      const endTime = n.endTime ?? (startTime + (n.duration ?? 0.5));
      return { 
        pitch, 
        startTime, 
        endTime, 
        velocity: n.velocity ?? 100 
      };
    });

    const pitches = processed.map(n => n.pitch);
    const min = Math.max(0, Math.min(...pitches) - 3);
    const max = Math.min(127, Math.max(...pitches) + 3);
    const range = max - min || 1;
    
    return { 
      minPitch: min, 
      maxPitch: max,
      pitchRange: range,
      normalizedNotes: processed.map(n => ({
        ...n,
        normalizedPitch: (n.pitch - min) / range,
        normalizedStart: n.startTime / duration,
        normalizedEnd: n.endTime / duration,
      })),
    };
  }, [notes, duration]);

  const octaveLines = useMemo(() => {
    const lines: { pitch: number; pos: number; label: string }[] = [];
    for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
      if (pitch % 12 === 0) {
        lines.push({
          pitch,
          pos: (pitch - minPitch) / pitchRange,
          label: `C${Math.floor(pitch / 12) - 1}`
        });
      }
    }
    return lines;
  }, [minPitch, maxPitch, pitchRange]);

  if (notes.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-2",
          className
        )}
        style={{ height }}
      >
        <Music className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Ноты не обнаружены</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-lg bg-gradient-to-b from-background to-muted/20 border overflow-hidden",
        className
      )}
      style={{ height }}
    >
      {/* Piano keys on the left */}
      <div className="absolute left-0 top-0 bottom-4 w-8 bg-muted/50 border-r z-10">
        {octaveLines.map((line, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 flex items-center justify-center"
            style={{ bottom: `${line.pos * 100}%`, transform: 'translateY(50%)' }}
          >
            <span className="text-[9px] font-mono text-muted-foreground bg-muted/80 px-0.5 rounded">
              {line.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main piano roll area */}
      <div className="absolute left-8 right-0 top-0 bottom-4">
        {/* Grid lines (octaves) */}
        {octaveLines.map((line, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-primary/10"
            style={{ bottom: `${line.pos * 100}%` }}
          />
        ))}

        {/* Beat grid lines */}
        {Array.from({ length: Math.ceil(duration) }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l border-muted/30"
            style={{ left: `${(i / duration) * 100}%` }}
          />
        ))}
        
        {/* Playhead */}
        {currentTime > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))] z-20"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}
        
        {/* Notes */}
        {normalizedNotes.map((note, i) => {
          const isBlackKey = NOTE_NAMES[note.pitch % 12].includes('#');
          const isPast = note.endTime < currentTime;
          const isActive = note.startTime <= currentTime && note.endTime >= currentTime;
          const noteName = NOTE_NAMES[note.pitch % 12] + Math.floor(note.pitch / 12 - 1);
          
          return (
            <div
              key={i}
              className={cn(
                "absolute rounded-sm transition-all duration-100",
                isBlackKey 
                  ? "bg-primary/60 hover:bg-primary/80" 
                  : "bg-primary hover:bg-primary/90",
                isPast && "opacity-40",
                isActive && "ring-1 ring-white shadow-lg shadow-primary/50"
              )}
              style={{
                left: `${note.normalizedStart * 100}%`,
                width: `${Math.max(0.8, (note.normalizedEnd - note.normalizedStart) * 100)}%`,
                bottom: `${note.normalizedPitch * 100}%`,
                height: `${Math.max(6, 90 / pitchRange)}%`,
                opacity: isPast ? 0.4 : (0.4 + (note.velocity / 127) * 0.6),
              }}
              title={noteName}
            />
          );
        })}
      </div>
      
      {/* Time markers */}
      <div className="absolute bottom-0 left-8 right-0 h-4 bg-muted/50 flex items-center justify-between px-2 border-t">
        <span className="text-[10px] font-mono text-muted-foreground">0:00</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="bg-background/80 px-1.5 py-0.5 rounded">
          {notes.length} нот
        </span>
      </div>
    </div>
  );
}
