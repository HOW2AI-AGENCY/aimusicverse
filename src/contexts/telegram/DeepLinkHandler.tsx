/**
 * DeepLink Handler Component
 * 
 * Handles Telegram deep linking and navigation.
 * Extracted from TelegramContext.tsx for modularity.
 * 
 * @module contexts/telegram/DeepLinkHandler
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { useTelegram } from './TelegramProvider';

const telegramLogger = logger.child({ module: 'DeepLinkHandler' });

// Deep link route patterns with analytics type
const DEEP_LINK_ROUTES: [RegExp | string, (match: RegExpMatchArray | null) => string, string][] = [
  // Content deep links
  [/^track_(.+)$/, (m) => `/library?track=${m![1]}`, 'track'],
  [/^project_(.+)$/, (m) => `/projects/${m![1]}`, 'project'],
  [/^artist_(.+)$/, (m) => `/artists/${m![1]}`, 'artist'],
  [/^playlist_(.+)$/, (m) => `/playlists/${m![1]}`, 'playlist'],
  [/^album_(.+)$/, (m) => `/album/${m![1]}`, 'album'],
  [/^blog_(.+)$/, (m) => `/blog/${m![1]}`, 'blog'],
  
  // Player deep links
  [/^play_(.+)$/, (m) => `/player/${m![1]}`, 'play'],
  [/^player_(.+)$/, (m) => `/player/${m![1]}`, 'player'],
  [/^listen_(.+)$/, (m) => `/player/${m![1]}`, 'listen'],
  
  // Generation deep links - navigate to home with state
  [/^generate_(.+)$/, (m) => `/?style=${m![1]}`, 'generate'],
  [/^quick_(.+)$/, (m) => `/?style=${m![1]}&quick=true`, 'quick'],
  [/^remix_(.+)$/, (m) => `/?remix=${m![1]}`, 'remix'],
  
  // Vocal/Instrumental deep links
  [/^vocals_(.+)$/, (m) => `/library?track=${m![1]}&action=add_vocals`, 'add_vocals'],
  [/^instrumental_(.+)$/, (m) => `/library?track=${m![1]}&action=add_instrumental`, 'add_instrumental'],
  [/^extend_(.+)$/, (m) => `/library?track=${m![1]}&action=extend`, 'extend'],
  [/^cover_(.+)$/, (m) => `/library?track=${m![1]}&action=cover`, 'cover'],
  
  // Studio deep links
  [/^studio_ref_(.+)$/, (m) => `/content-hub?tab=cloud&ref=${m![1]}`, 'studio_ref'],
  [/^studio_(.+)$/, (m) => `/studio-v2/track/${m![1]}`, 'studio'],
  
  // Track views
  [/^lyrics_(.+)$/, (m) => `/library?track=${m![1]}&view=lyrics`, 'lyrics'],
  [/^stats_(.+)$/, (m) => `/library?track=${m![1]}&view=stats`, 'stats'],
  [/^share_(.+)$/, (m) => `/library?track=${m![1]}`, 'share'],
  
  // Profile deep links
  [/^user_(.+)$/, (m) => `/profile/${m![1]}`, 'profile'],
  [/^profile_(.+)$/, (m) => `/profile/${m![1]}`, 'profile'],
  
  // Referral deep links
  [/^invite_(.+)$/, (m) => `/?ref=${m![1]}`, 'invite'],
  [/^ref_(.+)$/, (m) => `/?ref=${m![1]}`, 'referral'],
  
  // Simple routes
  ['buy', () => '/buy-credits', 'buy'],
  ['credits', () => '/buy-credits', 'credits'],
  ['subscribe', () => '/buy-credits?tab=subscriptions', 'subscribe'],
  ['subscription', () => '/subscription', 'subscription'],
  ['leaderboard', () => '/rewards?tab=leaderboard', 'leaderboard'],
  ['achievements', () => '/rewards?tab=achievements', 'achievements'],
  ['analyze', () => '/?analyze=true', 'analyze'],
  ['recognize', () => '/?recognize=true', 'recognize'],
  ['shazam', () => '/?recognize=true', 'shazam'],
  ['settings', () => '/settings', 'settings'],
  ['help', () => '/settings', 'help'],
  ['onboarding', () => '/onboarding', 'onboarding'],
  ['library', () => '/library', 'library'],
  ['projects', () => '/projects', 'projects'],
  ['artists', () => '/artists', 'artists'],
  ['creative', () => '/music-lab', 'creative'],
  ['musiclab', () => '/music-lab', 'musiclab'],
  ['drums', () => '/music-lab?tab=drums', 'drums'],
  ['dj', () => '/music-lab?tab=dj', 'dj'],
  ['guitar', () => '/music-lab?tab=guitar', 'guitar'],
  ['melody', () => '/music-lab?tab=melody', 'melody'],
  ['channel', () => '/', 'channel'],
  ['news', () => '/blog', 'news'],
  ['rewards', () => '/rewards', 'rewards'],
  ['community', () => '/community', 'community'],
  ['playlists', () => '/playlists', 'playlists'],
  ['content-hub', () => '/projects', 'content_hub'],
  ['cloud', () => '/projects?tab=cloud', 'cloud'],
  ['lyrics', () => '/projects?tab=lyrics', 'lyrics'],
  ['templates', () => '/templates', 'templates'],
  ['pricing', () => '/pricing', 'pricing'],
  ['tariffs', () => '/pricing', 'tariffs'],
  ['shop', () => '/pricing', 'shop'],
  ['profile', () => '/profile', 'profile'],
  ['analytics', () => '/analytics', 'analytics'],
  ['admin', () => '/admin', 'admin'],
  ['feedback', () => '/admin/feedback', 'feedback'],
];

// User-friendly descriptions for deep links
const DEEP_LINK_DESCRIPTIONS: Record<string, string> = {
  track: 'Открываем трек',
  project: 'Открываем проект',
  artist: 'Открываем артиста',
  playlist: 'Открываем плейлист',
  album: 'Открываем альбом',
  blog: 'Открываем статью',
  generate: 'Создание трека',
  quick: 'Быстрое создание',
  remix: 'Создание ремикса',
  vocals: 'Добавление вокала',
  instrumental: 'Создание инструментала',
  extend: 'Расширение трека',
  cover: 'Создание кавера',
  studio: 'Открываем студию',
  lyrics: 'Просмотр текста',
  stats: 'Просмотр статистики',
  share: 'Просмотр трека',
  profile: 'Открываем профиль',
  invite: 'Реферальная ссылка',
  referral: 'Реферальная ссылка',
  buy: 'Покупка кредитов',
  credits: 'Покупка кредитов',
  subscribe: 'Оформление подписки',
  subscription: 'Управление подпиской',
  library: 'Библиотека треков',
  projects: 'Мои проекты',
  artists: 'Артисты',
  community: 'Сообщество',
  playlists: 'Плейлисты',
  settings: 'Настройки',
  help: 'Помощь',
};

function getDeepLinkDescription(type: string): string {
  return DEEP_LINK_DESCRIPTIONS[type] || 'Обработка ссылки...';
}

export const DeepLinkHandler = () => {
  const navigate = useNavigate();
  const { webApp, user, hapticFeedback } = useTelegram();
  const [, setIsProcessing] = useState(false);

  useEffect(() => {
    const startParam = webApp?.initDataUnsafe?.start_param;
    if (!startParam) return;

    // Prevent re-processing deep links
    const processedKey = `deeplink_processed_${startParam}`;
    if (sessionStorage.getItem(processedKey)) {
      telegramLogger.debug('Deep link already processed', { startParam });
      return;
    }
    sessionStorage.setItem(processedKey, 'true');

    telegramLogger.debug('Processing deep link', { startParam });
    setIsProcessing(true);
    hapticFeedback('light');

    // Track analytics
    const trackDeepLink = async (type: string, value: string, converted: boolean = true) => {
      try {
        const sessionId = sessionStorage.getItem('deeplink_session_id') || 
          `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('deeplink_session_id', sessionId);

        const { data: { user: authUser } } = await supabase.auth.getUser();

        await supabase.from('deeplink_analytics').insert({
          deeplink_type: type,
          deeplink_value: value || null,
          user_id: authUser?.id || null,
          session_id: sessionId,
          converted,
          source: 'telegram_miniapp',
          referrer: document.referrer || null,
          metadata: {
            platform: webApp?.platform,
            version: webApp?.version,
            telegram_id: user?.telegram_id,
          },
        });
        telegramLogger.debug('Deeplink tracked', { type, value, converted });
      } catch (e) {
        telegramLogger.debug('Failed to track deeplink', { error: String(e) });
      }
    };

    // Try to match routes
    for (const [pattern, getPath, analyticsType] of DEEP_LINK_ROUTES) {
      if (typeof pattern === 'string') {
        if (startParam === pattern) {
          trackDeepLink(analyticsType, startParam);
          
          toast.info('Переход по ссылке', {
            description: getDeepLinkDescription(analyticsType),
            duration: 2000,
          });
          
          setTimeout(() => {
            navigate(getPath(null));
            setIsProcessing(false);
          }, 200);
          return;
        }
      } else {
        const match = startParam.match(pattern);
        if (match) {
          trackDeepLink(analyticsType, match[1] || startParam);
          
          toast.info('Переход по ссылке', {
            description: getDeepLinkDescription(analyticsType),
            duration: 2000,
          });
          
          setTimeout(() => {
            navigate(getPath(match));
            setIsProcessing(false);
          }, 200);
          return;
        }
      }
    }

    // Fallback: unknown deep link
    trackDeepLink('unknown', startParam, false);
    telegramLogger.warn('Unknown deep link', { startParam });
    
    toast.error('Неизвестная ссылка', {
      description: 'Ссылка не распознана',
      duration: 3000,
    });
    setIsProcessing(false);
  }, [webApp?.initDataUnsafe?.start_param, navigate, webApp?.platform, webApp?.version, user?.telegram_id, hapticFeedback]);

  return null;
};
