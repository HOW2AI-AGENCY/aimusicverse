/**
 * Gamification Onboarding
 * 5-step tour explaining the gamification system
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Calendar, Star, Coins, Trophy, BarChart3, 
  ChevronRight, ChevronLeft, X, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTelegram } from '@/contexts/TelegramContext';

const STORAGE_KEY = 'gamification-onboarding-completed';

export interface GamificationOnboardingProps {
  open?: boolean;
  show?: boolean; // Alias for open
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Calendar,
    title: 'Ежедневные чекины',
    description: 'Заходите каждый день и получайте бонусные кредиты! Чем дольше серия — тем больше награда.',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    tip: 'До +7 кредитов за 7-дневную серию',
  },
  {
    icon: Star,
    title: 'Система уровней',
    description: 'Зарабатывайте опыт за каждое действие: генерацию треков, лайки, шеринг. Повышайте уровень!',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    tip: '+20 XP за каждый трек',
  },
  {
    icon: Coins,
    title: 'Кредиты',
    description: 'Кредиты нужны для генерации музыки. Зарабатывайте их активностью или покупайте.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    tip: '10 кредитов = 1 трек',
  },
  {
    icon: Trophy,
    title: 'Достижения',
    description: 'Разблокируйте награды за достижения: первый трек, 100 лайков, 30-дневная серия и другие!',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    tip: 'Секретные достижения ждут вас',
  },
  {
    icon: BarChart3,
    title: 'Лидерборд',
    description: 'Соревнуйтесь с другими музыкантами в 5 категориях: генераторы, популярные, промоутеры и др.',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    tip: 'Топ-10 получают особые награды',
  },
];

export function GamificationOnboarding({ open, show, onComplete }: GamificationOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { hapticFeedback } = useTelegram();
  
  // Support both 'open' and 'show' props
  const shouldShow = open ?? show ?? false;

  useEffect(() => {
    if (shouldShow) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [shouldShow]);

  const handleNext = () => {
    hapticFeedback?.('light');
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    hapticFeedback?.('light');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    hapticFeedback?.('success');
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    hapticFeedback?.('light');
    handleComplete();
  };

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="icon" onClick={handleSkip}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Шаг {currentStep + 1} из {STEPS.length}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs h-6">
                  Пропустить
                </Button>
              </div>
              <Progress value={progress} className="h-1" />
            </div>

            {/* Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {/* Icon Header */}
              <div className={`p-8 bg-gradient-to-br ${step.color}`}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <StepIcon className="w-10 h-10 text-white" />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="p-6 space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold text-center"
                >
                  {step.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-muted-foreground"
                >
                  {step.description}
                </motion.p>

                {/* Tip */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`flex items-center gap-2 p-3 rounded-xl ${step.bgColor}`}
                >
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{step.tip}</span>
                </motion.div>
              </div>

              {/* Navigation */}
              <div className="p-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>

                {/* Step indicators */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, idx) => (
                    <motion.div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentStep 
                          ? 'bg-primary' 
                          : idx < currentStep 
                            ? 'bg-primary/50' 
                            : 'bg-muted'
                      }`}
                      animate={idx === currentStep ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    />
                  ))}
                </div>

                <Button onClick={handleNext} className="gap-1">
                  {currentStep === STEPS.length - 1 ? (
                    <>
                      Готово
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Далее
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useGamificationOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const startOnboarding = () => setShowOnboarding(true);
  const completeOnboarding = () => setShowOnboarding(false);

  const hasCompletedOnboarding = () => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    showOnboarding,
    startOnboarding,
    completeOnboarding,
    hasCompletedOnboarding,
    resetOnboarding,
  };
}
