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
  session: string;
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
        // Set the session in Supabase
        await this.setSession(data.session);
      }

      return data;
    } catch (error) {
      console.error('Error in Telegram auth:', error);
      return null;
    }
  }

  private async setSession(actionLink: string) {
    try {
      // Extract token from action link
      const url = new URL(actionLink);
      const token = url.searchParams.get('token');
      
      if (token) {
        const { error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token,
        });

        if (error) {
          console.error('Error setting session:', error);
        }
      }
    } catch (error) {
      console.error('Error parsing session:', error);
    }
  }
}

export const telegramAuthService = new TelegramAuthService();
