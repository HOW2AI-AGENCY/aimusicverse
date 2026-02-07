/**
 * ShareSheet - Enhanced sharing options for tracks
 * 
 * Provides multiple sharing methods:
 * - Share to Telegram chat
 * - Share to Telegram Story
 * - Copy link
 * - Generate QR code
 * - Download for sharing
 * 
 * Integrates with Telegram Mini App API for native sharing
 * 
 * ARCHITECTURE:
 * - Mobile (<768px): Uses MobileActionSheet for iOS-style UX
 * - Desktop (>=768px): Uses Sheet/Dialog pattern
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Sparkles, 
  Link as LinkIcon, 
  QrCode, 
  Download, 
  Copy,
  Share2
} from 'lucide-react';
import { notify } from '@/lib/notifications';
import { useTelegram } from '@/contexts/TelegramContext';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    title: string;
    artist?: string;
    style?: string;
    coverUrl?: string;
    audioUrl?: string;
  };
  itemType?: 'track' | 'playlist' | 'artist';
}

export function ShareSheet({ open, onOpenChange, item, itemType = 'track' }: ShareSheetProps) {
  const { shareToStory, shareURL, hapticFeedback } = useTelegram();
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Generate deep link
  const getDeepLink = () => {
    const baseUrl = 'https://t.me/AIMusicVerseBot/app?startapp=';
    return `${baseUrl}${itemType}_${item.id}`;
  };

  // Generate share text
  const getShareText = () => {
    const emoji = itemType === 'track' ? '🎵' : itemType === 'playlist' ? '📱' : '🎤';
    let text = `${emoji} ${item.title}`;
    
    if (item.artist) {
      text += `\n👤 ${item.artist}`;
    }
    
    if (item.style) {
      text += `\n🎼 ${item.style}`;
    }
    
    text += '\n\n✨ Создано в MusicVerse AI';
    text += `\n🔗 ${getDeepLink()}`;
    
    return text;
  };

  // Share to Telegram chat
  const handleShareToChat = () => {
    hapticFeedback('light');
    const url = getDeepLink();
    const text = getShareText();
    
    try {
      shareURL(url, text);
      notify.success('Открыто окно выбора чата');
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to share to chat', error instanceof Error ? error : new Error(String(error)));
      notify.error('Ошибка при отправке');
    }
  };

  // Share to Telegram Story
  const handleShareToStory = async () => {
    hapticFeedback('medium');
    
    if (!shareToStory) {
      notify.error('Stories не поддерживаются в этой версии Telegram');
      return;
    }

    try {
      // For now, use cover image if available, otherwise skip
      if (item.coverUrl) {
        shareToStory(item.coverUrl, {
          media_url: item.coverUrl,
          text: `🎵 ${item.title}`,
          widget_link: {
            url: getDeepLink(),
            name: 'Слушать в MusicVerse',
          },
        });
        notify.success('История создана');
        onOpenChange(false);
      } else {
        notify.info('Для Stories нужна обложка трека');
      }
    } catch (error) {
      logger.error('Failed to share to story', error instanceof Error ? error : new Error(String(error)));
      notify.error('Ошибка при создании Stories');
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    hapticFeedback('light');
    const url = getDeepLink();
    
    try {
      await navigator.clipboard.writeText(url);
      notify.success('Ссылка скопирована', {
        description: 'Готова к отправке',
      });
    } catch (error) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        notify.success('Ссылка скопирована');
      } catch (e) {
        notify.error('Не удалось скопировать ссылку');
      }
      
      document.body.removeChild(textArea);
    }
  };

  // Generate and show QR code
  const handleShowQR = async () => {
    hapticFeedback('light');
    
    if (showQR && qrCode) {
      setShowQR(false);
      return;
    }

    try {
      // Dynamic import to reduce bundle size
      const QRCode = (await import('qrcode')).default;
      const url = getDeepLink();
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      
      setQrCode(qrDataUrl);
      setShowQR(true);
      notify.success('QR код сгенерирован');
    } catch (error) {
      logger.error('Failed to generate QR code', error instanceof Error ? error : new Error(String(error)));
      notify.error('Не удалось создать QR код');
    }
  };

  // Download QR code
  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    hapticFeedback('light');
    const link = document.createElement('a');
    link.download = `musicverse-${itemType}-${item.id}-qr.png`;
    link.href = qrCode;
    link.click();
    notify.success('QR код сохранён');
  };

  // Build action groups for MobileActionSheet
  const buildActionGroups = () => {
    const groups: Array<{
      title?: string;
      actions: Array<{
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'destructive' | 'muted';
        disabled?: boolean;
      }>;
    }> = [];

    // Primary actions group
    const primaryActions = [];

    // Share to Chat
    primaryActions.push({
      label: 'Отправить в чат',
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: handleShareToChat,
    });

    // Share to Story
    if (typeof shareToStory === 'function' && item.coverUrl) {
      primaryActions.push({
        label: 'Опубликовать в Stories',
        icon: <Sparkles className="w-5 h-5" />,
        onClick: handleShareToStory,
      });
    }

    groups.push({
      title: 'Telegram',
      actions: primaryActions,
    });

    // Link actions group
    const linkActions = [
      {
        label: 'Скопировать ссылку',
        icon: <LinkIcon className="w-5 h-5" />,
        onClick: handleCopyLink,
      },
    ];

    // QR Code action
    if (!showQR) {
      linkActions.push({
        label: 'Показать QR код',
        icon: <QrCode className="w-5 h-5" />,
        onClick: handleShowQR,
      });
    }

    groups.push({
      title: 'Ссылки',
      actions: linkActions,
    });

    return groups;
  };

  // Mobile version - MobileActionSheet
  if (isMobile) {
    return (
      <>
        <MobileActionSheet
          open={open && !showQR}
          onOpenChange={onOpenChange}
          title="Поделиться"
          description={item.title}
          groups={buildActionGroups()}
          showCancel={true}
          cancelLabel="Отмена"
        />

        {/* QR Code Modal for Mobile - theme-aware backdrop */}
        {showQR && qrCode && (
          <div 
            className="fixed inset-0 bg-background/60 dark:bg-black/60 backdrop-blur-sm z-dialog flex items-center justify-center p-4" 
            onClick={() => setShowQR(false)}
          >
            <div 
              className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">QR код</h3>
                <p className="text-sm text-muted-foreground">{item.title}</p>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 bg-white dark:bg-gray-100 p-3 rounded-lg"
                />
                <p className="text-xs text-center text-muted-foreground">
                  Отсканируйте для быстрого доступа
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownloadQR}
                  variant="default"
                  className="w-full h-12 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Сохранить QR код
                </Button>
                <Button
                  onClick={() => setShowQR(false)}
                  variant="outline"
                  className="w-full h-12"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop version - Sheet pattern

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Поделиться
          </SheetTitle>
          <SheetDescription>
            {item.title}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-3 mt-6 pb-6">
          {/* Share to Chat */}
          <Button 
            onClick={handleShareToChat} 
            className="w-full h-12 gap-2 justify-start"
            variant="outline"
          >
            <MessageCircle className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-medium">Отправить в чат</div>
              <div className="text-xs text-muted-foreground">Поделиться с друзьями</div>
            </div>
          </Button>
          
          {/* Share to Story */}
          {typeof shareToStory === 'function' && item.coverUrl && (
            <Button 
              onClick={handleShareToStory} 
              className="w-full h-12 gap-2 justify-start"
              variant="outline"
            >
              <Sparkles className="w-5 h-5" />
              <div className="text-left flex-1">
                <div className="font-medium">Опубликовать в Stories</div>
                <div className="text-xs text-muted-foreground">Поделиться со всеми</div>
              </div>
            </Button>
          )}
          
          {/* Copy Link */}
          <Button 
            onClick={handleCopyLink} 
            className="w-full h-12 gap-2 justify-start"
            variant="outline"
          >
            <LinkIcon className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-medium">Скопировать ссылку</div>
              <div className="text-xs text-muted-foreground">Вставить куда угодно</div>
            </div>
          </Button>
          
          {/* QR Code */}
          <Button 
            onClick={handleShowQR} 
            className={cn(
              "w-full h-12 gap-2 justify-start",
              showQR && "ring-2 ring-primary"
            )}
            variant="outline"
          >
            <QrCode className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-medium">
                {showQR ? 'Скрыть QR код' : 'Показать QR код'}
              </div>
              <div className="text-xs text-muted-foreground">Для быстрого доступа</div>
            </div>
          </Button>
          
          {/* QR Code Display */}
          {showQR && qrCode && (
            <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-xl border">
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="w-48 h-48 bg-white p-2 rounded-lg"
              />
              <p className="text-xs text-center text-muted-foreground">
                Отсканируйте для быстрого доступа
              </p>
              <Button
                onClick={handleDownloadQR}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Сохранить QR код
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
