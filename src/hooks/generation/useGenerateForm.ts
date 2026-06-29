import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useUserCredits } from "@/hooks/useUserCredits";
import { DEFAULT_STYLE_WEIGHT, DEFAULT_WEIRDNESS, DEFAULT_AUDIO_WEIGHT } from "@/constants/generationConstants";
import { useGenerateDraft } from "./useGenerateDraft";
import { useGenerateFormDraft } from "./useGenerateFormDraft";
import { useGenerateFormValidation } from "./useGenerateFormValidation";
import { useGenerateFormSubmit } from "./useGenerateFormSubmit";
import type { GenerationMode, UseGenerateFormProps } from "./useGenerateFormTypes";

// Re-export types for backwards compatibility
export type { GenerationMode, GenerateFormState, UseGenerateFormProps } from "./useGenerateFormTypes";

export function useGenerateForm({
  open,
  onOpenChange,
  initialProjectId,
  projects,
  artists,
  allTracks,
}: UseGenerateFormProps) {
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
  const [apiCredits, setApiCredits] = useState<number | null>(null);

  // Simple mode state
  const [description, setDescription] = useState("");

  // Custom mode state
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [hasVocals, setHasVocals] = useState(true);

  // Advanced settings
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

  const { clearDraft: clearDraftFn } = useGenerateDraft();

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
    clearDraftFn();
    setPlanTrackId(undefined);
    setCustomVoiceId(null);
    setIsPublic(true);
  }, [initialProjectId, clearDraftFn]);

  // Draft persistence & param application
  const { hasDraft, clearDraft, activeReference, clearAudioReference } = useGenerateFormDraft({
    open,
    setters: {
      setMode,
      setDescription,
      setTitle,
      setLyrics,
      setStyle,
      setHasVocals,
      setModel,
      setNegativeTags,
      setVocalGender,
      setStyleWeight,
      setWeirdnessConstraint,
      setAudioWeight,
      setSelectedProjectId,
      setAudioDuration,
      setPlanTrackId,
      setApiCredits,
    },
    values: { mode, description, title, lyrics, style, hasVocals, model, negativeTags, vocalGender },
    resetForm,
  });

  // Validation & boost
  const { boostLoading, handleBoostStyle, handleSetAudioFile } = useGenerateFormValidation({
    mode,
    description,
    style,
    setDescription,
    setStyle,
    setAudioFile,
    setAudioDuration,
  });

  // Submission
  const { handleGenerate, isRetrying, retryCount, nextRetryIn, canRetry, cancelRetry } = useGenerateFormSubmit({
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
  });

  // Handle track selection
  const handleTrackSelect = useCallback(
    (trackId: string) => {
      const track = allTracks?.find((t) => t.id === trackId);
      if (track) {
        setTitle(track.title || "");
        setLyrics(track.lyrics || "");
        setStyle(track.style || "");
        setHasVocals(track.has_vocals ?? true);
        if (track.suno_model) setModel(track.suno_model);
        if (track.negative_tags) setNegativeTags(track.negative_tags);
        if (track.vocal_gender) setVocalGender(track.vocal_gender as "m" | "f");
        if (track.style_weight) setStyleWeight([track.style_weight]);
        toast.success("Данные трека загружены");
      }
      setSelectedTrackId(trackId);
    },
    [allTracks],
  );

  // Handle artist selection
  const handleArtistSelect = useCallback(
    (artistId: string) => {
      setSelectedArtistId(artistId);
      if (artistId) {
        setMode("custom");
        const artist = artists?.find((a) => a.id === artistId);
        if (artist) {
          const artistStyle = [artist.style_description, artist.genre_tags?.join(", "), artist.mood_tags?.join(", ")]
            .filter(Boolean)
            .join(". ");

          if (artistStyle && !style) {
            setStyle(artistStyle);
            toast.success("Стиль артиста добавлен");
          }
        }
      }
    },
    [artists, style],
  );

  return {
    // State
    mode,
    setMode,
    loading,
    audioReferenceLoading: false,
    boostLoading,
    // Retry state
    isRetrying,
    retryCount,
    nextRetryIn,
    canRetry,
    cancelRetry,
    // User credits
    userBalance,
    canGenerate,
    generationCost,
    apiCredits,
    isAdmin,
    hasDraft,

    // Simple mode
    description,
    setDescription,

    // Custom mode
    title,
    setTitle,
    lyrics,
    setLyrics,
    style,
    setStyle,
    hasVocals,
    setHasVocals,

    // Advanced
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

    // References
    selectedProjectId,
    setSelectedProjectId,
    selectedTrackId,
    setSelectedTrackId,
    selectedArtistId,
    setSelectedArtistId,
    audioFile,
    setAudioFile: handleSetAudioFile,
    planTrackId,
    customVoiceId,
    setCustomVoiceId,
    isPublic,
    setIsPublic,
    canMakePrivate: isAdmin || (userBalance ?? 0) >= 0,

    // Actions
    handleGenerate,
    handleBoostStyle,
    handleTrackSelect,
    handleArtistSelect,
    resetForm,
    clearDraft,
  };
}
