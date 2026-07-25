import type { Track } from "@/types/track";
import { ExtendTrackDialog } from "@/components/ExtendTrackDialog";
import { AddToProjectDialog } from "@/components/track-menu/AddToProjectDialog";
import { ShareTrackDialog } from "@/components/track-menu/ShareTrackDialog";
import { AddToPlaylistDialog } from "@/components/track/AddToPlaylistDialog";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { TrackDetailSheet } from "@/components/TrackDetailSheet";
import { TrackDetailDialog } from "@/components/TrackDetailDialog";
import { AudioCoverDialog } from "@/components/AudioCoverDialog";
import { MashupDialog } from "@/components/MashupDialog";
import { RenameTrackDialog } from "./RenameTrackDialog";
import { CreateArtistDialog } from "@/components/CreateArtistDialog";
import { AddVocalsDialog } from "@/components/AddVocalsDialog";
import { AddInstrumentalDialog } from "@/components/AddInstrumentalDialog";
import { RemixTrackDialog } from "./RemixTrackDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

// Simplified stem type for dialogs - only needs what's essential
interface SimpleStem {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface DialogStates {
  details: boolean;
  extend: boolean;
  cover: boolean;
  addToProject: boolean;
  share: boolean;
  addToPlaylist: boolean;
  deleteConfirm: boolean;
  deleteVersionSelect: boolean;
  rename: boolean;
  createArtist: boolean;
  addVocals: boolean;
  addInstrumental: boolean;
  mashup: boolean;
  remix: boolean;
}

interface TrackDialogsPortalProps {
  track: Track;
  dialogs: DialogStates;
  onCloseDialog: (name: keyof DialogStates) => void;
  onConfirmDelete?: () => void;
  stems?: SimpleStem[];
  activeVersion?: { versionLabel: string; audioUrl: string; sunoId?: string } | null;
}

export function TrackDialogsPortal({
  track,
  dialogs,
  onCloseDialog,
  onConfirmDelete,
  stems = [],
  activeVersion,
}: TrackDialogsPortalProps) {
  const isMobile = useIsMobile();
  const [coverAudioFile, setCoverAudioFile] = useState<File | null>(null);

  // Auto-load track audio when cover dialog opens — use active version if available
  useEffect(() => {
    const audioUrl = activeVersion?.audioUrl || track.audio_url;
    if (dialogs.cover && audioUrl && !coverAudioFile) {
      // Fetch the track audio and create a File object
      const loadAudio = async () => {
        try {
          const response = await fetch(audioUrl!);
          const blob = await response.blob();
          const fileName = `${track.title || "track"}.mp3`;
          const file = new File([blob], fileName, { type: "audio/mpeg" });
          setCoverAudioFile(file);
        } catch (error: unknown) {
          logger.warn("Failed to load track audio for cover dialog", { error });
        }
      };
      loadAudio();
    }

    // Reset when dialog closes
    if (!dialogs.cover) {
      setCoverAudioFile(null);
    }
  }, [dialogs.cover, track.audio_url, track.title]);

  // IMPORTANT: dialogs are lazily mounted (`dialogs.<name> && ...`) so heavy hooks
  // like usePreviewAudio don't acquire pooled <audio> elements per track card.
  // Rendering all dialogs eagerly for every visible track exhausts the 6-slot audio
  // pool and prevents the global player from playing anything.
  return (
    <>
      {/* Details - use Sheet on mobile, Dialog on desktop */}
      {dialogs.details &&
        (isMobile ? (
          <TrackDetailSheet
            track={track}
            open={dialogs.details}
            onOpenChange={(open) => !open && onCloseDialog("details")}
          />
        ) : (
          <TrackDetailDialog
            open={dialogs.details}
            onOpenChange={(open) => !open && onCloseDialog("details")}
            track={track}
          />
        ))}

      {/* Edit dialogs */}
      {dialogs.extend && (
        <ExtendTrackDialog
          open={dialogs.extend}
          onOpenChange={(open) => !open && onCloseDialog("extend")}
          track={track}
          activeAudioUrl={activeVersion?.audioUrl}
        />
      )}

      {dialogs.cover && (
        <AudioCoverDialog
          open={dialogs.cover}
          onOpenChange={(open) => !open && onCloseDialog("cover")}
          initialAudioFile={coverAudioFile || undefined}
          prefillData={{
            title: track.title,
            style: track.style,
            lyrics: track.lyrics,
            isInstrumental: track.is_instrumental ?? false,
          }}
        />
      )}

      {/* Mashup — second source track is picked in the dialog itself. */}
      {dialogs.mashup && (
        <MashupDialog
          open={dialogs.mashup}
          onOpenChange={(open) => !open && onCloseDialog("mashup")}
          initialTrackId={track.id}
          projectId={track.project_id ?? undefined}
        />
      )}

      {/* Organize dialogs */}
      {dialogs.addToProject && (
        <AddToProjectDialog
          open={dialogs.addToProject}
          onOpenChange={(open) => !open && onCloseDialog("addToProject")}
          track={track}
        />
      )}

      {dialogs.share && (
        <ShareTrackDialog open={dialogs.share} onOpenChange={(open) => !open && onCloseDialog("share")} track={track} />
      )}

      {dialogs.addToPlaylist && (
        <AddToPlaylistDialog
          open={dialogs.addToPlaylist}
          onOpenChange={(open) => !open && onCloseDialog("addToPlaylist")}
          track={track}
        />
      )}

      {/* Delete confirmation */}
      {dialogs.deleteConfirm && (
        <ConfirmationDialog
          open={dialogs.deleteConfirm}
          onOpenChange={(open) => !open && onCloseDialog("deleteConfirm")}
          title="Удалить трек?"
          description={`Вы уверены, что хотите удалить трек "${track.title || "Без названия"}"? Это действие нельзя отменить.`}
          confirmLabel="Удалить"
          cancelLabel="Отмена"
          variant="destructive"
          onConfirm={onConfirmDelete ?? (() => {})}
        />
      )}

      {/* Rename dialog */}
      {dialogs.rename && (
        <RenameTrackDialog
          track={track}
          open={dialogs.rename}
          onOpenChange={(open) => !open && onCloseDialog("rename")}
        />
      )}

      {/* Create Artist dialog — uses usePreviewAudio, MUST be lazy-mounted. */}
      {dialogs.createArtist && (
        <CreateArtistDialog
          open={dialogs.createArtist}
          onOpenChange={(open) => !open && onCloseDialog("createArtist")}
          fromTrack={{
            title: track.title,
            style: track.style,
            tags: track.tags,
            cover_url: track.cover_url,
            audio_url: track.audio_url,
          }}
        />
      )}

      {/* Add Vocals dialog */}
      {dialogs.addVocals && (
        <AddVocalsDialog
          open={dialogs.addVocals}
          onOpenChange={(open) => !open && onCloseDialog("addVocals")}
          track={track}
          activeAudioUrl={activeVersion?.audioUrl}
        />
      )}

      {/* Remix dialog — форма с параметрами активной версии */}
      {dialogs.remix && (
        <RemixTrackDialog
          open={dialogs.remix}
          onOpenChange={(open) => !open && onCloseDialog("remix")}
          track={track}
          activeVersion={activeVersion}
        />
      )}

      {/* Add Instrumental dialog */}
      {dialogs.addInstrumental && (
        <AddInstrumentalDialog
          open={dialogs.addInstrumental}
          onOpenChange={(open) => !open && onCloseDialog("addInstrumental")}
          track={track}
          activeAudioUrl={activeVersion?.audioUrl}
        />
      )}
    </>
  );
}
