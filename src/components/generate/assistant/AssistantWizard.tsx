import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { StepPrompt } from './StepPrompt';
import { StepStyle } from './StepStyle';
import { StepLyrics } from './StepLyrics';
import { StepReference } from './StepReference';
import { StepReview } from './StepReview';
import { ProgressIndicator } from './ProgressIndicator';
import { useAssistantForm } from '@/hooks/useAssistantForm';
import { cn } from '@/lib/utils';

interface AssistantWizardProps {
  onComplete: (formData: any) => void;
  onCancel?: () => void;
  className?: string;
}

const STEPS = [
  { id: 1, title: 'Mode', component: StepPrompt },
  { id: 2, title: 'Style', component: StepStyle },
  { id: 3, title: 'Lyrics', component: StepLyrics },
  { id: 4, title: 'Reference', component: StepReference },
  { id: 5, title: 'Review', component: StepReview },
];

export function AssistantWizard({ onComplete, onCancel, className }: AssistantWizardProps) {
  const {
    formState,
    currentStep,
    isStepValid,
    nextStep,
    prevStep,
    goToStep,
    updateField,
    reset,
  } = useAssistantForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepData = STEPS[currentStep - 1];
  const CurrentStepComponent = currentStepData.component;
  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      nextStep();
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      onCancel?.();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formState);
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = isStepValid(currentStep);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card className="p-6 md:p-8">
        <div className="space-y-6">
          {/* Step Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
              <p className="text-sm text-muted-foreground">
                Complete this step to continue
              </p>
            </div>
          </div>

          {/* Step Component */}
          <CurrentStepComponent
            formState={formState}
            updateField={updateField}
            onNext={handleNext}
          />
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="min-w-[120px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              onClick={reset}
              className="text-muted-foreground"
            >
              Reset
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              'Generating...'
            ) : currentStep === STEPS.length ? (
              'Generate'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile: Step Indicator Dots */}
      <div className="flex md:hidden items-center justify-center gap-2">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={cn(
              'h-2 rounded-full transition-all',
              step.id === currentStep
                ? 'w-8 bg-primary'
                : step.id < currentStep
                ? 'w-2 bg-primary/50'
                : 'w-2 bg-muted'
            )}
            aria-label={`Go to step ${step.id}: ${step.title}`}
          />
        ))}
      </div>
    </div>
  );
}
