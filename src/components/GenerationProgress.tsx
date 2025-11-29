import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Music2, CheckCircle2, XCircle, Radio, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface GenerationTask {
  id: string;
  prompt: string;
  status: string;
  generation_mode: string;
  model_used: string;
  created_at: string;
  tracks: {
    id: string;
    title: string;
    streaming_url: string | null;
    status: string;
  } | null;
}

export const GenerationProgress = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('generation_tasks')
        .select(`
          *,
          tracks (
            id,
            title,
            streaming_url,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setTasks(data as any);
      }
      setLoading(false);
    };

    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('generation-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'streaming_ready':
        return <Radio className="w-4 h-4 text-primary animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Music2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В очереди';
      case 'processing':
        return 'Генерация...';
      case 'streaming_ready':
        return 'Стриминг готов';
      case 'completed':
        return 'Завершено';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return 10;
      case 'processing':
        return 50;
      case 'streaming_ready':
        return 75;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const handleCheckStatus = async (taskId: string) => {
    setCheckingStatus(taskId);
    
    try {
      const { data, error } = await supabase.functions.invoke('suno-check-status', {
        body: { taskId },
      });

      if (error) throw error;

      if (data.status === 'completed') {
        toast({
          title: 'Трек готов! 🎵',
          description: 'Генерация успешно завершена',
        });
      } else if (data.status === 'failed') {
        toast({
          title: 'Ошибка генерации',
          description: data.error || 'Не удалось сгенерировать трек',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Генерация продолжается',
          description: 'Трек все еще обрабатывается',
        });
      }
    } catch (error: any) {
      console.error('Check status error:', error);
      toast({
        title: 'Ошибка проверки',
        description: error.message || 'Не удалось проверить статус',
        variant: 'destructive',
      });
    } finally {
      setCheckingStatus(null);
    }
  };

  if (loading) {
    return null;
  }

  const activeTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'processing' || t.tracks?.status === 'streaming_ready'
  );

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-2 max-h-[80vh] overflow-y-auto">
      {activeTasks.map((task) => {
        const trackStatus = task.tracks?.status || task.status;
        const progress = getProgress(trackStatus);

        return (
          <Card
            key={task.id}
            className={cn(
              'glass-card border-primary/20 p-4 animate-in slide-in-from-right',
              trackStatus === 'failed' && 'border-destructive/20'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(trackStatus)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">
                    {task.tracks?.title || task.prompt.substring(0, 30)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {task.model_used || 'V4'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {getStatusText(trackStatus)}
                </p>

                {trackStatus !== 'failed' && (
                  <Progress value={progress} className="h-1.5" />
                )}

                {trackStatus === 'streaming_ready' && (
                  <p className="text-xs text-primary mt-1">
                    ⚡ Можно начинать слушать
                  </p>
                )}

                {trackStatus === 'processing' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs mt-2"
                    onClick={() => handleCheckStatus(task.id)}
                    disabled={checkingStatus === task.id}
                  >
                    {checkingStatus === task.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Проверить статус
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};