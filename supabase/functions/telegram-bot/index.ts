import { handleUpdate } from './bot.ts';
import type { TelegramUpdate } from './telegram-api.ts';
import { sendMessage } from './telegram-api.ts';
// Enhanced inline mode with 8 categories support
import { handleInlineQuery } from './commands/inline-enhanced.ts';
import { handleChosenInlineResult } from './handlers/inline-chosen.ts';
import { flushMetrics, checkAlerts } from './utils/metrics.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('telegram-bot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle internal API actions (from admin panel, etc.)
 */
async function handleInternalAction(body: Record<string, unknown>): Promise<Response> {
  const action = body.action as string;
  
  try {
    switch (action) {
      case 'send_feedback_reply': {
        const telegram_id = body.telegram_id as number;
        const message = body.message as string;
        const feedback_type = body.feedback_type as string;
        
        if (!telegram_id || !message) {
          return new Response(JSON.stringify({ error: 'Missing telegram_id or message' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const typeLabels: Record<string, string> = {
          support: '🛠 Техподдержка',
          bug: '🐛 Отчёт об ошибке',
          idea: '💡 Предложение',
          rate: '⭐ Оценка',
        };
        
        const typeLabel = typeLabels[feedback_type] || 'Обращение';
        
        const text = `📩 *Ответ на ваше обращение*\n` +
          `_${typeLabel}_\n\n` +
          `${message.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1')}`;
        
        await sendMessage(telegram_id, text, {
          inline_keyboard: [
            [{ text: '💬 Написать ещё', callback_data: 'menu_feedback' }],
          ],
        });
        
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    logger.error('Error handling internal action', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Environment check - TELEGRAM_WEBHOOK_SECRET is mandatory in production

// Environment check - TELEGRAM_WEBHOOK_SECRET is mandatory in production
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
const IS_PRODUCTION = Deno.env.get('ENVIRONMENT') !== 'development';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        webhookSecured: !!WEBHOOK_SECRET
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Metrics endpoint
    if (url.pathname === '/metrics') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const { data, error } = await supabase.rpc('get_telegram_bot_metrics', { 
        _time_period: url.searchParams.get('period') || '24 hours' 
      });
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check for alerts
      const alertStatus = await checkAlerts();
      
      return new Response(JSON.stringify({
        metrics: data?.[0] || null,
        alerts: alertStatus,
        timestamp: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle webhook updates
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Handle internal API actions (from admin panel)
      if (body.action) {
        return await handleInternalAction(body);
      }
      
      // SECURITY: Verify webhook secret token - MANDATORY in production
      if (!WEBHOOK_SECRET) {
        if (IS_PRODUCTION) {
          logger.error('TELEGRAM_WEBHOOK_SECRET not configured in production - rejecting all requests');
          return new Response(JSON.stringify({ 
            error: 'Webhook not configured',
            message: 'TELEGRAM_WEBHOOK_SECRET must be set in production'
          }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Only warn in development
          logger.warn('TELEGRAM_WEBHOOK_SECRET not configured - webhook is not protected (development mode)');
        }
      } else {
        // Verify the secret token
        const receivedToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (receivedToken !== WEBHOOK_SECRET) {
          logger.warn('Unauthorized webhook request', {
            hasToken: !!receivedToken,
            ip: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown'
          });
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const update: TelegramUpdate = body;

      logger.debug('Received update', {
        updateId: update.update_id,
        hasMessage: !!update.message,
        hasCallback: !!update.callback_query,
        hasInline: !!update.inline_query
      });

      // Handle inline queries
      if (update.inline_query) {
        await handleInlineQuery(update.inline_query);
      } else if (update.chosen_inline_result) {
        // Handle chosen inline result for analytics
        await handleChosenInlineResult(update.chosen_inline_result);
      } else {
        await handleUpdate(update);
      }

      // Flush metrics after processing
      await flushMetrics();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    logger.error('Error handling request', error);
    
    // Ensure metrics are flushed even on error
    await flushMetrics();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
