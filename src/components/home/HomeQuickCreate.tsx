/**
 * HomeQuickCreate - Simplified quick create section with FAB trigger
 * Feature: 001-mobile-ui-redesign
 *
 * A minimalist quick create section that provides the primary "Create" action
 * accessible within one tap via the FAB, with an optional expanded prompt input.
 */

import { memo, useCallback, useState } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { Button } from '@/components/ui/button';
import { OnboardingTooltip } from '@/components/onboarding';


interface HomeQuickCreateProps {
  onCreateClick: () => void;
  className?: string;
}

export const HomeQuickCreate = memo(function HomeQuickCreate({
  onCreateClick,
  className,
}: HomeQuickCreateProps) {
  const { hapticFeedback } = useTelegram();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreate = useCallback(() => {
    hapticFeedback('medium');
    onCreateClick();
  }, [hapticFeedback, onCreateClick]);

  const handleExpand = useCallback(() => {
    hapticFeedback('light');
    setIsExpanded(!isExpanded);
  }, [hapticFeedback, isExpanded]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent",
        "border border-primary/20",
        "p-4 sm:p-5",
        className
      )}
    >
      {/* Background decoration - simplified */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-generate/10 to-transparent rounded-full blur-xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with improved visual hierarchy */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                Создать музыку
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                AI сгенерирует трек за минуту
              </p>
            </div>
          </div>
          {/* Free credits badge - enhanced */}
          <motion.span 
            className="px-2 py-1 text-[10px] sm:text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full border border-green-500/30 whitespace-nowrap"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ 5 бесплатных
          </motion.span>
        </div>

        {/* FAB - Primary action */}
        <div className="flex items-center gap-3">
          <OnboardingTooltip
            id="quick-create-first"
            title="Создайте первый трек"
            content="Нажмите кнопку, опишите музыку словами — AI создаст трек за минуту. Это бесплатно!"
            actionLabel="Попробовать"
            onAction={handleCreate}
            position="top"
            delay={1000}
            autoHideAfter={15000}
          >
            <Button
              onClick={handleCreate}
              className={cn(
                "flex-1 h-12 min-h-touch",
                "bg-gradient-to-r from-primary to-generate",
                "text-white font-semibold",
                "shadow-lg shadow-primary/25",
                "hover:shadow-xl hover:shadow-primary/30",
                "active:scale-95",
                "transition-all duration-200"
              )}
              aria-label="Создать новый музыкальный трек с помощью AI"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              Создать трек
            </Button>
          </OnboardingTooltip>

          {/* Quick expand toggle */}
          <button
            onClick={handleExpand}
            aria-label={isExpanded ? "Свернуть опции создания" : "Раскрыть опции создания"}
            aria-pressed={isExpanded}
            className={cn(
              "w-12 h-12 min-w-touch rounded-xl",
              "bg-card/80 backdrop-blur-sm",
              "border border-border/50",
              "flex items-center justify-center",
              "hover:bg-card hover:border-primary/30",
              "active:scale-95",
              "transition-all duration-150"
            )}
            style={{ transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            <Plus className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>
        </div>

        {/* Expanded options */}
        {isExpanded && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <QuickCreateOption icon="🎵" label="Трек" description="Полный трек" onClick={handleCreate} />
            <QuickCreateOption icon="🎸" label="Рифф" description="Инструментал" onClick={handleCreate} />
            <QuickCreateOption icon="🎤" label="Кавер" description="Переделка" onClick={handleCreate} />
            <QuickCreateOption icon="✨" label="Ремикс" description="Новый звук" onClick={handleCreate} />
          </div>
        )}
      </div>
    </section>
  );
});

interface QuickCreateOptionProps {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}

const QuickCreateOption = memo(function QuickCreateOption({
  icon,
  label,
  description,
  onClick,
}: QuickCreateOptionProps) {
  const { hapticFeedback } = useTelegram();

  const handleClick = useCallback(() => {
    hapticFeedback('light');
    onClick();
  }, [hapticFeedback, onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={`Создать ${label.toLowerCase()}: ${description}`}
      className={cn(
        "flex flex-col items-center justify-center min-h-touch min-w-touch",
        "p-3 rounded-xl",
        "bg-card/50",
        "border border-border/40",
        "hover:bg-card hover:border-primary/30",
        "active:scale-95",
        "transition-colors duration-150"
      )}
    >
      <span className="text-xl mb-1" aria-hidden="true">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{description}</span>
    </button>
  );
});
