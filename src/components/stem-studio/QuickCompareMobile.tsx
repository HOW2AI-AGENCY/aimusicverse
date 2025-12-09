/**
 * Mobile-optimized A/B comparison panel for replaced sections
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RotateCcw, Check, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

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
  const haptic = useHapticFeedback();
  
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
    
    haptic.tap();
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
    
    haptic.select();

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
    haptic.tap();
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

  // Generate waveform bars
  const waveformBars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const base = 30;
      const variation = Math.sin(i * 0.4) * 20 + Math.cos(i * 0.8) * 15;
      return Math.max(15, Math.min(80, base + variation + ((i * 7919) % 100) / 100 * 10));
    });
  }, []);

  const handleApply = () => {
    haptic.success();
    onApply();
    onOpenChange(false);
  };

  const handleDiscard = () => {
    haptic.warning();
    onDiscard();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-center">
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Секция заменена
            </motion.span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 space-y-6 pb-8">
          {/* Time info */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-muted-foreground font-mono"
          >
            {formatTime(sectionStart)} — {formatTime(sectionEnd)}
          </motion.div>

          {/* Large Version Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <motion.button
              onClick={() => switchVersion('original')}
              className={cn(
                'relative h-24 rounded-2xl border-2 transition-all duration-200',
                'flex flex-col items-center justify-center gap-2',
                activeVersion === 'original'
                  ? 'border-muted-foreground/50 bg-muted/50 shadow-lg'
                  : 'border-border bg-card hover:border-border/80'
              )}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span 
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                  activeVersion === 'original' 
                    ? 'bg-muted-foreground/20 text-foreground' 
                    : 'bg-muted text-muted-foreground'
                )}
                animate={{ scale: activeVersion === 'original' ? 1.1 : 1 }}
              >
                A
              </motion.span>
              <span className={cn(
                'text-sm font-medium',
                activeVersion === 'original' ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Оригинал
              </span>
              {activeVersion === 'original' && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-foreground rounded-full"
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => switchVersion('new')}
              className={cn(
                'relative h-24 rounded-2xl border-2 transition-all duration-200',
                'flex flex-col items-center justify-center gap-2',
                activeVersion === 'new'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-border bg-card hover:border-border/80'
              )}
              whileTap={{ scale: 0.97 }}
            >
              <motion.span 
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                  activeVersion === 'new' 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                )}
                animate={{ scale: activeVersion === 'new' ? 1.1 : 1 }}
              >
                B
              </motion.span>
              <span className={cn(
                'text-sm font-medium',
                activeVersion === 'new' ? 'text-primary' : 'text-muted-foreground'
              )}>
                Новая
              </span>
              {activeVersion === 'new' && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full"
                />
              )}
            </motion.button>
          </motion.div>

          {/* Waveform Progress Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="relative h-14 bg-muted/30 rounded-xl overflow-hidden">
              {/* Waveform visualization */}
              <div className="absolute inset-0 flex items-center justify-around px-2">
                {waveformBars.map((height, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      'w-1.5 rounded-full',
                      activeVersion === 'new' ? 'bg-primary/40' : 'bg-muted-foreground/40'
                    )}
                    style={{ height: `${height}%` }}
                    animate={isPlaying && (i / waveformBars.length) * 100 <= progress ? {
                      scaleY: [1, 1.4, 1],
                      opacity: [0.4, 0.9, 0.4]
                    } : {}}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                  />
                ))}
              </div>
              {/* Progress overlay */}
              <motion.div
                className={cn(
                  'absolute inset-y-0 left-0',
                  activeVersion === 'new' ? 'bg-primary/20' : 'bg-muted-foreground/20'
                )}
                style={{ width: `${progress}%` }}
              />
              {/* Playhead */}
              <motion.div
                className={cn(
                  'absolute top-0 bottom-0 w-1',
                  activeVersion === 'new' ? 'bg-primary' : 'bg-muted-foreground'
                )}
                style={{ left: `${progress}%` }}
                animate={isPlaying ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-mono px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(sectionEnd)}</span>
            </div>
          </motion.div>

          {/* Playback Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={restart}
                className="h-14 w-14 rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.95 }}
              animate={isPlaying ? { 
                boxShadow: `0 0 30px hsl(var(--${activeVersion === 'new' ? 'primary' : 'foreground'}) / 0.4)` 
              } : {}}
            >
              <Button
                onClick={togglePlay}
                size="icon"
                className={cn(
                  "h-18 w-18 rounded-full shadow-xl",
                  activeVersion === 'new' ? 'bg-primary hover:bg-primary/90' : ''
                )}
                style={{ width: 72, height: 72 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isPlaying ? 'pause' : 'play'}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-14 w-14 rounded-full"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3 pt-4"
          >
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="w-full h-14 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              >
                <X className="w-5 h-5" />
                Отменить
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleApply}
                className="w-full h-14 rounded-xl bg-success hover:bg-success/90 gap-2 shadow-lg shadow-success/20"
              >
                <Check className="w-5 h-5" />
                Применить
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
