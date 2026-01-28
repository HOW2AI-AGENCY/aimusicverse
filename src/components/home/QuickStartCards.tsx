/**
 * QuickStartCards - Quick preset cards for fast music generation
 * Opens tutorial dialogs to explain each feature before action
 */

import { memo, useCallback, useState, lazy, Suspense } from 'react';
import { motion } from '@/lib/motion';
import { Music2, Guitar, Mic2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { typographyClass, textBalance } from '@/lib/design-tokens';
import type { TutorialType } from './FeatureTutorialDialog';

// Lazy load the dialog
const FeatureTutorialDialog = lazy(() => 
  import('./FeatureTutorialDialog').then(m => ({ default: m.FeatureTutorialDialog }))
);

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
        "relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl",
        "min-h-[85px] sm:min-h-[110px]",
        "border border-border/50 shadow-sm",
        "transition-all duration-200 touch-manipulation",
        "hover:shadow-md hover:border-primary/30 active:scale-95",
        "bg-gradient-to-br",
        gradient
      )}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Icon */}
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-inner mb-1.5 sm:mb-2">
        {icon}
      </div>

      {/* Title */}
      <h3 className={cn(typographyClass.body.sm, "font-bold text-foreground mb-0.5", textBalance.balance)}>{title}</h3>
      
      {/* Description - hidden on very small screens */}
      <p className={cn(typographyClass.caption, "text-center px-0.5 hidden xs:block line-clamp-2")}>
        {description}
      </p>

      {/* Sparkle decoration - simplified */}
      <Sparkles className="absolute top-1.5 right-1.5 w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary/50" />
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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialType>('track');
  const [pendingPreset, setPendingPreset] = useState<QuickStartPreset | null>(null);

  const handleCardClick = useCallback((preset: QuickStartPreset) => {
    hapticFeedback('light');
    // Map preset to tutorial type
    const tutorialType: TutorialType = preset;
    setSelectedTutorial(tutorialType);
    setPendingPreset(preset);
    setTutorialOpen(true);
  }, [hapticFeedback]);

  const handleTutorialAction = useCallback(() => {
    if (pendingPreset) {
      onPresetSelect(pendingPreset);
    }
    setPendingPreset(null);
  }, [pendingPreset, onPresetSelect]);

  const presets: Omit<QuickStartCardProps, 'onClick' | 'delay'>[] = [
    {
      preset: 'track',
      title: 'Трек',
      description: 'Полноценный трек',
      icon: <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />,
      gradient: 'from-primary/10 via-primary/5 to-background',
    },
    {
      preset: 'riff',
      title: 'Рифф',
      description: 'Инструментал',
      icon: <Guitar className="w-4 h-4 sm:w-5 sm:h-5 text-generate" />,
      gradient: 'from-generate/10 via-generate/5 to-background',
    },
    {
      preset: 'cover',
      title: 'Cover',
      description: 'AI-кавер',
      icon: <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 text-studio" />,
      gradient: 'from-studio/10 via-studio/5 to-background',
    },
  ];

  return (
    <>
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
          <h2 className={cn(typographyClass.body.md, "font-semibold text-foreground")}>Быстрый старт</h2>
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

      {/* Tutorial Dialog */}
      {tutorialOpen && (
        <Suspense fallback={null}>
          <FeatureTutorialDialog
            open={tutorialOpen}
            onOpenChange={setTutorialOpen}
            type={selectedTutorial}
            onAction={handleTutorialAction}
          />
        </Suspense>
      )}
    </>
  );
});
