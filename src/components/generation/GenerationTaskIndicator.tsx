import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GenerationTaskIndicatorProps {
  taskId?: string;
  // Optional callback when generation completes
  onComplete?: (trackId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  compact?: boolean;
}

type TaskStatus = 'pending' | 'processing' | 'streaming_ready' | 'completed' | 'failed';

interface TaskState {
  status: TaskStatus;
  progress: number;
  stage: string;
  error?: string;
  trackId?: string;
}

const STATUS_CONFIG: Record<TaskStatus, { progress: number; stage: string }> = {
  pending: { progress: 15, stage: 'В очереди...' },
  processing: { progress: 50, stage: 'Генерация музыки...' },
  streaming_ready: { progress: 80, stage: '▶️ Можно слушать!' },
  completed: { progress: 100, stage: 'Готово!' },
  failed: { progress: 0, stage: 'Ошибка' },
};

export function GenerationTaskIndicator({
  taskId,
  onComplete,
  onError,
  className,
  compact = false,
}: GenerationTaskIndicatorProps) {
  const queryClient = useQueryClient();
  const [task, setTask] = useState<TaskState | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    // Fetch initial state
    const fetchTask = async () => {
      const { data } = await supabase
        .from('generation_tasks')
        .select('status, error_message, track_id')
        .eq('id', taskId)
        .single();
      
      if (data) {
        const config = STATUS_CONFIG[data.status as TaskStatus] || STATUS_CONFIG.pending;
        setTask({
          status: data.status as TaskStatus,
          progress: config.progress,
          stage: config.stage,
          error: data.error_message || undefined,
          trackId: data.track_id || undefined,
        });
      }
    };
    fetchTask();

    // Subscribe to changes
    const channel = supabase
      .channel(`task-${taskId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_tasks',
        filter: `id=eq.${taskId}`,
      }, (payload) => {
        const newData = payload.new as any;
        const config = STATUS_CONFIG[newData.status as TaskStatus] || STATUS_CONFIG.pending;
        
        setTask({
          status: newData.status,
          progress: config.progress,
          stage: config.stage,
          error: newData.error_message,
          trackId: newData.track_id,
        });

        if (newData.status === 'completed') {
          toast.success('Трек сгенерирован!');
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
          queryClient.invalidateQueries({ queryKey: ['project-tracks'] });
          onComplete?.(newData.track_id);
        } else if (newData.status === 'failed') {
          toast.error('Ошибка генерации', {
            description: newData.error_message,
          });
          onError?.(newData.error_message);
        }
      })
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient, onComplete, onError]);

  if (!taskId || !task) return null;

  // Hide if completed or failed after a delay
  if (task.status === 'completed' || task.status === 'failed') {
    return null;
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-primary/10 text-primary text-xs font-medium",
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{task.stage}</span>
        <span className="text-primary/60">{task.progress}%</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-4 rounded-xl border bg-card/80 backdrop-blur-sm",
        "border-primary/30 shadow-lg shadow-primary/5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-0.5 rounded-lg border-2 border-dashed border-primary/30"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{task.stage}</span>
            <span className="text-xs text-muted-foreground">{task.progress}%</span>
          </div>
          
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
      </div>
    </motion.div>
  );
}

// Hook to track active generation for a specific context
export function useGenerationTask(contextKey?: string) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  const startTracking = (taskId: string) => {
    setActiveTaskId(taskId);
    if (contextKey) {
      sessionStorage.setItem(`gen_task_${contextKey}`, taskId);
    }
  };

  const stopTracking = () => {
    setActiveTaskId(null);
    if (contextKey) {
      sessionStorage.removeItem(`gen_task_${contextKey}`);
    }
  };

  // Restore from session on mount
  useEffect(() => {
    if (contextKey) {
      const saved = sessionStorage.getItem(`gen_task_${contextKey}`);
      if (saved) {
        setActiveTaskId(saved);
      }
    }
  }, [contextKey]);

  return {
    activeTaskId,
    startTracking,
    stopTracking,
    isTracking: !!activeTaskId,
  };
}
