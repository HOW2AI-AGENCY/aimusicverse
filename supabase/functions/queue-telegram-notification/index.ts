/**
 * Queue Telegram Notification
 * Adds notifications to the database queue for reliable delivery
 * with priority support and deduplication
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('queue-telegram-notification');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueRequest {
  userId?: string;
  chatId?: number;
  type: string;
  title?: string;
  message?: string;
  audioUrl?: string;
  coverUrl?: string;
  trackId?: string;
  duration?: number;
  performer?: string;
  replyMarkup?: unknown;
  priority?: 'high' | 'normal' | 'low';
  dedupeKey?: string;
  scheduledAt?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: QueueRequest = await req.json();
    
    logger.info('Queueing notification', { type: body.type, userId: body.userId });

    // Resolve chat_id if not provided
    let chatId = body.chatId;
    if (!chatId && body.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_chat_id')
        .eq('user_id', body.userId)
        .single();
      
      chatId = profile?.telegram_chat_id;
    }

    if (!chatId) {
      logger.warn('No chat_id available', { userId: body.userId });
      return new Response(
        JSON.stringify({ success: false, error: 'No chat_id available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate if dedupeKey provided
    if (body.dedupeKey) {
      const { data: existing } = await supabase
        .from('telegram_notification_queue')
        .select('id')
        .eq('dedupe_key', body.dedupeKey)
        .eq('status', 'pending')
        .single();

      if (existing) {
        logger.info('Duplicate notification skipped', { dedupeKey: body.dedupeKey });
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: 'duplicate' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate priority score (lower = higher priority)
    const priorityScores = { high: 0, normal: 50, low: 100 };
    const priorityScore = priorityScores[body.priority || 'normal'];

    // Insert into queue
    const { data: queueItem, error: insertError } = await supabase
      .from('telegram_notification_queue')
      .insert({
        chat_id: chatId,
        user_id: body.userId,
        notification_type: body.type,
        payload: {
          title: body.title,
          message: body.message,
          audioUrl: body.audioUrl,
          coverUrl: body.coverUrl,
          trackId: body.trackId,
          duration: body.duration,
          performer: body.performer,
          replyMarkup: body.replyMarkup,
        },
        priority: body.priority || 'normal',
        priority_score: priorityScore,
        dedupe_key: body.dedupeKey,
        scheduled_at: body.scheduledAt || new Date().toISOString(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to queue notification', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // For high priority, trigger immediate processing
    if (body.priority === 'high') {
      // Fire and forget - don't wait for result
      supabase.functions.invoke('process-telegram-queue', { 
        body: { limit: 1, onlyId: queueItem.id }
      }).catch(err => {
        logger.warn('Failed to trigger immediate processing', { error: err });
      });
    }

    logger.info('Notification queued', { 
      queueId: queueItem.id, 
      chatId, 
      type: body.type,
      priority: body.priority 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        queueId: queueItem.id,
        chatId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.error('Queue notification error', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
