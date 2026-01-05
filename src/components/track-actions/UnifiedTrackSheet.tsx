import type { Track } from '@/types/track';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { QuickActionsSection } from './sections/QuickActionsSection';
import { TrackSheetHeader } from './TrackSheetHeader';
import { PlaybackActions } from './sections/PlaybackActions';
import { CollapsibleSection } from './CollapsibleSection';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { 
  Sparkles, 
  Layers, 
  Download, 
  Trash2,
  ListMusic
} from 'lucide-react';

interface UnifiedTrackSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  /** List of tracks for "Play From Here" functionality */
  trackList?: Track[];
  /** Index of current track in the list */
  trackIndex?: number;
}

export function UnifiedTrackSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload,
  trackList,
  trackIndex 
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
          className="h-[75vh] max-h-[75vh] rounded-t-2xl flex flex-col pb-0 px-0"
        >
          {/* Compact Header with status icons */}
          <div className="px-4">
            <TrackSheetHeader track={track} />
          </div>
          
          {/* Quick Actions - icons only */}
          <div className="px-4">
            <QuickActionsSection 
              track={track} 
              onClose={() => onOpenChange(false)}
              onDownload={onDownload}
            />
          </div>

          {/* Versions Section - inline compact badges */}
          {versionCount > 1 && (
            <div className="px-4 pb-2 flex items-center justify-center">
              <VersionsSection track={track} compact />
            </div>
          )}

          {/* Scrollable Sections - Minimized */}
          <ScrollArea className="flex-1">
            <div className="px-4 pb-safe space-y-1.5">
              
              {/* Queue & Playback */}
              <CollapsibleSection
                title="Очередь"
                icon={ListMusic}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
              >
                <QueueActionsSheet 
                  track={track} 
                  onAction={() => onOpenChange(false)}
                  trackList={trackList}
                  trackIndex={trackIndex}
                />
                <PlaybackActions 
                  track={track} 
                  variant="sheet"
                  onClose={() => onOpenChange(false)}
                />
              </CollapsibleSection>

              {/* Create + Studio combined */}
              <CollapsibleSection
                title="Создать"
                icon={Sparkles}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
                defaultOpen
              >
                <CreateActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </CollapsibleSection>

              {/* Studio */}
              <CollapsibleSection
                title="Студия"
                icon={Layers}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                badge={actionState.stemCount > 0 ? `${actionState.stemCount}` : undefined}
              >
                <StudioActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
                {/* Info actions moved here */}
                <div className="mt-2 pt-2 border-t border-border/50">
                  <InfoActions
                    track={track}
                    state={actionState}
                    onAction={executeAction}
                    variant="sheet"
                    isProcessing={isProcessing}
                  />
                </div>
              </CollapsibleSection>

              {/* Export - Download & Share */}
              <CollapsibleSection
                title="Экспорт"
                icon={Download}
                iconColor="text-emerald-500"
                iconBgColor="bg-emerald-500/10"
              >
                <DownloadActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
                <ShareActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </CollapsibleSection>

              {/* Delete - minimal */}
              <CollapsibleSection
                title="Удалить"
                icon={Trash2}
                iconColor="text-red-500"
                iconBgColor="bg-red-500/10"
              >
                <DeleteActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                />
              </CollapsibleSection>

            </div>
          </ScrollArea>
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
