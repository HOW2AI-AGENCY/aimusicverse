// ActivityItem component - Sprint 011 Phase 7
// Activity card with entity rendering

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Music, MessageSquare, UserPlus, ListMusic, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';
import { useNavigate } from 'react-router-dom';
import type { ActivityFeedItem } from '@/types/activity';

interface ActivityItemProps {
  activity: ActivityFeedItem;
  className?: string;
}

// Get icon based on activity type
function getActivityIcon(activityType: string) {
  switch (activityType) {
    case 'track_created':
    case 'track_liked':
      return Music;
    case 'comment_posted':
      return MessageSquare;
    case 'user_followed':
      return UserPlus;
    case 'playlist_created':
    case 'track_added_to_playlist':
      return ListMusic;
    default:
      return Music;
  }
}

// Get icon color based on activity type
function getActivityColor(activityType: string): string {
  switch (activityType) {
    case 'track_created':
      return 'text-blue-500';
    case 'track_liked':
      return 'text-red-500';
    case 'comment_posted':
      return 'text-green-500';
    case 'user_followed':
      return 'text-purple-500';
    case 'playlist_created':
    case 'track_added_to_playlist':
      return 'text-orange-500';
    default:
      return 'text-muted-foreground';
  }
}

export function ActivityItem({ activity, className }: ActivityItemProps) {
  const navigate = useNavigate();
  const Icon = getActivityIcon(activity.activityType);
  const iconColor = getActivityColor(activity.activityType);

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: ru,
  });

  const handleAction = () => {
    if (activity.actionUrl) {
      navigate(activity.actionUrl);
    }
  };

  return (
    <Card className={cn('p-4 hover:bg-accent/50 transition-colors', className)}>
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className={cn('p-2 rounded-full bg-accent/50 flex-shrink-0', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header: Actor Info */}
          <div className="flex items-center gap-2">
            <Avatar
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate(`/profile/${activity.actorId}`)}
            >
              <AvatarImage
                src={activity.actor.avatarUrl}
                alt={activity.actor.displayName || activity.actor.username}
              />
              <AvatarFallback>
                {(activity.actor.displayName || activity.actor.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate(`/profile/${activity.actorId}`)}
                  className="font-medium text-sm hover:underline truncate"
                >
                  {activity.actor.displayName || activity.actor.username || 'Пользователь'}
                </button>
                {activity.actor.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {/* Activity Message */}
          <p className="text-sm text-foreground">{activity.formattedMessage}</p>

          {/* Entity Preview */}
          {activity.metadata && (
            <div className="space-y-1">
              {activity.metadata.trackTitle && (
                <div className="flex items-center gap-2 text-sm">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium truncate">{activity.metadata.trackTitle}</span>
                </div>
              )}
              {activity.metadata.playlistName && (
                <div className="flex items-center gap-2 text-sm">
                  <ListMusic className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium truncate">{activity.metadata.playlistName}</span>
                </div>
              )}
              {activity.metadata.commentContent && (
                <p className="text-sm text-muted-foreground italic line-clamp-2">
                  "{activity.metadata.commentContent}"
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          {activity.actionLabel && activity.actionUrl && (
            <Button variant="outline" size="sm" onClick={handleAction} className="mt-2">
              {activity.actionLabel}
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
