/**
 * FeatureTutorialDialog - Interactive tutorial popup with carousel
 *
 * Shows feature tips as a slideshow with animations
 * Triggered from DailyTipCard on homepage
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Music2,
  Layers,
  Wand2,
  Mic2,
  Library,
  Share2,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedDialog } from "@/components/dialog";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptic";

export interface TutorialSlide {
  id: string;
  icon: React.ElementType;
  emoji?: string;
  title: string;
  description: string;
  features?: string[];
  tip?: string;
  image?: string;
}

interface FeatureTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  slides: TutorialSlide[];
  onComplete?: () => void;
}

function TutorialCarousel({ slides, onComplete }: { slides: TutorialSlide[]; onComplete?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentSlide = slides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === slides.length - 1;
  const progress = ((currentIndex + 1) / slides.length) * 100;

  const goNext = useCallback(() => {
    hapticImpact("light");
    if (isLast) {
      onComplete?.();
    } else {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLast, onComplete]);

  const goPrev = useCallback(() => {
    hapticImpact("light");
    if (!isFirst) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [isFirst]);

  const goToSlide = useCallback(
    (index: number) => {
      hapticImpact("light");
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/60"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-hidden p-6 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full flex flex-col"
          >
            {/* Icon header */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10"
              >
                {currentSlide.emoji ? (
                  <span className="text-2xl">{currentSlide.emoji}</span>
                ) : (
                  <currentSlide.icon className="w-7 h-7 text-primary" />
                )}
              </motion.div>

              <div>
                <Badge variant="outline" className="mb-1 text-[0.625rem]">
                  {currentIndex + 1} из {slides.length}
                </Badge>
                <h3 className="text-lg font-bold leading-tight">{currentSlide.title}</h3>
              </div>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground leading-relaxed mb-4"
            >
              {currentSlide.description}
            </motion.p>

            {/* Features list */}
            {currentSlide.features && currentSlide.features.length > 0 && (
              <ul className="space-y-2 mb-4 flex-1">
                {currentSlide.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-foreground/80">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Tip callout */}
            {currentSlide.tip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mt-auto"
              >
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary/90 leading-relaxed">
                  <span className="font-semibold">Совет:</span> {currentSlide.tip}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-primary w-6"
                : index < currentIndex
                  ? "bg-primary/40 w-2 hover:bg-primary/60"
                  : "bg-muted-foreground/20 w-2 hover:bg-muted-foreground/40",
            )}
            aria-label={`Слайд ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 p-4 border-t border-border/50">
        <Button variant="outline" onClick={goPrev} disabled={isFirst} className="flex-1 h-11 rounded-xl">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Назад
        </Button>
        <Button
          onClick={goNext}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isLast ? (
            <>
              Понятно
              <Check className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Далее
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function FeatureTutorialDialog({ open, onOpenChange, title, slides, onComplete }: FeatureTutorialDialogProps) {
  const handleComplete = useCallback(() => {
    onComplete?.();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  return (
    <UnifiedDialog variant="modal" open={open} onOpenChange={onOpenChange} title={title}>
      <TutorialCarousel slides={slides} onComplete={handleComplete} />
    </UnifiedDialog>
  );
}

// Predefined tutorial sets
export const TUTORIAL_SLIDES = {
  generation: [
    {
      id: "gen-1",
      icon: Music2,
      emoji: "🎵",
      title: "AI-генерация музыки",
      description: "Создавайте уникальные треки за секунды. Просто опишите желаемый стиль и настроение.",
      features: ["Поддержка 50+ музыкальных жанров", "Автоматическое создание текста", "A/B версии для сравнения"],
      tip: 'Начните с простого описания: "энергичный поп-трек"',
    },
    {
      id: "gen-2",
      icon: Wand2,
      emoji: "⚡",
      title: "Быстрые пресеты",
      description: "Используйте готовые пресеты для мгновенного старта генерации без ввода промптов.",
      features: ["Rock, Pop, Hip-Hop, Electronic и другие", "Настраиваемые параметры", "Создание своих пресетов"],
      tip: "Свайпните горизонтально для просмотра всех пресетов",
    },
  ] as TutorialSlide[],

  studio: [
    {
      id: "studio-1",
      icon: Layers,
      emoji: "🎛️",
      title: "Stem Studio",
      description: "Разделяйте любой трек на отдельные дорожки: вокал, ударные, бас, инструменты.",
      features: ["AI-разделение за 30 секунд", "Независимое управление громкостью", "Экспорт отдельных стемов"],
      tip: "Попробуйте приглушить вокал для караоке-версии",
    },
    {
      id: "studio-2",
      icon: Mic2,
      emoji: "🎤",
      title: "Запись и наложение",
      description: "Записывайте свой вокал или инструменты прямо поверх трека.",
      features: ["Живая запись с мониторингом", "Автоопределение аккордов", "Синхронизация с треком"],
    },
  ] as TutorialSlide[],

  library: [
    {
      id: "lib-1",
      icon: Library,
      emoji: "📚",
      title: "Библиотека треков",
      description: "Все ваши треки в одном месте с удобной сортировкой и поиском.",
      features: ["Фильтры по жанру и дате", "Быстрый поиск по названию", "Группировка в плейлисты"],
      tip: "Свайп влево добавляет трек в очередь воспроизведения",
    },
    {
      id: "lib-2",
      icon: Share2,
      emoji: "🚀",
      title: "Шеринг и экспорт",
      description: "Делитесь треками в Telegram, скачивайте в разных форматах.",
      features: ["Публикация в Telegram Stories", "Экспорт в MP3/WAV", "Генерация QR-кода для шеринга"],
    },
  ] as TutorialSlide[],
};

export default FeatureTutorialDialog;
