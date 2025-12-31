import { useTelegram } from '@/contexts/TelegramContext';
import { useNotificationHub } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TelegramIntegration' });

interface UseTelegramIntegrationReturn {
  // Music on Profile
  setMusicOnProfile: (trackId: string) => Promise<boolean>;
  removeMusicFromProfile: () => Promise<boolean>;
  
  // Shortcuts
  addHomeScreenShortcut: (type: 'generate' | 'library' | 'studio') => void;
  
  // Sharing
  shareToTelegram: (trackId: string, trackTitle: string) => void;
  shareToStory: (trackId: string, coverUrl: string) => Promise<boolean>;
  
  // Sync
  syncNotificationsRead: (notificationIds: string[]) => Promise<void>;
  
  // Status
  isTelegramAvailable: boolean;
  platform: string;
}

export function useTelegramIntegration(): UseTelegramIntegrationReturn {
  const { webApp, platform, isInitialized } = useTelegram();
  const { user } = useAuth();
  const { markAsRead } = useNotificationHub();

  const isTelegramAvailable = isInitialized && !!webApp;

  const setMusicOnProfile = async (trackId: string): Promise<boolean> => {
    if (!webApp || !user?.id) {
      toast.error('Telegram не доступен');
      return false;
    }

    try {
      // Call edge function to set music on profile
      const { data, error } = await supabase.functions.invoke('set-music-profile', {
        body: { trackId, action: 'set' }
      });

      if (error) throw error;

      toast.success('Трек добавлен на профиль!');
      log.info('Music set on profile', { trackId });
      return true;
    } catch (error) {
      log.error('Failed to set music on profile', { error: String(error) });
      toast.error('Не удалось добавить трек на профиль');
      return false;
    }
  };

  const removeMusicFromProfile = async (): Promise<boolean> => {
    if (!webApp || !user?.id) {
      toast.error('Telegram не доступен');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('set-music-profile', {
        body: { action: 'remove' }
      });

      if (error) throw error;

      toast.success('Трек удален с профиля');
      return true;
    } catch (error) {
      log.error('Failed to remove music from profile', { error: String(error) });
      toast.error('Не удалось удалить трек с профиля');
      return false;
    }
  };

  const addHomeScreenShortcut = (type: 'generate' | 'library' | 'studio') => {
    if (!webApp) {
      toast.error('Доступно только в Telegram');
      return;
    }

    const shortcuts = {
      generate: { name: 'Создать трек', path: '/generate' },
      library: { name: 'Библиотека', path: '/library' },
      studio: { name: 'Студия', path: '/studio-v2' },
    };

    const shortcut = shortcuts[type];
    
    // Use Telegram's addToHomeScreen if available
    if ((webApp as any).addToHomeScreen) {
      (webApp as any).addToHomeScreen();
      toast.success(`Ярлык "${shortcut.name}" добавлен`);
    } else {
      toast.info('Добавьте приложение на главный экран через меню браузера');
    }
  };

  const shareToTelegram = (trackId: string, trackTitle: string) => {
    if (!webApp) {
      // Fallback to web share
      const url = `${window.location.origin}/library?track=${trackId}`;
      if (navigator.share) {
        navigator.share({
          title: trackTitle,
          text: `Послушай мой трек "${trackTitle}" созданный в MusicVerse!`,
          url,
        });
      } else {
        navigator.clipboard.writeText(url);
        toast.success('Ссылка скопирована!');
      }
      return;
    }

    // Use Telegram's share
    const botUsername = 'AIMusicVerseBot';
    const deepLink = `https://t.me/${botUsername}?start=track_${trackId}`;
    
    if ((webApp as any).shareURL) {
      (webApp as any).shareURL(deepLink, `Послушай мой трек "${trackTitle}"!`);
    } else if (webApp.openTelegramLink) {
      webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(`Послушай мой трек "${trackTitle}"!`)}`);
    }
  };

  const shareToStory = async (trackId: string, coverUrl: string): Promise<boolean> => {
    if (!webApp || !(webApp as any).shareToStory) {
      toast.error('Истории доступны только в Telegram');
      return false;
    }

    try {
      (webApp as any).shareToStory(coverUrl, {
        text: 'Создано в MusicVerse 🎵',
        widget_link: {
          url: `https://t.me/AIMusicVerseBot?start=track_${trackId}`,
          name: 'Послушать трек'
        }
      });
      
      toast.success('Открыт редактор историй');
      return true;
    } catch (error) {
      log.error('Failed to share to story', { error: String(error) });
      toast.error('Не удалось поделиться в историю');
      return false;
    }
  };

  const syncNotificationsRead = async (notificationIds: string[]) => {
    // Mark notifications as read both locally and sync to Telegram
    for (const id of notificationIds) {
      await markAsRead(id);
    }
    
    // If we have Telegram WebApp, we could sync this state
    // For now, notifications are already synced via database
    log.debug('Synced notification read status', { count: notificationIds.length });
  };

  return {
    setMusicOnProfile,
    removeMusicFromProfile,
    addHomeScreenShortcut,
    shareToTelegram,
    shareToStory,
    syncNotificationsRead,
    isTelegramAvailable,
    platform,
  };
}
