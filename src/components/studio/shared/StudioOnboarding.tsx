/**
 * Studio Onboarding Flow
 * Step-by-step tutorial for first-time studio users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Split, Scissors, Wand2, Volume2, GitBranch, 
  ChevronRight, ChevronLeft, X, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: string; // CSS selector for highlighting
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Добро пожаловать в Студию!',
    description: 'Здесь вы можете редактировать треки: разделять на стемы, заменять секции, создавать ремиксы и многое другое.',
  },
  {
    id: 'stems',
    icon: Split,
    title: 'Разделение на стемы',
    description: 'Разделите трек на отдельные дорожки: вокал, барабаны, бас и мелодию. Это откроет профессиональные возможности микширования.',
  },
  {
    id: 'sections',
    icon: Scissors,
    title: 'Замена секций',
    description: 'Не нравится куплет или припев? Выберите секцию на таймлайне и AI перегенерирует её с вашими указаниями.',
  },
  {
    id: 'creation',
    icon: Wand2,
    title: 'Создание новых версий',
    description: 'Создавайте ремиксы, расширяйте треки, заменяйте вокал или аранжировку — всё с помощью AI.',
  },
  {
    id: 'versions',
    icon: GitBranch,
    title: 'История версий',
    description: 'Все изменения сохраняются как отдельные версии. Переключайтесь между ними и выбирайте лучшую.',
  },
  {
    id: 'mixer',
    icon: Volume2,
    title: 'Микширование',
    description: 'После разделения на стемы управляйте громкостью каждой дорожки, применяйте эффекты и создавайте уникальный микс.',
  },
];

interface StudioOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const STORAGE_KEY = 'studio_onboarding_completed';

export function StudioOnboarding({
  open,
  onOpenChange,
  onComplete,
}: StudioOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
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
    onOpenChange(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onOpenChange(false);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleSkip();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md bg-card rounded-2xl shadow-xl border overflow-hidden"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 z-10"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Content */}
          <div className="p-6 pt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold mb-2">{step.title}</h2>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-4">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentStep
                    ? "w-6 bg-primary"
                    : idx < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/30">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </Button>

            <Badge variant="secondary" className="font-mono">
              {currentStep + 1}/{ONBOARDING_STEPS.length}
            </Badge>

            <Button onClick={handleNext} className="gap-1">
              {isLastStep ? 'Начать' : 'Далее'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useStudioOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding,
  };
}
