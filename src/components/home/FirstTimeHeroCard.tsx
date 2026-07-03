/**
 * FirstTimeHeroCard - Hero section for new users
 * Feature: 032-professional-ui
 *
 * Shows step-by-step guide and primary CTA
 * Uses design system glass tokens
 */

import { memo } from "react";
import { motion } from "@/lib/motion";
import { Sparkles, Music2, Headphones } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glass, gradientGlass } from "@/lib/glass";
import { useMotionPreference } from "@/hooks/useReducedMotion";

interface FirstTimeHeroCardProps {
  onCreateClick: () => void;
  className?: string;
}

const STEPS = [
  {
    number: 1,
    title: "Опиши музыку",
    description: "Жанр, настроение, инструменты",
    icon: Music2,
  },
  {
    number: 2,
    title: "Подожди 2-3 минуты",
    description: "AI создаёт твой трек",
    icon: Sparkles,
  },
  {
    number: 3,
    title: "Слушай и редактируй",
    description: "Получи 2 варианта на выбор",
    icon: Headphones,
  },
];

export const FirstTimeHeroCard = memo(function FirstTimeHeroCard({ onCreateClick, className }: FirstTimeHeroCardProps) {
  const { safeTransition } = useMotionPreference();

  return (
    <section className={cn("relative overflow-hidden rounded-2xl noise-overlay mesh-hero", className)}>
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-generate/10" />

      {/* Animated glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={safeTransition({ duration: 4, repeat: Infinity, ease: "easeInOut" })}
      />

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6">
        {/* Welcome badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-3 sm:mb-4"
        >
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/15 text-primary text-[11px] sm:text-xs font-medium border border-primary/20">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Добро пожаловать в MusicVerse AI
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl font-bold text-foreground text-center mb-1.5 sm:mb-2 text-balance"
        >
          Создай свой первый трек
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground text-center mb-4 sm:mb-5 text-balance"
        >
          Три простых шага до профессионального звучания
        </motion.p>

        {/* Steps - compact grid on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 sm:space-y-3 mb-4 sm:mb-5"
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
              className={cn("flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl", glass.subtle)}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-medium text-primary">Шаг {step.number}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground leading-tight">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button - larger touch target on mobile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="relative overflow-visible">
            <Button
              onClick={onCreateClick}
              size="lg"
              className="w-full h-12 sm:h-11 rounded-xl bg-gradient-to-r from-primary to-generate hover:from-primary/90 hover:to-generate/90 text-white gap-2 shadow-lg text-sm touch-manipulation"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Создать первый трек
            </Button>
            {/* Cost badge - honest pricing */}
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-md shadow-sm z-10">
              10-12 💎
            </span>
          </div>
        </motion.div>

        {/* Tip - hidden on very small screens */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[11px] sm:text-xs text-muted-foreground text-center mt-3 sm:mt-4 hidden xs:block"
        >
          💡 Совет: начни с простого описания, например
          <br />
          <span className="text-primary">"Энергичный рок с электрогитарами"</span>
        </motion.p>
      </div>
    </section>
  );
});
