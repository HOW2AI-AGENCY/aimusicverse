/**
 * Shared Supabase Client for Edge Functions
 *
 * Provides a singleton Supabase client for use across all edge functions.
 * Uses service role key for full database access (bypasses RLS).
 *
 * @module _shared/supabase-client
 *
 * @example
 * ```typescript
 * import { getSupabaseClient } from '../_shared/supabase-client.ts';
 *
 * serve(async (req) => {
 *   const supabase = getSupabaseClient();
 *
 *   const { data, error } = await supabase
 *     .from('tracks')
 *     .select('*')
 *     .limit(10);
 *
 *   return new Response(JSON.stringify({ data }));
 * });
 * ```
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Singleton instance of Supabase client */
let _supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton instance
 *
 * Uses service role key for full database access.
 * Session persistence is disabled for edge function environment.
 *
 * @returns Supabase client instance
 * @throws Error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars are missing
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
