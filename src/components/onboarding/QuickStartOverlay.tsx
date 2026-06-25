/**
 * QuickStartOverlay - Action-first onboarding for new users
 * 3-screen flow: Welcome → Choose Path → Quick Action
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Sparkles, Headphones, BookOpen, ArrowRight, Music2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserJourneyStore } from "@/hooks/useUserJourneyState";
import { hapticImpact, hapticNotification } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { TELEGRAM_SAFE_AREA } from "@/constants/safe-area";

type QuickStartStep = "welcome" | "choose-path" | "quick-create";
type UserPath = "create" | "listen" | "tour";

interface QuickStartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGeneration: () => void;
  onStartListening: () => void;
  onStartTour: () => void;
}

const QUICK_PRESETS = [
  { label: "🎸 Рок", prompt: "Энергичный рок с электрогитарами" },
  { label: "💃 Поп", prompt: "Танцевальный поп-трек с запоминающимся припевом" },
  { label: "🎹 Пианино", prompt: "Спокойная мелодия на фортепиано" },
  { label: "🎤 R&B", prompt: "Чувственный R&B с мягким бит" },
];

export function QuickStartOverlay({
  isOpen,
  onClose,
  onStartGeneration,
  onStartListening,
  onStartTour,
}: QuickStartOverlayProps) {
  const [step, setStep] = useState<QuickStartStep>("welcome");
  const [selectedPath, setSelectedPath] = useState<UserPath | null>(null);
  const { markQuickStartCompleted } = useUserJourneyStore();

  const handleSkip = useCallback(() => {
    hapticImpact("medium");
    markQuickStartCompleted();
    onClose();
  }, [markQuickStartCompleted, onClose]);

  const handlePathSelect = useCallback(
    (path: UserPath) => {
      hapticImpact("light");
      setSelectedPath(path);

      if (path === "listen") {
        markQuickStartCompleted();
        onStartListening();
        onClose();
      } else if (path === "tour") {
        markQuickStartCompleted();
        onStartTour();
        onClose();
      } else {
        setStep("quick-create");
      }
    },
    [markQuickStartCompleted, onStartListening, onStartTour, onClose],
  );

  const handlePresetSelect = useCallback(
    (prompt: string) => {
      hapticNotification("success");
      markQuickStartCompleted();
      onStartGeneration();
      onClose();
    },
    [markQuickStartCompleted, onStartGeneration, onClose],
  );

  const handleCustomCreate = useCallback(() => {
    hapticImpact("light");
    markQuickStartCompleted();
    onStartGeneration();
    onClose();
  }, [markQuickStartCompleted, onStartGeneration, onClose]);

  // Auto-progress from welcome after delay
  const handleWelcomeComplete = useCallback(() => {
    hapticImpact("light");
    setStep("choose-path");
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-system bg-background"
      style={{ paddingTop: TELEGRAM_SAFE_AREA.minimalTop }}
    >
      {/* Skip button - increased touch target to 44px */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className="absolute top-4 right-4 z-10 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-muted/50 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ marginTop: TELEGRAM_SAFE_AREA.minimalTop }}
        aria-label="Пропустить онбординг"
      >
        <X className="w-5 h-5" />
      </motion.button>

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full flex flex-col items-center justify-center px-6 pb-20"
          >
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-generate flex items-center justify-center mb-6 shadow-xl"
            >
              <Music2 className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-center mb-2"
            >
              MusicVerse AI
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground text-center mb-8"
            >
              Создавай музыку с помощью AI
            </motion.p>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={handleWelcomeComplete}
                size="lg"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary to-generate text-white gap-2"
              >
                Начнём
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Choose Path */}
        {step === "choose-path" && (
          <motion.div
            key="choose-path"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full flex flex-col items-center justify-center px-6 pb-20"
          >
            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Как начнём?
            </motion.h2>

            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-muted-foreground text-center mb-8"
            >
              Выбери удобный способ знакомства
            </motion.p>

            <div className="w-full max-w-sm space-y-3">
              {/* Create with AI */}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => handlePathSelect("create")}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-generate/20 to-generate/5 border border-generate/30 text-left hover:border-generate/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-generate/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-generate" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Создать с AI</h3>
                    <p className="text-sm text-muted-foreground">
                      Опиши музыку текстом — AI сделает трек за 2-3 минуты
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-generate transition-colors shrink-0 mt-3" />
                </div>
              </motion.button>

              {/* Listen to examples */}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => handlePathSelect("listen")}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 text-left hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Послушать примеры</h3>
                    <p className="text-sm text-muted-foreground">Узнай, что создают другие пользователи</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-3" />
                </div>
              </motion.button>

              {/* Tour */}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => handlePathSelect("tour")}
                className="w-full p-4 rounded-2xl bg-muted/50 border border-border text-left hover:border-border/80 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">Как это работает?</h3>
                    <p className="text-sm text-muted-foreground">Быстрый тур по возможностям платформы</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-3" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Quick Create */}
        {step === "quick-create" && (
          <motion.div
            key="quick-create"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full flex flex-col items-center justify-center px-6 pb-20"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-generate to-generate/60 flex items-center justify-center mb-4 shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <motion.h2
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Выбери стиль
            </motion.h2>

            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-muted-foreground text-center mb-6"
            >
              Или напиши своё описание
            </motion.p>

            {/* Quick presets */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-2 w-full max-w-sm mb-6"
            >
              {QUICK_PRESETS.map((preset, i) => (
                <motion.button
                  key={preset.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  onClick={() => handlePresetSelect(preset.prompt)}
                  className="p-4 rounded-xl bg-muted/50 border border-border hover:border-generate/50 hover:bg-generate/5 transition-all text-center"
                >
                  <span className="text-lg font-medium">{preset.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Custom creation button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-sm"
            >
              <Button
                onClick={handleCustomCreate}
                variant="outline"
                size="lg"
                className="w-full h-12 rounded-xl border-dashed"
              >
                Написать своё описание
              </Button>
            </motion.div>

            {/* Back button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => setStep("choose-path")}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Назад к выбору
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator - moved higher to avoid keyboard overlap */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 pb-safe">
        {["welcome", "choose-path", "quick-create"].map((s, i) => (
          <button
            key={s}
            onClick={() => {
              if (s === "welcome") setStep("welcome");
              else if (s === "choose-path" && step !== "welcome") setStep("choose-path");
            }}
            className={cn(
              "h-2 rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center",
              step === s ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30",
            )}
            aria-label={`Шаг ${i + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
