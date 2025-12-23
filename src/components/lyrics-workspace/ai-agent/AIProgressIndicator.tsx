/**
 * AIProgressIndicator - Visual progress for AI generation steps
 */

import { motion } from '@/lib/motion';
import { Loader2, PenLine, BarChart3, Tag, Wand2, Headphones, Quote, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProgressIndicatorProps {
  isLoading: boolean;
  step?: string;
  message?: string;
  className?: string;
}

const STEP_INFO: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  write: { icon: PenLine, label: 'Пишу текст', color: 'text-blue-400' },
  analyze: { icon: BarChart3, label: 'Анализирую', color: 'text-purple-400' },
  full_analysis: { icon: BarChart3, label: 'Глубокий анализ', color: 'text-purple-400' },
  tags: { icon: Tag, label: 'Генерирую теги', color: 'text-emerald-400' },
  optimize: { icon: Wand2, label: 'Оптимизирую для Suno', color: 'text-primary' },
  producer: { icon: Headphones, label: 'Продюсерский разбор', color: 'text-amber-400' },
  producer_review: { icon: Headphones, label: 'Продюсерский разбор', color: 'text-amber-400' },
  rhyme: { icon: Quote, label: 'Подбираю рифмы', color: 'text-cyan-400' },
  smart_generate: { icon: PenLine, label: 'Умная генерация', color: 'text-blue-400' },
  chat: { icon: Brain, label: 'Думаю', color: 'text-primary' },
  processing: { icon: Loader2, label: 'Обрабатываю', color: 'text-muted-foreground' },
};

export function AIProgressIndicator({
  isLoading,
  step = 'processing',
  message,
  className,
}: AIProgressIndicatorProps) {
  const info = STEP_INFO[step] || STEP_INFO.processing;
  const Icon = info.icon;

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex items-center gap-3 py-2", className)}
    >
      <div className={cn(
        "relative w-8 h-8 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
      )}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-xl border-2 border-transparent border-t-primary/40"
        />
        <Icon className={cn("w-4 h-4", info.color)} />
      </div>
      
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{message || info.label}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
