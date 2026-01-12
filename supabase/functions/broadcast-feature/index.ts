/**
 * Broadcast feature announcement to all users
 * Sends notifications about new subscription feature
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { successResponse, errorResponse, optionsResponse } from '../_shared/response-utils.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://t.me/PhuketMusicBot/app';

interface BroadcastRequest {
  type: 'subscriptions_feature' | 'custom';
  title?: string;
  message?: string;
  actionLabel?: string;
  actionUrl?: string;
  testMode?: boolean; // Only send to admins
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  try {
    const supabase = getSupabaseClient();
    const body: BroadcastRequest = await req.json();
    const { type, testMode = false } = body;

    let title: string;
    let message: string;
    let actionLabel: string;
    let actionUrl: string;

    if (type === 'subscriptions_feature') {
      title = '🎉 Новое: Подписки на авторов!';
      message = `Теперь вы можете подписываться на любимых создателей музыки!

✨ Что нового:
• Подписывайтесь на авторов
• Видите их новые треки в ленте
• Треки от авторов, которым ставили лайки, тоже появятся в рекомендациях

Откройте приложение, чтобы попробовать!`;
      actionLabel = 'Открыть ленту подписок';
      actionUrl = `${MINI_APP_URL}?startapp=feed`;
    } else {
      title = body.title || 'Объявление';
      message = body.message || '';
      actionLabel = body.actionLabel || 'Открыть';
      actionUrl = body.actionUrl || MINI_APP_URL;
    }

    // Get users to notify
    let query = supabase
      .from('profiles')
      .select('telegram_chat_id, first_name')
      .not('telegram_chat_id', 'is', null);

    if (testMode) {
      // Only send to admins in test mode
      const { data: adminIds } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminIds && adminIds.length > 0) {
        query = query.in('user_id', adminIds.map(a => a.user_id));
      } else {
        return successResponse({ sent: 0, failed: 0, message: 'No admins found for test mode' });
      }
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      return errorResponse('Failed to fetch users');
    }

    if (!users || users.length === 0) {
      return successResponse({ sent: 0, failed: 0, message: 'No users to notify' });
    }

    let sent = 0;
    let failed = 0;

    // Send notifications in batches
    const batchSize = 25;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          const personalizedMessage = user.first_name 
            ? `Привет, ${user.first_name}! ${message}`
            : message;

          const keyboard = {
            inline_keyboard: [
              [{ text: `✨ ${actionLabel}`, url: actionUrl }],
            ],
          };

          const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: user.telegram_chat_id,
                text: `*${title}*\n\n${personalizedMessage}`,
                parse_mode: 'Markdown',
                reply_markup: keyboard,
              }),
            }
          );

          if (response.ok) {
            sent++;
          } else {
            const errorData = await response.json();
            console.error(`Failed to send to ${user.telegram_chat_id}:`, errorData);
            failed++;
          }
        } catch (error) {
          console.error(`Error sending to user:`, error);
          failed++;
        }
      }));

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log broadcast
    await supabase.from('broadcast_messages').insert({
      sender_id: '00000000-0000-0000-0000-000000000000', // System
      title,
      message,
      sent_count: sent,
      failed_count: failed,
      target_type: testMode ? 'admins' : 'all',
    });

    return successResponse({
      sent,
      failed,
      total: users.length,
      message: `Broadcast completed: ${sent} sent, ${failed} failed`,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error');
  }
});
