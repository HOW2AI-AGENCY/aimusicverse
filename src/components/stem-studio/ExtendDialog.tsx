/**
 * Extend Dialog
 *
 * Extend/continue the track with AI
 */

import { useState } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, Loader2, Music, ArrowRight, Sparkles } from "@/lib/icons";
import { toast } from "sonner";
import { useExtendTrack } from "@/hooks/studio/useExtendTrack";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Tables } from "@/integrations/supabase/types";

interface ExtendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Tables<"tracks">;
}

type ExtendDirection = "continue" | "intro";

export function ExtendDialog({ open, onOpenChange, track }: ExtendDialogProps) {
  const { user } = useAuth();
  const [direction, setDirection] = useState<ExtendDirection>("continue");
  const [prompt, setPrompt] = useState("");
  const extendMutation = useExtendTrack();

  const handleSubmit = async () => {
    if (!track.suno_id) {
      toast.error("Нет данных для расширения");
      return;
    }
    if (!user) {
      toast.error("Не авторизован");
      return;
    }

    try {
      const { error } = await extendMutation.mutateAsync({
        audioId: track.suno_id,
        prompt: prompt || (direction === "continue" ? "Продолжи трек естественно" : "Добавь вступление"),
        continueAt: direction === "continue" ? track.duration_seconds || 120 : 0,
      });

      if (error) throw error;

      toast.success(direction === "continue" ? "Продление трека запущено" : "Создание вступления запущено", {
        description: "Процесс займёт 1-3 минуты",
      });

      onOpenChange(false);
    } catch (error) {
      logger.error("Error extending track", error);
      toast.error("Ошибка при расширении трека");
    }
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={onOpenChange}
      title="Расширить трек"
      description="AI продлит трек или добавит новое вступление"
    >
      <div className="space-y-4 py-2">
        {/* Current Track */}
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
            <p className="text-xs text-muted-foreground">
              Длительность: {Math.floor((track.duration_seconds || 0) / 60)}:
              {String(Math.floor((track.duration_seconds || 0) % 60)).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Direction Selection */}
        <div className="space-y-3">
          <Label>Направление</Label>
          <RadioGroup value={direction} onValueChange={(v) => setDirection(v as ExtendDirection)} className="space-y-2">
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                direction === "continue" ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
              )}
            >
              <RadioGroupItem value="continue" id="continue" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium text-sm">Продолжить</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI продолжит трек с того места, где он заканчивается
                </p>
              </div>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                direction === "intro" ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
              )}
            >
              <RadioGroupItem value="intro" id="intro" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span className="font-medium text-sm">Добавить вступление</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">AI создаст новое вступление перед началом трека</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Additional Instructions */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Указания для AI (опционально)
          </Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              direction === "continue"
                ? "Например: добавь эпичную концовку с оркестром..."
                : "Например: мягкое вступление с пианино..."
            }
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={extendMutation.isPending}>
          {extendMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Создаём...
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              {direction === "continue" ? "Продолжить" : "Добавить вступление"}
            </>
          )}
        </Button>
      </div>
    </UnifiedDialog>
  );
}
