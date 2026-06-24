/**
 * Hooks Index - Export all professional/studio hooks
 * 
 * This file provides a centralized export point for professional features
 */

// Studio Stats
export { useUserStudioStats, formatStudioTime, getChangeIndicator } from '../useUserStudioStats';
export type { UserStudioStats } from '../useUserStudioStats';

// Batch Stem Processing
export { useBatchStemProcessing } from '../useBatchStemProcessing';
export type { 
  BatchProcessingState, 
  StemSelection, 
  BatchOperationType, 
  BatchModel, 
  SeparationMode 
} from '../useBatchStemProcessing';

// Payment Analytics
export { usePaymentAnalytics, useGamificationAnalytics, useQuickPaymentStats, analyticsKeys } from '../usePaymentAnalytics';
export type { PaymentAnalytics, GamificationAnalytics } from '../usePaymentAnalytics';
