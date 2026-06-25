/**
 * ProOnboardingDialog - Showcases PRO features to drive conversion
 * Shows after trial activation or when user explores PRO features
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Wand2, Music, Headphones, Download, Zap, ArrowRight, ArrowLeft, Check, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ProOnboardingDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Crown;
  features: string[];
  gradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "stems",
    title: "Stem-сепарация",
    description: "Разделяй треки на отдельные дорожки: вокал, инструменты, барабаны и бас",
    icon: Headphones,
    features: [
      "Выделение вокала из любого трека",
      "Изоляция инструментов",
      "4-дорожечная или 12-дорожечная сепарация",
      "HD качество выходных файлов",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "midi",
    title: "MIDI экспорт",
    description: "Конвертируй генерированную музыку в MIDI для работы в DAW",
    icon: Music,
    features: ["Экспорт мелодии в MIDI", "Аккорды и ноты", "Совместимость с любой DAW", "Редактирование и ремиксы"],
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "quality",
    title: "HD качество",
    description: "Получай треки в максимальном качестве без компрессии",
    icon: Zap,
    features: ["320 kbps MP3 или WAV", "Приоритетная очередь", "Быстрая генерация", "Без водяных знаков"],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "advanced",
    title: "Продвинутые модели",
    description: "Доступ к последним AI-моделям для генерации музыки",
    icon: Wand2,
    features: ["Модель V5 (новейшая)", "Расширенные стили", "Замена секций трека", "AI-ассистент для текстов"],
    gradient: "from-pink-500 to-rose-500",
  },
];

export const ProOnboardingDialog = memo(function ProOnboardingDialog({
  open,
  onClose,
  onComplete,
}: ProOnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete?.();
    onClose();
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title="PRO-функции"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handlePrev}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Назад
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip}>
                Пропустить
              </Button>
            )}
          </div>

          <Button onClick={handleNext} className={cn("bg-gradient-to-r", step.gradient)}>
            {currentStep < totalSteps - 1 ? (
              <>
                Далее
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Начать использовать
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>
      <Progress value={progress} className="h-1 mb-4" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="py-4 space-y-5"
        >
          {/* Icon and title */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br",
                step.gradient,
              )}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-3">
            {step.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br",
                    step.gradient,
                  )}
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </UnifiedDialog>
  );
});
