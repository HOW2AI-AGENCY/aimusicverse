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
  const queries: Promise<any>[] = [
    supabase.from('tracks').select('*').eq('id', trackId).single(),
  ];

  if (includeVersions) {
    queries.push(
      supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('version_number', { ascending: false })
    );
  }

  if (includeStems) {
    queries.push(
      supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId)
        .order('stem_type')
    );
  }

  if (includeAnalysis) {
    queries.push(
      supabase
        .from('track_analysis')
        .select('*')
        .eq('track_id', trackId)
        .maybeSingle()
    );
  }

  if (includeChangelog) {
    queries.push(
      supabase
        .from('track_changelog')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })
        .limit(50)
    );
  }

  const results = await Promise.all(queries);

  let index = 0;
  const trackRes = results[index++];
  
  if (trackRes.error) throw trackRes.error;

  const response: any = {
    track: trackRes.data,
  };

  if (includeVersions) {
    const versionsRes = results[index++];
    if (versionsRes.error) throw versionsRes.error;
    response.versions = versionsRes.data;
  }

  if (includeStems) {
    const stemsRes = results[index++];
    if (stemsRes.error) throw stemsRes.error;
    response.stems = stemsRes.data;
  }

  if (includeAnalysis) {
    const analysisRes = results[index++];
    if (analysisRes.error) throw analysisRes.error;
    response.analysis = analysisRes.data;
  }

  if (includeChangelog) {
    const changelogRes = results[index++];
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
    .order('version_number', { ascending: false });

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
    .from('track_analysis')
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
    .from('track_changelog')
    .select('*')
    .eq('track_id', trackId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Set master version for a track
 */
export async function setMasterVersion(versionId: string, trackId: string) {
  const { error } = await supabase.rpc('set_master_version', {
    p_version_id: versionId,
    p_track_id: trackId,
  });

  if (error) throw error;
}
