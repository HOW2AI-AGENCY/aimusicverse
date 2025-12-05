import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col"
      >
        {/* Header with progress */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Пропустить
            <X className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-1 rounded-none" />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full text-center space-y-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <StepIcon className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 pt-4">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    hapticImpact('light');
                    useOnboarding.getState().goToStep(index);
                  }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStep 
                      ? "bg-primary w-6" 
                      : index < currentStep 
                        ? "bg-primary/50" 
                        : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Navigation buttons */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Назад
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
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
