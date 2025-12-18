/**
 * FollowingFeed component - displays tracks from followed users and liked creators
 */
import React, { useState } from 'react';
import { useActivityFeed, useFeedSummary } from '@/hooks/social/useActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Play, Users, Sparkles, Music2, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type FeedFilter = 'all' | 'following' | 'liked_creators';

interface FilterOption {
  value: FeedFilter;
  label: string;
  icon: React.ReactNode;
}

const filterOptions: FilterOption[] = [
  { value: 'all', label: 'Все', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'following', label: 'Подписки', icon: <UserCheck className="w-4 h-4" /> },
  { value: 'liked_creators', label: 'Понравившиеся', icon: <Heart className="w-4 h-4" /> },
];

export function FollowingFeed() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useActivityFeed({ filter });
  const feedSummary = useFeedSummary();

  const allTracks = data?.pages.flatMap(page => page.tracks) || [];

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Войдите, чтобы видеть треки от авторов
          </p>
        </CardContent>
      </Card>
    );
  }

  if (feedSummary.totalCreators === 0 && !isLoading) {
    return (
      <Card className="border-dashed bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Ваша лента пуста</h3>
          <p className="text-muted-foreground mb-4">
            Подписывайтесь на авторов или ставьте лайки трекам, чтобы видеть их новинки здесь
          </p>
          <Button asChild>
            <Link to="/community">
              <Sparkles className="w-4 h-4 mr-2" />
              Открыть для себя
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Лента подписок
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {feedSummary.totalCreators} авторов
          </Badge>
        </div>
      </CardHeader>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map(option => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(option.value)}
            className={cn(
              'flex-shrink-0',
              filter === option.value && 'shadow-md'
            )}
          >
            {option.icon}
            <span className="ml-1.5">{option.label}</span>
            {option.value === 'following' && feedSummary.followingCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {feedSummary.followingCount}
              </Badge>
            )}
            {option.value === 'liked_creators' && feedSummary.likedCreatorsCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {feedSummary.likedCreatorsCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <FeedItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Tracks list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {allTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <FeedTrackItem track={track} />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Load more */}
      {hasNextPage && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Загрузка...' : 'Показать ещё'}
          </Button>
        </div>
      )}

      {/* Empty state for filter */}
      {!isLoading && allTracks.length === 0 && feedSummary.totalCreators > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {filter === 'following' && 'Нет новых треков от ваших подписок'}
              {filter === 'liked_creators' && 'Нет новых треков от понравившихся авторов'}
              {filter === 'all' && 'Нет новых треков'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FeedTrackItemProps {
  track: {
    id: string;
    title: string;
    style: string | null;
    coverUrl: string | null;
    durationSeconds: number | null;
    createdAt: string;
    likesCount: number;
    playCount: number;
    creator: {
      userId: string;
      displayName: string | null;
      username: string | null;
      photoUrl: string | null;
    };
    source: 'following' | 'liked_creator';
  };
}

function FeedTrackItem({ track }: FeedTrackItemProps) {
  const creatorName = track.creator.displayName || track.creator.username || 'Автор';
  const timeAgo = formatDistanceToNow(new Date(track.createdAt), { 
    addSuffix: true, 
    locale: ru 
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/track/${track.id}`} className="block">
        <div className="flex gap-3 p-3">
          {/* Cover */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
              {track.coverUrl ? (
                <img 
                  src={track.coverUrl} 
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{track.title}</h4>
                <Link 
                  to={`/profile/${track.creator.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 mt-1 group"
                >
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={track.creator.photoUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {creatorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {creatorName}
                  </span>
                  {track.source === 'following' && (
                    <UserCheck className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </Link>
              </div>

              <Badge 
                variant="secondary" 
                className="text-[10px] flex-shrink-0"
              >
                {track.source === 'following' ? 'Подписка' : 'Понравилось'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {track.playCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {track.likesCount}
              </span>
              <span className="ml-auto">{timeAgo}</span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

function FeedItemSkeleton() {
  return (
    <Card>
      <div className="flex gap-3 p-3">
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}

export default FollowingFeed;
