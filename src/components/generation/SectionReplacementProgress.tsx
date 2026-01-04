/**
 * SectionReplacementProgress - Visual progress for section replacement with A/B variants
 */

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Play, Pause, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { useState, useRef } from 'react';
import { SectionVariant } from '@/hooks/generation/useReplaceSectionProgress';

interface SectionReplacementProgressProps {
  status: 'idle' | 'submitting' | 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string | null;
  variants: SectionVariant[];
  section?: { start: number; end: number } | null;
  onSelectVariant?: (index: number) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function SectionReplacementProgress({
  status,
  progress,
  message,
  error,
  variants,
  section,
  onSelectVariant,
  onRetry,
  onDismiss,
  className,
}: SectionReplacementProgressProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (status === 'idle') return null;

  const isActive = status !== 'completed' && status !== 'error';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  const handlePlayVariant = (index: number, audioUrl: string) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingIndex(null);
      setPlayingIndex(index);
    }
  };

  const handleSelectVariant = (index: number) => {
    setSelectedIndex(index);
    onSelectVariant?.(index);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'p-4 rounded-lg border',
          isCompleted && 'border-green-500/50 bg-green-500/10',
          isError && 'border-destructive/50 bg-destructive/10',
          isActive && 'border-primary/50 bg-primary/5',
          className
        )}
      >
        <div className="space-y-3">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isActive && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {isError && (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{message}</p>
                {isActive && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {Math.round(progress)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar for active states */}
          {isActive && (
            <Progress value={progress} className="h-2" />
          )}

          {/* Error message */}
          {isError && error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Section info */}
          {section && (
            <div className="text-xs text-muted-foreground">
              Секция: {section.start.toFixed(1)}s — {section.end.toFixed(1)}s
            </div>
          )}

          {/* A/B Variants Selection */}
          {isCompleted && variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Выберите вариант:</p>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant, idx) => (
                  <Button
                    key={idx}
                    variant={selectedIndex === idx ? 'default' : 'outline'}
                    size="sm"
                    className="relative gap-2"
                    onClick={() => handleSelectVariant(idx)}
                  >
                    <span
                      className="absolute left-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVariant(idx, variant.audioUrl);
                      }}
                    >
                      {playingIndex === idx ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </span>
                    <span className="ml-4">Вариант {variant.label}</span>
                    {selectedIndex === idx && (
                      <Check className="w-3 h-3 ml-auto" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isError && (
              <>
                {onRetry && (
                  <Button size="sm" onClick={onRetry}>
                    Повторить
                  </Button>
                )}
                {onDismiss && (
                  <Button size="sm" variant="ghost" onClick={onDismiss}>
                    Закрыть
                  </Button>
                )}
              </>
            )}

            {isCompleted && onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss} className="ml-auto">
                Закрыть
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
