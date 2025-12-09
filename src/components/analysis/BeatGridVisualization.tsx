import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BeatData {
  time: number;
  beatNumber: number;
}

interface BeatGridVisualizationProps {
  beats: BeatData[];
  downbeats: number[];
  duration: number;
  bpm: number;
  timeSignature: string;
  height?: number;
  className?: string;
  currentTime?: number;
}

export function BeatGridVisualization({
  beats,
  downbeats,
  duration,
  bpm,
  timeSignature,
  height = 60,
  className,
  currentTime = 0,
}: BeatGridVisualizationProps) {
  const beatsPerMeasure = useMemo(() => {
    const sig = timeSignature.split('/');
    return parseInt(sig[0]) || 4;
  }, [timeSignature]);

  const measures = useMemo(() => {
    if (downbeats.length < 2) return [];
    
    return downbeats.map((startTime, i) => ({
      startTime,
      endTime: downbeats[i + 1] || duration,
      measureNumber: i + 1,
    }));
  }, [downbeats, duration]);

  if (beats.length === 0) {
    return (
      <div 
        className={cn(
          "rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm",
          className
        )}
        style={{ height }}
      >
        Нет данных о ритме
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* BPM and Time Signature */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">BPM:</span>
          <span className="font-mono font-semibold text-primary">{bpm}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Размер:</span>
          <span className="font-mono font-semibold">{timeSignature}</span>
        </div>
      </div>
      
      {/* Beat grid */}
      <div 
        className="relative rounded-lg bg-background/50 border overflow-hidden"
        style={{ height }}
      >
        {/* Measure backgrounds */}
        {measures.map((measure, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-0 bottom-0",
              i % 2 === 0 ? "bg-muted/20" : "bg-transparent"
            )}
            style={{
              left: `${(measure.startTime / duration) * 100}%`,
              width: `${((measure.endTime - measure.startTime) / duration) * 100}%`,
            }}
          >
            <span className="absolute top-0.5 left-1 text-[10px] text-muted-foreground">
              {measure.measureNumber}
            </span>
          </div>
        ))}
        
        {/* Beat markers */}
        {beats.map((beat, i) => {
          const isDownbeat = beat.beatNumber === 1;
          const isPast = beat.time < currentTime;
          const isActive = Math.abs(beat.time - currentTime) < 0.1;
          
          return (
            <div
              key={i}
              className={cn(
                "absolute top-0 bottom-0 w-px transition-all",
                isDownbeat ? "bg-primary" : "bg-muted-foreground/40",
                isPast && "opacity-50",
                isActive && "bg-primary w-1 shadow-glow"
              )}
              style={{ left: `${(beat.time / duration) * 100}%` }}
            >
              {/* Beat number indicator */}
              <div 
                className={cn(
                  "absolute bottom-1 -translate-x-1/2 text-[10px] font-mono",
                  isDownbeat ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {beat.beatNumber}
              </div>
            </div>
          );
        })}
        
        {/* Playhead */}
        {currentTime > 0 && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}
        
        {/* Beat number legend */}
        <div className="absolute top-1 right-1 flex gap-1">
          {Array.from({ length: beatsPerMeasure }, (_, i) => (
            <div
              key={i}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono",
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
