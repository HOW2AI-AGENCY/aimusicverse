import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Music2, CheckCircle2, XCircle, Radio, RefreshCw, Play, Pause } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useGenerationPolling } from '@/hooks/useGenerationPolling';
import { AudioPlayer } from './AudioPlayer';
import { useQueryClient } from '@tanstack/react-query';

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
    local_audio_url: string | null;
    audio_url: string | null;
    cover_url: string | null;
    status: string;
  } | null;
}

export const GenerationProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const { toast } = useToast();

  // Автоматический polling статуса генерации
  useGenerationPolling();

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('generation_tasks')
      .select(`
        *,
        tracks (
          id,
          title,
          streaming_url,
          local_audio_url,
          audio_url,
          cover_url,
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

  useEffect(() => {
    if (!user) return;

    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`generation_progress_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Generation task updated:', payload);
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
        (payload) => {
          console.log('Track updated:', payload);
          fetchTasks();
        }
      )
      .subscribe((status) => {
        console.log('Generation progress realtime status:', status);
      });

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
      console.log('Manually checking status for task:', taskId);
      
      const { data, error } = await supabase.functions.invoke('suno-check-status', {
        body: { taskId },
      });

      console.log('Check status response:', data);

      if (error) {
        console.error('Check status error:', error);
        throw error;
      }

      // Force refresh tasks after check
      await fetchTasks();
      
      // Also invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['generation_tasks'] });

      if (data.status === 'completed') {
        toast({
          title: 'Трек готов! 🎵',
          description: 'Генерация успешно завершена',
        });
        
        // Trigger automatic audio analysis
        if (data.track?.audio_url) {
          console.log('Triggering automatic audio analysis for track:', data.track.id);
          supabase.functions.invoke('analyze-audio-flamingo', {
            body: {
              track_id: data.track.id,
              audio_url: data.track.audio_url,
              analysis_type: 'auto',
            },
          }).then(({ data: analysisData, error: analysisError }) => {
            if (analysisError) {
              console.error('Auto-analysis error:', analysisError);
            } else {
              console.log('Auto-analysis started:', analysisData);
              toast({
                title: 'Анализ запущен',
                description: 'AI анализирует ваш трек',
              });
            }
          });
        }
      } else if (data.status === 'failed') {
        toast({
          title: 'Ошибка генерации',
          description: data.error || 'Не удалось сгенерировать трек',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Генерация продолжается',
          description: `Статус: ${data.status || data.progress || 'обработка'}`,
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

  const activeTasks = tasks.filter((t) => {
    // Показываем только активные задачи
    const taskStatus = t.status;
    const trackStatus = t.tracks?.status;
    
    // Задача completed но трек все еще processing - показываем с кнопкой refresh
    if (taskStatus === 'completed' && trackStatus === 'processing') {
      return true;
    }
    
    // Не показываем полностью завершенные
    if (taskStatus === 'completed' && trackStatus === 'completed') {
      return false;
    }
    
    // Не показываем ошибочные старше 5 минут
    if (taskStatus === 'failed') {
      const taskAge = Date.now() - new Date(t.created_at).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (taskAge > fiveMinutes) {
        return false;
      }
      return true;
    }
    
    // Не показываем задачи старше 15 минут в статусе processing
    if (taskStatus === 'processing') {
      const taskAge = Date.now() - new Date(t.created_at).getTime();
      const fifteenMinutes = 15 * 60 * 1000;
      if (taskAge > fifteenMinutes) {
        return false;
      }
    }
    
    return taskStatus === 'pending' || taskStatus === 'processing' || trackStatus === 'streaming_ready';
  });

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 w-80 space-y-2 max-h-[80vh] overflow-y-auto">
        {activeTasks.map((task) => {
          const taskStatus = task.status;
          const trackStatus = task.tracks?.status || task.status;
          const displayStatus = trackStatus;
          const progress = getProgress(displayStatus);

          return (
            <Card
              key={task.id}
              className={cn(
                'glass-card border-primary/20 p-4 animate-in slide-in-from-right',
                displayStatus === 'failed' && 'border-destructive/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(displayStatus)}</div>
                
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
                    {getStatusText(displayStatus)}
                    {taskStatus === 'completed' && trackStatus === 'processing' && (
                      <span className="text-yellow-500 ml-1">
                        - синхронизация...
                      </span>
                    )}
                  </p>

                  {displayStatus !== 'failed' && (
                    <Progress value={progress} className="h-1.5" />
                  )}

                  {/* Force refresh button for stuck tasks */}
                  {(displayStatus === 'processing' || (taskStatus === 'completed' && trackStatus === 'processing')) && (
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
                          Обновить
                        </>
                      )}
                    </Button>
                  )}

                  {/* Streaming ready - показываем аудиоплеер */}
                  {displayStatus === 'streaming_ready' && task.tracks?.streaming_url && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-primary">
                        ⚡ Можно начинать слушать
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-full text-xs gap-1"
                        onClick={() => setPlayingTrackId(
                          playingTrackId === task.tracks?.id ? null : task.tracks?.id || null
                        )}
                      >
                        {playingTrackId === task.tracks?.id ? (
                          <>
                            <Pause className="w-3 h-3" />
                            Остановить
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Прослушать
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mini Audio Player for streaming tracks */}
      {playingTrackId && (() => {
        const task = activeTasks.find(t => t.tracks?.id === playingTrackId);
        const track = task?.tracks;
        
        return track && (
          <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto">
            <AudioPlayer
              trackId={track.id}
              title={track.title || 'Генерируется...'}
              streamingUrl={track.streaming_url}
              localAudioUrl={track.local_audio_url}
              audioUrl={track.audio_url}
              coverUrl={track.cover_url}
            />
          </div>
        );
      })()}
    </>
  );
};