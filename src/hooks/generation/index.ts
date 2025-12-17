/**
 * Generation hooks export
 * Hooks related to music generation workflow (IMP045)
 */

export { useGenerateForm } from './useGenerateForm';
export type { GenerateFormState, UseGenerateFormProps } from './useGenerateForm';

export { useGenerateDraft } from './useGenerateDraft';
export { useActiveGenerations } from './useActiveGenerations';
export { useSyncStaleTasks } from './useSyncStaleTasks';

// Legacy loader - prefer useAudioReference from @/hooks/useAudioReference
export { useAudioReferenceLoader } from './useAudioReferenceLoader';
export type { AudioReferenceData, AudioReferenceResult } from './useAudioReferenceLoader';

// Unified audio reference hook
export { useAudioReference } from '../useAudioReference';

// Re-export lyrics recognition from parent hooks
export { useLyricsRecognition } from '../useLyricsRecognition';
export type { RecognizedLyrics, LyricsRecognitionResult } from '../useLyricsRecognition';
