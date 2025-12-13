// useUpdateProfile Hook - Sprint 011 Task T028
// Mutation for updating profile fields with image upload support

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { ProfileExtended } from '@/types/profile';

const profileLogger = logger.child({ module: 'useUpdateProfile' });

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatarFile?: File;
  bannerFile?: File;
  socialLinks?: Record<string, string>;
  privacyLevel?: 'public' | 'followers' | 'private';
}

async function uploadImage(
  file: File,
  bucket: 'avatars' | 'banners',
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  profileLogger.debug('Uploading image', { bucket, fileName, size: file.size });

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    profileLogger.error('Error uploading image', { bucket, error: uploadError });
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  
  return data.publicUrl;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      profileLogger.debug('Updating profile', { userId, fields: Object.keys(data) });

      let avatarUrl: string | undefined;
      let bannerUrl: string | undefined;

      // Upload images if provided
      if (data.avatarFile) {
        avatarUrl = await uploadImage(data.avatarFile, 'avatars', userId);
      }

      if (data.bannerFile) {
        bannerUrl = await uploadImage(data.bannerFile, 'banners', userId);
      }

      // Prepare update data
      const updateData: any = {};
      
      if (data.displayName !== undefined) {
        updateData.display_name = data.displayName;
      }
      if (data.bio !== undefined) {
        updateData.bio = data.bio;
      }
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      if (bannerUrl) {
        updateData.banner_url = bannerUrl;
      }
      if (data.socialLinks !== undefined) {
        updateData.social_links = data.socialLinks;
      }
      if (data.privacyLevel !== undefined) {
        updateData.privacy_level = data.privacyLevel;
      }

      updateData.updated_at = new Date().toISOString();

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        profileLogger.error('Error updating profile', { userId, error });
        throw error;
      }

      profileLogger.info('Profile updated successfully', { userId });

      return { userId, ...updateData };
    },
    onMutate: async (newData) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile', userId] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileExtended>(['profile', userId]);

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<ProfileExtended>(['profile', userId], {
          ...previousProfile,
          displayName: newData.displayName ?? previousProfile.displayName,
          bio: newData.bio ?? previousProfile.bio,
          privacyLevel: newData.privacyLevel ?? previousProfile.privacyLevel,
          socialLinks: newData.socialLinks ?? previousProfile.socialLinks,
        });
      }

      return { previousProfile };
    },
    onError: (error, _newData, context) => {
      const { data: session } = supabase.auth.getSession();
      session.then(({ data }) => {
        const userId = data.session?.user?.id;
        if (userId && context?.previousProfile) {
          queryClient.setQueryData(['profile', userId], context.previousProfile);
        }
      });
      profileLogger.error('Error in profile update mutation', { error });
    },
    onSuccess: () => {
      const { data: session } = supabase.auth.getSession();
      session.then(({ data }) => {
        const userId = data.session?.user?.id;
        if (userId) {
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
      });
    },
  });
}
