import type { Track } from '@/types/track';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
import { TrackSheetHeader } from './TrackSheetHeader';
import { ActionCategory } from './ActionCategory';
import { AIActions } from './sections/AIActions';
import { PlaybackActions } from './sections/PlaybackActions';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal, Layers, Sparkles, Play, Brain, Share2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          className="h-auto max-h-[85vh] rounded-t-2xl overflow-hidden pb-safe"
        >
          {/* New Enhanced Header with Cover */}
          <TrackSheetHeader track={track} />
          
          {/* Quick Actions - horizontal scroll bar */}
          <QuickActionsSection 
            track={track} 
            onClose={() => onOpenChange(false)}
            onDownload={onDownload}
          />

          <Separator className="my-3" />
          
          <ScrollArea className="max-h-[50vh] pr-2 -mr-2">
            <div className="space-y-4 pb-4">
              {/* Quick Stems CTA - prominent button for new tracks */}
              <QuickStemsButton
                track={track}
                state={actionState}
                onAction={executeAction}
                isProcessing={isProcessing}
              />

              {/* Versions Section - if multiple versions exist */}
              {versionCount > 1 && (
                <VersionsSection track={track} />
              )}

              {/* Queue Actions - important for playback */}
              <ActionCategory icon={Play} title="Воспроизведение" color="primary">
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
              </ActionCategory>

              {/* Studio & Create Actions - frequently used */}
              <ActionCategory icon={Layers} title="Студия" color="info">
                <StudioActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </ActionCategory>

              <ActionCategory icon={Sparkles} title="Создание" color="warning">
                <CreateActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                />
              </ActionCategory>

              {/* AI Actions - new section */}
              <ActionCategory icon={Brain} title="AI Инструменты" color="primary">
                <AIActions
                  track={track}
                  state={actionState}
                  onAction={executeAction}
                  variant="sheet"
                  isProcessing={isProcessing}
                  onClose={() => onOpenChange(false)}
                />
              </ActionCategory>

              {/* More Actions - collapsible section for less common actions */}
              <Collapsible open={moreActionsOpen} onOpenChange={setMoreActionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between gap-3 h-12 mt-2 border border-border/50 rounded-xl"
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
                        className="overflow-hidden space-y-4 pt-4"
                      >
                        {/* Info Actions */}
                        <div className="space-y-1">
                          <InfoActions
                            track={track}
                            state={actionState}
                            onAction={executeAction}
                            variant="sheet"
                            isProcessing={isProcessing}
                          />
                        </div>

                        {/* Share Actions */}
                        <ActionCategory icon={Share2} title="Поделиться" color="success">
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
                        </ActionCategory>

                        <Separator className="my-2" />

                        {/* Delete Actions */}
                        <ActionCategory icon={Trash2} title="Опасная зона" color="danger">
                          <DeleteActions
                            track={track}
                            state={actionState}
                            onAction={executeAction}
                            variant="sheet"
                          />
                        </ActionCategory>
                      </motion.div>
                    </CollapsibleContent>
                  )}
                </AnimatePresence>
              </Collapsible>
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
