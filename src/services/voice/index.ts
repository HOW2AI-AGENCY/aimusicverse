/**
 * Voice Service - Main Entry Point
 *
 * This file provides convenient exports for voice cloning functionality:
 * - VoiceCloneService class
 * - Type definitions
 * - Utility functions
 *
 * @see ./VoiceCloneService.ts for main implementation
 * @see ./voice-types.ts for type definitions
 */

// ============================================================================
// CLASS EXPORTS
// ============================================================================

export {
  VoiceCloneService,
  createVoiceCloneService,
} from './VoiceCloneService';

export type { VoiceCloneServiceError } from './VoiceCloneService';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Voice Cloning Steps
  VoiceCloningStep,
  VoiceCloningProgress,

  // Request/Response Types
  ValidateVoiceRequest,
  ValidateVoiceResponse,
  GetValidateInfoRequest,
  ValidateInfoResponse,
  RegeneratePhraseRequest,
  GenerateVoiceRequest,
  GenerateVoiceResponse,
  GetRecordInfoRequest,
  RecordInfoResponse,
  CheckVoiceAvailabilityRequest,
  VoiceAvailabilityResponse,

  // Voice Management
  CustomVoice,
  VoiceTask,
  VoiceLibraryItem,
  VoiceMetadata,
  VoiceTaskStatus,

  // Webhook Types
  VoiceWebhookPayload,
  VoiceValidateSuccessWebhook,
  VoiceGenerateSuccessWebhook,
  VoiceValidateFailWebhook,
  VoiceGenerateFailWebhook,

  // Error & Configuration
  VoiceCloneError,
  VoiceApiErrorResponse,
  VoiceCloneConfig,
  PollingOptions,

  // Audio & Integration
  AudioSegment,
  AudioFileInfo,
  RecordingOptions,
  VoiceGenerationRequest,
  VoiceGenerationResponse,

  // Utility Types
  StepCompletion,
  VoiceQualityMetrics,
  VoiceCloningStats,
} from './voice-types';

// ============================================================================
// UTILITY FUNCTION EXPORTS
// ============================================================================

export {
  validateVoiceQuality,
  getRecommendedSegmentTimes,
} from './VoiceCloneService';