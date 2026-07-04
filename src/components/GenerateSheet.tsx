import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2 } from "@/lib/icons";
import { notify } from "@/lib/notifications";
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { AppLogo } from "@/components/branding/AppLogo";
import { useTracks } from "@/hooks/useTracks";
import { useGenerateForm, useAudioReference } from "@/hooks/generation";
import { useSunoCancel } from "@/hooks/generation/useSunoCancel";
import { useTelegram } from "@/contexts/TelegramContext";
import { useTelegramMainButton, useTelegramSecondaryButton, useTelegramBackButton } from "@/hooks/telegram";
import { useKeyboardAware } from "@/hooks/useKeyboardAware";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeatureUsageTracking } from "@/hooks/analytics/useFeatureUsageTracking";

// Form components - lazy loaded for bundle optimization
// GenerateFormHeaderCompact removed - using CollapsibleFormHeader only
import { GenerateFormActions } from "./generate-form/GenerateFormActions";
import { GenerateFormReferences } from "./generate-form/GenerateFormReferences";
import { GenerationLoadingState } from "./generate-form/GenerationLoadingState";
import { CollapsibleFormHeader } from "./generate-form/CollapsibleFormHeader";

// Lazy load heavy form components - Wizard removed for UX simplification
const GenerateFormSimple = lazy(() =>
  import("./generate-form/GenerateFormSimple").then((m) => ({ default: m.GenerateFormSimple })),
);
const GenerateFormCustom = lazy(() =>
  import("./generate-form/GenerateFormCustom").then((m) => ({ default: m.GenerateFormCustom })),
);

// Form skeleton for lazy loading
const FormSkeleton = () => (
  <div data-safe-skeleton="" className="space-y-3 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

// Dialogs
import { CreditBalanceWarning } from "./generate-form/CreditBalanceWarning";
import { GenerateSheetDialogs } from "./generate-sheet/GenerateSheetDialogs";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
// UploadAudioDialog removed - now using unified form for cover/extend
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId: initialProjectId }: GenerateSheetProps) => {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { hapticFeedback, enableClosingConfirmation, disableClosingConfirmation } = useTelegram();
  const qc = useQueryClient();
  const { user } = useAuth();
  // Sprint 055 P0-3: analytics for Save Draft success rate metric
  const { trackAction } = useFeatureUsageTracking();

  // Get active audio reference for hasReferenceAudio check
  const { activeReference } = useAudioReference();

  // Keyboard-aware behavior для адаптации под клавиатуру iOS
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { keyboardHeight, isKeyboardOpen, createFocusHandler } = useKeyboardAware();

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false); // For reference audio selection
  const [voiceCloneOpen, setVoiceCloneOpen] = useState(false);
  // Legacy UploadAudioDialog states removed - now using unified form
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<"project" | "track">("project");
  // Persist advanced settings state to localStorage (T044)
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("generate-form-advanced-open");
      return saved === "true";
    }
    return false;
  });
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Save advancedOpen state to localStorage when it changes (T044)
  useEffect(() => {
    localStorage.setItem("generate-form-advanced-open", String(advancedOpen));
  }, [advancedOpen]);

  // Haptic feedback wrapper for advanced toggle (T045)
  const handleAdvancedToggle = useCallback(
    (open: boolean) => {
      hapticFeedback("light");
      setAdvancedOpen(open);
    },
    [hapticFeedback],
  );

  // Form hook
  const form = useGenerateForm({
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists: artists as never,
    allTracks,
  });

  // Check if form has unsaved data
  const hasUnsavedData = Boolean(form.style.trim() || form.lyrics.trim() || form.title.trim());

  // Sprint 055 P0-4: cancel button wires through useSunoCancel + currentTaskId.
  // The cancel succeeds when the taskId exists in our DB; the in-flight Suno
  // compute continues server-side and is ignored when (if) the callback fires.
  const { cancel: cancelGeneration, isCancelling } = useSunoCancel();
  const handleCancelGeneration = async () => {
    if (!form.currentTaskId) return;
    try {
      await cancelGeneration(form.currentTaskId);
      // Reset form to clear currentTaskId + loading flag, then close sheet.
      form.resetForm();
      onOpenChange(false);
    } catch {
      // Error toast already shown by useSunoCancel; keep sheet open so
      // the user can retry.
    }
  };

  // Enable/disable Telegram closing confirmation based on form state
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

  // Handle close with confirmation
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

  const projectTracks = form.selectedProjectId ? allTracks?.filter((t) => t.project_id === form.selectedProjectId) : [];

  const handleProjectSelect = (projectId: string) => {
    hapticFeedback("light");
    form.setSelectedProjectId(projectId);
    const tracks = allTracks?.filter((t) => t.project_id === projectId);
    if (tracks && tracks.length > 0) {
      setProjectTrackStep("track");
    } else {
      setProjectDialogOpen(false);
      notify.info("Проект выбран", {
        description: "В проекте пока нет треков",
      });
    }
  };

  const handleClearDraft = () => {
    hapticFeedback("medium");
    form.clearDraft();
    form.resetForm();
    notify.success("Черновик очищен");
  };

  const handleGenerate = () => {
    hapticFeedback("medium");
    form.handleGenerate();
  };

  // Telegram MainButton integration - shows native button in Mini App, UI button for test users
  // Hide when LyricsChatAssistant is open (it has its own MainButton for "Apply")
  const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
    text: form.loading ? "Создание..." : "СГЕНЕРИРОВАТЬ",
    onClick: handleGenerate,
    enabled: !form.loading,
    visible: open && !lyricsAssistantOpen,
  });

  // Telegram SecondaryButton for "Save Draft" - wires to real useGenerateDraft.saveDraft
  // Sprint 055 P0-3: previous no-op (only toast) caused data loss
  const { shouldShowUIButton: shouldShowSecondaryUIButton } = useTelegramSecondaryButton({
    text: "Сохранить черновик",
    onClick: () => {
      hapticFeedback("light");
      trackAction("form_save_draft", "generation", "click", { source: "telegram_secondary_button" });
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
      trackAction("form_save_draft", "generation", "complete", { source: "telegram_secondary_button" });
      notify.success("Черновик сохранён");
    },
    enabled: hasUnsavedData && !form.loading,
    visible: open && hasUnsavedData && !lyricsAssistantOpen,
    position: "left",
  });

  // Telegram BackButton integration - with confirmation for unsaved data
  useTelegramBackButton({
    visible: open,
    onClick: handleCloseRequest,
  });

  // Show/hide progress on MainButton when loading changes
  useEffect(() => {
    if (form.loading) {
      showProgress(true);
    } else {
      hideProgress();
    }
  }, [form.loading, showProgress, hideProgress]);

  return (
    <>
      {/* Close confirmation dialog */}
      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Закрыть форму?</AlertDialogTitle>
            <AlertDialogDescription>У вас есть несохранённые данные. Они будут потеряны.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Закрыть</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            handleCloseRequest();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[95dvh] sm:h-[85vh] sm:max-h-[800px] flex flex-col frost-sheet p-0 w-full max-w-full min-w-0 overflow-x-hidden"
          hideCloseButton
          hideTitle
          accessibleTitle="Создание музыки"
        >
          {/* Compact Header with safe area for Telegram */}
          <div
            className="px-4 border-b border-border/40 bg-background/95 backdrop-blur-xl flex-shrink-0"
            style={{
              paddingTop:
                "max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))",
            }}
          >
            <CollapsibleFormHeader
              balance={form.userBalance ?? undefined}
              cost={form.generationCost}
              mode={form.mode}
              onModeChange={form.setMode}
              onOpenHistory={() => setHistoryOpen(true)}
              model={form.model}
              onModelChange={form.setModel}
              onClose={handleCloseRequest}
            />
          </div>

          {/* Loading Overlay - with proper safe area centering */}
          <AnimatePresence>
            {form.loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                style={{
                  paddingTop:
                    "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
                  paddingBottom:
                    "max(var(--tg-content-safe-area-inset-bottom, 0px) + var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))",
                }}
              >
                <GenerationLoadingState
                  stage="processing"
                  showCancel={!!form.currentTaskId}
                  onCancel={isCancelling ? undefined : handleCancelGeneration}
                  compact={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="flex-1 overflow-x-hidden">
            <div className="px-4 py-3 space-y-3 w-full max-w-full min-w-0 overflow-x-hidden">
              {/* Credit Balance Warning */}
              <CreditBalanceWarning
                balance={form.userBalance ?? 0}
                cost={form.generationCost}
                onClose={() => onOpenChange(false)}
              />

              <GenerateFormActions
                onOpenAudioDialog={() => setAudioActionDialogOpen(true)}
                onOpenProjectDialog={() => setProjectDialogOpen(true)}
                onOpenArtistDialog={() => setArtistDialogOpen(true)}
                onOpenVoiceClone={() => setVoiceCloneOpen(true)}
              />

              {/* Selected References Indicators */}
              <GenerateFormReferences
                planTrackId={form.planTrackId}
                planTrackTitle={form.title}
                audioFile={form.audioFile}
                audioReferenceLoading={form.audioReferenceLoading}
                selectedArtistId={form.selectedArtistId}
                selectedProjectId={form.selectedProjectId}
                artists={artists}
                projects={projects}
                onRemoveAudioFile={() => form.setAudioFile(null)}
                onRemoveArtist={() => form.setSelectedArtistId(undefined)}
                onRemoveProject={() => {
                  form.setSelectedProjectId(undefined);
                  form.setSelectedTrackId(undefined);
                }}
              />

              {/* Mode Content with Animation - Wizard removed for UX simplification */}
              <Suspense fallback={<FormSkeleton />}>
                <AnimatePresence mode="wait">
                  {form.mode === "simple" ? (
                    <GenerateFormSimple
                      description={form.description}
                      onDescriptionChange={form.setDescription}
                      title={form.title}
                      onTitleChange={form.setTitle}
                      hasVocals={form.hasVocals}
                      onHasVocalsChange={form.setHasVocals}
                      onBoostStyle={form.handleBoostStyle}
                      boostLoading={form.boostLoading}
                      onOpenStyles={() => setStylesOpen(true)}
                    />
                  ) : (
                    <GenerateFormCustom
                      title={form.title}
                      onTitleChange={form.setTitle}
                      style={form.style}
                      onStyleChange={form.setStyle}
                      lyrics={form.lyrics}
                      onLyricsChange={form.setLyrics}
                      hasVocals={form.hasVocals}
                      onHasVocalsChange={form.setHasVocals}
                      onBoostStyle={form.handleBoostStyle}
                      boostLoading={form.boostLoading}
                      onOpenLyricsAssistant={() => setLyricsAssistantOpen(true)}
                      isPublic={form.isPublic}
                      onIsPublicChange={form.setIsPublic}
                      canMakePrivate={form.canMakePrivate}
                      advancedOpen={advancedOpen}
                      onAdvancedOpenChange={handleAdvancedToggle}
                      negativeTags={form.negativeTags}
                      onNegativeTagsChange={form.setNegativeTags}
                      vocalGender={form.vocalGender}
                      onVocalGenderChange={form.setVocalGender}
                      styleWeight={form.styleWeight}
                      onStyleWeightChange={form.setStyleWeight}
                      weirdnessConstraint={form.weirdnessConstraint}
                      onWeirdnessConstraintChange={form.setWeirdnessConstraint}
                      audioWeight={form.audioWeight}
                      onAudioWeightChange={form.setAudioWeight}
                      hasReferenceAudio={!!form.audioFile || !!activeReference}
                      hasPersona={!!form.selectedArtistId}
                      onOpenStyles={() => setStylesOpen(true)}
                      customVoiceId={form.customVoiceId}
                      onCustomVoiceIdChange={form.setCustomVoiceId}
                    />
                  )}
                </AnimatePresence>
              </Suspense>
            </div>
          </ScrollArea>

          {/* Footer - keyboard-aware padding, gradient mask for premium dock feel */}
          <div
            className="px-4 pt-3 pb-4 border-t border-border/40 bg-background/95 backdrop-blur-xl"
            style={{
              paddingBottom: isKeyboardOpen
                ? `${keyboardHeight + 16}px`
                : "max(1rem, var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))",
              transition: "padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Slim progress hairline only while loading */}
            {form.loading && (
              <div className="mb-2.5">
                <Progress value={33} className="h-0.5" />
              </div>
            )}

            <div className="flex gap-2">
              {/* SecondaryButton fallback - Save Draft (Sprint 055 P0-3: real persistence + analytics) */}
              {shouldShowSecondaryUIButton && (
                <Button
                  onClick={() => {
                    hapticFeedback("light");
                    trackAction("form_save_draft", "generation", "click", { source: "ui_fallback_button" });
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
                    trackAction("form_save_draft", "generation", "complete", { source: "ui_fallback_button" });
                    notify.success("Черновик сохранён");
                  }}
                  variant="outline"
                  disabled={form.loading || !hasUnsavedData}
                  className="flex-1 h-12 text-sm font-semibold rounded-2xl border-border/60"
                >
                  Черновик
                </Button>
              )}
              {/* MainButton fallback - Generate (primary CTA, prototype-aligned) */}
              {shouldShowUIButton && (
                <Button
                  onClick={handleGenerate}
                  disabled={form.loading || !form.canGenerate}
                  className={cn(
                    "h-14 text-sm font-bold gap-2 rounded-2xl flex flex-col items-center justify-center leading-none transition-all active:scale-[0.98]",
                    "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground",
                    "shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.45)] hover:shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.55)]",
                    shouldShowSecondaryUIButton ? "flex-1" : "w-full",
                    !form.canGenerate && !form.loading && "opacity-50 cursor-not-allowed shadow-none",
                  )}
                >
                  {form.loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Создание…
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-2 text-[15px]">
                        <Sparkles className="w-4 h-4" />
                        Сгенерировать
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-primary-foreground/70">
                        {form.generationCost} кредитов
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>

        {/* Dialogs */}
        <GenerateSheetDialogs
          form={form}
          projects={projects}
          artists={artists}
          allTracks={allTracks}
          user={user}
          hapticFeedback={hapticFeedback}
          queryClient={qc}
          projectDialogOpen={projectDialogOpen}
          setProjectDialogOpen={setProjectDialogOpen}
          projectTrackStep={projectTrackStep}
          setProjectTrackStep={setProjectTrackStep}
          projectTracks={projectTracks}
          onProjectSelect={handleProjectSelect}
          artistDialogOpen={artistDialogOpen}
          setArtistDialogOpen={setArtistDialogOpen}
          voiceCloneOpen={voiceCloneOpen}
          setVoiceCloneOpen={setVoiceCloneOpen}
          onAdvancedToggle={handleAdvancedToggle}
          audioActionDialogOpen={audioActionDialogOpen}
          setAudioActionDialogOpen={setAudioActionDialogOpen}
          setAdvancedOpen={setAdvancedOpen}
          lyricsAssistantOpen={lyricsAssistantOpen}
          setLyricsAssistantOpen={setLyricsAssistantOpen}
          historyOpen={historyOpen}
          setHistoryOpen={setHistoryOpen}
          stylesOpen={stylesOpen}
          setStylesOpen={setStylesOpen}
        />
      </Sheet>
    </>
  );
};
