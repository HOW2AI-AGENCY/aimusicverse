// FollowersList component - Sprint 011 Phase 4
// Virtualized list of user's followers with search

import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useFollowers } from '@/hooks/social/useFollowers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FollowButton } from './FollowButton';
import { Search, Loader2, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FollowersListProps {
  userId: string;
  className?: string;
}

export function FollowersList({ userId, className }: FollowersListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFollowers({
    userId,
    searchQuery,
  });

  const allFollowers = data?.pages.flatMap((page) => page.followers) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Не удалось загрузить подписчиков</p>
      </div>
    );
  }

  if (allFollowers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {searchQuery ? 'Подписчики не найдены' : 'Пока нет подписчиков'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск подписчиков..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Virtualized List */}
      <Virtuoso
        style={{ height: '100%' }}
        data={allFollowers}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, follower) => (
          <div
            key={follower.id}
            className="flex items-center justify-between p-4 border-b hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                className="h-12 w-12 cursor-pointer"
                onClick={() => navigate(`/profile/${follower.userId}`)}
              >
                <AvatarImage src={follower.avatarUrl} alt={follower.displayName || follower.username} />
                <AvatarFallback>
                  {(follower.displayName || follower.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/profile/${follower.userId}`)}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {follower.displayName || follower.username || 'Пользователь'}
                  </button>
                  {follower.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  {follower.isFollowingBack && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Взаимно
                    </Badge>
                  )}
                </div>
                {follower.bio && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {follower.bio}
                  </p>
                )}
              </div>
            </div>

            <FollowButton userId={follower.userId} size="sm" />
          </div>
        )}
        components={{
          Footer: () =>
            isFetchingNextPage ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : null,
        }}
      />
    </div>
  );
}
