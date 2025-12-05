import { handleUpdate } from './bot.ts';
import type { TelegramUpdate } from './telegram-api.ts';
import { handleInlineQuery } from './commands/inline.ts';
import { flushMetrics, checkAlerts } from './utils/metrics.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      const update: TelegramUpdate = await req.json();
      
      console.log('Received update:', JSON.stringify(update, null, 2));

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
    console.error('Error handling request:', error);
    
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
