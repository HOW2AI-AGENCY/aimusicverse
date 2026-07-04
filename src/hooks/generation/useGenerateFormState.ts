/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * State slice of the generation form.
 *
 * Wraps the existing internal `useGenerateFormStateInternal` hook and
 * re-shapes its return to match the brief's `UseGenerateFormStateReturn`
 * contract. The internal hook already wires navigation, plan-track
 * context, audio references, retry state, analytics, and the user-
 * credits query — those reads remain unchanged so behavior is preserved.
 *
 * Note: `setAudioFile` here is the raw setter. The legacy composer wraps
 * it with `handleSetAudioFile` (from `useGenerateFormBoostStyle`) which
 * also computes audio duration. That wrap stays in the composer.
 */

import { useGenerateFormStateInternal } from "./useGenerateFormStateInternal";
import type { UseGenerateFormParams, UseGenerateFormStateReturn } from "./useGenerateForm.types";

export function useGenerateFormState(params: UseGenerateFormParams): UseGenerateFormStateReturn {
  const s = useGenerateFormStateInternal(params);

  // The brief asks the state hook to expose `hasUnsavedData`. Until the
  // redesign lands, we treat it as a constant `false` to preserve behavior.
  const hasUnsavedData = false;

  return {
    // ─── mode + loading flags ───────────────────────────────────────
    mode: s.mode,
    setMode: s.setMode,
    loading: s.loading,
    setLoading: s.setLoading,
    boostLoading: s.boostLoading,
    audioReferenceLoading: false,
    setAudioReferenceLoading: () => {
      // Reserved for the redesign sheet-loading UI. No-op until wired.
    },

    // ─── simple-mode ────────────────────────────────────────────────
    description: s.description,
    setDescription: s.setDescription,

    // ─── custom-mode ────────────────────────────────────────────────
    title: s.title,
    setTitle: s.setTitle,
    lyrics: s.lyrics,
    setLyrics: s.setLyrics,
    style: s.style,
    setStyle: s.setStyle,
    hasVocals: s.hasVocals,
    setHasVocals: s.setHasVocals,

    // ─── advanced ──────────────────────────────────────────────────
    model: s.model,
    setModel: s.setModel,
    vocalGender: s.vocalGender,
    setVocalGender: s.setVocalGender,
    styleWeight: s.styleWeight,
    setStyleWeight: s.setStyleWeight,
    weirdnessConstraint: s.weirdnessConstraint,
    setWeirdnessConstraint: s.setWeirdnessConstraint,
    audioWeight: s.audioWeight,
    setAudioWeight: s.setAudioWeight,
    negativeTags: s.negativeTags,
    setNegativeTags: s.setNegativeTags,

    // ─── references ────────────────────────────────────────────────
    customVoiceId: s.customVoiceId,
    setCustomVoiceId: s.setCustomVoiceId,
    audioFile: s.audioFile,
    setAudioFile: s.setAudioFile,
    audioDuration: s.audioDuration,
    selectedProjectId: s.selectedProjectId,
    setSelectedProjectId: s.setSelectedProjectId,
    selectedTrackId: s.selectedTrackId,
    setSelectedTrackId: s.setSelectedTrackId,
    selectedArtistId: s.selectedArtistId,
    setSelectedArtistId: s.setSelectedArtistId,
    planTrackId: s.planTrackId,
    setPlanTrackId: s.setPlanTrackId,

    // ─── public toggle ─────────────────────────────────────────────
    isPublic: s.isPublic,
    setIsPublic: s.setIsPublic,

    // ─── derived ───────────────────────────────────────────────────
    hasUnsavedData,

    // ─── reset ─────────────────────────────────────────────────────
    resetForm: s.resetForm,

    // ─── draft (forwarded from useGenerateDraft via internal state) ──
    saveDraft: s.saveDraft,
  };
}
