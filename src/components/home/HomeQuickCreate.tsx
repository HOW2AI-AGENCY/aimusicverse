/**
 * HomeQuickCreate - Simplified quick create section with FAB trigger
 * Feature: 001-mobile-ui-redesign, 032-professional-ui
 *
 * A minimalist quick create section that provides the primary "Create" action
 * accessible within one tap via the FAB, with an optional expanded prompt input.
 * Uses design system tokens for consistent styling.
 */

import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "@/lib/motion";
import { Sparkles, Plus, Music2, Mic2, Guitar, Wand2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/contexts/TelegramContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { glass } from "@/lib/glass";

interface HomeQuickCreateProps {
  onCreateClick: (mode?: "track" | "riff" | "cover" | "remix") => void;
  className?: string;
}

export const HomeQuickCreate = memo(function HomeQuickCreate({ onCreateClick, className }: HomeQuickCreateProps) {
  const { t } = useTranslation();
  const { hapticFeedback } = useTelegram();
  const reducedMotion = useReducedMotion();
  const [isExpanded] = useState(false);

  const handleCreate = useCallback(
    (mode?: "track" | "riff" | "cover" | "remix") => {
      hapticFeedback("medium");
      onCreateClick(mode);
    },
    [hapticFeedback, onCreateClick],
  );

  const handleFabClick = useCallback(() => {
    handleCreate();
  }, [handleCreate]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl lg:rounded-3xl",
        "bg-gradient-to-br from-primary/12 via-primary/5 to-transparent",
        "border border-primary/25",
        glass.subtle,
        "p-4 sm:p-5 lg:p-6",
        "group noise-overlay",
        className,
      )}
    >
      {/* Background decoration - simplified */}
      <div className="absolute top-0 right-0 w-40 h-40 lg:w-56 lg:h-56 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-primary/15 transition-all duration-500" />
      <div className="absolute bottom-0 left-0 w-32 h-32 lg:w-44 lg:h-44 bg-gradient-to-tr from-generate/8 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with improved visual hierarchy */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 lg:mb-5 gap-3">
          <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
            <motion.div
              className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/40 to-primary/15 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/30"
              animate={reducedMotion ? undefined : { rotate: [0, 4, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary drop-shadow-sm" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight font-display">
                {t("home.quickCreate.title")}
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-snug">
                {t("home.quickCreate.subtitle")}
              </p>
            </div>
          </div>
          {/* Credits cost badge */}
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 lg:px-3 lg:py-1.5 text-[0.625rem] sm:text-xs lg:text-sm font-bold bg-gradient-to-r from-primary/20 to-generate/15 text-primary rounded-full border border-primary/30 whitespace-nowrap shadow-sm">
            <Music2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" aria-hidden="true" />
            {t("home.quickCreate.credits")}
          </span>
        </div>

        {/* Primary action — a single, full-width CTA. Secondary quick actions live in the desktop sidebar and mobile bottom nav. */}
        <div className="flex items-center gap-3 lg:gap-4">
          <Button
            onClick={handleFabClick}
            className={cn(
              "flex-1 h-12 lg:h-14 min-h-touch",
              "bg-gradient-to-r from-primary to-primary/60",
              "text-white font-semibold lg:text-lg",
              "shadow-lg shadow-primary/25 glow-primary",
              "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
              "active:scale-95",
              "transition-all duration-200",
            )}
            aria-label={t("home.quickCreate.fabLabel")}
          >
            <Plus className="w-5 h-5 lg:w-6 lg:h-6 mr-2" aria-hidden="true" />
            Создать трек
          </Button>
        </div>

        {/* Expanded options */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              animate={reducedMotion ? undefined : { height: "auto", opacity: 1 }}
              exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden"
            >
              <div className="mt-3 lg:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {[
                  {
                    Icon: Music2,
                    label: t("home.quickCreate.track"),
                    description: t("home.quickCreate.trackDesc"),
                    mode: "track" as const,
                  },
                  {
                    Icon: Guitar,
                    label: t("home.quickCreate.riff"),
                    description: t("home.quickCreate.riffDesc"),
                    mode: "riff" as const,
                  },
                  {
                    Icon: Mic2,
                    label: t("home.quickCreate.cover"),
                    description: t("home.quickCreate.coverDesc"),
                    mode: "cover" as const,
                  },
                  {
                    Icon: Wand2,
                    label: t("home.quickCreate.remix"),
                    description: t("home.quickCreate.remixDesc"),
                    mode: "remix" as const,
                  },
                ].map((opt, i) => (
                  <motion.div
                    key={opt.label}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ delay: reducedMotion ? 0 : 0.08 + i * 0.04, duration: 0.25 }}
                  >
                    <QuickCreateOption
                      Icon={opt.Icon}
                      label={opt.label}
                      description={opt.description}
                      onClick={() => handleCreate(opt.mode)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

interface QuickCreateOptionProps {
  Icon: typeof Music2;
  label: string;
  description: string;
  onClick: () => void;
}

const QuickCreateOption = memo(function QuickCreateOption({
  Icon,
  label,
  description,
  onClick,
}: QuickCreateOptionProps) {
  const { hapticFeedback } = useTelegram();

  const handleClick = useCallback(() => {
    hapticFeedback("light");
    onClick();
  }, [hapticFeedback, onClick]);

  return (
    <button
      onClick={handleClick}
      aria-label={`${label}: ${description}`}
      className={cn(
        "flex flex-col items-center justify-center min-h-[44px] min-w-[44px]",
        "p-3 lg:p-4 rounded-xl lg:rounded-2xl",
        "bg-card/50",
        "border border-border/40",
        "hover:bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        "active:scale-95 motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
        "transition-all duration-150",
        "group",
      )}
    >
      <Icon
        className="w-5 h-5 lg:w-6 lg:h-6 mb-1 lg:mb-2 text-primary group-hover:scale-110 motion-reduce:group-hover:scale-100 transition-transform"
        aria-hidden="true"
      />
      <span className="text-xs lg:text-sm font-medium text-foreground">{label}</span>
      <span className="text-[0.625rem] lg:text-xs text-muted-foreground">{description}</span>
    </button>
  );
});
