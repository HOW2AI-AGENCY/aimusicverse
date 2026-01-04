/**
 * Process Telegram Queue
 * Processes pending notifications from the queue with rate limiting
 * and circuit breaker pattern
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('process-telegram-queue');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: max 30 messages per second to Telegram
const RATE_LIMIT_DELAY_MS = 35;
const CIRCUIT_BREAKER_THRESHOLD = 10;
const CIRCUIT_BREAKER_RESET_MS = 60000;

interface QueueItem {
  id: string;
  chat_id: number;
  user_id: string | null;
  notification_type: string;
  payload: Record<string, unknown>;
  priority: string;
  retry_count: number;
  max_retries: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

function checkCircuitBreaker(): boolean {
  if (!circuitBreaker.isOpen) return false;
  
  if (Date.now() - circuitBreaker.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    logger.info('Circuit breaker reset');
    return false;
  }
  
  return true;
}

function recordFailure(): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  
  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.isOpen = true;
    logger.warn('Circuit breaker opened', { failures: circuitBreaker.failures });
  }
}

function recordSuccess(): void {
  circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
}

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: unknown
): Promise<{ ok: boolean; error?: string; permanent?: boolean }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured', permanent: true };
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
      const isPermanent = 
        errorDesc.includes('chat not found') ||
        errorDesc.includes('bot was blocked') ||
        errorDesc.includes('user is deactivated') ||
        errorDesc.includes('chat was deleted');
      
      return { ok: false, error: errorDesc, permanent: isPermanent };
    }

    return { ok: true };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Network error',
      permanent: false 
    };
  }
}

async function sendTelegramAudio(
  chatId: number,
  audioUrl: string,
  options: {
    title?: string;
    caption?: string;
    performer?: string;
    duration?: number;
    coverUrl?: string;
    replyMarkup?: unknown;
  }
): Promise<{ ok: boolean; error?: string; permanent?: boolean }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured', permanent: true };
  }

  try {
    // Download audio
    let audioBlob: Blob | null = null;
    try {
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        audioBlob = await audioResponse.blob();
      }
    } catch (e) {
      logger.warn('Failed to download audio', { error: e });
    }

    // Download thumbnail if available
    let thumbBlob: Blob | null = null;
    if (options.coverUrl) {
      try {
        const thumbResponse = await fetch(options.coverUrl);
        if (thumbResponse.ok) {
          thumbBlob = await thumbResponse.blob();
        }
      } catch {
        // Ignore thumbnail errors
      }
    }

    const formData = new FormData();
    formData.append('chat_id', chatId.toString());
    
    if (audioBlob) {
      const filename = options.title 
        ? `${options.title.replace(/[^a-zA-Z0-9а-яА-Я]/g, '_').substring(0, 50)}.mp3`
        : 'track.mp3';
      formData.append('audio', audioBlob, filename);
    } else {
      formData.append('audio', audioUrl);
    }
    
    if (options.title) formData.append('title', options.title);
    if (options.caption) formData.append('caption', options.caption);
    if (options.performer) formData.append('performer', options.performer);
    if (options.duration) formData.append('duration', options.duration.toString());
    if (thumbBlob) formData.append('thumbnail', thumbBlob, 'cover.jpg');
    formData.append('parse_mode', 'MarkdownV2');
    if (options.replyMarkup) formData.append('reply_markup', JSON.stringify(options.replyMarkup));

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.ok) {
      const errorDesc = result.description || 'Unknown error';
      const isPermanent = 
        errorDesc.includes('chat not found') ||
        errorDesc.includes('bot was blocked') ||
        errorDesc.includes('user is deactivated');
      
      return { ok: false, error: errorDesc, permanent: isPermanent };
    }

    return { ok: true };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Network error',
      permanent: false 
    };
  }
}

// deno-lint-ignore no-explicit-any
async function processQueueItem(
  supabase: SupabaseClient<any>,
  item: QueueItem
): Promise<{ success: boolean; permanent?: boolean }> {
  const { id, chat_id, notification_type, payload } = item;
  
  logger.info('Processing queue item', { id, type: notification_type, chatId: chat_id });

  let result: { ok: boolean; error?: string; permanent?: boolean };

  // Determine how to send based on type and payload
  if (payload.audioUrl) {
    result = await sendTelegramAudio(chat_id, payload.audioUrl as string, {
      title: payload.title as string,
      caption: payload.message as string,
      performer: payload.performer as string,
      duration: payload.duration as number,
      coverUrl: payload.coverUrl as string,
      replyMarkup: payload.replyMarkup,
    });
  } else {
    result = await sendTelegramMessage(
      chat_id,
      (payload.message as string) || (payload.title as string) || 'Уведомление',
      payload.replyMarkup
    );
  }

  if (result.ok) {
    // Success - mark as sent
    await supabase
      .from('telegram_notification_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', id);
    
    recordSuccess();
    logger.info('Queue item sent successfully', { id });
    return { success: true };
  }

  if (result.permanent) {
    // Permanent failure - no retry
    await supabase
      .from('telegram_notification_queue')
      .update({
        status: 'failed_permanently',
        error_message: result.error,
        last_attempt_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', id);
    
    logger.warn('Queue item permanently failed', { id, error: result.error });
    return { success: false, permanent: true };
  }

  // Transient failure - schedule retry
  recordFailure();
  
  const newRetryCount = item.retry_count + 1;
  const isPermanentlyFailed = newRetryCount >= item.max_retries;
  
  // Exponential backoff: 1min, 5min, 15min, 30min
  const delayMinutes = Math.min(30, Math.pow(2, newRetryCount));
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await supabase
    .from('telegram_notification_queue')
    .update({
      retry_count: newRetryCount,
      last_attempt_at: new Date().toISOString(),
      next_retry_at: isPermanentlyFailed ? null : nextRetryAt.toISOString(),
      status: isPermanentlyFailed ? 'failed_permanently' : 'pending',
      error_message: result.error,
    } as Record<string, unknown>)
    .eq('id', id);

  logger.warn('Queue item failed, scheduled retry', { 
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
    // Check circuit breaker
    if (checkCircuitBreaker()) {
      logger.warn('Circuit breaker open, skipping processing');
      return new Response(
        JSON.stringify({ success: false, error: 'Circuit breaker open' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse request
    let limit = 50;
    let onlyId: string | undefined;
    
    try {
      const body = await req.json();
      if (body.limit) limit = Math.min(body.limit, 100);
      if (body.onlyId) onlyId = body.onlyId;
    } catch {
      // Use defaults
    }

    // Get pending items
    let items: QueueItem[] = [];

    if (onlyId) {
      const { data, error } = await supabase
        .from('telegram_notification_queue')
        .select('*')
        .eq('id', onlyId)
        .single();
      
      if (error) {
        logger.error('Error fetching single queue item', error);
      } else if (data) {
        items = [data as QueueItem];
      }
    } else {
      const { data, error } = await supabase
        .from('telegram_notification_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority_score', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Error fetching queue items', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      items = (data || []) as QueueItem[];
    }

    if (items.length === 0) {
      logger.debug('No pending items in queue');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing queue', { count: items.length });

    // Process items
    let successCount = 0;
    let failCount = 0;
    let permanentFailCount = 0;

    for (const item of items) {
      // Check circuit breaker between items
      if (checkCircuitBreaker()) {
        logger.warn('Circuit breaker opened during processing, stopping');
        break;
      }

      const result = await processQueueItem(supabase, item);
      
      if (result.success) {
        successCount++;
      } else if (result.permanent) {
        permanentFailCount++;
      } else {
        failCount++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
    }

    const duration = Date.now() - startTime;

    logger.info('Queue processing completed', {
      total: items.length,
      success: successCount,
      failed: failCount,
      permanent: permanentFailCount,
      durationMs: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: items.length,
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
    logger.error('Error processing queue', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
