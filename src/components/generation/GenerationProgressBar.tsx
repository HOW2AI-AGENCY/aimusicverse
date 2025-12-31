/**
 * GenerationProgressBar - Visual progress indicator for generation tasks
 */

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

interface GenerationProgressBarProps {
  status: 'idle' | 'submitting' | 'pending' | 'processing' | 'streaming_ready' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string | null;
  completedTrack?: {
    id: string;
    title: string;
    audio_url: string;
    cover_url?: string | null;
  } | null;
  onPlayTrack?: () => void;
  onOpenTrack?: () => void;
  onOpenStudio?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function GenerationProgressBar({
  status,
  progress,
  message,
  error,
  completedTrack,
  onPlayTrack,
  onOpenTrack,
  onOpenStudio,
  onRetry,
  onDismiss,
  className,
}: GenerationProgressBarProps) {
  if (status === 'idle') return null;

  const isActive = status !== 'completed' && status !== 'error';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

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
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-medium truncate">{message}</p>
              {isActive && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {Math.round(progress)}%
                </Badge>
              )}
            </div>

            {/* Progress bar for active states */}
            {isActive && (
              <Progress value={progress} className="h-2 mt-2" />
            )}

            {/* Error message */}
            {isError && error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            {/* Completed track info */}
            {isCompleted && completedTrack && (
              <div className="flex items-center gap-2 mt-3">
                {completedTrack.cover_url && (
                  <img
                    src={completedTrack.cover_url}
                    alt={completedTrack.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{completedTrack.title}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              {isCompleted && completedTrack && (
                <>
                  {onPlayTrack && (
                    <Button size="sm" onClick={onPlayTrack} className="gap-1">
                      <Play className="w-3 h-3" />
                      Слушать
                    </Button>
                  )}
                  {onOpenTrack && (
                    <Button size="sm" variant="outline" onClick={onOpenTrack} className="gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Открыть
                    </Button>
                  )}
                  {onOpenStudio && (
                    <Button size="sm" variant="secondary" onClick={onOpenStudio} className="gap-1">
                      Студия
                    </Button>
                  )}
                </>
              )}

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
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Закрыть
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
