// useProfile Hook - Sprint 011 Task T027
// Fetch profile data with TanStack Query caching

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileExtended } from '@/types/profile';
import { logger } from '@/lib/logger';

const profileLogger = logger.child({ module: 'useProfile' });

interface ProfileData {
  id: string;
  user_id: string;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  photo_url: string | null;
  language_code: string | null;
  is_verified: boolean;
  is_public: boolean;
  privacy_level: 'public' | 'followers' | 'private';
  social_links: any;
  stats_followers: number;
  stats_following: number;
  stats_tracks: number;
  stats_likes_received: number;
  created_at: string;
  updated_at: string;
}

function transformProfileData(data: ProfileData): ProfileExtended {
  return {
    id: data.id,
    userId: data.user_id,
    telegramId: data.telegram_id,
    firstName: data.first_name,
    lastName: data.last_name || undefined,
    username: data.username || undefined,
    displayName: data.display_name || undefined,
    bio: data.bio || undefined,
    avatarUrl: data.avatar_url || undefined,
    bannerUrl: data.banner_url || undefined,
    photoUrl: data.photo_url || undefined,
    languageCode: data.language_code || undefined,
    isVerified: data.is_verified,
    isPublic: data.is_public,
    privacyLevel: data.privacy_level,
    socialLinks: data.social_links || {},
    stats: {
      followers: data.stats_followers,
      following: data.stats_following,
      tracks: data.stats_tracks,
      likesReceived: data.stats_likes_received,
    },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileExtended> => {
      profileLogger.debug('Fetching profile', { userId });

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        profileLogger.error('Error fetching profile', { userId, error });
        throw error;
      }

      if (!data) {
        throw new Error('Profile not found');
      }

      return transformProfileData(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  });
}

// Hook to get current user's profile
export function useCurrentProfile() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  return useProfile(session?.user?.id || '');
}
