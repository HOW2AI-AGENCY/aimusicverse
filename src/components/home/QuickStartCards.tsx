/**
 * QuickStartCards - Quick preset cards for fast music generation
 * 
 * Three main presets:
 * 1. 🎵 Трек - Create a full track with lyrics
 * 2. 🎸 Рифф - Create an instrumental riff
 * 3. 🎤 Cover - Create a cover version
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Guitar, Mic2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

export type QuickStartPreset = 'track' | 'riff' | 'cover';

interface QuickStartCardProps {
  preset: QuickStartPreset;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
  delay?: number;
}

const QuickStartCard = memo(function QuickStartCard({
  preset,
  title,
  description,
  icon,
  gradient,
  onClick,
  delay = 0,
}: QuickStartCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl",
        "min-h-[100px] sm:min-h-[120px]",
        "border border-border/50 shadow-sm",
        "transition-all duration-300 touch-manipulation",
        "hover:shadow-lg hover:border-primary/30 active:scale-95",
        "bg-gradient-to-br",
        gradient
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon */}
      <motion.div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-inner mb-2"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(var(--primary), 0)',
            '0 0 10px 2px rgba(var(--primary), 0.15)',
            '0 0 0 0 rgba(var(--primary), 0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 0.3 }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-bold text-foreground mb-0.5">{title}</h3>
      
      {/* Description */}
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight px-1">
        {description}
      </p>

      {/* Hover arrow indicator */}
      <motion.div
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100"
        initial={{ opacity: 0, x: -5 }}
        whileHover={{ opacity: 1, x: 0 }}
      >
        <ArrowRight className="w-3.5 h-3.5 text-primary" />
      </motion.div>

      {/* Sparkle decoration */}
      <motion.div
        className="absolute top-2 right-2"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: delay * 0.5 }}
      >
        <Sparkles className="w-3 h-3 text-primary/60" />
      </motion.div>
    </motion.button>
  );
});

interface QuickStartCardsProps {
  onPresetSelect: (preset: QuickStartPreset) => void;
  className?: string;
}

export const QuickStartCards = memo(function QuickStartCards({
  onPresetSelect,
  className,
}: QuickStartCardsProps) {
  const { hapticFeedback } = useTelegram();

  const handleCardClick = useCallback((preset: QuickStartPreset) => {
    hapticFeedback('light');
    onPresetSelect(preset);
  }, [hapticFeedback, onPresetSelect]);

  const presets: Omit<QuickStartCardProps, 'onClick' | 'delay'>[] = [
    {
      preset: 'track',
      title: 'Трек',
      description: 'Полноценный трек с текстом',
      icon: <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />,
      gradient: 'from-primary/10 via-primary/5 to-background',
    },
    {
      preset: 'riff',
      title: 'Рифф',
      description: 'Инструментальный рифф',
      icon: <Guitar className="w-5 h-5 sm:w-6 sm:h-6 text-generate" />,
      gradient: 'from-generate/10 via-generate/5 to-background',
    },
    {
      preset: 'cover',
      title: 'Cover',
      description: 'AI-кавер на ваше аудио',
      icon: <Mic2 className="w-5 h-5 sm:w-6 sm:h-6 text-studio" />,
      gradient: 'from-studio/10 via-studio/5 to-background',
    },
  ];

  return (
    <motion.section
      className={cn("space-y-3", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {/* Section header */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Быстрый старт</h2>
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {presets.map((preset, index) => (
          <QuickStartCard
            key={preset.preset}
            {...preset}
            onClick={() => handleCardClick(preset.preset)}
            delay={index + 1}
          />
        ))}
      </div>
    </motion.section>
  );
});
