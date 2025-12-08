import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useReplaceSectionRealtime(trackId: string) {
  const queryClient = useQueryClient();
  const { setLatestCompletion, activeTaskId } = useSectionEditorStore();
  const { success, error } = useHapticFeedback();

  useEffect(() => {
    if (!trackId) return;

    const channel = supabase
      .channel(`replace-section-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_tasks',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          const task = payload.new as any;
          
          // Only handle replace_section tasks
          if (task.generation_mode !== 'replace_section') return;
          
          logger.debug('Replace section task update', { 
            taskId: task.id, 
            status: task.status 
          });

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['replaced-sections', trackId] });

          if (task.status === 'completed') {
            success();
            toast.success('Секция заменена', {
              description: 'Новая версия секции готова для прослушивания',
            });

            // Parse audio clips to get the new audio URL
            let newAudioUrl: string | undefined;
            try {
              const clips = typeof task.audio_clips === 'string' 
                ? JSON.parse(task.audio_clips) 
                : task.audio_clips;
              newAudioUrl = clips?.[0]?.source_audio_url || clips?.[0]?.audio_url;
            } catch (e) {
              logger.error('Failed to parse audio clips', e);
            }

            // If this is the active task, update completion state
            if (task.id === activeTaskId) {
              setLatestCompletion({
                taskId: task.id,
                originalAudioUrl: '', // Will be fetched from track
                newAudioUrl,
                section: { start: 0, end: 0 }, // Will be updated from metadata
                status: 'completed',
              });
            }
          } else if (task.status === 'failed') {
            error();
            toast.error('Ошибка замены секции', {
              description: task.error_message || 'Попробуйте снова',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, queryClient, setLatestCompletion, activeTaskId, success, error]);
}
