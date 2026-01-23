/**
 * DailyTipCard - Shows a rotating tip for users
 * Helps with feature discovery and engagement
 */

import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyTipCardProps {
  className?: string;
  onDismiss?: () => void;
}

const TIPS = [
  {
    id: 'style',
    tip: 'Чем детальнее описание стиля, тем точнее результат',
    example: '"energetic pop with synth arpeggios and punchy drums"',
  },
  {
    id: 'extend',
    tip: 'Используйте "Расширить" чтобы сделать трек длиннее',
    example: 'Добавляйте новые куплеты или инструментальные части',
  },
  {
    id: 'cover',
    tip: 'AI-кавер может изменить жанр любой песни',
    example: 'Превратите рок-хит в джазовую балладу',
  },
  {
    id: 'stems',
    tip: 'Разделяйте треки на стемы для ремиксов',
    example: 'Извлеките вокал, барабаны, бас отдельно',
  },
  {
    id: 'lyrics',
    tip: 'AI-помощник напишет текст под любой жанр',
    example: 'От лирики до рэп-баттлов',
  },
];

export const DailyTipCard = memo(function DailyTipCard({
  className,
  onDismiss,
}: DailyTipCardProps) {
  // Get today's tip based on day of year
  const todaysTip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  return (
    <motion.div
      className={cn(
        "relative p-3 rounded-xl",
        "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
        "border border-amber-500/20",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 w-6 h-6 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <div className="flex items-start gap-2.5 pr-6">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground leading-snug mb-0.5">
            💡 {todaysTip.tip}
          </p>
          <p className="text-[10px] text-muted-foreground leading-snug italic">
            {todaysTip.example}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
