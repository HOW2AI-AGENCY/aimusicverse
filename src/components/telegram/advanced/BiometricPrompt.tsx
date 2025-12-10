/**
 * Biometric Authentication Prompt Component
 * 
 * Provides a UI for biometric authentication (Touch ID, Face ID, fingerprint)
 * Available on iOS and Android with Telegram 7.2+
 * 
 * Features:
 * - Automatic detection of biometric type
 * - Access request flow
 * - Authentication with custom reason
 * - Settings link for troubleshooting
 * - Graceful fallback for unsupported devices
 * 
 * @example
 * ```tsx
 * <BiometricPrompt
 *   reason="Confirm track purchase"
 *   onAuthenticate={(success) => {
 *     if (success) {
 *       // Proceed with action
 *     }
 *   }}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Fingerprint, Scan, Settings, AlertCircle } from 'lucide-react';
import { useTelegramBiometric } from '@/hooks/telegram';
import { toast } from 'sonner';

interface BiometricPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  onAuthenticate: (success: boolean, token?: string) => void;
}

export const BiometricPrompt = ({
  open,
  onOpenChange,
  reason = 'Подтвердите действие',
  onAuthenticate,
}: BiometricPromptProps) => {
  const {
    isSupported,
    isAvailable,
    isAccessGranted,
    biometricType,
    initialize,
    requestAccess,
    authenticate,
    openSettings,
  } = useTelegramBiometric();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    if (open && isSupported) {
      initialize();
    }
  }, [open, isSupported, initialize]);

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isAccessGranted) {
        const granted = await requestAccess(reason);
        if (!granted) {
          setError('Доступ к биометрии отклонен');
          setIsLoading(false);
          return;
        }
      }

      const result = await authenticate(reason);
      
      if (result.success) {
        toast.success('Аутентификация успешна');
        onAuthenticate(true, result.token);
        onOpenChange(false);
      } else {
        setError('Аутентификация не удалась');
        onAuthenticate(false);
      }
    } catch (err) {
      setError('Ошибка аутентификации');
      onAuthenticate(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return <Scan className="h-12 w-12 text-primary" />;
      case 'finger':
        return <Fingerprint className="h-12 w-12 text-primary" />;
      default:
        return <Fingerprint className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getBiometricLabel = () => {
    switch (biometricType) {
      case 'face':
        return 'Face ID';
      case 'finger':
        return 'Touch ID / Fingerprint';
      default:
        return 'Biometric Authentication';
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Биометрия недоступна
            </DialogTitle>
            <DialogDescription>
              Биометрическая аутентификация не поддерживается на вашем устройстве
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Закрыть
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAvailable) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Биометрия не настроена
            </DialogTitle>
            <DialogDescription>
              Настройте биометрическую аутентификацию в настройках устройства
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={openSettings} className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Открыть настройки
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {getBiometricLabel()}
          </DialogTitle>
          <DialogDescription className="text-center">
            {reason}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="relative">
            {getBiometricIcon()}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full space-y-2">
            <Button
              onClick={handleAuthenticate}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Отмена
            </Button>
          </div>

          {!isAccessGranted && (
            <p className="text-xs text-muted-foreground text-center">
              Первый раз потребуется предоставить доступ к биометрии
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
