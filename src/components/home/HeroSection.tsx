/**
 * HeroSection - Главный баннер с ценностным предложением
 * Показывает: headline, описание, ключевые преимущества, CTA
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { 
  Sparkles, 
  Play, 
  Headphones, 
  Heart, 
  Zap,
  Music2,
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  onListenClick: () => void;
  onCreateClick: () => void;
  isGuest?: boolean;
  className?: string;
}

const FEATURES = [
  { icon: Zap, label: 'За секунды', color: 'text-amber-400' },
  { icon: Music2, label: '174+ стилей', color: 'text-violet-400' },
  { icon: Heart, label: 'Бесплатно', color: 'text-rose-400' },
];

export const HeroSection = memo(function HeroSection({
  onListenClick,
  onCreateClick,
  isGuest = true,
  className,
}: HeroSectionProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/15 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-generate/10 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 py-6 sm:py-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">AI-генерация музыки</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-4"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Создавай музыку
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-generate to-primary bg-clip-text text-transparent">
              силой AI
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Опиши настроение — и получи уникальный трек за секунды. 
            {isGuest ? ' Начни слушать прямо сейчас!' : ' Слушай и создавай вместе с сообществом.'}
          </p>
        </motion.div>

        {/* Features Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 sm:gap-3 mb-5"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/50"
            >
              <feature.icon className={cn("w-3.5 h-3.5", feature.color)} />
              <span className="text-xs font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {/* Primary CTA - Listen */}
          <Button
            size="lg"
            variant="secondary"
            onClick={onListenClick}
            className="w-full sm:w-auto gap-2 rounded-xl shadow-lg bg-card hover:bg-card/80"
          >
            <Headphones className="w-4 h-4" />
            Слушать треки
          </Button>

          {/* Secondary CTA - Create */}
          <Button
            size="lg"
            onClick={onCreateClick}
            className="w-full sm:w-auto gap-2 rounded-xl shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Создать трек
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Stats hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[11px] text-muted-foreground/70 mt-4"
        >
          <Play className="w-3 h-3 inline-block mr-1" />
          Более 10 000 треков создано сообществом
        </motion.p>
      </div>
    </section>
  );
});
