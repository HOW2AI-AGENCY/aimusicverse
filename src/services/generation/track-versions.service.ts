/**
 * Track Versions Service
 *
 * Wraps `fetchTrackVersions` from `@/api/tracks.api`. Used by the
 * GenerationResultSheet and VersionSwitcher to load A/B versions without
 * touching supabase directly.
 */

import {
  fetchTrackVersions,
  fetchTrackVersionsDetailed,
  type TrackVersionRow,
  type TrackVersionDetailRow,
} from "@/api/tracks.api";

export interface TrackVersion {
  id: string;
  label: string;
  audioUrl: string;
  duration?: number;
  isPrimary: boolean;
}

export interface TrackVersionForSwitcher {
  id: string;
  audio_url: string;
  cover_url: string | null;
  version_label: string | null;
  clip_index: number | null;
  is_primary: boolean | null;
}

export function mapTrackVersion(row: TrackVersionRow): TrackVersion {
  return {
    id: row.id,
    label: row.version_label || "A",
    audioUrl: row.audio_url,
    duration: row.duration_seconds ?? undefined,
    isPrimary: row.is_primary || false,
  };
}

export async function getTrackVersions(trackId: string): Promise<TrackVersion[]> {
  const rows = await fetchTrackVersions(trackId);
  return rows.map(mapTrackVersion);
}

/**
 * Fetch versions in the exact shape required by VersionSwitcher.
 */
export async function getTrackVersionsForSwitcher(trackId: string): Promise<TrackVersionForSwitcher[]> {
  const rows = await fetchTrackVersionsDetailed(trackId);
  return rows.map((r: TrackVersionDetailRow) => ({
    id: r.id,
    audio_url: r.audio_url,
    cover_url: r.cover_url,
    version_label: r.version_label,
    clip_index: r.clip_index,
    is_primary: r.is_primary,
  }));
}
