// ActivityFeed Component - Sprint 011 Task T071
// Virtualized activity feed with infinite scroll

import React, { useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ActivityItem } from './ActivityItem';
import { useActivityFeed, markActivitiesAsViewed } from '@/hooks/social/useActivityFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ActivityType } from '@/types/activity';

interface ActivityFeedProps {
  activityType?: ActivityType;
  className?: string;
}

/**
 * Activity feed component with virtualized list and real-time updates
 */
export function ActivityFeed({ activityType, className }: ActivityFeedProps) {
  const navigate = useNavigate();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useActivityFeed({ activityType });

  // Mark activities as viewed when component mounts
  useEffect(() => {
    markActivitiesAsViewed();
  }, []);

  // Flatten pages into single array
  const activities = data?.pages.flatMap((page) => page.activities) || [];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-16 w-16 rounded mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки активности: {error?.message || 'Неизвестная ошибка'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Здесь пока нет активности
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Подпишитесь на других создателей, чтобы видеть их новые треки,
          лайки и плейлисты
        </p>
        <Button
          variant="default"
          onClick={() => navigate('/explore')}
        >
          Найти создателей
        </Button>
      </div>
    );
  }

  // Virtualized list
  return (
    <div className={className}>
      <Virtuoso
        data={activities}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, activity) => (
          <div className="mb-4">
            <ActivityItem
              activity={activity}
              isNew={
                // Mark as new if within last 5 minutes
                new Date().getTime() - new Date(activity.created_at).getTime() <
                5 * 60 * 1000
              }
            />
          </div>
        )}
        components={{
          Footer: () =>
            isFetchingNextPage ? (
              <div className="py-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Загрузка...
                </div>
              </div>
            ) : !hasNextPage && activities.length > 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Вы просмотрели всю активность
              </div>
            ) : null,
        }}
        style={{ height: '100%' }}
      />
    </div>
  );
}
