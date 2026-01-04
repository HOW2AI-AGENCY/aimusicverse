import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, ExternalLink, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

interface MusicToProfileProps {
  trackTitle: string;
  trackUrl: string;
  artistName?: string;
}

export const MusicToProfile = ({ trackTitle, trackUrl, artistName }: MusicToProfileProps) => {
  const { webApp, hapticFeedback } = useTelegram();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const triggerHapticFeedback = (type: 'success' | 'error' | 'medium') => {
    if (type === 'success' || type === 'error') {
      hapticFeedback?.(type);
    } else {
      hapticFeedback?.('medium');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      triggerHapticFeedback?.('success');
      toast.success('Ссылка скопирована!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleOpenTelegram = () => {
    // Open Telegram settings for music profile
    webApp?.openTelegramLink?.('https://t.me/settings');
    triggerHapticFeedback?.('medium');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
          <Music className="h-4 w-4" />
          Музыка в профиль
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Добавить в профиль Telegram
          </DialogTitle>
          <DialogDescription>
            Покажите свою любимую музыку в профиле Telegram
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-medium text-sm">{trackTitle}</p>
            {artistName && (
              <p className="text-xs text-muted-foreground">{artistName}</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Инструкция:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Скопируйте ссылку на трек ниже</li>
              <li>Откройте настройки Telegram → Профиль</li>
              <li>Нажмите "Изменить профиль"</li>
              <li>Выберите раздел "Музыка"</li>
              <li>Вставьте скопированную ссылку</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Скопировать ссылку
                </>
              )}
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={handleOpenTelegram}
            >
              <ExternalLink className="h-4 w-4" />
              Настройки
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Функция "Музыка в профиле" доступна в Telegram 10.0+
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
