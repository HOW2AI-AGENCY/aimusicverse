import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { Loader2, Music2, ChevronDown, ChevronUp, AlertCircle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useActiveGenerations } from '@/hooks/generation';
import { useFailedGenerations } from '@/hooks/generation/useFailedGenerations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GlobalGenerationIndicator() {
  const navigate = useNavigate();
  const { data: activeGenerations = [], isLoading } = useActiveGenerations();
  const { failedGenerations, refetchFailed } = useFailedGenerations();
  const [expanded, setExpanded] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const activeCount = activeGenerations.length;
  const failedCount = failedGenerations.length;
  const totalCount = activeCount + failedCount;

  const handleDeleteFailed = async (taskId: string, trackId?: string | null) => {
    setDeletingIds(prev => new Set(prev).add(taskId));
    try {
      const { error } = await supabase
        .from('generation_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      if (trackId) {
        await supabase.from('tracks').delete().eq('id', trackId);
      }

      toast.success('Задача удалена');
      refetchFailed();
    } catch (error) {
      console.error('Delete failed task error:', error);
      toast.error('Не удалось удалить задачу');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleDismissFailed = async (taskId: string) => {
    try {
      await supabase
        .from('generation_tasks')
        .update({ status: 'dismissed' })
        .eq('id', taskId);
      refetchFailed();
    } catch (error) {
      console.error('Dismiss error:', error);
    }
  };

  if (isLoading || totalCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100vw-2rem)]"
    >
      <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-lg shadow-primary/10">
        {/* Main indicator button */}
        <Button
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="h-auto py-2.5 px-4 gap-2.5 hover:bg-primary/5 rounded-xl w-full justify-between min-h-[44px]"
        >
          <div className="flex items-center gap-2.5">
            {activeCount > 0 ? (
              <div className="relative">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <div className="absolute inset-0 animate-ping opacity-30">
                  <Loader2 className="w-4 h-4 text-primary" />
                </div>
              </div>
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-sm font-medium">
              {activeCount > 0 
                ? (activeCount === 1 ? 'Генерация трека' : `Генерация ${activeCount} треков`)
                : `${failedCount} ошибок`
              }
            </span>
            {activeCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-bold bg-primary/20 text-primary">
                {activeCount}
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs font-bold">
                {failedCount} ошибок
              </Badge>
            )}
          </div>
          {totalCount > 1 && (
            expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        {/* Expanded list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
                {/* Active generations */}
                {activeGenerations.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs"
                  >
                    <Music2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate flex-1 text-muted-foreground">
                      {task.prompt.slice(0, 40)}{task.prompt.length > 40 ? '...' : ''}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] h-4 px-1",
                        task.status === 'processing' && "border-primary/50 text-primary",
                        task.status === 'pending' && "border-yellow-500/50 text-yellow-500",
                        task.status === 'streaming_ready' && "border-green-500/50 text-green-500 animate-pulse"
                      )}
                    >
                      {task.status === 'processing' ? 'В работе' : 
                       task.status === 'pending' ? 'Очередь' : 
                       task.status === 'streaming_ready' ? '▶️ Слушать' : task.status}
                    </Badge>
                  </div>
                ))}

                {/* Failed generations */}
                {failedGenerations.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate text-muted-foreground">
                        {task.prompt.slice(0, 40)}{task.prompt.length > 40 ? '...' : ''}
                      </span>
                      <span className="text-destructive text-[10px]">
                        {task.error_message?.slice(0, 50) || 'Ошибка генерации'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFailed(task.id, task.track_id);
                        }}
                        disabled={deletingIds.has(task.id)}
                      >
                        {deletingIds.has(task.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissFailed(task.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View in library link */}
        <div className="border-t border-primary/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            className="w-full h-9 text-xs text-primary hover:text-primary hover:bg-primary/5 rounded-t-none"
          >
            Открыть библиотеку →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
