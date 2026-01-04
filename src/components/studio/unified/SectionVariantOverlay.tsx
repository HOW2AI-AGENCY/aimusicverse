/**
 * SectionVariantOverlay - Enhanced comparison of replacement variants
 * 
 * Shows A/B options with waveform visualization and detailed playback controls.
 * Allows quick selection and preview without opening a modal.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Check, X, RotateCcw, Loader2, Volume2, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SectionVariantOverlayProps {
  open: boolean;
  originalAudioUrl: string;
  variantAUrl: string;
  variantBUrl?: string;
  sectionStart: number;
  sectionEnd: number;
  onApply: (variant: 'variantA' | 'variantB') => void;
  onDiscard: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

type VariantType = 'original' | 'variantA' | 'variantB';

interface VariantInfo {
  type: VariantType;
  label: string;
  shortLabel: string;
  color: string;
}

const variants: VariantInfo[] = [
  { type: 'original', label: 'Оригинал', shortLabel: 'Ориг', color: 'bg-muted' },
  { type: 'variantA', label: 'Вариант A', shortLabel: 'A', color: 'bg-primary' },
  { type: 'variantB', label: 'Вариант B', shortLabel: 'B', color: 'bg-accent' },
];

export function SectionVariantOverlay({
  open,
  originalAudioUrl,
  variantAUrl,
  variantBUrl,
  sectionStart,
  sectionEnd,
  onApply,
  onDiscard,
  onRegenerate,
  isRegenerating,
  className,
}: SectionVariantOverlayProps) {
  const [activeVariant, setActiveVariant] = useState<VariantType>('variantA');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [listenedVariants, setListenedVariants] = useState<Set<VariantType>>(new Set(['variantA']));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const haptic = useHapticFeedback();

  const sectionDuration = sectionEnd - sectionStart;
  const availableVariants = variants.filter(v => 
    v.type === 'original' || 
    v.type === 'variantA' || 
    (v.type === 'variantB' && variantBUrl)
  );

  // Get current audio URL based on active variant
  const getCurrentUrl = useCallback((variant: VariantType = activeVariant) => {
    switch (variant) {
      case 'original': return originalAudioUrl;
      case 'variantA': return variantAUrl;
      case 'variantB': return variantBUrl || variantAUrl;
      default: return variantAUrl;
    }
  }, [activeVariant, originalAudioUrl, variantAUrl, variantBUrl]);

  // Initialize audio
  useEffect(() => {
    if (!open) return;

    const audio = new Audio(getCurrentUrl(activeVariant));
    audio.currentTime = sectionStart;
    audio.volume = volume;
    audioRef.current = audio;

    const updateTime = () => {
      if (!audioRef.current) return;
      
      const time = audioRef.current.currentTime - sectionStart;
      setCurrentTime(Math.max(0, Math.min(time, sectionDuration)));
      
      // Stop at section end
      if (audioRef.current.currentTime >= sectionEnd) {
        audioRef.current.pause();
        audioRef.current.currentTime = sectionStart;
        setIsPlaying(false);
        setCurrentTime(0);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateTime);
      }
    };

    audio.addEventListener('play', () => {
      animationRef.current = requestAnimationFrame(updateTime);
    });

    audio.addEventListener('pause', () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audio.pause();
      audio.src = '';
    };
  }, [open, sectionStart, sectionEnd, sectionDuration, getCurrentUrl, activeVariant, volume, isPlaying]);

  // Update audio source when variant changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = getCurrentUrl(activeVariant);
      audioRef.current.currentTime = sectionStart;
      audioRef.current.volume = volume;
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Mark as listened
      setListenedVariants(prev => new Set([...prev, activeVariant]));
    }
  }, [activeVariant, getCurrentUrl, sectionStart, volume]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    haptic.select();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.currentTime >= sectionEnd || audioRef.current.currentTime < sectionStart) {
        audioRef.current.currentTime = sectionStart;
      }
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const restart = () => {
    if (!audioRef.current) return;
    haptic.tap();
    audioRef.current.currentTime = sectionStart;
    setCurrentTime(0);
  };

  const selectVariant = (variant: VariantType) => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    haptic.tap();
    setActiveVariant(variant);
  };

  const handleApply = (variant: 'variantA' | 'variantB') => {
    haptic.success();
    onApply(variant);
  };

  const handleDiscard = () => {
    haptic.warning();
    onDiscard();
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = sectionStart + (value[0] / 100) * sectionDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(value[0] / 100 * sectionDuration);
  };

  if (!open) return null;

  const progressPercent = (currentTime / sectionDuration) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "bg-card border border-border rounded-2xl shadow-xl overflow-hidden",
          className
        )}
      >
        {/* Header with section info */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {formatTime(sectionStart)} — {formatTime(sectionEnd)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({formatTime(sectionDuration)})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {listenedVariants.size < availableVariants.length && (
              <Badge variant="secondary" className="text-xs">
                Прослушайте все варианты
              </Badge>
            )}
          </div>
        </div>

        {/* Variant selector tabs */}
        <div className="flex p-2 gap-2 bg-background/50">
          {availableVariants.map((v) => {
            const isActive = activeVariant === v.type;
            const wasListened = listenedVariants.has(v.type);
            
            return (
              <motion.button
                key={v.type}
                onClick={() => selectVariant(v.type)}
                className={cn(
                  "relative flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : wasListened
                    ? "bg-muted hover:bg-muted/80"
                    : "bg-muted/50 hover:bg-muted border border-dashed border-border"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  {v.label}
                  {wasListened && !isActive && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeVariantTab"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-foreground/30 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Waveform-like progress visualization */}
        <div className="px-4 py-3">
          <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
            {/* Simulated waveform bars */}
            <div className="absolute inset-0 flex items-center gap-0.5 px-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const barProgress = (i / 40) * 100;
                const isPast = barProgress < progressPercent;
                const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
                
                return (
                  <motion.div
                    key={i}
                    className={cn(
                      "flex-1 rounded-sm transition-colors",
                      isPast ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                    style={{ height: `${height}%` }}
                    animate={{ 
                      scaleY: isPlaying && isPast ? [1, 1.1, 1] : 1 
                    }}
                    transition={{ 
                      duration: 0.2, 
                      repeat: isPlaying ? Infinity : 0,
                      delay: i * 0.02 
                    }}
                  />
                );
              })}
            </div>
            
            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-glow"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          
          {/* Seek slider */}
          <Slider
            value={[progressPercent]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="mt-2"
          />
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="h-9 w-9 rounded-full"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground tabular-nums min-w-[36px]">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs text-muted-foreground tabular-nums min-w-[36px]">
              {formatTime(sectionDuration)}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              onValueChange={(v) => setVolume(v[0] / 100)}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 bg-muted/20 border-t border-border/30">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-10 gap-2"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Сгенерировать ещё</span>
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            className="h-10 gap-2"
          >
            <X className="w-4 h-4" />
            <span>Отмена</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => handleApply(activeVariant === 'variantB' ? 'variantB' : 'variantA')}
            disabled={activeVariant === 'original'}
            className="h-10 gap-2 min-w-[140px]"
          >
            <Check className="w-4 h-4" />
            <span>
              Применить {activeVariant === 'variantB' ? 'B' : activeVariant === 'variantA' ? 'A' : ''}
            </span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
