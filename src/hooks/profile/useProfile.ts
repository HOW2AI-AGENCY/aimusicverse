// useProfile hook - Sprint 011 Phase 3
// Fetch user profile with caching

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileExtended } from '@/types/profile';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<ProfileExtended | null> => {
      if (!userId) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          telegram_id,
          first_name,
          last_name,
          username,
          display_name,
          bio,
          avatar_url,
          banner_url,
          photo_url,
          language_code,
          is_verified,
          is_public,
          privacy_level,
          social_links,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!profile) return null;

      // Get follower/following counts
      const [followersResult, followingResult, tracksResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId)
          .eq('status', 'active'),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId)
          .eq('status', 'active'),
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_public', true),
      ]);

      const stats = {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
        tracks: tracksResult.count || 0,
        likesReceived: 0, // TODO: Implement when likes table is ready
      };

      return {
        id: profile.user_id,
        userId: profile.user_id,
        telegramId: profile.telegram_id,
        firstName: profile.first_name,
        lastName: profile.last_name || undefined,
        username: profile.username || undefined,
        displayName: profile.display_name || undefined,
        bio: profile.bio || undefined,
        avatarUrl: profile.avatar_url || undefined,
        bannerUrl: profile.banner_url || undefined,
        photoUrl: profile.photo_url || undefined,
        languageCode: profile.language_code || undefined,
        isVerified: profile.is_verified || false,
        isPublic: profile.is_public || false,
        privacyLevel: profile.privacy_level || 'public',
        socialLinks: profile.social_links || {},
        stats,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
