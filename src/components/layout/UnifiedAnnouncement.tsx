/**
 * Unified Announcement Component
 * Shows one announcement at a time with queue indicator
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Info, Sparkles, AlertTriangle, CheckCircle, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAnnouncements, AnnouncementType, Announcement } from '@/contexts/AnnouncementContext';
import { useTelegram } from '@/contexts/TelegramContext';

// Default announcements that should be shown to users
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'light-theme-dec-2024',
    title: '☀️ Светлая тема доступна!',
    message: 'Выберите тему в Настройках или переключателем в шапке',
    type: 'feature',
    priority: 'normal',
    dismissible: true,
    autoDismissMs: 8000,
  },
  {
    id: 'beta-testing-v1',
    title: '🎵 Добро пожаловать!',
    message: 'Это бета-версия — ваша обратная связь поможет нам улучшить платформу',
    type: 'beta',
    priority: 'low',
    dismissible: true,
    autoDismissMs: 10000,
  },
];

const typeConfig: Record<AnnouncementType, { 
  icon: typeof Info; 
  borderColor: string; 
  bgColor: string;
  iconColor: string;
}> = {
  info: {
    icon: Info,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    iconColor: 'text-yellow-500',
  },
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    iconColor: 'text-green-500',
  },
  beta: {
    icon: Sparkles,
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    iconColor: 'text-purple-500',
  },
  feature: {
    icon: Sparkles,
    borderColor: 'border-l-primary',
    bgColor: 'bg-primary/5',
    iconColor: 'text-primary',
  },
  system: {
    icon: Bell,
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    iconColor: 'text-orange-500',
  },
};

export function UnifiedAnnouncement() {
  const { 
    currentAnnouncement, 
    queueLength, 
    dismissCurrent, 
    dismissAll, 
    addAnnouncement,
    wasDismissed,
    isPaused,
  } = useAnnouncements();
  const { hapticFeedback } = useTelegram();

  // Add default announcements on mount (if not dismissed)
  useEffect(() => {
    DEFAULT_ANNOUNCEMENTS.forEach((announcement) => {
      if (!wasDismissed(announcement.id)) {
        // Stagger adding announcements
        setTimeout(() => {
          addAnnouncement(announcement);
        }, DEFAULT_ANNOUNCEMENTS.indexOf(announcement) * 500);
      }
    });
  }, [addAnnouncement, wasDismissed]);

  const handleDismiss = () => {
    hapticFeedback('light');
    dismissCurrent();
  };

  const handleDismissAll = () => {
    hapticFeedback('medium');
    dismissAll();
  };

  const handleAction = () => {
    if (currentAnnouncement?.action) {
      hapticFeedback('light');
      currentAnnouncement.action.onClick();
      dismissCurrent();
    }
  };

  if (!currentAnnouncement || isPaused) {
    return null;
  }

  const config = typeConfig[currentAnnouncement.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="px-4 pt-3 pb-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnnouncement.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            className={cn(
              'relative border-l-4 p-3 shadow-md',
              config.borderColor,
              config.bgColor
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {currentAnnouncement.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-snug">
                  {currentAnnouncement.message}
                </p>

                {/* Action button */}
                {currentAnnouncement.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary"
                    onClick={handleAction}
                  >
                    {currentAnnouncement.action.label}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Queue indicator */}
                {queueLength > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    +{queueLength}
                  </span>
                )}

                {/* Dismiss all (if queue) */}
                {queueLength > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleDismissAll}
                  >
                    Скрыть все
                  </Button>
                )}

                {/* Dismiss current */}
                {currentAnnouncement.dismissible !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-background/50"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Закрыть</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
