/**
 * QuickStartCards - Quick preset cards for fast music generation
 * Feature: 032-professional-ui
 *
 * Opens tutorial dialogs to explain each feature before action
 * Uses design system tokens for consistent styling
 */

import { memo, useCallback, useState, lazy, Suspense } from "react";
import { motion } from "@/lib/motion";
import { Music2, Guitar, Mic2, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { SectionHeading } from "@/components/ui/Heading";
import { glass } from "@/lib/glass";
import type { TutorialType } from "./FeatureTutorialDialog";

// Lazy load the dialog
const FeatureTutorialDialog = lazy(() =>
  import("./FeatureTutorialDialog").then((m) => ({ default: m.FeatureTutorialDialog })),
);

export type QuickStartPreset = "track" | "riff" | "cover";

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
        "relative flex flex-col items-center justify-center p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl",
        "min-h-[85px] sm:min-h-[110px] lg:min-h-[130px]",
        glass.card,
        "transition-all duration-200 touch-manipulation",
        "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1",
        "active:scale-95",
        "bg-gradient-to-br",
        gradient,
        "group",
      )}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.05, duration: 0.2 }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-3",
          glass.subtle,
          "group-hover:scale-110 transition-transform duration-200",
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-sm lg:text-base font-bold text-foreground mb-0.5 text-balance">{title}</h3>

      {/* Description - visible on larger screens */}
      <p className="text-[0.6875rem] lg:text-xs text-muted-foreground text-center px-0.5 hidden xs:block lg:block line-clamp-2">
        {description}
      </p>

      {/* Sparkle decoration - simplified */}
      <Sparkles className="absolute top-1.5 right-1.5 lg:top-2.5 lg:right-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary/50 group-hover:text-primary/80 transition-colors" />
    </motion.button>
  );
});

interface QuickStartCardsProps {
  onPresetSelect: (preset: QuickStartPreset) => void;
  className?: string;
}

export const QuickStartCards = memo(function QuickStartCards({ onPresetSelect, className }: QuickStartCardsProps) {
  const { hapticFeedback } = useTelegram();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialType>("track");
  const [pendingPreset, setPendingPreset] = useState<QuickStartPreset | null>(null);

  const handleCardClick = useCallback(
    (preset: QuickStartPreset) => {
      hapticFeedback("light");
      // Map preset to tutorial type
      const tutorialType: TutorialType = preset;
      setSelectedTutorial(tutorialType);
      setPendingPreset(preset);
      setTutorialOpen(true);
    },
    [hapticFeedback],
  );

  const handleTutorialAction = useCallback(() => {
    if (pendingPreset) {
      onPresetSelect(pendingPreset);
    }
    setPendingPreset(null);
  }, [pendingPreset, onPresetSelect]);

  const presets: Omit<QuickStartCardProps, "onClick" | "delay">[] = [
    {
      preset: "track",
      title: "Трек",
      description: "Полноценный трек с вокалом",
      icon: <Music2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />,
      gradient: "from-primary/10 via-primary/5 to-background",
    },
    {
      preset: "riff",
      title: "Рифф",
      description: "Инструментальная композиция",
      icon: <Guitar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-generate" />,
      gradient: "from-generate/10 via-generate/5 to-background",
    },
    {
      preset: "cover",
      title: "Cover",
      description: "AI-кавер в новом стиле",
      icon: <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-studio" />,
      gradient: "from-studio/10 via-studio/5 to-background",
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
        {/* Section header - using design system */}
        <SectionHeading icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}>Быстрый старт</SectionHeading>

        {/* Cards grid - responsive */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
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
