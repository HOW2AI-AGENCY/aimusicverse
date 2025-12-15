import * as React from "react";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "./button";

interface GuidedTourStep {
  /** Unique step ID */
  id: string;
  /** Target element selector */
  target?: string;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Position relative to target */
  position?: "top" | "bottom" | "left" | "right";
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuidedTourProps {
  /** Tour steps */
  steps: GuidedTourStep[];
  /** Tour ID for localStorage */
  tourId: string;
  /** Callback when tour completes */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
  /** Show only once */
  showOnce?: boolean;
  /** Start automatically */
  autoStart?: boolean;
  /** Delay before starting (ms) */
  startDelay?: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  tourId,
  onComplete,
  onSkip,
  showOnce = true,
  autoStart = true,
  startDelay = 1000,
}) => {
  const [isActive, setIsActive] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const storageKey = `tour-completed-${tourId}`;

  React.useEffect(() => {
    if (!autoStart) return;

    if (showOnce) {
      const completed = localStorage.getItem(storageKey);
      if (completed) return;
    }

    const timer = setTimeout(() => {
      setIsActive(true);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [autoStart, showOnce, startDelay, storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
    onComplete?.();
  };

  const handleSkip = () => {
    setIsActive(false);
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
    onSkip?.();
  };

  if (!isActive || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200"
        onClick={handleSkip}
      />

      {/* Tour card */}
      <div className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-popover border border-border rounded-2xl shadow-2xl p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Шаг {currentStep + 1} из {steps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 -mt-2"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {step.description}
          </p>

          {/* Action button if provided */}
          {step.action && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full mb-4"
              onClick={step.action.onClick}
            >
              {step.action.label}
            </Button>
          )}

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={isFirst}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              {isLast ? "Готово" : "Далее"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Feature spotlight component for highlighting new features
interface FeatureSpotlightProps {
  /** Feature ID for localStorage */
  featureId: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Position relative to children */
  position?: "top" | "bottom" | "left" | "right";
  /** Show only once */
  showOnce?: boolean;
  /** Delay before showing (ms) */
  showDelay?: number;
  children: React.ReactNode;
}

export const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  featureId,
  title,
  description,
  position = "bottom",
  showOnce = true,
  showDelay = 500,
  children,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const storageKey = `spotlight-seen-${featureId}`;

  React.useEffect(() => {
    if (showOnce) {
      const seen = localStorage.getItem(storageKey);
      if (seen) return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [showOnce, showDelay, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block">
      {/* Pulsing ring around children */}
      {isVisible && (
        <div className="absolute inset-0 -m-1 rounded-xl ring-2 ring-primary animate-pulse pointer-events-none" />
      )}

      {children}

      {/* Spotlight tooltip */}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 w-64 animate-in fade-in-0 zoom-in-95 duration-200",
            positionClasses[position]
          )}
        >
          <div className="bg-popover border border-primary/20 rounded-xl shadow-lg shadow-primary/10 p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs"
              onClick={handleDismiss}
            >
              Понятно
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
