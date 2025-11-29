import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type TaskInsert = TablesInsert<"tasks">;
type TaskUpdate = TablesUpdate<"tasks">;

export const useTasks = (status?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id, status],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('tasks')
        .select('*, task_categories(*)')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (status && status !== 'all') {
        query = query.eq('status', status as 'todo' | 'in_progress' | 'completed' | 'archived');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Task & { task_categories: Tables<"task_categories"> | null })[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: Omit<TaskInsert, 'user_id'>) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача создана');
    },
    onError: () => {
      toast.error('Не удалось создать задачу');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача обновлена');
    },
    onError: () => {
      toast.error('Не удалось обновить задачу');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Задача удалена');
    },
    onError: () => {
      toast.error('Не удалось удалить задачу');
    },
  });
};

export const useTaskCategories = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task_categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: Omit<TablesInsert<"task_categories">, 'user_id'>) => {
      if (!user?.id) throw new Error("No user");

      const { data, error } = await supabase
        .from('task_categories')
        .insert({ ...category, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_categories'] });
      toast.success('Категория создана');
    },
    onError: () => {
      toast.error('Не удалось создать категорию');
    },
  });
};