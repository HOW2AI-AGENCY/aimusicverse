// FollowingList component - Sprint 011 Phase 4
// Virtualized list of users being followed with search

import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useFollowing } from '@/hooks/social/useFollowing';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FollowButton } from './FollowButton';
import { Search, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FollowingListProps {
  userId: string;
  className?: string;
}

export function FollowingList({ userId, className }: FollowingListProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFollowing({
    userId,
    searchQuery,
  });

  const allFollowing = data?.pages.flatMap((page) => page.following) || [];

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
        <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Не удалось загрузить подписки</p>
      </div>
    );
  }

  if (allFollowing.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {searchQuery ? 'Подписки не найдены' : 'Пока нет подписок'}
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
            placeholder="Поиск подписок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Virtualized List */}
      <Virtuoso
        style={{ height: '100%' }}
        data={allFollowing}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, following) => (
          <div
            key={following.id}
            className="flex items-center justify-between p-4 border-b hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                className="h-12 w-12 cursor-pointer"
                onClick={() => navigate(`/profile/${following.userId}`)}
              >
                <AvatarImage src={following.avatarUrl} alt={following.displayName || following.username} />
                <AvatarFallback>
                  {(following.displayName || following.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/profile/${following.userId}`)}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {following.displayName || following.username || 'Пользователь'}
                  </button>
                  {following.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  {following.followsYouBack && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Подписан на вас
                    </Badge>
                  )}
                </div>
                {following.bio && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {following.bio}
                  </p>
                )}
              </div>
            </div>

            <FollowButton userId={following.userId} size="sm" />
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
