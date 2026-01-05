import type { Track } from '@/types/track';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Play, Sparkles, MoreHorizontal } from 'lucide-react';

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
          className="h-[85vh] rounded-t-2xl flex flex-col pb-0"
        >
          {/* Compact Header */}
          <TrackSheetHeader track={track} />
          
          {/* Quick Actions - 4 items only */}
          <QuickActionsSection 
            track={track} 
            onClose={() => onOpenChange(false)}
            onDownload={onDownload}
          />

          <Separator className="my-2" />
          
          {/* Versions Section - if multiple versions exist */}
          {versionCount > 1 && (
            <div className="mb-2">
              <VersionsSection track={track} />
            </div>
          )}

          {/* Tabs for categories */}
          <Tabs defaultValue="playback" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-3 h-10 shrink-0">
              <TabsTrigger value="playback" className="text-xs gap-1.5">
                <Play className="w-3.5 h-3.5" />
                Воспроизв.
              </TabsTrigger>
              <TabsTrigger value="create" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Создание
              </TabsTrigger>
              <TabsTrigger value="more" className="text-xs gap-1.5">
                <MoreHorizontal className="w-3.5 h-3.5" />
                Ещё
              </TabsTrigger>
            </TabsList>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 min-h-0 mt-2">
              <TabsContent value="playback" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 pb-safe pr-2">
                    <QueueActionsSheet 
                      track={track} 
                      onAction={() => onOpenChange(false)}
                      trackList={trackList}
                      trackIndex={trackIndex}
                    />
                    <Separator className="my-2" />
                    <PlaybackActions 
                      track={track} 
                      variant="sheet"
                      onClose={() => onOpenChange(false)}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="create" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 pb-safe pr-2">
                    <StudioActions
                      track={track}
                      state={actionState}
                      onAction={executeAction}
                      variant="sheet"
                      isProcessing={isProcessing}
                    />
                    <Separator className="my-2" />
                    <CreateActions
                      track={track}
                      state={actionState}
                      onAction={executeAction}
                      variant="sheet"
                      isProcessing={isProcessing}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="more" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="space-y-1 pb-safe pr-2">
                    {/* Info */}
                    <InfoActions
                      track={track}
                      state={actionState}
                      onAction={executeAction}
                      variant="sheet"
                      isProcessing={isProcessing}
                    />
                    
                    <Separator className="my-2" />
                    
                    {/* Download & Share */}
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
                    
                    <Separator className="my-3" />
                    
                    {/* Delete - Danger Zone */}
                    <DeleteActions
                      track={track}
                      state={actionState}
                      onAction={executeAction}
                      variant="sheet"
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
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
