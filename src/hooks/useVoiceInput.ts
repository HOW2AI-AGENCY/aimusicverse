import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type VoiceInputContext = "description" | "style" | "lyrics" | "title" | "general";

interface UseVoiceInputOptions {
  onResult: (text: string) => void;
  context?: VoiceInputContext;
  autoCorrect?: boolean;
  language?: string;
}

const RECORDING_TIMEOUT_MS = 30_000;

export function useVoiceInput({
  onResult,
  context = "general",
  autoCorrect = true,
  language = "ru",
}: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear recording timeout
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, [isRecording]);

  // Convert blob to base64 using FileReader (safe for large blobs)
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data:audio/webm;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }, []);

  const startRecording = useCallback(async () => {
    // Feature check: getUserMedia may be blocked in Telegram WebView on iOS
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Голосовой ввод недоступен", {
        description: "Микрофон не поддерживается в этом браузере",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (chunksRef.current.length === 0) {
          toast.error("Не удалось записать аудио");
          return;
        }

        setIsProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

          // Convert to base64 using FileReader (safe for large files)
          const base64Audio = await blobToBase64(audioBlob);

          // Send to speech-to-text
          const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke("speech-to-text", {
            body: { audio: base64Audio, language },
          });

          if (transcriptError) throw transcriptError;

          if (!transcriptData?.text) {
            toast.error("Речь не распознана");
            return;
          }

          let finalText = transcriptData.text;

          // Auto-correct if enabled — optional, don't block on failure
          if (autoCorrect && finalText.length > 0) {
            try {
              const { data: correctionData, error: correctionError } = await supabase.functions.invoke("correct-text", {
                body: { text: finalText, context },
              });

              if (!correctionError && correctionData?.correctedText) {
                finalText = correctionData.correctedText;
                if (correctionData.wasModified) {
                  toast.success("Текст исправлен AI ✨");
                }
              }
            } catch {
              logger.warn("Text correction failed, using raw transcript");
            }
          }

          onResult(finalText);
          toast.success("Голос распознан");
        } catch (error) {
          logger.error("Voice processing error", error);
          toast.error("Ошибка обработки голоса", {
            description: error instanceof Error ? error.message : "Попробуйте снова",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        logger.info("Auto-stopping voice recording after 30s timeout");
        stopRecording();
      }, RECORDING_TIMEOUT_MS);

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      logger.error("Microphone access error", error);
      // Differentiate between permission denied and unavailable
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        toast.error("Нет доступа к микрофону", {
          description: "Разрешите доступ в настройках браузера или Telegram",
        });
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        toast.error("Микрофон не найден", {
          description: "Подключите микрофон к устройству",
        });
      } else {
        toast.error("Голосовой ввод недоступен", {
          description: "Попробуйте использовать другой браузер",
        });
      }
    }
  }, [onResult, context, autoCorrect, language, blobToBase64, stopRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
