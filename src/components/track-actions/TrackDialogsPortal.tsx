import type { Track } from '@/types/track';
import { ExtendTrackDialog } from '@/components/ExtendTrackDialog';
import { AddToProjectDialog } from '@/components/track-menu/AddToProjectDialog';
import { ShareTrackDialog } from '@/components/track-menu/ShareTrackDialog';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { TrackDetailSheet } from '@/components/TrackDetailSheet';
import { TrackDetailDialog } from '@/components/TrackDetailDialog';
import { AudioCoverDialog } from '@/components/AudioCoverDialog';
import { RenameTrackDialog } from './RenameTrackDialog';
import { CreateArtistDialog } from '@/components/CreateArtistDialog';
import { AddVocalsDialog } from '@/components/AddVocalsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

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
}

interface TrackDialogsPortalProps {
  track: Track;
  dialogs: DialogStates;
  onCloseDialog: (key: keyof DialogStates) => void;
  onConfirmDelete: () => void;
  stems?: SimpleStem[];
}

export function TrackDialogsPortal({
  track,
  dialogs,
  onCloseDialog,
  onConfirmDelete,
  stems = [],
}: TrackDialogsPortalProps) {
  const isMobile = useIsMobile();
  const [coverAudioFile, setCoverAudioFile] = useState<File | null>(null);

  // Auto-load track audio when cover dialog opens
  useEffect(() => {
    if (dialogs.cover && track.audio_url && !coverAudioFile) {
      // Fetch the track audio and create a File object
      const loadAudio = async () => {
        try {
          const response = await fetch(track.audio_url!);
          const blob = await response.blob();
          const fileName = `${track.title || 'track'}.mp3`;
          const file = new File([blob], fileName, { type: 'audio/mpeg' });
          setCoverAudioFile(file);
        } catch (error) {
          console.error('Failed to load track audio:', error);
        }
      };
      loadAudio();
    }
    
    // Reset when dialog closes
    if (!dialogs.cover) {
      setCoverAudioFile(null);
    }
  }, [dialogs.cover, track.audio_url, track.title]);

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

      {/* Edit dialogs */}
      <ExtendTrackDialog
        open={dialogs.extend}
        onOpenChange={(open) => !open && onCloseDialog('extend')}
        track={track}
      />

      <AudioCoverDialog
        open={dialogs.cover}
        onOpenChange={(open) => !open && onCloseDialog('cover')}
        initialAudioFile={coverAudioFile || undefined}
        prefillData={{
          title: track.title,
          style: track.style,
          lyrics: track.lyrics,
          isInstrumental: track.is_instrumental ?? false,
        }}
      />

      {/* Organize dialogs */}
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

      {/* Rename dialog */}
      <RenameTrackDialog
        track={track}
        open={dialogs.rename}
        onOpenChange={(open) => !open && onCloseDialog('rename')}
      />

      {/* Create Artist dialog */}
      <CreateArtistDialog
        open={dialogs.createArtist}
        onOpenChange={(open) => !open && onCloseDialog('createArtist')}
        fromTrack={{
          title: track.title,
          style: track.style,
          tags: track.tags,
          cover_url: track.cover_url,
          audio_url: track.audio_url,
        }}
      />

      {/* Add Vocals dialog */}
      <AddVocalsDialog
        open={dialogs.addVocals}
        onOpenChange={(open) => !open && onCloseDialog('addVocals')}
        track={track}
      />
    </>
  );
}
