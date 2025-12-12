// Activity Types - Sprint 011 Task T015
// Types for activity feed system

export type ActivityType =
  | 'track_created'
  | 'track_liked'
  | 'comment_posted'
  | 'user_followed'
  | 'playlist_created'
  | 'track_added_to_playlist';

export type EntityType = 'track' | 'comment' | 'user' | 'playlist';

export interface ActivityMetadata {
  trackTitle?: string;
  trackCoverUrl?: string;
  commentContent?: string;
  playlistName?: string;
  playlistCoverUrl?: string;
  [key: string]: any;
}

export interface Activity {
  id: string;
  userId: string;
  actorId: string;
  activityType: ActivityType;
  entityType: EntityType;
  entityId: string;
  metadata: ActivityMetadata;
  createdAt: string;
}

export interface ActivityFeedItem extends Activity {
  actor: {
    userId: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  formattedMessage: string; // e.g., "John Doe created a new track"
  actionLabel?: string; // e.g., "Listen", "View"
  actionUrl?: string;
}

export interface ActivityFeedParams {
  limit?: number;
  offset?: number;
  activityTypes?: ActivityType[];
}

export interface ActivityFeedResponse {
  activities: ActivityFeedItem[];
  total: number;
  hasMore: boolean;
}

export interface ActivityCreateInput {
  user_id: string;
  actor_id: string;
  activity_type: ActivityType;
  entity_type: EntityType;
  entity_id: string;
  metadata?: ActivityMetadata;
}
