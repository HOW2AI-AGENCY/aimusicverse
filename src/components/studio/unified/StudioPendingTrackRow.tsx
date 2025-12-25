/**
 * Studio Pending Track Row
 * Skeleton track with progress for pending generation
 */

import { memo, useEffect, useState } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Loader2, Music, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface PendingTrackData {
  id: string;
  name: string;
  type: string;
  taskId?: string;
  status: 'pending' | 'processing' | 'failed';
  errorMessage?: string;
}

interface StudioPendingTrackRowProps {
  track: PendingTrackData;
  onCancel?: () => void;
  onRetry?: () => void;
}

// Track generation status messages
const statusMessages: Record<string, string> = {
  pending: 'Подготовка к генерации...',
  processing: 'Создание инструментала...',
  streaming_ready: 'Финализация...',
  failed: 'Ошибка генерации',
};

export const StudioPendingTrackRow = memo(function StudioPendingTrackRow({
  track,
  onCancel,
  onRetry,
}: StudioPendingTrackRowProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('pending');
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Subscribe to realtime updates for the generation task
  useEffect(() => {
    if (!track.taskId) return;

    const taskId = track.taskId;

    // Initial fetch of task status
    const fetchTaskStatus = async () => {
      const { data } = await supabase
        .from('generation_tasks')
        .select('status, received_clips, expected_clips')
        .eq('suno_task_id', taskId)
        .single();

      if (data) {
        setStage(data.status);
        if (data.received_clips && data.expected_clips) {
          setProgress((data.received_clips / data.expected_clips) * 100);
        }
      }
    };
    
    fetchTaskStatus();

    // Realtime subscription
    const channel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_tasks',
        filter: `suno_task_id=eq.${taskId}`,
      }, (payload) => {
        const newData = payload.new as any;
        logger.debug('Task update received', { status: newData.status });
        setStage(newData.status);
        
        if (newData.received_clips && newData.expected_clips) {
          setProgress((newData.received_clips / newData.expected_clips) * 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [track.taskId]);

  // Animated progress for visual feedback
  useEffect(() => {
    if (stage === 'processing' && progress < 90) {
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          const target = Math.max(prev + 1, progress);
          return Math.min(target, 90); // Cap at 90% until complete
        });
      }, 500);
      return () => clearInterval(interval);
    }
    if (stage === 'streaming_ready') {
      setAnimatedProgress(95);
    }
    if (stage === 'completed') {
      setAnimatedProgress(100);
    }
  }, [stage, progress]);

  // Start from 10% for pending
  useEffect(() => {
    if (stage === 'pending') {
      setAnimatedProgress(10);
    }
  }, [stage]);

  const isFailed = track.status === 'failed' || stage === 'failed';
  const statusMessage = statusMessages[stage] || statusMessages.processing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative"
    >
      <div className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r from-green-500/10 to-green-600/5",
        "border border-green-500/20",
        isFailed && "border-destructive/30 from-destructive/10 to-destructive/5"
      )}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
            isFailed 
              ? "text-destructive bg-destructive/20 border-destructive/30"
              : "text-green-400 bg-green-500/20 border-green-500/30"
          )}>
            {isFailed ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-3.5 h-3.5" />
              </motion.div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <span className="text-xs font-mono font-semibold tracking-wider truncate block">
              {track.name}
            </span>
            <span className={cn(
              "text-[10px]",
              isFailed ? "text-destructive" : "text-green-400"
            )}>
              {isFailed ? track.errorMessage || 'Ошибка' : statusMessage}
            </span>
          </div>

          {/* Actions */}
          {isFailed ? (
            <div className="flex items-center gap-1">
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Повторить
                </Button>
              )}
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  Удалить
                </Button>
              )}
            </div>
          ) : onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              Отмена
            </Button>
          )}
        </div>

        {/* Progress / Skeleton waveform */}
        <div className="h-16 px-3 pb-2">
          {isFailed ? (
            <div className="h-full flex items-center justify-center text-xs text-destructive/70 bg-destructive/5 rounded">
              Генерация не удалась
            </div>
          ) : (
            <div className="h-full relative">
              {/* Animated skeleton waveform */}
              <div className="absolute inset-0 flex items-center gap-0.5 px-2 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-green-500/20 rounded-full min-w-[2px]"
                    initial={{ height: '20%' }}
                    animate={{
                      height: [`${20 + Math.random() * 30}%`, `${40 + Math.random() * 40}%`, `${20 + Math.random() * 30}%`],
                    }}
                    transition={{
                      duration: 1.5 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.03,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              
              {/* Progress bar overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1">
                <Progress 
                  value={animatedProgress} 
                  className="h-1 bg-green-900/20" 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
