import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateFormHintProps {
  type?: 'info' | 'tip' | 'example';
  show?: boolean;
  className?: string;
  children: React.ReactNode;
}

const icons = {
  info: Info,
  tip: Lightbulb,
  example: Sparkles,
};

const colors = {
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  tip: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  example: 'text-primary bg-primary/10 border-primary/20',
};

export function GenerateFormHint({ 
  type = 'info', 
  show = true, 
  className,
  children 
}: GenerateFormHintProps) {
  const Icon = icons[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-start gap-2 px-3 py-2 rounded-lg text-xs border",
            colors[type],
            className
          )}
        >
          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="text-foreground/80">{children}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-defined hints for common fields
export const FORM_HINTS = {
  description: {
    empty: 'Опишите жанр, настроение и инструменты. Например: "Энергичный рок с электрогитарой"',
    tip: 'Используйте теги [Жанр: ...] [Настроение: ...] для точного результата',
  },
  style: {
    empty: 'Укажите стиль, BPM, тональность. Например: "indie rock, 120 bpm, male vocals"',
    tip: 'Английские теги работают лучше для музыкального стиля',
  },
  lyrics: {
    empty: 'Напишите текст песни или используйте AI-ассистент для генерации',
    structure: 'Используйте [Verse], [Chorus], [Bridge] для структуры',
  },
  title: {
    empty: 'Оставьте пустым для автогенерации названия на основе стиля',
  },
};
