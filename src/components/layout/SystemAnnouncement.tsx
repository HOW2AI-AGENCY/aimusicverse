import { useState, useEffect } from 'react';
import { X, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'beta';
  dismissible: boolean;
  expiresAt?: Date;
}

// Hardcoded announcements for beta testing phase
const BETA_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'light-theme-dec-2024',
    title: '☀️ Светлая тема доступна!',
    message: 'Теперь вы можете выбрать светлую тему оформления! Перейдите в Настройки → Тема или используйте переключатель в шапке. Тема автоматически синхронизируется с Telegram.',
    type: 'success',
    dismissible: true,
  },
  {
    id: 'lyrics-assistant-v2-dec-2024',
    title: '🎤 Улучшенный AI Lyrics Assistant!',
    message: 'Теперь помощник написания текстов возвращает профессионально оформленные тексты с тегами Suno V5, автоматически определяет название и стиль песни. Добавлены 18 быстрых действий для создания и улучшения текстов одним кликом!',
    type: 'success',
    dismissible: true,
  },
  {
    id: 'beta-testing-v1',
    title: '🎵 Добро пожаловать в бета-тестирование!',
    message: 'Мы рады видеть вас в MusicVerse AI! Это бета-версия — возможны ошибки и сбои. Ваша обратная связь поможет нам улучшить платформу.',
    type: 'beta',
    dismissible: true,
  },
];

export function SystemAnnouncement() {
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed-announcements') || '[]');
    
    // Filter out dismissed and expired announcements
    const now = new Date();
    const active = BETA_ANNOUNCEMENTS.filter(announcement => {
      const isDismissed = dismissedIds.includes(announcement.id);
      const isExpired = announcement.expiresAt && announcement.expiresAt < now;
      return !isDismissed && !isExpired;
    });

    setVisibleAnnouncements(active);
  }, []);

  const handleDismiss = (announcementId: string) => {
    // Save to localStorage
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed-announcements') || '[]');
    if (!dismissedIds.includes(announcementId)) {
      dismissedIds.push(announcementId);
      localStorage.setItem('dismissed-announcements', JSON.stringify(dismissedIds));
    }

    // Remove from visible list
    setVisibleAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 px-4 pt-4">
      {visibleAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          className={cn(
            'relative border-l-4 p-4 shadow-md animate-in slide-in-from-top',
            announcement.type === 'beta' && 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
            announcement.type === 'info' && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
            announcement.type === 'warning' && 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
            announcement.type === 'success' && 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {announcement.type === 'beta' ? (
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {announcement.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {announcement.message}
              </p>
            </div>

            {announcement.dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8 hover:bg-background/50"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Закрыть</span>
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
