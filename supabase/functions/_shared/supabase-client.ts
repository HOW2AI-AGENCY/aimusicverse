/**
 * Shared Supabase Client for Edge Functions
 * Simple singleton pattern without telegram-bot dependencies
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Singleton instance
let _supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton instance
 * Uses service role key for full access
 */
export function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _supabaseClient;
}
