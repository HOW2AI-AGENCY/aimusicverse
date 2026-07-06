/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * Action slice of the generation form.
 *
 * Composes the existing submit pipeline (`useGenerateFormSubmit`) and
 * exposes it under the brief's action contract:
 *   handleGenerate, handleBoostStyle, saveDraft, clearDraft,
 *   setActiveReference, setAudioReferenceLoading.
 *
 * The composer owns the boost-style wiring (`useGenerateFormBoostStyle`)
 * and draft persistence (`useGenerateFormDraft`) so their side effects
 * run exactly once. This hook only owns the submit pipeline +
 * audio-reference setters + selection handlers.
 *
 * Boost-style (`handleBoostStyle`) and draft (`saveDraft`/`clearDraft`)
 * are placeholders here — the composer overlays its real implementations.
 */

import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { useGenerateFormSubmit } from "./useGenerateFormSubmit";

import type { ArtistRow } from "@/api/artists.api";
import type { TrackRow } from "@/api/tracks.api";
import type { UseGenerateFormActionsDeps, UseGenerateFormActionsReturn } from "./useGenerateForm.types";

export function useGenerateFormActions(deps: UseGenerateFormActionsDeps): UseGenerateFormActionsReturn {
  // Submit pipeline — owns handleGenerate + retry state.
  const submit = useGenerateFormSubmit({
    mode: deps.mode,
    description: deps.description,
    title: deps.title,
    lyrics: deps.lyrics,
    style: deps.style,
    hasVocals: deps.hasVocals,
    model: deps.model,
    negativeTags: deps.negativeTags,
    vocalGender: deps.vocalGender,
    styleWeight: deps.styleWeight,
    weirdnessConstraint: deps.weirdnessConstraint,
    audioWeight: deps.audioWeight,
    audioFile: deps.audioFile,
    audioDuration: deps.audioDuration,
    selectedArtistId: deps.selectedArtistId,
    selectedProjectId: deps.selectedProjectId,
    initialProjectId: deps.initialProjectId,
    planTrackId: deps.planTrackId,
    customVoiceId: deps.customVoiceId,
    isPublic: deps.isPublic,
    artists: deps.artists as ArtistRow[] | undefined,
    activeReference: deps.activeReference as never,
    clearAudioReference: deps.clearAudioReference,
    loading: deps.loading,
    setLoading: deps.setLoading,
    setModel: deps.setModel,
    setApiCredits: deps.setApiCredits,
    canGenerate: deps.canGenerate,
    isAdmin: deps.isAdmin,
    apiBalance: deps.apiBalance,
    userBalance: deps.userBalance,
    generationCost: deps.generationCost,
    invalidateCredits: deps.invalidateCredits,
    resetForm: deps.resetForm,
    onOpenChange: deps.onOpenChange,
  });

  // Audio-reference setters — reserved for the redesign picker.
  const setActiveReference = useCallback((_ref: unknown) => {
    // The legacy composer routes this through the audioReference store.
  }, []);

  const setAudioReferenceLoading = useCallback((_v: boolean) => {
    // Mirrors the state slice; reserved for the redesign sheet UI.
  }, []);

  // Track and artist selection handlers — preserve the legacy toast /
  // setter chain so callers see no behavior change.
  const handleTrackSelect = useCallback(
    (trackId: string) => {
      const allTracks = (deps as unknown as { allTracks?: TrackRow[] }).allTracks;
      const track = allTracks?.find((t) => t.id === trackId);
      if (track) {
        deps.setTitle(track.title || "");
        deps.setLyrics(track.lyrics || "");
        deps.setStyle(track.style || "");
        deps.setHasVocals(track.has_vocals ?? true);
        if (track.suno_model) deps.setModel(track.suno_model);
        if (track.negative_tags) deps.setNegativeTags(track.negative_tags);
        if (track.vocal_gender) deps.setVocalGender(track.vocal_gender as "m" | "f");
        if (track.style_weight) deps.setStyleWeight([track.style_weight]);
        toast.success("Данные трека загружены");
      }
      deps.setSelectedTrackId(trackId);
    },
    [deps],
  );
  void handleTrackSelect;

  const handleArtistSelect = useCallback(
    (artistId: string) => {
      deps.setSelectedArtistId(artistId);
      if (artistId) {
        deps.setMode("custom");
        const artists = deps.artists;
        const artist = artists?.find((a) => a.id === artistId);
        if (artist) {
          const artistStyle = [artist.style_description, artist.genre_tags?.join(", "), artist.mood_tags?.join(", ")]
            .filter(Boolean)
            .join(". ");

          if (artistStyle && !deps.style) {
            deps.setStyle(artistStyle);
            toast.success("Стиль артиста добавлен");
          }
        }
      }
    },
    [deps],
  );
  void handleArtistSelect;

  // saveDraft / clearDraft placeholders — composer overlays the real impls.
  const saveDraft = useCallback(() => {
    // See file header.
  }, []);

  const clearDraft = useCallback(() => {
    // See file header.
  }, []);

  const handleBoostStylePlaceholder = useCallback(async () => {
    // See file header.
  }, []);

  return useMemo(
    () => ({
      handleGenerate: submit.handleGenerate,
      handleBoostStyle: handleBoostStylePlaceholder,
      saveDraft,
      clearDraft,
      setActiveReference,
      setAudioReferenceLoading,
      // Extras surfaced for the composer.
      currentTaskId: submit.currentTaskId,
      isRetrying: submit.isRetrying,
      retryCount: submit.retryCount,
      nextRetryIn: submit.nextRetryIn,
      canRetry: submit.canRetry,
      cancelRetry: submit.cancelRetry,
    }),
    [
      submit.handleGenerate,
      submit.currentTaskId,
      submit.isRetrying,
      submit.retryCount,
      submit.nextRetryIn,
      submit.canRetry,
      submit.cancelRetry,
      handleBoostStylePlaceholder,
      saveDraft,
      clearDraft,
      setActiveReference,
      setAudioReferenceLoading,
    ],
  );
}
