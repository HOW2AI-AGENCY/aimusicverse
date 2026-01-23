import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { chordColors, getChordColor as getDesignChordColor } from '@/lib/design-colors';

interface ChordData {
  chord: string;
  startTime: number;
  endTime: number;
}

interface ChordProgressionDisplayProps {
  chords: ChordData[];
  duration: number;
  className?: string;
  currentTime?: number;
  showTimeline?: boolean;
}

// Use centralized chord colors from design tokens
function getChordColor(chord: string): string {
  return getDesignChordColor(chord);
}

export function ChordProgressionDisplay({
  chords,
  duration,
  className,
  currentTime = 0,
  showTimeline = true,
}: ChordProgressionDisplayProps) {
  const uniqueChords = useMemo(() => {
    return [...new Set(chords.map(c => c.chord))];
  }, [chords]);

  const progressionString = useMemo(() => {
    return uniqueChords.join(' - ');
  }, [uniqueChords]);

  const currentChord = useMemo(() => {
    return chords.find(c => c.startTime <= currentTime && c.endTime > currentTime);
  }, [chords, currentTime]);

  if (chords.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        Аккорды не обнаружены
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Chord progression summary */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Прогрессия аккордов</p>
        <div className="flex flex-wrap gap-2">
          {uniqueChords.map((chord, i) => (
            <Badge
              key={i}
              variant="outline"
              className={cn(
                "text-sm font-mono transition-all",
                getChordColor(chord),
                currentChord?.chord === chord && "ring-2 ring-primary scale-110"
              )}
            >
              {chord}
            </Badge>
          ))}
        </div>
      </div>

      {/* Timeline visualization */}
      {showTimeline && (
        <div className="relative h-10 rounded-lg bg-background/50 border overflow-hidden">
          {chords.map((chord, i) => {
            const isActive = chord.startTime <= currentTime && chord.endTime > currentTime;
            const isPast = chord.endTime < currentTime;
            
            return (
              <div
                key={i}
                className={cn(
                  "absolute top-0 bottom-0 flex items-center justify-center",
                  "border-r border-border/50 transition-all",
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
      )}

      {/* Current chord highlight */}
      {currentChord && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Сейчас:</span>
          <Badge 
            className={cn(
              "text-lg font-mono font-bold animate-pulse",
              getChordColor(currentChord.chord)
            )}
          >
            {currentChord.chord}
          </Badge>
        </div>
      )}

      {/* Progression text */}
      <p className="text-xs text-muted-foreground font-mono">
        {progressionString}
      </p>
    </div>
  );
}
