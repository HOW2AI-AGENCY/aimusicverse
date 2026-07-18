/**
 * Audio Record Dialog
 *
 * Orchestrates recording, cloud audio selection, and AI processing.
 * Business logic extracted to useAudioRecordDialog hook;
 * UI sections to RecordTabContent and ProcessingActionCards.
 */
import { Mic, Loader2 } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatePresence } from "@/lib/motion";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { InstrumentalSettingsDialog } from "./InstrumentalSettingsDialog";
import { CloudAudioPicker } from "./CloudAudioPicker";
import { RecordTabContent } from "./RecordTabContent";
import { ProcessingActionCards } from "./ProcessingActionCards";
import { useAudioRecordDialog } from "./useAudioRecordDialog";

interface AudioRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AudioRecordDialog = ({ open, onOpenChange }: AudioRecordDialogProps) => {
  const {
    sourceTab,
    setSourceTab,
    state,
    audioUrl,
    isPlaying,
    duration,
    processingAction,
    selectedCloudAudio,
    autoSavedUrl,
    isAutoSaving,
    audioRef,
    showSettingsDialog,
    setShowSettingsDialog,
    startRecording,
    stopRecording,
    togglePlayback,
    resetRecording,
    handleInstrumentalClick,
    handleSettingsConfirm,
    uploadAndProcess,
    handleCloudSelect,
    canProcess,
    formatTime,
    handlePlaybackEnded,
  } = useAudioRecordDialog(open, onOpenChange);

  // Telegram back button
  useTelegramBackButton({ visible: open, onClick: () => onOpenChange(false) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md h-[85vh] sm:h-[90vh] flex flex-col overflow-hidden"
        style={{
          paddingTop:
            "max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))",
        }}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mic className="w-5 h-5 text-primary" />
            Запись вокала
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Запишите голос или выберите аудио из облака. AI добавит профессиональный инструментал или вокал к вашей
            записи.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-1">
          {/* Source Tabs */}
          <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as "record" | "cloud")}>
            <TabsList className="w-full grid grid-cols-2 h-11 sm:h-10">
              <TabsTrigger value="record" className="gap-2 min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
                <Mic className="w-4 h-4" />
                Записать
              </TabsTrigger>
              <TabsTrigger value="cloud" className="gap-2 min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm">
                <Mic className="w-4 h-4" />
                Из облака
              </TabsTrigger>
            </TabsList>

            {/* Record Tab */}
            <TabsContent value="record" className="mt-4">
              <RecordTabContent
                state={state}
                duration={duration}
                audioUrl={audioUrl}
                isPlaying={isPlaying}
                isAutoSaving={isAutoSaving}
                autoSavedUrl={autoSavedUrl}
                audioRef={audioRef}
                formatTime={formatTime}
                onStart={startRecording}
                onStop={stopRecording}
                onTogglePlayback={togglePlayback}
                onReset={resetRecording}
                onPlaybackEnded={handlePlaybackEnded}
              />
            </TabsContent>

            {/* Cloud Tab */}
            <TabsContent value="cloud" className="mt-4">
              <CloudAudioPicker onSelect={handleCloudSelect} selectedId={selectedCloudAudio?.id} />
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <AnimatePresence>
            {canProcess && (
              <ProcessingActionCards
                processingAction={processingAction}
                onInstrumental={handleInstrumentalClick}
                onVocals={() => uploadAndProcess("vocals")}
                onCover={() => uploadAndProcess("cover")}
                onExtend={() => uploadAndProcess("extend")}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Loading overlay */}
        {state === "uploading" && (
          <div className="text-center text-xs sm:text-sm text-muted-foreground shrink-0 px-2 pb-3 pt-2">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Загрузка и обработка...
          </div>
        )}
      </DialogContent>

      <InstrumentalSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onConfirm={handleSettingsConfirm}
        isProcessing={processingAction === "instrumental"}
      />
    </Dialog>
  );
};
