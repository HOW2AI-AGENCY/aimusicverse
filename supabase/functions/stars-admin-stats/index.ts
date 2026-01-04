/**
 * Telegram Stars Payment Admin Statistics
 * 
 * Returns payment analytics for admin dashboard
 * - Total revenue in Stars
 * - Transaction counts by status
 * - Top-selling products
 * - Active subscriptions count
 * 
 * Tasks: T064-T070 (mapped from T120-T124 in tasks.md)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('stars-admin-stats');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// T067: Response caching (5 minutes)
let cachedStats: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * T064: Admin authentication check
 */
async function verifyAdminAccess(supabase: any, token: string | null): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  if (!token) {
    return { isAdmin: false, userId: null, error: 'Missing authorization header' };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    logger.error('Authentication failed', { error: authError });
    return { isAdmin: false, userId: null, error: 'Unauthorized' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin) {
    logger.warn('Non-admin attempted to access admin stats', { userId: user.id });
    return { isAdmin: false, userId: user.id, error: 'Forbidden: admin access required' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * T064-T068: Main admin stats endpoint
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // T064: Verify admin authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { isAdmin, userId, error: authError } = await verifyAdminAccess(supabase, token ?? null);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: authError || 'Unauthorized' }),
        {
          status: authError === 'Forbidden: admin access required' ? 403 : 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // T066: Parse date range parameters
    const url = new URL(req.url);
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    
    // Default: last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    
    const fromDate = fromParam ? new Date(fromParam) : defaultFrom;
    const toDate = toParam ? new Date(toParam) : new Date();

    logger.info('Admin stats requested', {
      userId,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });

    // T067: Check cache
    const now = Date.now();
    const cacheKey = `${fromDate.toISOString()}_${toDate.toISOString()}`;
    
    if (cachedStats && (now - cacheTimestamp < CACHE_TTL_MS) && cachedStats.cacheKey === cacheKey) {
      logger.info('Returning cached stats', { age: now - cacheTimestamp });
      
      return new Response(
        JSON.stringify({
          ...cachedStats.data,
          cached: true,
          cache_age_seconds: Math.floor((now - cacheTimestamp) / 1000),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': `max-age=${Math.floor((CACHE_TTL_MS - (now - cacheTimestamp)) / 1000)}`,
          },
        }
      );
    }

    // T065: Call get_stars_payment_stats() database function
    const { data, error } = await supabase.rpc('get_stars_payment_stats', {
      p_start_date: fromDate.toISOString(),
      p_end_date: toDate.toISOString(),
    });

    if (error) {
      logger.error('Database function error', { error });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch payment stats', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get additional breakdown by product type
    const { data: breakdown } = await supabase
      .from('stars_transactions')
      .select('product:stars_products(product_type, product_code), stars_amount, status')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    // Type guard for breakdown items
    type BreakdownItem = { 
      product: { product_type: string; product_code: string } | null; 
      stars_amount: number | null; 
      status: string | null;
    };
    const typedBreakdown = (breakdown || []) as unknown as BreakdownItem[];

    // Calculate breakdowns
    const creditRevenue = typedBreakdown
      .filter(tx => tx.product?.product_type === 'credit_package' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.stars_amount || 0), 0);

    const subscriptionRevenue = typedBreakdown
      .filter(tx => tx.product?.product_type === 'subscription' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.stars_amount || 0), 0);

    const statusBreakdown = {
      completed: typedBreakdown.filter(tx => tx.status === 'completed').length,
      pending: typedBreakdown.filter(tx => tx.status === 'pending').length,
      failed: typedBreakdown.filter(tx => tx.status === 'failed').length,
      cancelled: typedBreakdown.filter(tx => tx.status === 'cancelled').length,
    };

    // Format response
    const response = {
      success: true,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      stats: {
        total_transactions: data.total_transactions,
        completed_transactions: data.completed_transactions,
        total_stars_collected: data.total_stars_collected,
        total_credits_granted: data.total_credits_granted,
        active_subscriptions: data.active_subscriptions,
        success_rate: data.completed_transactions > 0
          ? ((data.completed_transactions / data.total_transactions) * 100).toFixed(2)
          : 0,
      },
      breakdown: {
        by_product_type: {
          credits: creditRevenue,
          subscriptions: subscriptionRevenue,
        },
        by_status: statusBreakdown,
      },
      checked_at: new Date().toISOString(),
      cached: false,
    };

    // T067: Update cache
    cachedStats = {
      cacheKey,
      data: response,
    };
    cacheTimestamp = now;

    logger.info('Admin stats generated', {
      userId,
      totalTransactions: data.total_transactions,
      revenue: data.total_stars_collected,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${CACHE_TTL_MS / 1000}`,
      },
    });
  } catch (error: any) {
    logger.error('Error in stars-admin-stats', {
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
