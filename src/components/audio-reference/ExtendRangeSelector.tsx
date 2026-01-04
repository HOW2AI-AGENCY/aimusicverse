/**
 * ExtendRangeSelector - Compact range selector for extend mode
 * 
 * Shows a waveform with a single draggable handle to set "continue from" point
 * Automatically defaults to near the end of the audio for seamless extension
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Scissors, ArrowRight } from 'lucide-react';

interface ExtendRangeSelectorProps {
  audioUrl: string;
  duration: number;
  continueAt: number;
  onContinueAtChange: (time: number) => void;
  minTime?: number; // Minimum time from start
  maxTime?: number; // Maximum time (should be less than duration)
  height?: number;
  className?: string;
}

export const ExtendRangeSelector = memo(function ExtendRangeSelector({
  audioUrl,
  duration,
  continueAt,
  onContinueAtChange,
  minTime = 5, // At least 5 seconds into the track
  maxTime,
  height = 48,
  className,
}: ExtendRangeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate effective max (should be close to end but not at the very end)
  const effectiveMaxTime = maxTime ?? Math.max(minTime + 1, duration - 2);
  
  // Clamp continueAt to valid range
  const clampedContinueAt = Math.max(minTime, Math.min(effectiveMaxTime, continueAt));
  const continuePercent = duration > 0 ? (clampedContinueAt / duration) * 100 : 80;

  // Generate waveform data from audio
  useEffect(() => {
    if (!audioUrl) return;
    
    let mounted = true;
    
    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Compact view needs fewer bars
        const blockSize = Math.floor(rawData.length / samples);
        const data: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          data.push(sum / blockSize);
        }
        
        const max = Math.max(...data, 0.001);
        const normalized = data.map(d => Math.max(0.15, Math.pow(d / max, 0.7)));
        
        if (mounted) {
          setWaveformData(normalized);
        }
        audioContext.close();
      } catch {
        // Fallback waveform
        if (mounted) {
          const fallback = Array.from({ length: 100 }, (_, i) => 
            Math.max(0.2, Math.min(0.9, 0.4 + Math.sin(i * 0.15) * 0.25 + Math.random() * 0.15))
          );
          setWaveformData(fallback);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    generateWaveform();
    
    return () => { mounted = false; };
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0 || duration <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasHeight = rect.height;
    const barWidth = width / waveformData.length;
    const cutPercent = clampedContinueAt / duration;

    ctx.clearRect(0, 0, width, canvasHeight);

    // Draw bars - before cut point (kept) vs after (extended)
    waveformData.forEach((value, i) => {
      const x = i * barWidth;
      const barHeight = value * (canvasHeight * 0.75);
      const y = (canvasHeight - barHeight) / 2;
      const percent = i / waveformData.length;
      
      if (percent < cutPercent) {
        // Before cut - this audio will be kept
        ctx.fillStyle = 'hsl(var(--primary))';
      } else {
        // After cut - this will be extended/replaced
        ctx.fillStyle = 'hsl(var(--primary) / 0.25)';
      }
      
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y, Math.max(1, barWidth - 1), barHeight, 1);
      ctx.fill();
    });

    // Draw cut line
    const cutX = cutPercent * width;
    ctx.strokeStyle = 'hsl(var(--destructive))';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(cutX, 0);
    ctx.lineTo(cutX, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [waveformData, clampedContinueAt, duration]);

  // Handle slider change
  const handleSliderChange = useCallback((value: number[]) => {
    const newTime = Math.max(minTime, Math.min(effectiveMaxTime, value[0]));
    onContinueAtChange(newTime);
  }, [minTime, effectiveMaxTime, onContinueAtChange]);

  // Handle click on waveform
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || duration <= 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;
    
    const clampedTime = Math.max(minTime, Math.min(effectiveMaxTime, time));
    onContinueAtChange(clampedTime);
  }, [duration, minTime, effectiveMaxTime, onContinueAtChange]);

  // Calculate extension length
  const extensionLength = duration - clampedContinueAt;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Scissors className="w-3 h-3" />
          <span>Продолжить с:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTime(clampedContinueAt)}
          </span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <ArrowRight className="w-2.5 h-2.5" />
          +{extensionLength.toFixed(0)}с новой музыки
        </Badge>
      </div>

      {/* Waveform visualization */}
      <div 
        ref={containerRef}
        className={cn(
          "relative rounded-lg overflow-hidden bg-muted/30 border border-border/50 cursor-pointer",
          isDragging && "ring-1 ring-primary/50"
        )}
        style={{ height }}
        onClick={handleClick}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 40}%`,
                  animationDelay: `${i * 100}ms` 
                }}
              />
            ))}
          </div>
        ) : (
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        )}
        
        {/* Keep/Extend labels */}
        {!isLoading && (
          <>
            <div 
              className="absolute top-0.5 left-1 text-[9px] font-medium text-primary/70"
              style={{ maxWidth: `${continuePercent - 2}%` }}
            >
              Оригинал
            </div>
            <div 
              className="absolute top-0.5 right-1 text-[9px] font-medium text-blue-500/70"
            >
              Расширение
            </div>
          </>
        )}
      </div>

      {/* Slider for precise control */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] text-muted-foreground w-8 tabular-nums">
          {formatTime(minTime)}
        </span>
        <Slider
          value={[clampedContinueAt]}
          min={minTime}
          max={effectiveMaxTime}
          step={0.5}
          onValueChange={handleSliderChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          className="flex-1"
        />
        <span className="text-[10px] text-muted-foreground w-8 tabular-nums text-right">
          {formatTime(effectiveMaxTime)}
        </span>
      </div>
    </div>
  );
});
