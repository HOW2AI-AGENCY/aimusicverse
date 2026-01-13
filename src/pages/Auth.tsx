import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { Loader2, Music, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SplashScreen } from '@/components/UnifiedSplashScreen';
import logo from '@/assets/logo.png';
import { logger } from '@/lib/logger';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, authenticateWithTelegram } = useAuth();
  const { webApp, user, isInitialized, isDevelopmentMode } = useTelegram();
  const { enableGuestMode } = useGuestMode();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    const result = await authenticateWithTelegram();
    setIsAuthenticating(false);

    if (result?.session) {
      // Navigate to main page - onboarding is handled via OnboardingOverlay
      navigate('/', { replace: true });
    }
  };

  const handleGuestMode = () => {
    enableGuestMode();
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Hard failsafe: never let splash block auth screen
  useEffect(() => {
    if (!showSplash) return;
    const t = window.setTimeout(() => setShowSplash(false), 2000);
    return () => window.clearTimeout(t);
  }, [showSplash]);

  // Auto-authenticate in development mode
  useEffect(() => {
    if (isDevelopmentMode && !isAuthenticated && !loading && !showSplash && !isAuthenticating) {
      logger.debug('Auto-authenticating in dev mode...');
      handleAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDevelopmentMode, isAuthenticated, loading, showSplash, isAuthenticating]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading while initializing
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // In development mode, always show test user login option
  if (isDevelopmentMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full glass-card border-primary/20">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="mb-4 flex justify-center">
                <img src={logo} alt="MusicVerse" className="w-24 h-24 rounded-2xl" />
              </div>
              <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Режим разработки
              </h1>
              <p className="text-muted-foreground mb-4">
                Вы работаете в режиме тестирования без Telegram
              </p>
            </div>
            
            {loading || isAuthenticating ? (
              <div className="py-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Создание тестовой сессии...</p>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleAuth}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  Войти как Test User
                </Button>
                
                <Button
                  onClick={handleGuestMode}
                  variant="outline"
                  className="w-full mt-3"
                  size="lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Попробовать без авторизации
                </Button>
              </>
            )}
            
            <div className="mt-6 p-4 glass rounded-lg text-left">
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Для продакшена:</strong> Откройте приложение через Telegram Mini App
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Для разработки:</strong> Используйте любой домен lovable или localhost
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Check if Telegram user is available (production mode)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="max-w-md w-full glass-card border-primary/20">
          <div className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <img src={logo} alt="MusicVerse" className="w-24 h-24 rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Требуется Telegram
            </h1>
            <p className="text-muted-foreground mb-6">
              Это приложение должно быть открыто через Telegram.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Пожалуйста, откройте приложение из вашего Telegram бота.
            </p>
            
            <Button
              onClick={handleGuestMode}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              Попробовать без авторизации
            </Button>
            
            <div className="mt-4 p-3 glass rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                В гостевом режиме вы можете просматривать интерфейс и публичные треки
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-md w-full glass-card border-primary/20">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <img src={logo} alt="MusicVerse" className="w-24 h-24 rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Добро пожаловать в MusicVerse!
            </h1>
            
            {user.photo_url && (
              <div className="mb-4 flex justify-center">
                <img
                  src={user.photo_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-2 border-primary/30"
                />
              </div>
            )}
            
            <p className="text-lg font-semibold text-foreground">
              {user.first_name} {user.last_name}
            </p>
            {user.username && (
              <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Нажмите "Продолжить" для авторизации через Telegram
            </p>
          </div>

          {loading || isAuthenticating ? (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Авторизация...</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Проверяем данные Telegram...
              </p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleAuth}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                Продолжить
              </Button>
              
              <Button
                onClick={handleGuestMode}
                variant="outline"
                className="w-full mt-3"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Попробовать без авторизации
              </Button>
              
              <div className="mt-4 p-3 glass rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  ✨ Безопасная авторизация через Telegram
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
