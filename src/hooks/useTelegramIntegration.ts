import { useTelegram } from "@/contexts/TelegramContext";
import { useNotificationHub } from "@/contexts/NotificationContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { TELEGRAM_BOT_USERNAME, getTrackDeepLink } from "@/lib/telegram";
import type { TelegramWebApp } from "@/types/telegram";

const log = logger.child({ module: "TelegramIntegration" });

// Telegram WebApp extras not in the standard TelegramWebApp type
// - addToHomeScreen (Android v6.4+, iOS soon)
// - shareURL (deprecated 7.x but kept for fallback)
// - shareToStory (v7.x+)
type TelegramWebAppExtras = TelegramWebApp & {
  addToHomeScreen?: () => void;
  shareURL?: (url: string, text?: string) => void;
  shareToStory?: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
};

interface UseTelegramIntegrationReturn {
  // Music on Profile
  setMusicOnProfile: (trackId: string) => Promise<boolean>;
  removeMusicFromProfile: () => Promise<boolean>;

  // Shortcuts
  addHomeScreenShortcut: (type: "generate" | "library" | "studio") => void;

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
      notify.error("Telegram не доступен", { dedupe: true, dedupeKey: "tg-unavailable" });
      return false;
    }

    try {
      // Call edge function to set music on profile
      const { data, error } = await supabase.functions.invoke("set-music-profile", {
        body: { trackId, action: "set" },
      });

      if (error) throw error;

      notify.success("Трек добавлен на профиль!");
      log.info("Music set on profile", { trackId });
      return true;
    } catch (error) {
      log.error("Failed to set music on profile", { error: String(error) });
      notify.error("Не удалось добавить трек на профиль");
      return false;
    }
  };

  const removeMusicFromProfile = async (): Promise<boolean> => {
    if (!webApp || !user?.id) {
      notify.error("Telegram не доступен", { dedupe: true, dedupeKey: "tg-unavailable" });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("set-music-profile", {
        body: { action: "remove" },
      });

      if (error) throw error;

      notify.success("Трек удален с профиля");
      return true;
    } catch (error) {
      log.error("Failed to remove music from profile", { error: String(error) });
      notify.error("Не удалось удалить трек с профиля");
      return false;
    }
  };

  const addHomeScreenShortcut = (type: "generate" | "library" | "studio") => {
    if (!webApp) {
      notify.error("Доступно только в Telegram", { dedupe: true, dedupeKey: "tg-only" });
      return;
    }

    const shortcuts = {
      generate: { name: "Создать трек", path: "/generate" },
      library: { name: "Библиотека", path: "/library" },
      studio: { name: "Студия", path: "/studio-v2" },
    };

    const shortcut = shortcuts[type];

    // Use Telegram's addToHomeScreen if available
    const extras = webApp as TelegramWebAppExtras;
    if (extras.addToHomeScreen) {
      extras.addToHomeScreen();
      notify.success(`Ярлык "${shortcut.name}" добавлен`, { dedupe: true, dedupeKey: "home-shortcut" });
    } else {
      notify.info("Добавьте приложение на главный экран через меню браузера", {
        dedupe: true,
        dedupeKey: "home-shortcut-fallback",
      });
    }
  };

  const shareToTelegram = (trackId: string, trackTitle: string) => {
    const extras = webApp as TelegramWebAppExtras;
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
        notify.success("Ссылка скопирована!", { dedupe: true, dedupeKey: "link-copied" });
      }
      return;
    }

    // Use Telegram's share
    const deepLink = getTrackDeepLink(trackId);

    if (extras.shareURL) {
      extras.shareURL(deepLink, `Послушай мой трек "${trackTitle}"!`);
    } else if (webApp.openTelegramLink) {
      webApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(`Послушай мой трек "${trackTitle}"!`)}`,
      );
    }
  };

  const shareToStory = async (trackId: string, coverUrl: string): Promise<boolean> => {
    const extras = webApp as TelegramWebAppExtras;
    if (!webApp || !extras.shareToStory) {
      notify.error("Истории доступны только в Telegram", { dedupe: true, dedupeKey: "stories-tg-only" });
      return false;
    }

    try {
      extras.shareToStory(coverUrl, {
        text: "Создано в MusicVerse 🎵",
        widget_link: {
          url: getTrackDeepLink(trackId),
          name: "Послушать трек",
        },
      });

      notify.success("Открыт редактор историй");
      return true;
    } catch (error) {
      log.error("Failed to share to story", { error: String(error) });
      notify.error("Не удалось поделиться в историю");
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
    log.debug("Synced notification read status", { count: notificationIds.length });
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
