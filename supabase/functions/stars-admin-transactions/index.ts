/**
 * Telegram Stars Payment Admin Transactions
 * 
 * Returns paginated transaction list with filters
 * - Filter by status, product type, date range
 * - Search by user email/name
 * - Pagination support
 * 
 * Tasks: T125-T127
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('stars-admin-transactions');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * T125: Admin authentication check
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
    logger.warn('Non-admin attempted to access admin transactions', { userId: user.id });
    return { isAdmin: false, userId: user.id, error: 'Forbidden: admin access required' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * T126-T127: Main admin transactions endpoint with filters and pagination
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

    // T125: Verify admin authentication
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

    // T127: Parse pagination and filter parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(url.searchParams.get('perPage') || '50', 10), 100);
    const status = url.searchParams.get('status');
    const productType = url.searchParams.get('productType');
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    const userSearch = url.searchParams.get('userSearch');

    logger.info('Admin transactions requested', {
      userId,
      page,
      perPage,
      filters: { status, productType, fromDate, toDate, userSearch },
    });

    // T126: Build query with filters
    let query = supabase
      .from('stars_transactions')
      .select(`
        *,
        product:stars_products (
          id,
          product_code,
          product_type,
          name,
          stars_price
        ),
        user:profiles!stars_transactions_user_id_fkey (
          user_id,
          full_name,
          username,
          telegram_id
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (productType) {
      query = query.eq('product:stars_products.product_type', productType);
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    // User search (by Telegram ID, username, or full name)
    if (userSearch) {
      // Note: This requires OR query which is complex in Supabase
      // For now, search by telegram_id only
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .or(`telegram_id.ilike.%${userSearch}%,username.ilike.%${userSearch}%,full_name.ilike.%${userSearch}%`)
        .limit(100);

      if (profileData && profileData.length > 0) {
        const userIds = profileData.map((p: any) => p.user_id);
        query = query.in('user_id', userIds);
      } else {
        // No users found matching search - return empty result
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: {
              page,
              perPage,
              total: 0,
              totalPages: 0,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Database query error', { error });
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalPages = count ? Math.ceil(count / perPage) : 0;

    logger.info('Admin transactions fetched', {
      userId,
      count: data?.length || 0,
      total: count,
      page,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: {
          page,
          perPage,
          total: count || 0,
          totalPages,
        },
        filters: {
          status,
          productType,
          fromDate,
          toDate,
          userSearch,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    logger.error('Error in stars-admin-transactions', {
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
