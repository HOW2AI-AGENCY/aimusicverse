/**
 * Studio Dialogs Container
 *
 * Renders all modal dialogs for studio operations.
 * Keeps main UnifiedStudioMobile component clean.
 */

import { memo } from "react";
import { AddTrackDrawer } from "./AddTrackDrawer";
import { ExportMixDialog } from "./ExportMixDialog";
import { SaveVersionDialog } from "./SaveVersionDialog";
import { StemSeparationModeDialog } from "./StemSeparationModeDialog";
import { ExtendDialog } from "@/components/stem-studio/ExtendDialog";
import { RemixDialog } from "@/components/stem-studio/RemixDialog";
import { LazyAddVocalsDrawer } from "@/components/lazy";
import { RecordTrackDrawer } from "./RecordTrackDrawer";
import { NotationDrawer } from "./NotationDrawer";
import { ChordSheet } from "./ChordSheet";
import { AddInstrumentalDrawer } from "./AddInstrumentalDrawer";
import type { RecordingType } from "./RecordTrackDrawer";
import type { UseStudioModalsResult } from "@/hooks/studio/useStudioModals";
import type { StudioTrack } from "@/stores/studio/types";
import type { Track } from "@/types/track";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Track object passed to separation dialogs. Mirrors the minimal subset of
 * `tables<"tracks">` (or `Track`) that those dialogs actually read.
 */
type SeparationTrack = Pick<Track, "id" | "title"> & {
  audio_url: string;
  suno_id: string | null;
  suno_task_id: string | null;
};

/**
 * Separation dialogs declare full DB-row / Track props but only read the
 * SeparationTrack subset. Single documented widening instead of scattered
 * `as any` casts at each call site.
 */
const asDialogTrack = (track: SeparationTrack) => track as unknown as Tables<"tracks"> & Track;

interface StudioDialogsProps {
  id: string;
  projectId: string;
  mainTrackUrl: string;
  mainTrackTitle: string;
  mainTrack: StudioTrack | null;
  trackForSeparation: SeparationTrack | null;
  tracks: Array<{ audioUrl?: string; volume: number; muted: boolean }>;
  masterVolume: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isSeparating: boolean;
  modals: Pick<UseStudioModalsResult, "isOpen" | "getOpenChangeHandler" | "close" | "payload">;
  onStemSeparationConfirm: (mode: "simple" | "detailed") => Promise<void>;
  onRecordingComplete: (track: {
    id: string;
    audioUrl: string;
    type: RecordingType;
    duration: number;
    name: string;
    chords?: Array<{ chord: string; time: number }>;
  }) => Promise<void>;
  onVersionSaved: () => void;
  onSeek: (time: number) => void;
}

export const StudioDialogs = memo(function StudioDialogs({
  id,
  projectId,
  mainTrackUrl,
  mainTrackTitle,
  mainTrack,
  trackForSeparation,
  tracks,
  masterVolume,
  currentTime,
  duration,
  isPlaying,
  isSeparating,
  modals,
  onStemSeparationConfirm,
  onRecordingComplete,
  onVersionSaved,
  onSeek,
}: StudioDialogsProps) {
  // Prepare export tracks data
  const exportTracks = tracks.map((t) => ({
    url: t.audioUrl || "",
    volume: t.volume,
    muted: t.muted,
  }));

  return (
    <>
      {/* Add Track Drawer */}
      <AddTrackDrawer
        open={modals.isOpen("addTrack")}
        onOpenChange={modals.getOpenChangeHandler("addTrack")}
        trackId={id}
        trackUrl={mainTrackUrl}
        trackTitle={mainTrackTitle}
      />

      {/* Export Dialog */}
      <ExportMixDialog
        open={modals.isOpen("export")}
        onOpenChange={modals.getOpenChangeHandler("export")}
        tracks={exportTracks}
        masterVolume={masterVolume}
        trackTitle={mainTrackTitle}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={modals.isOpen("saveVersion")}
        onOpenChange={modals.getOpenChangeHandler("saveVersion")}
        projectId={projectId}
        sourceTrackId={id}
        tracks={tracks as unknown as StudioTrack[]}
        masterVolume={masterVolume}
        onVersionSaved={onVersionSaved}
      />

      {/* Stem Separation Dialog */}
      <StemSeparationModeDialog
        open={modals.isOpen("stemSeparation")}
        onOpenChange={modals.getOpenChangeHandler("stemSeparation")}
        onConfirm={onStemSeparationConfirm}
        isProcessing={isSeparating}
      />

      {/* Extend Dialog */}
      {mainTrack && trackForSeparation && (
        <ExtendDialog
          open={modals.isOpen("extend")}
          onOpenChange={modals.getOpenChangeHandler("extend")}
          track={asDialogTrack(trackForSeparation)}
        />
      )}

      {/* Remix/Cover Dialog */}
      {mainTrack && trackForSeparation && (
        <RemixDialog
          open={modals.isOpen("remix")}
          onOpenChange={modals.getOpenChangeHandler("remix")}
          track={asDialogTrack(trackForSeparation)}
        />
      )}

      {/* Add Vocals Drawer */}
      {mainTrack && trackForSeparation && (
        <LazyAddVocalsDrawer
          open={modals.isOpen("addVocals")}
          onOpenChange={modals.getOpenChangeHandler("addVocals")}
          track={asDialogTrack(trackForSeparation)}
        />
      )}

      {/* Record Track Drawer */}
      <RecordTrackDrawer
        open={modals.isOpen("record")}
        onOpenChange={modals.getOpenChangeHandler("record")}
        projectId={projectId}
        onRecordingComplete={onRecordingComplete}
      />

      {/* Notation Drawer */}
      <NotationDrawer
        open={modals.isOpen("notation")}
        onClose={modals.close}
        track={modals.payload.selectedTrack ?? null}
        transcriptionData={modals.payload.selectedTrack?.transcription}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={onSeek}
      />

      {/* Chord Sheet */}
      <ChordSheet
        open={modals.isOpen("chordSheet")}
        onClose={modals.close}
        trackName={modals.payload.selectedTrack?.name || "Track"}
        chords={modals.payload.selectedTrack?.chords ?? []}
        currentTime={currentTime}
        onSeekToChord={onSeek}
      />

      {/* Add Instrumental Drawer */}
      {mainTrack && trackForSeparation && (
        <AddInstrumentalDrawer
          open={modals.isOpen("addInstrumental")}
          onOpenChange={modals.getOpenChangeHandler("addInstrumental")}
          track={asDialogTrack(trackForSeparation)}
        />
      )}
    </>
  );
});
