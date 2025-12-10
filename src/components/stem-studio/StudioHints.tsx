/**
 * Studio Hints and Tooltips
 * 
 * Contextual help system for new users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, X, HelpCircle, Volume2, Sliders, 
  Music, Scissors, Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HintConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const studioHints: Record<string, HintConfig> = {
  volume: {
    id: 'volume',
    title: 'Громкость стемов',
    description: 'Регулируйте громкость каждого стема отдельно. Используйте Mute для отключения и Solo для изолирования.',
    icon: Volume2,
    color: 'blue',
  },
  effects: {
    id: 'effects',
    title: 'Аудио-эффекты',
    description: 'Активируйте режим эффектов для применения EQ, компрессора и ревербера к каждому стему.',
    icon: Sliders,
    color: 'purple',
  },
  stems: {
    id: 'stems',
    title: 'Разделение стемов',
    description: 'Каждый стем - это отдельная составляющая трека: вокал, инструменты, бас, барабаны.',
    icon: Music,
    color: 'green',
  },
  sections: {
    id: 'sections',
    title: 'Редактор секций',
    description: 'Выделите секцию трека и замените её на новую версию с помощью AI.',
    icon: Scissors,
    color: 'orange',
  },
};

/**
 * Contextual hint badge
 */
interface HintBadgeProps {
  hintId: keyof typeof studioHints;
  show?: boolean;
  onDismiss?: () => void;
}

export function HintBadge({ hintId, show = true, onDismiss }: HintBadgeProps) {
  const [visible, setVisible] = useState(show);
  const hint = studioHints[hintId];

  useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!visible || !hint) return null;

  const Icon = hint.icon;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "inline-flex items-start gap-2 p-3 rounded-lg border max-w-sm",
          hint.color === 'blue' && "bg-blue-500/5 border-blue-500/20",
          hint.color === 'purple' && "bg-purple-500/5 border-purple-500/20",
          hint.color === 'green' && "bg-green-500/5 border-green-500/20",
          hint.color === 'orange' && "bg-orange-500/5 border-orange-500/20"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 shrink-0 mt-0.5",
            hint.color === 'blue' && "text-blue-500",
            hint.color === 'purple' && "text-purple-500",
            hint.color === 'green' && "text-green-500",
            hint.color === 'orange' && "text-orange-500"
          )}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">{hint.title}</h4>
          <p className="text-xs text-muted-foreground">{hint.description}</p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 shrink-0 rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Quick tooltip for UI elements
 */
interface QuickTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  shortcut?: string;
}

export function QuickTooltip({ content, children, side = 'top', shortcut }: QuickTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-xs">{content}</p>
          {shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Help button with popover info
 */
interface HelpButtonProps {
  topic: string;
  content: string;
  className?: string;
}

export function HelpButton({ topic, content, className }: HelpButtonProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowHelp(!showHelp)}
        className={cn("h-8 w-8 rounded-full", className)}
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </Button>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-72 z-50"
          >
            <div className="bg-popover border border-border rounded-lg shadow-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <h4 className="text-sm font-semibold">{topic}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHelp(false)}
                  className="h-6 w-6 ml-auto shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Feature badge for new features
 */
export function NewFeatureBadge({ label = 'Новое' }: { label?: string }) {
  return (
    <Badge
      variant="secondary"
      className="text-[10px] h-4 px-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
    >
      {label}
    </Badge>
  );
}

/**
 * Floating hint system
 */
interface FloatingHintProps {
  show: boolean;
  title: string;
  description: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onDismiss?: () => void;
}

export function FloatingHint({
  show,
  title,
  description,
  position = 'bottom-right',
  onDismiss,
}: FloatingHintProps) {
  if (!show) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "fixed z-40 max-w-sm",
          positionClasses[position]
        )}
      >
        <div className="bg-card border border-border rounded-lg shadow-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-6 w-6 shrink-0 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage hint visibility
 */
export function useStudioHints() {
  const [dismissedHints, setDismissedHints] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dismissed-studio-hints');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissHint = (hintId: string) => {
    const updated = [...dismissedHints, hintId];
    setDismissedHints(updated);
    localStorage.setItem('dismissed-studio-hints', JSON.stringify(updated));
  };

  const isHintDismissed = (hintId: string) => {
    return dismissedHints.includes(hintId);
  };

  const resetHints = () => {
    setDismissedHints([]);
    localStorage.removeItem('dismissed-studio-hints');
  };

  return {
    dismissHint,
    isHintDismissed,
    resetHints,
  };
}
