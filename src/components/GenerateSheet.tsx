import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AnimatePresence, motion } from "@/lib/motion";
import { GenerationLoadingState } from "@/components/generate-form/GenerationLoadingState";
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
import { useGenerateSheetController } from "@/hooks/generation/useGenerateSheetController";
import { useTelegramMainButton, useTelegramSecondaryButton, useTelegramBackButton } from "@/hooks/telegram";
import { useKeyboardAware } from "@/hooks/useKeyboardAware";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useSunoCancel } from "@/hooks/generation/useSunoCancel";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
// ponytail: inlined from deleted @/lib/feature-flags (single flag, single caller)
const GENERATE_SHEET_REDESIGN_ENABLED = {
  default: false,
  storageKey: "ff.generate-sheet-redesign",
  environments: { dev: 1, staging: 1, prod: { start: 0.1, rampTo: 1, rampDays: 5 } },
} as const;
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useTelegram } from "@/contexts/TelegramContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { GenerateSheetHeader } from "./generate-sheet/GenerateSheetHeader";
import { GenerateSheetBody } from "./generate-sheet/GenerateSheetBody";
import { GenerateSheetFooter } from "./generate-sheet/GenerateSheetFooter";
import { GenerateSheetDialogs } from "./generate-sheet/GenerateSheetDialogs";
import { ValidationReasonsSheet } from "./generate-sheet/ValidationReasonsSheet";
import { LyricsAssistantSheet } from "@/components/generate-form/lyrics/LyricsAssistantSheet";
import { LegacyGenerateSheet } from "./GenerateSheet.legacy";
import type { ReferenceKind } from "./generate-sheet/ReferenceChipsRow";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId }: Props) => {
  const isRedesign = useFeatureFlag(
    GENERATE_SHEET_REDESIGN_ENABLED.storageKey,
    GENERATE_SHEET_REDESIGN_ENABLED.default,
  );
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks } = useTracks();
  const { hapticFeedback } = useTelegram();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { keyboardHeight, isKeyboardOpen } = useKeyboardAware();

  const controller = useGenerateSheetController({ open, onOpenChange, initialProjectId: projectId });

  // Lock body scroll while sheet is open (prevents iOS rubber-band behind sheet)
  useScrollLock(open);

  // Sprint 055-A4: generation cancel
  const { cancel: cancelGeneration, isCancelling } = useSunoCancel();

  // Telegram wiring
  const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
    text: controller.form.loading ? "Создание..." : "СГЕНЕРИРОВАТЬ",
    onClick: controller.actions.handleGenerate,
    enabled: !controller.form.loading && controller.validation.canGenerate,
    visible: open && !controller.dialogs.lyricsAssistant.open,
  });
  const { shouldShowUIButton: shouldShowSecondaryUIButton } = useTelegramSecondaryButton({
    text: "Сохранить черновик",
    onClick: controller.actions.handleSaveDraft,
    enabled: controller.telegram.hasUnsavedData && !controller.form.loading,
    visible: open && controller.telegram.hasUnsavedData && !controller.dialogs.lyricsAssistant.open,
    position: "left",
  });
  useTelegramBackButton({ visible: open, onClick: controller.actions.handleCloseRequest });

  useEffect(() => {
    if (controller.form.loading) showProgress(true);
    else hideProgress();
  }, [controller.form.loading, showProgress, hideProgress]);

  if (!isRedesign) {
    return <LegacyGenerateSheet open={open} onOpenChange={onOpenChange} projectId={projectId} />;
  }

  const handleAddReference = (kind: ReferenceKind) => {
    if (kind === "project") controller.dialogs.project.setOpen(true);
    else if (kind === "artist") controller.dialogs.artist.setOpen(true);
    else if (kind === "audio") controller.dialogs.audioAction.setOpen(true);
    else if (kind === "voice") controller.dialogs.voiceClone.setOpen(true);
  };

  const handleRemoveReference = (kind: ReferenceKind, _id: string) => {
    if (kind === "project") {
      controller.form.setSelectedProjectId(undefined);
      controller.form.setSelectedTrackId(undefined);
    } else if (kind === "artist") {
      controller.form.setSelectedArtistId(undefined);
    } else if (kind === "audio") {
      controller.form.setAudioFile(null);
    } else if (kind === "voice") {
      controller.form.setCustomVoiceId?.(null);
    }
  };

  return (
    <>
      <AlertDialog open={controller.dialogs.closeConfirm.open} onOpenChange={controller.dialogs.closeConfirm.setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Закрыть форму?</AlertDialogTitle>
            <AlertDialogDescription>У вас есть несохранённые данные. Они будут потеряны.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>Закрыть</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) controller.actions.handleCloseRequest();
          else onOpenChange(true);
        }}
      >
        <SheetContent
          side="bottom"
          className="h-dvh sm:h-[85vh] lg:h-dvh lg:max-w-[680px] lg:rounded-2xl lg:mx-auto flex flex-col frost-sheet p-0 w-full max-w-full min-w-0 overflow-x-hidden"
          hideCloseButton
          hideTitle
          accessibleTitle="Создание музыки"
        >
          <GenerateSheetHeader
            form={{
              balance: controller.form.userBalance,
              cost: controller.form.generationCost,
              mode: controller.form.mode,
              setMode: controller.form.setMode,
              model: controller.form.model,
              setModel: controller.form.setModel,
            }}
            onOpenHistory={() => controller.dialogs.history.setOpen(true)}
            onClose={controller.actions.handleCloseRequest}
          />

          <AnimatePresence>
            {controller.form.loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
              >
                <GenerationLoadingState
                  stage="processing"
                  showCancel={!!controller.form.currentTaskId && !isCancelling}
                  compact={false}
                  onCancel={
                    controller.form.currentTaskId ? () => cancelGeneration(controller.form.currentTaskId!) : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          <GenerateSheetBody
            form={controller.form}
            advancedOpen={controller.dialogs.advancedOpen}
            onAdvancedToggle={controller.actions.handleAdvancedToggle}
            onOpenLyricsAssistant={() => controller.dialogs.lyricsAssistant.setOpen(true)}
            onAddReference={handleAddReference}
            onRemoveReference={handleRemoveReference}
            onOpenStyles={controller.actions.openStyles}
            projects={projects ?? undefined}
            artists={artists ?? undefined}
          />

          <GenerateSheetFooter
            loading={controller.form.loading}
            canGenerate={controller.validation.canGenerate}
            hasWarnings={controller.validation.hasWarnings}
            warningCount={controller.validation.reasons.filter((r) => r.severity === "warning").length}
            hasUnsavedData={controller.telegram.hasUnsavedData}
            generationCost={controller.form.generationCost}
            onGenerate={controller.actions.handleGenerate}
            onSaveDraft={controller.actions.handleSaveDraft}
            onShowReasons={() => controller.dialogs.reasons.setOpen(true)}
            shouldShowUIButton={shouldShowUIButton}
            shouldShowSecondaryUIButton={shouldShowSecondaryUIButton}
            isKeyboardOpen={isKeyboardOpen}
            keyboardHeight={keyboardHeight}
            summary={
              controller.form.loading
                ? undefined
                : `${controller.form.hasVocals ? "Вокал" : "Инструментал"} · 30–90 сек · ${controller.form.generationCost} кредитов`
            }
          />
        </SheetContent>

        <GenerateSheetDialogs
          form={controller.form}
          projects={projects}
          artists={artists}
          allTracks={tracks}
          user={user}
          hapticFeedback={hapticFeedback}
          queryClient={qc}
          projectDialogOpen={controller.dialogs.project.open}
          setProjectDialogOpen={controller.dialogs.project.setOpen}
          projectTrackStep={controller.dialogs.projectTrackStep}
          setProjectTrackStep={controller.dialogs.setProjectTrackStep}
          projectTracks={
            controller.form.selectedProjectId
              ? tracks?.filter((t) => t.project_id === controller.form.selectedProjectId)
              : []
          }
          onProjectSelect={controller.actions.handleProjectSelect}
          artistDialogOpen={controller.dialogs.artist.open}
          setArtistDialogOpen={controller.dialogs.artist.setOpen}
          voiceCloneOpen={controller.dialogs.voiceClone.open}
          setVoiceCloneOpen={controller.dialogs.voiceClone.setOpen}
          onAdvancedToggle={controller.actions.handleAdvancedToggle}
          audioActionDialogOpen={controller.dialogs.audioAction.open}
          setAudioActionDialogOpen={controller.dialogs.audioAction.setOpen}
          setAdvancedOpen={controller.actions.handleAdvancedToggle}
          lyricsAssistantOpen={controller.dialogs.lyricsAssistant.open}
          setLyricsAssistantOpen={controller.dialogs.lyricsAssistant.setOpen}
          historyOpen={controller.dialogs.history.open}
          setHistoryOpen={controller.dialogs.history.setOpen}
          stylesOpen={controller.dialogs.styles.open}
          setStylesOpen={controller.dialogs.styles.setOpen}
        />
      </Sheet>

      <LyricsAssistantSheet
        open={controller.dialogs.lyricsAssistant.open}
        onOpenChange={controller.dialogs.lyricsAssistant.setOpen}
        currentText={controller.form.lyrics}
        onApply={(text) => controller.form.setLyrics(text)}
      />

      <ValidationReasonsSheet
        open={controller.dialogs.reasons.open}
        onOpenChange={controller.dialogs.reasons.setOpen}
        reasons={controller.validation.reasons}
      />
    </>
  );
};
