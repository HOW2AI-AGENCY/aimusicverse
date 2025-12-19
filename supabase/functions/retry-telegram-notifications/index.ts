/**
 * Retry Failed Telegram Notifications
 * Processes Dead Letter Queue entries and retries failed notifications
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('retry-telegram-notifications');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FailedNotification {
  id: string;
  chat_id: number;
  user_id: string | null;
  notification_type: string;
  payload: Record<string, unknown>;
  error_message: string;
  retry_count: number;
  max_retries: number;
}

/**
 * Send message to Telegram with retry
 */
async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown
): Promise<{ ok: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        reply_markup: replyMarkup,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      const errorDesc = result.description || 'Unknown error';
      
      // Check for permanent failures
      if (
        errorDesc.includes('chat not found') ||
        errorDesc.includes('bot was blocked') ||
        errorDesc.includes('user is deactivated') ||
        errorDesc.includes('chat was deleted')
      ) {
        return { ok: false, error: `permanent:${errorDesc}` };
      }
      
      return { ok: false, error: errorDesc };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Send audio to Telegram with retry
 */
async function sendTelegramAudio(
  chatId: number,
  audioUrl: string,
  options: {
    title?: string;
    caption?: string;
    performer?: string;
    duration?: number;
    replyMarkup?: unknown;
  }
): Promise<{ ok: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  try {
    // Download audio file
    let audioBlob: Blob | null = null;
    try {
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        audioBlob = await audioResponse.blob();
      }
    } catch (e) {
      logger.warn('Failed to download audio', { error: e });
    }

    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    
    if (audioBlob) {
      const filename = options.title ? `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3` : 'track.mp3';
      formData.append('audio', audioBlob, filename);
    } else {
      formData.append('audio', audioUrl);
    }
    
    if (options.title) formData.append('title', options.title);
    if (options.caption) formData.append('caption', options.caption);
    if (options.performer) formData.append('performer', options.performer);
    if (options.duration) formData.append('duration', options.duration.toString());
    formData.append('parse_mode', 'MarkdownV2');
    if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.ok) {
      const errorDesc = result.description || 'Unknown error';
      
      if (
        errorDesc.includes('chat not found') ||
        errorDesc.includes('bot was blocked') ||
        errorDesc.includes('user is deactivated')
      ) {
        return { ok: false, error: `permanent:${errorDesc}` };
      }
      
      return { ok: false, error: errorDesc };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Process a single failed notification
 */
async function processNotification(
  supabase: ReturnType<typeof createClient>,
  notification: FailedNotification
): Promise<{ success: boolean; permanent?: boolean }> {
  const { id, chat_id, notification_type, payload } = notification;
  
  logger.info('Processing notification retry', { 
    id, 
    chat_id, 
    type: notification_type,
    retry: notification.retry_count + 1 
  });

  let result: { ok: boolean; error?: string };

  // Handle different notification types
  switch (notification_type) {
    case 'generation_complete':
    case 'completed': {
      if (payload.audioUrl) {
        result = await sendTelegramAudio(chat_id, payload.audioUrl as string, {
          title: payload.title as string,
          caption: payload.caption as string,
          performer: payload.performer as string,
          duration: payload.duration as number,
          replyMarkup: payload.replyMarkup,
        });
      } else {
        result = await sendTelegramMessage(
          chat_id,
          payload.message as string || '🎵 Ваш трек готов!',
          payload.replyMarkup
        );
      }
      break;
    }

    case 'failed': {
      result = await sendTelegramMessage(
        chat_id,
        payload.message as string || '❌ Ошибка генерации',
        payload.replyMarkup
      );
      break;
    }

    case 'progress': {
      result = await sendTelegramMessage(
        chat_id,
        payload.message as string,
        payload.replyMarkup
      );
      break;
    }

    default: {
      result = await sendTelegramMessage(
        chat_id,
        payload.message as string || 'Уведомление',
        payload.replyMarkup
      );
    }
  }

  // Check for permanent failure
  if (result.error?.startsWith('permanent:')) {
    await supabase
      .from('telegram_failed_notifications')
      .update({
        status: 'failed_permanently',
        error_message: result.error,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    return { success: false, permanent: true };
  }

  if (result.ok) {
    // Success - mark as resolved
    await supabase
      .from('telegram_failed_notifications')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    logger.info('Notification retry successful', { id });
    return { success: true };
  }

  // Failed - update retry count
  const newRetryCount = notification.retry_count + 1;
  const isPermanentlyFailed = newRetryCount >= notification.max_retries;
  
  // Exponential backoff: 5min, 15min, 45min
  const delayMinutes = 5 * Math.pow(3, newRetryCount);
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await supabase
    .from('telegram_failed_notifications')
    .update({
      retry_count: newRetryCount,
      last_retry_at: new Date().toISOString(),
      next_retry_at: isPermanentlyFailed ? null : nextRetryAt.toISOString(),
      status: isPermanentlyFailed ? 'failed_permanently' : 'retrying',
      error_message: result.error,
    })
    .eq('id', id);

  logger.warn('Notification retry failed', { 
    id, 
    error: result.error,
    nextRetry: isPermanentlyFailed ? 'none' : nextRetryAt.toISOString() 
  });

  return { success: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse request body for optional limit
    let limit = 50;
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 100);
    } catch {
      // Use default limit
    }

    // Get pending notifications
    const { data: notifications, error } = await supabase
      .rpc('get_pending_notification_retries', { _limit: limit });

    if (error) {
      logger.error('Error fetching pending notifications', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!notifications || notifications.length === 0) {
      logger.info('No pending notifications to retry');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing notification retries', { count: notifications.length });

    // Process notifications
    let successCount = 0;
    let failCount = 0;
    let permanentFailCount = 0;

    for (const notification of notifications as FailedNotification[]) {
      const result = await processNotification(supabase, notification);
      
      if (result.success) {
        successCount++;
      } else if (result.permanent) {
        permanentFailCount++;
      } else {
        failCount++;
      }

      // Small delay between retries to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;

    logger.info('Retry batch completed', {
      total: notifications.length,
      success: successCount,
      failed: failCount,
      permanent: permanentFailCount,
      durationMs: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications.length,
        results: {
          success: successCount,
          failed: failCount,
          permanentlyFailed: permanentFailCount,
        },
        durationMs: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Error in retry function', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
