import { Track } from '@/hooks/useTracksOptimized';
import { ExtendTrackDialog } from '@/components/ExtendTrackDialog';
import { AddVocalsDialog } from '@/components/AddVocalsDialog';
import { AddInstrumentalDialog } from '@/components/AddInstrumentalDialog';
import { CreateArtistDialog } from '@/components/CreateArtistDialog';
import { AddToProjectDialog } from '@/components/track-menu/AddToProjectDialog';
import { ShareTrackDialog } from '@/components/track-menu/ShareTrackDialog';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { TrackDetailSheet } from '@/components/TrackDetailSheet';
import { LyricsSheet } from '@/components/LyricsSheet';
import { TrackDetailDialog } from '@/components/TrackDetailDialog';
import { LyricsDialog } from '@/components/LyricsDialog';
import { AudioCoverDialog } from '@/components/AudioCoverDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface DialogStates {
  details: boolean;
  lyrics: boolean;
  extend: boolean;
  cover: boolean;
  addVocals: boolean;
  addInstrumental: boolean;
  createArtist: boolean;
  addToProject: boolean;
  share: boolean;
  addToPlaylist: boolean;
  deleteConfirm: boolean;
}

interface TrackDialogsPortalProps {
  track: Track;
  dialogs: DialogStates;
  onCloseDialog: (key: keyof DialogStates) => void;
  onConfirmDelete: () => void;
}

export function TrackDialogsPortal({
  track,
  dialogs,
  onCloseDialog,
  onConfirmDelete,
}: TrackDialogsPortalProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Details - use Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <TrackDetailSheet
          track={track}
          open={dialogs.details}
          onOpenChange={(open) => !open && onCloseDialog('details')}
        />
      ) : (
        <TrackDetailDialog
          open={dialogs.details}
          onOpenChange={(open) => !open && onCloseDialog('details')}
          track={track}
        />
      )}

      {/* Lyrics - use Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <LyricsSheet
          track={track}
          open={dialogs.lyrics}
          onOpenChange={(open) => !open && onCloseDialog('lyrics')}
        />
      ) : (
        <LyricsDialog
          open={dialogs.lyrics}
          onOpenChange={(open) => !open && onCloseDialog('lyrics')}
          track={track}
        />
      )}

      {/* Edit dialogs */}
      <ExtendTrackDialog
        open={dialogs.extend}
        onOpenChange={(open) => !open && onCloseDialog('extend')}
        track={track}
      />

      <AudioCoverDialog
        open={dialogs.cover}
        onOpenChange={(open) => !open && onCloseDialog('cover')}
        prefillData={{
          title: track.title,
          style: track.style,
          lyrics: track.lyrics,
          isInstrumental: track.is_instrumental ?? false,
        }}
      />

      <AddVocalsDialog
        open={dialogs.addVocals}
        onOpenChange={(open) => !open && onCloseDialog('addVocals')}
        track={track}
      />

      <AddInstrumentalDialog
        open={dialogs.addInstrumental}
        onOpenChange={(open) => !open && onCloseDialog('addInstrumental')}
        track={track}
      />

      {/* Organize dialogs */}
      <CreateArtistDialog
        open={dialogs.createArtist}
        onOpenChange={(open) => !open && onCloseDialog('createArtist')}
        fromTrack={{
          title: track.title,
          style: track.style,
          tags: track.tags,
          cover_url: track.cover_url,
        }}
      />

      <AddToProjectDialog
        open={dialogs.addToProject}
        onOpenChange={(open) => !open && onCloseDialog('addToProject')}
        track={track}
      />

      <ShareTrackDialog
        open={dialogs.share}
        onOpenChange={(open) => !open && onCloseDialog('share')}
        track={track}
      />

      <AddToPlaylistDialog
        open={dialogs.addToPlaylist}
        onOpenChange={(open) => !open && onCloseDialog('addToPlaylist')}
        track={track}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={dialogs.deleteConfirm}
        onOpenChange={(open) => !open && onCloseDialog('deleteConfirm')}
        title="Удалить трек?"
        description={`Вы уверены, что хотите удалить трек "${track.title || 'Без названия'}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
