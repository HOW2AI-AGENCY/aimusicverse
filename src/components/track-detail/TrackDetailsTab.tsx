/**
 * TrackDetailsTab - Refactored to use modular section components
 *
 * @see src/components/track-detail/sections/ for individual sections
 */

import type { Track } from "@/types/track";
import { Separator } from "@/components/ui/separator";
import { useTrackArtist, useTrackProject, useTrackReferenceAudio } from "@/hooks/track-detail/useTrackDetailsTab";
import { VideoSection } from "./VideoSection";
import { useTrackActions } from "@/hooks/useTrackActions";
import { ParentTrackLink } from "./ParentTrackLink";
import { useAuth } from "@/hooks/useAuth";

// Section components
import {
  TrackCoverSection,
  TrackStatsGrid,
  TrackReferencesSection,
  TrackStyleSection,
  TrackPromptSection,
  TrackLyricsSection,
  TrackTechnicalSection,
  TrackRemixToggle,
} from "./sections";

interface TrackDetailsTabProps {
  track: Track;
}

export function TrackDetailsTab({ track }: TrackDetailsTabProps) {
  const { user } = useAuth();
  const { handleGenerateVideo, isProcessing } = useTrackActions();

  // Check if current user owns the track
  const isOwner = user?.id === track.user_id;

  // Fetch artist info if track has artist_id
  const { data: artist } = useTrackArtist(track.artist_id);

  // Fetch project info if track has project_id
  const { data: project } = useTrackProject(track.project_id);

  // Fetch reference audio if track was generated with a reference
  const { data: referenceAudio } = useTrackReferenceAudio(track.id);

  // Check if prompt and lyrics are the same (to avoid duplication)
  const promptAndLyricsSame =
    track.prompt && track.lyrics && track.prompt.trim().toLowerCase() === track.lyrics.trim().toLowerCase();

  // Determine if this is a cover/extension based on generation_mode or parent_track_id
  const isCoverOrExtension =
    track.generation_mode === "cover" || track.generation_mode === "extend" || !!track.parent_track_id;

  return (
    <div className="space-y-6 pb-20">
      {/* Full-width Cover with Title */}
      <TrackCoverSection track={track} />

      {/* Stats Grid */}
      <TrackStatsGrid track={track} className="px-4 sm:px-0" />

      {/* Parent Track Link - if this is a remix */}
      {track.parent_track_id && <ParentTrackLink parentTrackId={track.parent_track_id} />}

      {/* Allow Remix Toggle - Only for track owner */}
      <TrackRemixToggle
        trackId={track.id}
        allowRemix={track.allow_remix}
        isOwner={isOwner}
        isPublic={track.is_public}
      />

      {/* References Section - Artist, Project, and Audio Reference */}
      <TrackReferencesSection
        artist={artist}
        project={project}
        referenceAudio={referenceAudio}
        streamingUrl={track.streaming_url}
        generationMode={track.generation_mode}
        isCoverOrExtension={isCoverOrExtension}
      />

      <Separator />

      {/* Style & Tags */}
      <TrackStyleSection track={track} />

      {/* Prompt */}
      <TrackPromptSection track={track} promptAndLyricsSame={!!promptAndLyricsSame} />

      {/* Lyrics */}
      <TrackLyricsSection track={track} showBookmark={!!promptAndLyricsSame} />

      {/* Video Section - Show for tracks with suno_id */}
      {track.suno_id && track.suno_task_id && (
        <>
          <VideoSection track={track} onGenerateVideo={() => handleGenerateVideo(track)} />
          <Separator />
        </>
      )}

      {/* Technical Info */}
      <TrackTechnicalSection track={track} />
    </div>
  );
}
