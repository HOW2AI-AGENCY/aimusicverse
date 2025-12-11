import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SunoCreditsResponse {
  credits_left: number;
  period: string;
  monthly_limit: number;
  monthly_usage: number;
}

export function useSunoCredits() {
  return useQuery({
    queryKey: ['suno-credits'],
    queryFn: async (): Promise<SunoCreditsResponse | null> => {
      const { data, error } = await supabase.functions.invoke('suno-credits');
      
      if (error) {
        console.error('Error fetching Suno credits:', error);
        return null;
      }
      
      if (!data?.success) {
        console.error('Suno credits response unsuccessful:', data);
        return null;
      }
      
      return data.credits as SunoCreditsResponse;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
  });
}
