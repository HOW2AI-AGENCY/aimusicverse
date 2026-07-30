/**
 * MashupDialog (Remix) — смешивание 2 треков через SunoAPI.
 *
 * Использует `POST /api/v1/generate/mashup` с 2 audio URL.
 * Пользователь выбирает 2 трека из сгенерированных + стиль сведения.
 */

import { useState } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shuffle, Loader2, Music, Plus, Check } from "@/lib/icons";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { createMashup } from "@/services/mashup.service";
import { useAuth } from "@/hooks/useAuth";
import { useTracks } from "@/hooks/useTracks";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Tables } from "@/integrations/supabase/types";

interface MashupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTrack: Tables<"tracks">;
  projectId?: string;
}

export function MashupDialog({ open, onOpenChange, sourceTrack, projectId }: MashupDialogProps) {
  const { user } = useAuth();
  const { tracks = [] } = useTracks({ projectId });
  const [secondTrackId, setSecondTrackId] = useState<string | null>(null);
  const [title, setTitle] = useState(`${sourceTrack.title || "Трек"} (ремикс)`);
  const [style, setStyle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const availableTracks = tracks.filter(
    (t) => t.id !== sourceTrack.id && t.audio_url && t.status === "completed",
  );

  const mashupMutation = useMutation({
    mutationFn: async () => {
      if (!user || !secondTrackId) throw new Error("Missing data");
      const secondTrack = tracks.find((t) => t.id === secondTrackId);
      if (!secondTrack?.audio_url) throw new Error("Second track has no audio");

      const { data, error } = await supabase.functions.invoke("suno-mashup", {
        body: {
          uploadUrlList: [sourceTrack.audio_url, secondTrack.audio_url],
          customMode: !!style,
          prompt: prompt || undefined,
          style: style || undefined,
          title,
          instrumental: false,
          model: "V4_5ALL",
        },
      });
      if (error) throw new Error(error.message || "Mashup failed");
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!secondTrackId) {
      toast.error("Выберите второй трек для ремикса");
      return;
    }
    if (!user) {
      toast.error("Не авторизован");
      return;
    }

    try {
      setSubmitted(true);
      const result = await mashupMutation.mutateAsync();

      if (!result?.taskId) throw new Error("No taskId returned");

      toast.success("Ремикс запущен", {
        description: "Сведение 2 треков займёт 1-3 минуты",
      });
      onOpenChange(false);
    } catch (error) {
      logger.error("Mashup failed", error);
      toast.error("Ошибка при создании ремикса");
      setSubmitted(false);
    }
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={(o) => { if (!o) setSubmitted(false); onOpenChange(o); }}
      title={submitted ? "Ремикс создаётся..." : "Создать ремикс (мэшап)"}
      description={submitted ? "Сведение 2 треков — подождите 1-3 минуты" : "Смешайте 2 трека в один"}
    >
      <div className="space-y-4 py-2">
        {/* Source track */}
        <div>
          <Label className="mb-2 block">Первый трек (оригинал)</Label>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {sourceTrack.cover_url ? (
              <LazyImage src={sourceTrack.cover_url} alt={sourceTrack.title || ""} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{sourceTrack.title || "Без названия"}</p>
              <p className="text-xs text-muted-foreground truncate">{sourceTrack.style || ""}</p>
            </div>
            <Check className="w-4 h-4 text-primary shrink-0" />
          </div>
        </div>

        {/* Second track picker */}
        <div className="space-y-2">
          <Label>Второй трек (для смешивания)</Label>
          <ScrollArea className="max-h-40">
            <div className="space-y-1">
              {availableTracks.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Нет доступных треков для смешивания</p>
              )}
              {availableTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSecondTrackId(track.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                    secondTrackId === track.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent",
                  )}
                >
                  {track.cover_url ? (
                    <LazyImage src={track.cover_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Music className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="flex-1 truncate">{track.title || "Без названия"}</span>
                  {secondTrackId === track.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Название ремикса</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите название" />
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label>Стиль сведения (опционально)</Label>
          <Input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Например: EDM, Orchestral, Lo-Fi..."
          />
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label>Описание (опционально)</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Как должны сочетаться треки?"
            rows={2}
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          {submitted ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button
                onClick={handleSubmit}
                disabled={mashupMutation.isPending || !secondTrackId}
              >
                {mashupMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Создаём...</>
                ) : (
                  <><Shuffle className="w-4 h-4 mr-2" />Создать ремикс</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </UnifiedDialog>
  );
}
