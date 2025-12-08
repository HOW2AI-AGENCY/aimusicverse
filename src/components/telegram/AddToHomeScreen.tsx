import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, Check, X } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed' | 'checking';

export const AddToHomeScreen = () => {
  const { webApp } = useTelegram();
  const [status, setStatus] = useState<HomeScreenStatus>('checking');

  useEffect(() => {
    if (!webApp?.checkHomeScreenStatus) {
      setStatus('unsupported');
      return;
    }

    try {
      webApp.checkHomeScreenStatus((result) => {
        setStatus(result);
      });
    } catch (error) {
      // Method not supported in this environment (e.g., browser preview)
      setStatus('unsupported');
    }
  }, [webApp]);

  const handleAddToHomeScreen = () => {
    if (!webApp?.addToHomeScreen) {
      toast.error('Функция недоступна в вашей версии Telegram');
      return;
    }

    webApp.addToHomeScreen();
    
    // Check status after a delay
    setTimeout(() => {
      try {
        webApp.checkHomeScreenStatus?.((result) => {
          setStatus(result);
          if (result === 'added') {
            toast.success('Приложение добавлено на главный экран!');
          }
        });
      } catch {
        // Ignore errors in unsupported environments
      }
    }, 2000);
  };

  if (status === 'unsupported') {
    return null;
  }

  if (status === 'added') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-green-500" />
        <span>Добавлено на главный экран</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddToHomeScreen}
      className="gap-2"
      disabled={status === 'checking'}
    >
      <Home className="h-4 w-4" />
      {status === 'checking' ? 'Проверка...' : 'На главный экран'}
    </Button>
  );
};
