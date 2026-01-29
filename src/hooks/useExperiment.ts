/**
 * useExperiment Hook
 * 
 * React hook for A/B testing experiment integration.
 * Provides variant assignment and event tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Experiment,
  getVariant,
  assignToExperiment,
  isInVariant,
  isControl,
  trackExperimentEvent,
  trackExperimentConversion,
  isParticipationEnabled,
} from '@/lib/ab-testing';

interface UseExperimentOptions {
  /** Auto-assign if not already assigned */
  autoAssign?: boolean;
  /** Track exposure event on mount */
  trackExposure?: boolean;
}

interface UseExperimentResult {
  /** The assigned variant ID */
  variant: string | null;
  /** Whether user is in control group */
  isControl: boolean;
  /** Check if user is in specific variant */
  isVariant: (variantId: string) => boolean;
  /** Track an event for this experiment */
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => Promise<void>;
  /** Track a conversion for this experiment */
  trackConversion: (goalName: string, value?: number) => Promise<void>;
  /** Loading state while determining variant */
  isLoading: boolean;
}

/**
 * Hook for using A/B experiments in components
 * 
 * @example
 * ```tsx
 * const { variant, isControl, trackConversion } = useExperiment(EXPERIMENTS.ONBOARDING_V2);
 * 
 * // Render based on variant
 * if (isControl) {
 *   return <OriginalOnboarding />;
 * }
 * return <NewOnboarding onComplete={() => trackConversion('onboarding_complete')} />;
 * ```
 */
export function useExperiment(
  experiment: Experiment,
  options: UseExperimentOptions = {}
): UseExperimentResult {
  const { autoAssign = true, trackExposure = true } = options;
  const { user } = useAuth();
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine variant on mount
  useEffect(() => {
    // Skip if participation disabled
    if (!isParticipationEnabled()) {
      setVariant('control');
      setIsLoading(false);
      return;
    }

    // Skip if experiment not running
    if (experiment.status !== 'running') {
      setVariant(null);
      setIsLoading(false);
      return;
    }

    // Get existing assignment or auto-assign
    let assignedVariant = getVariant(experiment.id);
    
    if (!assignedVariant && autoAssign) {
      assignedVariant = assignToExperiment(experiment, user?.id);
    }

    setVariant(assignedVariant);
    setIsLoading(false);

    // Track exposure
    if (trackExposure && assignedVariant) {
      trackExperimentEvent(experiment.id, 'exposure');
    }
  }, [experiment, autoAssign, trackExposure, user?.id]);

  // Check if in specific variant
  const checkIsVariant = useCallback(
    (variantId: string) => isInVariant(experiment.id, variantId),
    [experiment.id]
  );

  // Check if control
  const checkIsControl = useMemo(
    () => variant === null || isControl(experiment.id),
    [experiment.id, variant]
  );

  // Track event
  const handleTrackEvent = useCallback(
    async (eventName: string, metadata?: Record<string, unknown>) => {
      await trackExperimentEvent(experiment.id, eventName, metadata);
    },
    [experiment.id]
  );

  // Track conversion
  const handleTrackConversion = useCallback(
    async (goalName: string, value?: number) => {
      await trackExperimentConversion(experiment.id, goalName, value);
    },
    [experiment.id]
  );

  return {
    variant,
    isControl: checkIsControl,
    isVariant: checkIsVariant,
    trackEvent: handleTrackEvent,
    trackConversion: handleTrackConversion,
    isLoading,
  };
}

/**
 * Simple hook for feature-flag style experiments
 * Returns true if user is in treatment variant
 */
export function useExperimentEnabled(experiment: Experiment): boolean {
  const { variant, isControl, isLoading } = useExperiment(experiment);
  
  // Default to control (disabled) while loading
  if (isLoading) return false;
  
  // Enabled if not in control
  return !isControl && variant !== null;
}

export default useExperiment;
