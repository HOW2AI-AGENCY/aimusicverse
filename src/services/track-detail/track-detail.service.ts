/**
 * Track Detail Services
 * Business logic for the track-detail panel family (C3 Batch B).
 */

import * as tracksApi from "@/api/tracks.api";
import * as artistsApi from "@/api/artists.api";
import * as notificationsApi from "@/api/notifications.api";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["music_projects"]["Row"];

// ==========================================
// Track Versions (Header selector)
// ==========================================

export interface TrackVersionDetail {
  id: string;
  version_label: string | null;
  audio_url: string;
  cover_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean | null;
  created_at: string | null;
}

/**
 * Fetch all versions of a track ordered by clip_index for the header selector.
 */
export async function fetchTrackVersionsForSelector(trackId: string): Promise<TrackVersionDetail[]> {
  return tracksApi.fetchTrackVersionsDetailed(trackId);
}

// ==========================================
// Parent Track Link
// ==========================================

export interface ParentTrackSummary {
  id: string;
  title: string | null;
  cover_url: string | null;
  style: string | null;
  user_id: string;
}

/**
 * Fetch summary of a parent track used by ParentTrackLink.
 */
export async function fetchParentTrackSummary(trackId: string): Promise<ParentTrackSummary | null> {
  return tracksApi.fetchParentTrack(trackId);
}

// ==========================================
// TrackDetailsTab — Related Entities
// ==========================================

export interface TrackArtistSummary {
  id: string;
  name: string;
  avatar_url: string | null;
  genre_tags: string[] | null;
}

/**
 * Fetch artist summary for the track details panel.
 */
export async function fetchTrackArtist(artistId: string): Promise<TrackArtistSummary | null> {
  return artistsApi.fetchArtistSummary(artistId);
}

export interface TrackProjectSummary {
  id: string;
  title: string;
  cover_url: string | null;
  genre: string | null;
}

/**
 * Fetch project summary (title/cover/genre) for the track details panel.
 */
export async function fetchTrackProject(projectId: string): Promise<TrackProjectSummary | null> {
  const { data, error } = await supabase
    .from("music_projects")
    .select("id, title, cover_url, genre")
    .eq("id", projectId)
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as TrackProjectSummary | null;
}

export interface ReferenceAudioSummary {
  id: string;
  file_name: string;
  file_url: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  style_description: string | null;
  duration_seconds: number | null;
}

interface HistoryRefRow {
  reference_audio_id: string | null;
}

/**
 * Look up the reference audio (if any) used to generate the given track,
 * via user_generation_history -> reference_audio.
 */
export async function fetchTrackReferenceAudio(trackId: string): Promise<ReferenceAudioSummary | null> {
  const { data: historyData } = await supabase
    .from("user_generation_history")
    .select("reference_audio_id")
    .eq("track_id", trackId)
    .not("reference_audio_id", "is", null)
    .maybeSingle<HistoryRefRow>();

  const refId = historyData?.reference_audio_id;
  if (!refId) return null;

  const { data: refAudio, error } = await supabase
    .from("reference_audio")
    .select("id, file_name, file_url, genre, mood, bpm, style_description, duration_seconds")
    .eq("id", refId)
    .maybeSingle();

  if (error || !refAudio) return null;
  return refAudio as ReferenceAudioSummary;
}

// ==========================================
// Video Section
// ==========================================

/**
 * Send a video share notification to the user's Telegram chat.
 */
export async function sendTrackVideoToTelegram(trackId: string, videoUrl: string, title: string): Promise<void> {
  await notificationsApi.sendVideoShareNotification({ type: "video_share", trackId, videoUrl, title });
}
