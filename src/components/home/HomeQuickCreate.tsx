/**
 * HomeQuickCreate - Simplified quick create section with FAB trigger
 * Feature: 001-mobile-ui-redesign, 032-professional-ui
 *
 * A minimalist quick create section that provides the primary "Create" action
 * accessible within one tap via the FAB, with an optional expanded prompt input.
 * Uses design system tokens for consistent styling.
 */

import { memo, useCallback, useState } from "react";
import { motion } from "@/lib/motion";
import { Sparkles, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { Button } from "@/components/ui/button";
import { UnifiedTipCard } from "@/components/hints";
import { glass } from "@/lib/glass";

interface HomeQuickCreateProps {
  onCreateClick: () => void;
  className?: string;
}

export const HomeQuickCreate = memo(function HomeQuickCreate({ onCreateClick, className }: HomeQuickCreateProps) {
  const { hapticFeedback } = useTelegram();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreate = useCallback(() => {
    hapticFeedback("medium");
    onCreateClick();
  }, [hapticFeedback, onCreateClick]);

  const handleExpand = useCallback(() => {
    hapticFeedback("light");
    setIsExpanded(!isExpanded);
  }, [hapticFeedback, isExpanded]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl lg:rounded-3xl",
        "bg-gradient-to-br from-primary/12 via-primary/5 to-transparent",
        "border border-primary/25",
        glass.subtle,
        "p-4 sm:p-5 lg:p-6",
        "group",
        className,
      )}
    >
      {/* Background decoration - simplified */}
      <div className="absolute top-0 right-0 w-40 h-40 lg:w-56 lg:h-56 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-primary/15 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-32 h-32 lg:w-44 lg:h-44 bg-gradient-to-tr from-generate/8 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with improved visual hierarchy */}
        <div className="flex items-start justify-between mb-4 lg:mb-5 gap-3">
          <div className="flex items-center gap-3 lg:gap-4">
            <motion.div
              className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/40 to-primary/15 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/30"
              animate={{ rotate: [0, 4, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary drop-shadow-sm" />
            </motion.div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">Создать музыку</h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-snug">
                AI сгенерирует трек за минуту
              </p>
            </div>
          </div>
          {/* Credits cost badge */}
          <span className="px-2.5 py-1 lg:px-3 lg:py-1.5 text-[10px] sm:text-xs lg:text-sm font-bold bg-gradient-to-r from-primary/20 to-generate/15 text-primary rounded-full border border-primary/30 whitespace-nowrap shadow-sm">
            🎵 10-12 кредитов
          </span>
        </div>

        {/* FAB - Primary action */}
        <div className="flex items-center gap-3 lg:gap-4">
          <Button
            onClick={handleCreate}
            className={cn(
              "flex-1 h-12 lg:h-14 min-h-touch",
              "bg-gradient-to-r from-primary to-generate",
              "text-white font-semibold lg:text-lg",
              "shadow-lg shadow-primary/25",
              "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
              "active:scale-95",
              "transition-all duration-200",
            )}
            aria-label="Создать новый музыкальный трек с помощью AI"
          >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6 mr-2" aria-hidden="true" />
            Создать трек
          </Button>
          <UnifiedTipCard
            id="quick-create-first"
            title="Создайте первый трек"
            message="Нажмите кнопку, опишите музыку словами — AI создаст трек за минуту. Стоимость: 10–12 кредитов."
            emoji="✨"
            delay={1500}
            onDismiss={() => {}}
          />

          {/* Quick expand toggle */}
          <button
            onClick={handleExpand}
            aria-label={isExpanded ? "Свернуть опции создания" : "Раскрыть опции создания"}
            aria-pressed={isExpanded}
            className={cn(
              "w-12 h-12 lg:w-14 lg:h-14 min-w-touch rounded-xl lg:rounded-2xl",
              "bg-card/80 backdrop-blur-sm",
              "border border-border/50",
              "flex items-center justify-center",
              "hover:bg-card hover:border-primary/30 hover:shadow-md",
              "active:scale-95",
              "transition-all duration-150",
            )}
            style={{ transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" aria-hidden="true" />
          </button>
        </div>

        {/* Expanded options */}
        {isExpanded && (
          <div className="mt-3 lg:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
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
    hapticFeedback("light");
    onClick();
  }, [hapticFeedback, onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={`Создать ${label.toLowerCase()}: ${description}`}
      className={cn(
        "flex flex-col items-center justify-center min-h-touch min-w-touch",
        "p-3 lg:p-4 rounded-xl lg:rounded-2xl",
        "bg-card/50",
        "border border-border/40",
        "hover:bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        "active:scale-95",
        "transition-all duration-150",
        "group",
      )}
    >
      <span className="text-xl lg:text-2xl mb-1 lg:mb-2 group-hover:scale-110 transition-transform" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs lg:text-sm font-medium text-foreground">{label}</span>
      <span className="text-[10px] lg:text-xs text-muted-foreground">{description}</span>
    </button>
  );
});
