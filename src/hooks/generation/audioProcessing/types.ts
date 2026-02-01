/**
 * Audio Processing Types
 * Unified types for extend, cover, add-vocals, add-instrumental operations
 */

// ==========================================
// Operation Types
// ==========================================

export type AudioProcessingOperation = 
  | 'extend' 
  | 'cover' 
  | 'add_vocals' 
  | 'add_instrumental';

// ==========================================
// Status Types
// ==========================================

export type ProcessingStatus = 
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'streaming_ready'
  | 'completed'
  | 'error';

// ==========================================
// Completed Track
// ==========================================

export interface CompletedTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_url?: string | null;
  duration_seconds?: number;
}

// ==========================================
// Processing State
// ==========================================

export interface ProcessingState {
  status: ProcessingStatus;
  taskId: string | null;
  trackId: string | null;
  error: string | null;
  progress: number; // 0-100
  message: string;
  completedTrack: CompletedTrack | null;
}

export interface ExtendedProcessingState extends ProcessingState {
  operation: AudioProcessingOperation;
  /** For add_instrumental - associated studio project */
  studioProjectId?: string | null;
  /** For extend - source track being extended */
  sourceTrackId?: string | null;
}

// ==========================================
// Operation Parameters
// ==========================================

export interface ExtendParams {
  /** Source track ID to extend */
  sourceTrackId: string;
  /** Time in seconds to continue from */
  continueAt?: number;
  /** Optional new prompt */
  prompt?: string;
  /** Style description */
  style?: string;
  /** Track title */
  title?: string;
  /** AI model to use */
  model?: string;
  /** Whether instrumental only */
  instrumental?: boolean;
}

export interface CoverParams {
  /** Audio file to create cover from */
  audioFile?: File;
  /** Or audio URL */
  audioUrl?: string;
  /** Audio duration in seconds */
  audioDuration?: number;
  /** Style description (required) */
  style: string;
  /** Track title */
  title?: string;
  /** Lyrics for vocal version */
  lyrics?: string;
  /** Whether instrumental only */
  instrumental?: boolean;
  /** AI model to use */
  model?: string;
  /** Negative style tags */
  negativeTags?: string;
  /** Vocal gender preference */
  vocalGender?: 'm' | 'f' | 'auto';
  /** Associated project ID */
  projectId?: string;
}

export interface AddVocalsParams {
  /** Track ID to add vocals to */
  trackId?: string;
  /** Or audio URL */
  audioUrl?: string;
  /** Lyrics (required) */
  lyrics: string;
  /** Style description */
  style: string;
  /** Track title */
  title?: string;
  /** Audio weight (0-1) */
  audioWeight?: number;
  /** Style weight (0-1) */
  styleWeight?: number;
  /** AI model to use */
  model?: string;
}

export interface AddInstrumentalParams {
  /** Track ID to add instrumental to */
  trackId?: string;
  /** Or audio URL */
  audioUrl?: string;
  /** Style description */
  style: string;
  /** Track title */
  title?: string;
  /** Whether to open in studio after */
  openInStudio?: boolean;
  /** Audio weight (0-1) */
  audioWeight?: number;
  /** AI model to use */
  model?: string;
}

// ==========================================
// Progress Tracking Hook Return
// ==========================================

export interface ProgressTrackingReturn {
  state: ExtendedProcessingState;
  setSubmitting: () => void;
  startTracking: (taskId: string, trackId: string, extra?: { studioProjectId?: string }) => void;
  setError: (error: string) => void;
  reset: () => void;
  isActive: boolean;
  isCompleted: boolean;
  isError: boolean;
}

// ==========================================
// Operation Result
// ==========================================

export interface OperationResult {
  success: boolean;
  taskId?: string;
  trackId?: string;
  error?: unknown;
}

// ==========================================
// Main Hook Return
// ==========================================

export interface UseAudioProcessingReturn {
  // Operations
  extend: (params: ExtendParams) => Promise<OperationResult>;
  cover: (params: CoverParams) => Promise<OperationResult>;
  addVocals: (params: AddVocalsParams) => Promise<OperationResult>;
  addInstrumental: (params: AddInstrumentalParams) => Promise<OperationResult>;
  
  // Progress states
  extendProgress: ExtendedProcessingState;
  coverProgress: ExtendedProcessingState;
  addVocalsProgress: ExtendedProcessingState;
  addInstrumentalProgress: ExtendedProcessingState;
  
  // Control
  resetExtend: () => void;
  resetCover: () => void;
  resetAddVocals: () => void;
  resetAddInstrumental: () => void;
  resetAll: () => void;
  
  // Meta
  activeOperations: AudioProcessingOperation[];
  hasActiveOperation: boolean;
}
