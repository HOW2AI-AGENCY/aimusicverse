import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Track } from '@/types/track';

type SeparationMode = 'simple' | 'detailed';

interface SeparationParams {
  track: Track;
  mode: SeparationMode;
}

export const useStemSeparation = () => {
  const [separatingTrackId, setSeparatingTrackId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const separateMutation = useMutation({
    mutationFn: async ({ track, mode }: SeparationParams) => {
      if (!track.audio_url || !track.suno_id) {
        throw new Error('Недостаточно данных для разделения');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          taskId: track.suno_task_id,  // Edge function expects suno_task_id, not track.id
          audioId: track.suno_id,
          mode,
          userId: user.id,
        }
      });

      if (error) throw error;
      return data;
    },
    onMutate: ({ track }) => {
      setSeparatingTrackId(track.id);
    },
    onSuccess: (_, { mode }) => {
      toast.success(
        mode === 'simple' 
          ? 'Разделение на 2 стема запущено' 
          : 'Разделение на 6+ стемов запущено',
        { description: 'Процесс займёт 1-3 минуты' }
      );
    },
    onError: (error: Error) => {
      logger.error('Error separating stems', error);
      toast.error('Ошибка при разделении стемов', {
        description: error.message
      });
    },
    onSettled: () => {
      setSeparatingTrackId(null);
      queryClient.invalidateQueries({ queryKey: ['track-stems'] });
      queryClient.invalidateQueries({ queryKey: ['stem-separation-tasks'] });
    }
  });

  const separate = useCallback((track: Track, mode: SeparationMode) => {
    return separateMutation.mutateAsync({ track, mode });
  }, [separateMutation]);

  const canSeparate = useCallback((track: Track) => {
    return !!track.suno_id && !!track.audio_url;
  }, []);

  return {
    separate,
    canSeparate,
    isSeparating: separateMutation.isPending,
    separatingTrackId,
    isTrackSeparating: (trackId: string) => separatingTrackId === trackId,
  };
};
