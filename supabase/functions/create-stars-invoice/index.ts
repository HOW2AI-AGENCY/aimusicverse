import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createLogger } from '../_shared/logger.ts';
import { checkRateLimit, getRateLimitHeaders, RateLimitConfigs } from '../_shared/rate-limiter.ts';

const logger = createLogger('create-stars-invoice');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceRequest {
  productCode: string;
  userId?: string; // Optional, will be extracted from auth if not provided
}

/**
 * T053: Validate request body against JSON schema
 */
function validateInvoiceRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required field: productCode
  if (!body.productCode || typeof body.productCode !== 'string') {
    errors.push('productCode is required and must be a string');
  } else {
    // Pattern validation: ^(credits_\d+|sub_[a-z]+)$
    const pattern = /^(credits_\d+|sub_[a-z]+)$/;
    if (!pattern.test(body.productCode)) {
      errors.push('productCode must match pattern: credits_{number} or sub_{tier}');
    }
  }

  // Optional field: userId (must be UUID if provided)
  if (body.userId !== undefined) {
    if (typeof body.userId !== 'string') {
      errors.push('userId must be a string (UUID format)');
    } else {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(body.userId)) {
        errors.push('userId must be a valid UUID');
      }
    }
  }

  // Optional field: metadata (must be object if provided)
  if (body.metadata !== undefined && typeof body.metadata !== 'object') {
    errors.push('metadata must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting (10 requests per minute per user)
    const rateLimitKey = `invoice:${user.id}`;
    const rateLimit = checkRateLimit(rateLimitKey, RateLimitConfigs.invoiceCreation);
    
    if (rateLimit.isLimited) {
      logger.warn('Rate limit exceeded', { userId: user.id, limit: rateLimit.limit });
      
      const retryAfter = Math.max(0, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Too many invoice creation requests. Please try again later.',
          retryAfter,
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimit.limit, rateLimit.remaining, rateLimit.resetAt),
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // T053: Parse and validate request body
    const body = await req.json();
    const validation = validateInvoiceRequest(body);
    
    if (!validation.valid) {
      logger.warn('Invalid request body', { errors: validation.errors });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: validation.errors,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { productCode, userId: requestUserId }: InvoiceRequest = body;
    const userId = requestUserId || user.id;

    logger.info('Creating invoice', { productCode, userId });

    // Get product from database
    const { data: product, error: productError } = await supabase
      .from('stars_products')
      .select('*')
      .eq('product_code', productCode)
      .eq('status', 'active')
      .single();

    if (productError || !product) {
      logger.error('Product not found', { productCode, error: productError });
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Telegram ID from profile (use telegram_id not telegram_user_id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.telegram_id) {
      logger.error('User profile not found', { userId, error: profileError });
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const telegramUserId = profile.telegram_id;

    // Create transaction record
    const transactionId = crypto.randomUUID();
    const invoicePayload = JSON.stringify({
      transactionId,
      userId,
      productId: product.id,
      productCode: product.product_code,
      timestamp: Date.now(),
    });

    const { error: txError } = await supabase
      .from('stars_transactions')
      .insert({
        id: transactionId,
        user_id: userId,
        product_id: product.id,
        product_code: product.product_code,
        telegram_user_id: telegramUserId,
        stars_amount: product.stars_price,
        status: 'pending',
      });

    if (txError) {
      logger.error('Failed to create transaction', { error: txError });
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get localized strings
    const lang = 'ru'; // TODO: Get from user preferences
    const title = product.name[lang] || product.name['en'];
    const description = product.description[lang] || product.description['en'];

    // Create invoice link using Telegram Bot API
    const invoiceParams = {
      title,
      description,
      payload: invoicePayload,
      currency: 'XTR', // Telegram Stars
      prices: [
        {
          label: title,
          amount: product.stars_price, // Amount in Stars
        },
      ],
      // Optional photo
      photo_url: 'https://aimusicverse.com/images/product-icon.png',
      photo_width: 512,
      photo_height: 512,
    };

    logger.info('Creating Telegram invoice', { params: invoiceParams });

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceParams),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      logger.error('Telegram API error', { error: telegramResult });
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice', details: telegramResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const invoiceLink = telegramResult.result;

    logger.info('Invoice created successfully', { transactionId, invoiceLink });

    return new Response(
      JSON.stringify({
        success: true,
        invoiceLink,
        transactionId,
        product: {
          code: product.product_code,
          name: title,
          price: product.stars_price,
          type: product.product_type,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    logger.error('Error in create-stars-invoice', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
