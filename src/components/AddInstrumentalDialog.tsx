import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Music, Info, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Track } from "@/types/track";
import { logger } from "@/lib/logger";
import { GenerationAdvancedSettings, GenerationSettings } from "@/components/common/GenerationAdvancedSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useAddInstrumentalProgress } from "@/hooks/generation/useAddInstrumentalProgress";
import { GenerationProgressBar } from "@/components/generation/GenerationProgressBar";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

interface AddInstrumentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddInstrumentalDialog = ({ open, onOpenChange, track }: AddInstrumentalDialogProps) => {
  const navigate = useNavigate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const instrumentalProgress = useAddInstrumentalProgress();

  const [style, setStyle] = useState(track.style || "full band arrangement, professional backing track");
  const [title, setTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("acapella, vocals only, karaoke, low quality");
  const [openInStudio, setOpenInStudio] = useState(true);

  // Advanced settings - optimized to reduce vocal hallucinations
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({
    audioWeight: 0.85, // Higher = follows input audio more closely
    styleWeight: 0.5, // Lower = less style influence
    weirdnessConstraint: 0.15, // Lower = less creativity/distortion
    model: "V4_5PLUS",
    vocalGender: "",
  });

  // Reset progress when dialog opens
  useEffect(() => {
    if (open) {
      instrumentalProgress.reset();
    }
  }, [open]);

  const loading = instrumentalProgress.status === "submitting";

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error("У трека отсутствует аудио файл");
      return;
    }

    if (!style.trim()) {
      toast.error("Укажите стиль инструментала");
      return;
    }

    instrumentalProgress.setSubmitting();
    try {
      const effectiveTitle = title.trim() || `${track.title || "Трек"} с инструменталом`;

      const body: Record<string, unknown> = {
        audioUrl: track.audio_url,
        customMode: true,
        style: style.trim(),
        title: effectiveTitle,
        negativeTags: negativeTags.trim() || "low quality, distorted, noise",
        projectId: track.project_id,
        audioWeight: advancedSettings.audioWeight,
        styleWeight: advancedSettings.styleWeight,
        weirdnessConstraint: advancedSettings.weirdnessConstraint,
        model: advancedSettings.model,
        openInStudio, // Flag to open in studio after generation
        originalTrackId: track.id, // For creating studio project
      };

      if (advancedSettings.vocalGender) {
        body.vocalGender = advancedSettings.vocalGender;
      }

      const { data, error } = await supabase.functions.invoke("suno-add-instrumental", { body });

      if (error) throw error;

      // Start tracking the task
      if (data?.taskId) {
        instrumentalProgress.startTracking(data.taskId, data.trackId || track.id, data.studioProjectId);
      } else {
        if (openInStudio) {
          toast.success("Генерация началась! 🎸", {
            description: "После завершения откроется студия для сведения треков",
          });
        } else {
          toast.success("Добавление инструментала началось! 🎸", {
            description: "Новый трек появится в библиотеке через 1-3 минуты",
          });
        }
        onOpenChange(false);
      }
    } catch (error) {
      logger.error("Add instrumental error", { error });
      const errorMessage = error instanceof Error ? error.message : "Ошибка добавления инструментала";
      instrumentalProgress.setError(errorMessage);
    }
  };

  const handlePlayTrack = () => {
    if (instrumentalProgress.completedTrack) {
      playTrack({
        id: instrumentalProgress.completedTrack.id,
        title: instrumentalProgress.completedTrack.title,
        audio_url: instrumentalProgress.completedTrack.audio_url,
        cover_url: instrumentalProgress.completedTrack.cover_url || undefined,
      } as Track);
    }
  };

  const handleOpenTrack = () => {
    if (instrumentalProgress.completedTrack) {
      navigate(`/track/${instrumentalProgress.completedTrack.id}`);
      onOpenChange(false);
    }
  };

  const handleOpenStudio = () => {
    if (instrumentalProgress.studioProjectId) {
      navigate(`/studio/${instrumentalProgress.studioProjectId}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Добавить инструментал
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator */}
          {instrumentalProgress.status !== "idle" && (
            <GenerationProgressBar
              status={instrumentalProgress.status}
              progress={instrumentalProgress.progress}
              message={instrumentalProgress.message}
              error={instrumentalProgress.error}
              completedTrack={instrumentalProgress.completedTrack}
              onPlayTrack={handlePlayTrack}
              onOpenTrack={handleOpenTrack}
              onOpenStudio={instrumentalProgress.studioProjectId ? handleOpenStudio : undefined}
              onRetry={handleSubmit}
              onDismiss={() => {
                instrumentalProgress.reset();
                if (instrumentalProgress.isCompleted) onOpenChange(false);
              }}
            />
          )}

          {/* Info block */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <Music className="w-4 h-4 inline mr-2" />
              Вокальный трек: <span className="font-semibold">{track.title || "Без названия"}</span>
            </p>
          </div>

          {/* Important info about result */}
          <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
            <Info className="w-4 h-4 text-amber-500" />
            <AlertTitle className="text-sm">Важно о результате</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>
                AI сгенерирует инструментал, синхронизированный с вашим вокалом.
                <strong> Результат — отдельная дорожка инструментала</strong>, не смешанная с вокалом.
              </p>
              <p>Для получения готовой песни рекомендуем использовать Stem Studio для сведения.</p>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                💡 Если вокал искажается, увеличьте "Вес аудио" до 0.9+ в расширенных настройках
              </p>
            </AlertDescription>
          </Alert>

          {/* Open in studio option */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Открыть в студии после генерации</Label>
              <p className="text-xs text-muted-foreground">
                Автоматически создаст проект с вокалом и инструменталом для сведения
              </p>
            </div>
            <Switch checked={openInStudio} onCheckedChange={setOpenInStudio} />
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="style">Стиль инструментала *</Label>
            <Textarea
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="rock, electric guitars, powerful drums, full band arrangement"
              rows={3}
              className="mt-2 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Опишите желаемые инструменты и стиль аранжировки</p>
          </div>

          {/* Negative tags */}
          <div>
            <Label htmlFor="negativeTags">Исключить стили</Label>
            <Input
              id="negativeTags"
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              placeholder="acapella, vocals only, karaoke"
              className="mt-2"
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Название трека</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой новый трек с инструменталом"
              className="mt-2"
            />
          </div>

          {/* Advanced Settings - open by default */}
          <GenerationAdvancedSettings
            settings={advancedSettings}
            onChange={setAdvancedSettings}
            showVocalGender={true}
            vocalGenderLabel="Пол вокала (если есть)"
            defaultOpen={true}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || instrumentalProgress.isActive || !track.audio_url || !style.trim()}
            >
              {loading || instrumentalProgress.isActive ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {instrumentalProgress.message || "Обработка..."}
                </>
              ) : (
                "Добавить инструментал"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
