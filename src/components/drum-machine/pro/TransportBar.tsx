import React, { memo, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, Square, Circle, SkipBack, 
  Volume2, VolumeX, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  swing: number;
  volume: number;
  currentStep: number;
  stepLength: number;
  isReady: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onBpmChange: (bpm: number) => void;
  onSwingChange: (swing: number) => void;
  onVolumeChange: (volume: number) => void;
  onReset: () => void;
  className?: string;
}

export const TransportBar = memo(function TransportBar({
  isPlaying,
  isRecording,
  bpm,
  swing,
  volume,
  currentStep,
  stepLength,
  isReady,
  onPlay,
  onStop,
  onRecord,
  onBpmChange,
  onSwingChange,
  onVolumeChange,
  onReset,
  className
}: TransportBarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const tapTimesRef = useRef<number[]>([]);
  const [showTapIndicator, setShowTapIndicator] = useState(false);

  // Tap tempo logic
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
    
    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      
      if (newBpm >= 40 && newBpm <= 220) {
        onBpmChange(newBpm);
      }
    }
    
    setShowTapIndicator(true);
    setTimeout(() => setShowTapIndicator(false), 100);
    
    setTimeout(() => {
      if (Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1] > 2000) {
        tapTimesRef.current = [];
      }
    }, 2000);
  }, [onBpmChange]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      onVolumeChange(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(-60);
      setIsMuted(true);
    }
  }, [isMuted, volume, prevVolume, onVolumeChange]);

  const currentBar = Math.floor(currentStep / 4) + 1;
  const currentBeat = (currentStep % 4) + 1;

  return (
    <TooltipProvider>
      <div className={cn(
        'flex flex-wrap items-center gap-3 p-4 rounded-2xl',
        'bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--muted)/0.3)]',
        'border border-border/40',
        'shadow-xl shadow-black/20',
        className
      )}>
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                disabled={!isReady}
                className="h-11 w-11 rounded-xl bg-muted/50 hover:bg-muted"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Сброс</TooltipContent>
          </Tooltip>

          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="icon"
            onClick={isPlaying ? onStop : onPlay}
            disabled={!isReady}
            className={cn(
              'h-14 w-14 rounded-2xl transition-all',
              isPlaying 
                ? 'bg-primary shadow-lg shadow-primary/40' 
                : 'bg-muted/50 border-2 border-primary/50 hover:border-primary'
            )}
          >
            {isPlaying ? (
              <Square className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'destructive' : 'ghost'}
                size="icon"
                onClick={onRecord}
                disabled={!isReady}
                className={cn(
                  'h-11 w-11 rounded-xl transition-all',
                  isRecording 
                    ? 'bg-destructive shadow-lg shadow-destructive/40 animate-pulse' 
                    : 'bg-muted/50 hover:bg-destructive/20'
                )}
              >
                <Circle className={cn('h-5 w-5', isRecording && 'fill-current')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? 'Стоп' : 'Запись'}</TooltipContent>
          </Tooltip>
        </div>

        {/* LED Display Panel */}
        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-black/40 border border-white/10">
          {/* Time Display */}
          <div className="flex flex-col items-center">
            <div className="font-mono text-3xl font-bold tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              {currentBar}.{currentBeat}
            </div>
            <div className="text-[9px] text-emerald-400/60 uppercase tracking-widest">
              BAR.BEAT
            </div>
          </div>

          <div className="h-10 w-px bg-white/10" />

          {/* BPM Display */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-400/60 hover:text-emerald-400"
                onClick={() => onBpmChange(Math.max(40, bpm - 1))}
              >
                −
              </Button>
              <button
                onClick={handleTapTempo}
                className={cn(
                  'font-mono text-3xl font-bold tracking-tight min-w-[70px] text-center transition-colors cursor-pointer',
                  'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]',
                  showTapIndicator && 'text-white'
                )}
              >
                {bpm}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-400/60 hover:text-emerald-400"
                onClick={() => onBpmChange(Math.min(220, bpm + 1))}
              >
                +
              </Button>
            </div>
            <div className="text-[9px] text-emerald-400/60 uppercase tracking-widest">
              BPM • TAP
            </div>
          </div>
        </div>

        {/* Swing Control */}
        <div className="flex flex-col gap-1.5 min-w-[100px]">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Swing</span>
          </div>
          <div className="flex items-center gap-2">
            <Slider
              value={[swing]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => onSwingChange(v)}
              className="flex-1"
            />
            <span className="font-mono text-xs w-10 text-right text-muted-foreground">{swing}%</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-4" />

        {/* Step LED Indicator - Desktop */}
        <div className="hidden lg:flex items-center gap-1 px-3 py-2 rounded-xl bg-black/30 border border-white/5">
          {Array.from({ length: Math.min(stepLength, 16) }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-5 rounded-sm transition-all duration-75',
                i % 4 === 0 ? 'ml-1 first:ml-0' : '',
                isPlaying && i === currentStep 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                  : i % 4 === 0 
                    ? 'bg-muted/60' 
                    : 'bg-muted/30'
              )}
            />
          ))}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                className="h-9 w-9 rounded-lg"
              >
                {isMuted || volume <= -40 ? (
                  <VolumeX className="h-4 w-4 text-destructive" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Вкл' : 'Выкл'}</TooltipContent>
          </Tooltip>
          <Slider
            value={[isMuted ? -60 : volume]}
            min={-40}
            max={0}
            step={1}
            onValueChange={([v]) => {
              onVolumeChange(v);
              if (isMuted) setIsMuted(false);
            }}
            className="w-24"
          />
        </div>
      </div>
    </TooltipProvider>
  );
});

