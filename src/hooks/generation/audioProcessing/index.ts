/**
 * Audio Processing Module
 * Unified hook and utilities for extend, cover, add-vocals, add-instrumental operations
 */

// Types
export type {
  AudioProcessingOperation,
  ProcessingStatus,
  ProcessingState,
  ExtendedProcessingState,
  CompletedTrack,
  ExtendParams,
  CoverParams,
  AddVocalsParams,
  AddInstrumentalParams,
  OperationResult,
  UseAudioProcessingReturn,
  ProgressTrackingReturn,
} from './types';

// Constants
export {
  STATUS_MESSAGES,
  STATUS_PROGRESS,
  OPERATION_ENDPOINTS,
  DEFAULT_TITLES,
  INVALIDATE_QUERY_KEYS,
} from './constants';

// Base hook
export { useProgressTracking } from './useProgressTracking';
