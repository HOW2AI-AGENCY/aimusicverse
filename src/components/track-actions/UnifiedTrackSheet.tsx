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
  Play, 
  Sparkles, 
  Layers, 
  Download, 
  Info, 
  Trash2 
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
          className="h-[85vh] max-h-[85vh] rounded-t-2xl flex flex-col pb-0 px-0"
        >
          {/* Compact Header */}
          <div className="px-4">
            <TrackSheetHeader track={track} />
          </div>
          
          {/* Quick Actions - 4 items only */}
          <div className="px-4">
            <QuickActionsSection 
              track={track} 
              onClose={() => onOpenChange(false)}
              onDownload={onDownload}
            />
          </div>

          {/* Versions Section - inline compact badges */}
          {versionCount > 1 && (
            <div className="px-4 mt-3 flex items-center justify-between">
              <VersionsSection track={track} compact />
            </div>
          )}

          {/* Scrollable Collapsible Sections */}
          <ScrollArea className="flex-1 mt-3">
            <div className="px-4 pb-safe space-y-2">
              
              {/* Playback & Queue */}
              <CollapsibleSection
                title="Воспроизведение"
                icon={Play}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
                defaultOpen
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

              {/* Studio Actions - Icon Grid */}
              <CollapsibleSection
                title="Студия"
                icon={Layers}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                badge={actionState.stemCount > 0 ? `${actionState.stemCount} стемов` : undefined}
              >
                <StudioActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </CollapsibleSection>

              {/* Create Actions - Icon Grid */}
              <CollapsibleSection
                title="Создать"
                icon={Sparkles}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
              >
                <CreateActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </CollapsibleSection>

              {/* Info - Icon Grid */}
              <CollapsibleSection
                title="Информация"
                icon={Info}
                iconColor="text-sky-500"
                iconBgColor="bg-sky-500/10"
              >
                <InfoActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </CollapsibleSection>

              {/* Download & Share - Icon Grid */}
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

              {/* Delete - Danger Zone */}
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
