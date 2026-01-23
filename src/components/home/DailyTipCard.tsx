/**
 * DailyTipCard - Shows a rotating tip for users
 * Helps with feature discovery and engagement
 * Updated with design tokens for consistency
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Lightbulb, X, ChevronRight, Sparkles, Music2, Scissors, Wand2, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { typographyClass, spacingClass } from '@/lib/design-tokens';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

interface DailyTipCardProps {
  className?: string;
  onDismiss?: () => void;
}

const TIPS = [
  {
    id: 'style',
    icon: Sparkles,
    tip: 'Детальные описания дают точный результат',
    example: '"energetic pop with synth arpeggios"',
    action: 'Попробовать',
    route: '/generate',
    color: 'primary',
  },
  {
    id: 'extend',
    icon: Music2,
    tip: 'Расширьте трек до полноценной песни',
    example: 'Добавьте новые куплеты и инструменталы',
    action: 'Как это?',
    route: '/library',
    color: 'emerald',
  },
  {
    id: 'cover',
    icon: Wand2,
    tip: 'AI-кавер меняет жанр любой песни',
    example: 'Рок-хит → джазовая баллада',
    action: 'Создать',
    route: '/library',
    color: 'purple',
  },
  {
    id: 'stems',
    icon: Scissors,
    tip: 'Разделяйте треки для ремиксов',
    example: 'Вокал, барабаны, бас — отдельно',
    action: 'Узнать',
    route: '/library',
    color: 'amber',
  },
  {
    id: 'lyrics',
    icon: PenTool,
    tip: 'AI напишет текст под любой жанр',
    example: 'От лирики до рэп-баттлов',
    action: 'Создать',
    route: '/lyrics',
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
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  
  // Get today's tip based on day of year
  const todaysTip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  const [isVisible, setIsVisible] = useState(true);
  const styles = colorStyles[todaysTip.color as keyof typeof colorStyles];
  const Icon = todaysTip.icon;

  const handleAction = useCallback(() => {
    hapticFeedback('light');
    navigate(todaysTip.route);
  }, [hapticFeedback, navigate, todaysTip.route]);

  const handleDismiss = useCallback(() => {
    hapticFeedback('light');
    setIsVisible(false);
    onDismiss?.();
  }, [hapticFeedback, onDismiss]);

  if (!isVisible) return null;

  return (
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
        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1.5 right-1.5 w-6 h-6 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="w-3 h-3" />
        </Button>

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
            
            {/* Action button */}
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
  );
});
