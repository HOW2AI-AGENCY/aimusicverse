import type { Track } from '@/types/track';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { useTrackActionsState } from '@/hooks/useTrackActionsState';
import { InfoActions } from './sections/InfoActions';
import { DownloadActions } from './sections/DownloadActions';
import { ShareActions } from './sections/ShareActions';
import { StudioActions } from './sections/StudioActions';
import { CreateActions } from './sections/CreateActions';
import { DeleteActions } from './sections/DeleteActions';
import { QueueActionsMenu } from './sections/QueueActions';
import { TrackDialogsPortal } from './TrackDialogsPortal';

interface UnifiedTrackMenuProps {
  track: Track;
  onDelete?: () => void;
  onDownload?: () => void;
  /** List of tracks for "Play From Here" functionality */
  trackList?: Track[];
  /** Index of current track in the list */
  trackIndex?: number;
}

export function UnifiedTrackMenu({ 
  track, 
  onDelete, 
  onDownload,
  trackList,
  trackIndex 
}: UnifiedTrackMenuProps) {
  const {
    actionState,
    isProcessing,
    dialogs,
    closeDialog,
    executeAction,
    handleConfirmDelete,
    stems,
  } = useTrackActionsState({
    track,
    onDelete,
    onDownload,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-56 max-h-[70vh] bg-background/95 backdrop-blur-sm overflow-y-auto" 
          style={{ zIndex: 9999 }}
        >
          {/* Info Actions */}
          <InfoActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
            isProcessing={isProcessing}
          />

          {/* Queue Actions */}
          <QueueActionsMenu 
            track={track} 
            trackList={trackList}
            trackIndex={trackIndex}
          />

          <DropdownMenuSeparator />

          {/* Download Actions */}
          <DownloadActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
            isProcessing={isProcessing}
          />

          {/* Share Actions */}
          <ShareActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
            isProcessing={isProcessing}
          />

          {/* Studio Actions */}
          <StudioActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
            isProcessing={isProcessing}
          />

          {/* Create Actions */}
          <CreateActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
            isProcessing={isProcessing}
          />

          <DropdownMenuSeparator />

          {/* Delete Actions */}
          <DeleteActions
            track={track}
            state={actionState}
            onAction={executeAction}
            variant="dropdown"
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs Portal */}
      <TrackDialogsPortal
        track={track}
        dialogs={dialogs}
        onCloseDialog={closeDialog}
        onConfirmDelete={handleConfirmDelete}
        stems={stems}
      />
    </>
  );
}
