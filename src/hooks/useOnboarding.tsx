import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface OnboardingStatus {
  id: string;
  user_id: string;
  completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Получение статуса онбординга
  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ['onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Если записи нет, создаём её
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('user_onboarding')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          return newData as OnboardingStatus;
        }
        throw error;
      }

      return data as OnboardingStatus;
    },
    enabled: !!user?.id,
  });

  // Завершение онбординга
  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_onboarding')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
      toast.success('Добро пожаловать в MusicVerse!', {
        description: 'Начните создавать свою первую композицию',
      });
    },
    onError: (error) => {
      console.error('Error completing onboarding:', error);
      toast.error('Ошибка', {
        description: 'Не удалось завершить онбординг',
      });
    },
  });

  // Пропуск онбординга
  const skipOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_onboarding')
        .update({
          skipped: true,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
    },
    onError: (error) => {
      console.error('Error skipping onboarding:', error);
      toast.error('Ошибка', {
        description: 'Не удалось пропустить онбординг',
      });
    },
  });

  // Обновление текущего шага
  const updateStep = useMutation({
    mutationFn: async (step: number) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_onboarding')
        .update({ current_step: step })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating onboarding step:', error);
    },
  });

  const shouldShowOnboarding = !isLoading && onboardingStatus && !onboardingStatus.completed;

  return {
    onboardingStatus,
    isLoading,
    shouldShowOnboarding,
    completeOnboarding: completeOnboarding.mutate,
    skipOnboarding: skipOnboarding.mutate,
    updateStep: updateStep.mutate,
    isCompleting: completeOnboarding.isPending,
    isSkipping: skipOnboarding.isPending,
  };
};
