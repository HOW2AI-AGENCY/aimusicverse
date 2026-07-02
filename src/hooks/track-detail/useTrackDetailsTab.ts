/**
 * useTrackDetailsTab — TanStack Query wrappers for the track-details panel.
 * Fetches artist, project, and reference audio for the displayed track.
 */
import { useQuery } from "@tanstack/react-query";
import {
  fetchTrackArtist,
  fetchTrackProject,
  fetchTrackReferenceAudio,
  type TrackArtistSummary,
  type TrackProjectSummary,
  type ReferenceAudioSummary,
} from "@/services/track-detail/track-detail.service";

export type { TrackArtistSummary, TrackProjectSummary, ReferenceAudioSummary };

export function useTrackArtist(artistId: string | null | undefined) {
  return useQuery<TrackArtistSummary | null>({
    queryKey: ["artist", artistId],
    queryFn: () => (artistId ? fetchTrackArtist(artistId) : null),
    enabled: !!artistId,
    staleTime: 30_000,
  });
}

export function useTrackProject(projectId: string | null | undefined) {
  return useQuery<TrackProjectSummary | null>({
    queryKey: ["project", projectId],
    queryFn: () => (projectId ? fetchTrackProject(projectId) : null),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useTrackReferenceAudio(trackId: string) {
  return useQuery<ReferenceAudioSummary | null>({
    queryKey: ["track-reference-audio", trackId],
    queryFn: () => fetchTrackReferenceAudio(trackId),
    enabled: !!trackId,
    staleTime: 30_000,
  });
}
