import { useState } from "react";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Play, Pause, RotateCcw } from "lucide-react";
import { useSunoSounds } from "@/hooks/generation/useSunoSounds";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { SunoSoundsParams } from "@/api/sound-effects.api";

/**
 * Sprint 053-B3: SFX Generator Sheet.
 *
 * MobileBottomSheet (Pitfall #16) with form fields for Suno `/api/v1/sound/generate`:
 *   - prompt    (textarea)
 *   - tempo     (slider 60-200 BPM, optional)
 *   - key       (select C-B, optional)
 *   - duration  (slider 1-60s, optional)
 *   - model     (V5 default, V4_5ALL/V4_5/V4 options)
 *
 * 3 states (Storybook):
 *   - default: empty form, ready to fill
 *   - generating: spinner + disabled form
 *   - success: preview player + Generate another button
 */

const SFX_MODELS = [
  { value: "V5", label: "V5 (latest)" },
  { value: "V4_5ALL", label: "V4.5 All" },
  { value: "V4_5", label: "V4.5" },
  { value: "V4", label: "V4" },
] as const;

const SFX_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export interface SfxGeneratorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SfxGeneratorSheet({ open, onOpenChange }: SfxGeneratorSheetProps) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<SunoSoundsParams["model"]>("V5");
  const [tempo, setTempo] = useState<number | undefined>(undefined);
  const [key, setKey] = useState<SunoSoundsParams["key"] | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const { generate, isGenerating, sfx, error, reset } = useSunoSounds();
  const preview = usePreviewAudio({
    id: sfx?.audio_url ? `sfx-preview-${sfx.audio_url}` : "sfx-preview-idle",
    src: sfx?.audio_url ?? "",
    priority: AudioPriority.LOW,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      logger.info("User triggered SFX generation", { promptLength: prompt.length });
      await generate({
        prompt: prompt.trim(),
        model,
        ...(tempo !== undefined ? { tempo } : {}),
        ...(key !== undefined ? { key } : {}),
        ...(duration !== undefined ? { duration } : {}),
      });
    } catch (err) {
      logger.error("SFX generation failed in sheet", err);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setTempo(undefined);
    setKey(undefined);
    setDuration(undefined);
    setModel("V5");
    reset();
  };

  const isTerminal = sfx?.status === "completed" || sfx?.status === "failed";

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="SFX Generator"
      snapPoints={[0.5, 0.9]}
      defaultSnapPoint={1}
    >
      <div className="space-y-5 p-4 pb-8">
        {/* State banner */}
        {sfx?.status === "completed" && (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            ✅ SFX готов — можно послушать ниже
          </div>
        )}
        {sfx?.status === "failed" && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            ❌ Генерация не удалась. Попробуйте другой промпт.
          </div>
        )}
        {error && !sfx && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            ⚠ {error.message}
          </div>
        )}

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="sfx-prompt">Описание звука</Label>
          <Textarea
            id="sfx-prompt"
            placeholder="Cinematic riser with reverb tail, drum fill, ambient pad..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">{prompt.length}/500</p>
        </div>

        {/* Model select */}
        <div className="space-y-2">
          <Label htmlFor="sfx-model">Модель</Label>
          <Select value={model} onValueChange={(v) => setModel(v as typeof model)} disabled={isGenerating}>
            <SelectTrigger id="sfx-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SFX_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tempo slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sfx-tempo">Tempo (BPM)</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setTempo(undefined)}
              disabled={isGenerating}
            >
              {tempo === undefined ? "auto" : "clear"}
            </button>
          </div>
          <Slider
            id="sfx-tempo"
            min={60}
            max={200}
            step={1}
            value={tempo !== undefined ? [tempo] : [120]}
            onValueChange={(values) => setTempo(values[0])}
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">{tempo === undefined ? "Не задано" : `${tempo} BPM`}</p>
        </div>

        {/* Key picker */}
        <div className="space-y-2">
          <Label htmlFor="sfx-key">Тональность</Label>
          <Select
            value={key ?? "__none__"}
            onValueChange={(v) => setKey(v === "__none__" ? undefined : (v as typeof key))}
            disabled={isGenerating}
          >
            <SelectTrigger id="sfx-key">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Auto</SelectItem>
              {SFX_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sfx-duration">Длительность (сек)</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setDuration(undefined)}
              disabled={isGenerating}
            >
              {duration === undefined ? "auto" : "clear"}
            </button>
          </div>
          <Slider
            id="sfx-duration"
            min={1}
            max={60}
            step={1}
            value={duration !== undefined ? [duration] : [15]}
            onValueChange={(values) => setDuration(values[0])}
            disabled={isGenerating}
          />
          <p className="text-xs text-muted-foreground">{duration === undefined ? "Не задано" : `${duration}s`}</p>
        </div>

        {/* Preview */}
        {sfx?.audio_url && (
          <div className="rounded-md border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Превью</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (preview.isPlaying ? preview.pause() : preview.play())}
                aria-label={preview.isPlaying ? "Pause preview" : "Play preview"}
              >
                {preview.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            {sfx.duration && <p className="text-xs text-muted-foreground">Длительность: {sfx.duration.toFixed(1)}s</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isTerminal ? (
            <>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Ещё один
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Готово
              </Button>
            </>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn("flex-1", "min-h-touch")}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Сгенерировать SFX
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          1 кредит за генерацию. SFX всегда инструментальные (без вокала).
        </p>
      </div>
    </MobileBottomSheet>
  );
}
