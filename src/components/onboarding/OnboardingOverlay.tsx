import { useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Sparkles, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from './onboardingSteps';
import { TutorialStep } from './TutorialStep';
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
    completeOnboarding,
    goToStep
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

  const handleTryNow = () => {
    hapticImpact('medium');
    if (step?.route) {
      skipOnboarding();
      navigate(step.route);
    }
  };

  if (!isActive || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-medium">
                {currentStep + 1} из {totalSteps}
              </span>
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <SkipForward className="w-4 h-4" />
            Пропустить
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary to-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Content - now using TutorialStep */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            <TutorialStep
              step={step}
              stepNumber={currentStep + 1}
              totalSteps={totalSteps}
              onTryNow={handleTryNow}
            />
            
            {/* Step indicators */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-1.5 pt-6 flex-wrap max-w-full"
            >
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    hapticImpact('light');
                    goToStep(index);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 hover:scale-110",
                    index === currentStep 
                      ? "bg-primary w-6" 
                      : index < currentStep 
                        ? "bg-primary/50 w-2 hover:bg-primary/70" 
                        : "bg-muted-foreground/20 w-2 hover:bg-muted-foreground/40"
                  )}
                  aria-label={`Шаг ${index + 1}`}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Navigation */}
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
