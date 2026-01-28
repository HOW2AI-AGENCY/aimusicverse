/**
 * Funnel Analytics Service
 * Handles funnel analysis and dropoff tracking
 */

import * as analyticsApi from '@/api/analytics.api';
import type { FunnelDropoffData } from '@/api/analytics.api';

export interface FunnelAnalysis {
  funnel: string;
  steps: FunnelDropoffData[];
  overallConversionRate: number;
  biggestDropoff: { step: string; rate: number } | null;
}

/**
 * Analyze funnel dropoff
 */
export async function analyzeFunnelDropoff(
  funnelName: string,
  daysBack: number = 7
): Promise<FunnelAnalysis | null> {
  const steps = await analyticsApi.fetchFunnelDropoffStats(funnelName, daysBack);
  
  if (!steps || steps.length === 0) {
    return null;
  }
  
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
    funnel: funnelName,
    steps,
    overallConversionRate,
    biggestDropoff,
  };
}

/**
 * Get funnel dropoff stats
 */
export async function getFunnelDropoffStats(funnelName: string, daysBack: number = 7) {
  return analyticsApi.fetchFunnelDropoffStats(funnelName, daysBack);
}
