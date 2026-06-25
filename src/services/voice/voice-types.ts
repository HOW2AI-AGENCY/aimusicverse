/**
 * Voice Cloning Types
 * Type definitions for Suno Voice API integration
 *
 * This module contains all types for voice cloning workflow:
 * - 6-step voice cloning process
 * - Request/response types for each API endpoint
 * - Voice management and library types
 * - Error types and validation
 *
 * @see https://docs.sunoapi.org/suno-voice for API documentation
 */

// ============================================================================
// VOICE CLONING STEP TYPES
// ============================================================================

/**
 * Voice cloning workflow steps
 */
export type VoiceCloningStep =
  | 'upload'           // Step 1: Upload original voice + segment selection
  | 'validate_phrase'  // Step 2: Wait for validation phrase
  | 'record_phrase'    // Step 3: User records phrase
  | 'generate_voice'   // Step 4: Generate custom voice
  | 'wait_voice_id'   // Step 5: Wait for voiceId
  | 'verify_ready'     // Step 6: Verify voice availability
  | 'completed';        // ✅ Voice ready for use

/**
 * Voice cloning progress state
 */
export interface VoiceCloningProgress {
  step: VoiceCloningStep;
  currentStep: number;       // 1-6
  totalSteps: number;        // Always 6
  percentage: number;        // 0-100
  message: string;           // User-friendly progress message

  // Task IDs from API
  validateTaskId?: string;
  generateTaskId?: string;
  voiceId?: string;

  // Error state
  error?: VoiceCloneError;

  // Loading states
  isValidating?: boolean;
  isPhraseLoading?: boolean;
  isGenerating?: boolean;
  isGettingVoiceId?: boolean;
  isChecking?: boolean;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Step 1: Validate voice request
 */
export interface ValidateVoiceRequest {
  voiceUrl: string;           // URL to original voice file
  vocalStartS: number;        // Vocal segment start time (seconds)
  vocalEndS: number;          // Vocal segment end time (seconds)
  name?: string;              // Voice name (optional, can set later)
  description?: string;       // Voice description (optional)
  language?: string;          // Language code (default: 'en')
  style?: string;             // Music style (e.g., 'Pop, Female')
  singerSkillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Step 1: Validate voice response
 */
export interface ValidateVoiceResponse {
  validate_task_id: string;   // Task ID for polling
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Step 2: Get validate info request
 */
export interface GetValidateInfoRequest {
  taskId: string;
}

/**
 * Step 2: Get validate info response
 */
export interface ValidateInfoResponse {
  validate_task_id: string;
  status: 'pending' | 'processing_validate' | 'processing_validate_fail' | 'completed';
  validate_phrase?: string;   // ✅ Phrase to record (when completed)
  error?: string;             // Error message (when failed)
}

/**
 * Step 2: Regenerate phrase request
 */
export interface RegeneratePhraseRequest {
  taskId: string;
  calBackUrl?: string;        // ⚠️ NOTE: 'calBackUrl' (one 'l') - Suno API typo!
}

/**
 * Step 3: Generate voice request
 */
export interface GenerateVoiceRequest {
  taskId: string;             // validate_task_id from step 1
  verifyUrl: string;          // URL to user's recording of phrase
  callBackUrl?: string;       // Webhook URL (optional)
}

/**
 * Step 3: Generate voice response
 */
export interface GenerateVoiceResponse {
  generate_task_id: string;   // Task ID for polling
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Step 4: Get record info request
 */
export interface GetRecordInfoRequest {
  taskId: string;             // generate_task_id from step 3
}

/**
 * Step 4: Get record info response
 */
export interface RecordInfoResponse {
  generate_task_id: string;
  status: 'pending' | 'processing_record' | 'processing_record_fail' | 'completed';
  voice_id?: string;          // ✅ Voice ID (when completed)
  error?: string;             // Error message (when failed)
}

/**
 * Step 5: Check voice availability request
 */
export interface CheckVoiceAvailabilityRequest {
  voiceId: string;
  taskId?: string;            // generate_task_id (optional)
}

/**
 * Step 5: Check voice availability response
 */
export interface VoiceAvailabilityResponse {
  voice_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  is_available: boolean;      // ✅ true when voice is ready to use
  error?: string;
}

// ============================================================================
// VOICE MANAGEMENT TYPES
// ============================================================================

/**
 * Custom voice entity
 */
export interface CustomVoice {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sample_url: string;
  waveform_url?: string;
  duration_seconds?: number;
  is_verified: boolean;
  provider_voice_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: VoiceMetadata;
}

/**
 * Voice metadata
 */
export interface VoiceMetadata {
  language?: string;
  style?: string;
  singerSkillLevel?: string;
  vocalType?: 'male' | 'female' | 'mixed' | 'other';
  genre?: string;
  mood?: string;
  originalFilename?: string;
  validationAttempts?: number;
  generationAttempts?: number;
}

/**
 * Voice task entity (database tracking)
 */
export interface VoiceTask {
  id: string;
  user_id: string;
  voice_id?: string;

  // Validate phase
  validate_task_id?: string;
  validate_phrase?: string;
  validate_status?: VoiceTaskStatus;

  // Generate phase
  generate_task_id?: string;
  recording_url?: string;
  generate_status?: VoiceTaskStatus;

  // Final result
  provider_voice_id?: string;

  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Voice task status
 */
export type VoiceTaskStatus =
  | 'pending'
  | 'processing'
  | 'processing_validate'
  | 'processing_validate_fail'
  | 'processing_record'
  | 'processing_record_fail'
  | 'completed'
  | 'failed';

/**
 * Voice library item (for UI display)
 */
export interface VoiceLibraryItem {
  id: string;
  name: string;
  description?: string;
  sample_url: string;
  duration_seconds?: number;
  created_at: string;
  is_favorite?: boolean;
  usage_count?: number;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Voice validation success webhook payload
 */
export interface VoiceValidateSuccessWebhook {
  event: 'voice.validate_success';
  data: {
    validate_task_id: string;
    validate_phrase: string;
    timestamp: string;
  };
}

/**
 * Voice generation success webhook payload
 */
export interface VoiceGenerateSuccessWebhook {
  event: 'voice.generate_success';
  data: {
    generate_task_id: string;
    voice_id: string;
    timestamp: string;
  };
}

/**
 * Voice validation failure webhook payload
 */
export interface VoiceValidateFailWebhook {
  event: 'voice.validate_fail';
  data: {
    validate_task_id: string;
    error: string;
    timestamp: string;
  };
}

/**
 * Voice generation failure webhook payload
 */
export interface VoiceGenerateFailWebhook {
  event: 'voice.generate_fail';
  data: {
    generate_task_id: string;
    error: string;
    timestamp: string;
  };
}

/**
 * Union type for all webhook types
 */
export type VoiceWebhookPayload =
  | VoiceValidateSuccessWebhook
  | VoiceGenerateSuccessWebhook
  | VoiceValidateFailWebhook
  | VoiceGenerateFailWebhook;

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Voice cloning error
 */
export interface VoiceCloneError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
  step?: VoiceCloningStep;
  retryable?: boolean;
}

/**
 * Voice API error response
 */
export interface VoiceApiErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Voice cloning configuration
 */
export interface VoiceCloneConfig {
  apiKey: string;
  baseUrl?: string;            // Default: https://api.sunoapi.org
  timeout?: number;           // Default: 30000ms (30s)
  maxPollingAttempts?: number; // Default: 60
  pollingInterval?: number;   // Default: 3000ms (3s)
  webhookSecret?: string;     // For webhook signature verification
}

/**
 * Polling options
 */
export interface PollingOptions {
  interval?: number;          // Polling interval (ms)
  maxAttempts?: number;      // Maximum polling attempts
  onProgress?: (attempt: number, maxAttempts: number) => void;
  abortSignal?: AbortSignal;  // For cancellation
}

// ============================================================================
// AUDIO TYPES
// ============================================================================

/**
 * Audio segment selection
 */
export interface AudioSegment {
  startS: number;             // Start time (seconds)
  endS: number;               // End time (seconds)
  duration: number;           // Duration (seconds)
  isSelected: boolean;
}

/**
 * Audio file info
 */
export interface AudioFileInfo {
  name: string;
  size: number;              // Size in bytes
  type: string;              // MIME type
  duration?: number;         // Duration in seconds
  url?: string;              // Upload URL
}

/**
 * Recording options
 */
export interface RecordingOptions {
  maxLength?: number;        // Maximum recording length (seconds)
  format?: 'wav' | 'mp3' | 'ogg';
  sampleRate?: number;        // Sample rate (Hz)
  bitRate?: number;          // Bit rate (kbps)
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Voice usage in music generation
 */
export interface VoiceGenerationRequest {
  prompt: string;
  voiceId: string;           // Custom voice ID
  instrumental?: boolean;
  genre?: string;
  mood?: string;
  style?: string;
  duration?: number;
}

/**
 * Voice usage response
 */
export interface VoiceGenerationResponse {
  trackId: string;
  voiceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Step completion status
 */
export interface StepCompletion {
  step: VoiceCloningStep;
  completed: boolean;
  canProceed: boolean;
  message: string;
}

/**
 * Voice quality metrics
 */
export interface VoiceQualityMetrics {
  clarity: number;           // 0-100
    noise: number;          // 0-100 (lower is better)
  consistency: number;       // 0-100
  overall: number;          // 0-100
  recommendations: string[];
}

/**
 * Voice cloning statistics
 */
export interface VoiceCloningStats {
  totalVoices: number;
  successfulClonings: number;
  failedClonings: number;
  averageCloningTime: number; // seconds
  mostUsedVoices: Array<{
    voiceId: string;
    name: string;
    usageCount: number;
  }>;
}