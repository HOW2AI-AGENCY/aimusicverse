/**
 * Unified Announcement Component
 * Shows one announcement at a time with queue indicator
 * z-index: 100 (System Notifications layer per Z_INDEX_HIERARCHY.md)
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Info, Sparkles, AlertTriangle, CheckCircle, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAnnouncements, AnnouncementType, Announcement } from '@/contexts/AnnouncementContext';
import { useTelegram } from '@/contexts/TelegramContext';

// Default announcements that should be shown to users
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'light-theme-dec-2024',
    title: 'Светлая тема доступна!',
    message: 'Выберите тему в Настройках или переключателем в шапке',
    type: 'feature',
    priority: 'normal',
    dismissible: true,
    autoDismissMs: 8000,
  },
  {
    id: 'beta-testing-v1',
    title: 'Добро пожаловать!',
    message: 'Это бета-версия — ваша обратная связь поможет нам улучшить платформу',
    type: 'beta',
    priority: 'low',
    dismissible: true,
    autoDismissMs: 10000,
  },
];

const typeConfig: Record<AnnouncementType, { 
  icon: typeof Info; 
  gradient: string;
  iconBg: string;
  iconColor: string;
}> = {
  info: {
    icon: Info,
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500',
  },
  success: {
    icon: CheckCircle,
    gradient: 'from-green-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-500',
  },
  beta: {
    icon: Sparkles,
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
  },
  feature: {
    icon: Sparkles,
    gradient: 'from-primary/10 via-primary/5 to-transparent',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
  },
  system: {
    icon: Bell,
    gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
    iconBg: 'bg-orange-500/20',
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
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Add default announcements on mount (if not dismissed)
  useEffect(() => {
    DEFAULT_ANNOUNCEMENTS.forEach((announcement, index) => {
      if (!wasDismissed(announcement.id)) {
        setTimeout(() => {
          addAnnouncement(announcement);
        }, index * 500);
      }
    });
  }, [addAnnouncement, wasDismissed]);

  // Progress bar for auto-dismiss
  useEffect(() => {
    if (!currentAnnouncement?.autoDismissMs) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const totalTime = currentAnnouncement.autoDismissMs;
    const interval = 50; // Update every 50ms for smooth animation
    const decrement = (interval / totalTime) * 100;

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - decrement));
    }, interval);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [currentAnnouncement?.id, currentAnnouncement?.autoDismissMs]);

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
    <div className="sticky top-0 z-[100] w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnnouncement.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="relative"
        >
          {/* Glass container */}
          <div
            className={cn(
              'relative overflow-hidden',
              'mx-3 mt-3 rounded-xl',
              'bg-card/80 backdrop-blur-xl',
              'border border-border/50',
              'shadow-lg shadow-black/5 dark:shadow-black/20'
            )}
          >
            {/* Gradient overlay */}
            <div 
              className={cn(
                'absolute inset-0 bg-gradient-to-r pointer-events-none',
                config.gradient
              )}
            />

            {/* Progress bar */}
            {currentAnnouncement.autoDismissMs && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30">
                <motion.div
                  className={cn('h-full', config.iconColor.replace('text-', 'bg-'))}
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                />
              </div>
            )}

            {/* Content */}
            <div className="relative px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div 
                  className={cn(
                    'flex-shrink-0 rounded-lg p-1.5',
                    config.iconBg
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.iconColor)} />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-sm font-medium text-foreground leading-tight">
                    {currentAnnouncement.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {currentAnnouncement.message}
                  </p>

                  {/* Action button */}
                  {currentAnnouncement.action && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-medium mt-1"
                      onClick={handleAction}
                    >
                      {currentAnnouncement.action.label}
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Queue indicator + dismiss all */}
                  {queueLength > 0 && (
                    <button
                      onClick={handleDismissAll}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md',
                        'text-[10px] font-medium text-muted-foreground',
                        'bg-muted/50 hover:bg-muted',
                        'transition-colors'
                      )}
                    >
                      <span className="tabular-nums">+{queueLength}</span>
                      <span className="hidden sm:inline">• Скрыть все</span>
                    </button>
                  )}

                  {/* Dismiss current */}
                  {currentAnnouncement.dismissible !== false && (
                    <button
                      onClick={handleDismiss}
                      className={cn(
                        'p-1.5 rounded-md',
                        'text-muted-foreground hover:text-foreground',
                        'hover:bg-muted/50',
                        'transition-colors'
                      )}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Закрыть</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
