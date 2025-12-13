// useUpdateProfile hook - Sprint 011 Phase 3
// Update user profile with optimistic UI and image upload

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProfileUpdateInput } from '@/types/profile';

interface UpdateProfileParams {
  userId: string;
  updates: ProfileUpdateInput;
  avatarFile?: File;
  bannerFile?: File;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates, avatarFile, bannerFile }: UpdateProfileParams) => {
      let avatarUrl = updates.avatar_url;
      let bannerUrl = updates.banner_url;

      // Upload avatar if provided
      if (avatarFile) {
        const fileName = `${userId}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);

        avatarUrl = publicUrl;
      }

      // Upload banner if provided
      if (bannerFile) {
        const fileName = `${userId}-${Date.now()}.${bannerFile.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, bannerFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(uploadData.path);

        bannerUrl = publicUrl;
      }

      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      toast.success('Профиль обновлен');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Не удалось обновить профиль');
    },
  });
}
