import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function useReplaceSectionRealtime(trackId: string) {
  const queryClient = useQueryClient();
  const { setLatestCompletion } = useSectionEditorStore();
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
        async (payload) => {
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

            // Fetch section timing from track_change_log
            let sectionStart = 0;
            let sectionEnd = 0;
            
            try {
              const { data: logEntry } = await supabase
                .from('track_change_log')
                .select('metadata')
                .eq('track_id', trackId)
                .eq('change_type', 'replace_section_started')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              const metadata = logEntry?.metadata as { infillStartS?: number; infillEndS?: number } | null;
              sectionStart = metadata?.infillStartS ?? 0;
              sectionEnd = metadata?.infillEndS ?? 0;
            } catch (e) {
              logger.error('Failed to fetch section timing', e);
            }

            // Update completion state for compare panel
            setLatestCompletion({
              taskId: task.id,
              originalAudioUrl: '', // Will be fetched from track
              newAudioUrl,
              section: { start: sectionStart, end: sectionEnd },
              status: 'completed',
            });
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
  }, [trackId, queryClient, setLatestCompletion, success, error]);
}
