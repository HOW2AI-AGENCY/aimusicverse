/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 4).
 *
 * Orchestrator hook for the generation sheet. Owns:
 *   - Dialog state (project / artist / audioAction / voiceClone / history /
 *     lyricsAssistant / styles / closeConfirm)
 *   - Telegram closing-confirmation wiring (warns on unsaved data)
 *   - Draft save + clear pipeline (calls into `useGenerateForm` setters)
 *   - Project selection pipeline (with track-step branching)
 *   - `handleCloseRequest` (the only path that mutates `onOpenChange`)
 *
 * The hook is a thin glue layer:
 *   - It does NOT render UI
 *   - It does NOT add analytics/telemetry (delegated to consumer)
 *   - It does NOT introduce a new state library — dialog state is local
 *     `useState`, everything else is composed from `useGenerateForm` and
 *     `useGenerateSheetValidation`
 *
 * Public API shape:
 *   {
 *     form:        UseGenerateFormReturn
 *     validation:  { canGenerate, hasWarnings, reasons }
 *     dialogs:     { project, artist, audioAction, voiceClone, history,
 *                    lyricsAssistant, styles, closeConfirm, projectTrackStep,
 *                    setProjectTrackStep }
 *     actions:     { handleGenerate, handleSaveDraft, handleCloseRequest,
 *                    handleConfirmClose, handleClearDraft, handleProjectSelect,
 *                    handleAdvancedToggle,
 *                    openLyricsAssistant, openStyles, openHistory, openArtist,
 *                    openProject, openAudioAction, openVoiceClone }
 *     telegram:    { hasUnsavedData }
 *     references:  { selectedProjectId, selectedArtistId, selectedTrackId,
 *                    audioFile, customVoiceId, audioDuration }
 *   }
 */

import { useCallback, useEffect, useState } from "react";

import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useTelegram } from "@/contexts/TelegramContext";
import { useFeatureUsageTracking } from "@/hooks/analytics/useFeatureUsageTracking";
import { notify } from "@/lib/notifications";

import { useGenerateForm } from "./useGenerateForm";
import { useGenerateSheetValidation } from "./useGenerateSheetValidation";

export interface UseGenerateSheetControllerParams {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectId?: string;
}

export interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export interface UseGenerateSheetControllerReturn {
  form: ReturnType<typeof useGenerateForm>;
  validation: ReturnType<typeof useGenerateSheetValidation>;
  dialogs: {
    project: DialogState;
    artist: DialogState;
    audioAction: DialogState;
    voiceClone: DialogState;
    history: DialogState;
    lyricsAssistant: DialogState;
    styles: DialogState;
    closeConfirm: DialogState;
    reasons: DialogState;
    projectTrackStep: "project" | "track";
    setProjectTrackStep: (step: "project" | "track") => void;
    advancedOpen: boolean;
  };
  actions: {
    handleGenerate: () => Promise<void>;
    handleSaveDraft: () => void;
    handleCloseRequest: () => void;
    handleConfirmClose: () => void;
    handleClearDraft: () => void;
    handleProjectSelect: (projectId: string) => void;
    handleAdvancedToggle: (open: boolean) => void;
    openLyricsAssistant: () => void;
    openStyles: () => void;
    openHistory: () => void;
    openArtist: () => void;
    openProject: () => void;
    openAudioAction: () => void;
    openVoiceClone: () => void;
  };
  telegram: {
    hasUnsavedData: boolean;
  };
  references: {
    selectedProjectId: string | undefined;
    selectedArtistId: string | undefined;
    selectedTrackId: string | undefined;
    audioFile: File | null;
    customVoiceId: string | null;
    audioDuration: number | null;
  };
}

const ADVANCED_OPEN_STORAGE_KEY = "generate-form-advanced-open";

export function useGenerateSheetController({
  open,
  onOpenChange,
  initialProjectId,
}: UseGenerateSheetControllerParams): UseGenerateSheetControllerReturn {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { enableClosingConfirmation, disableClosingConfirmation, hapticFeedback } = useTelegram();
  const { trackAction } = useFeatureUsageTracking();

  // Form composer — owns all field state + submit pipeline.
  const form = useGenerateForm({
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists: artists as never,
    allTracks,
  });

  // Sheet-level validation reasons (passes form slice + balance/cost).
  const validation = useGenerateSheetValidation(form, form.userBalance ?? 0, form.generationCost);

  // Dialog state.
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false);
  const [voiceCloneOpen, setVoiceCloneOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<"project" | "track">("project");

  // Persist advanced section state (T044 — referenced by caller for UI).
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADVANCED_OPEN_STORAGE_KEY) === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(ADVANCED_OPEN_STORAGE_KEY, String(advancedOpen));
  }, [advancedOpen]);

  // Derived: form has unsaved data → Telegram closing confirmation on.
  //
  // Coincides with the persistence contract in `useGenerateDraft` (mode,
  // description, title, lyrics, style, hasVocals, model, negativeTags,
  // vocalGender) AND every other field the user could meaningfully lose
  // (selection state, attached audio, custom voice). Falling short here
  // would let Telegram close the sheet without a prompt — silent data loss.
  //
  // Notes on field defaults (from `useGenerateFormStateInternal`):
  //   - hasVocals defaults to `true` (vocal track on). Only counts as
  //     "unsaved" when the user has explicitly toggled it off.
  //   - vocalGender defaults to `""` (unset). Truthy check is sufficient.
  //   - audioFile defaults to `null`. `!== null` check is sufficient.
  //   - selectedArtistId / selectedTrackId default to `undefined`. Truthy
  //     check picks up any user selection.
  //   - customVoiceId defaults to `null`. `!== null` check is sufficient.
  const hasUnsavedData = Boolean(
    form.style?.trim() ||
    form.description?.trim() ||
    form.lyrics?.trim() ||
    form.title?.trim() ||
    form.hasVocals === false ||
    form.negativeTags?.trim() ||
    form.vocalGender ||
    form.audioFile !== null ||
    form.selectedArtistId ||
    form.selectedTrackId ||
    form.customVoiceId !== null,
  );

  useEffect(() => {
    if (open && hasUnsavedData) {
      enableClosingConfirmation();
    } else {
      disableClosingConfirmation();
    }
    return () => {
      disableClosingConfirmation();
    };
  }, [open, hasUnsavedData, enableClosingConfirmation, disableClosingConfirmation]);

  // ─── Actions ────────────────────────────────────────────────────────

  const handleCloseRequest = useCallback(() => {
    if (hasUnsavedData) {
      hapticFeedback("warning");
      setCloseConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  }, [hasUnsavedData, hapticFeedback, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setCloseConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAdvancedToggle = useCallback(
    (next: boolean) => {
      hapticFeedback("light");
      setAdvancedOpen(next);
    },
    [hapticFeedback],
  );

  const handleGenerate = useCallback(async () => {
    hapticFeedback("medium");
    await form.handleGenerate();
  }, [form, hapticFeedback]);

  const handleSaveDraft = useCallback(() => {
    hapticFeedback("light");
    trackAction("form_save_draft", "generation", "click", { source: "controller" });
    form.saveDraft({
      mode: form.mode,
      description: form.description,
      title: form.title,
      lyrics: form.lyrics,
      style: form.style,
      hasVocals: form.hasVocals,
      model: form.model,
      negativeTags: form.negativeTags,
      vocalGender: form.vocalGender,
    });
    trackAction("form_save_draft", "generation", "complete", { source: "controller" });
    notify.success("Черновик сохранён");
  }, [form, hapticFeedback, trackAction]);

  const handleClearDraft = useCallback(() => {
    hapticFeedback("medium");
    form.clearDraft();
    form.resetForm();
    notify.success("Черновик очищен");
  }, [form, hapticFeedback]);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      hapticFeedback("light");
      form.setSelectedProjectId(projectId);
      const tracks = allTracks?.filter((t) => t.project_id === projectId);
      if (tracks && tracks.length > 0) {
        setProjectTrackStep("track");
      } else {
        setProjectDialogOpen(false);
        notify.info("Проект выбран", { description: "В проекте пока нет треков" });
      }
    },
    [allTracks, form, hapticFeedback],
  );

  // Dialog openers (the brief API exposes these as named entry points so the
  // UI sheet doesn't have to know the internal boolean state layout).
  const openLyricsAssistant = useCallback(() => setLyricsAssistantOpen(true), []);
  const openStyles = useCallback(() => setStylesOpen(true), []);
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const openArtist = useCallback(() => setArtistDialogOpen(true), []);
  const openProject = useCallback(() => setProjectDialogOpen(true), []);
  const openAudioAction = useCallback(() => setAudioActionDialogOpen(true), []);
  const openVoiceClone = useCallback(() => setVoiceCloneOpen(true), []);

  return {
    form,
    validation,
    dialogs: {
      project: { open: projectDialogOpen, setOpen: setProjectDialogOpen },
      artist: { open: artistDialogOpen, setOpen: setArtistDialogOpen },
      audioAction: { open: audioActionDialogOpen, setOpen: setAudioActionDialogOpen },
      voiceClone: { open: voiceCloneOpen, setOpen: setVoiceCloneOpen },
      history: { open: historyOpen, setOpen: setHistoryOpen },
      lyricsAssistant: { open: lyricsAssistantOpen, setOpen: setLyricsAssistantOpen },
      styles: { open: stylesOpen, setOpen: setStylesOpen },
      closeConfirm: { open: closeConfirmOpen, setOpen: setCloseConfirmOpen },
      reasons: { open: reasonsOpen, setOpen: setReasonsOpen },
      projectTrackStep,
      setProjectTrackStep,
      advancedOpen,
    },
    actions: {
      handleGenerate,
      handleSaveDraft,
      handleCloseRequest,
      handleConfirmClose,
      handleClearDraft,
      handleProjectSelect,
      handleAdvancedToggle,
      openLyricsAssistant,
      openStyles,
      openHistory,
      openArtist,
      openProject,
      openAudioAction,
      openVoiceClone,
    },
    telegram: {
      hasUnsavedData,
    },
    references: {
      selectedProjectId: form.selectedProjectId,
      selectedArtistId: form.selectedArtistId,
      selectedTrackId: form.selectedTrackId,
      audioFile: form.audioFile,
      customVoiceId: form.customVoiceId,
      audioDuration: form.audioDuration,
    },
  };
}
