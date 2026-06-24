/**
 * Quick Conversions Hook
 * 
 * Simplified conversion tracking for common events
 * without needing the full DeeplinkTracker setup.
 */

import { useCallback } from 'react';
import { trackConversionStage, hasReachedStage, type ConversionStage } from '@/lib/analytics/deeplink-tracker';

/**
 * Simplified hook for tracking common conversion events
 */
export function useQuickConversions() {
  const track = useCallback(async (stage: ConversionStage, metadata?: Record<string, unknown>) => {
    if (!hasReachedStage(stage)) {
      await trackConversionStage(stage, metadata);
    }
  }, []);

  return {
    /** Track user engagement (content interaction) */
    trackEngagement: useCallback(() => track('engaged'), [track]),
    
    /** Track user registration */
    trackRegistration: useCallback(() => track('registered'), [track]),
    
    /** Track first meaningful action */
    trackFirstAction: useCallback((actionType: string) => 
      track('first_action', { action_type: actionType }), [track]),
    
    /** Track generation start */
    trackGeneration: useCallback((mode: string) => 
      track('generation', { mode }), [track]),
    
    /** Track generation completion */
    trackCompleted: useCallback((trackId?: string) => 
      track('completed', { track_id: trackId }), [track]),
    
    /** Track payment */
    trackPayment: useCallback((amount: number, productType: string) => 
      track('payment', { amount, product_type: productType }), [track]),
    
    /** Check if stage was already reached */
    hasReached: hasReachedStage,
  };
}
