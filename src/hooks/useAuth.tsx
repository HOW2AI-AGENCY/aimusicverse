import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  hasProfile: boolean;
  error?: Error | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { initData, isDevelopmentMode } = useTelegram();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Removed auto-authentication to prevent infinite loops
  // Users must explicitly click the auth button

  const checkProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Unexpected error checking profile:', error);
      return false;
    }
  };

  const authenticateWithTelegram = async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      
      // Development mode: Use email/password auth for testing
      if (isDevelopmentMode) {
        console.log('🔧 Development mode: Using test credentials');
        
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
          console.log('🔧 Creating test account with Telegram-like metadata...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: mockTelegramData,
            }
          });
          
          if (signUpError) {
            console.error('Sign up error:', signUpError);
            toast.error('Ошибка создания тестового аккаунта');
            return { user: null, session: null, hasProfile: false, error: signUpError };
          }
          
          signInData = signUpData;
          console.log('🔧 Test account created successfully with profile');
        } else if (signInError) {
          console.error('Sign in error:', signInError);
          toast.error('Ошибка входа в тестовый аккаунт');
          return { user: null, session: null, hasProfile: false, error: signInError };
        }
        
        if (!signInData.session || !signInData.user) {
          return { user: null, session: null, hasProfile: false, error: new Error('No session created') };
        }
        
        setSession(signInData.session);
        setUser(signInData.user);
        
        const hasProfile = signInData.user ? await checkProfile(signInData.user.id) : false;
        
        console.log('🔧 Development authentication successful, hasProfile:', hasProfile);
        toast.success('Режим разработки: вход выполнен!');
        return { user: signInData.user, session: signInData.session, hasProfile };
      }
      
      // Production mode: Use Telegram authentication
      console.log('🔐 Starting Telegram authentication...');
      console.log('📊 InitData length:', initData?.length || 0);

      if (!initData) {
        console.error('❌ No initData available');
        toast.error('Ошибка: нет данных для аутентификации');
        return { user: null, session: null, hasProfile: false, error: new Error('No initData') };
      }

      // Call the telegram-auth edge function
      console.log('📡 Calling telegram-auth edge function...');
      console.log('📊 InitData preview:', initData?.substring(0, 100) + '...');

      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData },
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));

        // Детальная диагностика ошибок
        let errorMessage = 'Ошибка аутентификации';
        if (error.message?.includes('bot token')) {
          errorMessage = '⚠️ TELEGRAM_BOT_TOKEN не настроен в Supabase Secrets';
        } else if (error.message?.includes('Invalid')) {
          errorMessage = '⚠️ Невалидные данные Telegram (проверьте hash)';
        } else if (error.message?.includes('old') || error.message?.includes('expired')) {
          errorMessage = '⚠️ InitData устарел (перезапустите Mini App)';
        } else if (error.context?.body) {
          // Если есть тело ответа, попробуем его распарсить
          try {
            const errorBody = JSON.parse(error.context.body);
            errorMessage = `⚠️ ${errorBody.error || errorBody.message || error.message}`;
          } catch {
            errorMessage = `⚠️ ${error.message || 'Неизвестная ошибка'}`;
          }
        }

        toast.error(errorMessage, { duration: 5000 });
        console.error('💡 Возможные решения:');
        console.error('1. Проверьте TELEGRAM_BOT_TOKEN в Supabase → Settings → Secrets');
        console.error('2. Убедитесь, что приложение открыто через Telegram');
        console.error('3. Перезапустите Mini App для получения свежего initData');

        return { user: null, session: null, hasProfile: false, error };
      }

      if (!data?.session) {
        console.error('❌ No session in response:', data);
        toast.error('Не удалось создать сессию');
        return { user: null, session: null, hasProfile: false, error: new Error('No session received') };
      }

      console.log('✅ Edge function response received');

      // Set the session using the tokens from the edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        toast.error('Ошибка создания сессии');
        return { user: null, session: null, hasProfile: false, error: sessionError };
      }

      setSession(sessionData.session);
      setUser(sessionData.user);
      
      const hasProfile = sessionData.user ? await checkProfile(sessionData.user.id) : false;
      
      console.log('✅ Authentication successful, hasProfile:', hasProfile);
      toast.success('Успешная авторизация!');
      return { user: sessionData.user, session: sessionData.session, hasProfile };
    } catch (error) {
      console.error('❌ Unexpected auth error:', error);
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
