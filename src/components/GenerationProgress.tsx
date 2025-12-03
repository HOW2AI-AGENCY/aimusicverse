import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Music2, CheckCircle2, XCircle, Radio, RefreshCw, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AudioPlayer } from './AudioPlayer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGenerationRealtime } from '@/hooks/useGenerationRealtime';
import { useIsMobile } from '@/hooks/use-mobile';

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

const fetchGenerationTasks = async (userId: string) => {
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }
  return data as GenerationTask[];
};


export const GenerationProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});

  // Set up realtime updates for generation tasks
  useGenerationRealtime();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['generation_tasks', user?.id],
    queryFn: () => fetchGenerationTasks(user!.id),
    enabled: !!user,
  });

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
      case 'timeout':
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
      case 'timeout':
        return 'Таймаут';
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
      case 'timeout':
        return 0;
      default:
        return 0;
    }
  };

  const handleCheckStatus = async (taskId: string, useFallback = false) => {
    setCheckingStatus(taskId);
    const currentRetries = retryCount[taskId] || 0;
    
    try {
      console.log(`Checking status for task: ${taskId}, retry: ${currentRetries}, useFallback: ${useFallback}`);
      
      const { data, error } = await supabase.functions.invoke('suno-check-status', {
        body: { taskId, useFallback: useFallback || currentRetries >= 2 },
      });

      console.log('Check status response:', data);

      if (error) {
        console.error('Check status error:', error);
        
        // Increment retry count and try fallback if needed
        const newRetries = currentRetries + 1;
        setRetryCount(prev => ({ ...prev, [taskId]: newRetries }));
        
        if (newRetries < 3) {
          toast.info('Повторная попытка...', {
            description: `Попытка ${newRetries + 1} из 3`,
          });
          // Wait and retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, newRetries)));
          return handleCheckStatus(taskId, newRetries >= 2);
        }
        
        throw error;
      }

      // Reset retry count on success
      setRetryCount(prev => ({ ...prev, [taskId]: 0 }));

      // Invalidate queries to refetch data
      await queryClient.invalidateQueries({ queryKey: ['generation_tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['generation_tasks'] });

      if (data.status === 'completed') {
        toast.success('Трек готов! 🎵', {
          description: 'Генерация успешно завершена',
        });
        
        // Trigger automatic audio analysis
        if (data.track?.audioUrl) {
          console.log('Triggering automatic audio analysis for track:', data.track.id);
          supabase.functions.invoke('analyze-audio-flamingo', {
            body: {
              track_id: data.track.id,
              audio_url: data.track.audioUrl,
              analysis_type: 'auto',
            },
          }).then(({ data: analysisData, error: analysisError }) => {
            if (analysisError) {
              console.error('Auto-analysis error:', analysisError);
            } else {
              console.log('Auto-analysis started:', analysisData);
              toast.info('Анализ запущен', {
                description: 'AI анализирует ваш трек',
              });
            }
          });
        }
      } else if (data.status === 'failed') {
        toast.error('Ошибка генерации', {
          description: data.error || 'Не удалось сгенерировать трек',
        });
      } else {
        toast.info('Генерация продолжается', {
          description: `Статус: ${data.status || data.progress || 'обработка'}`,
        });
      }
    } catch (error: unknown) {
      console.error('Check status error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не удалось проверить статус';
      toast.error('Ошибка проверки', {
        description: errorMessage,
        action: {
          label: 'Повторить',
          onClick: () => handleCheckStatus(taskId, true),
        },
      });
    } finally {
      setCheckingStatus(null);
    }
  };

  if (isLoading) {
    return null;
  }

  const activeTasks = tasks.filter((t) => {
    const taskStatus = t.status;
    const trackStatus = t.tracks?.status;
    const taskAge = Date.now() - new Date(t.created_at).getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    
    // Task completed but track still processing - show with refresh button
    if (taskStatus === 'completed' && trackStatus === 'processing') {
      return true;
    }
    
    // Don't show fully completed tasks
    if (taskStatus === 'completed' && trackStatus === 'completed') {
      return false;
    }
    
    // Show failed tasks for 5 minutes
    if (taskStatus === 'failed') {
      return taskAge < fiveMinutes;
    }
    
    // Mark old processing tasks as timeout but still show them
    if (taskStatus === 'processing' && taskAge > fifteenMinutes) {
      return true; // Show as timeout with retry option
    }
    
    return taskStatus === 'pending' || taskStatus === 'processing' || trackStatus === 'streaming_ready';
  });

  if (activeTasks.length === 0) {
    return null;
  }

  // Collapsed view for mobile
  if (isMobile && isCollapsed && activeTasks.length > 0) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50">
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2 shadow-lg min-h-[44px]"
          onClick={() => setIsCollapsed(false)}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{activeTasks.length} генерация в процессе</span>
          <ChevronUp className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "fixed z-50 space-y-2 max-h-[60vh] overflow-y-auto",
        isMobile 
          ? "bottom-20 left-2 right-2" 
          : "top-4 right-4 w-80"
      )}>
        {/* Collapse button for mobile */}
        {isMobile && activeTasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mb-1 h-8"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Свернуть
          </Button>
        )}
        
        {activeTasks.map((task) => {
          const taskStatus = task.status;
          const trackStatus = task.tracks?.status || task.status;
          const taskAge = Date.now() - new Date(task.created_at).getTime();
          const fifteenMinutes = 15 * 60 * 1000;
          
          // Determine display status
          let displayStatus = trackStatus;
          if (taskStatus === 'processing' && taskAge > fifteenMinutes) {
            displayStatus = 'timeout';
          }
          
          const progress = getProgress(displayStatus);

          return (
            <Card
              key={task.id}
              className={cn(
                'glass-card border-primary/20 p-3 sm:p-4 animate-in slide-in-from-right',
                displayStatus === 'failed' && 'border-destructive/20',
                displayStatus === 'timeout' && 'border-yellow-500/20'
              )}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="mt-0.5">{getStatusIcon(displayStatus)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {task.tracks?.title || task.prompt.substring(0, 30)}
                    </p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                      {task.model_used || 'V4'}
                    </Badge>
                  </div>

                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                    {getStatusText(displayStatus)}
                    {taskStatus === 'completed' && trackStatus === 'processing' && (
                      <span className="text-yellow-500 ml-1">
                        - синхронизация...
                      </span>
                    )}
                    {displayStatus === 'timeout' && (
                      <span className="text-yellow-500 ml-1">
                        - превышено время ожидания
                      </span>
                    )}
                  </p>

                  {displayStatus !== 'failed' && displayStatus !== 'timeout' && (
                    <Progress value={progress} className="h-1 sm:h-1.5" />
                  )}

                  {/* Refresh button for stuck/timeout tasks */}
                  {(displayStatus === 'processing' || displayStatus === 'timeout' || 
                    (taskStatus === 'completed' && trackStatus === 'processing')) && (
                    <Button
                      size="sm"
                      variant={displayStatus === 'timeout' ? 'default' : 'ghost'}
                      className="h-7 text-[10px] sm:text-xs mt-2 min-h-[44px] touch-manipulation"
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
                          {displayStatus === 'timeout' ? 'Проверить статус' : 'Обновить'}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Streaming ready - show audio player button */}
                  {displayStatus === 'streaming_ready' && task.tracks?.streaming_url && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] sm:text-xs text-primary">
                        ⚡ Можно начинать слушать
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 sm:h-7 w-full text-[10px] sm:text-xs gap-1 min-h-[44px] touch-manipulation"
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
          <div className={cn(
            "fixed z-40",
            isMobile 
              ? "bottom-2 left-2 right-2" 
              : "bottom-4 left-4 right-4 max-w-2xl mx-auto"
          )}>
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