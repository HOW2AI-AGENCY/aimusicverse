import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

import type { Json } from '@/integrations/supabase/types';

interface Activity {
  action_type: string;
  action_data?: Json;
}

export const useUserActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: Activity) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from('user_activity')
        .insert([{
          user_id: user.id,
          action_type: activity.action_type,
          action_data: activity.action_data,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_activity', user?.id] });
    },
    onError: (error) => {
      toast.error("Не удалось сохранить действие", {
        description: error.message,
      });
    },
  });
};
