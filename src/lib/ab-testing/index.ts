/**
 * A/B Testing Infrastructure
 * 
 * Provides experiment management, variant assignment, and analytics integration.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============= Types =============

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  targetAudience?: TargetAudience;
  metrics: string[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100, percentage allocation
  config?: Record<string, unknown>;
}

export interface TargetAudience {
  percentage?: number; // What % of users to include
  userTiers?: string[];
  platforms?: ('telegram' | 'web')[];
  isNewUser?: boolean;
}

export interface UserAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

// ============= Storage Keys =============

const ASSIGNMENTS_KEY = 'ab_experiment_assignments';
const PARTICIPATION_KEY = 'ab_participation_enabled';

// ============= Core Functions =============

/**
 * Get all current experiment assignments for the user
 */
export function getExperimentAssignments(): Record<string, UserAssignment> {
  try {
    const stored = localStorage.getItem(ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get the variant ID for a specific experiment
 */
export function getVariant(experimentId: string): string | null {
  const assignments = getExperimentAssignments();
  return assignments[experimentId]?.variantId || null;
}

/**
 * Check if user is in a specific variant
 */
export function isInVariant(experimentId: string, variantId: string): boolean {
  return getVariant(experimentId) === variantId;
}

/**
 * Check if user is in the control group (variant 'control' or 'a')
 */
export function isControl(experimentId: string): boolean {
  const variant = getVariant(experimentId);
  return variant === 'control' || variant === 'a';
}

/**
 * Assign user to an experiment variant based on weights
 */
export function assignToExperiment(experiment: Experiment, userId?: string): string {
  const assignments = getExperimentAssignments();
  
  // Already assigned?
  if (assignments[experiment.id]) {
    return assignments[experiment.id].variantId;
  }
  
  // Calculate assignment based on weights
  const seed = userId || crypto.randomUUID();
  const hash = simpleHash(seed + experiment.id);
  const bucket = hash % 100;
  
  let cumulative = 0;
  let selectedVariant = experiment.variants[0];
  
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      selectedVariant = variant;
      break;
    }
  }
  
  // Save assignment
  const assignment: UserAssignment = {
    experimentId: experiment.id,
    variantId: selectedVariant.id,
    assignedAt: new Date().toISOString(),
  };
  
  assignments[experiment.id] = assignment;
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  
  logger.debug('Assigned to experiment', {
    experiment: experiment.name,
    variant: selectedVariant.name,
  });
  
  return selectedVariant.id;
}

/**
 * Clear all experiment assignments (for testing)
 */
export function clearAssignments(): void {
  localStorage.removeItem(ASSIGNMENTS_KEY);
}

/**
 * Check if user has opted out of experiments
 */
export function isParticipationEnabled(): boolean {
  return localStorage.getItem(PARTICIPATION_KEY) !== 'false';
}

/**
 * Set experiment participation preference
 */
export function setParticipationEnabled(enabled: boolean): void {
  localStorage.setItem(PARTICIPATION_KEY, String(enabled));
}

// ============= Feature Flag Integration =============

/**
 * Get experiment variant with fallback to feature flag
 */
export async function getExperimentOrFlag(
  experimentId: string,
  featureFlagKey: string,
  defaultValue: boolean = false
): Promise<{ variant: string | null; enabled: boolean }> {
  // Check experiment first
  const variant = getVariant(experimentId);
  if (variant) {
    return {
      variant,
      enabled: variant !== 'control' && variant !== 'off',
    };
  }
  
  // Fall back to feature flag
  try {
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', featureFlagKey)
      .single();
    
    return {
      variant: null,
      enabled: data?.enabled ?? defaultValue,
    };
  } catch {
    return { variant: null, enabled: defaultValue };
  }
}

// ============= Analytics Integration =============

/**
 * Track an experiment event
 */
export async function trackExperimentEvent(
  experimentId: string,
  eventName: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const variant = getVariant(experimentId);
  if (!variant) return;
  
  try {
    const { trackEvent } = await import('@/services/analytics');
    await trackEvent({
      eventType: 'feature_used',
      eventName: `experiment_${eventName}`,
      metadata: {
        experiment_id: experimentId,
        variant_id: variant,
        ...metadata,
      },
    });
  } catch (error) {
    logger.warn('Failed to track experiment event', { error });
  }
}

/**
 * Track experiment conversion (goal reached)
 */
export async function trackExperimentConversion(
  experimentId: string,
  goalName: string,
  value?: number
): Promise<void> {
  await trackExperimentEvent(experimentId, 'conversion', {
    goal: goalName,
    value,
  });
}

// ============= Predefined Experiments =============

/**
 * Predefined experiments for the app
 * Add new experiments here as the product evolves
 */
export const EXPERIMENTS = {
  // Example: New onboarding flow
  ONBOARDING_V2: {
    id: 'onboarding_v2',
    name: 'New Onboarding Flow',
    description: 'Test new simplified onboarding experience',
    variants: [
      { id: 'control', name: 'Original', weight: 50 },
      { id: 'treatment', name: 'New Flow', weight: 50 },
    ],
    status: 'draft' as const,
    metrics: ['onboarding_completion', 'first_generation', 'd7_retention'],
  },
  
  // Example: Generation UI
  GENERATION_UI: {
    id: 'generation_ui',
    name: 'Generation Form Layout',
    description: 'Test different generation form layouts',
    variants: [
      { id: 'a', name: 'Current', weight: 34 },
      { id: 'b', name: 'Compact', weight: 33 },
      { id: 'c', name: 'Wizard', weight: 33 },
    ],
    status: 'draft' as const,
    metrics: ['generation_started', 'generation_completed', 'generation_satisfaction'],
  },
  
  // Example: Player UX
  PLAYER_EXPAND_CTA: {
    id: 'player_expand_cta',
    name: 'Player Expand CTA',
    description: 'Test visibility of expand button in mini player',
    variants: [
      { id: 'control', name: 'Hidden', weight: 50 },
      { id: 'visible', name: 'Always Visible', weight: 50 },
    ],
    status: 'draft' as const,
    metrics: ['player_expanded', 'fullscreen_time'],
  },
} as const;

// ============= Helpers =============

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
