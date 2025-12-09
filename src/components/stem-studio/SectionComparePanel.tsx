import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionCompareProps {
  originalUrl: string;
  replacedUrl: string;
  sectionStart: number;
  sectionEnd: number;
  originalLabel?: string;
  replacedLabel?: string;
}

export function SectionComparePanel({
  originalUrl,
  replacedUrl,
  sectionStart,
  sectionEnd,
  originalLabel = 'Оригинал',
  replacedLabel = 'Новая версия',
}: SectionCompareProps) {
  const [activeVersion, setActiveVersion] = useState<'original' | 'replaced'>('replaced');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const replacedRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const duration = sectionEnd - sectionStart;
  const activeAudio = activeVersion === 'original' ? originalRef.current : replacedRef.current;

  useEffect(() => {
    const origAudio = new Audio(originalUrl);
    const replAudio = new Audio(replacedUrl);
    
    const effectiveVolume = isMuted ? 0 : volume;
    origAudio.volume = effectiveVolume;
    replAudio.volume = effectiveVolume;
    
    originalRef.current = origAudio;
    replacedRef.current = replAudio;

    return () => {
      origAudio.pause();
      replAudio.pause();
    };
  }, [originalUrl, replacedUrl]);

  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    if (originalRef.current) originalRef.current.volume = effectiveVolume;
    if (replacedRef.current) replacedRef.current.volume = effectiveVolume;
  }, [volume, isMuted]);

  const updateProgress = useCallback(() => {
    if (activeAudio) {
      const progress = activeAudio.currentTime - sectionStart;
      setCurrentTime(Math.max(0, Math.min(progress, duration)));

      if (activeAudio.currentTime >= sectionEnd) {
        activeAudio.pause();
        activeAudio.currentTime = sectionStart;
        setIsPlaying(false);
        setCurrentTime(0);
      } else if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [activeAudio, sectionStart, sectionEnd, duration, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = async () => {
    if (!activeAudio) return;

    if (isPlaying) {
      activeAudio.pause();
      setIsPlaying(false);
    } else {
      activeAudio.currentTime = sectionStart + currentTime;
      await activeAudio.play();
      setIsPlaying(true);
    }
  };

  const switchVersion = (version: 'original' | 'replaced') => {
    if (version === activeVersion) return;

    if (activeAudio) {
      activeAudio.pause();
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveVersion(version);
  };

  const restart = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = sectionStart;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-muted/30 p-4 space-y-4 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
          >
            <Shuffle className="w-4 h-4 text-primary" />
          </motion.div>
          <h4 className="text-sm font-medium">A/B Сравнение</h4>
        </div>
        <Badge variant="outline" className="text-xs font-mono bg-background/50">
          {formatTime(sectionStart)} — {formatTime(sectionEnd)}
        </Badge>
      </div>

      {/* Version Toggle with visual indicator */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            onClick={() => switchVersion('original')}
            className={cn(
              'relative h-14 rounded-xl border-2 transition-all duration-200',
              'flex items-center justify-center gap-2',
              activeVersion === 'original'
                ? 'border-muted-foreground/50 bg-muted/50 shadow-lg'
                : 'border-border bg-card/50 hover:border-muted-foreground/30'
            )}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                activeVersion === 'original' 
                  ? 'bg-muted-foreground/20 text-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}
              animate={{ scale: activeVersion === 'original' ? 1.1 : 1 }}
            >
              A
            </motion.div>
            <span className={cn(
              'text-sm font-medium',
              activeVersion === 'original' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {originalLabel}
            </span>
            {activeVersion === 'original' && (
              <motion.div
                layoutId="versionIndicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground rounded-full"
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => switchVersion('replaced')}
            className={cn(
              'relative h-14 rounded-xl border-2 transition-all duration-200',
              'flex items-center justify-center gap-2',
              activeVersion === 'replaced'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-border bg-card/50 hover:border-primary/30'
            )}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                activeVersion === 'replaced' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              )}
              animate={{ scale: activeVersion === 'replaced' ? 1.1 : 1 }}
            >
              B
            </motion.div>
            <span className={cn(
              'text-sm font-medium',
              activeVersion === 'replaced' ? 'text-primary' : 'text-muted-foreground'
            )}>
              {replacedLabel}
            </span>
            {activeVersion === 'replaced' && (
              <motion.div
                layoutId="versionIndicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Waveform-like Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-10 bg-muted/30 rounded-lg overflow-hidden">
          {/* Waveform visualization placeholder */}
          <div className="absolute inset-0 flex items-center justify-around px-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  'w-1 rounded-full',
                  activeVersion === 'replaced' ? 'bg-primary/40' : 'bg-muted-foreground/40'
                )}
                style={{ height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}%` }}
                animate={isPlaying && (i / 40) * 100 <= progress ? {
                  scaleY: [1, 1.3, 1],
                  opacity: [0.4, 0.8, 0.4]
                } : {}}
                transition={{ duration: 0.3, delay: i * 0.02 }}
              />
            ))}
          </div>
          {/* Progress overlay */}
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0',
              activeVersion === 'replaced' ? 'bg-primary/20' : 'bg-muted-foreground/20'
            )}
            style={{ width: `${progress}%` }}
          />
          {/* Playhead */}
          <motion.div
            className={cn(
              'absolute top-0 bottom-0 w-0.5',
              activeVersion === 'replaced' ? 'bg-primary' : 'bg-muted-foreground'
            )}
            style={{ left: `${progress}%` }}
            animate={isPlaying ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </div>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration}
          step={0.1}
          onValueChange={(v) => {
            setCurrentTime(v[0]);
            if (activeAudio) {
              activeAudio.currentTime = sectionStart + v[0];
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="h-10 w-10 rounded-full"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          animate={isPlaying ? { 
            boxShadow: `0 0 20px hsl(var(--${activeVersion === 'replaced' ? 'primary' : 'foreground'}) / 0.3)` 
          } : {}}
        >
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className={cn(
              "h-12 w-12 rounded-full",
              activeVersion === 'replaced' ? 'bg-primary hover:bg-primary/90' : ''
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isPlaying ? 'pause' : 'play'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </motion.div>
            </AnimatePresence>
          </Button>
        </motion.div>

        <div className="flex items-center gap-2 flex-1">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMuted(!isMuted)}
              className="h-10 w-10 rounded-full"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </motion.div>
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => {
              setVolume(v[0]);
              if (v[0] > 0 && isMuted) setIsMuted(false);
            }}
            className="flex-1 max-w-[100px]"
          />
        </div>
      </div>
    </motion.div>
  );
}
