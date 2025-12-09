import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Loader2, CheckCircle2, XCircle, Clock, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ReplacementProgressIndicatorProps {
  trackId: string;
  onViewResult?: (taskId: string) => void;
  className?: string;
}

interface ActiveTask {
  id: string;
  status: string;
  created_at: string;
  error_message?: string | null;
}

export function ReplacementProgressIndicator({
  trackId,
  onViewResult,
  className,
}: ReplacementProgressIndicatorProps) {
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Subscribe to generation tasks for this track
  useEffect(() => {
    // Initial fetch
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
      }
    };

    fetchTasks();

    // Subscribe to changes
    const channel = supabase
      .channel(`replacement-tasks-${trackId}`)
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
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId]);

  // Track elapsed time for pending tasks
  useEffect(() => {
    const pendingTask = activeTasks.find(t => t.status === 'pending' || t.status === 'processing');
    if (!pendingTask) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(pendingTask.created_at).getTime();
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTasks]);

  const pendingTasks = useMemo(() => 
    activeTasks.filter((t) => t.status === 'pending' || t.status === 'processing'),
    [activeTasks]
  );
  
  const completedTasks = useMemo(() => 
    activeTasks.filter((t) => t.status === 'completed'),
    [activeTasks]
  );
  
  const failedTasks = useMemo(() => 
    activeTasks.filter((t) => t.status === 'failed'),
    [activeTasks]
  );

  const latestCompleted = completedTasks[0];
  const latestFailed = failedTasks[0];

  // Calculate estimated progress (usually takes 30-90 seconds)
  const estimatedProgress = useMemo(() => {
    if (elapsedTime < 10) return elapsedTime * 2;
    if (elapsedTime < 30) return 20 + (elapsedTime - 10) * 2;
    if (elapsedTime < 60) return 60 + (elapsedTime - 30);
    return Math.min(95, 90 + (elapsedTime - 60) * 0.1);
  }, [elapsedTime]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}с`;
  };

  if (activeTasks.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <AnimatePresence mode="popLayout">
          {/* Pending/Processing indicator */}
          {pendingTasks.length > 0 && (
            <motion.div
              key="pending"
              initial={{ scale: 0.8, opacity: 0, x: -10 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    'relative flex items-center gap-2 px-3 py-1.5 rounded-full',
                    'bg-gradient-to-r from-primary/20 to-primary/10',
                    'border border-primary/30'
                  )}>
                    {/* Animated glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.8, 0.5] 
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 text-primary" />
                    </motion.div>
                    
                    <div className="flex flex-col items-start relative z-10">
                      <span className="text-xs font-medium text-primary">
                        {pendingTasks.length > 1 
                          ? `${pendingTasks.length} замены` 
                          : 'Генерация...'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatElapsed(elapsedTime)}
                      </span>
                    </div>
                    
                    {/* Mini progress bar */}
                    <div className="w-12 h-1.5 bg-primary/20 rounded-full overflow-hidden relative z-10">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${estimatedProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Генерация замены секции</p>
                    <p className="text-xs text-muted-foreground">
                      Обычно занимает 30-90 секунд
                    </p>
                    <Progress value={estimatedProgress} className="h-1.5 mt-2" />
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}

          {/* Completed indicator */}
          {pendingTasks.length === 0 && latestCompleted && (
            <motion.div
              key="completed"
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -10 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 gap-1.5 relative overflow-hidden',
                      'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
                      'text-green-600 dark:text-green-400',
                      'border-green-500/30 hover:border-green-500/50',
                      'hover:bg-green-500/20'
                    )}
                    onClick={() => onViewResult?.(latestCompleted.id)}
                  >
                    {/* Success shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                    <span className="relative z-10">Готово</span>
                    <Eye className="w-3.5 h-3.5 opacity-60" />
                    
                    {completedTasks.length > 1 && (
                      <Badge 
                        variant="secondary" 
                        className="h-4 px-1 text-[10px] bg-green-500/20"
                      >
                        +{completedTasks.length - 1}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Нажмите для сравнения версий</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}

          {/* Failed indicator */}
          {pendingTasks.length === 0 && !latestCompleted && latestFailed && (
            <motion.div
              key="failed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="destructive"
                    className="h-8 px-3 gap-1.5 cursor-help"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Ошибка</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium text-destructive">Генерация не удалась</p>
                  {latestFailed.error_message && (
                    <p className="text-xs mt-1">{latestFailed.error_message}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
