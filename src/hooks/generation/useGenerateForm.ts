/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * Composer for the generation form hook tree.
 *
 * `useGenerateForm` is a thin orchestrator that combines:
 *   - `useGenerateFormState`        — state slice + derived getters
 *   - `useGenerateFormValidation`   — cost/balance slice
 *   - `useGenerateFormActions`      — submit pipeline + selection handlers
 *   - `useGenerateFormBoostStyle`    — boost-style wiring (handleBoostStyle,
 *                                     handleSetAudioFile, boostLoading)
 *   - `useGenerateFormDraft`         — draft persistence + sessionStorage
 *                                     effects (activeReference, hasDraft)
 *
 * The split matches the brief's Task 1 contract; the public API is
 * preserved so existing consumers and unit tests see no behavior change.
 */

import { useCallback } from "react";
import { toast } from "sonner";

import { useGenerateFormState } from "./useGenerateFormState";
import { useGenerateFormValidation } from "./useGenerateFormValidation";
import { useGenerateFormActions } from "./useGenerateFormActions";
import { useGenerateFormBoostStyle } from "./useGenerateFormBoostStyle";
import { useGenerateFormDraft } from "./useGenerateFormDraft";

import type { UseGenerateFormParams, UseGenerateFormReturn } from "./useGenerateForm.types";

// Re-export types for backwards compatibility.
export type { UseGenerateFormParams, UseGenerateFormReturn } from "./useGenerateForm.types";
// Re-export legacy type names for back-compat with consumers that still
// import them from "./useGenerateForm".
export type { GenerationMode, GenerateFormState, UseGenerateFormProps } from "./useGenerateFormTypes";
export { classifyFailure } from "./useGenerateFormTypes";

export function useGenerateForm(params: UseGenerateFormParams): UseGenerateFormReturn {
  // 1. State slice — owns setters + derived getters + draft hook refs.
  const state = useGenerateFormState(params);

  // 2. Validation slice — owns canGenerate / generationCost / userBalance.
  const validation = useGenerateFormValidation({
    model: state.model,
    isAdmin: state.isAdmin,
    apiBalance: state.apiBalance,
    userBalance: state.userBalance,
  });

  // 3. Boost-style wiring — owns handleBoostStyle, handleSetAudioFile,
  //    boostLoading. Must be a single instance (state holds boostLoading).
  const { handleBoostStyle, handleSetAudioFile, boostLoading } = useGenerateFormBoostStyle({
    mode: state.mode,
    description: state.description,
    style: state.style,
    setDescription: state.setDescription,
    setStyle: state.setStyle,
    setAudioFile: state.setAudioFile,
    // Forward the real setAudioDuration so handleSetAudioFile persists
    // the computed audio metadata into state (Finding #2). Was previously
    // a no-op, which meant the Suno submit pipeline always saw null.
    setAudioDuration: state.setAudioDuration,
  });
  void boostLoading;

  // 4. Action slice — owns submit pipeline + selection handlers.
  const actions = useGenerateFormActions({
    ...state,
    ...validation,
    ...params,
    canGenerate: validation.canGenerate,
    generationCost: validation.generationCost,
    userBalance: validation.userBalance,
  });

  // 5. Draft persistence — owns hasDraft, clearDraft (real impl),
  //    activeReference, clearAudioReference. Effects (sessionStorage)
  //    fire exactly once.
  const {
    hasDraft,
    clearDraft: realClearDraft,
    activeReference,
    clearAudioReference,
  } = useGenerateFormDraft({
    open: params.open,
    setters: {
      setMode: state.setMode,
      setDescription: state.setDescription,
      setTitle: state.setTitle,
      setLyrics: state.setLyrics,
      setStyle: state.setStyle,
      setHasVocals: state.setHasVocals,
      setModel: state.setModel,
      setNegativeTags: state.setNegativeTags,
      setVocalGender: state.setVocalGender,
      setStyleWeight: state.setStyleWeight,
      setWeirdnessConstraint: state.setWeirdnessConstraint,
      setAudioWeight: state.setAudioWeight,
      setSelectedProjectId: state.setSelectedProjectId,
      // Forward the real setAudioDuration so the draft hook's audio-
      // reference effect (line 266 in useGenerateFormDraft.ts) can persist
      // the active reference duration. Was previously a no-op (Finding #2).
      setAudioDuration: state.setAudioDuration,
      setPlanTrackId: state.setPlanTrackId,
      setApiCredits: state.setApiCredits,
    },
    values: {
      mode: state.mode,
      description: state.description,
      title: state.title,
      lyrics: state.lyrics,
      style: state.style,
      hasVocals: state.hasVocals,
      model: state.model,
      negativeTags: state.negativeTags,
      vocalGender: state.vocalGender,
    },
    resetForm: state.resetForm,
  });

  // Real saveDraft / clearDraft — wrap useGenerateDraft from inside the
  // existing internals. We expose them on the public surface.
  // saveDraft is forwarded from the state slice (which already pulls the
  // real impl from `useGenerateDraft` via useGenerateFormStateInternal).
  // Was a no-op before Finding #1 — any caller (e.g. GenerationResultSheet,
  // a manual "Save draft" button) silently did nothing.
  const saveDraft = useCallback(
    (payload?: unknown) => {
      state.saveDraft(payload);
    },
    [state],
  );

  // Track and artist selection handlers — preserve the legacy toast /
  // setter chain so callers see no behavior change.
  const handleTrackSelect = useCallback(
    (trackId: string) => {
      const track = params.allTracks?.find((t) => t.id === trackId);
      if (track) {
        state.setTitle(track.title || "");
        state.setLyrics(track.lyrics || "");
        state.setStyle(track.style || "");
        state.setHasVocals(track.has_vocals ?? true);
        if (track.suno_model) state.setModel(track.suno_model);
        if (track.negative_tags) state.setNegativeTags(track.negative_tags);
        if (track.vocal_gender) state.setVocalGender(track.vocal_gender as "m" | "f");
        if (track.style_weight) state.setStyleWeight([track.style_weight]);
        toast.success("Данные трека загружены");
      }
      state.setSelectedTrackId(trackId);
    },
    [params.allTracks, state],
  );

  const handleArtistSelect = useCallback(
    (artistId: string) => {
      state.setSelectedArtistId(artistId);
      if (artistId) {
        state.setMode("custom");
        const artist = params.artists?.find((a) => a.id === artistId);
        if (artist) {
          const artistStyle = [artist.style_description, artist.genre_tags?.join(", "), artist.mood_tags?.join(", ")]
            .filter(Boolean)
            .join(". ");

          if (artistStyle && !state.style) {
            state.setStyle(artistStyle);
            toast.success("Стиль артиста добавлен");
          }
        }
      }
    },
    [params.artists, state],
  );

  // Stitch the public surface — preserved verbatim from the legacy hook.

  const _legacyKeys = { ...state, ...validation, ...actions };
  void _legacyKeys;

  return {
    // ─── mode + loading flags ───────────────────────────────────────
    mode: state.mode,
    setMode: state.setMode,
    loading: state.loading,
    setLoading: state.setLoading,
    audioReferenceLoading: state.audioReferenceLoading,
    setAudioReferenceLoading: state.setAudioReferenceLoading,
    boostLoading,

    // ─── retry state ────────────────────────────────────────────────
    isRetrying: actions.isRetrying,
    retryCount: actions.retryCount,
    nextRetryIn: actions.nextRetryIn,
    canRetry: actions.canRetry,
    cancelRetry: actions.cancelRetry,

    // ─── user credits ───────────────────────────────────────────────
    userBalance: validation.userBalance,
    canGenerate: validation.canGenerate,
    generationCost: validation.generationCost,
    generationCostBreakdown: validation.generationCostBreakdown,
    apiCredits: state.apiCredits,
    setApiCredits: state.setApiCredits,
    isAdmin: state.isAdmin,
    hasDraft,
    hasUnsavedData: state.hasUnsavedData,

    // ─── simple mode ────────────────────────────────────────────────
    description: state.description,
    setDescription: state.setDescription,

    // ─── custom mode ────────────────────────────────────────────────
    title: state.title,
    setTitle: state.setTitle,
    lyrics: state.lyrics,
    setLyrics: state.setLyrics,
    style: state.style,
    setStyle: state.setStyle,
    hasVocals: state.hasVocals,
    setHasVocals: state.setHasVocals,

    // ─── advanced ──────────────────────────────────────────────────
    model: state.model,
    setModel: state.setModel,
    negativeTags: state.negativeTags,
    setNegativeTags: state.setNegativeTags,
    vocalGender: state.vocalGender,
    setVocalGender: state.setVocalGender,
    styleWeight: state.styleWeight,
    setStyleWeight: state.setStyleWeight,
    weirdnessConstraint: state.weirdnessConstraint,
    setWeirdnessConstraint: state.setWeirdnessConstraint,
    audioWeight: state.audioWeight,
    setAudioWeight: state.setAudioWeight,

    // ─── references ────────────────────────────────────────────────
    selectedProjectId: state.selectedProjectId,
    setSelectedProjectId: state.setSelectedProjectId,
    selectedTrackId: state.selectedTrackId,
    setSelectedTrackId: state.setSelectedTrackId,
    selectedArtistId: state.selectedArtistId,
    setSelectedArtistId: state.setSelectedArtistId,
    audioFile: state.audioFile,
    setAudioFile: handleSetAudioFile,
    audioDuration: state.audioDuration,
    setAudioDuration: state.setAudioDuration,
    planTrackId: state.planTrackId,
    setPlanTrackId: state.setPlanTrackId,
    customVoiceId: state.customVoiceId,
    setCustomVoiceId: state.setCustomVoiceId,
    isPublic: state.isPublic,
    setIsPublic: state.setIsPublic,
    canMakePrivate: state.isAdmin || (validation.userBalance ?? 0) >= 0,
    apiBalance: state.apiBalance,

    // ─── actions ───────────────────────────────────────────────────
    handleGenerate: actions.handleGenerate,
    handleBoostStyle,
    handleTrackSelect,
    handleArtistSelect,
    resetForm: state.resetForm,
    clearDraft: realClearDraft,
    saveDraft,
    currentTaskId: actions.currentTaskId ?? null,

    // ─── active reference (used by submit) ─────────────────────────
    activeReference,
    clearAudioReference,
    invalidateCredits: state.invalidateCredits,
  };
}
