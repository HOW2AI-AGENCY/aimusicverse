/**
 * Telegram Authentication Service
 * Handles Mini App authentication with Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramAuth' });

interface TelegramAuthResponse {
  user: {
    id: string;
    telegram_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Authenticate with Telegram initData
 */
export async function authenticateWithTelegram(initData: string): Promise<TelegramAuthResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-auth', {
      body: { initData }
    });

    if (error) {
      log.error('Telegram auth error', error);
      return null;
    }

    if (data.session) {
      await setSession(data.session);
    }

    return data;
  } catch (error) {
    log.error('Error in Telegram auth', error);
    return null;
  }
}

/**
 * Set Supabase session from Telegram auth
 */
async function setSession(session: { access_token: string; refresh_token: string }) {
  try {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) {
      log.error('Error setting session', error);
    }
  } catch (error) {
    log.error('Error setting session', error);
  }
}

// Legacy class exports removed - use authenticateWithTelegram function directly
