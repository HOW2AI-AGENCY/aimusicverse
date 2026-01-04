/**
 * QR Scanner Dialog Component
 * 
 * Provides a button and dialog to scan QR codes using Telegram's native scanner
 * Available in Telegram 6.4+
 * 
 * Features:
 * - Native QR scanner integration
 * - Custom validation logic
 * - Loading states
 * - Error handling
 * 
 * @example
 * ```tsx
 * <QRScannerDialog
 *   buttonText="Scan Track QR"
 *   onScan={(data) => {
 *     console.log('Scanned:', data);
 *   }}
 *   validate={(data) => data.startsWith('https://')}
 * />
 * ```
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QrCode, Loader2 } from 'lucide-react';
import { useTelegramQRScanner } from '@/hooks/telegram';
import { toast } from 'sonner';

interface QRScannerDialogProps {
  buttonText?: string;
  scanText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  onScan?: (data: string) => void;
  validate?: (data: string) => boolean;
}

export const QRScannerDialog = ({
  buttonText = 'Сканировать QR',
  scanText = 'Наведите камеру на QR-код',
  buttonVariant = 'outline',
  buttonSize = 'default',
  onScan,
  validate,
}: QRScannerDialogProps) => {
  const { isSupported, isScanning, scanQR } = useTelegramQRScanner();
  const [open, setOpen] = useState(false);

  const handleScan = async () => {
    setOpen(false);
    
    const result = await scanQR(scanText, validate);
    
    if (result) {
      toast.success('QR-код отсканирован');
      onScan?.(result);
    } else {
      toast.error('Сканирование отменено');
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          {buttonSize !== 'icon' && buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Сканирование QR-кода
          </DialogTitle>
          <DialogDescription>
            Камера откроется для сканирования QR-кода
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex justify-center">
            <div className="relative">
              <QrCode className="h-24 w-24 text-muted-foreground" />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сканирование...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Начать сканирование
              </>
            )}
          </Button>

          {validate && (
            <p className="text-xs text-muted-foreground text-center">
              QR-код будет проверен автоматически
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
