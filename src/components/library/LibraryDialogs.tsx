/**
 * LibraryDialogs - Consolidated dialog components for Library page
 * 
 * Extracts all dialog rendering to reduce Library.tsx complexity
 * 
 * @module components/library/LibraryDialogs
 */

import { memo } from "react";
import type { Track } from "@/hooks/useTracks";
import type { DeepLinkDialogType } from "@/hooks/useLibraryDeepLinks";
import { TrackDetailSheet } from "@/components/TrackDetailSheet";
import { AddVocalsDialog } from "@/components/AddVocalsDialog";
import { AddInstrumentalDialog } from "@/components/AddInstrumentalDialog";
import { ExtendTrackDialog } from "@/components/ExtendTrackDialog";
import { AudioCoverDialog } from "@/components/AudioCoverDialog";

interface LibraryDialogsProps {
  // Track detail sheet
  selectedTrackForDetail: Track | null;
  onCloseTrackDetail: () => void;
  
  // Deep link dialogs
  deepLinkDialogTrack: Track | null;
  deepLinkDialogType: DeepLinkDialogType;
  onCloseDeepLinkDialog: () => void;
}

export const LibraryDialogs = memo(function LibraryDialogs({
  selectedTrackForDetail,
  onCloseTrackDetail,
  deepLinkDialogTrack,
  deepLinkDialogType,
  onCloseDeepLinkDialog,
}: LibraryDialogsProps) {
  return (
    <>
      {/* Track Detail Sheet for deep link */}
      {selectedTrackForDetail && (
        <TrackDetailSheet
          open={!!selectedTrackForDetail}
          onOpenChange={(open) => !open && onCloseTrackDetail()}
          track={selectedTrackForDetail}
        />
      )}
      
      {/* Deep link action dialogs */}
      {deepLinkDialogTrack && deepLinkDialogType === 'add_vocals' && (
        <AddVocalsDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) onCloseDeepLinkDialog();
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'add_instrumental' && (
        <AddInstrumentalDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) onCloseDeepLinkDialog();
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'extend' && (
        <ExtendTrackDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) onCloseDeepLinkDialog();
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'cover' && (
        <AudioCoverDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) onCloseDeepLinkDialog();
          }}
          prefillData={{
            title: deepLinkDialogTrack.title,
            style: deepLinkDialogTrack.style,
            lyrics: deepLinkDialogTrack.lyrics,
            isInstrumental: deepLinkDialogTrack.is_instrumental ?? false,
          }}
        />
      )}
    </>
  );
});
