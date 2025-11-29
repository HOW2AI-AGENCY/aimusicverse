import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Auth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, authenticateWithTelegram } = useAuth();
  const { webApp, user, isInitialized, isDevelopmentMode } = useTelegram();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAuth = async () => {
    const result = await authenticateWithTelegram();
    if (result?.session) {
      navigate('/', { replace: true });
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if Telegram is available or if we're in dev mode
  if (!webApp || !user) {
    if (isDevelopmentMode) {
      // Development mode UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔧</span>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">Режим разработки</h1>
              <p className="text-muted-foreground mb-4">
                Вы работаете в режиме тестирования без Telegram
              </p>
            </div>
            
            {loading ? (
              <div className="py-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Создание тестовой сессии...</p>
              </div>
            ) : (
              <Button
                onClick={handleAuth}
                className="w-full"
                size="lg"
              >
                Войти как Test User
              </Button>
            )}
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left">
              <p className="text-xs text-muted-foreground mb-2">
                <strong>Для продакшена:</strong> Откройте приложение через Telegram Mini App
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Для разработки:</strong> Используйте любой домен lovable.dev или localhost
              </p>
            </div>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Требуется Telegram</h1>
          <p className="text-muted-foreground mb-6">
            Это приложение должно быть открыто через Telegram.
          </p>
          <p className="text-sm text-muted-foreground">
            Пожалуйста, откройте приложение из вашего Telegram бота.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-foreground">Добро пожаловать!</h1>
          <p className="text-muted-foreground">
            {user.first_name} {user.last_name}
          </p>
          {user.username && (
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Авторизация...</p>
          </div>
        ) : (
          <Button
            onClick={handleAuth}
            className="w-full"
            size="lg"
          >
            Продолжить
          </Button>
        )}
      </Card>
    </div>
  );
};

export default Auth;
