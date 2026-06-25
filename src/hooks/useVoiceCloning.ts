/**
 * Voice Cloning Hook
 * React hook for managing voice cloning workflow
 *
 * This hook manages the complete 6-step voice cloning process:
 * - Step state management
 * - Progress tracking
 * - Error handling
 * - Integration with VoiceCloneService
 *
 * Usage:
 * ```tsx
 * const voiceCloning = useVoiceCloning({
 *   voiceName: 'My Voice',
 *   description: 'Pop female vocal',
 *   apiKey: process.env.VITE_SUNO_API_KEY
 * });
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  VoiceCloneService,
  createVoiceCloneService,
  validateVoiceQuality,
  getRecommendedSegmentTimes,
  type VoiceCloningStep,
  type VoiceCloningProgress,
  type VoiceCloneConfig,
  type AudioFileInfo,
  type PollingOptions,
} from '@/services/voice';

interface UseVoiceCloningOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxPollingAttempts?: number;
  pollingInterval?: number;
  onProgress?: (progress: VoiceCloningProgress) => void;
  onComplete?: (voiceId: string) => void;
  onError?: (error: Error) => void;
}

interface UseVoiceCloningReturn {
  // State
  step: VoiceCloningStep;
  progress: VoiceCloningProgress;

  // Task IDs
  validateTaskId: string | null;
  generateTaskId: string | null;
  voiceId: string | null;

  // Audio file
  audioFile: File | null;
  audioFileInfo: AudioFileInfo | null;

  // Segment times
  segmentTimes: { startS: number; endS: number } | null;

  // Validation phrase
  validatePhrase: string | null;

  // Recording
  recordingUrl: string | null;

  // Loading states
  isValidating: boolean;
  isPhraseLoading: boolean;
  isGenerating: boolean;
  isGettingVoiceId: boolean;
  isChecking: boolean;

  // Error state
  error: Error | null;

  // Actions
  setAudioFile: (file: File) => Promise<void>;
  setSegmentTimes: (startS: number, endS: number) => void;
  startValidation: () => Promise<void>;
  getPhrase: () => Promise<void>;
  regeneratePhrase: () => Promise<void>;
  setRecordingUrl: (url: string) => void;
  generateVoice: () => Promise<void>;
  getVoiceId: () => Promise<void>;
  checkAvailability: () => Promise<void>;
  reset: () => void;

  // Utilities
  canProceedToStep: (step: VoiceCloningStep) => boolean;
  getStepProgress: () => { current: number; total: number; percentage: number };
}

export function useVoiceCloning(options: UseVoiceCloningOptions): UseVoiceCloningReturn {
  // Service instance
  const serviceRef = useRef<VoiceCloneService | null>(null);

  // State
  const [step, setStep] = useState<VoiceCloningStep>('upload');
  const [validateTaskId, setValidateTaskId] = useState<string | null>(null);
  const [generateTaskId, setGenerateTaskId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);

  const [audioFile, setAudioFileState] = useState<File | null>(null);
  const [audioFileInfo, setAudioFileInfo] = useState<AudioFileInfo | null>(null);
  const [validatePhrase, setValidatePhraseState] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrlState] = useState<string | null>(null);

  const [segmentTimes, setSegmentTimes] = useState<{ startS: number; endS: number } | null>(null);

  // Loading states
  const [isValidating, setIsValidating] = useState(false);
  const [isPhraseLoading, setIsPhraseLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGettingVoiceId, setIsGettingVoiceId] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);

  // Initialize service
  useEffect(() => {
    const config: VoiceCloneConfig = {
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      timeout: options.timeout,
      maxPollingAttempts: options.maxPollingAttempts,
      pollingInterval: options.pollingInterval,
    };

    serviceRef.current = createVoiceCloneService(config);

    return () => {
      serviceRef.current = null;
    };
  }, [options.apiKey, options.baseUrl, options.timeout, options.maxPollingAttempts, options.pollingInterval]);

  // Update progress callback
  const updateProgress = useCallback((progress: Partial<VoiceCloningProgress>) => {
    const stepOrder: VoiceCloningStep[] = ['upload', 'validate_phrase', 'record_phrase', 'generate_voice', 'wait_voice_id', 'verify_ready'];
    const currentStepIndex = stepOrder.indexOf(step);

    const newProgress: VoiceCloningProgress = {
      step,
      currentStep: currentStepIndex + 1,
      totalSteps: 6,
      percentage: ((currentStepIndex + 1) / 6) * 100,
      message: getStepMessage(step),
      validateTaskId: validateTaskId ?? undefined,
      generateTaskId: generateTaskId ?? undefined,
      voiceId: voiceId ?? undefined,
      isValidating,
      isPhraseLoading,
      isGenerating,
      isGettingVoiceId,
      isChecking,
      error: error ? { code: 'UNKNOWN', message: error.message, details: error } : undefined,
      ...progress,
    };

    options.onProgress?.(newProgress);
  }, [step, validateTaskId, generateTaskId, voiceId, isValidating, isPhraseLoading, isGenerating, isGettingVoiceId, isChecking, error, options.onProgress]);

  // Step 1: Set audio file
  const setAudioFileHandler = useCallback(async (file: File) => {
    setError(null);

    try {
      // Validate audio quality
      const qualityCheck = await validateVoiceQuality(file);

      if (!qualityCheck.isValid) {
        throw new Error(qualityCheck.recommendations.join('. '));
      }

      setAudioFileState(file);
      setAudioFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Get recommended segment times
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const recommendations = getRecommendedSegmentTimes(duration);

        setSegmentTimes({
          startS: recommendations.recommendedStart,
          endS: recommendations.recommendedEnd,
        });

        URL.revokeObjectURL(audio.src);
      });

      updateProgress({ step: 'upload' });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to validate audio file');
      setError(error);
      options.onError?.(error);
    }
  }, [options.onError, updateProgress]);

  // Set segment times manually
  const setSegmentTimesHandler = useCallback((startS: number, endS: number) => {
    setSegmentTimes({ startS, endS });
  }, []);

  // Step 1: Start validation
  const startValidationHandler = useCallback(async () => {
    if (!serviceRef.current || !audioFile || !segmentTimes) {
      throw new Error('Missing required data for validation');
    }

    setError(null);
    setIsValidating(true);
    updateProgress({ step: 'upload' });

    try {
      // Upload audio file and get URL (implementation depends on your storage)
      const voiceUrl = await uploadAudioFile(audioFile);

      // Start validation
      const taskId = await serviceRef.current.validateVoice({
        voiceUrl,
        vocalStartS: segmentTimes.startS,
        vocalEndS: segmentTimes.endS,
        language: 'en',
        style: 'Pop',
        singerSkillLevel: 'intermediate',
      });

      setValidateTaskId(taskId);
      setStep('validate_phrase');
      updateProgress({ step: 'validate_phrase', validateTaskId: taskId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Validation failed');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsValidating(false);
    }
  }, [audioFile, segmentTimes, updateProgress, options.onError]);

  // Step 2: Get validation phrase
  const getPhraseHandler = useCallback(async () => {
    if (!serviceRef.current || !validateTaskId) {
      throw new Error('Not ready to get phrase');
    }

    setError(null);
    setIsPhraseLoading(true);

    try {
      const phrase = await serviceRef.current.pollValidateInfo(validateTaskId, {
        onProgress: (attempt, max) => {
          updateProgress({
            step: 'validate_phrase',
            message: `Waiting for phrase... (${attempt}/${max})`
          });
        }
      });

      setValidatePhraseState(phrase);
      setStep('record_phrase');
      updateProgress({ step: 'record_phrase' });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get phrase');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsPhraseLoading(false);
    }
  }, [validateTaskId, updateProgress, options.onError]);

  // Step 2: Regenerate phrase
  const regeneratePhraseHandler = useCallback(async () => {
    if (!serviceRef.current || !validateTaskId) {
      throw new Error('Not ready to regenerate phrase');
    }

    setError(null);
    setIsPhraseLoading(true);

    try {
      const newTaskId = await serviceRef.current.regeneratePhrase(validateTaskId);
      setValidateTaskId(newTaskId);
      await getPhraseHandler(); // Continue to get new phrase
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to regenerate phrase');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsPhraseLoading(false);
    }
  }, [validateTaskId, getPhraseHandler, options.onError]);

  // Set recording URL
  const setRecordingUrlHandler = useCallback((url: string) => {
    setRecordingUrlState(url);
  }, []);

  // Step 4: Generate voice
  const generateVoiceHandler = useCallback(async () => {
    if (!serviceRef.current || !validateTaskId || !recordingUrl) {
      throw new Error('Not ready to generate voice');
    }

    setError(null);
    setIsGenerating(true);
    updateProgress({ step: 'generate_voice' });

    try {
      const taskId = await serviceRef.current.generateVoice({
        taskId: validateTaskId,
        verifyUrl: recordingUrl,
        callBackUrl: `${options.baseUrl}/webhooks/voice/generate`,
      });

      setGenerateTaskId(taskId);
      setStep('wait_voice_id');
      updateProgress({ step: 'wait_voice_id', generateTaskId: taskId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Voice generation failed');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsGenerating(false);
    }
  }, [validateTaskId, recordingUrl, options.baseUrl, updateProgress, options.onError]);

  // Step 5: Get voice ID
  const getVoiceIdHandler = useCallback(async () => {
    if (!serviceRef.current || !generateTaskId) {
      throw new Error('Not ready to get voice ID');
    }

    setError(null);
    setIsGettingVoiceId(true);

    try {
      const voice = await serviceRef.current.pollRecordInfo(generateTaskId, {
        onProgress: (attempt, max) => {
          updateProgress({
            step: 'wait_voice_id',
            message: `Generating voice... (${attempt}/${max})`
          });
        }
      });

      setVoiceId(voice);
      setStep('verify_ready');
      updateProgress({ step: 'verify_ready', voiceId: voice });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get voice ID');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsGettingVoiceId(false);
    }
  }, [generateTaskId, updateProgress, options.onError]);

  // Step 6: Check availability
  const checkAvailabilityHandler = useCallback(async () => {
    if (!serviceRef.current || !voiceId) {
      throw new Error('Not ready to check availability');
    }

    setError(null);
    setIsChecking(true);

    try {
      const isAvailable = await serviceRef.current.checkVoiceAvailability({
        voiceId,
        taskId: generateTaskId || undefined,
      });

      if (!isAvailable) {
        throw new Error('Voice is not yet available');
      }

      setStep('completed');
      updateProgress({ step: 'completed' });
      options.onComplete?.(voiceId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Availability check failed');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsChecking(false);
    }
  }, [voiceId, generateTaskId, updateProgress, options.onComplete, options.onError]);

  // Reset state
  const resetHandler = useCallback(() => {
    setStep('upload');
    setValidateTaskId(null);
    setGenerateTaskId(null);
    setVoiceId(null);
    setAudioFileState(null);
    setAudioFileInfo(null);
    setValidatePhraseState(null);
    setRecordingUrlState(null);
    setSegmentTimes(null);
    setError(null);

    updateProgress({ step: 'upload' });
  }, [updateProgress]);

  // Check if can proceed to step
  const canProceedToStep = useCallback((targetStep: VoiceCloningStep): boolean => {
    const stepOrder: VoiceCloningStep[] = [
      'upload',
      'validate_phrase',
      'record_phrase',
      'generate_voice',
      'wait_voice_id',
      'verify_ready',
    ];

    const currentIndex = stepOrder.indexOf(step);
    const targetIndex = stepOrder.indexOf(targetStep);

    // Can only proceed if all previous steps are complete
    return targetIndex <= currentIndex;
  }, [step]);

  // Get step progress
  const getStepProgressHandler = useCallback(() => {
    const stepOrder: VoiceCloningStep[] = [
      'upload',
      'validate_phrase',
      'record_phrase',
      'generate_voice',
      'wait_voice_id',
      'verify_ready',
    ];

    const currentIndex = stepOrder.indexOf(step);
    const total = stepOrder.length;
    const percentage = ((currentIndex + 1) / total) * 100;

    return {
      current: currentIndex + 1,
      total,
      percentage,
    };
  }, [step]);

  return {
    step,
    progress: {} as VoiceCloningProgress,

    validateTaskId,
    generateTaskId,
    voiceId,

    audioFile,
    audioFileInfo,
    segmentTimes,
    validatePhrase,

    recordingUrl,

    isValidating,
    isPhraseLoading,
    isGenerating,
    isGettingVoiceId,
    isChecking,

    error,

    setAudioFile: setAudioFileHandler,
    setSegmentTimes: setSegmentTimesHandler,
    startValidation: startValidationHandler,
    getPhrase: getPhraseHandler,
    regeneratePhrase: regeneratePhraseHandler,
    setRecordingUrl: setRecordingUrlHandler,
    generateVoice: generateVoiceHandler,
    getVoiceId: getVoiceIdHandler,
    checkAvailability: checkAvailabilityHandler,
    reset: resetHandler,

    canProceedToStep,
    getStepProgress: getStepProgressHandler,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user-friendly message for current step
 */
function getStepMessage(step: VoiceCloningStep): string {
  const messages: Record<VoiceCloningStep, string> = {
    upload: 'Upload original voice file',
    validate_phrase: 'Waiting for validation phrase...',
    record_phrase: 'Record the validation phrase',
    generate_voice: 'Generating custom voice...',
    wait_voice_id: 'Processing voice...',
    verify_ready: 'Verifying voice availability...',
    completed: 'Voice is ready to use!',
  };

  return messages[step];
}

/**
 * Upload audio file and return URL
 * NOTE: Implement this based on your storage solution
 */
async function uploadAudioFile(file: File): Promise<string> {
  // TODO: Implement file upload to your storage (Supabase Storage, S3, etc.)
  // This is a placeholder implementation

  try {
    // Example: Upload to Supabase Storage
    // const formData = new FormData();
    // formData.append('file', file);
    //
    // const { data, error } = await supabase.storage
    //   .from('voice-uploads')
    //   .upload(`${Date.now()}-${file.name}`, file);
    //
    // if (error) throw error;
    //
    // const { data: { publicUrl } } = supabase.storage
    //   .from('voice-uploads')
    //   .getPublicUrl(data.path);
    //
    // return publicUrl;

    // Placeholder
    logger.warn('uploadAudioFile not implemented - using placeholder URL');
    return `https://placeholder.voice.upload/${file.name}`;
  } catch (error) {
    logger.error('Failed to upload audio file', { error });
    throw new Error('Failed to upload audio file');
  }
}