/**
 * RUM Collector Edge Function
 * Collects Real User Monitoring metrics from browser
 * 
 * Accepts Core Web Vitals and device info, stores in rum_metrics table
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RUMMetrics {
  session_id: string;
  page_path?: string;
  // Core Web Vitals
  lcp_ms?: number;
  fid_ms?: number;
  cls?: number;
  fcp_ms?: number;
  ttfb_ms?: number;
  inp_ms?: number;
  // Device info
  device_type?: 'mobile' | 'tablet' | 'desktop';
  connection_type?: string;
  viewport_width?: number;
  viewport_height?: number;
  user_agent?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const metrics: RUMMetrics = await req.json();

    // Validate required fields
    if (!metrics.session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Validate numeric values
    const sanitizedMetrics = {
      user_id: userId,
      session_id: metrics.session_id,
      page_path: metrics.page_path?.substring(0, 500), // Limit path length
      lcp_ms: sanitizeNumber(metrics.lcp_ms),
      fid_ms: sanitizeNumber(metrics.fid_ms),
      cls: sanitizeNumber(metrics.cls),
      fcp_ms: sanitizeNumber(metrics.fcp_ms),
      ttfb_ms: sanitizeNumber(metrics.ttfb_ms),
      inp_ms: sanitizeNumber(metrics.inp_ms),
      device_type: validateDeviceType(metrics.device_type),
      connection_type: metrics.connection_type?.substring(0, 50),
      viewport_width: sanitizeInt(metrics.viewport_width),
      viewport_height: sanitizeInt(metrics.viewport_height),
      user_agent: metrics.user_agent?.substring(0, 500),
    };

    // Insert metrics
    const { error: insertError } = await supabase
      .from('rum_metrics')
      .insert(sanitizedMetrics);

    if (insertError) {
      console.error('Failed to insert RUM metrics:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store metrics' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RUM collector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function sanitizeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  // Reasonable limits for metrics
  if (value < 0 || value > 60000) return null;
  return Math.round(value * 1000) / 1000; // Round to 3 decimal places
}

function sanitizeInt(value: unknown): number | null {
  if (typeof value !== 'number' || !isFinite(value)) return null;
  if (value < 0 || value > 10000) return null;
  return Math.round(value);
}

function validateDeviceType(value: unknown): string | null {
  if (value === 'mobile' || value === 'tablet' || value === 'desktop') {
    return value;
  }
  return null;
}
