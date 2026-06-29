import { useState, useEffect } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Sparkles } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Track } from "@/types/track";
import { formatTime } from "@/lib/player-utils";
import { logger } from "@/lib/logger";
import { useExtendProgress } from "@/hooks/generation/useExtendProgress";
import { GenerationProgressBar } from "@/components/generation/GenerationProgressBar";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { PromptValidationAlert } from "@/components/generate-form/PromptValidationAlert";
import { validatePromptForGeneration } from "@/lib/errorHandling";
import { LazyImage } from "@/components/ui/lazy-image";

interface ExtendTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const ExtendTrackDialog = ({ open, onOpenChange, track }: ExtendTrackDialogProps) => {
  const navigate = useNavigate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const extendProgress = useExtendProgress();

  const [useCustomParams, setUseCustomParams] = useState(true);

  // Custom parameters
  const [continueAt, setContinueAt] = useState(track.duration_seconds || 60);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(track.style || "");
  const [title, setTitle] = useState(`${track.title || "Track"} (Extended)`);

  // Advanced settings
  const [model, setModel] = useState(track.suno_model || "V4_5ALL");
  const [negativeTags, setNegativeTags] = useState("");
  const [vocalGender, setVocalGender] = useState<"m" | "f" | "auto">("auto");
  const [styleWeight, setStyleWeight] = useState([0.65]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([0.5]);
  const [audioWeight, setAudioWeight] = useState([0.65]);

  // Reset progress when dialog opens
  useEffect(() => {
    if (open) {
      extendProgress.reset();
    }
  }, [open]);

  const loading = extendProgress.status === "submitting";

  const handleExtend = async () => {
    if (useCustomParams) {
      if (!prompt) {
        toast.error("Пожалуйста, укажите как продолжить трек");
        return;
      }
      if (!style) {
        toast.error("Пожалуйста, укажите стиль");
        return;
      }
      if (!title) {
        toast.error("Пожалуйста, укажите название");
        return;
      }
      if (!continueAt || continueAt <= 0) {
        toast.error("Пожалуйста, укажите время продолжения");
        return;
      }

      // Validate for blocked artist names
      const validation = validatePromptForGeneration(prompt, style);
      if (!validation.valid) {
        toast.error(validation.error, { description: validation.suggestion });
        return;
      }
    }

    extendProgress.setSubmitting();
    try {
      const { data, error } = await supabase.functions.invoke("suno-music-extend", {
        body: {
          sourceTrackId: track.id,
          defaultParamFlag: useCustomParams,
          continueAt: useCustomParams ? continueAt : undefined,
          prompt: useCustomParams ? prompt : undefined,
          style: useCustomParams ? style : undefined,
          title: useCustomParams ? title : undefined,
          model,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender === "auto" ? undefined : vocalGender,
          styleWeight: styleWeight[0],
          weirdnessConstraint: weirdnessConstraint[0],
          audioWeight: audioWeight[0],
          projectId: track.project_id,
        },
      });

      if (error) throw error;

      // Start tracking the task
      if (data?.taskId) {
        extendProgress.startTracking(data.taskId, data.trackId || track.id);
      } else {
        toast.success("Расширение началось! 🎵", {
          description: "Расширенный трек появится в библиотеке через 1-3 минуты",
        });
        onOpenChange(false);
      }
    } catch (error) {
      logger.error("Extend error", { error });

      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("429") || errorMessage.includes("credits")) {
        extendProgress.setError("Недостаточно кредитов");
      } else {
        extendProgress.setError(errorMessage || "Попробуйте еще раз");
      }
    }
  };

  const handlePlayTrack = () => {
    if (extendProgress.completedTrack) {
      playTrack({
        id: extendProgress.completedTrack.id,
        title: extendProgress.completedTrack.title,
        audio_url: extendProgress.completedTrack.audio_url,
        cover_url: extendProgress.completedTrack.cover_url || undefined,
      } as Track);
    }
  };

  const handleOpenTrack = () => {
    if (extendProgress.completedTrack) {
      navigate(`/track/${extendProgress.completedTrack.id}`);
      onOpenChange(false);
    }
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={onOpenChange}
      title="Расширить трек"
      size="xl"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        {extendProgress.status !== "idle" && (
          <GenerationProgressBar
            status={extendProgress.status}
            progress={extendProgress.progress}
            message={extendProgress.message}
            error={extendProgress.error}
            completedTrack={extendProgress.completedTrack}
            onPlayTrack={handlePlayTrack}
            onOpenTrack={handleOpenTrack}
            onRetry={handleExtend}
            onDismiss={() => {
              extendProgress.reset();
              if (extendProgress.isCompleted) onOpenChange(false);
            }}
          />
        )}

        {/* Track Info */}
        <div className="p-4 rounded-lg glass border border-border/50">
          <div className="flex items-center gap-3">
            {track.cover_url && (
              <LazyImage src={track.cover_url} alt={track.title || ""} className="w-12 h-12 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{track.title || "Без названия"}</h3>
              <p className="text-sm text-muted-foreground">
                {track.style} • {formatTime(track.duration_seconds || 0)}
              </p>
            </div>
            <Badge>{track.suno_model || "V4"}</Badge>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
          <div>
            <Label className="font-medium">Пользовательские параметры</Label>
            <p className="text-xs text-muted-foreground mt-1">Изменить стиль и направление продолжения</p>
          </div>
          <Switch checked={useCustomParams} onCheckedChange={setUseCustomParams} />
        </div>

        {useCustomParams ? (
          <>
            {/* Continue At */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Продолжить с (секунд)</Label>
                <Badge variant="outline">{formatTime(continueAt)}</Badge>
              </div>
              <Slider
                value={[continueAt]}
                onValueChange={(v) => setContinueAt(v[0])}
                min={1}
                max={track.duration_seconds || 240}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">С какого момента начать расширение трека</p>
            </div>

            {/* Prompt */}
            <div>
              <Label htmlFor="prompt">Как продолжить *</Label>
              <Textarea
                id="prompt"
                placeholder="Добавить более энергичную секцию с эпическим нарастанием"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="mt-2 resize-none"
              />
              <PromptValidationAlert
                text={prompt}
                onApplyReplacement={(newText) => setPrompt(newText)}
                className="mt-2"
              />
            </div>

            {/* Style */}
            <div>
              <Label htmlFor="style">Стиль *</Label>
              <Input
                id="style"
                placeholder="Electronic Dance Music, 128 BPM"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-2"
              />
              <PromptValidationAlert
                text={style}
                onApplyReplacement={(newText) => setStyle(newText)}
                className="mt-2"
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Название *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
            </div>
          </>
        ) : (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Трек будет продолжен с использованием оригинальных параметров и стиля
            </p>
          </div>
        )}

        {/* Advanced Settings */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4" />
            Расширенные настройки
          </h3>

          {/* Model */}
          <div>
            <Label htmlFor="model">Модель</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V5">V5 - Новейшая</SelectItem>
                <SelectItem value="V4_5PLUS">V4.5+ - Богатый звук</SelectItem>
                <SelectItem value="V4_5ALL">V4.5 All - Лучшая структура</SelectItem>
                <SelectItem value="V4_5">V4.5 - Быстро</SelectItem>
                <SelectItem value="V4">V4 - Классика</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vocal Gender */}
          {track.has_vocals && (
            <div>
              <Label htmlFor="vocal-gender">Пол вокала</Label>
              <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as "m" | "f" | "auto")}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Автоматически" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Автоматически</SelectItem>
                  <SelectItem value="m">Мужской</SelectItem>
                  <SelectItem value="f">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Audio Weight */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Вес оригинального аудио</Label>
              <Badge variant="outline">{audioWeight[0].toFixed(2)}</Badge>
            </div>
            <Slider value={audioWeight} onValueChange={setAudioWeight} min={0} max={1} step={0.01} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Насколько сильно сохранить оригинальное звучание</p>
          </div>

          {/* Style Weight */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Вес стиля</Label>
              <Badge variant="outline">{styleWeight[0].toFixed(2)}</Badge>
            </div>
            <Slider value={styleWeight} onValueChange={setStyleWeight} min={0} max={1} step={0.01} className="mt-2" />
          </div>

          {/* Creativity */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Креативность</Label>
              <Badge variant="outline">{weirdnessConstraint[0].toFixed(2)}</Badge>
            </div>
            <Slider
              value={weirdnessConstraint}
              onValueChange={setWeirdnessConstraint}
              min={0}
              max={1}
              step={0.01}
              className="mt-2"
            />
          </div>

          {/* Negative Tags */}
          <div>
            <Label htmlFor="negative-tags">Исключить</Label>
            <Input
              id="negative-tags"
              placeholder="elements to avoid..."
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <Button onClick={handleExtend} disabled={loading || extendProgress.isActive} size="lg" className="w-full gap-2">
          {loading || extendProgress.isActive ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {extendProgress.message || "Расширение..."}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Расширить трек
              <Badge variant="secondary" className="ml-2">
                10
              </Badge>
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">Расширение обычно занимает 1-3 минуты</p>
      </div>
    </UnifiedDialog>
  );
};
