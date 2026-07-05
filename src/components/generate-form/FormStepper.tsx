/**
 * FormStepper — Sprint 055-B5
 *
 * Sticky progress pill that shows "Step X of Y" for multi-section forms.
 * Uses IntersectionObserver to detect which FormSection is currently visible.
 * Renders as a small floating pill at the top of the form scroll area.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FormStepperProps {
  /** CSS selector for FormSection step containers */
  sectionSelector?: string;
  className?: string;
}

export function FormStepper({ sectionSelector = "[data-step]", className }: FormStepperProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setupObserver = useCallback(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const sections = document.querySelectorAll(sectionSelector);
    if (sections.length === 0) return;

    setTotalSteps(sections.length);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let maxStep = currentStep;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const step = Number(entry.target.getAttribute("data-step"));
            if (step > 0) maxStep = step;
          }
        }

        if (maxRatio > 0) {
          setCurrentStep(maxStep);
        }
      },
      {
        threshold: [0.1, 0.3, 0.5, 0.7],
        rootMargin: "-20% 0px -40% 0px",
      },
    );

    sections.forEach((section) => observerRef.current?.observe(section));
  }, [sectionSelector, currentStep]);

  useEffect(() => {
    // Delay setup to allow DOM to render
    const timer = setTimeout(setupObserver, 100);
    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [setupObserver]);

  if (totalSteps <= 1) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={cn("sticky top-0 z-10 flex justify-center pointer-events-none", className)}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border/40 text-[11px] font-medium text-muted-foreground">
          <span className="text-foreground font-semibold">{currentStep}</span>
          <span>/</span>
          <span>{totalSteps}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
