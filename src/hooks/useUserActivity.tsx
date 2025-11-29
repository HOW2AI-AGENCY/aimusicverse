import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (activity: { action_type: string; action_data?: any }) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          ...activity,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_activity', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить действие",
        variant: "destructive",
      });
    },
  });
};
