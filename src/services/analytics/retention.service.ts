/**
 * Retention Analytics Service
 * Handles user return frequency and retention tracking
 */

const LAST_VISIT_KEY = 'last-visit-date';
const FIRST_GENERATION_KEY = 'first-generation-tracked';
const FIRST_GENERATION_DATE_KEY = 'first-generation-date';

export interface ReturnInfo {
  isReturning: boolean;
  daysSinceLastVisit: number;
}

/**
 * Track user return and calculate frequency
 */
export function trackUserReturn(): ReturnInfo {
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let isReturning = false;
  let daysSinceLastVisit = 0;
  
  if (lastVisit && lastVisit !== today) {
    const lastVisitDate = new Date(lastVisit);
    daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    isReturning = true;
  }
  
  localStorage.setItem(LAST_VISIT_KEY, today);
  
  return { isReturning, daysSinceLastVisit };
}

/**
 * Track first generation milestone
 */
export function trackFirstGeneration(): boolean {
  const alreadyTracked = localStorage.getItem(FIRST_GENERATION_KEY);
  if (!alreadyTracked) {
    localStorage.setItem(FIRST_GENERATION_KEY, 'true');
    localStorage.setItem(FIRST_GENERATION_DATE_KEY, new Date().toISOString());
    return true;
  }
  return false;
}

/**
 * Check if first generation was tracked
 */
export function hasTrackedFirstGeneration(): boolean {
  return localStorage.getItem(FIRST_GENERATION_KEY) === 'true';
}

/**
 * Get first generation date
 */
export function getFirstGenerationDate(): Date | null {
  const dateStr = localStorage.getItem(FIRST_GENERATION_DATE_KEY);
  return dateStr ? new Date(dateStr) : null;
}

/**
 * Get last visit date
 */
export function getLastVisitDate(): Date | null {
  const dateStr = localStorage.getItem(LAST_VISIT_KEY);
  return dateStr ? new Date(dateStr) : null;
}

/**
 * Calculate retention days (days since first generation)
 */
export function calculateRetentionDays(): number | null {
  const firstGen = getFirstGenerationDate();
  if (!firstGen) return null;
  
  const now = new Date();
  return Math.floor((now.getTime() - firstGen.getTime()) / (1000 * 60 * 60 * 24));
}
