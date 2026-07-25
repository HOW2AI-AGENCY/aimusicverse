/**
 * Track generation status API — read model for TrackGenerationStatusPanel.
 * Encapsulates supabase.from() calls behind the api/* layer boundary.
 */

import { supabase } from "@/integrations/supabase/client";

export interface StatusTaskRow {
  id: string;
  status: string;
  error_message: string | null;
  received_clips: number | null;
  expected_clips?: number | null;
  audio_clips: unknown;
}

export interface StatusVersionRow {
  id: string;
  version_label: string;
  clip_index: number;
  audio_url: string | null;
  cover_url: string | null;
  is_primary: boolean;
  metadata: Record<string, unknown> | null;
}

export interface TrackGenerationStatus {
  activeVersionId: string | null;
  versions: StatusVersionRow[];
  task: StatusTaskRow | null;
  notificationMetadata: Record<string, unknown> | null;
}

export async function fetchTrackGenerationStatus(trackId: string): Promise<TrackGenerationStatus> {
  const [{ data: trackData }, { data: versionData }] = await Promise.all([
    supabase.from("tracks").select("active_version_id").eq("id", trackId).maybeSingle(),
    supabase
      .from("track_versions")
      .select("id, version_label, clip_index, audio_url, cover_url, is_primary, metadata")
      .eq("track_id", trackId)
      .order("clip_index", { ascending: true }),
  ]);

  const { data: taskData } = await supabase
    .from("generation_tasks")
    .select("id, status, error_message, received_clips, audio_clips")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: notif } = await supabase
    .from("notifications")
    .select("metadata")
    .eq("group_key", taskData ? `generation_${taskData.id}` : "__none__")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    activeVersionId: (trackData?.active_version_id as string | null) ?? null,
    versions: (versionData ?? []) as StatusVersionRow[],
    task: (taskData ?? null) as StatusTaskRow | null,
    notificationMetadata: (notif?.metadata ?? null) as Record<string, unknown> | null,
  };
}

export async function invokeRetryTrackProcessing(
  trackId: string,
): Promise<{ versions_created?: number; versions_updated?: number }> {
  const { data, error } = await supabase.functions.invoke("retry-track-processing", {
    body: { track_id: trackId },
  });
  if (error) throw error;
  return (data ?? {}) as { versions_created?: number; versions_updated?: number };
}
