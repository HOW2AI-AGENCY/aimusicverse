/**
 * UploadDialog - Dialog for uploading or recording reference audio
 */

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/date-utils";
import { Mic, Upload } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { UnifiedDialog } from "@/components/dialog";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { toast } from "sonner";
import { invokeAnalyzeAudio } from "@/services/audio-reference/cloud-audio.service";
import { uploadFile } from "@/api/storage.api";
import { useAuth } from "@/hooks/useAuth";
import { useReferenceAudio } from "@/hooks/useReferenceAudio";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { logger } from "@/lib/logger";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { saveAudio, updateAnalysis } = useReferenceAudio();

  // Pool-based duration probe for the currently selected file.
  const pendingUrl = pendingFile ? URL.createObjectURL(pendingFile) : null;
  const { duration: probedDuration } = usePreviewAudio({
    id: pendingFile ? `upload-dialog-${pendingFile.name}-${pendingFile.size}` : "upload-dialog-none",
    src: pendingUrl ?? "",
    priority: AudioPriority.LOW,
  });

  // Когда пул репортует конечную длительность, доделываем загрузку.
  useEffect(() => {
    if (!pendingFile || !probedDuration || !Number.isFinite(probedDuration) || uploading) {
      return;
    }
    void performUpload(pendingFile, probedDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probedDuration, pendingFile]);

  const performUpload = async (file: File, duration: number) => {
    if (!user) return;
    setUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${user.id}/reference-${timestamp}-${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await uploadFile({
        bucket: "reference-audio",
        path,
        file,
      });

      if (uploadError) throw uploadError;

      const publicUrl = uploadData!.publicUrl;

      // Save audio first
      const savedAudio = await saveAudio({
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        durationSeconds: duration ? Math.round(duration) : undefined,
        source: "upload",
        analysisStatus: "analyzing",
      });

      toast.success("Файл загружен, запускаем анализ...");
      onOpenChange(false);
      setPendingFile(null);

      // Auto-trigger analysis
      try {
        const { data, error } = await invokeAnalyzeAudio({
          audioUrl: publicUrl,
          referenceId: savedAudio.id,
        });

        if (!error && data?.parsed) {
          await updateAnalysis({
            id: savedAudio.id,
            genre: data.parsed.genre,
            mood: data.parsed.mood,
            styleDescription: data.parsed.style_description,
            tempo: data.parsed.tempo,
            energy: data.parsed.energy,
            bpm: data.parsed.bpm ? Number(data.parsed.bpm) : undefined,
            instruments: data.parsed.instruments,
            vocalStyle: data.parsed.vocal_style,
            hasVocals: data.parsed.has_vocals ?? true,
            analysisStatus: "completed",
          });
          toast.success("Анализ завершен");
        }
      } catch (analysisError) {
        logger.error("Auto analysis failed", analysisError);
      }
    } catch (error: unknown) {
      logger.error("Upload error", error instanceof Error ? error : new Error(String(error)));
      toast.error("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  // Handle recording completion
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!user) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `recording_${format(new Date(), "dd-MM-yyyy_HH-mm")}.webm`;
      const path = `${user.id}/recording-${timestamp}.webm`;

      const { data: uploadData, error: uploadError } = await uploadFile({
        bucket: "reference-audio",
        path,
        file: audioBlob,
      });

      if (uploadError) throw uploadError;

      await saveAudio({
        fileName,
        fileUrl: uploadData!.publicUrl,
        fileSize: audioBlob.size,
        mimeType: "audio/webm",
        durationSeconds: duration,
        source: "recording",
      });

      toast.success("Запись сохранена");
      onOpenChange(false);
    } catch (error) {
      logger.error("Upload recording error", error);
      toast.error("Ошибка сохранения записи");
    } finally {
      setUploading(false);
    }
  };

  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecording({
    onRecordingComplete: handleRecordingComplete,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    // Запускаем probe — useEffect выше досчитает длительность и догрузит файл.
    setPendingFile(file);
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(o) => {
        if (isRecording) {
          stopRecording();
        }
        onOpenChange(o);
      }}
      title="Добавить аудио"
    >
      <div className="space-y-4">
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />

        {/* Record Button */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all",
            isRecording ? "border-red-500 bg-red-500/10" : "border-primary/30 bg-primary/5 hover:border-primary/50",
          )}
        >
          {isRecording && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-500">{formatTime(recordingTime)}</span>
            </div>
          )}

          <Button
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={cn("w-16 h-16 rounded-full", isRecording && "animate-pulse")}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
          >
            {uploading ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          <p className="text-sm mt-3 text-center">
            {isRecording ? "Нажмите, чтобы остановить" : "Записать с микрофона"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Гитара, голос, мелодия</p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">или</span>
          </div>
        </div>

        {/* Upload Button */}
        <Button
          className="w-full h-12 gap-2"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || isRecording}
        >
          <Upload className="w-5 h-5" />
          Загрузить файл
        </Button>

        <p className="text-xs text-muted-foreground text-center">Поддерживаются MP3, WAV, M4A</p>
      </div>
    </UnifiedDialog>
  );
}
