import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileAudio, Disc, ArrowRight } from "@/lib/icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { AudioActionAnalyzing } from "./AudioActionAnalyzing";
import { AudioActionInput } from "./AudioActionInput";
import { AudioActionPreview } from "./AudioActionPreview";
import { useAudioActionState } from "./useAudioActionState";

type AudioMode = "cover" | "extend";

interface AudioActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioSelected: (file: File, mode: AudioMode) => void;
  onAnalysisComplete?: (styleDescription: string) => void;
  onLyricsExtracted?: (lyrics: string) => void;
  onChordsDetected?: (chords: string[], progression: string) => void;
  initialMode?: AudioMode;
  /** Callback to open UploadAudioDialog for direct cover/extend generation */
  onOpenCoverDialog?: (file: File, mode: AudioMode) => void;
}

const modeConfig = {
  cover: { icon: Disc, label: "Кавер", desc: "Новая версия в другом стиле" },
  extend: { icon: ArrowRight, label: "Расширить", desc: "Продолжить композицию" },
};

export function AudioActionDialog({
  open,
  onOpenChange,
  onAudioSelected,
  onAnalysisComplete,
  onLyricsExtracted,
  onChordsDetected,
  initialMode = "cover",
  onOpenCoverDialog,
}: AudioActionDialogProps) {
  const isMobile = useIsMobile();

  const state = useAudioActionState({
    open,
    initialMode,
    onAnalysisComplete,
    onLyricsExtracted,
    onChordsDetected,
    onAudioSelected,
    onOpenChange,
  });

  const isAudioReady = state.audioFile && state.analysisResult && !state.isAnalyzing;

  const content = (
    <div className="space-y-3">
      {/* Mode Tabs - Show ONLY after audio is analyzed */}
      {isAudioReady && (
        <>
          <div className="text-center text-xs text-muted-foreground mb-2">Выберите действие:</div>
          <Tabs value={state.mode} onValueChange={(v) => state.setMode(v as AudioMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10">
              {(["cover", "extend"] as const).map((m) => {
                const cfg = modeConfig[m];
                const Icon = cfg.icon;
                return (
                  <TabsTrigger
                    key={m}
                    value={m}
                    className="flex items-center gap-2 text-sm data-[state=active]:bg-primary/10"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cfg.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground text-center">{modeConfig[state.mode].desc}</p>
        </>
      )}

      {/* Analysis Loading State */}
      {state.isAnalyzing && (
        <AudioActionAnalyzing analysisStep={state.analysisStep} analysisProgress={state.analysisProgress} />
      )}

      {/* Upload/Record/History */}
      {!state.isAnalyzing && !state.audioFile && (
        <AudioActionInput
          mode={state.mode}
          isRecording={state.isRecording}
          recordingTime={state.recordingTime}
          showGuitarMode={state.showGuitarMode}
          onFileUpload={state.handleFileUpload}
          onStartRecording={state.startRecording}
          onStopRecording={state.stopRecording}
          onShowGuitarMode={() => state.setShowGuitarMode(true)}
          onGuitarRecordingComplete={state.handleGuitarRecordingComplete}
          onCancelGuitarMode={() => state.setShowGuitarMode(false)}
          onCloudSelect={state.handleCloudSelect}
        />
      )}

      {/* Audio Preview & Analysis */}
      {!state.isAnalyzing && state.audioFile && (
        <AudioActionPreview
          audioFile={state.audioFile}
          audioUrl={state.audioUrl}
          audioDuration={state.audioDuration}
          analysisResult={state.analysisResult}
          isAnalyzing={state.isAnalyzing}
          mode={state.mode}
          extractedLyrics={state.extractedLyrics}
          hasVocals={state.hasVocals}
          isExtractingLyrics={state.isExtractingLyrics}
          onExtractLyrics={state.extractLyrics}
          onRemove={state.handleRemove}
          onConfirm={state.handleConfirm}
          onOpenCoverDialog={onOpenCoverDialog}
          onClose={() => onOpenChange(false)}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="py-3 text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <FileAudio className="w-4 h-4 text-primary" />
              Аудио
            </DrawerTitle>
            <DrawerDescription className="text-xs">Загрузите, запишите или выберите из истории</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-4">{content}</ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="audio-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            Аудио
          </DialogTitle>
          <DialogDescription id="audio-dialog-description">
            Загрузите, запишите или выберите из истории
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
