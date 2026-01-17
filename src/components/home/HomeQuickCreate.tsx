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
    <motion.section
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-primary/10 via-primary/5 to-background",
        "border border-primary/20",
        "p-4 sm:p-6",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-generate/10 rounded-full blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Создать музыку
            </h2>
            <p className="text-xs text-muted-foreground">
              С помощью AI за несколько секунд
            </p>
          </div>
        </div>

        {/* FAB - Primary action */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            className={cn(
              "flex-1 h-12 min-h-[48px]",
              "bg-gradient-to-r from-primary to-generate",
              "text-white font-semibold",
              "shadow-lg shadow-primary/25",
              "hover:shadow-xl hover:shadow-primary/30",
              "active:scale-95",
              "transition-all duration-200"
            )}
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать трек
          </Button>

          {/* Quick expand toggle - shows additional options */}
          <motion.button
            onClick={handleExpand}
            className={cn(
              "w-12 h-12 min-w-[48px] rounded-xl",
              "bg-card/80 backdrop-blur-sm",
              "border border-border/50",
              "flex items-center justify-center",
              "hover:bg-card hover:border-primary/30",
              "active:scale-95",
              "transition-all duration-200"
            )}
            whileTap={{ scale: 0.95 }}
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-5 h-5 text-foreground" />
          </motion.button>
        </div>

        {/* Expanded options - progressive disclosure */}
        {isExpanded && (
          <motion.div
            className="mt-4 grid grid-cols-2 gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuickCreateOption
              icon="🎵"
              label="Трек"
              description="Полный трек"
              onClick={handleCreate}
            />
            <QuickCreateOption
              icon="🎸"
              label="Рифф"
              description="Инструментал"
              onClick={handleCreate}
            />
            <QuickCreateOption
              icon="🎤"
              label="Кавер"
              description="Переделка"
              onClick={handleCreate}
            />
            <QuickCreateOption
              icon="✨"
              label="Ремикс"
              description="Новый звук"
              onClick={handleCreate}
            />
          </motion.div>
        )}
      </div>
    </motion.section>
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
    <motion.button
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center justify-center",
        "p-3 rounded-xl",
        "bg-card/50 backdrop-blur-sm",
        "border border-border/50",
        "hover:bg-card hover:border-primary/30",
        "active:scale-95",
        "transition-all duration-200"
      )}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{description}</span>
    </motion.button>
  );
});
