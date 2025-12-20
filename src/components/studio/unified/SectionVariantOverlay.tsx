/**
 * SectionVariantOverlay - Inline comparison of replacement variants on timeline
 * 
 * Shows A/B options directly on the timeline after generation completes.
 * Allows quick selection without opening a modal.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sectionDuration = sectionEnd - sectionStart;

  // Get current audio URL based on active variant
  const getCurrentUrl = (variant: VariantType = activeVariant) => {
    switch (variant) {
      case 'original': return originalAudioUrl;
      case 'variantA': return variantAUrl;
      case 'variantB': return variantBUrl || variantAUrl;
      default: return variantAUrl;
    }
  };

  // Update audio source when variant changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = getCurrentUrl(activeVariant);
      audioRef.current.currentTime = sectionStart;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [activeVariant, variantAUrl, variantBUrl, originalAudioUrl, sectionStart]);

  // Initialize audio
  useEffect(() => {
    if (!open) return;

    const audio = new Audio(getCurrentUrl(activeVariant));
    audio.currentTime = sectionStart;
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
  }, [open, sectionStart, sectionEnd, sectionDuration]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

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

  const selectVariant = (variant: VariantType) => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    setActiveVariant(variant);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "bg-card border border-border rounded-xl shadow-xl p-4",
          "max-w-md mx-auto",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Сравнение вариантов</h3>
          <span className="text-xs text-muted-foreground">
            {formatTime(sectionStart)} — {formatTime(sectionEnd)}
          </span>
        </div>

        {/* Variant buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeVariant === 'original' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => selectVariant('original')}
            className="flex-1 h-9"
          >
            Оригинал
          </Button>
          <Button
            variant={activeVariant === 'variantA' ? 'default' : 'outline'}
            size="sm"
            onClick={() => selectVariant('variantA')}
            className="flex-1 h-9"
          >
            Вариант A
          </Button>
          {variantBUrl && (
            <Button
              variant={activeVariant === 'variantB' ? 'default' : 'outline'}
              size="sm"
              onClick={() => selectVariant('variantB')}
              className="flex-1 h-9"
            >
              Вариант B
            </Button>
          )}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>

          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(currentTime / sectionDuration) * 100}%` }}
            />
          </div>

          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(sectionDuration)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-9 gap-1.5"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Ещё раз</span>
            </Button>
          )}
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            className="h-9 gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Отмена</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => onApply(activeVariant === 'variantB' ? 'variantB' : 'variantA')}
            disabled={activeVariant === 'original'}
            className="h-9 gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Применить {activeVariant === 'variantB' ? 'B' : 'A'}</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
