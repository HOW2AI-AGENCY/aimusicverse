/**
 * Mobile-optimized A/B comparison panel for replaced sections
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface QuickCompareMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalAudioUrl: string;
  replacementAudioUrl: string;
  sectionStart: number;
  sectionEnd: number;
  onApply: () => void;
  onDiscard: () => void;
}

export function QuickCompareMobile({
  open,
  onOpenChange,
  originalAudioUrl,
  replacementAudioUrl,
  sectionStart,
  sectionEnd,
  onApply,
  onDiscard,
}: QuickCompareMobileProps) {
  const [activeVersion, setActiveVersion] = useState<'original' | 'new'>('new');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(sectionStart);
  const [isMuted, setIsMuted] = useState(false);
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const newRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sectionDuration = sectionEnd - sectionStart;

  // Initialize audio elements
  useEffect(() => {
    if (!open) return;
    
    originalRef.current = new Audio(originalAudioUrl);
    newRef.current = new Audio(replacementAudioUrl);

    return () => {
      originalRef.current?.pause();
      newRef.current?.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [originalAudioUrl, replacementAudioUrl, open]);

  // Update mute state
  useEffect(() => {
    if (originalRef.current) originalRef.current.muted = isMuted;
    if (newRef.current) newRef.current.muted = isMuted;
  }, [isMuted]);

  const updateProgress = useCallback(() => {
    const audio = activeVersion === 'original' ? originalRef.current : newRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= sectionEnd) {
        audio.pause();
        audio.currentTime = sectionStart;
        setIsPlaying(false);
        setCurrentTime(sectionStart);
      } else if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [activeVersion, isPlaying, sectionEnd, sectionStart]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = async () => {
    const audio = activeVersion === 'original' ? originalRef.current : newRef.current;
    const other = activeVersion === 'original' ? newRef.current : originalRef.current;

    if (!audio) return;

    other?.pause();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio.currentTime < sectionStart || audio.currentTime >= sectionEnd) {
        audio.currentTime = sectionStart;
      }
      await audio.play();
      setIsPlaying(true);
    }
  };

  const switchVersion = (version: 'original' | 'new') => {
    if (version === activeVersion) return;

    const currentAudio = activeVersion === 'original' ? originalRef.current : newRef.current;
    const newAudio = version === 'original' ? originalRef.current : newRef.current;

    currentAudio?.pause();
    
    if (newAudio) {
      newAudio.currentTime = currentTime;
    }

    setActiveVersion(version);
    setIsPlaying(false);
  };

  const restart = () => {
    const audio = activeVersion === 'original' ? originalRef.current : newRef.current;
    if (audio) {
      audio.currentTime = sectionStart;
      setCurrentTime(sectionStart);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentTime - sectionStart) / sectionDuration) * 100;

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm">
              ✓ Секция заменена
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 space-y-6 pb-8">
          {/* Time info */}
          <div className="text-center text-sm text-muted-foreground">
            {formatTime(sectionStart)} - {formatTime(sectionEnd)}
          </div>

          {/* Large Version Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => switchVersion('original')}
              className={cn(
                'relative h-20 rounded-2xl border-2 transition-all duration-200',
                'flex flex-col items-center justify-center gap-1',
                activeVersion === 'original'
                  ? 'border-muted-foreground/50 bg-muted/50'
                  : 'border-border bg-card hover:border-border/80'
              )}
            >
              <span className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                activeVersion === 'original' 
                  ? 'bg-muted-foreground/20 text-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                A
              </span>
              <span className={cn(
                'text-sm font-medium',
                activeVersion === 'original' ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Оригинал
              </span>
              {activeVersion === 'original' && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => switchVersion('new')}
              className={cn(
                'relative h-20 rounded-2xl border-2 transition-all duration-200',
                'flex flex-col items-center justify-center gap-1',
                activeVersion === 'new'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-border/80'
              )}
            >
              <span className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                activeVersion === 'new' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}>
                B
              </span>
              <span className={cn(
                'text-sm font-medium',
                activeVersion === 'new' ? 'text-primary' : 'text-muted-foreground'
              )}>
                Новая
              </span>
              {activeVersion === 'new' && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  activeVersion === 'new' ? 'bg-primary' : 'bg-muted-foreground'
                )}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(sectionEnd)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={restart}
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-12 w-12 rounded-full"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="h-14 rounded-xl text-destructive hover:text-destructive gap-2"
            >
              <X className="w-5 h-5" />
              Отменить
            </Button>
            <Button
              onClick={handleApply}
              className="h-14 rounded-xl bg-success hover:bg-success/90 gap-2"
            >
              <Check className="w-5 h-5" />
              Применить
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
