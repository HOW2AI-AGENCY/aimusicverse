/**
 * Centralized Supabase Client
 * Singleton pattern to avoid creating multiple client instances
 * Improves performance and reduces memory usage
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BOT_CONFIG } from '../config.ts';
import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('supabase-client');

// Singleton instance
let _supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton instance
 * @returns Configured Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  logger.info('Creating new Supabase client instance');

  _supabaseClient = createClient(
    BOT_CONFIG.supabaseUrl,
    BOT_CONFIG.supabaseServiceKey,
    {
      auth: {
        persistSession: false, // Serverless environment
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-client-info': 'telegram-bot/1.0',
        },
        fetch: fetch.bind(globalThis),
      },
      db: {
        schema: 'public',
      },
    }
  );

  logger.info('Supabase client created successfully');

  return _supabaseClient;
}

/**
 * Reset the singleton instance (for testing or after errors)
 * @internal
 */
export function resetSupabaseClient(): void {
  logger.warn('Resetting Supabase client instance');
  _supabaseClient = null;
}

/**
 * Execute a Supabase query with automatic retry on network errors
 * @param queryFn Function that executes the query
 * @param maxRetries Maximum number of retry attempts
 * @returns Query result
 */
export async function executeWithRetry<T>(
  queryFn: (client: SupabaseClient) => Promise<T>,
  maxRetries = 2
): Promise<T> {
  const client = getSupabaseClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn(client);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on application errors, only on network errors
      if (error instanceof Error) {
        const isNetworkError = error.message.includes('fetch failed') ||
          error.message.includes('network') ||
          error.message.includes('timeout');

        if (!isNetworkError || attempt === maxRetries) {
          throw error;
        }
      } else {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
      logger.warn(`Query failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Export a pre-configured instance for backward compatibility
 * @deprecated Use getSupabaseClient() instead
 */
export const supabase = getSupabaseClient();
