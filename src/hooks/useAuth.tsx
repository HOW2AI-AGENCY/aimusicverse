import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

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

  const authenticateWithTelegram = async () => {
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
            return { error: signUpError };
          }
          
          signInData = signUpData;
          console.log('🔧 Test account created successfully with profile');
        } else if (signInError) {
          console.error('Sign in error:', signInError);
          toast.error('Ошибка входа в тестовый аккаунт');
          return { error: signInError };
        }
        
        setSession(signInData.session);
        setUser(signInData.user);
        console.log('🔧 Development authentication successful');
        toast.success('Режим разработки: вход выполнен!');
        return { user: signInData.user, session: signInData.session };
      }
      
      // Production mode: Use Telegram authentication
      console.log('Starting Telegram authentication...');

      // Call the telegram-auth edge function
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Ошибка аутентификации');
        return { error };
      }

      if (!data?.session) {
        console.error('No session in response:', data);
        toast.error('Не удалось создать сессию');
        return { error: new Error('No session received') };
      }

      // Set the session using the tokens from the edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Ошибка создания сессии');
        return { error: sessionError };
      }

      setSession(sessionData.session);
      setUser(sessionData.user);
      console.log('Authentication successful');
      toast.success('Успешная авторизация!');
      return { user: sessionData.user, session: sessionData.session };
    } catch (error) {
      console.error('Unexpected auth error:', error);
      toast.error('Ошибка авторизации');
      return { error };
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
