// Telegram Authentication Service for Mini App
import { supabase } from '@/integrations/supabase/client';

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

export class TelegramAuthService {
  async authenticateWithTelegram(initData: string): Promise<TelegramAuthResponse | null> {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData }
      });

      if (error) {
        console.error('Telegram auth error:', error);
        return null;
      }

      if (data.session) {
        // Set the session in Supabase - session is now properly typed
        await this.setSession(data.session);
      }

      return data;
    } catch (error) {
      console.error('Error in Telegram auth:', error);
      return null;
    }
  }

  private async setSession(session: { access_token: string; refresh_token: string }) {
    try {
      // Session is a JWT object with access_token and refresh_token
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) {
        console.error('Error setting session:', error);
      }
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }
}

export const telegramAuthService = new TelegramAuthService();
