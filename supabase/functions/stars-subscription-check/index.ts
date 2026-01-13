/**
 * Telegram Stars Subscription Status Check
 * 
 * Returns current subscription status for authenticated user
 * 
 * Tasks: T057-T061
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('stars-subscription-check');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * T057-T061: Subscription status endpoint
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    // T060: Authentication check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      logger.error('Authentication failed', { error: authError });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters for optional user_id (defaults to authenticated user)
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('user_id');

    // T060: Users can only query their own subscription (unless admin)
    let targetUserId = user.id;
    if (requestedUserId && requestedUserId !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: cannot query other users subscriptions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = requestedUserId;
    }

    logger.info('Checking subscription status', { userId: targetUserId });

    // T058: Call get_subscription_status() database function
    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_user_id: targetUserId,
    });

    if (error) {
      logger.error('Database function error', { error, userId: targetUserId });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription status', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // T059: Format response per contract (stars-invoice-api.json)
    const response = {
      success: true,
      subscription: {
        has_subscription: data.has_subscription,
        tier: data.tier,
        expires_at: data.expires_at || null,
        days_remaining: data.days_remaining || null,
        is_active: data.has_subscription,
      },
      user_id: targetUserId,
      checked_at: new Date().toISOString(),
    };

    logger.info('Subscription status retrieved', {
      userId: targetUserId,
      tier: data.tier,
      hasSubscription: data.has_subscription,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    logger.error('Error in stars-subscription-check', {
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
