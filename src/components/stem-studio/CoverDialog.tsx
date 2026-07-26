/**
 * CoverDialog — создание кавера трека в новом стиле.
 *
 * Использует SunoAPI `POST /api/v1/generate/upload-cover`.
 * Берёт оригинальный трек + style → генерирует новый трек с той же мелодией.
 *
 * Отличается от ремикса (Mashup): Cover = 1 трек + стиль,
 * Remix (Mashup) = 2 трека смешиваются.
 */

import { useState } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Loader2, Music, Sparkles } from "@/lib/icons";
import { toast } from "sonner";
import { useRemixTrack } from "@/hooks/studio/useRemixTrack";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Tables } from "@/integrations/supabase/types";

interface CoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Tables<"tracks">;
}

const STYLE_PRESETS = [
  { label: "Lo-Fi", value: "lo-fi, chill, relaxed, mellow beats" },
  { label: "EDM", value: "edm, electronic, energetic, dance" },
  { label: "Acoustic", value: "acoustic, unplugged, intimate, organic" },
  { label: "Jazz", value: "jazz, smooth, sophisticated, swing" },
  { label: "Rock", value: "rock, powerful, electric guitar, drums" },
  { label: "R&B", value: "r&b, soulful, groove, smooth" },
  { label: "Synthwave", value: "synthwave, retro, 80s, neon" },
  { label: "Orchestral", value: "orchestral, cinematic, epic, strings" },
];

export function CoverDialog({ open, onOpenChange, track }: CoverDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(`${track.title || "Трек"} (кавер)`);
  const [style, setStyle] = useState(track.style || "");
  const [prompt, setPrompt] = useState("");
  const [isInstrumental, setIsInstrumental] = useState(track.is_instrumental ?? false);
  const [audioWeight, setAudioWeight] = useState(50);
  const [negativeTags, setNegativeTags] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const coverMutation = useRemixTrack(); // reuse same mutation (calls suno-remix which is upload-cover)

  const handlePresetClick = (preset: (typeof STYLE_PRESETS)[0]) => {
    setStyle(preset.value);
  };

  const handleSubmit = async () => {
    if (!track.suno_id) {
      toast.error("Нет данных для создания кавера");
      return;
    }
    if (!user) {
      toast.error("Не авторизован");
      return;
    }
    if (!style.trim()) {
      toast.error("Укажите стиль для кавера");
      return;
    }

    try {
      setSubmitted(true);
      const { error } = await coverMutation.mutateAsync({
        audioId: track.suno_id,
        prompt: prompt || `Кавер в стиле: ${style}`,
        style,
        title,
        instrumental: isInstrumental,
        audioWeight: audioWeight / 100,
        negativeTags: negativeTags || undefined,
      });

      if (error) throw error;

      toast.success("Создание кавера запущено", {
        description: "Новый трек появится в проекте через 1-3 минуты",
      });
      onOpenChange(false);
    } catch (error) {
      logger.error("Error creating cover", error);
      toast.error("Ошибка при создании кавера");
      setSubmitted(false);
    }
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(o) => { if (!o) setSubmitted(false); onOpenChange(o); }}
      title={submitted ? "Кавер создаётся..." : "Создать кавер"}
      description={submitted ? "Подождите 1-3 минуты" : "AI создаст новую версию трека в выбранном стиле"}
    >
      <div className="space-y-4 py-2">
        {/* Original Track */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          {track.cover_url ? (
            <LazyImage src={track.cover_url} alt={track.title || "Cover"} className="w-12 h-12 rounded object-cover" />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.title || "Без названия"}</p>
            <p className="text-xs text-muted-foreground truncate">{track.style || "Оригинал"}</p>
          </div>
        </div>

        {/* New Title */}
        <div className="space-y-2">
          <Label>Название кавера</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите название" />
        </div>

        {/* Style Presets */}
        <div className="space-y-2">
          <Label>Выберите стиль</Label>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.map((preset) => (
              <Badge
                key={preset.label}
                variant={style === preset.value ? "default" : "outline"}
                className={cn("cursor-pointer transition-all", style === preset.value && "bg-primary")}
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Style */}
        <div className="space-y-2">
          <Label>Свой стиль (опционально)</Label>
          <Textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Опишите желаемый стиль..."
            rows={2}
          />
        </div>

        {/* Additional Prompt */}
        <div className="space-y-2">
          <Label>Описание (опционально)</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Дополнительные пожелания..."
            rows={2}
          />
        </div>

        {/* Audio Weight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Влияние оригинала</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{audioWeight}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={audioWeight}
            onChange={(e) => setAudioWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Новое звучание</span>
            <span>Близко к оригиналу</span>
          </div>
        </div>

        {/* Negative Tags */}
        <div className="space-y-2">
          <Label>Чего избегать (опционально)</Label>
          <Input
            value={negativeTags}
            onChange={(e) => setNegativeTags(e.target.value)}
            placeholder="Например: auto-tune, distortion, heavy bass"
          />
        </div>

        {/* Instrumental toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm">Без вокала (инструментал)</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isInstrumental}
              onChange={(e) => setIsInstrumental(e.target.checked)}
              className="rounded border-border"
            />
          </label>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-2 pt-2">
          {submitted ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button onClick={handleSubmit} disabled={coverMutation.isPending || !style.trim()}>
                {coverMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Создаём...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Создать кавер</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </UnifiedDialog>
  );
}
