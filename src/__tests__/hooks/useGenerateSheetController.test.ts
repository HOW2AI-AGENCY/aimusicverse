/**
 * Sprint 056 — Task 4 (useGenerateSheetController) smoke tests.
 *
 * Verifies the brief's contract:
 *   - All dialogs start closed (project / artist / audioAction / voiceClone /
 *     history / lyricsAssistant / styles / closeConfirm).
 *   - Validation reports `canGenerate=false` and at least one reason when
 *     the form is empty.
 *   - `actions.openLyricsAssistant()` flips the `lyricsAssistant` dialog
 *     open.
 *
 * The composer (`useGenerateForm`) is mocked — its real implementation pulls
 * in `react-router-dom`'s `useNavigate`, Zustand stores, supabase auth,
 * telemetry, and retry machinery that have no relevance to controller
 * wiring. The validation hook (`useGenerateSheetValidation`) is exercised
 * against a stub form slice so we still verify the controller hands
 * `form → validation` correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Capture-mock references — `vi.hoisted()` runs before `vi.mock(...)` so the
// composer mock can return the *same* `vi.fn()` instance every renderHook,
// and the test can assert on `formSaveDraftSpy.mock.calls`.
const { formSaveDraftSpy, formClearDraftSpy } = vi.hoisted(() => ({
  formSaveDraftSpy: vi.fn(),
  formClearDraftSpy: vi.fn(),
}));

// vi.mock calls are hoisted ABOVE all imports, so the real `useGenerateForm`
// module never executes in this test file.
vi.mock("@/hooks/useProjects", () => ({ useProjects: () => ({ projects: [] }) }));
vi.mock("@/hooks/useArtists", () => ({ useArtists: () => ({ artists: [] }) }));
vi.mock("@/hooks/useTracks", () => ({ useTracks: () => ({ tracks: [] }) }));
vi.mock("@/hooks/analytics/useFeatureUsageTracking", () => ({
  useFeatureUsageTracking: () => ({
    trackFeature: vi.fn(),
    trackAction: vi.fn(),
    startFeatureSession: vi.fn(),
    endFeatureSession: vi.fn(),
    hasActiveSession: false,
  }),
}));
vi.mock("@/contexts/TelegramContext", () => ({
  useTelegram: () => ({
    hapticFeedback: vi.fn(),
    enableClosingConfirmation: vi.fn(),
    disableClosingConfirmation: vi.fn(),
  }),
}));
vi.mock("@/lib/notifications", () => ({
  notify: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));
vi.mock("@/hooks/generation/useGenerateForm", () => ({
  useGenerateForm: () => ({
    // State slice — empty form.
    mode: "simple" as const,
    setMode: vi.fn(),
    description: "",
    setDescription: vi.fn(),
    title: "",
    setTitle: vi.fn(),
    lyrics: "",
    setLyrics: vi.fn(),
    style: "",
    setStyle: vi.fn(),
    hasVocals: true,
    setHasVocals: vi.fn(),
    model: "V4_5ALL",
    setModel: vi.fn(),
    negativeTags: "",
    setNegativeTags: vi.fn(),
    vocalGender: "" as const,
    setVocalGender: vi.fn(),
    styleWeight: [0.5],
    setStyleWeight: vi.fn(),
    weirdnessConstraint: [0.5],
    setWeirdnessConstraint: vi.fn(),
    audioWeight: [0.5],
    setAudioWeight: vi.fn(),
    customVoiceId: null,
    setCustomVoiceId: vi.fn(),
    audioFile: null,
    setAudioFile: vi.fn(),
    audioDuration: null,
    setAudioDuration: vi.fn(),
    selectedProjectId: undefined,
    setSelectedProjectId: vi.fn(),
    selectedTrackId: undefined,
    setSelectedTrackId: vi.fn(),
    selectedArtistId: undefined,
    setSelectedArtistId: vi.fn(),
    planTrackId: undefined,
    setPlanTrackId: vi.fn(),
    isPublic: true,
    setIsPublic: vi.fn(),
    // Validation slice.
    userBalance: 10,
    canGenerate: false,
    generationCost: 5,
    generationCostBreakdown: [{ label: "base", amount: 5 }],
    apiCredits: null,
    setApiCredits: vi.fn(),
    isAdmin: false,
    hasDraft: false,
    canMakePrivate: false,
    // Retry.
    isRetrying: false,
    retryCount: 0,
    nextRetryIn: 0,
    canRetry: false,
    cancelRetry: vi.fn(),
    // Actions.
    handleGenerate: vi.fn().mockResolvedValue(undefined),
    handleBoostStyle: vi.fn().mockResolvedValue(undefined),
    handleTrackSelect: vi.fn(),
    handleArtistSelect: vi.fn(),
    resetForm: vi.fn(),
    clearDraft: formClearDraftSpy,
    saveDraft: formSaveDraftSpy,
    currentTaskId: null,
    // Loading.
    loading: false,
    boostLoading: false,
    audioReferenceLoading: false,
    // Active reference.
    activeReference: null,
    clearAudioReference: vi.fn(),
  }),
}));

import { useGenerateSheetController } from "@/hooks/generation/useGenerateSheetController";
import { notify } from "@/lib/notifications";

describe("useGenerateSheetController", () => {
  beforeEach(() => {
    localStorage.clear();
    formSaveDraftSpy.mockClear();
    formClearDraftSpy.mockClear();
    vi.mocked(notify.success).mockClear();
    vi.mocked(notify.info).mockClear();
    vi.mocked(notify.error).mockClear();
    vi.mocked(notify.warning).mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts with all dialogs closed", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: false, onOpenChange: vi.fn() }));

    expect(result.current.dialogs.project.open).toBe(false);
    expect(result.current.dialogs.artist.open).toBe(false);
    expect(result.current.dialogs.audioAction.open).toBe(false);
    expect(result.current.dialogs.voiceClone.open).toBe(false);
    expect(result.current.dialogs.history.open).toBe(false);
    expect(result.current.dialogs.lyricsAssistant.open).toBe(false);
    expect(result.current.dialogs.styles.open).toBe(false);
    expect(result.current.dialogs.closeConfirm.open).toBe(false);
    expect(result.current.dialogs.projectTrackStep).toBe("project");
  });

  it("exposes validation with canGenerate=false on empty form", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    // Empty style → validation produces an "error" reason → canGenerate=false.
    expect(result.current.validation.canGenerate).toBe(false);
    expect(result.current.validation.reasons.length).toBeGreaterThan(0);
  });

  it("toggles lyricsAssistant dialog", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    act(() => {
      result.current.actions.openLyricsAssistant();
    });

    expect(result.current.dialogs.lyricsAssistant.open).toBe(true);
  });

  it("returns the references slice forwarded from the form", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    expect(result.current.references.selectedProjectId).toBeUndefined();
    expect(result.current.references.selectedArtistId).toBeUndefined();
    expect(result.current.references.selectedTrackId).toBeUndefined();
    expect(result.current.references.audioFile).toBeNull();
    expect(result.current.references.customVoiceId).toBeNull();
    expect(result.current.references.audioDuration).toBeNull();
  });

  it("closes the sheet via handleCloseRequest when form is empty (no confirm prompt)", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange }));

    act(() => {
      result.current.actions.handleCloseRequest();
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(result.current.dialogs.closeConfirm.open).toBe(false);
  });

  it("opens the styles dialog via openStyles", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    act(() => {
      result.current.actions.openStyles();
    });

    expect(result.current.dialogs.styles.open).toBe(true);
  });

  // ─── Draft handlers (Sprint 056 Task 4 reviewer findings #3) ────────

  it("handleSaveDraft forwards the form snapshot to form.saveDraft and notifies", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    act(() => {
      result.current.actions.handleSaveDraft();
    });

    // The composer mock returns the empty-form slice — verify the controller
    // forwards the persisted-schema fields exactly (no more, no less).
    expect(formSaveDraftSpy).toHaveBeenCalledTimes(1);
    expect(formSaveDraftSpy).toHaveBeenCalledWith({
      mode: "simple",
      description: "",
      title: "",
      lyrics: "",
      style: "",
      hasVocals: true,
      model: "V4_5ALL",
      negativeTags: "",
      vocalGender: "",
    });
    expect(notify.success).toHaveBeenCalledTimes(1);
    expect(notify.success).toHaveBeenCalledWith("Черновик сохранён");
  });

  it("handleClearDraft invokes clearDraft + resetForm and notifies", () => {
    const { result } = renderHook(() => useGenerateSheetController({ open: true, onOpenChange: vi.fn() }));

    act(() => {
      result.current.actions.handleClearDraft();
    });

    // Order: composer.clearDraft runs first, then composer.resetForm
    // (matches the controller's implementation).
    expect(formClearDraftSpy).toHaveBeenCalledTimes(1);
    expect(result.current.form.resetForm).toHaveBeenCalledTimes(1);
    expect(notify.success).toHaveBeenCalledTimes(1);
    expect(notify.success).toHaveBeenCalledWith("Черновик очищен");
  });
});
