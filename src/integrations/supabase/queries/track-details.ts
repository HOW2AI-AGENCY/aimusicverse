import { supabase } from '../client';

export interface TrackDetailsParams {
  trackId: string;
  includeVersions?: boolean;
  includeStems?: boolean;
  includeAnalysis?: boolean;
  includeChangelog?: boolean;
}

/**
 * Fetch complete track details with optional includes
 * Optimized to fetch only requested data
 */
export async function fetchTrackDetails({
  trackId,
  includeVersions = true,
  includeStems = true,
  includeAnalysis = true,
  includeChangelog = true,
}: TrackDetailsParams) {
  // Optimized: Fetch track with active version in single query
  // Uses idx_tracks_active_version index
  const trackRes = await supabase
    .from('tracks')
    .select(`
      *,
      active_version:track_versions!active_version_id(
        id,
        audio_url,
        cover_url,
        version_label,
        is_primary
      )
    `)
    .eq('id', trackId)
    .single();
  
  if (trackRes.error) throw trackRes.error;

  // Resolve audio/cover URLs from active version
  const track = trackRes.data;
  const activeVersion = track.active_version as { audio_url?: string; cover_url?: string } | null;
  const resolvedTrack = {
    ...track,
    audio_url: activeVersion?.audio_url || track.audio_url,
    cover_url: activeVersion?.cover_url || track.cover_url,
  };

  const response: any = { track: resolvedTrack };

  if (includeVersions) {
    // Uses idx_track_versions_track_created index
    const versionsRes = await supabase
      .from('track_versions')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });
    if (versionsRes.error) throw versionsRes.error;
    response.versions = versionsRes.data;
  }

  if (includeStems) {
    // Uses idx_track_stems_track_type index
    const stemsRes = await supabase
      .from('track_stems')
      .select('*')
      .eq('track_id', trackId)
      .order('stem_type');
    if (stemsRes.error) throw stemsRes.error;
    response.stems = stemsRes.data;
  }

  if (includeAnalysis) {
    const analysisRes = await supabase
      .from('audio_analysis')
      .select('*')
      .eq('track_id', trackId)
      .maybeSingle();
    if (analysisRes.error) throw analysisRes.error;
    response.analysis = analysisRes.data;
  }

  if (includeChangelog) {
    const changelogRes = await supabase
      .from('track_change_log')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (changelogRes.error) throw changelogRes.error;
    response.changelog = changelogRes.data;
  }

  return response;
}

/**
 * Fetch track versions only
 */
export async function fetchTrackVersions(trackId: string) {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch track stems only
 */
export async function fetchTrackStems(trackId: string) {
  const { data, error } = await supabase
    .from('track_stems')
    .select('*')
    .eq('track_id', trackId)
    .order('stem_type');

  if (error) throw error;
  return data;
}

/**
 * Fetch track analysis only
 */
export async function fetchTrackAnalysis(trackId: string) {
  const { data, error } = await supabase
    .from('audio_analysis')
    .select('*')
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch track changelog only
 */
export async function fetchTrackChangelog(trackId: string, limit = 50) {
  const { data, error } = await supabase
    .from('track_change_log')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Set primary version for a track
 */
export async function setPrimaryVersion(versionId: string, trackId: string) {
  // First unset current primary
  const { error: unsetError } = await supabase
    .from('track_versions')
    .update({ is_primary: false })
    .eq('track_id', trackId)
    .eq('is_primary', true);

  if (unsetError) throw unsetError;

  // Set new primary
  const { error: setError } = await supabase
    .from('track_versions')
    .update({ is_primary: true })
    .eq('id', versionId);

  if (setError) throw setError;
}
