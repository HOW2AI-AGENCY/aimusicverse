/**
 * Studio Store Types
 *
 * Shared types for all studio stores.
 * Extracted from useUnifiedStudioStore for better maintainability.
 */

import type {
  LyricVersion,
  SectionNote,
  NoteType,
} from '@/types/studio-entities';

// ============ Type Definitions ============

export type TrackType = 'main' | 'vocal' | 'instrumental' | 'stem' | 'sfx' | 'drums' | 'bass' | 'other';
export type ProjectStatus = 'draft' | 'mixing' | 'mastering' | 'completed' | 'archived';
export type StemsMode = 'none' | 'simple' | 'detailed';
export type ViewMode = 'timeline' | 'mixer' | 'compact';
export type TrackStatus = 'ready' | 'pending' | 'processing' | 'failed';

// ============ Core Interfaces ============

export interface StudioClip {
  id: string;
  trackId: string;
  audioUrl: string;
  name: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
  color?: string;
  waveformData?: number[];
}

export interface StudioTrackVersion {
  id?: string; // ID from track_versions table (optional)
  label: string;
  audioUrl: string;
  duration?: number;
  metadata?: {
    suno_id?: string;
    version_type?: string;
    created_at?: string;
  };
}

export interface StudioTrack {
  id: string;
  name: string;
  type: TrackType;
  audioUrl?: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  color: string;
  clips: StudioClip[];
  effects?: {
    eq?: boolean;
    reverb?: number;
    compression?: number;
  };
  // Pending/version fields
  status?: TrackStatus;
  taskId?: string;
  versions?: StudioTrackVersion[];
  activeVersionLabel?: string;
  errorMessage?: string;
}

export interface StudioProject {
  id: string;
  userId: string;
  sourceTrackId?: string;
  name: string;
  description?: string;
  bpm: number;
  keySignature?: string;
  timeSignature: string;
  durationSeconds?: number;
  masterVolume: number;
  tracks: StudioTrack[];
  status: ProjectStatus;
  stemsMode: StemsMode;
  viewSettings: ViewSettings;
  createdAt: string;
  updatedAt: string;
  openedAt?: string;
}

export interface ViewSettings {
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  viewMode: ViewMode;
}

export interface CreateProjectParams {
  name: string;
  sourceTrackId?: string;
  sourceAudioUrl?: string;
  duration?: number;
  tracks?: Omit<StudioTrack, 'id' | 'clips'>[];
}

// ============ Lyrics Types ============

/**
 * Simplified lyric version for studio store
 * Includes essential version information for lyrics editing
 */
export interface StudioLyricVersion {
  id: string;
  versionNumber: number;
  content: string;
  isCurrent: boolean;
  changeSummary?: string;
  createdAt: Date;
}

/**
 * Simplified section note for studio store
 * Includes note metadata for lyrics sections
 */
export interface StudioSectionNote {
  id: string;
  sectionId: string;
  content: string;
  noteType: NoteType;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Constants ============

export const TRACK_COLORS: Record<TrackType, string> = {
  main: 'hsl(var(--primary))',
  vocal: 'hsl(340 82% 52%)',
  instrumental: 'hsl(262 83% 58%)',
  stem: 'hsl(142 76% 36%)',
  sfx: 'hsl(38 92% 50%)',
  drums: 'hsl(24 95% 53%)',
  bass: 'hsl(201 96% 32%)',
  other: 'hsl(var(--muted))',
};

// ============ Helper Functions ============

export const generateId = () => crypto.randomUUID();

export const createDefaultViewSettings = (): ViewSettings => ({
  zoom: 50,
  snapToGrid: true,
  gridSize: 4,
  viewMode: 'timeline',
});
