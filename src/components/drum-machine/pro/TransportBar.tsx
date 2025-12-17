import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Play, Square, Circle, SkipBack, 
  Volume2, VolumeX, Settings2
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
    
    // Keep only last 4 taps
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
    
    // Calculate BPM from taps
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
    
    // Reset if no tap for 2 seconds
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

  // Format step display
  const currentBar = Math.floor(currentStep / 4) + 1;
  const currentBeat = (currentStep % 4) + 1;

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-xl',
        'bg-gradient-to-r from-background/95 via-card/90 to-background/95',
        'border border-border/50 backdrop-blur-sm',
        'shadow-lg shadow-black/10',
        className
      )}>
        {/* Transport Controls */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                disabled={!isReady}
                className="h-10 w-10 rounded-lg hover:bg-muted/50"
              >
                <SkipBack className="h-4 w-4" />
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
              'h-12 w-12 rounded-xl transition-all',
              isPlaying && 'bg-primary shadow-lg shadow-primary/30 animate-pulse'
            )}
          >
            {isPlaying ? (
              <Square className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
                onClick={onRecord}
                disabled={!isReady}
                className={cn(
                  'h-10 w-10 rounded-lg transition-all',
                  isRecording && 'animate-pulse shadow-lg shadow-destructive/30'
                )}
              >
                <Circle className={cn('h-4 w-4', isRecording && 'fill-current')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? 'Остановить запись' : 'Запись'}</TooltipContent>
          </Tooltip>
        </div>

        {/* Time Display */}
        <div className="flex flex-col items-center px-3 min-w-[70px]">
          <div className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {currentBar}.{currentBeat}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            BAR.BEAT
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-border/50" />

        {/* BPM Control */}
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onBpmChange(Math.max(40, bpm - 1))}
            >
              -
            </Button>
            <button
              onClick={handleTapTempo}
              className={cn(
                'font-mono text-2xl font-bold tracking-tight min-w-[60px] text-center transition-colors',
                'hover:text-primary cursor-pointer',
                showTapIndicator && 'text-primary'
              )}
            >
              {bpm}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => onBpmChange(Math.min(220, bpm + 1))}
            >
              +
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            BPM (TAP)
          </div>
        </div>

        {/* Swing Control */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <div className="flex items-center gap-2 w-full">
            <Slider
              value={[swing]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => onSwingChange(v)}
              className="w-16"
            />
            <span className="font-mono text-sm w-8 text-right">{swing}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            SWING
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-0.5">
          {Array.from({ length: stepLength }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-4 rounded-sm transition-all duration-75',
                i % 4 === 0 ? 'bg-muted' : 'bg-muted/40',
                isPlaying && i === currentStep && 'bg-primary shadow-sm shadow-primary/50'
              )}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-border/50" />

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMuteToggle}
                className="h-9 w-9 rounded-lg"
              >
                {isMuted || volume <= -40 ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? 'Включить звук' : 'Выключить звук'}</TooltipContent>
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
            className="w-20"
          />
        </div>

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Настройки</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

