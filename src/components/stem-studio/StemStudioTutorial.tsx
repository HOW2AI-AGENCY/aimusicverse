import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, ChevronRight, ChevronLeft, Waves, Volume2, VolumeX, FileMusic, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать в Stem Studio!',
    description: 'Здесь вы можете микшировать отдельные дорожки (стемы) вашего трека: вокал, ударные, бас и другие инструменты.',
    icon: Waves,
  },
  {
    id: 'waveform',
    title: 'Визуализация Waveform',
    description: 'Каждый стем отображает форму волны в реальном времени. Кликните на waveform, чтобы перейти к нужному моменту.',
    icon: Waves,
    tip: 'Цвет waveform соответствует типу стема',
  },
  {
    id: 'mute-solo',
    title: 'Mute и Solo',
    description: 'Кнопка [M] отключает звук стема, [S] — солирует (заглушает все остальные). Комбинируйте для создания идеального микса.',
    icon: VolumeX,
    tip: 'Solo отключает все стемы кроме выбранного',
  },
  {
    id: 'volume',
    title: 'Регулировка громкости',
    description: 'Используйте слайдеры для точной настройки громкости каждого стема. Master-слайдер управляет общей громкостью.',
    icon: Volume2,
  },
  {
    id: 'midi',
    title: 'MIDI Транскрипция',
    description: 'Конвертируйте аудио в MIDI для использования в DAW. Нажмите кнопку MIDI в шапке для создания MIDI-файла.',
    icon: FileMusic,
    tip: 'MT3 — точнее, Basic Pitch — быстрее',
  },
  {
    id: 'shortcuts',
    title: 'Горячие клавиши',
    description: 'Space — воспроизведение, M — mute всех, ← → — перемотка на 10 секунд. Используйте для быстрой работы.',
    icon: Keyboard,
    tip: 'Работают когда фокус не на input',
  },
];

const STORAGE_KEY = 'stem-studio-tutorial-completed';

interface StemStudioTutorialProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function StemStudioTutorial({ forceShow = false, onComplete }: StemStudioTutorialProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
      return;
    }

    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      // Show after short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Waves className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Обучение • {currentStep + 1}/{TUTORIAL_STEPS.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="w-8 h-8 text-primary" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {step.tip && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-primary font-medium">
                      💡 {step.tip}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pb-4">
              {TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStep 
                      ? "bg-primary w-6" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Пропустить
              </Button>

              <Button onClick={handleNext} className="gap-1">
                {currentStep === TUTORIAL_STEPS.length - 1 ? 'Готово' : 'Далее'}
                {currentStep < TUTORIAL_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage tutorial state
export function useStemStudioTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const resetTutorial = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    setShowTutorial,
    startTutorial,
    resetTutorial,
  };
}
