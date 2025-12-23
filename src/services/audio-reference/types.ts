/**
 * Unified Audio Reference Types
 * Single source of truth for all audio reference data structures
 */

export type ReferenceSource = 
  | 'upload'      // Direct file upload
  | 'record'      // Microphone recording
  | 'cloud'       // Cloud storage (reference_audio table)
  | 'stem'        // From stem studio
  | 'drums'       // From drum machine
  | 'dj'          // From PromptDJ
  | 'guitar'      // From chord detection
  | 'telegram'    // From Telegram bot
  | 'track';      // From existing track

export type ReferenceMode = 'cover' | 'extend' | 'reference';

export interface AudioAnalysis {
  genre?: string;
  mood?: string;
  bpm?: number;
  tempo?: string;
  energy?: string;
  hasVocals?: boolean;
  hasInstrumentals?: boolean;
  vocalStyle?: string;
  styleDescription?: string;
  transcription?: string;
  instruments?: string[];
  detectedLanguage?: string;
}

export interface ReferenceContext {
  originalTrackId?: string;
  originalTitle?: string;
  stemType?: string;
  chordProgression?: string[];
  action?: string;
  prompt?: string;
  tags?: string;
}

export interface UnifiedAudioReference {
  id: string;
  source: ReferenceSource;
  audioUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number;
  
  // Analysis data
  analysis?: AudioAnalysis;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Source context
  context?: ReferenceContext;
  
  // Intended usage mode
  intendedMode?: ReferenceMode;
  
  // For extend mode: where to continue from (in seconds)
  continueAt?: number;
  
  // Timestamps
  createdAt: number;
  expiresAt?: number;
  
  // Database ID (if persisted)
  dbId?: string;
}

// Storage key for active reference
export const ACTIVE_REFERENCE_KEY = 'active_audio_reference';

// Expiry time for temporary references (5 minutes)
export const REFERENCE_EXPIRY_MS = 5 * 60 * 1000;
