import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  hasProfile: boolean;
  error?: Error | null;
}

const authLogger = logger.child({ module: 'useAuth' });

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { initData, isDevelopmentMode } = useTelegram();

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      authLogger.warn('Auth loading timeout - forcing loading complete');
      setLoading(false);
    }, 5000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authLogger.debug('Auth state change', { event, hasSession: !!session });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      authLogger.debug('Got session', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(loadingTimeout);
    }).catch((error) => {
      authLogger.error('Error getting session', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const checkProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        authLogger.error('Error checking profile', error);
        return false;
      }

      return !!data;
    } catch (error) {
      authLogger.error('Unexpected error checking profile', error);
      return false;
    }
  };

  const authenticateWithTelegram = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      
      // Development mode: Use email/password auth for testing
      if (isDevelopmentMode) {
        authLogger.info('Development mode: Using test credentials');
        
        const testEmail = 'test@lovable.dev';
        const testPassword = 'testpassword123';
        
        // Mock Telegram user data for testing
        const mockTelegramData = {
          telegram_id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ru',
          photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        };
        
        // Try to sign in first
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        // If user doesn't exist, create account
        if (signInError?.message.includes('Invalid login credentials')) {
          authLogger.info('Creating test account with Telegram-like metadata...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: mockTelegramData,
            }
          });
          
          if (signUpError) {
            authLogger.error('Sign up error', signUpError);
            toast.error('Ошибка создания тестового аккаунта');
            return { user: null, session: null, hasProfile: false, error: signUpError };
          }
          
          if (!signUpData.user || !signUpData.session) {
            authLogger.error('Sign up did not return user or session');
            return { user: null, session: null, hasProfile: false, error: new Error('Sign up failed') };
          }
          
          signInData = { user: signUpData.user, session: signUpData.session };
          signInError = null;
          authLogger.info('Test account created successfully with profile');
        } else if (signInError) {
          authLogger.error('Sign in error', signInError);
          toast.error('Ошибка входа в тестовый аккаунт');
          return { user: null, session: null, hasProfile: false, error: signInError };
        }
        
        if (!signInData.session || !signInData.user) {
          return { user: null, session: null, hasProfile: false, error: new Error('No session created') };
        }
        
        setSession(signInData.session);
        setUser(signInData.user);
        
        const hasProfile = signInData.user ? await checkProfile(signInData.user.id) : false;
        
        authLogger.info('Development authentication successful', { hasProfile });
        toast.success('Режим разработки: вход выполнен!');
        return { user: signInData.user, session: signInData.session, hasProfile };
      }
      
      // Production mode: Use Telegram authentication
      authLogger.info('Starting Telegram authentication', { initDataLength: initData?.length || 0 });

      if (!initData) {
        authLogger.error('No initData available');
        toast.error('Ошибка: нет данных для аутентификации');
        return { user: null, session: null, hasProfile: false, error: new Error('No initData') };
      }

      // Call the telegram-auth edge function
      authLogger.debug('Calling telegram-auth edge function');

      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData },
      });

      if (error) {
        authLogger.error('Edge function error', error);

        // Детальная диагностика ошибок
        let errorMessage = 'Ошибка аутентификации';
        if (error.message?.includes('bot token')) {
          errorMessage = '⚠️ TELEGRAM_BOT_TOKEN не настроен в Supabase Secrets';
        } else if (error.message?.includes('Invalid')) {
          errorMessage = '⚠️ Невалидные данные Telegram (проверьте hash)';
        } else if (error.message?.includes('old') || error.message?.includes('expired')) {
          errorMessage = '⚠️ InitData устарел (перезапустите Mini App)';
        } else if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            errorMessage = `⚠️ ${errorBody.error || errorBody.message || error.message}`;
          } catch {
            errorMessage = `⚠️ ${error.message || 'Неизвестная ошибка'}`;
          }
        }

        toast.error(errorMessage, { duration: 5000 });
        authLogger.warn('Auth troubleshooting hints', {
          hints: [
            'Check TELEGRAM_BOT_TOKEN in Supabase Secrets',
            'Ensure app is opened via Telegram',
            'Restart Mini App for fresh initData'
          ]
        });

        return { user: null, session: null, hasProfile: false, error };
      }

      if (!data?.session) {
        authLogger.error('No session in response', { data });
        toast.error('Не удалось создать сессию');
        return { user: null, session: null, hasProfile: false, error: new Error('No session received') };
      }

      authLogger.debug('Edge function response received');

      // Set the session using the tokens from the edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        authLogger.error('Session error', sessionError);
        toast.error('Ошибка создания сессии');
        return { user: null, session: null, hasProfile: false, error: sessionError };
      }

      setSession(sessionData.session);
      setUser(sessionData.user);
      
      const hasProfile = sessionData.user ? await checkProfile(sessionData.user.id) : false;
      
      authLogger.info('Authentication successful', { hasProfile });
      toast.success('Успешная авторизация!');
      return { user: sessionData.user, session: sessionData.session, hasProfile };
    } catch (error) {
      authLogger.error('Unexpected auth error', error);
      toast.error('Ошибка авторизации');
      return { user: null, session: null, hasProfile: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.success('Вышли из системы');
  };

  return {
    user,
    session,
    loading,
    authenticateWithTelegram,
    logout,
    isAuthenticated: !!user,
  };
};
