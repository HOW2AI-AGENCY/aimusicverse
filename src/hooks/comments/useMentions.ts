// useMentions hook - Sprint 011 Phase 5
// Search users for @mention autocomplete

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MentionUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

interface UseMentionsParams {
  searchQuery: string;
  enabled?: boolean;
  limit?: number;
}

export function useMentions({ searchQuery, enabled = true, limit = 10 }: UseMentionsParams) {
  return useQuery({
    queryKey: ['mentions', searchQuery],
    queryFn: async (): Promise<MentionUser[]> => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const searchTerm = searchQuery.toLowerCase();

      // Search by username or display name
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_verified')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .eq('is_public', true)
        .limit(limit);

      if (error) {
        console.error('Error searching users for mentions:', error);
        throw error;
      }

      return (data || []).map((profile) => ({
        userId: profile.user_id,
        username: profile.username || profile.user_id.slice(0, 8),
        displayName: profile.display_name || undefined,
        avatarUrl: profile.avatar_url || undefined,
        isVerified: profile.is_verified || false,
      }));
    },
    enabled: enabled && searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
