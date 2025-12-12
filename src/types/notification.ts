// Notification Types - Sprint 011 Task T016
// Types for notification system with Telegram integration

export type NotificationType =
  | 'new_follower'
  | 'track_liked'
  | 'track_commented'
  | 'comment_liked'
  | 'comment_reply'
  | 'mention'
  | 'track_shared';

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  notificationType: NotificationType;
  entityType: 'track' | 'comment' | 'user' | 'playlist';
  entityId: string;
  content: string;
  isRead: boolean;
  telegramSent: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationWithActor extends Notification {
  actor: {
    userId: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  actionLabel?: string;
  actionUrl?: string;
}

export interface NotificationSettings {
  enableInApp: boolean;
  enableTelegram: boolean;
  notifyOnFollow: boolean;
  notifyOnTrackLike: boolean;
  notifyOnComment: boolean;
  notifyOnCommentLike: boolean;
  notifyOnReply: boolean;
  notifyOnMention: boolean;
  notifyOnShare: boolean;
}

export interface UnreadCount {
  total: number;
  byType: {
    [K in NotificationType]?: number;
  };
}

export interface NotificationListParams {
  isRead?: boolean;
  notificationType?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface NotificationListResponse {
  notifications: NotificationWithActor[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationCreateInput {
  user_id: string;
  actor_id: string;
  notification_type: NotificationType;
  entity_type: 'track' | 'comment' | 'user' | 'playlist';
  entity_id: string;
  content: string;
}

export interface MarkAsReadInput {
  notificationIds?: string[];
  markAll?: boolean;
}
