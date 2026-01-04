import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ReferenceStem {
  vocal_stem_url: string | null;
  instrumental_stem_url: string | null;
  drums_stem_url: string | null;
  bass_stem_url: string | null;
  other_stem_url: string | null;
  stems_status: string | null;
}

export function useReferenceStems(referenceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [separationProgress, setSeparationProgress] = useState(0);

  const separateStemsMutation = useMutation({
    mutationFn: async (params: { referenceId: string; mode?: 'simple' | 'detailed' }) => {
      if (!user) throw new Error('Not authenticated');

      setSeparationProgress(10);

      const { data, error } = await supabase.functions.invoke('separate-reference-stems', {
        body: {
          reference_id: params.referenceId,
          user_id: user.id,
          mode: params.mode || 'simple',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSeparationProgress(100);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-audio', user?.id] });
      toast.success('Стемы разделены');
    },
    onError: (error) => {
      setSeparationProgress(0);
      toast.error(error instanceof Error ? error.message : 'Ошибка разделения');
    },
  });

  const getStems = (audio: ReferenceStem): { type: string; url: string; label: string }[] => {
    const stems: { type: string; url: string; label: string }[] = [];
    
    if (audio.vocal_stem_url) {
      stems.push({ type: 'vocal', url: audio.vocal_stem_url, label: '🎤 Вокал' });
    }
    if (audio.instrumental_stem_url) {
      stems.push({ type: 'instrumental', url: audio.instrumental_stem_url, label: '🎸 Инструментал' });
    }
    if (audio.drums_stem_url) {
      stems.push({ type: 'drums', url: audio.drums_stem_url, label: '🥁 Ударные' });
    }
    if (audio.bass_stem_url) {
      stems.push({ type: 'bass', url: audio.bass_stem_url, label: '🎸 Бас' });
    }
    if (audio.other_stem_url) {
      stems.push({ type: 'other', url: audio.other_stem_url, label: '🎹 Другое' });
    }

    return stems;
  };

  const hasStems = (audio: ReferenceStem): boolean => {
    return audio.stems_status === 'completed' && getStems(audio).length > 0;
  };

  return {
    separateStems: separateStemsMutation.mutateAsync,
    isSeparating: separateStemsMutation.isPending,
    separationProgress,
    getStems,
    hasStems,
  };
}
