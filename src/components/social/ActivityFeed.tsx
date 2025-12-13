// ActivityFeed component - Sprint 011 Phase 7
// Virtualized activity feed with filter tabs

import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useActivityFeed } from '@/hooks/social/useActivityFeed';
import { ActivityItem } from './ActivityItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Activity, Music, MessageSquare, UserPlus, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityType } from '@/types/activity';

interface ActivityFeedProps {
  className?: string;
}

type FilterTab = 'all' | 'tracks' | 'comments' | 'social' | 'playlists';

const FILTER_CONFIGS: Record<FilterTab, { label: string; icon: any; types?: ActivityType[] }> = {
  all: {
    label: 'Все',
    icon: Activity,
  },
  tracks: {
    label: 'Треки',
    icon: Music,
    types: ['track_created', 'track_liked'],
  },
  comments: {
    label: 'Комментарии',
    icon: MessageSquare,
    types: ['comment_posted'],
  },
  social: {
    label: 'Подписки',
    icon: UserPlus,
    types: ['user_followed'],
  },
  playlists: {
    label: 'Плейлисты',
    icon: ListMusic,
    types: ['playlist_created', 'track_added_to_playlist'],
  },
};

export function ActivityFeed({ className }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  
  const filterTypes = FILTER_CONFIGS[activeTab].types;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useActivityFeed({
    activityTypes: filterTypes,
  });

  const allActivities = data?.pages.flatMap((page) => page.activities) || [];

  const renderContent = () => {
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
          <Activity className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Не удалось загрузить ленту активности</p>
        </div>
      );
    }

    if (allActivities.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {activeTab === 'all'
              ? 'Пока нет активности. Подпишитесь на других пользователей, чтобы увидеть их действия.'
              : 'Нет активности в этой категории'}
          </p>
        </div>
      );
    }

    return (
      <Virtuoso
        style={{ height: '100%' }}
        data={allActivities}
        endReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        itemContent={(index, activity) => (
          <div key={activity.id} className="mb-3">
            <ActivityItem activity={activity} />
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
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)} className="flex-1 flex flex-col">
        {/* Filter Tabs */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <TabsList className="w-full justify-start rounded-none h-12 bg-transparent border-b">
            {Object.entries(FILTER_CONFIGS).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {Object.keys(FILTER_CONFIGS).map((key) => (
            <TabsContent key={key} value={key} className="h-full mt-0 p-4">
              {renderContent()}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
