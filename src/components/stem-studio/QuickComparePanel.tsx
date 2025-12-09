import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RotateCcw, Check, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

const panelVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const }
  },
};

const buttonVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
};

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
  const [isMuted, setIsMuted] = useState(false);
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const newRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const { tap, success, select } = useHapticFeedback();

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

  // Update volume and mute
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    if (originalRef.current) originalRef.current.volume = effectiveVolume;
    if (newRef.current) newRef.current.volume = effectiveVolume;
  }, [volume, isMuted]);

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
    tap();

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
    select();

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
    tap();
    const audio = activeVersion === 'original' ? originalRef.current : newRef.current;
    if (audio) {
      audio.currentTime = sectionStart;
      setCurrentTime(sectionStart);
    }
  };

  const toggleMute = () => {
    tap();
    setIsMuted(!isMuted);
  };

  const handleApply = () => {
    success();
    onApply();
  };

  const handleDiscard = () => {
    tap();
    onDiscard();
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
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
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
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                variant={activeVersion === 'original' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'w-full h-10 text-sm font-medium transition-all',
                  activeVersion === 'original' && 'bg-muted text-foreground ring-2 ring-muted-foreground/20'
                )}
                onClick={() => switchVersion('original')}
              >
                <motion.span 
                  className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs mr-2"
                  animate={{ scale: activeVersion === 'original' ? 1.1 : 1 }}
                >
                  A
                </motion.span>
                Оригинал
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button
                variant={activeVersion === 'new' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'w-full h-10 text-sm font-medium transition-all',
                  activeVersion === 'new' && 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                )}
                onClick={() => switchVersion('new')}
              >
                <motion.span 
                  className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs mr-2"
                  animate={{ scale: activeVersion === 'new' ? 1.1 : 1 }}
                >
                  B
                </motion.span>
                Новая версия
              </Button>
            </motion.div>
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
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" onClick={restart} className="h-9 w-9">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div
                whileTap={{ scale: 0.95 }}
                animate={isPlaying ? { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' } : {}}
              >
                <Button
                  onClick={togglePlay}
                  size="icon"
                  className="h-12 w-12 rounded-full"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isPlaying ? 'pause' : 'play'}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
              <div className="flex items-center gap-2 ml-2">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="h-9 w-9">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </motion.div>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => {
                    setVolume(v);
                    if (v > 0 && isMuted) setIsMuted(false);
                  }}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  className="h-9 gap-1 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                  Отменить
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="h-9 gap-1 bg-success hover:bg-success/90"
                >
                  <Check className="w-4 h-4" />
                  Применить
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
