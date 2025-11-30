import { Card } from '@/components/ui/card';
import { AudioAnalysis } from '@/hooks/useAudioAnalysis';
import { Music2, Play, Pause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeatsVisualizationProps {
  analysis: AudioAnalysis;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
}

export function BeatsVisualization({ 
  analysis, 
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  onPlayPause
}: BeatsVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBeat, setHoveredBeat] = useState<number | null>(null);

  // Parse beats data
  const beats = analysis.beats_data as Array<{ time: number; beat: number }> | null;

  if (!beats || beats.length === 0) {
    return null;
  }

  // Calculate track duration from last beat or use provided duration
  const trackDuration = duration > 0 ? duration : (beats[beats.length - 1]?.time || 100);

  // Group beats by measure (assuming 4 beats per measure)
  const measures: number[] = [];
  beats.forEach(beat => {
    if (beat.beat === 1) {
      measures.push(beat.time);
    }
  });

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onSeek) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * trackDuration;
    
    onSeek(time);
  };

  const handleBeatClick = (beatTime: number) => {
    if (onSeek) {
      onSeek(beatTime);
    }
  };

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-semibold">Визуализация битов</h4>
          </div>
          {onPlayPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPlayPause}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Пауза</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Играть</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Всего битов</div>
            <div className="text-2xl font-bold">{beats.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Тактов</div>
            <div className="text-2xl font-bold">{measures.length}</div>
          </div>
          {analysis.bpm && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">BPM</div>
              <div className="text-2xl font-bold">{Math.round(analysis.bpm)}</div>
            </div>
          )}
        </div>

        {/* Interactive Timeline */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Кликните на бит для навигации</span>
            <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {Math.floor(trackDuration / 60)}:{String(Math.floor(trackDuration % 60)).padStart(2, '0')}</span>
          </div>

          <div 
            ref={containerRef}
            className="relative h-24 bg-muted/30 rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-colors"
            onClick={handleTimelineClick}
          >
            {/* Measures (bars) background */}
            {measures.map((measureTime, i) => (
              <div
                key={`measure-${i}`}
                className="absolute top-0 bottom-0 border-l border-border/30"
                style={{
                  left: `${(measureTime / trackDuration) * 100}%`
                }}
              />
            ))}

            {/* Beats */}
            {beats.map((beat, i) => {
              const position = (beat.time / trackDuration) * 100;
              const isDownbeat = beat.beat === 1;
              const isPassed = beat.time <= currentTime;
              const isHovered = hoveredBeat === i;
              
              return (
                <div
                  key={`beat-${i}`}
                  className={`absolute top-0 bottom-0 transition-all ${
                    isDownbeat 
                      ? 'w-1 bg-primary' 
                      : 'w-0.5 bg-primary/60'
                  } ${
                    isPassed ? 'opacity-100' : 'opacity-30'
                  } ${
                    isHovered ? 'scale-y-110 opacity-100' : ''
                  }`}
                  style={{
                    left: `${position}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBeatClick(beat.time);
                  }}
                  onMouseEnter={() => setHoveredBeat(i)}
                  onMouseLeave={() => setHoveredBeat(null)}
                >
                  {/* Beat number label for downbeats */}
                  {isDownbeat && isHovered && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium bg-background border border-border px-2 py-1 rounded whitespace-nowrap">
                      {beat.time.toFixed(2)}s
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current time indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
              style={{
                left: `${(currentTime / trackDuration) * 100}%`
              }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full border-2 border-background shadow-lg" />
            </div>

            {/* Waveform-like gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/5 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Beat pattern preview */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {beats.slice(0, 32).map((beat, i) => (
            <div
              key={`preview-${i}`}
              className={`flex-shrink-0 w-2 rounded-sm transition-all ${
                beat.beat === 1 
                  ? 'h-6 bg-primary' 
                  : 'h-4 bg-primary/60'
              } ${
                beat.time <= currentTime ? 'opacity-100' : 'opacity-20'
              }`}
            />
          ))}
          {beats.length > 32 && (
            <span className="text-xs text-muted-foreground ml-2">
              +{beats.length - 32} битов
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
