/**
 * Audio preview player for selected section
 * Plays only the selected range with loop option
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

interface SectionPreviewPlayerProps {
  audioUrl: string;
  startTime: number;
  endTime: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function SectionPreviewPlayer({
  audioUrl,
  startTime,
  endTime,
  onTimeUpdate,
  className,
}: SectionPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const duration = endTime - startTime;
  const progress = duration > 0 ? ((currentTime - startTime) / duration) * 100 : 0;

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleCanPlay = () => setIsLoaded(true);
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = startTime;
        audio.play();
      } else {
        setIsPlaying(false);
        setCurrentTime(startTime);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Handle time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Stop or loop when reaching end of section
      if (time >= endTime) {
        if (isLooping) {
          audio.currentTime = startTime;
        } else {
          audio.pause();
          setIsPlaying(false);
          audio.currentTime = startTime;
          setCurrentTime(startTime);
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime, isLooping, onTimeUpdate]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Reset position when selection changes
  useEffect(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  }, [startTime, endTime]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure we start from the section start if outside range
      if (audio.currentTime < startTime || audio.currentTime >= endTime) {
        audio.currentTime = startTime;
      }
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Playback failed silently
      }
    }
  }, [isPlaying, isLoaded, startTime, endTime]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = startTime;
    setCurrentTime(startTime);
    
    if (!isPlaying && isLoaded) {
      audio.play();
      setIsPlaying(true);
    }
  }, [startTime, isPlaying, isLoaded]);

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-gradient-to-r from-muted/50 to-muted/30",
        "border border-border/50",
        className
      )}>
        {/* Play/Pause Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full relative",
                isPlaying && "bg-primary shadow-lg shadow-primary/30"
              )}
              onClick={togglePlay}
              disabled={!isLoaded}
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                  >
                    <Pause className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                  >
                    <Play className="w-5 h-5 ml-0.5" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Playing animation ring */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPlaying ? 'Пауза' : 'Прослушать секцию'}
          </TooltipContent>
        </Tooltip>

        {/* Restart Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={restart}
              disabled={!isLoaded}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Сначала</TooltipContent>
        </Tooltip>

        {/* Progress Section */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">
              {formatTime(currentTime - startTime)} / {formatTime(duration)}
            </span>
            <span className="text-muted-foreground">
              Секция: {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                isPlaying 
                  ? "bg-gradient-to-r from-primary to-primary/70" 
                  : "bg-primary/70"
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Animated glow when playing */}
            {isPlaying && (
              <motion.div
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ left: ['-10%', '110%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </div>

        {/* Loop Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={isLooping}
              onPressedChange={setIsLooping}
              size="sm"
              className={cn(
                "h-8 w-8",
                isLooping && "text-primary bg-primary/10"
              )}
            >
              <Repeat className="w-4 h-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {isLooping ? 'Повтор включён' : 'Включить повтор'}
          </TooltipContent>
        </Tooltip>

        {/* Volume Control */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? 'Включить звук' : 'Выключить звук'}
            </TooltipContent>
          </Tooltip>
          
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={([v]) => {
              setVolume(v / 100);
              if (v > 0) setIsMuted(false);
            }}
            max={100}
            step={1}
            className="w-16"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
