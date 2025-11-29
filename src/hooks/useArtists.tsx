import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Artist {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  style_description: string | null;
  voice_sample_url: string | null;
  genre_tags: string[] | null;
  mood_tags: string[] | null;
  is_ai_generated: boolean;
  suno_persona_id: string | null;
  metadata: any | null;
  created_at: string;
  updated_at: string;
}

export const useArtists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: artists, isLoading, error } = useQuery({
    queryKey: ['artists', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Artist[];
    },
    enabled: !!user?.id,
  });

  const createArtist = useMutation({
    mutationFn: async (artistData: Partial<Artist> & { name: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('artists')
        .insert([{
          user_id: user.id,
          ...artistData,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists', user?.id] });
      toast.success('Артист создан успешно');
    },
    onError: (error: any) => {
      console.error('Error creating artist:', error);
      toast.error('Ошибка создания артиста');
    },
  });

  const updateArtist = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Artist> }) => {
      const { data, error } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists', user?.id] });
      toast.success('Артист обновлен');
    },
    onError: (error: any) => {
      console.error('Error updating artist:', error);
      toast.error('Ошибка обновления артиста');
    },
  });

  const deleteArtist = useMutation({
    mutationFn: async (artistId: string) => {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists', user?.id] });
      toast.success('Артист удален');
    },
    onError: (error: any) => {
      console.error('Error deleting artist:', error);
      toast.error('Ошибка удаления артиста');
    },
  });

  return {
    artists,
    isLoading,
    error,
    createArtist: createArtist.mutate,
    updateArtist: updateArtist.mutate,
    deleteArtist: deleteArtist.mutate,
    isCreating: createArtist.isPending,
    isUpdating: updateArtist.isPending,
    isDeleting: deleteArtist.isPending,
  };
};
