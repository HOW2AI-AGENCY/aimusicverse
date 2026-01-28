/**
 * Unified Analytics Hooks
 * 
 * Consolidated exports for all analytics-related hooks.
 */

// Deeplink tracking hooks
export { 
  useDeeplinkTracker, 
  useConversionTracking 
} from './useDeeplinkTracker';

// Utility hook for quick conversion events
export { useQuickConversions } from './useQuickConversions';

// Re-export types
export type { 
  ConversionStage,
  UTMParams,
  DeeplinkContext,
} from '@/lib/analytics/deeplink-tracker';
