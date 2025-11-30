import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface GenerationTask {
  id: string;
  suno_task_id: string | null;
  status: string;
  track_id: string | null;
  created_at: string;
  tracks?: {
    status: string | null;
  } | null;
}

/**
 * Hook для автоматической проверки статуса генерации треков
 * Каждые 10 секунд проверяет активные задачи через suno-check-status endpoint
 */
export const useGenerationPolling = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isPolling = useRef(false);
  const realtimeChannel = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    const checkActiveTasks = async () => {
      // Предотвращаем параллельные проверки
      if (isPolling.current) return;
      
      try {
        isPolling.current = true;

        // Получаем активные задачи
        const { data: tasks, error } = await supabase
          .from('generation_tasks')
          .select('id, suno_task_id, status, track_id, created_at, tracks(status)')
          .eq('user_id', user.id)
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        if (!tasks || tasks.length === 0) {
          return;
        }

        // Фильтруем только те задачи, которые действительно нужно проверить
        const tasksToCheck = (tasks as GenerationTask[]).filter(task => {
          const taskStatus = task.tracks?.status || task.status;
          
          // Не проверяем завершенные или ошибочные
          if (taskStatus === 'completed' || taskStatus === 'failed') {
            return false;
          }

          // Не проверяем задачи старше 15 минут
          const taskAge = Date.now() - new Date(task.created_at).getTime();
          const fifteenMinutes = 15 * 60 * 1000;
          if (taskAge > fifteenMinutes) {
            return false;
          }

          return true;
        });

        console.log(`Checking ${tasksToCheck.length} active generation tasks`);

        // Проверяем все задачи параллельно для ускорения
        await Promise.all(
          tasksToCheck.map(async (task) => {
            try {
              const { error: checkError } = await supabase.functions.invoke('suno-check-status', {
                body: { taskId: task.id },
              });

              if (checkError) {
                console.error(`Error checking task ${task.id}:`, checkError);
              } else {
                console.log(`Checked task ${task.id}`);
              }
            } catch (taskError) {
              console.error(`Error invoking check for task ${task.id}:`, taskError);
            }
          })
        );

        // Инвалидируем кеш треков чтобы обновить UI
        if (tasksToCheck.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
        }
      } catch (error) {
        console.error('Error in polling:', error);
      } finally {
        isPolling.current = false;
      }
    };

    // Setup realtime subscription for instant updates
    const setupRealtime = () => {
      realtimeChannel.current = supabase
        .channel('generation_tasks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'generation_tasks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Realtime update:', payload);
            // Invalidate queries on any change
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
            queryClient.invalidateQueries({ queryKey: ['generation_tasks'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tracks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Track realtime update:', payload);
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
          }
        )
        .subscribe();
    };

    setupRealtime();

    // Первая проверка сразу после монтирования
    checkActiveTasks();

    // Затем проверяем каждые 5 секунд (уменьшено с 10 для быстрее обновлений)
    pollingInterval.current = setInterval(checkActiveTasks, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [user?.id, queryClient]);
};
