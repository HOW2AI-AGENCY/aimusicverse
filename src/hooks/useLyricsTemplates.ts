import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LyricsTemplate {
  id: string;
  user_id: string;
  name: string;
  lyrics: string;
  style: string | null;
  genre: string | null;
  mood: string | null;
  tags: string[] | null;
  structure: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface SaveTemplateData {
  name: string;
  lyrics: string;
  style?: string;
  genre?: string;
  mood?: string;
  tags?: string[];
  structure?: string;
  language?: string;
}

export function useLyricsTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['lyrics-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('lyrics_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LyricsTemplate[];
    },
    enabled: !!user,
  });

  const saveTemplate = useMutation({
    mutationFn: async (templateData: SaveTemplateData) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('lyrics_templates')
        .insert({
          user_id: user.id,
          name: templateData.name,
          lyrics: templateData.lyrics,
          style: templateData.style || null,
          genre: templateData.genre || null,
          mood: templateData.mood || null,
          tags: templateData.tags || null,
          structure: templateData.structure || null,
          language: templateData.language || 'ru',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lyrics-templates'] });
      toast.success('Шаблон сохранён');
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error('Ошибка сохранения шаблона');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('lyrics_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lyrics-templates'] });
      toast.success('Шаблон удален');
    },
  });

  return {
    templates,
    isLoading,
    saveTemplate: saveTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutate,
    isSaving: saveTemplate.isPending,
  };
}