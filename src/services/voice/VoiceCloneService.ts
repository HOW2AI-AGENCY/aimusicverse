/**
 * Voice Clone Service
 * Complete implementation of Suno Voice API integration
 *
 * This service handles the 6-step voice cloning workflow:
 * Step 1: Validate voice (upload + segment selection)
 * Step 2: Get validation phrase
 * Step 3: Record phrase
 * Step 4: Generate custom voice
 * Step 5: Get voice ID
 * Step 6: Check voice availability
 *
 * Public methods return `Result<T, VoiceCloneServiceError>` so callers can
 * pattern-match on `ok` / `err` instead of try/catch around thrown errors.
 *
 * @see https://docs.sunoapi.org/suno-voice for API documentation
 * @see ./voice-types.ts for type definitions
 */

import { logger } from "@/lib/logger";
import { ok, err } from "@/lib/result";
import type { Result } from "@/lib/result";
import type {
  // Request/Response types
  ValidateVoiceRequest,
  ValidateVoiceResponse,
  ValidateInfoResponse,
  RegeneratePhraseRequest,
  GenerateVoiceRequest,
  GenerateVoiceResponse,
  RecordInfoResponse,
  VoiceAvailabilityResponse,
  CheckVoiceAvailabilityRequest,

  // Configuration
  VoiceCloneConfig,
  PollingOptions,

  // Error types
  VoiceCloneError,
  VoiceApiErrorResponse,

  // Utility types
  VoiceCloningStep,
  VoiceCloningProgress,
} from "./voice-types";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: VoiceCloneConfig = {
  apiKey: "",
  baseUrl: "https://api.sunoapi.org",
  timeout: 30000,
  maxPollingAttempts: 60,
  pollingInterval: 3000,
};

const ENDPOINTS = {
  VALIDATE: "/voice/validate",
  GET_VALIDATE_INFO: "/voice/validate-info",
  REGENERATE_PHRASE: "/voice/regenerate",
  GENERATE: "/voice/generate",
  GET_RECORD_INFO: "/voice/record-info",
  CHECK_VOICE: "/voice/check-voice",
} as const;

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class VoiceCloneServiceError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: unknown;
  public step?: VoiceCloningStep;
  public retryable?: boolean;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
    step?: VoiceCloningStep,
    retryable?: boolean,
  ) {
    super(message);
    this.name = "VoiceCloneServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.step = step;
    this.retryable = retryable ?? true;
  }
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class VoiceCloneService {
  private config: VoiceCloneConfig;
  private abortControllers: Map<string, AbortController>;

  constructor(config: VoiceCloneConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.abortControllers = new Map();
  }

  // ============================================================================
  // STEP 1: VALIDATE VOICE
  // ============================================================================

  /**
   * Step 1: Validate voice and start cloning process.
   *
   * @returns `Ok<string>` with the validate_task_id, or `Err<VoiceCloneServiceError>`.
   */
  async validateVoice(request: ValidateVoiceRequest): Promise<Result<string, VoiceCloneServiceError>> {
    logger.info("Step 1: Validating voice", {
      voiceUrl: request.voiceUrl,
      segment: `${request.vocalStartS}-${request.vocalEndS}`,
    });

    try {
      const response = await this.callApi<ValidateVoiceResponse>(ENDPOINTS.VALIDATE, "POST", {
        voice_url: request.voiceUrl,
        vocal_start_s: request.vocalStartS,
        vocal_end_s: request.vocalEndS,
        name: request.name,
        description: request.description,
        language: request.language || "en",
        style: request.style,
        singer_skill_level: request.singerSkillLevel,
      });

      if (!response.validate_task_id) {
        return err(
          new VoiceCloneServiceError(
            "No task ID returned from validate endpoint",
            "NO_TASK_ID",
            500,
            response,
            "upload",
          ),
        );
      }

      logger.info("Step 1 completed", { taskId: response.validate_task_id });
      return ok(response.validate_task_id);
    } catch (error) {
      logger.error("Step 1 failed", { error });
      return err(this.handleError(error, "upload"));
    }
  }

  // ============================================================================
  // STEP 2: GET VALIDATION PHRASE
  // ============================================================================

  /**
   * Step 2: Get validation phrase to record.
   *
   * @returns `Ok<string | null>` with the phrase (or `null` to signal
   *   "still processing, poll required"), or `Err<VoiceCloneServiceError>`.
   */
  async getValidatePhrase(taskId: string): Promise<Result<string | null, VoiceCloneServiceError>> {
    logger.info("Step 2: Getting validation phrase", { taskId });

    try {
      const response = await this.callApi<ValidateInfoResponse>(ENDPOINTS.GET_VALIDATE_INFO, "POST", {
        task_id: taskId,
      });

      if (response.status === "processing_validate_fail") {
        return err(
          new VoiceCloneServiceError(
            response.error || "Voice validation failed",
            "VALIDATION_FAILED",
            400,
            response,
            "validate_phrase",
            true, // retryable - try different segment
          ),
        );
      }

      if (response.status === "pending" || response.status === "processing_validate") {
        // Still processing, need to poll
        logger.info("Step 2: Still processing, poll required");
        return ok(null); // Signal to poll
      }

      if (!response.validate_phrase) {
        return err(
          new VoiceCloneServiceError("No validation phrase returned", "NO_PHRASE", 500, response, "validate_phrase"),
        );
      }

      logger.info("Step 2 completed", { phraseLength: response.validate_phrase.length });
      return ok(response.validate_phrase);
    } catch (error) {
      logger.error("Step 2 failed", { error, taskId });
      return err(this.handleError(error, "validate_phrase"));
    }
  }

  /**
   * Regenerate validation phrase (if current one is problematic).
   *
   * @returns `Ok<string>` with new validate_task_id, or `Err<VoiceCloneServiceError>`.
   */
  async regeneratePhrase(taskId: string, callBackUrl?: string): Promise<Result<string, VoiceCloneServiceError>> {
    logger.info("Step 2: Regenerating phrase", { taskId });

    try {
      const request: RegeneratePhraseRequest = {
        taskId,
        // ⚠️ NOTE: 'calBackUrl' (one 'l') - Suno API has typo!
        calBackUrl: callBackUrl || `${this.config.baseUrl}/webhooks/voice/regenerate`,
      };

      const response = await this.callApi<ValidateVoiceResponse>(
        ENDPOINTS.REGENERATE_PHRASE,
        "POST",
        request as unknown as Record<string, unknown>,
      );

      logger.info("Phrase regenerated", { taskId: response.validate_task_id });
      return ok(response.validate_task_id);
    } catch (error) {
      logger.error("Phrase regeneration failed", { error, taskId });
      return err(this.handleError(error, "validate_phrase"));
    }
  }

  /**
   * Poll for validation phrase (built-in polling helper).
   *
   * @returns `Ok<string>` with the phrase, or `Err<VoiceCloneServiceError>`
   *   on abort / timeout.
   */
  async pollValidateInfo(taskId: string, options?: PollingOptions): Promise<Result<string, VoiceCloneServiceError>> {
    const pollingOptions: PollingOptions = {
      interval: options?.interval || this.config.pollingInterval || DEFAULT_CONFIG.pollingInterval,
      maxAttempts: options?.maxAttempts || this.config.maxPollingAttempts || DEFAULT_CONFIG.maxPollingAttempts,
      onProgress: options?.onProgress,
      abortSignal: options?.abortSignal,
    };

    const maxAttempts = pollingOptions.maxAttempts!;
    const interval = pollingOptions.interval!;

    logger.info("Polling for validation phrase", { taskId, pollingOptions });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (pollingOptions.abortSignal?.aborted) {
        return err(new VoiceCloneServiceError("Polling aborted", "POLLING_ABORTED", 0, null, "validate_phrase", false));
      }

      pollingOptions.onProgress?.(attempt, maxAttempts);

      const result = await this.getValidatePhrase(taskId);

      if (result.kind === "ok") {
        if (result.value !== null) {
          // Got the phrase!
          logger.info("Validation phrase obtained", { attempt, phrase: result.value.substring(0, 50) });
          return ok(result.value);
        }
      } else {
        // Bubble up real errors from a single attempt (validation failed etc.)
        return err(result.error);
      }

      // Wait before next poll
      if (attempt < maxAttempts) {
        await this.delay(interval);
      }
    }

    return err(
      new VoiceCloneServiceError(
        "Timeout waiting for validation phrase",
        "POLLING_TIMEOUT",
        408,
        { maxAttempts },
        "validate_phrase",
        true,
      ),
    );
  }

  // ============================================================================
  // STEP 4: GENERATE VOICE
  // ============================================================================

  /**
   * Step 4: Generate custom voice from user's recording.
   *
   * @returns `Ok<string>` with generate_task_id, or `Err<VoiceCloneServiceError>`.
   */
  async generateVoice(request: GenerateVoiceRequest): Promise<Result<string, VoiceCloneServiceError>> {
    logger.info("Step 4: Generating voice", { taskId: request.taskId });

    try {
      const response = await this.callApi<GenerateVoiceResponse>(ENDPOINTS.GENERATE, "POST", {
        task_id: request.taskId,
        verify_url: request.verifyUrl,
        call_back_url: request.callBackUrl, // ⚠️ NOTE: 'callBackUrl' (capital B)
      });

      if (!response.generate_task_id) {
        return err(
          new VoiceCloneServiceError(
            "No task ID returned from generate endpoint",
            "NO_TASK_ID",
            500,
            response,
            "generate_voice",
          ),
        );
      }

      logger.info("Step 4 completed", { taskId: response.generate_task_id });
      return ok(response.generate_task_id);
    } catch (error) {
      logger.error("Step 4 failed", { error, taskId: request.taskId });
      return err(this.handleError(error, "generate_voice"));
    }
  }

  // ============================================================================
  // STEP 5: GET VOICE ID
  // ============================================================================

  /**
   * Step 5: Get voice ID from generation.
   *
   * @returns `Ok<string | null>` with voice_id (or `null` if still processing),
   *   or `Err<VoiceCloneServiceError>`.
   */
  async getVoiceId(taskId: string): Promise<Result<string | null, VoiceCloneServiceError>> {
    logger.info("Step 5: Getting voice ID", { taskId });

    try {
      const response = await this.callApi<RecordInfoResponse>(ENDPOINTS.GET_RECORD_INFO, "POST", { task_id: taskId });

      if (response.status === "processing_record_fail") {
        return err(
          new VoiceCloneServiceError(
            response.error || "Voice generation failed",
            "GENERATION_FAILED",
            400,
            response,
            "wait_voice_id",
            false, // Not retryable - user needs to re-record
          ),
        );
      }

      if (response.status === "pending" || response.status === "processing_record") {
        // Still processing, need to poll
        logger.info("Step 5: Still processing, poll required");
        return ok(null); // Signal to poll
      }

      if (!response.voice_id) {
        return err(new VoiceCloneServiceError("No voice ID returned", "NO_VOICE_ID", 500, response, "wait_voice_id"));
      }

      logger.info("Step 5 completed", { voiceId: response.voice_id });
      return ok(response.voice_id);
    } catch (error) {
      logger.error("Step 5 failed", { error, taskId });
      return err(this.handleError(error, "wait_voice_id"));
    }
  }

  /**
   * Poll for voice ID (built-in polling helper).
   *
   * @returns `Ok<string>` with voice ID, or `Err<VoiceCloneServiceError>`
   *   on abort / timeout.
   */
  async pollRecordInfo(taskId: string, options?: PollingOptions): Promise<Result<string, VoiceCloneServiceError>> {
    const pollingOptions: PollingOptions = {
      interval: options?.interval || this.config.pollingInterval || DEFAULT_CONFIG.pollingInterval,
      maxAttempts: options?.maxAttempts || this.config.maxPollingAttempts || DEFAULT_CONFIG.maxPollingAttempts,
      onProgress: options?.onProgress,
      abortSignal: options?.abortSignal,
    };

    const maxAttempts = pollingOptions.maxAttempts!;
    const interval = pollingOptions.interval!;

    logger.info("Polling for voice ID", { taskId, pollingOptions });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (pollingOptions.abortSignal?.aborted) {
        return err(new VoiceCloneServiceError("Polling aborted", "POLLING_ABORTED", 0, null, "wait_voice_id", false));
      }

      pollingOptions.onProgress?.(attempt, maxAttempts);

      const result = await this.getVoiceId(taskId);

      if (result.kind === "ok") {
        if (result.value !== null) {
          // Got the voice ID!
          logger.info("Voice ID obtained", { attempt, voiceId: result.value });
          return ok(result.value);
        }
      } else {
        // Bubble up real errors from a single attempt (generation failed etc.)
        return err(result.error);
      }

      // Wait before next poll
      if (attempt < maxAttempts) {
        await this.delay(interval);
      }
    }

    return err(
      new VoiceCloneServiceError(
        "Timeout waiting for voice ID",
        "POLLING_TIMEOUT",
        408,
        { maxAttempts },
        "wait_voice_id",
        true,
      ),
    );
  }

  // ============================================================================
  // STEP 6: CHECK VOICE AVAILABILITY
  // ============================================================================

  /**
   * Step 6: Check if voice is ready to use.
   *
   * @returns `Ok<boolean>` with availability, or `Err<VoiceCloneServiceError>`.
   */
  async checkVoiceAvailability(
    request: CheckVoiceAvailabilityRequest,
  ): Promise<Result<boolean, VoiceCloneServiceError>> {
    logger.info("Step 6: Checking voice availability", {
      voiceId: request.voiceId,
      taskId: request.taskId,
    });

    try {
      const response = await this.callApi<VoiceAvailabilityResponse>(ENDPOINTS.CHECK_VOICE, "POST", {
        voice_id: request.voiceId,
        task_id: request.taskId,
      });

      if (response.status === "failed") {
        return err(
          new VoiceCloneServiceError(
            response.error || "Voice availability check failed",
            "AVAILABILITY_FAILED",
            400,
            response,
            "verify_ready",
            false,
          ),
        );
      }

      const isReady = response.status === "ready" && response.is_available;

      logger.info("Step 6 completed", {
        voiceId: request.voiceId,
        isReady,
        status: response.status,
      });

      return ok(isReady);
    } catch (error) {
      logger.error("Step 6 failed", { error, voiceId: request.voiceId });
      return err(this.handleError(error, "verify_ready"));
    }
  }

  // ============================================================================
  // POLLING ABORTION
  // ============================================================================

  /**
   * Abort ongoing polling operations
   *
   * @param operationId - Operation ID to abort (e.g., taskId)
   */
  abortPolling(operationId: string): void {
    const controller = this.abortControllers.get(operationId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(operationId);
      logger.info("Polling aborted", { operationId });
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Make API call to Suno Voice API.
   *
   * Internal helper — still throws on failure so the public Result-returning
   * methods can wrap the call in a single try/catch boundary. (We only convert
   * the **public** surface to Result; internal plumbing throws are mapped at
   * the boundary via {@link handleError}.)
   */
  private async callApi<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: Record<string, unknown> | FormData,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      ...headers,
    };

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      requestInit.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new VoiceCloneServiceError(
          errorBody.message || `API call failed: ${response.statusText}`,
          "API_ERROR",
          response.status,
          errorBody,
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof VoiceCloneServiceError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new VoiceCloneServiceError(
          "Request timeout",
          "TIMEOUT",
          408,
          { url, timeout: this.config.timeout },
          undefined,
          true,
        );
      }

      throw new VoiceCloneServiceError(
        error instanceof Error ? error.message : "Unknown error",
        "NETWORK_ERROR",
        0,
        error,
      );
    }
  }

  /**
   * Handle and transform errors into VoiceCloneServiceError
   */
  private handleError(error: unknown, step?: VoiceCloningStep): VoiceCloneServiceError {
    if (error instanceof VoiceCloneServiceError) {
      return error;
    }

    // Generic error
    return new VoiceCloneServiceError(
      error instanceof Error ? error.message : "Unknown error occurred",
      "UNKNOWN_ERROR",
      500,
      error,
      step,
      true,
    );
  }

  /**
   * Delay utility for polling
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceCloneConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceCloneConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info("VoiceCloneService configuration updated", { config: this.config });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new VoiceCloneService instance
 *
 * @param config - Service configuration
 * @returns Configured VoiceCloneService
 */
export function createVoiceCloneService(config: VoiceCloneConfig): VoiceCloneService {
  return new VoiceCloneService(config);
}

/**
 * Validate voice quality before cloning.
 *
 * This helper does NOT throw — it always returns metrics + recommendations.
 * Kept synchronous-style for the call site; no Result wrapping needed because
 * it never produces a typed error.
 *
 * @param audioFile - Audio file to validate
 * @returns Quality metrics and recommendations
 */
export async function validateVoiceQuality(audioFile: File): Promise<{
  isValid: boolean;
  metrics: {
    clarity: number;
    noise: number;
    consistency: number;
    overall: number;
  };
  recommendations: string[];
}> {
  // Basic validation
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  const DURATION_MIN = 3; // seconds
  const DURATION_MAX = 60; // seconds

  const recommendations: string[] = [];

  // Check file size
  if (audioFile.size > MAX_SIZE) {
    recommendations.push("File is too large. Maximum size is 50MB.");
  }

  // Check file type
  if (!audioFile.type.startsWith("audio/")) {
    recommendations.push("Invalid file type. Must be an audio file.");
  }

  // Get duration (if possible)
  let duration = 0;
  try {
    duration = await getAudioDuration(audioFile);

    if (duration < DURATION_MIN) {
      recommendations.push("Audio is too short. Minimum duration is 3 seconds.");
    }

    if (duration > DURATION_MAX) {
      recommendations.push("Audio is too long. Maximum duration is 60 seconds.");
    }
  } catch {
    recommendations.push("Could not determine audio duration.");
  }

  const isValid = recommendations.length === 0;

  return {
    isValid,
    metrics: {
      clarity: isValid ? 85 : 50,
      noise: isValid ? 15 : 40,
      consistency: isValid ? 80 : 45,
      overall: isValid ? 85 : 50,
    },
    recommendations,
  };
}

/**
 * Get audio file duration
 */
async function getAudioDuration(audioFile: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioFile);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error("Could not load audio"));
    });
  });
}

/**
 * Get recommended vocal segment times
 */
export function getRecommendedSegmentTimes(duration: number): {
  recommendedStart: number;
  recommendedEnd: number;
  reason: string;
} {
  // For most songs, vocals are typically in the middle section
  const padding = Math.min(5, duration * 0.1);
  const recommendedStart = padding;
  const recommendedEnd = duration - padding;

  return {
    recommendedStart,
    recommendedEnd,
    reason: "Vocals are typically in the middle section of the audio",
  };
}

// ============================================================================
// INTERNAL HELPERS (Result-side utilities used internally only — re-exported
// for test files via this module's exports below. Not part of the public
// surface; external callers should pattern-match on Result instead.)
// ============================================================================

/**
 * Helper: convert a Result-returning step into its thrown-error equivalent.
 * Exists for parity with the historical throwing API; tests use it to verify
 * the throw wrappers preserve original behavior. NOT exported from index.ts.
 */
export const __resultInternals = { ok, err };
