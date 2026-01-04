/**
 * Weekly Summary Card
 * Compact weekly stats card for homepage
 */

import { Card } from '@/components/ui/card';
import { Music, Heart, Play, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from '@/lib/motion';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-xs text-green-500">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        +{value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-xs text-red-500">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {value}
      </span>
    );
  }
  return (
    <span className="flex items-center text-xs text-muted-foreground">
      <Minus className="w-3 h-3 mr-0.5" />
      0
    </span>
  );
}

export function WeeklySummaryCard() {
  const { data, isLoading } = useAnalyticsData();
  const summary = data?.weeklySummary;

  if (isLoading) {
    return (
      <Card className="p-4 glass-card border-border/50">
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      icon: Music,
      label: 'Треков',
      value: summary.tracks,
      change: summary.tracksChange,
      color: 'text-blue-500',
    },
    {
      icon: Heart,
      label: 'Лайков',
      value: summary.likes,
      change: summary.likesChange,
      color: 'text-red-500',
    },
    {
      icon: Play,
      label: 'Прослушиваний',
      value: summary.plays,
      change: summary.playsChange,
      color: 'text-green-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-4 glass-card border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">За эту неделю</h3>
          <span className="text-xs text-muted-foreground">vs прошлая неделя</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className={cn('w-4 h-4 mx-auto mb-1', stat.color)} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <ChangeIndicator value={stat.change} />
            </div>
          ))}
        </div>

        {data?.topTrack && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Топ трек</p>
            <p className="text-sm font-medium truncate">{data.topTrack.title}</p>
            <p className="text-xs text-muted-foreground">
              {data.topTrack.plays} прослушиваний • {data.topTrack.likes} лайков
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
