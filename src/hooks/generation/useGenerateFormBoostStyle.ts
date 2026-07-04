import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { GenerationMode } from "./useGenerateFormTypes";

interface UseGenerateFormValidationParams {
  mode: GenerationMode;
  description: string;
  style: string;
  setDescription: (v: string) => void;
  setStyle: (v: string) => void;
  setAudioFile: (f: File | null) => void;
  setAudioDuration: (d: number | null) => void;
}

export function useGenerateFormValidation({
  mode,
  description,
  style,
  setDescription,
  setStyle,
  setAudioFile: setAudioFileState,
  setAudioDuration,
}: UseGenerateFormValidationParams) {
  const [boostLoading, setBoostLoading] = useState(false);

  // Boost style with AI
  const handleBoostStyle = useCallback(async () => {
    const content = mode === "simple" ? description : style;

    if (!content) {
      toast.error("Пожалуйста, заполните описание стиля");
      return;
    }

    if (boostLoading) {
      return;
    }

    setBoostLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suno-boost-style", {
        body: { content },
      });

      if (error) throw error;

      if (data?.boostedStyle) {
        if (mode === "simple") {
          setDescription(data.boostedStyle);
        } else {
          setStyle(data.boostedStyle);
        }
        toast.success("Стиль улучшен! ✨", {
          description: "Описание стиля было оптимизировано AI",
        });
      }
    } catch (error) {
      logger.error("Boost error", { error });

      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("429") || errorMessage.includes("кредитов")) {
        toast.error("Недостаточно кредитов", {
          description: "Пополните баланс для улучшения стиля",
        });
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        toast.error("Ошибка соединения", {
          description: "Проверьте подключение к интернету и попробуйте снова",
        });
      } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        toast.error("Превышено время ожидания", {
          description: "Сервер не ответил вовремя. Попробуйте ещё раз",
        });
      } else if (
        errorMessage.includes("500") ||
        errorMessage.includes("502") ||
        errorMessage.includes("Edge Function")
      ) {
        toast.error("Сервис временно недоступен", {
          description: "Попробуйте повторить через несколько минут",
        });
      } else {
        toast.error("Не удалось улучшить стиль", {
          description: "Попробуйте изменить описание или повторить позже",
        });
      }
    } finally {
      setBoostLoading(false);
    }
  }, [mode, description, style, boostLoading]);

  // Handle audio file selection with duration calculation
  const handleSetAudioFile = useCallback((file: File | null) => {
    setAudioFileState(file);

    if (!file) {
      setAudioDuration(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      if (!isNaN(dur) && isFinite(dur)) {
        setAudioDuration(dur);
        logger.info("Audio duration calculated", { duration: dur, fileName: file.name });
      } else {
        setAudioDuration(null);
        logger.warn("Invalid audio duration", { fileName: file.name });
      }
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setAudioDuration(null);
      logger.warn("Failed to calculate audio duration", { fileName: file.name });
    };
  }, []);

  return { boostLoading, handleBoostStyle, handleSetAudioFile };
}

// Sprint 056 alias — composer imports as useGenerateFormBoostStyle
export { useGenerateFormValidation as useGenerateFormBoostStyle };
