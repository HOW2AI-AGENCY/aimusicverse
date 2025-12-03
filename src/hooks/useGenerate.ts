import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GenerateParams {
  mode?: 'simple' | 'custom';
  prompt: string;
  title?: string;
  style?: string;
  instrumental?: boolean;
  negativeTags?: string;
  vocalGender?: 'male' | 'female';
  styleWeight?: number;
  model?: string;
  projectId?: string;
  personaId?: string;
}

export interface GenerateResult {
  success: boolean;
  trackId?: string;
  taskId?: string;
  sunoTaskId?: string;
  error?: string;
}

export function useGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateParams): Promise<GenerateResult> => {
      const { data, error } = await supabase.functions.invoke('suno-music-generate', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Ошибка генерации');
      }

      if (!data.success) {
        throw new Error(data.error || 'Ошибка генерации');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Генерация запущена', {
        description: 'Трек будет готов через 1-2 минуты',
      });
      
      // Invalidate tracks query to show new pending track
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['generation-tasks'] });
    },
    onError: (error: Error) => {
      const message = error.message;
      
      if (message.includes('429') || message.includes('лимит')) {
        toast.error('Превышен лимит запросов', {
          description: 'Попробуйте позже',
        });
      } else if (message.includes('402') || message.includes('кредит')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс',
        });
      } else {
        toast.error('Ошибка генерации', {
          description: message,
        });
      }
    },
  });
}
