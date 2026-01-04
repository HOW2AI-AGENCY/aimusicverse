/**
 * Broadcast Hooks
 * 
 * Hooks for sending broadcast notifications and managing templates
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BroadcastData {
  title: string;
  message: string;
  targetType?: string;
  blogPostId?: string;
  imageUrl?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}

interface BroadcastTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: BroadcastData) => {
      const { data: result, error } = await supabase.functions.invoke("broadcast-notification", {
        body: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Отправлено: ${result.sentCount}, ошибок: ${result.failedCount}`);
      if (result.templateSaved) {
        queryClient.invalidateQueries({ queryKey: ['broadcast-templates'] });
        toast.success(`Шаблон "${result.templateSaved}" сохранён`);
      }
    },
    onError: (error) => {
      toast.error("Ошибка рассылки: " + error.message);
    },
  });
}

export function useBroadcastTemplates() {
  return useQuery({
    queryKey: ['broadcast-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BroadcastTemplate[];
    },
  });
}

export function useSaveBroadcastTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; title: string; message: string; imageUrl?: string }) => {
      const { data: result, error } = await supabase
        .from('broadcast_templates')
        .insert({
          name: data.name,
          title: data.title,
          message: data.message,
          image_url: data.imageUrl || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-templates'] });
      toast.success('Шаблон сохранён');
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + error.message);
    },
  });
}

export function useDeleteBroadcastTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('broadcast_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-templates'] });
      toast.success('Шаблон удалён');
    },
    onError: (error) => {
      toast.error('Ошибка удаления: ' + error.message);
    },
  });
}
