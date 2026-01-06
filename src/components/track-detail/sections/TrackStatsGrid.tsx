/**
 * TrackStatsGrid - Statistics grid for track details
 */

import { memo } from 'react';
import { Clock, Play, Heart, Mic } from 'lucide-react';
import { StatsGrid, StatItem as StatItemType } from '@/components/common/StatsGrid';
import { formatDuration } from '@/lib/player-utils';
import type { Track } from '@/types/track';

interface TrackStatsGridProps {
  track: Track;
  className?: string;
}

export const TrackStatsGrid = memo(function TrackStatsGrid({ track, className }: TrackStatsGridProps) {
  const stats: StatItemType[] = [
    {
      icon: Clock,
      label: 'Длительность',
      value: track.duration_seconds ? formatDuration(track.duration_seconds) : 'N/A',
    },
    {
      icon: Play,
      label: 'Прослушиваний',
      value: track.play_count || 0,
    },
    {
      icon: Heart,
      label: 'Лайков',
      value: track.likes_count || 0,
    },
    {
      icon: Mic,
      label: 'Тип',
      value: track.has_vocals ? 'Вокал' : 'Инструментал',
    },
  ];

  return (
    <div className={className}>
      <StatsGrid stats={stats} columns={4} variant="default" />
    </div>
  );
});
