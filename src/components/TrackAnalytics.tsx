import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrackAnalytics } from '@/hooks/useTrackAnalytics';
import { Play, Download, Share2, Heart, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TrackAnalyticsProps {
  trackId: string;
  timePeriod?: string;
}

export const TrackAnalytics = ({ trackId, timePeriod = '30 days' }: TrackAnalyticsProps) => {
  const { analytics, isLoading } = useTrackAnalytics(trackId, timePeriod);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Аналитика трека</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      label: 'Прослушивания',
      value: analytics.total_plays,
      icon: Play,
      color: 'text-primary',
    },
    {
      label: 'Загрузки',
      value: analytics.total_downloads,
      icon: Download,
      color: 'text-green-500',
    },
    {
      label: 'Поделились',
      value: analytics.total_shares,
      icon: Share2,
      color: 'text-blue-500',
    },
    {
      label: 'Лайки',
      value: analytics.total_likes,
      icon: Heart,
      color: 'text-red-500',
    },
    {
      label: 'Уникальные слушатели',
      value: analytics.unique_listeners,
      icon: Users,
      color: 'text-purple-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Аналитика трека
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center p-4 bg-muted/50 rounded-lg"
              >
                <Icon className={`w-6 h-6 mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground text-center">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {analytics.plays_by_day && Object.keys(analytics.plays_by_day).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Прослушивания по дням</h4>
            <div className="h-40 flex items-end justify-between gap-1">
              {Object.entries(analytics.plays_by_day)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.plays_by_day));
                  const height = (Number(count) / maxCount) * 100;
                  return (
                    <div
                      key={date}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {new Date(date).toLocaleDateString('ru-RU', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        : {count}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
