/**
 * Progress Steps Component
 * Feature: 032-professional-ui
 *
 * Horizontal stepper for multi-step processes
 */

import React, { ReactNode } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "@/lib/icons";

interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  variant?: "default" | "compact" | "vertical";
  allowClickPrevious?: boolean;
  className?: string;
}

export function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
  variant = "default",
  allowClickPrevious = true,
  className,
}: ProgressStepsProps) {
  const isVertical = variant === "vertical";
  const isCompact = variant === "compact";

  const handleStepClick = (index: number) => {
    if (!onStepClick) return;
    if (allowClickPrevious && index < currentStep) {
      onStepClick(index);
    }
  };

  return (
    <div className={cn("flex", isVertical ? "flex-col gap-4" : "items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = allowClickPrevious && index < currentStep && onStepClick;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className={cn(
              "flex",
              isVertical ? "flex-row items-start gap-3" : "flex-1 items-center",
              !isVertical && index < steps.length - 1 && "relative",
            )}
          >
            {/* Step circle */}
            <motion.button
              onClick={() => handleStepClick(index)}
              disabled={!isClickable}
              className={cn(
                "relative z-10 flex items-center justify-center",
                "rounded-full transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                // Sizes
                isCompact ? "w-6 h-6 text-xs" : "w-10 h-10 text-sm",
                // States
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                // Clickable
                isClickable && "cursor-pointer hover:bg-primary/80",
              )}
              whileTap={isClickable ? { scale: 0.95 } : undefined}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check className={cn(isCompact ? "w-3 h-3" : "w-5 h-5")} />
                </motion.div>
              ) : Icon ? (
                <Icon className={cn(isCompact ? "w-3 h-3" : "w-5 h-5")} />
              ) : (
                <span className="font-medium">{index + 1}</span>
              )}
            </motion.button>

            {/* Labels (not compact) */}
            {!isCompact && (
              <div className={cn(isVertical ? "flex-1" : "hidden md:block ml-2 mr-4")}>
                <p
                  className={cn(
                    "font-medium text-sm",
                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
              </div>
            )}

            {/* Connector line (horizontal) */}
            {!isVertical && index < steps.length - 1 && (
              <div className="flex-1 relative h-0.5 mx-2">
                <div className="absolute inset-0 bg-muted rounded-full" />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            )}

            {/* Connector line (vertical) */}
            {isVertical && index < steps.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-8 -translate-x-1/2">
                <div className="absolute inset-0 bg-muted rounded-full" />
                <motion.div
                  className="absolute inset-x-0 top-0 bg-primary rounded-full"
                  initial={{ height: 0 }}
                  animate={{ height: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Progress Bar with Steps
 * Simpler alternative showing just the progress
 */
interface ProgressBarStepsProps {
  totalSteps: number;
  currentStep: number;
  showLabels?: boolean;
  labels?: string[];
  className?: string;
}

export function ProgressBarSteps({
  totalSteps,
  currentStep,
  showLabels = false,
  labels = [],
  className,
}: ProgressBarStepsProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={cn("w-2 h-2 rounded-full transition-colors", index <= currentStep ? "bg-primary" : "bg-muted")}
            />
            {showLabels && labels[index] && (
              <span className={cn("text-xs mt-1", index <= currentStep ? "text-foreground" : "text-muted-foreground")}>
                {labels[index]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressSteps;
