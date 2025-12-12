// ProfileStats Component - Sprint 011 Task T022
// Displays follower, following, and track counts

import { Users, UserPlus, Music } from 'lucide-react';
import type { ProfileStats as Stats } from '@/types/profile';

interface ProfileStatsProps {
  stats: Stats;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onTracksClick?: () => void;
}

export function ProfileStats({
  stats,
  onFollowersClick,
  onFollowingClick,
  onTracksClick,
}: ProfileStatsProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="flex items-center gap-6">
      {/* Followers */}
      <button
        onClick={onFollowersClick}
        className="flex items-center gap-2 transition-colors hover:text-primary"
        aria-label={`${stats.followers} followers`}
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">{formatCount(stats.followers)}</span>
          <span className="text-sm text-muted-foreground">Followers</span>
        </div>
      </button>

      {/* Following */}
      <button
        onClick={onFollowingClick}
        className="flex items-center gap-2 transition-colors hover:text-primary"
        aria-label={`Following ${stats.following} users`}
      >
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">{formatCount(stats.following)}</span>
          <span className="text-sm text-muted-foreground">Following</span>
        </div>
      </button>

      {/* Tracks */}
      <button
        onClick={onTracksClick}
        className="flex items-center gap-2 transition-colors hover:text-primary"
        aria-label={`${stats.tracks} tracks`}
      >
        <Music className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-baseline gap-1">
          <span className="font-semibold">{formatCount(stats.tracks)}</span>
          <span className="text-sm text-muted-foreground">Tracks</span>
        </div>
      </button>
    </div>
  );
}
