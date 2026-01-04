// Notification service for sending in-app notifications
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type NotificationType = 
  | 'generation' 
  | 'project' 
  | 'social' 
  | 'system' 
  | 'achievement';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Send a notification to a user via edge function
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('create-notification', {
      body: params,
    });

    if (error) {
      logger.error('Failed to create notification', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error creating notification', error);
    return false;
  }
}

/**
 * Send a notification about project changes
 */
export async function notifyProjectChange(
  userId: string, 
  projectTitle: string, 
  changeType: 'created' | 'updated' | 'deleted',
  projectId?: string
): Promise<boolean> {
  const messages = {
    created: `Проект "${projectTitle}" успешно создан`,
    updated: `Проект "${projectTitle}" обновлён`,
    deleted: `Проект "${projectTitle}" удалён`,
  };

  const titles = {
    created: 'Новый проект',
    updated: 'Проект обновлён',
    deleted: 'Проект удалён',
  };

  return createNotification({
    userId,
    type: 'project',
    title: titles[changeType],
    message: messages[changeType],
    actionUrl: projectId && changeType !== 'deleted' ? `/project/${projectId}` : undefined,
  });
}

/**
 * Send a notification about generation completion
 */
export async function notifyGenerationComplete(
  userId: string,
  trackTitle: string,
  trackId: string,
  success: boolean
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'generation',
    title: success ? 'Генерация завершена' : 'Ошибка генерации',
    message: success 
      ? `Трек "${trackTitle}" успешно сгенерирован` 
      : `Не удалось сгенерировать трек "${trackTitle}"`,
    actionUrl: success ? `/track/${trackId}` : undefined,
  });
}

/**
 * Send a social notification (likes, comments, follows)
 */
export async function notifySocialEvent(
  userId: string,
  eventType: 'like' | 'comment' | 'follow',
  actorName: string,
  entityTitle?: string,
  entityUrl?: string
): Promise<boolean> {
  const messages = {
    like: `${actorName} оценил ваш трек "${entityTitle}"`,
    comment: `${actorName} прокомментировал ваш трек "${entityTitle}"`,
    follow: `${actorName} подписался на вас`,
  };

  const titles = {
    like: 'Новый лайк',
    comment: 'Новый комментарий',
    follow: 'Новый подписчик',
  };

  return createNotification({
    userId,
    type: 'social',
    title: titles[eventType],
    message: messages[eventType],
    actionUrl: entityUrl,
  });
}
