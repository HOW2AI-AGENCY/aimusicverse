/**
 * Enhanced section replacement progress with realtime statuses
 * Shows detailed generation stages with animations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Loader2, CheckCircle2, XCircle, Sparkles, 
  Music, Wand2, AudioWaveformIcon, Zap, Eye,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface SectionReplacementProgressProps {
  trackId: string;
  onComplete?: (taskId: string) => void;
  onViewResult?: (taskId: string) => void;
  className?: string;
  variant?: 'compact' | 'full';
}

type GenerationStage = 'queued' | 'analyzing' | 'generating' | 'processing' | 'finalizing' | 'completed' | 'failed';

interface ActiveTask {
  id: string;
  status: string;
  created_at: string;
  error_message?: string | null;
}

const STAGE_CONFIG: Record<GenerationStage, {
  label: string;
  icon: typeof Loader2;
  color: string;
  progress: number;
}> = {
  queued: { label: 'В очереди', icon: Loader2, color: 'text-muted-foreground', progress: 5 },
  analyzing: { label: 'Анализ секции', icon: AudioWaveformIcon, color: 'text-blue-500', progress: 20 },
  generating: { label: 'Генерация музыки', icon: Music, color: 'text-purple-500', progress: 50 },
  processing: { label: 'Обработка аудио', icon: Wand2, color: 'text-amber-500', progress: 75 },
  finalizing: { label: 'Финализация', icon: Zap, color: 'text-green-500', progress: 90 },
  completed: { label: 'Готово', icon: CheckCircle2, color: 'text-green-500', progress: 100 },
  failed: { label: 'Ошибка', icon: XCircle, color: 'text-destructive', progress: 0 },
};

const STATUS_MESSAGES = [
  'Анализируем структуру трека...',
  'Подбираем музыкальные паттерны...',
  'Генерируем новую мелодию...',
  'Синтезируем инструменты...',
  'Микшируем аудио...',
  'Применяем эффекты...',
  'Проверяем качество...',
  'Почти готово...',
];

export function SectionReplacementProgress({
  trackId,
  onComplete,
  onViewResult,
  className,
  variant = 'compact',
}: SectionReplacementProgressProps) {
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStage, setCurrentStage] = useState<GenerationStage>('queued');
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [previouslyCompleted, setPreviouslyCompleted] = useState<Set<string>>(new Set());
  const haptic = useHapticFeedback();

  // Fetch and subscribe to tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('generation_tasks')
        .select('id, status, created_at, error_message')
        .eq('track_id', trackId)
        .eq('generation_mode', 'replace_section')
        .in('status', ['pending', 'processing', 'completed', 'failed'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setActiveTasks(data);
        // Track already completed tasks
        const completed = new Set(data.filter(t => t.status === 'completed').map(t => t.id));
        setPreviouslyCompleted(completed);
      }
    };

    fetchTasks();

    const channel = supabase
      .channel(`section-progress-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_tasks',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const task = payload.new as ActiveTask & { generation_mode: string };
            if (task.generation_mode === 'replace_section') {
              setActiveTasks((prev) => {
                const existing = prev.find((t) => t.id === task.id);
                if (existing) {
                  return prev.map((t) => (t.id === task.id ? task : t));
                }
                return [task, ...prev].slice(0, 5);
              });

              // Check for new completion
              if (task.status === 'completed' && !previouslyCompleted.has(task.id)) {
                haptic.success();
                onComplete?.(task.id);
                setPreviouslyCompleted(prev => new Set([...prev, task.id]));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, onComplete, haptic, previouslyCompleted]);

  // Track elapsed time and update stage
  useEffect(() => {
    const pendingTask = activeTasks.find(t => t.status === 'pending' || t.status === 'processing');
    if (!pendingTask) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(pendingTask.created_at).getTime();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Update stage based on elapsed time
      if (elapsed < 5) setCurrentStage('queued');
      else if (elapsed < 15) setCurrentStage('analyzing');
      else if (elapsed < 45) setCurrentStage('generating');
      else if (elapsed < 70) setCurrentStage('processing');
      else setCurrentStage('finalizing');
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTasks]);

  // Cycle through status messages
  useEffect(() => {
    if (currentStage === 'completed' || currentStage === 'failed' || currentStage === 'queued') return;

    const interval = setInterval(() => {
      setStatusMessageIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStage]);

  const pendingTasks = useMemo(() => 
    activeTasks.filter((t) => t.status === 'pending' || t.status === 'processing'),
    [activeTasks]
  );
  
  const completedTasks = useMemo(() => 
    activeTasks.filter((t) => t.status === 'completed'),
    [activeTasks]
  );

  const latestCompleted = completedTasks[0];
  const latestFailed = activeTasks.find(t => t.status === 'failed');

  const stageConfig = STAGE_CONFIG[currentStage];
  const StageIcon = stageConfig.icon;

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}с`;
  };

  if (activeTasks.length === 0) return null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <AnimatePresence mode="wait">
        {pendingTasks.length > 0 ? (
          <motion.div
            key="pending"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-gradient-to-r from-primary/20 to-primary/10',
              'border border-primary/30',
              className
            )}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <StageIcon className={cn('w-4 h-4', stageConfig.color)} />
            </motion.div>
            <span className="text-xs font-medium">{stageConfig.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatElapsed(elapsedTime)}
            </span>
          </motion.div>
        ) : latestCompleted ? (
          <motion.div
            key="completed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-7 gap-1.5',
                'bg-green-500/10 text-green-600 dark:text-green-400',
                'border-green-500/30 hover:bg-green-500/20',
                className
              )}
              onClick={() => onViewResult?.(latestCompleted.id)}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Сравнить
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  // Full variant
  return (
    <AnimatePresence mode="wait">
      {pendingTasks.length > 0 && (
        <motion.div
          key="progress-full"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn(
            'overflow-hidden rounded-xl',
            'bg-gradient-to-br from-primary/10 via-background to-primary/5',
            'border border-primary/20',
            className
          )}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br from-primary/30 to-primary/10'
                  )}
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 hsl(var(--primary) / 0.3)',
                      '0 0 0 8px hsl(var(--primary) / 0)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                </motion.div>
                
                <div>
                  <h4 className="font-medium text-sm">Замена секции</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatElapsed(elapsedTime)} прошло
                  </p>
                </div>
              </div>

              {pendingTasks.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{pendingTasks.length - 1} в очереди
                </Badge>
              )}
            </div>

            {/* Progress stages */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {(['analyzing', 'generating', 'processing', 'finalizing'] as const).map((stage, idx) => {
                  const config = STAGE_CONFIG[stage];
                  const isActive = stage === currentStage;
                  const isPast = STAGE_CONFIG[currentStage].progress > config.progress;
                  
                  return (
                    <div key={stage} className="flex items-center flex-1">
                      <motion.div
                        className={cn(
                          'flex-1 h-1.5 rounded-full overflow-hidden',
                          isPast ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 10, ease: 'linear' }}
                          />
                        )}
                      </motion.div>
                      {idx < 3 && (
                        <ChevronRight className={cn(
                          'w-3 h-3 mx-0.5 flex-shrink-0',
                          isPast ? 'text-primary' : 'text-muted-foreground/30'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current stage indicator */}
              <div className="flex items-center gap-2">
                <motion.div
                  key={currentStage}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: currentStage !== 'completed' ? 360 : 0 }}
                    transition={{ duration: 2, repeat: currentStage !== 'completed' ? Infinity : 0, ease: 'linear' }}
                  >
                    <StageIcon className={cn('w-4 h-4', stageConfig.color)} />
                  </motion.div>
                  <span className={cn('text-sm font-medium', stageConfig.color)}>
                    {stageConfig.label}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Status message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={statusMessageIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-muted-foreground text-center"
              >
                {STATUS_MESSAGES[statusMessageIndex]}
              </motion.p>
            </AnimatePresence>

            {/* Overall progress */}
            <Progress value={stageConfig.progress} className="h-1" />
          </div>
        </motion.div>
      )}

      {/* Completed state */}
      {pendingTasks.length === 0 && latestCompleted && (
        <motion.div
          key="completed-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={cn(
            'rounded-xl overflow-hidden',
            'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
            'border border-green-500/30',
            className
          )}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </motion.div>
              <div>
                <h4 className="font-medium text-sm text-green-600 dark:text-green-400">
                  Замена готова
                </h4>
                <p className="text-xs text-muted-foreground">
                  Нажмите для сравнения с оригиналом
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-green-500/30 hover:bg-green-500/20"
              onClick={() => onViewResult?.(latestCompleted.id)}
            >
              <Eye className="w-4 h-4" />
              Сравнить
            </Button>
          </div>

          {/* Success shimmer */}
          <motion.div
            className="h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: 2 }}
          />
        </motion.div>
      )}

      {/* Failed state */}
      {pendingTasks.length === 0 && !latestCompleted && latestFailed && (
        <motion.div
          key="failed-full"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'p-4 rounded-xl',
            'bg-destructive/10 border border-destructive/30',
            className
          )}
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <h4 className="font-medium text-sm text-destructive">Ошибка генерации</h4>
              {latestFailed.error_message && (
                <p className="text-xs text-muted-foreground mt-1">
                  {latestFailed.error_message}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
