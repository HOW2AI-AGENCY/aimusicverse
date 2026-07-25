/**
 * RemixTrackDialog — форма ремикса активной версии трека.
 *
 * Открывается из меню действий: параметры трека подставляются заранее,
 * пользователь правит стиль/название/настройки и запускает ремикс.
 * Оформление — единая оболочка формы генерации (GenerateModal).
 */
import { useEffect, useMemo, useState } from "react";
import { GenerateModal } from "@/components/generate-form/primitives/GenerateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Loader2 } from "@/lib/icons";
import { toast } from "sonner";
import { SUNO_MODELS } from "@/constants/sunoModels";
import { useRemixTrack } from "@/hooks/studio/useRemixTrack";
import type { Track } from "@/types/track";

interface RemixTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  /** Активная версия — ремикс всегда применяется к ней. */
  activeVersion?: { versionLabel: string; audioUrl: string; sunoId?: string } | null;
}

export function RemixTrackDialog({ open, onOpenChange, track, activeVersion }: RemixTrackDialogProps) {
  const remixMutation = useRemixTrack();

  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState("V4_5");
  const [audioWeight, setAudioWeight] = useState(0.5);
  const [negativeTags, setNegativeTags] = useState("");

  // Подставляем параметры трека каждый раз при открытии
  useEffect(() => {
    if (!open) return;
    setStyle(track.style || "");
    setTitle(`${track.title || "Трек"} (Remix)`);
    setPrompt(track.prompt || "");
    setInstrumental(track.is_instrumental === true || track.has_vocals === false);
    setModel(track.model_name && SUNO_MODELS[track.model_name] ? track.model_name : "V4_5");
    setAudioWeight(0.5);
    setNegativeTags("");
  }, [open, track.id, track.style, track.title, track.prompt, track.is_instrumental, track.has_vocals, track.model_name]);

  const modelOptions = useMemo(
    () => Object.entries(SUNO_MODELS).filter(([, info]) => info.status !== "deprecated"),
    [],
  );

  const sunoId = activeVersion?.sunoId || track.suno_id || "";
  const audioUrl = activeVersion?.audioUrl || track.audio_url || "";
  const isDisabled = remixMutation.isPending || !style.trim() || !sunoId;

  const handleSubmit = async () => {
    if (isDisabled) return;
    const { error } = await remixMutation.mutateAsync({
      audioId: sunoId,
      audioUrl,
      prompt: prompt.trim() || style.trim(),
      style: style.trim(),
      title: title.trim() || `${track.title || "Трек"} (Remix)`,
      instrumental,
      model,
      audioWeight,
      negativeTags: negativeTags.trim() || undefined,
    });

    if (error) {
      toast.error("Не удалось запустить ремикс", { description: error.message });
      return;
    }

    toast.success("Ремикс запущен", { description: "Готовый вариант появится в библиотеке" });
    onOpenChange(false);
  };

  return (
    <GenerateModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ремикс трека"
      description={
        activeVersion?.versionLabel
          ? `Источник — версия ${activeVersion.versionLabel}. Измените параметры и запустите ремикс.`
          : "Измените параметры и запустите ремикс."
      }
      icon={Music}
      size="md"
      data-testid="remix-track-dialog"
      footer={
        <Button className="w-full h-11 font-semibold" onClick={handleSubmit} disabled={isDisabled}>
          {remixMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Создание…
            </>
          ) : (
            "Создать ремикс"
          )}
        </Button>
      }
    >
      {!sunoId && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Для ремикса нужен готовый трек Suno. Попробуйте позже.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="remix-style" className="text-xs font-medium">
          Стиль <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="remix-style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          rows={2}
          placeholder="например: lo-fi hip-hop, тёплый винтажный звук"
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remix-title" className="text-xs font-medium">
          Название
        </Label>
        <Input id="remix-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remix-prompt" className="text-xs font-medium">
          Описание / текст запроса
        </Label>
        <Textarea
          id="remix-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Что изменить в новой версии"
          className="resize-none text-sm"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="remix-instrumental" className="text-xs font-medium">
            Инструментал
          </Label>
          <p className="text-[0.6875rem] text-muted-foreground">Без вокала</p>
        </div>
        <Switch id="remix-instrumental" checked={instrumental} onCheckedChange={setInstrumental} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Модель</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map(([key, info]) => (
              <SelectItem key={key} value={key}>
                {info.emoji} {info.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Схожесть с оригиналом</Label>
          <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
            {Math.round(audioWeight * 100)}%
          </span>
        </div>
        <Slider
          value={[audioWeight]}
          onValueChange={([v]) => setAudioWeight(v)}
          min={0}
          max={1}
          step={0.05}
          aria-label="Схожесть с оригиналом"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="remix-negative" className="text-xs font-medium">
          Исключить (negative tags)
        </Label>
        <Input
          id="remix-negative"
          value={negativeTags}
          onChange={(e) => setNegativeTags(e.target.value)}
          placeholder="например: heavy metal, distortion"
          className="h-10 text-sm"
        />
      </div>
    </GenerateModal>
  );
}
