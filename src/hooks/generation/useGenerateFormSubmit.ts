import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUNO_MODELS, validateModel } from "@/constants/sunoModels";
import { SIMPLE_DESCRIPTION_MAX_LENGTH, FILE_READER_TIMEOUT } from "@/constants/generationConstants";
import { savePromptToHistory } from "@/components/generate-form/PromptHistory";
import { showGenerationError, validatePromptForGeneration } from "@/lib/errorHandling";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { generationAnalytics, startTimer } from "@/lib/telemetry";
import { expectGenerationResult } from "./useGenerationResult";
import { useAutomaticRetry } from "@/hooks/useAutomaticRetry";
import { isRetryableError } from "@/lib/suno-error-mapper";
import { addUserActionBreadcrumb, captureGenerationError } from "@/lib/sentry";
import { logger } from "@/lib/logger";
import { classifyFailure } from "./useGenerateFormTypes";
import type { GenerationMode } from "./useGenerateFormTypes";
import type { ArtistRow } from "@/api/artists.api";

export interface AudioReferenceData {
  audioUrl?: string;
  intendedMode?: string;
  durationSeconds?: number;
  continueAt?: number;
  analysis?: { styleDescription?: string; transcription?: string };
  context?: { originalTitle?: string };
}

interface UseGenerateFormSubmitParams {
  mode: GenerationMode;
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: "" | "m" | "f";
  styleWeight: number[];
  weirdnessConstraint: number[];
  audioWeight: number[];
  audioFile: File | null;
  audioDuration: number | null;
  selectedArtistId?: string;
  selectedProjectId?: string;
  initialProjectId?: string;
  planTrackId?: string;
  customVoiceId: string | null;
  isPublic: boolean;
  artists?: ArtistRow[];
  activeReference: AudioReferenceData | null;
  clearAudioReference: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setModel: (v: string) => void;
  setApiCredits: (v: number | null) => void;
  canGenerate: boolean;
  isAdmin: boolean;
  apiBalance: number | null | undefined;
  userBalance: number | null;
  generationCost: number;
  invalidateCredits: () => void;
  resetForm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useGenerateFormSubmit(params: UseGenerateFormSubmitParams) {
  const navigate = useNavigate();
  const { trackGeneration } = useAnalyticsTracking();

  // Sprint 055 P0-4: track the latest taskId so the UI can soft-cancel it
  // before the user is redirected to /library. Using a ref (not state) keeps
  // the polling loop — if any is added later — from re-rendering on writes.
  const currentTaskIdRef = useRef<string | null>(null);
  // State mirror so consumers can render the cancel button on the change.
  // Reset is exposed via the `clearCurrentTaskId` callback below.
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // P0#1: Track generation error so GenerateSheet can show the failed stage
  // instead of silently dismissing the overlay when loading ends on error.
  const [generationError, setGenerationError] = useState<string | null>(null);

  const {
    retry,
    cancelRetry,
    isRetrying,
    retryCount,
    nextRetryIn,
    canRetry,
    reset: resetRetry,
  } = useAutomaticRetry({
    maxRetries: 2,
    onRetry: (attempt) => {
      addUserActionBreadcrumb(`generation_retry_attempt_${attempt}`, "generation");
      toast.loading(`Повторная попытка ${attempt}/2...`, {
        id: "generation-retry",
      });
    },
    onRetrySuccess: (attempt) => {
      addUserActionBreadcrumb(`generation_retry_success_attempt_${attempt}`, "generation");
      toast.dismiss("generation-retry");
    },
    onRetryFailed: (error, attempts) => {
      addUserActionBreadcrumb("generation_retry_exhausted", "generation", { attempts });
      toast.dismiss("generation-retry");
    },
  });

  const handleGenerate = useCallback(async () => {
    const {
      mode,
      description,
      title,
      lyrics,
      style,
      hasVocals,
      model,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      audioFile,
      audioDuration,
      selectedArtistId,
      selectedProjectId,
      initialProjectId,
      planTrackId,
      customVoiceId,
      isPublic,
      artists,
      activeReference,
      clearAudioReference,
      loading,
      setLoading,
      setModel,
      setApiCredits,
      canGenerate,
      isAdmin,
      apiBalance,
      userBalance,
      generationCost,
      invalidateCredits,
      resetForm,
      onOpenChange,
    } = params;

    // Prevent double-click submissions (IMP005)
    if (loading) {
      return;
    }

    const instrumental = !hasVocals;
    // Suno ignores Markdown decoration (**[Verse]**) — normalize section tags
    const normalizedLyrics = normalizeSunoLyrics(lyrics);
    const prompt = mode === "simple" ? description : instrumental ? "" : normalizedLyrics;

    if (mode === "simple" && !description) {
      toast.error("Опишите музыку");
      return;
    }

    if (mode === "simple" && description.length > SIMPLE_DESCRIPTION_MAX_LENGTH) {
      toast.error(`Описание слишком длинное (${description.length}/${SIMPLE_DESCRIPTION_MAX_LENGTH})`, {
        description: "Сократите текст или переключитесь в Custom режим",
      });
      return;
    }

    // Pre-generation credit validation
    if (!canGenerate) {
      const displayBalance = isAdmin ? (apiBalance ?? 0) : userBalance;
      toast.error("Недостаточно кредитов", {
        description: `Ваш баланс: ${displayBalance}. Требуется: ${generationCost}`,
      });
      return;
    }

    if (mode === "custom" && !style) {
      toast.error("Укажите стиль музыки");
      return;
    }

    if (mode === "custom" && hasVocals && !lyrics) {
      toast.error("Добавьте лирику или отключите вокал");
      return;
    }

    // Pre-validate prompt for blocked artist names
    const textToValidate = mode === "simple" ? description : lyrics;
    const promptValidation = validatePromptForGeneration(textToValidate, style);
    if (!promptValidation.valid) {
      toast.error(promptValidation.error, {
        description: promptValidation.suggestion,
      });
      return;
    }

    const { validKey, wasChanged, originalKey } = validateModel(model);
    let finalModel = model;

    if (wasChanged) {
      const originalName = SUNO_MODELS[originalKey]?.name || originalKey;
      const newName = SUNO_MODELS[validKey]?.name || validKey;
      toast.warning(`Модель ${originalName} недоступна`, {
        description: `Используем ${newName} вместо неё`,
      });
      setModel(validKey);
      finalModel = validKey;
    }

    savePromptToHistory({
      mode,
      description: mode === "simple" ? description : undefined,
      title: mode === "custom" ? title : undefined,
      style: mode === "custom" ? style : undefined,
      lyrics: mode === "custom" && hasVocals ? lyrics : undefined,
      model: finalModel,
    });

    setLoading(true);
    resetRetry();
    setGenerationError(null);

    expectGenerationResult();

    const stopTimer = startTimer("generation:request");

    generationAnalytics.trackStart(mode, hasVocals, !!(audioFile || activeReference?.audioUrl));

    addUserActionBreadcrumb("generation_started", "generation", {
      mode,
      model: finalModel,
      hasVocals,
      hasAudioFile: !!audioFile,
      hasReference: !!activeReference?.audioUrl,
    });

    const submissionMode: "custom" | "extend" | "cover" =
      activeReference?.intendedMode === "extend"
        ? "extend"
        : activeReference?.intendedMode === "cover"
          ? "cover"
          : "custom";

    const toastId = toast.loading("Шаг 1/3 · Подготовка запроса", {
      description: customVoiceId ? "Проверяем кастомный голос…" : "Подключаемся к серверу генерации",
    });

    logger.info("Generation submission started", {
      submissionMode,
      mode,
      model: finalModel,
      hasCustomVoice: !!customVoiceId,
      hasAudioReference: !!activeReference?.audioUrl,
      hasAudioFile: !!audioFile,
    });

    try {
      const personaId = selectedArtistId ? artists?.find((a) => a.id === selectedArtistId)?.suno_persona_id : undefined;

      // Pre-check custom voice availability before consuming credits
      if (customVoiceId) {
        try {
          const { voiceCloneApi } = await import("@/api/voice-clone.api");
          const r = await voiceCloneApi.checkVoice(customVoiceId);
          logger.info("Voice pre-check result", {
            voiceIdHash: customVoiceId.slice(0, 8),
            available: r?.available,
            submissionMode,
          });
          if (!r?.available) {
            toast.dismiss(toastId);
            toast.error("Кастомный голос недоступен", {
              description:
                "Этот голос был отозван Suno или ещё не готов. Откройте «Кастомные голоса», " +
                "проверьте статус или выберите другой голос. Кредиты не списаны.",
              duration: 8000,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          const err = e as { code?: string; message?: string };
          // The pre-check is advisory only: a provider/network hiccup must not block generation.
          logger.warn("Voice pre-check failed, continuing without it", {
            voiceIdHash: customVoiceId.slice(0, 8),
            code: err?.code,
            message: err?.message,
          });
        }
      }

      toast.loading("Шаг 2/3 · Отправляем в Suno", {
        id: toastId,
        description:
          submissionMode === "extend"
            ? "Готовим продолжение трека"
            : submissionMode === "cover"
              ? "Готовим кавер-версию"
              : "Создаём новые треки (A/B)",
      });

      addUserActionBreadcrumb("generation_api_call", "generation", {
        submissionMode,
        model: finalModel,
      });

      const invokeGeneration = async () => {
        let data, error;

        if (audioFile) {
          const MAX_FILE_SIZE = 50 * 1024 * 1024;
          if (audioFile.size > MAX_FILE_SIZE) {
            toast.error("Файл слишком большой", {
              description: `Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB. Ваш файл: ${(audioFile.size / 1024 / 1024).toFixed(1)}MB`,
            });
            return;
          }

          const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            const timeout = setTimeout(() => {
              reader.abort();
              reject(new Error("File reading timeout"));
            }, FILE_READER_TIMEOUT);

            reader.onload = () => {
              clearTimeout(timeout);
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              clearTimeout(timeout);
              reject(reader.error);
            };
            reader.readAsDataURL(audioFile);
          });

          const result = await supabase.functions.invoke("suno-upload-extend", {
            body: {
              audioFile: {
                name: audioFile.name,
                type: audioFile.type,
                data: fileData,
              },
              audioDuration: audioDuration || undefined,
              customMode: mode === "custom",
              prompt: mode === "custom" && hasVocals ? lyrics : undefined,
              style: mode === "custom" ? style : undefined,
              title: title || undefined,
              instrumental: !hasVocals,
              model: finalModel,
              personaId: personaId,
              negativeTags: negativeTags || undefined,
              vocalGender: vocalGender || undefined,
              styleWeight: styleWeight[0],
              weirdnessConstraint: weirdnessConstraint[0],
              audioWeight: audioWeight[0],
              projectId: selectedProjectId || initialProjectId,
              voiceId: customVoiceId || undefined,
            },
          });
          data = result.data;
          error = result.error;
        } else {
          const parentTrackId = sessionStorage.getItem("parentTrackId") || undefined;

          if (
            activeReference?.audioUrl &&
            (activeReference.intendedMode === "extend" || activeReference.intendedMode === "cover")
          ) {
            const duration = activeReference.durationSeconds || 60;
            const continueAt = activeReference.continueAt ?? Math.max(5, duration - 5);

            // Settings shared by extend & cover — without these the proxy fell back
            // to V4_5 / vocal defaults and silently ignored the user's form values.
            const sharedParams = {
              model: finalModel,
              makeInstrumental: !hasVocals,
              instrumental: !hasVocals,
              negativeTags: negativeTags || undefined,
              vocalGender: vocalGender || undefined,
              styleWeight: styleWeight[0],
              weirdnessConstraint: weirdnessConstraint[0],
            };

            const result = await supabase.functions.invoke("suno-generate", {
              body:
                activeReference.intendedMode === "extend"
                  ? {
                      action: "extend",
                      extendAudioUrl: activeReference.audioUrl,
                      continueAt,
                      prompt: mode === "simple" ? description : prompt,
                      style: mode === "custom" ? style : undefined,
                      title: mode === "custom" ? title : undefined,
                      defaultParamFlag: !prompt && !style,
                      voiceId: customVoiceId || undefined,
                      ...sharedParams,
                    }
                  : {
                      action: "cover",
                      coverAudioUrl: activeReference.audioUrl,
                      prompt: mode === "simple" ? description : prompt,
                      style: mode === "custom" ? style : undefined,
                      title: mode === "custom" ? title : undefined,
                      audioWeight: audioWeight[0],
                      voiceId: customVoiceId || undefined,
                      ...sharedParams,
                    },
            });

            data = result.data;
            error = result.error;
          } else {
            const result = await supabase.functions.invoke("suno-music-generate", {
              body: {
                mode,
                prompt: mode === "simple" ? description : prompt,
                title: mode === "custom" ? title : undefined,
                style: mode === "custom" ? style : undefined,
                instrumental,
                model: finalModel,
                negativeTags: negativeTags || undefined,
                vocalGender: vocalGender || undefined,
                styleWeight: styleWeight[0],
                weirdnessConstraint: weirdnessConstraint[0],
                audioWeight: personaId ? audioWeight[0] : undefined,
                personaId: personaId,
                artistId: selectedArtistId,
                projectId: selectedProjectId || initialProjectId,
                planTrackId: planTrackId,
                parentTrackId: parentTrackId,
                voiceId: customVoiceId || undefined,
                isPublic,
              },
            });
            data = result.data;
            error = result.error;
          }

          if (parentTrackId) {
            sessionStorage.removeItem("parentTrackId");
          }
        }

        if (error) throw error;
        return data;
      };

      const data = await retry(invokeGeneration);

      // Sprint 055 P0-4: capture taskId for the soft-cancel button.
      // The shape is `{ taskId: string, ... }` from suno-music-generate / suno-upload-extend / suno-generate.
      const taskIdFromResponse = (data as { taskId?: unknown } | undefined)?.taskId;
      if (typeof taskIdFromResponse === "string") {
        currentTaskIdRef.current = taskIdFromResponse;
        setCurrentTaskId(taskIdFromResponse);
      }

      trackGeneration("started", {
        mode,
        hasVocals,
        model: finalModel,
        withAudioFile: !!audioFile,
        projectId: selectedProjectId || initialProjectId,
        artistId: selectedArtistId,
      });

      toast.dismiss(toastId);
      if (customVoiceId) {
        // Persist the voice for the user: bump usage_count and remember it as the default.
        void import("@/api/voice-clone.api").then(({ markVoiceUsed, rememberLastVoice }) => {
          rememberLastVoice(customVoiceId);
          return markVoiceUsed(customVoiceId).catch((e) =>
            logger.warn("Failed to mark voice as used", { error: (e as Error).message }),
          );
        });
      }
      toast.success("Шаг 3/3 · Генерация запущена 🎵", {
        description: `${customVoiceId ? "С кастомным голосом. " : ""}Отслеживайте прогресс в библиотеке (~30–90 сек).`,
        duration: 5000,
      });

      logger.info("Generation enqueued successfully", {
        submissionMode,
        hasCustomVoice: !!customVoiceId,
        model: finalModel,
      });

      const fromQuickCreate = sessionStorage.getItem("fromQuickCreate");

      resetForm();
      onOpenChange(false);

      if (fromQuickCreate === "true") {
        sessionStorage.removeItem("fromQuickCreate");
        navigate("/library");
        toast.info("Трек готовится", {
          description: "После генерации можно открыть Stem Studio для разделения",
          duration: 5000,
        });
        logger.info("Quick Create flow: Track generation started, will suggest Stem Studio");
      } else {
        navigate("/library");
      }

      supabase.functions.invoke("suno-credits").then(({ data: creditsData }) => {
        if (creditsData?.credits !== undefined) {
          setApiCredits(creditsData.credits);
        }
      });
      invalidateCredits();
      const durationMs = stopTimer();
      generationAnalytics.trackComplete(mode, durationMs, generationCost);
    } catch (error) {
      toast.dismiss(toastId);
      showGenerationError(error);
      clearAudioReference();

      const errorMessage = error instanceof Error ? error.message : "unknown";
      const errorCode = errorMessage.includes("Edge Function")
        ? "EDGE_FUNCTION_ERROR"
        : errorMessage.includes("network") || errorMessage.includes("fetch")
          ? "NETWORK_ERROR"
          : errorMessage.includes("timeout")
            ? "TIMEOUT"
            : "GENERATION_FAILED";

      generationAnalytics.trackError(mode, errorCode, {
        originalError: errorMessage,
        hasVocals,
        model: finalModel,
        hasAudioFile: !!audioFile,
        hasReference: !!activeReference,
        projectId: selectedProjectId || initialProjectId,
        retryAttempts: retryCount,
      });

      captureGenerationError(error instanceof Error ? error : new Error(errorMessage), {
        prompt: (mode === "simple" ? description : lyrics)?.slice(0, 200),
        mode,
        model: finalModel,
        action: submissionMode,
      });

      // P0#1: Keep the overlay visible with the failed stage so the user
      // sees the error card (with retry/close) instead of just a toast.
      setGenerationError(errorMessage);

      addUserActionBreadcrumb("generation_failed", "generation", {
        errorCode,
        retryAttempts: retryCount,
        wasRetryable: isRetryableError(error),
      });

      logger.error("Generation failed", error, {
        mode,
        hasVocals,
        model: finalModel,
        retryAttempts: retryCount,
      });

      const failureCategory = classifyFailure(error);
      try {
        await supabase.from("generation_tasks").insert({
          user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
          prompt: (mode === "simple" ? description : lyrics)?.slice(0, 500) || "",
          status: "failed",
          source: "mini_app",
          error_message: errorMessage.slice(0, 500),
          failure_category: failureCategory,
          retry_count: retryCount,
          model_used: finalModel,
          generation_mode: submissionMode,
          generation_params: {
            mode,
            model: finalModel,
            hasVocals,
            hasAudioFile: !!audioFile,
            hasReference: !!activeReference,
            promptLength: (mode === "simple" ? description : lyrics)?.length || 0,
          },
        } as never);
      } catch {
        /* swallow logging failures */
      }
    } finally {
      setLoading(false);
      // Sprint 055 P0-4: clear taskId so the cancel button does not leak
      // across re-opens of the sheet. The mutation hook can still complete
      // its DB update asynchronously.
      currentTaskIdRef.current = null;
      setCurrentTaskId(null);
    }
  }, [params, retry, retryCount, resetRetry, navigate, trackGeneration]);

  return {
    handleGenerate,
    isRetrying,
    retryCount,
    nextRetryIn,
    canRetry,
    cancelRetry,
    // Sprint 055 P0-4: exposed so the UI can render a cancel button.
    currentTaskId,
    // P0#1: error message to show failed stage in loading overlay
    generationError,
    clearGenerationError: () => setGenerationError(null),
  };
}
