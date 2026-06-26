import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useReferenceAudio, ReferenceAudio } from "@/hooks/useReferenceAudio";
import { useAudioReference } from "@/hooks/useAudioReference";

type AudioMode = "cover" | "extend";

interface UseAudioActionStateOptions {
  open: boolean;
  initialMode: AudioMode;
  onAnalysisComplete?: (styleDescription: string) => void;
  onLyricsExtracted?: (lyrics: string) => void;
  onChordsDetected?: (chords: string[], progression: string) => void;
  onAudioSelected: (file: File, mode: AudioMode) => void;
  onOpenChange: (open: boolean) => void;
}

export function useAudioActionState({
  open,
  initialMode,
  onAnalysisComplete,
  onLyricsExtracted,
  onChordsDetected,
  onAudioSelected,
  onOpenChange,
}: UseAudioActionStateOptions) {
  const { saveAudio, updateAnalysis: updateDbAnalysis } = useReferenceAudio();
  const { setFromUpload, setFromCloud } = useAudioReference();

  const [mode, setMode] = useState<AudioMode>(initialMode);
  const [showGuitarMode, setShowGuitarMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [savedAudioId, setSavedAudioId] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<{
    style?: string;
    genre?: string;
    mood?: string;
  } | null>(null);

  // Lyrics state
  const [isExtractingLyrics, setIsExtractingLyrics] = useState(false);
  const [extractedLyrics, setExtractedLyrics] = useState<string | null>(null);
  const [hasVocals, setHasVocals] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleRemove = () => {
    if (audioUrl && !audioUrl.startsWith("http")) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
    setAudioDuration(null);
    setAnalysisResult(null);
    setExtractedLyrics(null);
    setHasVocals(null);
    setSavedAudioId(null);
  };

  // Reset on close
  useEffect(() => {
    if (!open) {
      handleRemove();
      setMode(initialMode);
      setShowGuitarMode(false);
      setAnalysisResult(null);
      setExtractedLyrics(null);
      setHasVocals(null);
      setAnalysisStep(0);
      setAnalysisProgress(0);
    }
  }, [open, initialMode]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Analysis progress animation
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(0);
      setAnalysisProgress(0);
      analysisIntervalRef.current = setInterval(() => {
        setAnalysisProgress((prev) => {
          const newProgress = prev + 2;
          if (newProgress >= 75) setAnalysisStep(3);
          else if (newProgress >= 50) setAnalysisStep(2);
          else if (newProgress >= 25) setAnalysisStep(1);
          return Math.min(newProgress, 95);
        });
      }, 200);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      if (analysisResult) setAnalysisProgress(100);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [isAnalyzing, analysisResult]);

  const uploadAndGetUrl = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Не авторизован");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/reference-${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-assets")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      logger.error("Storage upload error", { error: uploadError.message });
      throw new Error(`Ошибка загрузки: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from("project-assets").getPublicUrl(fileName);
    return publicUrl;
  };

  const analyzeAudio = async (file: File, existingUrl?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      logger.info("Uploading and analyzing audio");
      const publicUrl = existingUrl || (await uploadAndGetUrl(file));

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

      const analysisPromise = supabase.functions.invoke("analyze-audio-flamingo", {
        body: { audio_url: publicUrl, analysis_type: "reference" },
      });

      const result = await Promise.race([
        analysisPromise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("Превышено время ожидания анализа (60 сек)"));
          });
        }),
      ]);

      clearTimeout(timeoutId);

      const { data: analysisData, error: analysisError } = result as { data: any; error: any };
      if (analysisError) throw new Error(analysisError.message || "Network error");
      if (analysisData?.error) throw new Error(analysisData.error);

      if (analysisData?.success && analysisData.parsed) {
        const newResult = {
          style: analysisData.parsed.style_description,
          genre: analysisData.parsed.genre,
          mood: analysisData.parsed.mood,
        };
        setAnalysisResult(newResult);

        if (audioRecord?.id || savedAudioId) {
          await updateDbAnalysis({
            id: audioRecord?.id || savedAudioId!,
            genre: newResult.genre,
            mood: newResult.mood,
            analysisStatus: "completed",
          });
        }

        if (newResult.style) {
          onAnalysisComplete?.(newResult.style);
          toast.success("Стиль определён!");
        }
      } else {
        throw new Error("Не удалось проанализировать аудио");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      logger.error("Audio analysis error", { error: message });
      toast.error(`Ошибка анализа: ${message}`);
      setAnalysisProgress(0);
      setAnalysisStep(0);
      if (savedAudioId) {
        await updateDbAnalysis({ id: savedAudioId, analysisStatus: "failed" }).catch(() => {});
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

      const { data, error } = await supabase.functions.invoke("transcribe-lyrics", {
        body: { audio_url: publicUrl },
      });

      if (error) throw new Error(error.message || "Network error");
      if (data?.error) throw new Error(data.error);

      setHasVocals(data?.has_vocals ?? false);

      if (savedAudioId) {
        await updateDbAnalysis({
          id: savedAudioId,
          hasVocals: data?.has_vocals,
          transcription: data?.lyrics,
        });
      }

      if (data?.has_vocals && data?.lyrics) {
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "mp4";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audio.onloadedmetadata = () => setAudioDuration(audio.duration);

        setAudioUrl(url);
        setAudioFile(file);
        stream.getTracks().forEach((track) => track.stop());
        await analyzeAudio(file);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      toast.success("Запись началась");
    } catch (error) {
      logger.error("Recording error", { error });
      toast.error("Не удалось получить доступ к микрофону");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    const audio = new Audio(url);
    audio.onloadedmetadata = () => setAudioDuration(audio.duration);
    setAudioUrl(url);
    setAudioFile(file);
    await analyzeAudio(file);
  };

  const handleConfirm = async () => {
    if (audioFile) {
      await setFromUpload(audioFile, mode);
      onAudioSelected(audioFile, mode);
      onOpenChange(false);
    }
  };

  const handleCloudSelect = (audio: ReferenceAudio) => {
    setFromCloud(audio, mode);
    onOpenChange(false);
  };

  const handleGuitarRecordingComplete = async (data: {
    audioFile: File;
    audioUrl: string;
    chordProgression: string[];
    styleDescription: string;
    useMode: "style" | "audio";
  }) => {
    setShowGuitarMode(false);

    if (onChordsDetected && data.chordProgression.length > 0) {
      const progression = data.chordProgression.join(" → ");
      onChordsDetected(data.chordProgression, progression);
    }

    if (data.useMode === "style") {
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
      }
      toast.success("Описание стиля добавлено");
      onOpenChange(false);
    } else {
      setAudioFile(data.audioFile);
      setAudioUrl(data.audioUrl);
      if (data.styleDescription && onAnalysisComplete) {
        onAnalysisComplete(data.styleDescription);
        setAnalysisResult({ style: data.styleDescription });
      }
      toast.success("Аудио референс готов");
    }
  };

  return {
    mode,
    setMode,
    showGuitarMode,
    setShowGuitarMode,
    isRecording,
    recordingTime,
    audioFile,
    audioDuration,
    audioUrl,
    isAnalyzing,
    analysisStep,
    analysisProgress,
    analysisResult,
    isExtractingLyrics,
    extractedLyrics,
    hasVocals,
    handleFileUpload,
    startRecording,
    stopRecording,
    handleRemove,
    handleConfirm,
    handleCloudSelect,
    handleGuitarRecordingComplete,
    extractLyrics,
  };
}
