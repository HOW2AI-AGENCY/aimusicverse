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
 */

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mic, Disc } from "@/lib/icons";
import { toast } from "sonner";
import { getAvailableModels } from "@/constants/sunoModels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";
import { validatePromptForGeneration, showGenerationError } from "@/lib/errorHandling";
import { PromptValidationAlert } from "@/components/generate-form/PromptValidationAlert";
import { useTracks } from "@/hooks/useTracks";
import { useSunoMashup } from "@/hooks/studio/useSunoMashup";

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
  const { data: tracks } = useTracks({ statusFilter: ["completed"] });

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

  const availableTracksB = useMemo(() => (tracks ?? []).filter((t) => t.id !== trackAId), [tracks, trackAId]);

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
      toast.error("Выберите оба трека");
      return;
    }
    if (trackAId === trackBId) {
      toast.error("Треки должны различаться");
      return;
    }
    if (customMode && !style.trim()) {
      toast.error("Укажите стиль");
      return;
    }
    if (customMode && !title.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (!instrumental && !prompt.trim()) {
      toast.error("Добавьте описание или выберите инструментальный режим");
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
      toast.success("Mashup запущен 🎛️", {
        description: "Результат появится в библиотеке через 1-3 минуты",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      logger.error("Mashup submit error", { error });
      showGenerationError(error);
    }
  };

  const submitting = mashupMutation.isPending;

  const trackOptions = (tracks ?? []).map((t) => ({
    value: t.id,
    label: t.title || "Без названия",
  }));

  const trackOptionsB = availableTracksB.map((t) => ({
    value: t.id,
    label: t.title || "Без названия",
  }));

  const content = (
    <div className="space-y-4">
      {/* Track A */}
      <div>
        <Label className="text-sm font-medium">Трек A *</Label>
        <Select value={trackAId} onValueChange={setTrackAId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Выберите трек" />
          </SelectTrigger>
          <SelectContent>
            {trackOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track B */}
      <div>
        <Label className="text-sm font-medium">Трек B *</Label>
        <Select value={trackBId} onValueChange={setTrackBId} disabled={!trackAId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={trackAId ? "Выберите трек" : "Сначала выберите трек A"} />
          </SelectTrigger>
          <SelectContent>
            {trackOptionsB.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div>
        <Label className="text-sm font-medium">Модель</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom mode toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <Label className="text-sm">Custom-режим (стиль + название)</Label>
        <Switch checked={customMode} onCheckedChange={setCustomMode} />
      </div>

      {customMode && (
        <>
          <div>
            <Label className="text-sm font-medium">Стиль *</Label>
            <Textarea
              placeholder="Стиль результата..."
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              rows={2}
              className="mt-1.5 resize-none"
              maxLength={1000}
            />
            <PromptValidationAlert text={style} onApplyReplacement={setStyle} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Название *</Label>
            <Input
              placeholder="Название mashup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
              maxLength={100}
            />
          </div>
        </>
      )}

      {/* Vocal toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <Label className="text-sm">С вокалом</Label>
        </div>
        <Switch checked={!instrumental} onCheckedChange={(c) => setInstrumental(!c)} />
      </div>

      {!instrumental && (
        <div>
          <Label className="text-sm font-medium">Описание *</Label>
          <Textarea
            placeholder="Что должен звучать mashup..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="mt-1.5 resize-none"
            maxLength={5000}
          />
          <PromptValidationAlert text={prompt} onApplyReplacement={setPrompt} className="mt-1" />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || !trackAId || !trackBId || (customMode && (!style.trim() || !title.trim()))}
        className="w-full h-11"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Создание mashup...
          </>
        ) : (
          <>
            <Disc className="w-4 h-4 mr-2" />
            Создать mashup
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-primary" />
              Mashup
            </DrawerTitle>
            <DrawerDescription>Смешайте два своих трека в один</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6 overflow-y-auto">{content}</ScrollArea>
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
            Mashup
          </DialogTitle>
          <DialogDescription>Смешайте два своих трека в один</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
