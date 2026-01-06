/**
 * Studio Entity Types
 *
 * TypeScript definitions for all new studio entities from Sprint 031 (Mobile Studio V2).
 * These types support legacy feature migration including lyrics versioning, recording sessions,
 * presets, stem batch processing, MIDI files, chord detection, and keyboard shortcuts.
 *
 * @see specs/031-mobile-studio-v2/data-model.md
 * @since 2026-01-06
 */

// ============================================================================
// TYPE ALIASES
// ============================================================================

/**
 * UUID type alias for consistency across studio entities
 */
export type UUID = string;

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Recording type for recording sessions
 */
export enum RecordingType {
  VOCAL = 'vocal',
  GUITAR = 'guitar',
  OTHER = 'other'
}

/**
 * Note type for section notes
 */
export enum NoteType {
  GENERAL = 'general',
  PRODUCTION = 'production',
  LYRIC = 'lyric',
  ARRANGEMENT = 'arrangement'
}

/**
 * Preset category
 */
export enum PresetCategory {
  VOCAL = 'vocal',
  GUITAR = 'guitar',
  DRUMS = 'drums',
  MASTERING = 'mastering',
  STEM_SEPARATION = 'stem_separation',
  MIDI = 'midi'
}

/**
 * Stem batch operation type
 */
export enum StemBatchOperationType {
  TRANSCRIPTION = 'transcription',
  SEPARATION = 'separation'
}

/**
 * Stem batch status
 */
export enum StemBatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Keyboard shortcut context
 */
export enum ShortcutContext {
  STUDIO = 'studio',
  LYRICS = 'lyrics',
  MIXER = 'mixer',
  GLOBAL = 'global'
}

// ============================================================================
// LYRIC VERSION
// ============================================================================

/**
 * Lyric version entity
 * Tracks all versions of lyrics with full history and restore capability
 */
export interface LyricVersion {
  id: UUID;
  track_id: UUID;
  version_number: number;
  content: string;
  author_id: UUID;
  created_at: Date;
  is_current: boolean;
  change_summary?: string;
}

/**
 * Input for creating a new lyric version
 */
export interface CreateLyricVersionInput {
  track_id: UUID;
  content: string;
  change_summary?: string;
  author_id: UUID;
}

/**
 * Input for updating a lyric version
 */
export interface UpdateLyricVersionInput {
  content?: string;
  is_current?: boolean;
  change_summary?: string;
}

/**
 * Lyric version with author profile
 */
export interface LyricVersionWithAuthor extends LyricVersion {
  author: {
    id: UUID;
    username: string;
    avatar_url?: string;
  };
}

// ============================================================================
// SECTION NOTE
// ============================================================================

/**
 * Section note entity
 * Annotations associated with specific track sections
 */
export interface SectionNote {
  id: UUID;
  section_id: UUID;
  author_id: UUID;
  content: string;
  note_type: NoteType;
  created_at: Date;
  updated_at: Date;
  is_resolved: boolean;
}

/**
 * Input for creating a new section note
 */
export interface CreateSectionNoteInput {
  section_id: UUID;
  content: string;
  note_type?: NoteType;
  author_id: UUID;
}

/**
 * Input for updating a section note
 */
export interface UpdateSectionNoteInput {
  content?: string;
  note_type?: NoteType;
  is_resolved?: boolean;
}

/**
 * Section note with author profile
 */
export interface SectionNoteWithAuthor extends SectionNote {
  author: {
    id: UUID;
    username: string;
    avatar_url?: string;
  };
}

// ============================================================================
// RECORDING SESSION
// ============================================================================

/**
 * Recording metadata structure
 */
export interface RecordingMetadata {
  format?: string;
  codec?: string;
  bitrate?: number;
  device_info?: {
    type?: string;
    manufacturer?: string;
    model?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  tags?: string[];
}

/**
 * Recording session entity
 * Tracks vocal/guitar recording sessions with audio metadata
 */
export interface RecordingSession {
  id: UUID;
  user_id: UUID;
  track_id?: UUID;
  recording_type: RecordingType;
  audio_url: string;
  duration: number;
  file_size: number;
  sample_rate: number;
  bit_depth: number;
  channels: number;
  created_at: Date;
  metadata?: RecordingMetadata;
}

/**
 * Input for creating a recording session
 */
export interface CreateRecordingSessionInput {
  user_id: UUID;
  track_id?: UUID;
  recording_type: RecordingType;
  audio_url: string;
  duration: number;
  file_size: number;
  sample_rate: number;
  bit_depth: number;
  channels: number;
  metadata?: RecordingMetadata;
}

/**
 * Valid sample rates for recordings
 */
export type ValidSampleRate = 44100 | 48000 | 96000;

/**
 * Valid bit depths for recordings
 */
export type ValidBitDepth = 16 | 24 | 32;

/**
 * Valid channel counts
 */
export type ValidChannelCount = 1 | 2;

// ============================================================================
// PRESET
// ============================================================================

/**
 * Mixer settings structure
 */
export interface MixerSettings {
  volume: number;
  pan: number;
  eq?: {
    low: number;
    mid: number;
    high: number;
  };
}

/**
 * Effect settings structure
 */
export interface EffectSettings {
  enabled: boolean;
  [key: string]: boolean | number | string | undefined;
}

/**
 * Effects configuration
 */
export interface EffectsConfig {
  reverb?: EffectSettings;
  compression?: EffectSettings;
  delay?: EffectSettings;
  distortion?: EffectSettings;
  chorus?: EffectSettings;
  [key: string]: EffectSettings | undefined;
}

/**
 * Preset settings structure
 */
export interface PresetSettings {
  mixer?: MixerSettings;
  effects?: EffectsConfig;
  stem_separation?: {
    model: string;
    quality: 'low' | 'medium' | 'high';
  };
  midi?: {
    model: string;
    min_confidence: number;
  };
  [key: string]: unknown;
}

/**
 * Preset entity
 * User-defined and system presets for track processing
 */
export interface Preset {
  id: UUID;
  user_id?: UUID;
  name: string;
  description?: string;
  category: PresetCategory;
  settings: PresetSettings;
  is_public: boolean;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
  usage_count: number;
}

/**
 * Input for creating a preset
 */
export interface CreatePresetInput {
  user_id?: UUID;
  name: string;
  description?: string;
  category: PresetCategory;
  settings: PresetSettings;
  is_public?: boolean;
  is_system?: boolean;
}

/**
 * Input for updating a preset
 */
export interface UpdatePresetInput {
  name?: string;
  description?: string;
  category?: PresetCategory;
  settings?: PresetSettings;
  is_public?: boolean;
}

/**
 * Preset with owner profile
 */
export interface PresetWithOwner extends Preset {
  owner?: {
    id: UUID;
    username: string;
    avatar_url?: string;
  };
}

// ============================================================================
// STEM BATCH
// ============================================================================

/**
 * Stem result in batch processing
 */
export interface StemResult {
  stem_id: UUID;
  status: 'success' | 'failed';
  midi_url?: string;
  error?: string;
  processing_time?: number;
}

/**
 * Batch processing summary
 */
export interface BatchSummary {
  total: number;
  success: number;
  failed: number;
  average_time?: number;
}

/**
 * Batch processing results
 */
export interface BatchResults {
  stems: StemResult[];
  summary: BatchSummary;
}

/**
 * Stem batch entity
 * Track batch stem processing operations
 */
export interface StemBatch {
  id: UUID;
  track_id: UUID;
  user_id: UUID;
  operation_type: StemBatchOperationType;
  stem_ids: UUID[];
  status: StemBatchStatus;
  progress: number;
  results?: BatchResults;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

/**
 * Input for creating a stem batch
 */
export interface CreateStemBatchInput {
  track_id: UUID;
  user_id: UUID;
  operation_type: StemBatchOperationType;
  stem_ids: UUID[];
}

/**
 * Input for updating a stem batch
 */
export interface UpdateStemBatchInput {
  status?: StemBatchStatus;
  progress?: number;
  results?: BatchResults;
  error_message?: string;
  completed_at?: Date;
}

// ============================================================================
// REPLACEMENT EVENT
// ============================================================================

/**
 * Replacement event entity
 * Extends track_change_log for section replacement tracking
 */
export interface ReplacementEvent {
  id: UUID;
  track_id: UUID;
  user_id: UUID;
  change_type: 'section_replacement';
  old_content?: string;
  new_content?: string;
  section_start?: number;
  section_end?: number;
  prompt?: string;
  created_at: Date;
}

/**
 * Input for creating a replacement event
 */
export interface CreateReplacementEventInput {
  track_id: UUID;
  user_id: UUID;
  old_content?: string;
  new_content?: string;
  section_start?: number;
  section_end?: number;
  prompt?: string;
}

/**
 * Replacement event with user profile
 */
export interface ReplacementEventWithUser extends ReplacementEvent {
  user: {
    id: UUID;
    username: string;
    avatar_url?: string;
  };
}

// ============================================================================
// MIDI FILE
// ============================================================================

/**
 * MIDI metadata structure
 */
export interface MidiMetadata {
  format?: number;
  ticks_per_beat?: number;
  instrument_names?: string[];
  key_centers?: string[];
  complexity_score?: number;
  genre_tags?: string[];
}

/**
 * MIDI file entity
 * Store MIDI file metadata and references
 */
export interface MidiFile {
  id: UUID;
  user_id: UUID;
  track_id?: UUID;
  file_name: string;
  file_url: string;
  file_size: number;
  duration: number;
  tempo?: number;
  time_signature?: string;
  key_signature?: string;
  note_count?: number;
  track_count?: number;
  created_at: Date;
  metadata?: MidiMetadata;
}

/**
 * Input for creating a MIDI file record
 */
export interface CreateMidiFileInput {
  user_id: UUID;
  track_id?: UUID;
  file_name: string;
  file_url: string;
  file_size: number;
  duration: number;
  tempo?: number;
  time_signature?: string;
  key_signature?: string;
  note_count?: number;
  track_count?: number;
  metadata?: MidiMetadata;
}

/**
 * Input for updating a MIDI file
 */
export interface UpdateMidiFileInput {
  track_id?: UUID;
  tempo?: number;
  time_signature?: string;
  key_signature?: string;
  note_count?: number;
  track_count?: number;
  metadata?: MidiMetadata;
}

/**
 * MIDI file with associated track
 */
export interface MidiFileWithTrack extends MidiFile {
  track?: {
    id: UUID;
    title: string;
    audio_url?: string;
  };
}

// ============================================================================
// KEYBOARD SHORTCUT
// ============================================================================

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  alt?: boolean;
}

/**
 * Shortcuts organized by context
 */
export interface ShortcutGroup {
  [action: string]: KeyboardShortcut;
}

/**
 * User keyboard shortcuts configuration
 */
export interface KeyboardShortcuts {
  studio?: ShortcutGroup;
  lyrics?: ShortcutGroup;
  mixer?: ShortcutGroup;
  global?: ShortcutGroup;
}

/**
 * Input for updating keyboard shortcuts
 */
export interface UpdateKeyboardShortcutsInput {
  context: ShortcutContext;
  shortcuts: ShortcutGroup;
}

/**
 * Keyboard shortcut with display information
 */
export interface KeyboardShortcutDisplay extends KeyboardShortcut {
  display: string;
  description?: string;
  is_custom: boolean;
}

// ============================================================================
// CHORD DETECTION RESULT
// ============================================================================

/**
 * Individual chord detection
 */
export interface ChordDetection {
  time: number;
  chord: string;
  duration: number;
  confidence: number;
}

/**
 * Chords analysis result structure
 */
export interface ChordsAnalysis {
  chords: ChordDetection[];
  key?: string;
  tempo?: number;
  time_signature?: string;
}

/**
 * Chord detection result entity
 * Store chord detection analysis results
 */
export interface ChordDetectionResult {
  id: UUID;
  track_id: UUID;
  recording_id?: UUID;
  user_id: UUID;
  analysis_id: string;
  chords: ChordsAnalysis;
  confidence: number;
  created_at: Date;
}

/**
 * Input for creating a chord detection result
 */
export interface CreateChordDetectionResultInput {
  track_id: UUID;
  recording_id?: UUID;
  user_id: UUID;
  analysis_id: string;
  chords: ChordsAnalysis;
  confidence: number;
}

/**
 * Chord detection result with associated track
 */
export interface ChordDetectionResultWithTrack extends ChordDetectionResult {
  track?: {
    id: UUID;
    title: string;
    audio_url?: string;
  };
  recording?: {
    id: UUID;
    audio_url: string;
    duration: number;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Entity with user profile
 */
export interface WithUser {
  user: {
    id: UUID;
    username: string;
    avatar_url?: string;
  };
}

/**
 * Entity with timestamps
 */
export interface WithTimestamps {
  created_at: Date;
  updated_at?: Date;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

/**
 * Entity IDs for batch operations
 */
export interface EntityIds {
  track_id?: UUID;
  user_id?: UUID;
  section_id?: UUID;
  stem_ids?: UUID[];
}
