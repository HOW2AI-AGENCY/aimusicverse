// ActivityFeed component - Sprint 011
import { ActivityItem } from './ActivityItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityFeedItem } from '@/types/activity';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  isLoading?: boolean;
  className?: string;
}

export function ActivityFeed({ activities, isLoading, className }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Нет активности</h3>
        <p className="text-muted-foreground">
          Здесь будет отображаться активность ваших подписок
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
