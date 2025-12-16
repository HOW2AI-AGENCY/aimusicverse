import { handleUpdate } from './bot.ts';
import type { TelegramUpdate } from './telegram-api.ts';
// Enhanced inline mode with 8 categories support
import { handleInlineQuery } from './commands/inline-enhanced.ts';
import { flushMetrics, checkAlerts } from './utils/metrics.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('telegram-bot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
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
      // Security: Verify webhook secret token
      const secretToken = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
      if (secretToken) {
        const receivedToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (receivedToken !== secretToken) {
          logger.warn('Unauthorized webhook request', {
            hasToken: !!receivedToken,
            ip: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown'
          });
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        // Warn if secret token is not configured (development mode)
        logger.warn('TELEGRAM_WEBHOOK_SECRET not configured - webhook is not protected');
      }

      const update: TelegramUpdate = await req.json();

      logger.debug('Received update', {
        updateId: update.update_id,
        hasMessage: !!update.message,
        hasCallback: !!update.callback_query,
        hasInline: !!update.inline_query
      });

      // Handle inline queries
      if (update.inline_query) {
        await handleInlineQuery(update.inline_query);
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
