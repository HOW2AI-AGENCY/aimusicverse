/**
 * Track Versions Service
 *
 * Wraps `fetchTrackVersions` from `@/api/tracks.api`. Used by the
 * GenerationResultSheet to load A/B versions without touching supabase directly.
 */

import { fetchTrackVersions, type TrackVersionRow } from "@/api/tracks.api";

export interface TrackVersion {
  id: string;
  label: string;
  audioUrl: string;
  duration?: number;
  isPrimary: boolean;
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
