/**
 * Type Adapters for Studio Components
 * 
 * Provides conversion functions between different studio type systems:
 * - StudioProject (from useUnifiedStudioStore) ↔ Project (for UnifiedDAWLayout)
 * - StudioTrack ↔ Track (for DAW components)
 * 
 * @see ADR-011 for architecture decisions
 */

import type { StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';

/**
 * Track type for UnifiedDAWLayout
 */
export interface DAWTrack {
  id: string;
  name: string;
  audioUrl: string;
  stemType: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

/**
 * Project type for UnifiedDAWLayout
 */
export interface DAWProject {
  id: string;
  name: string;
  masterVolume: number;
  tracks: DAWTrack[];
}

/**
 * Convert StudioTrack to DAWTrack format
 */
export function studioTrackToDAWTrack(track: StudioTrack): DAWTrack {
  return {
    id: track.id,
    name: track.name,
    audioUrl: track.audioUrl || '',
    stemType: track.type,
    muted: track.muted,
    solo: track.solo,
    volume: track.volume,
    pan: track.pan || 0,
  };
}

/**
 * Convert StudioProject to DAWProject format
 */
export function studioProjectToDAWProject(project: StudioProject): DAWProject {
  return {
    id: project.id,
    name: project.name,
    masterVolume: project.masterVolume,
    tracks: project.tracks.map(studioTrackToDAWTrack),
  };
}

/**
 * Convert DAWTrack back to partial StudioTrack updates
 */
export function dawTrackToStudioTrackUpdate(track: DAWTrack): Partial<StudioTrack> {
  return {
    id: track.id,
    name: track.name,
    audioUrl: track.audioUrl,
    type: track.stemType as StudioTrack['type'],
    muted: track.muted,
    solo: track.solo,
    volume: track.volume,
    pan: track.pan,
  };
}
