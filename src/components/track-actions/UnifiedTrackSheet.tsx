import type { Track } from '@/types/track';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useTrackActionsState } from '@/hooks/useTrackActionsState';
import { InfoActions } from './sections/InfoActions';
import { DownloadActions } from './sections/DownloadActions';
import { ShareActions } from './sections/ShareActions';
import { StudioActions } from './sections/StudioActions';
import { CreateActions } from './sections/CreateActions';
import { DeleteActions } from './sections/DeleteActions';
import { QueueActionsSheet } from './sections/QueueActions';
import { TrackDialogsPortal } from './TrackDialogsPortal';
import { VersionsSection } from './sections/VersionsSection';
import { QuickStemsButton } from './sections/QuickStemsButton';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';

interface UnifiedTrackSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function UnifiedTrackSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload 
}: UnifiedTrackSheetProps) {
  // Telegram BackButton integration
  useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });

  const {
    actionState,
    isProcessing,
    dialogs,
    closeDialog,
    executeAction,
    handleConfirmDelete,
    versionCount,
    stems,
  } = useTrackActionsState({
    track: track!,
    onDelete,
    onDownload,
    onClose: () => onOpenChange(false),
  });

  if (!track) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[80vh] rounded-t-xl overflow-y-auto touch-pan-y overscroll-contain pb-safe"
        >
          <SheetHeader>
            <SheetTitle className="text-left">
              {track.title || 'Без названия'}
            </SheetTitle>
            {track.style && (
              <p className="text-sm text-muted-foreground text-left">
                {track.style}
              </p>
            )}
          </SheetHeader>
          
          <div className="mt-6 space-y-1">
            {/* Quick Stems CTA - prominent button for new tracks */}
            <QuickStemsButton
              track={track}
              state={actionState}
              onAction={executeAction}
              isProcessing={isProcessing}
              className="mb-4"
            />

            {/* Versions Section - if multiple versions exist */}
            {versionCount > 1 && (
              <>
                <VersionsSection track={track} />
                <Separator className="my-2" />
              </>
            )}

            {/* Info Actions */}
            <InfoActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            <Separator className="my-2" />

            {/* Queue Actions */}
            <QueueActionsSheet 
              track={track} 
              onAction={() => onOpenChange(false)} 
            />

            <Separator className="my-2" />
            <DownloadActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            {/* Share Actions */}
            <ShareActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            {/* Studio Actions */}
            <StudioActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            {/* Create Actions */}
            <CreateActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            <Separator className="my-2" />

            {/* Delete Actions */}
            <DeleteActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
            />
          </div>
        </SheetContent>
      </Sheet>

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
