// ActivityItem Component - Sprint 011 Task T072
// Render individual activity with icon, actor, action text, and entity

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Heart, Music, ListMusic, User, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { cn } from '@/lib/utils';
import type { Activity, ActivityType } from '@/types/activity';

interface ActivityItemProps {
  activity: Activity;
  className?: string;
  isNew?: boolean;
}

/**
 * Activity item component displaying actor, action, and entity
 */
export function ActivityItem({ activity, className, isNew = false }: ActivityItemProps) {
  const navigate = useNavigate();

  // Get activity icon based on type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'track_published':
        return <Music className="w-5 h-5 text-primary" />;
      case 'track_liked':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'playlist_created':
        return <ListMusic className="w-5 h-5 text-blue-500" />;
      case 'user_followed':
        return <User className="w-5 h-5 text-green-500" />;
      case 'track_trending':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      default:
        return <Music className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Get activity action text
  const getActionText = (type: ActivityType) => {
    switch (type) {
      case 'track_published':
        return 'опубликовал новый трек';
      case 'track_liked':
        return 'понравился трек';
      case 'playlist_created':
        return 'создал плейлист';
      case 'user_followed':
        return 'подписался на';
      case 'track_trending':
        return 'трек в тренде';
      default:
        return 'активность';
    }
  };

  // Handle click navigation
  const handleClick = () => {
    if (activity.entity_type === 'track' && activity.entity_id) {
      navigate(`/library?track=${activity.entity_id}`);
    } else if (activity.entity_type === 'playlist' && activity.entity_id) {
      navigate(`/playlists/${activity.entity_id}`);
    } else if (activity.entity_type === 'user' && activity.entity_id) {
      navigate(`/profile/${activity.entity_id}`);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activity.actor_id) {
      navigate(`/profile/${activity.actor_id}`);
    }
  };

  const actor = activity.actor;
  const displayName = actor?.display_name || actor?.username || 'Пользователь';
  const timestamp = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:bg-muted/50',
        isNew && 'bg-primary/5 border-primary/20',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {getActivityIcon(activity.activity_type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Actor Avatar */}
            <Avatar
              className="w-6 h-6 cursor-pointer"
              onClick={handleProfileClick}
            >
              <AvatarImage
                src={actor?.avatar_url || ''}
                alt={displayName}
              />
              <AvatarFallback className="text-xs">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Actor Name */}
            <button
              className="font-semibold text-sm hover:underline flex items-center gap-1"
              onClick={handleProfileClick}
            >
              {displayName}
              {actor?.is_verified && (
                <VerificationBadge size="sm" showTooltip={false} />
              )}
            </button>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground ml-auto">
              {timestamp}
            </span>
          </div>

          {/* Action Text */}
          <p className="text-sm text-muted-foreground">
            {getActionText(activity.activity_type)}
          </p>

          {/* Entity Preview */}
          {activity.metadata && (
            <div className="mt-2 text-sm">
              {activity.metadata.track_title && (
                <p className="font-medium truncate">
                  {activity.metadata.track_title}
                </p>
              )}
              {activity.metadata.playlist_name && (
                <p className="font-medium truncate">
                  {activity.metadata.playlist_name}
                </p>
              )}
              {activity.metadata.track_cover_url && (
                <img
                  src={activity.metadata.track_cover_url}
                  alt="Cover"
                  className="mt-2 w-16 h-16 rounded object-cover"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* New indicator */}
      {isNew && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
      )}
    </Card>
  );
}
