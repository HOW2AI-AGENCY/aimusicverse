import { useState, useRef, useEffect, useId } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileAudio } from "@/lib/icons";
import { toast } from "sonner";
import { uploadFile } from "@/api/storage.api";
import { logger } from "@/lib/logger";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReferenceAudio, ReferenceAudio } from "@/hooks/useReferenceAudio";
import { useAudioReference } from "@/hooks/useAudioReference";
import { useAudioActionAnalysis } from "@/hooks/audio-reference/useAudioActionAnalysis";
import { GuitarModeRecorder } from "./GuitarModeRecorder";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";
import { useAudioRecording } from "./audio-action-dialog/useAudioRecording";
import { AudioActionModeTabsSection, type AudioMode } from "./audio-action-dialog/AudioActionModeTabsSection";
import { AudioActionAnalyzingState } from "./audio-action-dialog/AudioActionAnalyzingState";
import { AudioActionUploadSection } from "./audio-action-dialog/AudioActionUploadSection";
import { AudioActionPreviewSection } from "./audio-action-dialog/AudioActionPreviewSection";

type RecordingMode = "standard" | "guitar";

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
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { saveAudio, updateAnalysis: updateDbAnalysis } = useReferenceAudio();
  const { setFromUpload, setFromCloud } = useAudioReference();
  const { analyzeAudio: runAnalyzeAudio, transcribeLyrics: runTranscribeLyrics } = useAudioActionAnalysis();
  const sourceId = useId();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("standard");
  const [showGuitarMode, setShowGuitarMode] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [savedAudioId, setSavedAudioId] = useState<string | null>(null);

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecording({
    onRecorded: (file, url) => {
      setAudioUrl(url);
      setAudioFile(file);
      analyzeAudio(file);
    },
  });

  // Register for studio audio coordination
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerStudioAudio(sourceId, () => {
        audio.pause();
        setIsPlaying(false);
      });
    }
    return () => unregisterStudioAudio(sourceId);
  }, [sourceId]);

  // Pause if global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to external playback state; setState is the intended side-effect
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  // Pool-based duration probe for the currently selected audio.
  const { duration: probedDuration } = usePreviewAudio({
    id: audioUrl ? `audio-action-${sourceId}` : "audio-action-none",
    src: audioUrl ?? "",
    priority: AudioPriority.LOW,
  });

  useEffect(() => {
    if (probedDuration && Number.isFinite(probedDuration)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing probed metadata into local state
      setAudioDuration(probedDuration);
    }
  }, [probedDuration]);

  // Analysis state with progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<{
    style?: string;
    genre?: string;
    mood?: string;
  } | null>(null);

  // Lyrics extraction state
  const [isExtractingLyrics, setIsExtractingLyrics] = useState(false);
  const [extractedLyrics, setExtractedLyrics] = useState<string | null>(null);
  const [hasVocals, setHasVocals] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      if (audioUrl && !audioUrl.startsWith("http")) {
        URL.revokeObjectURL(audioUrl);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting dialog state on close is an intentional side-effect
      setAudioUrl(null);
      setAudioFile(null);
      setAudioDuration(null);
      setIsPlaying(false);
      setMode(initialMode);
      setRecordingMode("standard");
      setShowGuitarMode(false);
      setAnalysisResult(null);
      setExtractedLyrics(null);
      setHasVocals(null);
      setSavedAudioId(null);
      setAnalysisStep(0);
      setAnalysisProgress(0);
    }
  }, [open, initialMode, audioUrl]);

  // Handle guitar mode recording complete
  const handleGuitarRecordingComplete = async (data: {
    audioFile: File;
    audioUrl: string;
    chordProgression: string[];
    styleDescription: string;
    useMode: "style" | "audio";
  }) => {
    setShowGuitarMode(false);

    // Notify parent about chords
    if (onChordsDetected && data.chordProgression.length > 0) {
      const progression = data.chordProgression.join(" → ");
      onChordsDetected(data.chordProgression, progression);
    }

    if (data.useMode === "style") {
      // Use style description as prompt, close dialog
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
      }
      toast.success("Описание стиля добавлено");
      onOpenChange(false);
    } else {
      // Use audio as reference - set the file and continue with normal flow
      setAudioFile(data.audioFile);
      setAudioUrl(data.audioUrl);

      // Also pass style description for additional context
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
        setAnalysisResult({ style: data.styleDescription });
      }

      toast.success("Аудио референс готов");
    }
  };

  // Analysis progress animation
  useEffect(() => {
    if (isAnalyzing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing progress animation state is an intentional side-effect of starting analysis
      setAnalysisStep(0);
      setAnalysisProgress(0);

      analysisIntervalRef.current = setInterval(() => {
        setAnalysisProgress((prev) => {
          const newProgress = prev + 2;
          // Update step based on progress
          if (newProgress >= 75) setAnalysisStep(3);
          else if (newProgress >= 50) setAnalysisStep(2);
          else if (newProgress >= 25) setAnalysisStep(1);

          return Math.min(newProgress, 95); // Cap at 95% until complete
        });
      }, 200);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (analysisResult) {
        setAnalysisProgress(100);
      }
    }
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isAnalyzing, analysisResult]);

  const uploadAndGetUrl = async (file: File): Promise<string> => {
    if (!user) throw new Error("Не авторизован");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/reference-${Date.now()}-${sanitizedName}`;

    const { data: uploadData, error: uploadError } = await uploadFile({
      bucket: "project-assets",
      path: fileName,
      file,
      upsert: false,
    });

    if (uploadError) {
      logger.error("Storage upload error", { error: uploadError.message });
      throw new Error(`Ошибка загрузки: ${uploadError.message}`);
    }

    return uploadData!.publicUrl;
  };

  const analyzeAudio = async (file: File, existingUrl?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Create timeout controller for 60 second limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      logger.info("Uploading and analyzing audio");

      const publicUrl = existingUrl || (await uploadAndGetUrl(file));

      // Save to reference_audio table
      let audioRecord: ReferenceAudio | null = null;
      if (!existingUrl) {
        audioRecord = await saveAudio({
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          durationSeconds: audioDuration ?? undefined,
          source: "upload",
          analysisStatus: "analyzing",
        });
        setSavedAudioId(audioRecord.id);
      }

      // Make request with timeout
      const analysisPromise = runAnalyzeAudio({ publicUrl, analysisType: "reference" });

      // Race between analysis and timeout
      const analysisResultData = await Promise.race([
        analysisPromise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("Превышено время ожидания анализа (60 сек)"));
          });
        }),
      ]);

      clearTimeout(timeoutId);

      const analysisResult = {
        style: analysisResultData.style,
        genre: analysisResultData.genre,
        mood: analysisResultData.mood,
      };
      setAnalysisResult(analysisResult);

      // Update database record
      if (audioRecord?.id || savedAudioId) {
        await updateDbAnalysis({
          id: audioRecord?.id || savedAudioId!,
          genre: analysisResult.genre,
          mood: analysisResult.mood,
          analysisStatus: "completed",
        });
      }

      if (analysisResult.style) {
        onAnalysisComplete?.(analysisResult.style);
        toast.success("Стиль определён!");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      logger.error("Audio analysis error", { error: message });
      toast.error(`Ошибка анализа: ${message}`);

      // Reset progress on error
      setAnalysisProgress(0);
      setAnalysisStep(0);

      // Update database record with failed status if exists
      if (savedAudioId) {
        await updateDbAnalysis({
          id: savedAudioId,
          analysisStatus: "failed",
        }).catch(() => {});
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractLyrics = async () => {
    if (!audioFile && !audioUrl) return;

    setIsExtractingLyrics(true);
    try {
      let publicUrl = audioUrl;
      if (audioFile && !audioUrl?.startsWith("http")) {
        publicUrl = await uploadAndGetUrl(audioFile);
      }

      const data = await runTranscribeLyrics({ publicUrl: publicUrl ?? "" });

      setHasVocals(data.hasVocals);

      // Update database record
      if (savedAudioId) {
        await updateDbAnalysis({
          id: savedAudioId,
          hasVocals: data.hasVocals,
          transcription: data.lyrics,
        });
      }

      if (data.hasVocals && data.lyrics) {
        setExtractedLyrics(data.lyrics);
        onLyricsExtracted?.(data.lyrics);
        toast.success("Текст извлечён!");
      } else {
        toast.info("Вокал не обнаружен - инструментальный трек");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      logger.error("Lyrics extraction error", { error: message });
      toast.error(`Ошибка извлечения: ${message}`);
    } finally {
      setIsExtractingLyrics(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Максимум 20 МБ");
      return;
    }

    const url = URL.createObjectURL(file);

    // Duration is read by the usePreviewAudio probe at the top of this file.
    setAudioUrl(url);
    setAudioFile(file);
    await analyzeAudio(file);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      pauseTrack();
      pauseAllStudioAudio(sourceId);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleConfirm = async () => {
    if (audioFile) {
      // Use unified reference system
      await setFromUpload(audioFile, mode);
      onAudioSelected(audioFile, mode);
      onOpenChange(false);
    }
  };

  // Handle cloud audio selection - integrates with unified reference
  const handleCloudSelect = (audio: ReferenceAudio) => {
    setFromCloud(audio, mode);
    onOpenChange(false);
  };

  const handleDirectGenerate = () => {
    if (audioFile && onOpenCoverDialog) {
      onOpenCoverDialog(audioFile, mode);
      onOpenChange(false);
    }
  };

  // Check if audio is ready for mode selection (analyzed)
  const isAudioReady = audioFile && analysisResult && !isAnalyzing;

  const content = (
    <div className="space-y-3">
      {/* Mode Tabs - Show ONLY after audio is analyzed */}
      {isAudioReady && <AudioActionModeTabsSection mode={mode} onModeChange={setMode} />}

      {/* Analysis Loading State - Animated */}
      {isAnalyzing && <AudioActionAnalyzingState analysisStep={analysisStep} analysisProgress={analysisProgress} />}

      {/* Upload/Record/History */}
      {/* Guitar Mode */}
      {showGuitarMode && (
        <GuitarModeRecorder
          onRecordingComplete={handleGuitarRecordingComplete}
          onCancel={() => setShowGuitarMode(false)}
        />
      )}

      {/* Upload/Record/History */}
      {!isAnalyzing && !audioFile && !showGuitarMode && (
        <AudioActionUploadSection
          mode={mode}
          onCloudSelect={handleCloudSelect}
          onFileUpload={handleFileUpload}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onGuitarMode={() => setShowGuitarMode(true)}
        />
      )}

      {/* Audio Preview & Analysis */}
      {!isAnalyzing && audioFile && (
        <AudioActionPreviewSection
          mode={mode}
          audioFile={audioFile}
          audioUrl={audioUrl}
          audioDuration={audioDuration}
          audioRef={audioRef}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onRemove={handleRemove}
          onEnded={() => setIsPlaying(false)}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          extractedLyrics={extractedLyrics}
          hasVocals={hasVocals}
          isExtractingLyrics={isExtractingLyrics}
          onExtractLyrics={extractLyrics}
          onOpenCoverDialog={onOpenCoverDialog}
          onDirectGenerate={handleDirectGenerate}
          onConfirm={handleConfirm}
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
