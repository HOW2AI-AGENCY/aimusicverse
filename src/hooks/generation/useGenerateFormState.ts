import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanTrackStore } from "@/stores/planTrackStore";
import { useGenerateDraft, useAudioReference } from "@/hooks/generation";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";
import { useAutomaticRetry } from "@/hooks/useAutomaticRetry";
import { toast } from "sonner";
import { DEFAULT_STYLE_WEIGHT, DEFAULT_WEIRDNESS, DEFAULT_AUDIO_WEIGHT } from "@/constants/generationConstants";
import { addUserActionBreadcrumb } from "@/lib/sentry";

// Wizard mode removed for UX simplification - only 2 modes now
export type GenerationMode = "simple" | "custom";

export interface GenerateFormState {
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
  selectedProjectId?: string;
  selectedTrackId?: string;
  selectedArtistId?: string;
  audioFile: File | null;
  planTrackId?: string;
}

export interface UseGenerateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
  projects?: any[];
  artists?: any[];
  allTracks?: any[];
}

/**
 * Core state management for the generation form.
 * Returns all state variables, setters, and external hook integrations.
 */
export function useGenerateFormState({
  open,
  onOpenChange,
  initialProjectId,
  projects,
  artists,
  allTracks,
}: UseGenerateFormProps) {
  const navigate = useNavigate();
  const { planTrackContext, clearPlanTrackContext } = usePlanTrackStore();
  const { draft, hasDraft, saveDraft, clearDraft } = useGenerateDraft();
  const { trackGeneration } = useAnalyticsTracking();

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

  // Unified audio reference hook
  const { activeReference, clearActive: clearAudioReference } = useAudioReference();

  // Advanced settings - model first for dynamic cost calculation
  const [model, setModel] = useState("V4_5ALL");

  // User credits hook with model-specific cost
  const {
    balance: userBalance,
    canGenerate,
    generationCost,
    invalidate: invalidateCredits,
    isAdmin,
    apiBalance,
  } = useUserCredits(model);

  // Form state
  const [mode, setMode] = useState<GenerationMode>("simple");
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [apiCredits, setApiCredits] = useState<number | null>(null);

  // Simple mode state
  const [description, setDescription] = useState("");

  // Custom mode state
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [hasVocals, setHasVocals] = useState(true);

  // Advanced settings (model already defined above for dynamic cost)
  const [negativeTags, setNegativeTags] = useState("");
  const [vocalGender, setVocalGender] = useState<"m" | "f" | "">("");
  const [styleWeight, setStyleWeight] = useState([DEFAULT_STYLE_WEIGHT]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([DEFAULT_WEIRDNESS]);
  const [audioWeight, setAudioWeight] = useState([DEFAULT_AUDIO_WEIGHT]);

  // Reference data
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();
  const [selectedArtistId, setSelectedArtistId] = useState<string | undefined>();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [planTrackId, setPlanTrackId] = useState<string | undefined>();
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Reset form
  const resetForm = useCallback(() => {
    setDescription("");
    setTitle("");
    setLyrics("");
    setStyle("");
    setNegativeTags("");
    setVocalGender("");
    setStyleWeight([DEFAULT_STYLE_WEIGHT]);
    setWeirdnessConstraint([DEFAULT_WEIRDNESS]);
    setAudioWeight([DEFAULT_AUDIO_WEIGHT]);
    setSelectedProjectId(initialProjectId);
    setSelectedTrackId(undefined);
    setSelectedArtistId(undefined);
    setAudioFile(null);
    setAudioDuration(null);
    clearDraft();
    setPlanTrackId(undefined);
    setCustomVoiceId(null);
    setIsPublic(true);
  }, [initialProjectId, clearDraft]);

  return {
    // Navigation & external hooks
    navigate,
    planTrackContext,
    clearPlanTrackContext,
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    trackGeneration,
    retry,
    cancelRetry,
    isRetrying,
    retryCount,
    nextRetryIn,
    canRetry,
    resetRetry,
    activeReference,
    clearAudioReference,
    userBalance,
    canGenerate,
    generationCost,
    invalidateCredits,
    isAdmin,
    apiBalance,

    // Props pass-through
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists,
    allTracks,

    // Form state
    mode,
    setMode,
    loading,
    setLoading,
    boostLoading,
    setBoostLoading,
    apiCredits,
    setApiCredits,
    description,
    setDescription,
    title,
    setTitle,
    lyrics,
    setLyrics,
    style,
    setStyle,
    hasVocals,
    setHasVocals,
    model,
    setModel,
    negativeTags,
    setNegativeTags,
    vocalGender,
    setVocalGender,
    styleWeight,
    setStyleWeight,
    weirdnessConstraint,
    setWeirdnessConstraint,
    audioWeight,
    setAudioWeight,
    selectedProjectId,
    setSelectedProjectId,
    selectedTrackId,
    setSelectedTrackId,
    selectedArtistId,
    setSelectedArtistId,
    audioFile,
    setAudioFile,
    audioDuration,
    setAudioDuration,
    planTrackId,
    setPlanTrackId,
    customVoiceId,
    setCustomVoiceId,
    isPublic,
    setIsPublic,
    resetForm,
  };
}

export type GenerateFormStateReturn = ReturnType<typeof useGenerateFormState>;
