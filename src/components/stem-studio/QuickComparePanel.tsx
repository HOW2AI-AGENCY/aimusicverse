import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickComparePanelProps {
  originalAudioUrl: string;
  replacementAudioUrl: string;
  sectionStart: number;
  sectionEnd: number;
  onApply: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function QuickComparePanel({
  originalAudioUrl,
  replacementAudioUrl,
  sectionStart,
  sectionEnd,
  onApply,
  onDiscard,
  onClose,
}: QuickComparePanelProps) {
  const [activeVersion, setActiveVersion] = useState<'original' | 'new'>('new');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(sectionStart);
  const [volume, setVolume] = useState(0.8);
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const newRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sectionDuration = sectionEnd - sectionStart;

  // Initialize audio elements
  useEffect(() => {
    originalRef.current = new Audio(originalAudioUrl);
    newRef.current = new Audio(replacementAudioUrl);

    originalRef.current.volume = volume;
    newRef.current.volume = volume;

    return () => {
      originalRef.current?.pause();
      newRef.current?.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [originalAudioUrl, replacementAudioUrl]);

  // Update volume
  useEffect(() => {
    if (originalRef.current) originalRef.current.volume = volume;
    if (newRef.current) newRef.current.volume = volume;
  }, [volume]);

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

    // Pause other audio
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="border-b border-success/30 bg-gradient-to-r from-success/5 via-background to-success/5 overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                ✓ Секция заменена
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(sectionStart)} - {formatTime(sectionEnd)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Version Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeVersion === 'original' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 h-10 text-sm font-medium',
                activeVersion === 'original' && 'bg-muted text-foreground'
              )}
              onClick={() => switchVersion('original')}
            >
              <span className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs mr-2">
                A
              </span>
              Оригинал
            </Button>
            <Button
              variant={activeVersion === 'new' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 h-10 text-sm font-medium',
                activeVersion === 'new' && 'bg-primary text-primary-foreground'
              )}
              onClick={() => switchVersion('new')}
            >
              <span className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs mr-2">
                B
              </span>
              Новая версия
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              min={sectionStart}
              max={sectionEnd}
              step={0.1}
              onValueChange={([time]) => {
                const audio = activeVersion === 'original' ? originalRef.current : newRef.current;
                if (audio) {
                  audio.currentTime = time;
                  setCurrentTime(time);
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(sectionEnd)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={restart} className="h-9 w-9">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={togglePlay}
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <div className="flex items-center gap-2 ml-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => setVolume(v)}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDiscard}
                className="h-9 gap-1 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
                Отменить
              </Button>
              <Button
                size="sm"
                onClick={onApply}
                className="h-9 gap-1 bg-success hover:bg-success/90"
              >
                <Check className="w-4 h-4" />
                Применить
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
