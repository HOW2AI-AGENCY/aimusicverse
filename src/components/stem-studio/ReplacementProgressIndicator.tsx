import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ReplacementProgressIndicatorProps {
  trackId: string;
  onViewResult?: (taskId: string) => void;
}

interface ActiveTask {
  id: string;
  status: string;
  created_at: string;
}

export function ReplacementProgressIndicator({
  trackId,
  onViewResult,
}: ReplacementProgressIndicatorProps) {
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);

  // Subscribe to generation tasks for this track
  useEffect(() => {
    // Initial fetch
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('generation_tasks')
        .select('id, status, created_at')
        .eq('track_id', trackId)
        .eq('generation_mode', 'replace_section')
        .in('status', ['pending', 'processing', 'completed'])
        .order('created_at', { ascending: false })
        .limit(3);

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
                return [task, ...prev].slice(0, 3);
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

  const pendingCount = activeTasks.filter((t) => t.status === 'pending' || t.status === 'processing').length;
  const completedTasks = activeTasks.filter((t) => t.status === 'completed');
  const latestCompleted = completedTasks[0];

  if (activeTasks.length === 0) return null;

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        {pendingCount > 0 ? (
          <motion.div
            key="pending"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'h-9 px-3 gap-1.5 cursor-pointer',
                    'bg-primary/10 text-primary border border-primary/30'
                  )}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-medium">{pendingCount}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Генерируется {pendingCount} {pendingCount === 1 ? 'замена' : 'замены'}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ) : latestCompleted ? (
          <motion.div
            key="completed"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 gap-1.5',
                    'bg-success/10 text-success border-success/30 hover:bg-success/20'
                  )}
                  onClick={() => onViewResult?.(latestCompleted.id)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Готово</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Нажмите для прослушивания результата</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TooltipProvider>
  );
}
