/**
 * Profile Emoji Picker for Telegram Premium users
 * Allows setting custom emoji status via Telegram Mini App API
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Crown, Sparkles, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Popular music-themed emoji IDs
// Note: These are custom emoji IDs that need to be available in Telegram
// For now we use unicode emojis but the API needs custom emoji document IDs
const MUSIC_EMOJIS = [
  { emoji: '🎵', name: 'Нота', id: '5368324170671202286' },
  { emoji: '🎶', name: 'Ноты', id: '5368324170671202287' },
  { emoji: '🎤', name: 'Микрофон', id: '5368324170671202288' },
  { emoji: '🎸', name: 'Гитара', id: '5368324170671202289' },
  { emoji: '🎹', name: 'Клавиши', id: '5368324170671202290' },
  { emoji: '🎧', name: 'Наушники', id: '5368324170671202291' },
  { emoji: '🎷', name: 'Саксофон', id: '5368324170671202292' },
  { emoji: '🎺', name: 'Труба', id: '5368324170671202293' },
  { emoji: '🥁', name: 'Барабаны', id: '5368324170671202294' },
  { emoji: '🪘', name: 'Джембе', id: '5368324170671202295' },
];

const MOOD_EMOJIS = [
  { emoji: '🔥', name: 'Огонь', id: '5368324170671202296' },
  { emoji: '✨', name: 'Искры', id: '5368324170671202297' },
  { emoji: '💫', name: 'Звезда', id: '5368324170671202298' },
  { emoji: '🌟', name: 'Сияние', id: '5368324170671202299' },
  { emoji: '💜', name: 'Любовь', id: '5368324170671202300' },
  { emoji: '🎯', name: 'Цель', id: '5368324170671202301' },
  { emoji: '🚀', name: 'Ракета', id: '5368324170671202302' },
  { emoji: '⚡', name: 'Молния', id: '5368324170671202303' },
  { emoji: '🌈', name: 'Радуга', id: '5368324170671202304' },
  { emoji: '🎪', name: 'Цирк', id: '5368324170671202305' },
];

const STATUS_EMOJIS = [
  { emoji: '🎼', name: 'Композитор', id: '5368324170671202306' },
  { emoji: '🎻', name: 'Скрипач', id: '5368324170671202307' },
  { emoji: '🪗', name: 'Аккордеон', id: '5368324170671202308' },
  { emoji: '🎚️', name: 'Микшер', id: '5368324170671202309' },
  { emoji: '🎛️', name: 'Пульт', id: '5368324170671202310' },
  { emoji: '📀', name: 'Диск', id: '5368324170671202311' },
  { emoji: '💿', name: 'CD', id: '5368324170671202312' },
  { emoji: '🎙️', name: 'Студия', id: '5368324170671202313' },
  { emoji: '📻', name: 'Радио', id: '5368324170671202314' },
  { emoji: '🔊', name: 'Звук', id: '5368324170671202315' },
];

interface ProfileEmojiPickerProps {
  onUpgrade?: () => void;
}

export function ProfileEmojiPicker({ onUpgrade }: ProfileEmojiPickerProps) {
  const webApp = (window as any).Telegram?.WebApp;
  const isTelegram = !!webApp;
  
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSettingEmoji, setIsSettingEmoji] = useState(false);
  const [activeTab, setActiveTab] = useState<'music' | 'mood' | 'status'>('music');

  const emojiCategories = {
    music: MUSIC_EMOJIS,
    mood: MOOD_EMOJIS,
    status: STATUS_EMOJIS,
  };

  // Check if emoji status API is available (only on Telegram Premium)
  const isEmojiStatusAvailable = isTelegram && typeof webApp?.setEmojiStatus === 'function';
  
  // Check if user has Telegram Premium
  const isTelegramPremium = isTelegram && webApp?.initDataUnsafe?.user?.is_premium;

  // Request access to emoji status
  const requestAccess = useCallback(async () => {
    if (!webApp?.requestEmojiStatusAccess) {
      toast.error('Функция недоступна', {
        description: 'Требуется Telegram Premium',
      });
      return;
    }

    setIsRequesting(true);

    // Haptic feedback
    webApp?.HapticFeedback?.impactOccurred?.('medium');

    webApp.requestEmojiStatusAccess((granted: boolean) => {
      setHasAccess(granted);
      setIsRequesting(false);

      if (granted) {
        toast.success('Доступ получен!', {
          description: 'Теперь вы можете установить эмодзи статус',
        });
        webApp?.HapticFeedback?.notificationOccurred?.('success');
      } else {
        toast.error('Доступ не предоставлен', {
          description: 'Разрешите доступ в настройках Telegram',
        });
        webApp?.HapticFeedback?.notificationOccurred?.('error');
      }
    });
  }, [webApp]);

  // Set emoji status
  const setEmojiStatus = useCallback(
    (emojiId: string, emoji: string) => {
      if (!webApp?.setEmojiStatus) {
        toast.error('Функция недоступна');
        return;
      }

      if (!hasAccess) {
        requestAccess();
        return;
      }

      setIsSettingEmoji(true);
      webApp?.HapticFeedback?.impactOccurred?.('light');

      // Set emoji status for 1 hour (3600 seconds)
      webApp.setEmojiStatus(emojiId, { duration: 3600 }, (success: boolean) => {
        setIsSettingEmoji(false);

        if (success) {
          setSelectedEmoji(emoji);
          toast.success(`Статус ${emoji} установлен!`, {
            description: 'Действует 1 час',
          });
          webApp?.HapticFeedback?.notificationOccurred?.('success');
        } else {
          toast.error('Не удалось установить статус', {
            description: 'Попробуйте другой эмодзи',
          });
          webApp?.HapticFeedback?.notificationOccurred?.('error');
        }
      });
    },
    [webApp, hasAccess, requestAccess]
  );

  // Clear emoji status
  const clearEmojiStatus = useCallback(() => {
    if (!webApp?.setEmojiStatus) return;

    webApp.setEmojiStatus('', undefined, (success: boolean) => {
      if (success) {
        setSelectedEmoji(null);
        toast.success('Статус сброшен');
        webApp?.HapticFeedback?.impactOccurred?.('light');
      }
    });
  }, [webApp]);

  // Not in Telegram or no emoji status support
  if (!isTelegram || !isEmojiStatusAvailable) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Эмодзи статус</CardTitle>
          </div>
          <CardDescription>
            Доступно только в Telegram для Premium пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Lock className="h-8 w-8 mr-2 opacity-50" />
            <span>Откройте в Telegram Mini App</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not Telegram Premium user - show upgrade prompt
  if (!isTelegramPremium) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Эмодзи статус</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Telegram Premium
            </Badge>
          </div>
          <CardDescription>
            Установите музыкальный эмодзи как статус профиля Telegram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎵</div>
            <p className="text-sm text-muted-foreground mb-4">
              Эта функция доступна для Telegram Premium подписчиков
            </p>
            {onUpgrade && (
              <Button onClick={onUpgrade} size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Перейти на Premium
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Эмодзи статус</CardTitle>
          </div>
          {selectedEmoji && (
            <Button variant="ghost" size="sm" onClick={clearEmojiStatus} className="h-7 px-2">
              Сбросить
            </Button>
          )}
        </div>
        <CardDescription>
          Установите музыкальный эмодзи как статус профиля
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Access request */}
        {!hasAccess && (
          <Button
            onClick={requestAccess}
            disabled={isRequesting}
            className="w-full gap-2"
            variant="outline"
          >
            {isRequesting ? (
              <>Запрашиваю доступ...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Разрешить установку статуса
              </>
            )}
          </Button>
        )}

        {/* Category tabs */}
        {hasAccess && (
          <>
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
              {(['music', 'mood', 'status'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors',
                    activeTab === tab
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'music' && '🎵 Музыка'}
                  {tab === 'mood' && '✨ Настроение'}
                  {tab === 'status' && '🎼 Статус'}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-5 gap-2"
              >
                {emojiCategories[activeTab].map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEmojiStatus(item.id, item.emoji)}
                    disabled={isSettingEmoji}
                    className={cn(
                      'relative aspect-square rounded-lg flex items-center justify-center text-2xl',
                      'bg-muted/50 hover:bg-muted transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      selectedEmoji === item.emoji && 'ring-2 ring-primary bg-primary/10'
                    )}
                    title={item.name}
                  >
                    {item.emoji}
                    {selectedEmoji === item.emoji && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>

            <p className="text-xs text-center text-muted-foreground">
              Статус будет виден в вашем профиле Telegram в течение 1 часа
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
