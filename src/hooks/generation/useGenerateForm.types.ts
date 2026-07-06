/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 1).
 *
 * Shared types for the split useGenerateForm hook tree:
 *   - useGenerateFormState
 *   - useGenerateFormActions
 *   - useGenerateFormValidation
 *
 * These interfaces are derived from the existing public API of the
 * pre-split `useGenerateForm` hook so that the composer (useGenerateForm.ts)
 * can spread each sub-hook's return shape and preserve backward compatibility.
 */

import type { ProjectRow } from "@/api/projects.api";
import type { ArtistRow } from "@/api/artists.api";
import type { TrackRow } from "@/api/tracks.api";

/** Composer params — identical to the legacy `UseGenerateFormProps`. */
export interface UseGenerateFormParams {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
  projects?: ProjectRow[];
  artists?: ArtistRow[];
  allTracks?: TrackRow[];
}

/** State slice returned by `useGenerateFormState`. */
export interface UseGenerateFormStateReturn {
  // mode + loading flags
  mode: "simple" | "custom";
  setMode: (v: "simple" | "custom") => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  boostLoading: boolean;
  audioReferenceLoading: boolean;
  setAudioReferenceLoading: (v: boolean) => void;

  // simple-mode
  description: string;
  setDescription: (v: string) => void;

  // custom-mode
  title: string;
  setTitle: (v: string) => void;
  lyrics: string;
  setLyrics: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  hasVocals: boolean;
  setHasVocals: (v: boolean) => void;

  // advanced
  model: string;
  setModel: (v: string) => void;
  vocalGender: "" | "m" | "f";
  setVocalGender: (v: "" | "m" | "f") => void;
  styleWeight: number[];
  setStyleWeight: (v: number[]) => void;
  weirdnessConstraint: number[];
  setWeirdnessConstraint: (v: number[]) => void;
  audioWeight: number[];
  setAudioWeight: (v: number[]) => void;
  negativeTags: string;
  setNegativeTags: (v: string) => void;

  // references
  customVoiceId: string | null;
  setCustomVoiceId: (v: string | null) => void;
  audioFile: File | null;
  setAudioFile: (v: File | null) => void;
  audioDuration: number | null;
  /**
   * Setter for `audioDuration`. Forwarded from the internal state so the
   * composer can wire the real boost-style/draft setters (not a no-op).
   */
  setAudioDuration: (v: number | null) => void;
  selectedProjectId?: string;
  setSelectedProjectId: (v: string | undefined) => void;
  selectedTrackId?: string;
  setSelectedTrackId: (v: string | undefined) => void;
  selectedArtistId?: string;
  setSelectedArtistId: (v: string | undefined) => void;
  planTrackId?: string;
  setPlanTrackId: (v: string | undefined) => void;

  /**
   * Real saveDraft pulled from `useGenerateDraft` (via the internal hook).
   */
  saveDraft: (payload?: unknown) => void;

  // public toggle
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;

  // derived
  hasUnsavedData: boolean;
  hasDraft: boolean;

  // reset
  resetForm: () => void;

  // api credits
  apiCredits: number | null;
  setApiCredits: (v: number | null) => void;
}

/** Deps accepted by `useGenerateFormActions`. */
export type UseGenerateFormActionsDeps = UseGenerateFormStateReturn &
  UseGenerateFormParams & {
    canGenerate: boolean;
    generationCost: number;
    userBalance: number | null;
    apiBalance: number | null | undefined;
    isAdmin: boolean;
    activeReference: unknown;
    clearAudioReference: () => void;
    invalidateCredits: () => void;
  };

/** Action slice returned by `useGenerateFormActions`. */
export interface UseGenerateFormActionsReturn {
  handleGenerate: () => Promise<void>;
  handleBoostStyle: () => Promise<void>;
  saveDraft: () => void;
  clearDraft: () => void;
  setActiveReference: (ref: unknown) => void;
  setAudioReferenceLoading: (v: boolean) => void;
}

/** Deps accepted by `useGenerateFormValidation`. */
export interface UseGenerateFormValidationDeps {
  model: string;
  isAdmin: boolean;
  apiBalance: number | null | undefined;
  userBalance: number | null;
}

/** Cost/balance slice returned by `useGenerateFormValidation`. */
export interface UseGenerateFormValidationReturn {
  canGenerate: boolean;
  generationCost: number;
  /** Forward-looking breakdown; reserved for the redesign cost UI. */
  generationCostBreakdown: Array<{ label: string; value: number }>;
  userBalance: number | null;
}

/** Combined return — the public API of `useGenerateForm`. */
export type UseGenerateFormReturn = UseGenerateFormStateReturn &
  UseGenerateFormValidationReturn & {
    canGenerate: boolean;
    generationCost: number;
    apiCredits: number | null;
    setApiCredits: (v: number | null) => void;
    isAdmin: boolean;
    hasDraft: boolean;

    canMakePrivate: boolean;

    isRetrying: boolean;
    retryCount: number;
    nextRetryIn: number;
    canRetry: boolean;
    cancelRetry: () => void;

    handleGenerate: () => Promise<void>;
    handleBoostStyle: () => Promise<void>;
    handleTrackSelect: (trackId: string) => void;
    handleArtistSelect: (artistId: string) => void;
    resetForm: () => void;
    clearDraft: () => void;
    saveDraft: (payload?: unknown) => void;

    currentTaskId: string | null;

    activeReference: unknown;
    clearAudioReference: () => void;
  };
