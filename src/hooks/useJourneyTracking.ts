/**
 * Journey & Funnel Tracking Hook
 * Tracks user journeys through key funnels and analyzes drop-off points
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import * as analyticsApi from '@/api/analytics.api';
import * as analyticsService from '@/services/analytics.service';

// ==========================================
// Types
// ==========================================

export interface FunnelDefinition {
  name: string;
  steps: string[];
  criticalSteps: string[];
  description?: string;
}

export interface FunnelProgress {
  funnel: string;
  currentStep: string;
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: string[];
  isCompleted: boolean;
  startedAt: number;
  lastUpdatedAt: number;
}

export interface DropoffAnalytics {
  funnel: string;
  steps: Array<{
    step_name: string;
    step_index: number;
    users_reached: number;
    users_dropped: number;
    conversion_rate: number;
    avg_duration_ms: number;
  }>;
  overallConversionRate: number;
  biggestDropoff: { step: string; rate: number } | null;
}

// ==========================================
// Funnel Definitions
// ==========================================

export const FUNNELS: Record<string, FunnelDefinition> = {
  generation: {
    name: 'Generation',
    description: 'Track creation from prompt to playback',
    steps: ['open_form', 'select_mode', 'input_prompt', 'customize', 'submit', 'processing', 'completed', 'play_result'],
    criticalSteps: ['submit', 'completed', 'play_result'],
  },
  onboarding: {
    name: 'Onboarding',
    description: 'New user activation flow',
    steps: ['landing', 'explore', 'signup_start', 'signup_complete', 'profile_setup', 'first_generation', 'activated'],
    criticalSteps: ['signup_complete', 'first_generation', 'activated'],
  },
  purchase: {
    name: 'Purchase',
    description: 'Credits/subscription purchase flow',
    steps: ['view_pricing', 'select_product', 'payment_init', 'payment_processing', 'payment_complete', 'credits_received'],
    criticalSteps: ['payment_init', 'payment_complete'],
  },
  studio: {
    name: 'Studio',
    description: 'Stem separation and mixing flow',
    steps: ['open_track', 'open_studio', 'load_stems', 'stems_ready', 'edit_stem', 'mix_adjust', 'export'],
    criticalSteps: ['stems_ready', 'edit_stem', 'export'],
  },
  reference_generation: {
    name: 'Reference Generation',
    description: 'Generation from audio reference',
    steps: ['upload_start', 'upload_complete', 'analyze', 'select_mode', 'customize', 'generate', 'completed'],
    criticalSteps: ['upload_complete', 'generate', 'completed'],
  },
};

// ==========================================
// Hook Implementation
// ==========================================

export function useJourneyTracking() {
  const { user } = useAuth();
  const sessionId = useRef(analyticsService.getOrCreateJourneySessionId());
  const funnelProgress = useRef<Map<string, FunnelProgress>>(new Map());
  const lastStepTime = useRef<Map<string, number>>(new Map());
  
  // Refresh session on activity
  useEffect(() => {
    const handler = () => analyticsService.refreshJourneySession();
    window.addEventListener('click', handler, { passive: true });
    window.addEventListener('keydown', handler, { passive: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);
  
  /**
   * Track a step in a funnel
   */
  const trackFunnelStep = useCallback(async (
    funnelKey: string,
    stepName: string,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const funnel = FUNNELS[funnelKey];
    if (!funnel) {
      logger.warn(`Unknown funnel: ${funnelKey}`);
      return;
    }
    
    const stepIndex = funnel.steps.indexOf(stepName);
    if (stepIndex === -1) {
      logger.warn(`Unknown step "${stepName}" in funnel "${funnelKey}"`);
      return;
    }
    
    const now = Date.now();
    const prevStepTime = lastStepTime.current.get(`${funnelKey}_prev`) || now;
    const durationFromPrev = now - prevStepTime;
    
    // Update local progress
    const existing = funnelProgress.current.get(funnelKey);
    const progress: FunnelProgress = existing || {
      funnel: funnelKey,
      currentStep: stepName,
      currentStepIndex: stepIndex,
      totalSteps: funnel.steps.length,
      completedSteps: [],
      isCompleted: false,
      startedAt: now,
      lastUpdatedAt: now,
    };
    
    if (!progress.completedSteps.includes(stepName)) {
      progress.completedSteps.push(stepName);
    }
    progress.currentStep = stepName;
    progress.currentStepIndex = stepIndex;
    progress.lastUpdatedAt = now;
    progress.isCompleted = stepIndex === funnel.steps.length - 1;
    
    funnelProgress.current.set(funnelKey, progress);
    lastStepTime.current.set(`${funnelKey}_prev`, now);
    
    // Save to database if user is authenticated
    if (user?.id) {
      try {
        await analyticsApi.trackJourneyStep({
          userId: user.id,
          sessionId: sessionId.current,
          funnelName: funnelKey,
          stepName,
          stepIndex,
          completed: stepIndex === funnel.steps.length - 1,
          durationFromPrevMs: stepIndex > 0 ? durationFromPrev : undefined,
          metadata,
        });
        
        logger.debug(`[Journey] ${funnelKey}/${stepName} (step ${stepIndex + 1}/${funnel.steps.length})`, metadata);
      } catch (error) {
        logger.error('[Journey] Failed to save step', error);
      }
    }
  }, [user?.id]);
  
  /**
   * Mark a step as dropped off (user abandoned funnel)
   */
  const markDropoff = useCallback(async (
    funnelKey: string,
    stepName: string,
    reason?: string
  ): Promise<void> => {
    const funnel = FUNNELS[funnelKey];
    if (!funnel || !user?.id) return;
    
    const stepIndex = funnel.steps.indexOf(stepName);
    if (stepIndex === -1) return;
    
    try {
      await analyticsApi.trackJourneyStep({
        userId: user.id,
        sessionId: sessionId.current,
        funnelName: funnelKey,
        stepName,
        stepIndex,
        completed: false,
        droppedOff: true,
        metadata: { reason },
      });
      
      logger.info(`[Journey] Dropoff at ${funnelKey}/${stepName}`, { reason });
    } catch (error) {
      logger.error('[Journey] Failed to save dropoff', error);
    }
  }, [user?.id]);
  
  /**
   * Get current progress in a funnel
   */
  const getFunnelProgress = useCallback((funnelKey: string): FunnelProgress | null => {
    return funnelProgress.current.get(funnelKey) || null;
  }, []);
  
  /**
   * Reset funnel progress (e.g., for a new attempt)
   */
  const resetFunnel = useCallback((funnelKey: string): void => {
    funnelProgress.current.delete(funnelKey);
    lastStepTime.current.delete(`${funnelKey}_prev`);
    logger.debug(`[Journey] Reset funnel: ${funnelKey}`);
  }, []);
  
  /**
   * Get drop-off analytics for a funnel (admin only)
   */
  const getDropoffAnalytics = useCallback(async (
    funnelKey: string,
    daysBack: number = 7
  ): Promise<DropoffAnalytics | null> => {
    return analyticsService.analyzeFunnelDropoff(funnelKey, daysBack);
  }, []);
  
  /**
   * Check if a step is a critical step
   */
  const isCriticalStep = useCallback((funnelKey: string, stepName: string): boolean => {
    const funnel = FUNNELS[funnelKey];
    return funnel?.criticalSteps.includes(stepName) || false;
  }, []);
  
  /**
   * Get all funnel definitions
   */
  const getFunnelDefinitions = useCallback((): Record<string, FunnelDefinition> => {
    return FUNNELS;
  }, []);

  return {
    trackFunnelStep,
    markDropoff,
    resetFunnel,
    getFunnelProgress,
    getDropoffAnalytics,
    isCriticalStep,
    getFunnelDefinitions,
    sessionId: sessionId.current,
  };
}

export default useJourneyTracking;
