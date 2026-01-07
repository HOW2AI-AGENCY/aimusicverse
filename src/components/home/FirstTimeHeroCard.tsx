/**
 * FirstTimeHeroCard - Hero section for new users
 * Shows step-by-step guide and primary CTA
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Sparkles, Music2, Headphones, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FirstTimeHeroCardProps {
  onCreateClick: () => void;
  className?: string;
}

const STEPS = [
  {
    number: 1,
    title: 'Опиши музыку',
    description: 'Жанр, настроение, инструменты',
    icon: Music2,
  },
  {
    number: 2,
    title: 'Подожди 2-3 минуты',
    description: 'AI создаёт твой трек',
    icon: Sparkles,
  },
  {
    number: 3,
    title: 'Слушай и редактируй',
    description: 'Получи 2 варианта на выбор',
    icon: Headphones,
  },
];

export const FirstTimeHeroCard = memo(function FirstTimeHeroCard({
  onCreateClick,
  className,
}: FirstTimeHeroCardProps) {
  return (
    <section className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-generate/10" />
      
      {/* Animated glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 p-5 sm:p-6">
        {/* Welcome badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-medium border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Добро пожаловать в MusicVerse AI
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl font-bold text-center mb-2"
        >
          Создай свой первый трек
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground text-center mb-5"
        >
          Три простых шага до профессионального звучания
        </motion.p>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-5"
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">
                    Шаг {step.number}
                  </span>
                </div>
                <h3 className="font-medium text-foreground text-sm">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onCreateClick}
            size="lg"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-generate hover:from-primary/90 hover:to-generate/90 text-white gap-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Создать первый трек
          </Button>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground text-center mt-4"
        >
          💡 Совет: начни с простого описания, например<br />
          <span className="text-primary">"Энергичный рок с электрогитарами"</span>
        </motion.p>
      </div>
    </section>
  );
});
