/**
 * ContextualOnboardingTip - Animated tooltip that points to specific UI elements
 * Shows contextual guidance for first-time feature usage
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface OnboardingTipConfig {
  id: string;
  title: string;
  description: string;
  icon?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Target element selector or ref */
  targetSelector?: string;
  /** Show "Learn more" button */
  learnMoreUrl?: string;
  /** Priority for display order */
  priority?: number;
}

interface ContextualOnboardingTipProps {
  tip: OnboardingTipConfig;
  isVisible: boolean;
  onDismiss: () => void;
  onLearnMore?: () => void;
  className?: string;
}

export function ContextualOnboardingTip({
  tip,
  isVisible,
  onDismiss,
  onLearnMore,
  className
}: ContextualOnboardingTipProps) {
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  const tipRef = useRef<HTMLDivElement>(null);

  // Calculate arrow position based on target element
  useEffect(() => {
    if (!isVisible || !tip.targetSelector) return;

    const targetEl = document.querySelector(tip.targetSelector);
    if (!targetEl || !tipRef.current) return;

    const targetRect = targetEl.getBoundingClientRect();
    const tipRect = tipRef.current.getBoundingClientRect();

    // Calculate center point of target
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    // Calculate relative position for arrow
    setArrowPosition({
      x: targetCenterX - tipRect.left,
      y: targetCenterY - tipRect.top
    });
  }, [isVisible, tip.targetSelector]);

  const positionClasses = {
    top: 'bottom-full mb-3',
    bottom: 'top-full mt-3',
    left: 'right-full mr-3',
    right: 'left-full ml-3'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-accent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-accent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-accent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-accent'
  };

  const enterAnimation = {
    top: { opacity: 0, y: 10, scale: 0.95 },
    bottom: { opacity: 0, y: -10, scale: 0.95 },
    left: { opacity: 0, x: 10, scale: 0.95 },
    right: { opacity: 0, x: -10, scale: 0.95 }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tipRef}
          className={cn(
            "absolute z-[60] w-72 max-w-[90vw]",
            "rounded-xl shadow-xl overflow-hidden",
            "bg-accent text-accent-foreground",
            "border border-border/50",
            positionClasses[tip.position],
            className
          )}
          initial={enterAnimation[tip.position]}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Animated pointer arrow */}
          <div 
            className={cn(
              "absolute w-0 h-0",
              arrowClasses[tip.position]
            )} 
          />

          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="relative p-4">
            {/* Header with icon */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                {tip.icon ? (
                  <span className="text-lg">{tip.icon}</span>
                ) : (
                  <Lightbulb className="w-4 h-4 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="font-semibold text-sm leading-tight">
                  {tip.title}
                </h4>
              </div>

              {/* Close button */}
              <button
                onClick={onDismiss}
                className={cn(
                  "absolute top-2 right-2",
                  "w-8 h-8 min-w-[32px] flex items-center justify-center",
                  "rounded-full hover:bg-foreground/10",
                  "transition-colors touch-manipulation"
                )}
                aria-label="Закрыть подсказку"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-11">
              {tip.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pl-11">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-8 text-xs"
              >
                Понятно
              </Button>
              
              {(tip.learnMoreUrl || onLearnMore) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onLearnMore}
                  className="h-8 text-xs gap-1"
                >
                  Подробнее
                  <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing contextual tips
export function useContextualTip(tipId: string) {
  const STORAGE_KEY = `onboarding_tip_${tipId}`;
  
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeen, setHasSeen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'seen';
    } catch {
      return false;
    }
  });

  const show = () => {
    if (!hasSeen) {
      setIsVisible(true);
    }
  };

  const dismiss = () => {
    setIsVisible(false);
    setHasSeen(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'seen');
    } catch {
      // Ignore storage errors
    }
  };

  const reset = () => {
    setHasSeen(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return {
    isVisible,
    hasSeen,
    show,
    dismiss,
    reset
  };
}

// Predefined contextual tips
export const CONTEXTUAL_TIPS: Record<string, OnboardingTipConfig> = {
  studio_first_open: {
    id: 'studio_first_open',
    title: 'Добро пожаловать в Студию!',
    description: 'Здесь вы можете редактировать стемы, микшировать треки и экспортировать в разные форматы.',
    icon: '🎛️',
    position: 'bottom',
    priority: 1
  },
  cover_action: {
    id: 'cover_action',
    title: 'Создайте кавер',
    description: 'Загрузите аудио-референс, и AI создаст новую версию в выбранном стиле.',
    icon: '🎤',
    position: 'left',
    priority: 2
  },
  extend_action: {
    id: 'extend_action',
    title: 'Расширьте трек',
    description: 'AI продолжит вашу композицию, добавив новые музыкальные части.',
    icon: '➕',
    position: 'left',
    priority: 2
  },
  midi_export: {
    id: 'midi_export',
    title: 'Экспорт в MIDI',
    description: 'Конвертируйте аудио в MIDI для использования в DAW.',
    icon: '🎹',
    position: 'top',
    priority: 3
  },
  stem_mixer: {
    id: 'stem_mixer',
    title: 'Микшер стемов',
    description: 'Регулируйте громкость каждого стема отдельно для идеального микса.',
    icon: '🎚️',
    position: 'bottom',
    priority: 2
  },
  quick_preset: {
    id: 'quick_preset',
    title: 'Быстрые пресеты',
    description: 'Выберите готовый стиль для мгновенного старта генерации.',
    icon: '⚡',
    position: 'bottom',
    priority: 1
  }
};

export default ContextualOnboardingTip;
