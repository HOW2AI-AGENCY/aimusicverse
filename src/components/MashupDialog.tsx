/**
 * MashupDialog — picks two existing tracks and starts a Suno mashup.
 *
 * Sprint 052-B4. The user supplies:
 *   - trackAId + trackBId (resolved server-side to their audio URLs)
 *   - standard generation params: style / title / prompt / instrumental / model
 *
 * No file upload happens here — mashup is purely between two pre-existing
 * tracks. The result lands via suno-music-callback, same as normal
 * generation, and a new tracks row with generation_mode = 'mashup' is
 * created.
 *
 * Sprint 052-C cleanup:
 *   - form fields extracted to <MashupFormFields /> (Dumb sub-component for stories)
 */

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Disc } from "@/lib/icons";
import { toast } from "sonner";
import { getAvailableModels } from "@/constants/sunoModels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";
import { validatePromptForGeneration, showGenerationError } from "@/lib/errorHandling";
import { useTracks } from "@/hooks/useTracks";
import { useSunoMashup } from "@/hooks/studio/useSunoMashup";
import { MashupFormFields } from "@/components/mashup/MashupFormFields";
import { useMashupStrings } from "@/hooks/useMashupStrings";

interface MashupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select the first track (e.g. when launched from a track action). */
  initialTrackId?: string;
  projectId?: string;
}

const MODEL_OPTIONS = getAvailableModels();

export const MashupDialog = ({ open, onOpenChange, initialTrackId, projectId }: MashupDialogProps) => {
  const isMobile = useIsMobile();
  const { tracks } = useTracks({ statusFilter: ["completed"] });
  const t = useMashupStrings();

  // Source tracks
  const [trackAId, setTrackAId] = useState<string>(initialTrackId ?? "");
  const [trackBId, setTrackBId] = useState<string>("");

  // Core generation params
  const [customMode, setCustomMode] = useState(true);
  const [instrumental, setInstrumental] = useState(false);
  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("V4_5ALL");

  const mashupMutation = useSunoMashup();

  const availableTracksB = useMemo(() => (tracks ?? []).filter((track) => track.id !== trackAId), [tracks, trackAId]);

  const reset = () => {
    setTrackAId(initialTrackId ?? "");
    setTrackBId("");
    setCustomMode(true);
    setInstrumental(false);
    setStyle("");
    setTitle("");
    setPrompt("");
    setModel("V4_5ALL");
  };

  const handleSubmit = async () => {
    if (!trackAId || !trackBId) {
      toast.error(t.validation.pickBothTracks);
      return;
    }
    if (trackAId === trackBId) {
      toast.error(t.validation.tracksMustDiffer);
      return;
    }
    if (customMode && !style.trim()) {
      toast.error(t.validation.specifyStyle);
      return;
    }
    if (customMode && !title.trim()) {
      toast.error(t.validation.specifyTitle);
      return;
    }
    if (!instrumental && !prompt.trim()) {
      toast.error(t.validation.promptOrInstrumental);
      return;
    }

    // Block forbidden artist names across prompt + style.
    const combined = `${prompt}\n${style}`;
    const validation = validatePromptForGeneration(prompt, combined);
    if (!validation.valid) {
      toast.error(validation.error, { description: validation.suggestion });
      return;
    }

    try {
      const result = await mashupMutation.mutateAsync({
        trackAId,
        trackBId,
        customMode,
        instrumental,
        prompt: instrumental ? undefined : prompt,
        style: customMode ? style : undefined,
        title: customMode ? title : undefined,
        model,
        projectId,
      });

      logger.info("Mashup started", { trackId: result.trackId, taskId: result.taskId });
      toast.success(t.actions.successToast, {
        description: t.actions.successDescription,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Mashup submit error", { error });
      showGenerationError(error);
    }
  };

  const submitting = mashupMutation.isPending;

  const trackOptions = useMemo(
    () => (tracks ?? []).map((track) => ({ value: track.id, label: track.title || t.validation.fallback })),
    [tracks, t.validation.fallback],
  );
  const trackOptionsB = useMemo(
    () => availableTracksB.map((track) => ({ value: track.id, label: track.title || t.validation.fallback })),
    [availableTracksB, t.validation.fallback],
  );

  const formProps = {
    trackAId,
    trackBId,
    onTrackAChange: setTrackAId,
    onTrackBChange: setTrackBId,
    trackOptions,
    trackOptionsB,
    customMode,
    onCustomModeChange: setCustomMode,
    instrumental,
    onInstrumentalChange: setInstrumental,
    style,
    onStyleChange: setStyle,
    title,
    onTitleChange: setTitle,
    prompt,
    onPromptChange: setPrompt,
    model,
    onModelChange: setModel,
    modelOptions: MODEL_OPTIONS,
    submitting,
    onSubmit: () => {
      void handleSubmit();
    },
  };

  const form = <MashupFormFields {...formProps} />;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-primary" />
              {t.dialog.title}
            </DrawerTitle>
            <DrawerDescription>{t.dialog.description}</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6 overflow-y-auto">{form}</ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-primary" />
            {t.dialog.title}
          </DialogTitle>
          <DialogDescription>{t.dialog.description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
};
