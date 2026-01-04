/**
 * Journey & Funnel Tracking Hook
 * Tracks user journeys through key funnels and analyzes drop-off points
 */

import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

// ==========================================
// Types
// ==========================================

export interface FunnelDefinition {
  name: string;
  steps: string[];
  criticalSteps: string[];
  description?: string;
}

export interface JourneyStep {
  funnel: string;
  step: string;
  stepIndex: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
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
    steps: [
      'open_form',      // 0: Opened generation form
      'select_mode',    // 1: Selected generation mode
      'input_prompt',   // 2: Started typing prompt
      'customize',      // 3: Adjusted settings (optional)
      'submit',         // 4: Submitted generation
      'processing',     // 5: Waiting for result
      'completed',      // 6: Track created successfully
      'play_result',    // 7: Played the result
    ],
    criticalSteps: ['submit', 'completed', 'play_result'],
  },
  
  onboarding: {
    name: 'Onboarding',
    description: 'New user activation flow',
    steps: [
      'landing',          // 0: Landed on app
      'explore',          // 1: Explored features
      'signup_start',     // 2: Started signup
      'signup_complete',  // 3: Completed signup
      'profile_setup',    // 4: Set up profile
      'first_generation', // 5: Created first track
      'activated',        // 6: Became active user
    ],
    criticalSteps: ['signup_complete', 'first_generation', 'activated'],
  },
  
  purchase: {
    name: 'Purchase',
    description: 'Credits/subscription purchase flow',
    steps: [
      'view_pricing',       // 0: Viewed pricing
      'select_product',     // 1: Selected product
      'payment_init',       // 2: Initiated payment
      'payment_processing', // 3: Processing payment
      'payment_complete',   // 4: Payment successful
      'credits_received',   // 5: Credits added
    ],
    criticalSteps: ['payment_init', 'payment_complete'],
  },
  
  studio: {
    name: 'Studio',
    description: 'Stem separation and mixing flow',
    steps: [
      'open_track',     // 0: Opened track in library
      'open_studio',    // 1: Clicked open studio
      'load_stems',     // 2: Stems loading
      'stems_ready',    // 3: Stems loaded
      'edit_stem',      // 4: Edited a stem
      'mix_adjust',     // 5: Adjusted mix
      'export',         // 6: Exported result
    ],
    criticalSteps: ['stems_ready', 'edit_stem', 'export'],
  },
  
  reference_generation: {
    name: 'Reference Generation',
    description: 'Generation from audio reference',
    steps: [
      'upload_start',   // 0: Started upload
      'upload_complete',// 1: Upload finished
      'analyze',        // 2: Analyzing audio
      'select_mode',    // 3: Selected cover/extend mode
      'customize',      // 4: Customized settings
      'generate',       // 5: Started generation
      'completed',      // 6: Track created
    ],
    criticalSteps: ['upload_complete', 'generate', 'completed'],
  },
};

// ==========================================
// Session ID Management
// ==========================================

const SESSION_KEY = 'journey_session_id';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

function getOrCreateSessionId(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    const { id, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp < SESSION_EXPIRY) {
      return id;
    }
  }
  
  const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    id: newId,
    timestamp: Date.now(),
  }));
  return newId;
}

function refreshSession(): void {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    const { id } = JSON.parse(stored);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id,
      timestamp: Date.now(),
    }));
  }
}

// ==========================================
// Hook Implementation
// ==========================================

export function useJourneyTracking() {
  const { user } = useAuth();
  const sessionId = useRef(getOrCreateSessionId());
  const funnelProgress = useRef<Map<string, FunnelProgress>>(new Map());
  const lastStepTime = useRef<Map<string, number>>(new Map());
  
  // Refresh session on activity
  useEffect(() => {
    const handler = () => refreshSession();
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
    const funnelTimeKey = `${funnelKey}_${stepName}`;
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
        await (supabase.from('user_journey_events') as any).insert({
          user_id: user.id,
          session_id: sessionId.current,
          funnel_name: funnelKey,
          step_name: stepName,
          step_index: stepIndex,
          completed: stepIndex === funnel.steps.length - 1,
          duration_from_prev_ms: stepIndex > 0 ? durationFromPrev : null,
          metadata: metadata || {},
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
      await (supabase.from('user_journey_events') as any).insert({
        user_id: user.id,
        session_id: sessionId.current,
        funnel_name: funnelKey,
        step_name: stepName,
        step_index: stepIndex,
        dropped_off: true,
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
    try {
      const { data, error } = await supabase.rpc('get_funnel_dropoff_stats', {
        _funnel_name: funnelKey,
        _days_back: daysBack,
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const steps = data.map((row: any) => ({
        step_name: row.step_name,
        step_index: row.step_index,
        users_reached: Number(row.users_reached),
        users_dropped: Number(row.users_dropped),
        conversion_rate: Number(row.conversion_rate),
        avg_duration_ms: Number(row.avg_duration_ms),
      }));
      
      // Find biggest dropoff
      let biggestDropoff: { step: string; rate: number } | null = null;
      let maxDropRate = 0;
      
      for (let i = 0; i < steps.length - 1; i++) {
        const current = steps[i];
        const next = steps[i + 1];
        if (current.users_reached > 0) {
          const dropRate = ((current.users_reached - next.users_reached) / current.users_reached) * 100;
          if (dropRate > maxDropRate) {
            maxDropRate = dropRate;
            biggestDropoff = { step: current.step_name, rate: dropRate };
          }
        }
      }
      
      const firstStep = steps[0];
      const lastStep = steps[steps.length - 1];
      const overallConversionRate = firstStep.users_reached > 0
        ? (lastStep.users_reached / firstStep.users_reached) * 100
        : 0;
      
      return {
        funnel: funnelKey,
        steps,
        overallConversionRate,
        biggestDropoff,
      };
    } catch (error) {
      logger.error('[Journey] Failed to get dropoff analytics', error);
      return null;
    }
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
    // Core tracking
    trackFunnelStep,
    markDropoff,
    resetFunnel,
    
    // Progress & Analytics
    getFunnelProgress,
    getDropoffAnalytics,
    
    // Utilities
    isCriticalStep,
    getFunnelDefinitions,
    
    // Current session
    sessionId: sessionId.current,
  };
}

export default useJourneyTracking;
