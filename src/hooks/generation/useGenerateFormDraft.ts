import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlanTrackStore } from "@/stores/planTrackStore";
import { useGenerateDraft } from "@/hooks/generation/useGenerateDraft";
import { useAudioReference } from "@/hooks/useAudioReference";
import { TITLE_MAX_LENGTH, DRAFT_AUTO_SAVE_DELAY } from "@/constants/generationConstants";
import { logger } from "@/lib/logger";
import type { GenerationMode } from "./useGenerateFormTypes";

interface DraftFormSetters {
  setMode: (mode: GenerationMode) => void;
  setDescription: (v: string) => void;
  setTitle: (v: string) => void;
  setLyrics: (v: string) => void;
  setStyle: (v: string) => void;
  setHasVocals: (v: boolean) => void;
  setModel: (v: string) => void;
  setNegativeTags: (v: string) => void;
  setVocalGender: (v: "" | "m" | "f") => void;
  setStyleWeight: (v: number[]) => void;
  setWeirdnessConstraint: (v: number[]) => void;
  setAudioWeight: (v: number[]) => void;
  setSelectedProjectId: (v: string | undefined) => void;
  setAudioDuration: (v: number | null) => void;
  setPlanTrackId: (v: string | undefined) => void;
  setApiCredits: (v: number | null) => void;
}

interface DraftFormValues {
  mode: GenerationMode;
  description: string;
  title: string;
  lyrics: string;
  style: string;
  hasVocals: boolean;
  model: string;
  negativeTags: string;
  vocalGender: "" | "m" | "f";
}

interface UseGenerateFormDraftParams {
  open: boolean;
  setters: DraftFormSetters;
  values: DraftFormValues;
  resetForm: () => void;
}

export function useGenerateFormDraft({ open, setters, values, resetForm }: UseGenerateFormDraftParams) {
  const { planTrackContext, clearPlanTrackContext } = usePlanTrackStore();
  const { draft, hasDraft, saveDraft, clearDraft } = useGenerateDraft();
  const { activeReference, clearActive: clearAudioReference } = useAudioReference();

  // Apply plan track context when available
  useEffect(() => {
    if (open && planTrackContext) {
      setters.setMode("custom");
      setters.setTitle(planTrackContext.planTrackTitle);
      setters.setPlanTrackId(planTrackContext.planTrackId);
      setters.setSelectedProjectId(planTrackContext.projectId);

      const styleComponents = [
        planTrackContext.stylePrompt,
        planTrackContext.projectGenre,
        planTrackContext.projectMood,
        planTrackContext.recommendedTags?.join(", "),
      ].filter(Boolean);

      if (styleComponents.length > 0) {
        setters.setStyle(styleComponents.join(". "));
      }

      if (planTrackContext.lyrics) {
        setters.setLyrics(planTrackContext.lyrics);
      } else if (planTrackContext.notes) {
        setters.setLyrics(planTrackContext.notes);
      }

      toast.success(`Загружены данные: ${planTrackContext.planTrackTitle}`, {
        description: "Форма заполнена из плана проекта",
      });

      clearPlanTrackContext();
    }
    // One-shot: apply plan track context when sheet opens; setters are stable ref-like from parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planTrackContext, clearPlanTrackContext]);

  // Apply guitar analysis parameters from sessionStorage
  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      try {
        const paramsStr = sessionStorage.getItem("generationParams");
        if (!paramsStr) return;

        const params = JSON.parse(paramsStr);
        setters.setMode("custom");

        if (params.prompt) {
          setters.setDescription(params.prompt);
        }

        const styleComponents: string[] = [];
        if (params.key) styleComponents.push(`Key: ${params.key}`);
        if (params.bpm) styleComponents.push(`${params.bpm} BPM`);
        if (params.timeSignature) styleComponents.push(`${params.timeSignature} time`);
        if (params.chordProgression) styleComponents.push(`Chords: ${params.chordProgression}`);

        if (params.style) {
          if (params.style.genre) styleComponents.push(params.style.genre);
          if (params.style.mood) styleComponents.push(params.style.mood);
          if (params.style.technique) styleComponents.push(params.style.technique);
        }

        if (params.tags && Array.isArray(params.tags)) {
          styleComponents.push(params.tags.slice(0, 5).join(", "));
        }

        if (styleComponents.length > 0) {
          setters.setStyle(styleComponents.join(" • "));
        }

        toast.success("Параметры из Guitar Studio загружены", {
          description: "Форма заполнена данными анализа гитары",
        });

        sessionStorage.removeItem("generationParams");
      } catch (error) {
        logger.error("Failed to load generation params from sessionStorage", error);
      }
    });
    // One-shot: consume sessionStorage["generationParams"] on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Apply preset parameters from Quick Create
  useEffect(() => {
    if (open) {
      try {
        const presetParamsStr = sessionStorage.getItem("presetParams");
        if (presetParamsStr) {
          const presetParams = JSON.parse(presetParamsStr);

          logger.info("Loading Quick Create preset params", { presetId: presetParams.presetId });

          if (presetParams.style || presetParams.mood || presetParams.tempo) {
            setters.setMode("custom");
          }

          const styleComponents: string[] = [];
          if (presetParams.style) styleComponents.push(presetParams.style);
          if (presetParams.mood) styleComponents.push(presetParams.mood);
          if (presetParams.tempo) styleComponents.push(presetParams.tempo);
          if (presetParams.instruments && Array.isArray(presetParams.instruments)) {
            styleComponents.push(presetParams.instruments.join(", "));
          }

          if (styleComponents.length > 0) {
            setters.setStyle(styleComponents.join(" • "));
          }

          toast.success("Preset загружен", {
            description: "Форма заполнена из Quick Create",
          });

          sessionStorage.removeItem("presetParams");
        }
      } catch (error) {
        logger.error(
          "Failed to load preset params from sessionStorage",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }, [open]);

  // Apply "Generate Similar" parameters
  useEffect(() => {
    if (open) {
      try {
        const similarParamsStr = sessionStorage.getItem("similarTrackParams");
        if (similarParamsStr) {
          const params = JSON.parse(similarParamsStr);

          logger.info("Loading Similar Track params", { style: params.style });

          setters.setMode("simple");

          const descParts: string[] = [];
          if (params.style) descParts.push(params.style);
          if (params.prompt) descParts.push(`similar to: ${params.prompt.slice(0, 100)}`);

          if (descParts.length > 0) {
            setters.setDescription(descParts.join(" • "));
          }

          toast.success("Создание похожего трека", {
            description: "Форма заполнена на основе выбранного трека",
          });

          sessionStorage.removeItem("similarTrackParams");
        }
      } catch (error) {
        logger.error("Failed to load similar track params", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [open]);

  // Apply Quick Genre Preset from homepage
  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      try {
        const presetStr = sessionStorage.getItem("quickGenrePreset");
        if (presetStr) {
          const preset = JSON.parse(presetStr);

          logger.info("Loading Quick Genre preset", { presetId: preset.presetId });

          setters.setMode("simple");

          if (preset.description) {
            setters.setDescription(preset.description);
          }
          if (typeof preset.hasVocals === "boolean") {
            setters.setHasVocals(preset.hasVocals);
          }

          sessionStorage.removeItem("quickGenrePreset");
        }
      } catch (error) {
        logger.error("Failed to load quick genre preset", error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, [open]);

  // Fetch API credits
  useEffect(() => {
    const fetchApiCredits = async () => {
      try {
        const { data } = await supabase.functions.invoke("suno-credits");
        if (data?.credits !== undefined) {
          setters.setApiCredits(data.credits);
        }
      } catch (error) {
        logger.error("Error fetching API credits", { error });
      }
    };

    if (open) {
      fetchApiCredits();
    }
  }, [open]);

  // Apply audio reference data when loaded
  useEffect(() => {
    if (!activeReference || !open) return;

    setters.setMode("custom");

    if (activeReference.analysis?.styleDescription) {
      setters.setStyle(activeReference.analysis.styleDescription);
    }
    if (activeReference.analysis?.transcription) {
      setters.setLyrics(activeReference.analysis.transcription);
    }
    if (activeReference.durationSeconds) {
      setters.setAudioDuration(activeReference.durationSeconds);
    }
    if (activeReference.context?.originalTitle) {
      setters.setTitle(`${activeReference.context.originalTitle} (ремикс)`.slice(0, TITLE_MAX_LENGTH));
    }

    if (activeReference.intendedMode === "extend") {
      setters.setAudioWeight([0.9]);
    } else if (activeReference.intendedMode === "cover") {
      setters.setAudioWeight([0.5]);
    }
  }, [activeReference, open]);

  // Check for remix data from sessionStorage
  useEffect(() => {
    if (open) {
      try {
        const remixDataStr = sessionStorage.getItem("musicverse_remix_data");
        if (remixDataStr) {
          const remixData = JSON.parse(remixDataStr);

          setters.setMode("custom");
          setters.setTitle(remixData.title || "");
          setters.setStyle(remixData.style || "");
          setters.setLyrics(remixData.lyrics || "");

          sessionStorage.setItem("parentTrackId", remixData.parentTrackId);

          toast.success("Ремикс", {
            description: `Создание ремикса: ${remixData.parentTrackTitle}`,
          });

          sessionStorage.removeItem("musicverse_remix_data");
        }
      } catch (error) {
        logger.error("Failed to load remix data from sessionStorage", error);
      }
    }
  }, [open]);

  // Check for template lyrics from sessionStorage
  useEffect(() => {
    if (open) {
      const templateLyrics = sessionStorage.getItem("templateLyrics");
      const templateName = sessionStorage.getItem("templateName");
      if (templateLyrics) {
        setters.setMode("custom");
        setters.setLyrics(templateLyrics);
        if (templateName) {
          setters.setTitle(templateName.slice(0, TITLE_MAX_LENGTH));
        }
        sessionStorage.removeItem("templateLyrics");
        sessionStorage.removeItem("templateName");
        toast.success("Шаблон загружен", {
          description: "Текст добавлен в форму",
        });
      }
    }
  }, [open]);

  // Restore draft when sheet opens
  useEffect(() => {
    if (open && hasDraft && draft && !planTrackContext) {
      const hasTemplate = sessionStorage.getItem("templateLyrics");
      if (hasTemplate) return;

      const mode = draft.mode === "wizard" ? "custom" : draft.mode;
      setters.setMode(mode as GenerationMode);
      setters.setDescription(draft.description);
      setters.setTitle(draft.title);
      setters.setLyrics(draft.lyrics);
      setters.setStyle(draft.style);
      setters.setHasVocals(draft.hasVocals);
      setters.setModel(draft.model);
      setters.setNegativeTags(draft.negativeTags);
      setters.setVocalGender(draft.vocalGender);

      toast.info("Черновик восстановлен", {
        description: "Ваши данные сохранены",
        action: {
          label: "Очистить",
          onClick: () => {
            clearDraft();
            resetForm();
            toast.success("Черновик очищен");
          },
        },
      });
    }
  }, [open]);

  // Auto-save draft
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      saveDraft({
        mode: values.mode,
        description: values.description,
        title: values.title,
        lyrics: values.lyrics,
        style: values.style,
        hasVocals: values.hasVocals,
        model: values.model,
        negativeTags: values.negativeTags,
        vocalGender: values.vocalGender,
      });
    }, DRAFT_AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [
    values.mode,
    values.description,
    values.title,
    values.lyrics,
    values.style,
    values.hasVocals,
    values.model,
    values.negativeTags,
    values.vocalGender,
    open,
    saveDraft,
  ]);

  return { hasDraft, clearDraft, activeReference, clearAudioReference };
}
