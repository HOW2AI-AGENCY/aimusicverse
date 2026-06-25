import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Radio, Sliders, Zap, Music2, Settings2, Sparkles, ChevronRight, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backdrop } from "@/lib/overlay-colors";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: <Music2 className="w-8 h-8" />,
    title: "Добро пожаловать в PromptDJ",
    description:
      "Создавайте музыку в реальном времени, управляя параметрами как настоящий диджей. Микшируйте жанры, инструменты и настроения для уникального звучания.",
    tip: "PromptDJ использует AI для генерации музыки на основе ваших настроек",
  },
  {
    id: "knobs",
    icon: <Sliders className="w-8 h-8" />,
    title: "Регуляторы микшера",
    description:
      "Каждый регулятор управляет отдельным аспектом музыки: жанр, инструменты, настроение, энергия, текстура и стиль. Крутите их для изменения звучания.",
    tip: "Значение 0-100 определяет интенсивность каждого параметра",
  },
  {
    id: "presets",
    icon: <Sparkles className="w-8 h-8" />,
    title: "Быстрые пресеты",
    description:
      "Используйте готовые пресеты для мгновенной настройки всех параметров. Отличная отправная точка для экспериментов!",
    tip: "Нажмите на пресет чтобы применить его настройки",
  },
  {
    id: "live-mode",
    icon: <Radio className="w-8 h-8" />,
    title: "Live-режим",
    description:
      "Активируйте Live-режим для непрерывной генерации. Музыка будет автоматически продолжаться при изменении настроек — управляйте потоком в реальном времени!",
    tip: "В Live-режиме изменения применяются с задержкой 2 секунды",
  },
  {
    id: "flow",
    icon: <Zap className="w-8 h-8" />,
    title: "Управление потоком",
    description:
      "Создавайте полноценные треки: начните с низкой энергии для вступления, повышайте для кульминации, снижайте для затухания.",
    tip: 'Регулятор "Энергия" — ключ к динамике трека',
  },
  {
    id: "settings",
    icon: <Settings2 className="w-8 h-8" />,
    title: "Глобальные настройки",
    description: "Откройте настройки для управления BPM, тональностью, плотностью и яркостью звучания.",
    tip: "Эти параметры влияют на весь микс целиком",
  },
];

interface PromptDJOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function PromptDJOnboarding({ onComplete, onSkip }: PromptDJOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("promptdj-onboarding-completed", "true");
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("promptdj-onboarding-completed", "true");
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", backdrop.dark, "backdrop-blur-sm")}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : index < currentStep ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={handleSkip} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                {step.icon}
              </div>

              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground mb-4">{step.description}</p>

              {step.tip && (
                <div className="w-full p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-primary">💡 {step.tip}</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>

          <Button onClick={handleNext} className="gap-1">
            {isLastStep ? "Начать" : "Далее"}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hook to manage onboarding state
export function usePromptDJOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("promptdj-onboarding-completed");
    if (!completed) {
      // Small delay to let the UI load first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem("promptdj-onboarding-completed");
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, resetOnboarding };
}
