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
import { QuickActionsSection } from './sections/QuickActionsSection';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';

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
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  
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
          
          {/* Quick Actions - horizontal scroll bar */}
          <QuickActionsSection 
            track={track} 
            onClose={() => onOpenChange(false)}
            onDownload={onDownload}
          />

          <Separator className="my-2" />
          
          <div className="space-y-1">
            {/* Quick Stems CTA - prominent button for new tracks */}
            <QuickStemsButton
              track={track}
              state={actionState}
              onAction={executeAction}
              isProcessing={isProcessing}
              className="mb-3"
            />

            {/* Versions Section - if multiple versions exist */}
            {versionCount > 1 && (
              <>
                <VersionsSection track={track} />
                <Separator className="my-2" />
              </>
            )}

            {/* Queue Actions - important for playback */}
            <QueueActionsSheet 
              track={track} 
              onAction={() => onOpenChange(false)}
              trackList={trackList}
              trackIndex={trackIndex}
            />

            <Separator className="my-2" />

            {/* Studio Actions - frequently used */}
            <StudioActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            {/* Create Actions - frequently used */}
            <CreateActions
              track={track}
              state={actionState}
              onAction={executeAction}
              variant="sheet"
              isProcessing={isProcessing}
            />

            {/* More Actions - collapsible section for less common actions */}
            <Collapsible open={moreActionsOpen} onOpenChange={setMoreActionsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-3 h-12 mt-2"
                >
                  <div className="flex items-center gap-3">
                    <MoreHorizontal className="w-5 h-5" />
                    <span>Ещё действия</span>
                  </div>
                  <motion.div
                    animate={{ rotate: moreActionsOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </Button>
              </CollapsibleTrigger>
              <AnimatePresence>
                {moreActionsOpen && (
                  <CollapsibleContent forceMount>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-2 space-y-1 pt-1"
                    >
                      {/* Info Actions */}
                      <InfoActions
                        track={track}
                        state={actionState}
                        onAction={executeAction}
                        variant="sheet"
                        isProcessing={isProcessing}
                      />

                      {/* Download Actions */}
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

                      <Separator className="my-2" />

                      {/* Delete Actions */}
                      <DeleteActions
                        track={track}
                        state={actionState}
                        onAction={executeAction}
                        variant="sheet"
                      />
                    </motion.div>
                  </CollapsibleContent>
                )}
              </AnimatePresence>
            </Collapsible>
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
