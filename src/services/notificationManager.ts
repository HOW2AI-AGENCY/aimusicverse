/**
 * Enhanced Notification Manager
 * Handles auto-replace, auto-delete, grouping, and priority
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'NotificationManager' });

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'generation' 
  | 'project' 
  | 'social' 
  | 'achievement' 
  | 'system';

export interface NotificationOptions {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  groupKey?: string;      // For auto-replace similar notifications
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresIn?: number;     // Minutes until auto-delete
  priority?: number;      // Higher = more important (0-10)
}

/**
 * Create or update a notification with auto-replace support
 */
export async function createNotification(options: NotificationOptions): Promise<string | null> {
  try {
    const expiresAt = options.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 60 * 1000).toISOString()
      : null;

    // Use database function for atomic upsert
    const { data, error } = await supabase.rpc('upsert_notification', {
      p_user_id: options.userId,
      p_title: options.title,
      p_message: options.message,
      p_type: options.type,
      p_group_key: options.groupKey ?? null,
      p_action_url: options.actionUrl ?? null,
      p_metadata: options.metadata ? JSON.stringify(options.metadata) : '{}',
      p_expires_at: expiresAt,
      p_priority: options.priority ?? 0,
    } as any);

    if (error) {
      log.error('Failed to create notification', { error, options });
      return null;
    }

    log.debug('Notification created/updated', { id: data, groupKey: options.groupKey });
    return data as string;
  } catch (error) {
    log.error('Error creating notification', error);
    return null;
  }
}

/**
 * Delete notifications by group key
 */
export async function deleteNotificationsByGroup(userId: string, groupKey: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('delete_notifications_by_group', {
      p_user_id: userId,
      p_group_key: groupKey,
    });

    if (error) {
      log.error('Failed to delete notifications by group', error);
      return 0;
    }

    return data as number;
  } catch (error) {
    log.error('Error deleting notifications by group', error);
    return 0;
  }
}

/**
 * Delete a single notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      log.error('Failed to delete notification', error);
      return false;
    }

    return true;
  } catch (error) {
    log.error('Error deleting notification', error);
    return false;
  }
}

/**
 * Run cleanup of expired notifications (client-side trigger)
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_notifications');

    if (error) {
      log.error('Failed to cleanup notifications', error);
      return 0;
    }

    if (data > 0) {
      log.info('Cleaned up notifications', { count: data });
    }

    return data as number;
  } catch (error) {
    log.error('Error during notification cleanup', error);
    return 0;
  }
}

// ============================================================================
// Pre-defined notification templates with auto-replace keys
// ============================================================================

/**
 * Generation progress notification (auto-replaces previous)
 */
export async function notifyGenerationProgress(
  userId: string,
  taskId: string,
  stage: string,
  progress: number
): Promise<string | null> {
  return createNotification({
    userId,
    title: `Генерация: ${progress}%`,
    message: stage,
    type: 'generation',
    groupKey: `generation_${taskId}`,
    actionUrl: '/library',
    metadata: { taskId, progress, stage },
    expiresIn: 60, // Auto-delete after 1 hour
    priority: 5,
  });
}

/**
 * Generation complete notification (replaces progress)
 */
export async function notifyGenerationComplete(
  userId: string,
  taskId: string,
  trackTitle: string,
  trackId: string
): Promise<string | null> {
  return createNotification({
    userId,
    title: 'Трек готов! 🎵',
    message: trackTitle,
    type: 'success',
    groupKey: `generation_${taskId}`,
    actionUrl: `/track/${trackId}`,
    metadata: { taskId, trackId, trackTitle },
    priority: 8,
  });
}

/**
 * Generation failed notification
 */
export async function notifyGenerationFailed(
  userId: string,
  taskId: string,
  errorMessage: string
): Promise<string | null> {
  return createNotification({
    userId,
    title: 'Ошибка генерации',
    message: errorMessage || 'Попробуйте ещё раз',
    type: 'error',
    groupKey: `generation_${taskId}`,
    metadata: { taskId, error: errorMessage },
    expiresIn: 1440, // Auto-delete after 24 hours
    priority: 7,
  });
}

/**
 * Social notification (like, comment, follow)
 */
export async function notifySocialEvent(
  userId: string,
  eventType: 'like' | 'comment' | 'follow',
  actorName: string,
  entityTitle?: string,
  entityUrl?: string
): Promise<string | null> {
  const templates = {
    like: {
      title: 'Новый лайк ❤️',
      message: `${actorName} оценил "${entityTitle}"`,
    },
    comment: {
      title: 'Новый комментарий 💬',
      message: `${actorName} прокомментировал "${entityTitle}"`,
    },
    follow: {
      title: 'Новый подписчик 👤',
      message: `${actorName} подписался на вас`,
    },
  };

  const template = templates[eventType];
  
  return createNotification({
    userId,
    title: template.title,
    message: template.message,
    type: 'social',
    actionUrl: entityUrl,
    metadata: { eventType, actorName, entityTitle },
    priority: 4,
  });
}

/**
 * Achievement notification
 */
export async function notifyAchievement(
  userId: string,
  achievementName: string,
  description: string,
  reward?: number
): Promise<string | null> {
  return createNotification({
    userId,
    title: `Достижение: ${achievementName} 🏆`,
    message: description + (reward ? ` (+${reward} кредитов)` : ''),
    type: 'achievement',
    actionUrl: '/achievements',
    metadata: { achievementName, reward },
    priority: 6,
  });
}

/**
 * System notification
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string,
  expiresInMinutes?: number
): Promise<string | null> {
  return createNotification({
    userId,
    title,
    message,
    type: 'system',
    actionUrl,
    expiresIn: expiresInMinutes,
    priority: 3,
  });
}

/**
 * MIDI/Transcription notification
 */
export async function notifyTranscriptionComplete(
  userId: string,
  recordingTitle: string,
  formats: string[],
  recordingId?: string
): Promise<string | null> {
  const formatList = formats.join(', ');
  
  return createNotification({
    userId,
    title: 'Транскрипция готова 🎼',
    message: `${recordingTitle}: ${formatList}`,
    type: 'success',
    groupKey: recordingId ? `transcription_${recordingId}` : undefined,
    actionUrl: '/guitar-studio',
    metadata: { recordingTitle, formats, recordingId },
    priority: 7,
  });
}

/**
 * New feature announcement notification
 */
export async function notifyFeatureAnnouncement(
  userId: string,
  featureTitle: string,
  description: string,
  actionUrl?: string
): Promise<string | null> {
  return createNotification({
    userId,
    title: `Новая функция: ${featureTitle} ✨`,
    message: description,
    type: 'info',
    groupKey: `feature_${featureTitle.toLowerCase().replace(/\s+/g, '_')}`,
    actionUrl,
    priority: 5,
  });
}

/**
 * Project change notification
 */
export async function notifyProjectChange(
  userId: string, 
  projectTitle: string, 
  changeType: 'created' | 'updated' | 'deleted',
  projectId?: string
): Promise<string | null> {
  const messages = {
    created: `Проект "${projectTitle}" успешно создан`,
    updated: `Проект "${projectTitle}" обновлён`,
    deleted: `Проект "${projectTitle}" удалён`,
  };

  const titles = {
    created: 'Новый проект 📁',
    updated: 'Проект обновлён ✏️',
    deleted: 'Проект удалён 🗑️',
  };

  return createNotification({
    userId,
    title: titles[changeType],
    message: messages[changeType],
    type: 'project',
    groupKey: projectId ? `project_${projectId}` : undefined,
    actionUrl: projectId && changeType !== 'deleted' ? `/project/${projectId}` : undefined,
    priority: 4,
  });
}
