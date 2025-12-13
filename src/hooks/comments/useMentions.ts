// useMentions Hook - Sprint 011 Task T053
// Search users for @mention autocomplete

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface MentionUser {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
}

/**
 * Hook to search users for mention autocomplete
 * Debounced search with username/display name matching
 */
export function useMentions(query: string, enabled: boolean = true) {
  const trimmedQuery = query.trim().toLowerCase();

  const searchQuery = useQuery({
    queryKey: ['mentions', trimmedQuery],
    queryFn: async () => {
      if (!trimmedQuery || trimmedQuery.length < 2) {
        return [];
      }

      // Search by username or display name
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_verified')
        .or(
          `username.ilike.%${trimmedQuery}%,display_name.ilike.%${trimmedQuery}%`
        )
        .limit(10);

      if (error) {
        console.error('Error searching users for mentions:', error);
        throw error;
      }

      return (data || []).map(
        (user): MentionUser => ({
          userId: user.user_id,
          username: user.username || '',
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isVerified: user.is_verified || false,
        })
      );
    },
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sort results by relevance
  const sortedUsers = useMemo(() => {
    if (!searchQuery.data) return [];

    return [...searchQuery.data].sort((a, b) => {
      // Exact match on username comes first
      const aExactUsername = a.username?.toLowerCase() === trimmedQuery;
      const bExactUsername = b.username?.toLowerCase() === trimmedQuery;
      if (aExactUsername && !bExactUsername) return -1;
      if (!aExactUsername && bExactUsername) return 1;

      // Starts with query comes next
      const aStartsWith = a.username?.toLowerCase().startsWith(trimmedQuery);
      const bStartsWith = b.username?.toLowerCase().startsWith(trimmedQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Verified users come before unverified
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;

      // Alphabetical
      return (a.username || '').localeCompare(b.username || '');
    });
  }, [searchQuery.data, trimmedQuery]);

  return {
    users: sortedUsers,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error,
  };
}
