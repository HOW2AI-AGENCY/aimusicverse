/**
 * DailyTipCard - Shows a rotating tip for users
 * Helps with feature discovery and engagement
 * Opens tutorial dialog on click instead of navigation
 */

import { memo, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Lightbulb, X, ChevronRight, Sparkles, Music2, Scissors, Wand2, PenTool } from 'lucide-react';
import { typographyClass } from '@/lib/design-tokens';
import { useTelegram } from '@/contexts/TelegramContext';
import type { TutorialType } from './FeatureTutorialDialog';

// Lazy load the dialog
const FeatureTutorialDialog = lazy(() => 
  import('./FeatureTutorialDialog').then(m => ({ default: m.FeatureTutorialDialog }))
);

interface DailyTipCardProps {
  className?: string;
  onDismiss?: () => void;
}

const TIPS: Array<{
  id: TutorialType;
  icon: React.ComponentType<{ className?: string }>;
  tip: string;
  example: string;
  action: string;
  color: string;
}> = [
  {
    id: 'style',
    icon: Sparkles,
    tip: 'Детальные описания дают точный результат',
    example: '"energetic pop with synth arpeggios"',
    action: 'Узнать больше',
    color: 'primary',
  },
  {
    id: 'extend',
    icon: Music2,
    tip: 'Расширьте трек до полноценной песни',
    example: 'Добавьте новые куплеты и инструменталы',
    action: 'Как это?',
    color: 'emerald',
  },
  {
    id: 'cover',
    icon: Wand2,
    tip: 'AI-кавер меняет жанр любой песни',
    example: 'Рок-хит → джазовая баллада',
    action: 'Подробнее',
    color: 'purple',
  },
  {
    id: 'stems',
    icon: Scissors,
    tip: 'Разделяйте треки для ремиксов',
    example: 'Вокал, барабаны, бас — отдельно',
    action: 'Узнать',
    color: 'amber',
  },
  {
    id: 'lyrics',
    icon: PenTool,
    tip: 'AI напишет текст под любой жанр',
    example: 'От лирики до рэп-баттлов',
    action: 'Подробнее',
    color: 'pink',
  },
];

const colorStyles = {
  primary: { bg: 'from-primary/15 via-primary/5', border: 'border-primary/20', iconBg: 'bg-primary/20', text: 'text-primary' },
  emerald: { bg: 'from-emerald-500/15 via-emerald-500/5', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'from-purple-500/15 via-purple-500/5', border: 'border-purple-500/20', iconBg: 'bg-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'from-amber-500/15 via-amber-500/5', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20', text: 'text-amber-400' },
  pink: { bg: 'from-pink-500/15 via-pink-500/5', border: 'border-pink-500/20', iconBg: 'bg-pink-500/20', text: 'text-pink-400' },
};

export const DailyTipCard = memo(function DailyTipCard({
  className,
  onDismiss,
}: DailyTipCardProps) {
  const { hapticFeedback } = useTelegram();
  
  // Get today's tip based on day of year
  const todaysTip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  
  const styles = colorStyles[todaysTip.color as keyof typeof colorStyles];
  const Icon = todaysTip.icon;

  const handleAction = useCallback(() => {
    hapticFeedback('light');
    setTutorialOpen(true);
  }, [hapticFeedback]);

  const handleDismiss = useCallback(() => {
    hapticFeedback('light');
    setIsVisible(false);
    onDismiss?.();
  }, [hapticFeedback, onDismiss]);

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className={cn(
            "relative p-3 rounded-xl overflow-hidden",
            `bg-gradient-to-r ${styles.bg} to-transparent`,
            `border ${styles.border}`,
            className
          )}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25 }}
        >
          {/* Dismiss button - 44px touch target, positioned right */}
          <button
            onClick={handleDismiss}
            className="absolute top-1 right-1 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70 opacity-70 hover:opacity-100 transition-all touch-manipulation"
            aria-label="Скрыть подсказку"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            {/* Icon */}
            <motion.div 
              className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", styles.iconBg)}
              animate={{ rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon className={cn("w-4.5 h-4.5", styles.text)} />
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(typographyClass.body.sm, "font-medium text-foreground mb-0.5")}>
                {todaysTip.tip}
              </p>
              <p className={cn(typographyClass.caption, "italic mb-2")}>
                {todaysTip.example}
              </p>
              
              {/* Action button - opens tutorial dialog */}
              <button
                onClick={handleAction}
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  styles.text,
                  "hover:underline underline-offset-2 transition-colors"
                )}
              >
                {todaysTip.action}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tutorial Dialog */}
      {tutorialOpen && (
        <Suspense fallback={null}>
          <FeatureTutorialDialog
            open={tutorialOpen}
            onOpenChange={setTutorialOpen}
            type={todaysTip.id}
          />
        </Suspense>
      )}
    </>
  );
});
