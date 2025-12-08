import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from './onboardingSteps';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

export function OnboardingOverlay() {
  const navigate = useNavigate();
  const { 
    isActive, 
    currentStep, 
    nextStep, 
    prevStep, 
    skipOnboarding, 
    completeOnboarding 
  } = useOnboarding();

  const totalSteps = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Navigate to route if step has one
  useEffect(() => {
    if (isActive && step?.route) {
      navigate(step.route);
    }
  }, [isActive, currentStep, step?.route, navigate]);

  const handleNext = () => {
    hapticImpact('light');
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    hapticImpact('light');
    prevStep();
  };

  const handleSkip = () => {
    hapticImpact('medium');
    skipOnboarding();
  };

  if (!isActive || !step) return null;

  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col"
      >
        {/* Header with progress */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            Пропустить
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar - animated */}
        <div className="h-1 bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-md w-full text-center space-y-6"
          >
            {/* Icon with animated background */}
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="relative mx-auto"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-generate/20 flex items-center justify-center shadow-xl shadow-primary/10">
                <StepIcon className="w-12 h-12 text-primary" />
              </div>
              {/* Floating accent */}
              <motion.div
                animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-generate/30 blur-sm"
              />
            </motion.div>

            {/* Title with gradient */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground leading-relaxed text-base"
            >
              {step.description}
            </motion.p>

            {/* Step indicators - interactive dots */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center gap-2 pt-4"
            >
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    hapticImpact('light');
                    useOnboarding.getState().goToStep(index);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 hover:scale-110",
                    index === currentStep 
                      ? "bg-primary w-8" 
                      : index < currentStep 
                        ? "bg-primary/50 w-2 hover:bg-primary/70" 
                        : "bg-muted-foreground/20 w-2 hover:bg-muted-foreground/40"
                  )}
                  aria-label={`Перейти к шагу ${index + 1}`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Navigation buttons - enhanced */}
        <div className="p-4 border-t border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="flex-1 h-12 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Назад
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              {isLastStep ? (
                <>
                  Начать
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
      </motion.div>
    </AnimatePresence>
  );
}
