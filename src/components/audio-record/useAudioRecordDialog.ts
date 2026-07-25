/**
 * Audio Record Dialog — extracted hook
 *
 * Encapsulates all recording, playback, and upload state/logic
 * that was previously inline in AudioRecordDialog.tsx.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { uploadFile } from "@/api/storage.api";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { CloudAudioPicker } from "./CloudAudioPicker";
import { ReferenceManager } from "@/services/audio-reference/ReferenceManager";
import { invokeProcessRecordedAudio } from "@/services/audio-reference/generation.service";
import type { ReferenceAudio } from "@/hooks/useReferenceAudio";
import { useRecordingUpload } from "@/hooks/useRecordingUpload";
import { useUnifiedStudioStore } from "@/stores/useUnifiedStudioStore";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { InstrumentalSettingsDialog, type InstrumentalSettings } from "./InstrumentalSettingsDialog";

export type RecordingState = "idle" | "recording" | "recorded" | "uploading";
export type SourceTab = "record" | "cloud";
export type ProcessingAction = "instrumental" | "vocals" | "cover" | "extend" | null;

export interface UseAudioRecordDialogReturn {
  // State
  sourceTab: SourceTab;
  setSourceTab: (tab: SourceTab) => void;
  state: RecordingState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isPlaying: boolean;
  duration: number;
  processingAction: ProcessingAction;
  selectedCloudAudio: ReferenceAudio | null;
  autoSavedUrl: string | null;
  isAutoSaving: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // Settings dialog
  showSettingsDialog: boolean;
  setShowSettingsDialog: (open: boolean) => void;
  pendingInstrumentalSettings: InstrumentalSettings | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  togglePlayback: () => void;
  resetRecording: () => void;
  handleInstrumentalClick: () => void;
  handleSettingsConfirm: (settings: InstrumentalSettings) => Promise<void>;
  uploadAndProcess: (action: ProcessingAction, settings?: InstrumentalSettings) => Promise<void>;
  handleCloudSelect: (audio: ReferenceAudio) => void;

  // Computed
  canProcess: boolean;
  currentDuration: number;
  formatTime: (seconds: number) => string;
  handlePlaybackEnded: () => void;
}

export function useAudioRecordDialog(open: boolean, onOpenChange: (open: boolean) => void): UseAudioRecordDialogReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  const [sourceTab, setSourceTab] = useState<SourceTab>("record");
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [selectedCloudAudio, setSelectedCloudAudio] = useState<ReferenceAudio | null>(null);
  const [continueAt, setContinueAt] = useState(0);
  const [autoSavedUrl, setAutoSavedUrl] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingInstrumentalSettings, setPendingInstrumentalSettings] = useState<InstrumentalSettings | null>(null);

  const { uploadRecordingQuietly, isUploading: isAutoSaving } = useRecordingUpload({
    bucket: "reference-audio",
    folder: "mic-recordings",
    onSuccess: (result) => {
      setAutoSavedUrl(result.url);
      logger.info("Recording auto-saved to cloud", { url: result.url, size: result.size });
    },
    onError: (error) => {
      logger.error("Failed to auto-save recording", error);
    },
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Register and coordinate with other audio sources
  useEffect(() => {
    if (audioRef.current) {
      registerStudioAudio("record-dialog-player", () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    }
    return () => {
      unregisterStudioAudio("record-dialog-player");
    };
  }, [audioUrl]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [globalIsPlaying, isPlaying]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((track) => track.stop());
        logger.info("Recording stopped, auto-saving to cloud", { size: blob.size });
        uploadRecordingQuietly(blob);
      };

      mediaRecorder.start(100);
      setState("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      logger.error("Failed to start recording", { error });
      toast.error("Не удалось получить доступ к микрофону");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [state]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      pauseTrack();
      pauseAllStudioAudio("record-dialog-player");
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl, pauseTrack]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setState("idle");
    setDuration(0);
    setIsPlaying(false);
    setSelectedCloudAudio(null);
    setContinueAt(0);
    setAutoSavedUrl(null);
  }, [audioUrl]);

  const handleInstrumentalClick = () => {
    if (!user) {
      toast.error("Необходимо авторизоваться");
      return;
    }
    setShowSettingsDialog(true);
  };

  const handleSettingsConfirm = async (settings: InstrumentalSettings) => {
    setPendingInstrumentalSettings(settings);
    setShowSettingsDialog(false);
    await uploadAndProcess("instrumental", settings);
  };

  const uploadAndProcess = async (action: ProcessingAction, settings?: InstrumentalSettings) => {
    if (!user || !action) {
      toast.error("Необходимо авторизоваться");
      return;
    }

    if (sourceTab === "cloud" && selectedCloudAudio) {
      await processAudio(
        selectedCloudAudio.file_url,
        selectedCloudAudio.file_name,
        action,
        selectedCloudAudio.duration_seconds || duration,
        settings,
      );
      return;
    }

    if (!audioBlob) {
      toast.error("Нет записи для обработки");
      return;
    }

    setProcessingAction(action);
    setState("uploading");

    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }).replace(":", "-");
      const actionLabel = action === "vocals" ? "vocal" : action === "instrumental" ? "inst" : action;
      const fileName = `recordings/${user.id}/rec_${actionLabel}_${dateStr}_${timeStr}.webm`;

      const { data: uploadData, error: uploadError } = await uploadFile({
        bucket: "audio",
        path: fileName,
        file: audioBlob,
      });

      if (uploadError) throw uploadError;

      const publicUrl = uploadData!.publicUrl;
      const recordingTitle = `Запись ${action === "vocals" ? "вокала" : action === "instrumental" ? "инструментала" : ""} ${new Date().toLocaleDateString("ru-RU")}`;

      await processAudio(publicUrl, recordingTitle, action, duration, settings);
    } catch (error) {
      logger.error("Failed to upload recording", { error });
      toast.error("Ошибка загрузки записи");
      setProcessingAction(null);
      setState("recorded");
    }
  };

  const processAudio = async (
    audioUrl: string,
    title: string,
    action: ProcessingAction,
    audioDuration: number,
    settings?: InstrumentalSettings,
  ) => {
    if (!action) return;

    setProcessingAction(action);
    setState("uploading");

    try {
      if (action === "cover" || action === "extend") {
        ReferenceManager.createFromCloud(
          {
            id: crypto.randomUUID(),
            fileUrl: audioUrl,
            fileName: title,
            durationSeconds: audioDuration,
          },
          action,
        );

        toast.success(action === "cover" ? "Аудио добавлено для создания кавера!" : "Аудио добавлено для расширения!", {
          description: "Открываем форму генерации...",
        });

        onOpenChange(false);
        resetRecording();
        navigate("/generate");
        return;
      }

      const functionName = action === "instrumental" ? "suno-add-instrumental" : "suno-add-vocals";

      logger.info("Processing audio with action", { action, functionName, audioUrl, settings });

      let studioProjectId: string | null = null;
      let pendingTrackId: string | null = null;

      let stylePrompt = "professional instrumental backing track, full band arrangement";
      if (action === "instrumental" && settings) {
        const styleParts: string[] = [];
        if (settings.genre) styleParts.push(settings.genre);
        if (settings.mood) styleParts.push(settings.mood);
        styleParts.push(`${settings.bpm} bpm`);
        if (settings.customStyle) styleParts.push(settings.customStyle);
        stylePrompt = styleParts.join(", ") + ", professional instrumental backing track";
      }

      if (action === "instrumental") {
        const store = useUnifiedStudioStore.getState();

        studioProjectId = await store.createProject({
          name: `Студия: ${title}`,
          userId: user?.id,
          sourceAudioUrl: audioUrl,
          duration: audioDuration,
          tracks: [
            {
              name: "Вокал",
              type: "vocal",
              audioUrl,
              volume: 0.85,
              pan: 0,
              muted: false,
              solo: false,
              color: "hsl(340 82% 52%)",
            },
          ],
        });

        if (studioProjectId) {
          const settingsLabel =
            settings?.genre || settings?.mood ? ` (${[settings.genre, settings.mood].filter(Boolean).join(", ")})` : "";
          pendingTrackId = store.addPendingTrack({
            name: `Инструментал${settingsLabel} (генерация...)`,
            type: "instrumental",
          });
        }
      }

      const { data, error: functionError } = await invokeProcessRecordedAudio({
        action,
        audioUrl,
        title,
        prompt: action === "instrumental" ? "" : "Добавить профессиональный вокал к этому инструменталу",
        style: action === "instrumental" ? stylePrompt : "professional vocal performance, clear singing",
        negativeTags:
          action === "instrumental"
            ? "acapella, vocals only, karaoke, low quality"
            : "instrumental only, low quality, distorted",
        genre: settings?.genre ?? undefined,
        mood: settings?.mood ?? undefined,
        bpm: settings?.bpm,
        customStyle: settings?.customStyle,
        studioProjectId,
        pendingTrackId,
      });

      if (functionError) {
        logger.error("Edge function error", { error: functionError, action });
        throw functionError;
      }

      logger.info("Audio processing started", { action, response: data });

      if (action === "instrumental" && studioProjectId && pendingTrackId && data?.taskId) {
        const store = useUnifiedStudioStore.getState();

        logger.info("Updating pending track with taskId", {
          studioProjectId,
          pendingTrackId,
          taskId: data.taskId,
        });

        await store.updatePendingTrackTaskId(pendingTrackId, data.taskId);

        toast.success("Добавление инструментала началось! 🎸", {
          description: "Открываю студию для сведения...",
        });
        onOpenChange(false);
        resetRecording();
        navigate(`/studio-v2/project/${studioProjectId}`);
        return;
      }

      toast.success(
        action === "instrumental" ? "Добавление инструментала началось! 🎸" : "Добавление вокала началось! 🎤",
        { description: "Результат появится в библиотеке через 1-3 минуты" },
      );

      onOpenChange(false);
      resetRecording();
    } catch (error) {
      logger.error("Failed to process audio", { error, action });
      toast.error("Ошибка обработки", {
        description: error instanceof Error ? error.message : "Попробуйте еще раз",
      });
    } finally {
      setProcessingAction(null);
      setState(sourceTab === "cloud" ? "idle" : "recorded");
    }
  };

  const handleCloudSelect = (audio: ReferenceAudio) => {
    setSelectedCloudAudio(audio);
    if (audio.duration_seconds) {
      setContinueAt(Math.floor(audio.duration_seconds * 0.8));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const canProcess = sourceTab === "cloud" ? !!selectedCloudAudio : state === "recorded";
  const currentDuration = sourceTab === "cloud" ? selectedCloudAudio?.duration_seconds || 0 : duration;

  const handlePlaybackEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    sourceTab,
    setSourceTab,
    state,
    audioBlob,
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
    pendingInstrumentalSettings,
    startRecording,
    stopRecording,
    togglePlayback,
    resetRecording,
    handleInstrumentalClick,
    handleSettingsConfirm,
    uploadAndProcess,
    handleCloudSelect,
    canProcess,
    currentDuration,
    formatTime,
    handlePlaybackEnded,
  };
}
