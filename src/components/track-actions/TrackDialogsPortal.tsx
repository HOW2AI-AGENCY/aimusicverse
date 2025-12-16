import { Track } from '@/hooks/useTracksOptimized';
import { ExtendTrackDialog } from '@/components/ExtendTrackDialog';
import { NewArrangementDialog } from '@/components/NewArrangementDialog';
import { NewVocalDialog } from '@/components/NewVocalDialog';
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
import { ReportTrackDialog } from './ReportTrackDialog';
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
  lyrics: boolean;
  extend: boolean;
  cover: boolean;
  newArrangement: boolean;
  newVocal: boolean;
  createArtist: boolean;
  addToProject: boolean;
  share: boolean;
  addToPlaylist: boolean;
  report: boolean;
  deleteConfirm: boolean;
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
  
  // Find vocal and instrumental stems
  const vocalStem = stems.find(s => s.stem_type === 'vocal' || s.stem_type === 'vocals');
  const instrumentalStem = stems.find(s => s.stem_type === 'instrumental');

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
        initialAudioFile={coverAudioFile || undefined}
        prefillData={{
          title: track.title,
          style: track.style,
          lyrics: track.lyrics,
          isInstrumental: track.is_instrumental ?? false,
        }}
      />

      {/* Stem-based dialogs */}
      <NewArrangementDialog
        open={dialogs.newArrangement}
        onOpenChange={(open) => !open && onCloseDialog('newArrangement')}
        track={track}
        vocalStem={vocalStem ? { ...vocalStem, track_id: track.id, separation_mode: null, version_id: null, created_at: null } : undefined}
      />

      <NewVocalDialog
        open={dialogs.newVocal}
        onOpenChange={(open) => !open && onCloseDialog('newVocal')}
        track={track}
        instrumentalStem={instrumentalStem ? { ...instrumentalStem, track_id: track.id, separation_mode: null, version_id: null, created_at: null } : undefined}
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

      {/* Report dialog */}
      <ReportTrackDialog
        open={dialogs.report}
        onOpenChange={(open) => !open && onCloseDialog('report')}
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
