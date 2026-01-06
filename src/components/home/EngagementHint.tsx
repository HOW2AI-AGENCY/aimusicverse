/**
 * EngagementHint - Компактная подсказка для вовлечения
 * Показывает tips для взаимодействия с треками
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Heart, Play, MessageSquare, Share2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngagementHintProps {
  variant?: 'like' | 'play' | 'comment' | 'share' | 'random';
  className?: string;
}

const HINTS = {
  like: {
    icon: Heart,
    text: 'Двойной тап по обложке — лайк',
    color: 'text-rose-400',
    bgColor: 'from-rose-500/10 to-rose-500/5',
  },
  play: {
    icon: Play,
    text: 'Нажми на обложку — послушать',
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/10 to-emerald-500/5',
  },
  comment: {
    icon: MessageSquare,
    text: 'Оставь комментарий автору',
    color: 'text-violet-400',
    bgColor: 'from-violet-500/10 to-violet-500/5',
  },
  share: {
    icon: Share2,
    text: 'Поделись с друзьями',
    color: 'text-primary',
    bgColor: 'from-primary/10 to-primary/5',
  },
};

export const EngagementHint = memo(function EngagementHint({
  variant = 'random',
  className,
}: EngagementHintProps) {
  const keys = Object.keys(HINTS) as Array<keyof typeof HINTS>;
  const selectedVariant = variant === 'random' 
    ? keys[Math.floor(Math.random() * keys.length)]
    : variant;
  
  const hint = HINTS[selectedVariant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-gradient-to-r border border-border/30",
        hint.bgColor,
        className
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center",
        "bg-background/50 backdrop-blur-sm"
      )}>
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="flex items-center gap-1.5">
        <hint.icon className={cn("w-3.5 h-3.5", hint.color)} />
        <span className="text-xs text-muted-foreground">{hint.text}</span>
      </div>
    </motion.div>
  );
});
