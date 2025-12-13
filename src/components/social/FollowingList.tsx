// FollowingList Component - Sprint 011 Task T035
// Virtualized list of following users with search

import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFollowing } from '@/hooks/social/useFollowing';
import { FollowButton } from './FollowButton';
import { Virtuoso } from 'react-virtuoso';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';

interface FollowingListProps {
  userId: string;
}

export function FollowingList({ userId }: FollowingListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFollowing(userId);

  const allFollowing = data?.pages.flatMap((page) => page.following) || [];

  // Filter following by search query
  const filteredFollowing = allFollowing.filter((following) => {
    if (!searchQuery) return true;
    const profile = following.profile;
    const displayName = profile.display_name?.toLowerCase() || '';
    const username = profile.username?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) || username.includes(query);
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (allFollowing.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Not following anyone yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search following..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Virtualized List */}
      <Virtuoso
        style={{ height: '400px' }}
        data={filteredFollowing}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, following) => {
          const profile = following.profile;
          return (
            <FollowingCard
              key={following.id}
              userId={profile.user_id}
              displayName={profile.display_name || profile.username || 'Unknown'}
              username={profile.username}
              avatarUrl={profile.avatar_url}
              bio={profile.bio}
              isVerified={profile.is_verified}
              onNavigate={() => navigate(`/profile/${profile.user_id}`)}
            />
          );
        }}
      />

      {isFetchingNextPage && (
        <div className="text-center py-4">
          <Skeleton className="h-20 w-full" />
        </div>
      )}
    </div>
  );
}

interface FollowingCardProps {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  onNavigate: () => void;
}

function FollowingCard({
  userId,
  displayName,
  username,
  avatarUrl,
  bio,
  isVerified,
  onNavigate,
}: FollowingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors mb-2"
    >
      {/* Avatar */}
      <button
        onClick={onNavigate}
        className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </button>

      {/* Info */}
      <button onClick={onNavigate} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <p className="font-semibold truncate">{displayName}</p>
          {isVerified && (
            <span className="text-blue-500 text-xs">✓</span>
          )}
        </div>
        {username && (
          <p className="text-sm text-muted-foreground truncate">@{username}</p>
        )}
        {bio && (
          <p className="text-xs text-muted-foreground truncate mt-1">{bio}</p>
        )}
      </button>

      {/* Following Button - Shows "Following" and allows unfollow */}
      <FollowButton userId={userId} isFollowing={true} size="sm" variant="outline" />
    </motion.div>
  );
}
