import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mic2, Info } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Track } from "@/types/track";
import { logger } from "@/lib/logger";
import { validatePromptForGeneration, showGenerationError } from "@/lib/errorHandling";
import { InlineLyricsEditor } from "@/components/common/InlineLyricsEditor";
import { GenerationAdvancedSettings, GenerationSettings } from "@/components/common/GenerationAdvancedSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAddVocalsProgress } from "@/hooks/generation/useAddVocalsProgress";

interface AddVocalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddVocalsDialog = ({ open, onOpenChange, track }: AddVocalsDialogProps) => {
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState(track.style || "pop, powerful vocals, professional singing");
  const [title, setTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("instrumental only, low quality, distorted");
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Progress tracking hook
  const progress = useAddVocalsProgress();

  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({
    audioWeight: 0.7,
    styleWeight: 0.6,
    weirdnessConstraint: 0.3,
    model: "V4_5PLUS",
    vocalGender: "",
  });

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error("У трека отсутствует аудио файл");
      return;
    }

    if (!lyrics.trim()) {
      toast.error("Добавьте текст песни");
      return;
    }

    // Pre-validate for blocked artist names
    const validation = validatePromptForGeneration(lyrics, style);
    if (!validation.valid) {
      toast.error(validation.error, {
        description: validation.suggestion,
      });
      return;
    }

    setLoading(true);
    progress.setSubmitting();

    try {
      const effectiveTitle = title.trim() || track.title || "Трек с вокалом";
      const effectiveStyle = style.trim() || "pop, vocals";

      const body: Record<string, unknown> = {
        audioUrl: track.audio_url,
        prompt: lyrics,
        customMode: true,
        style: effectiveStyle,
        title: effectiveTitle,
        negativeTags: negativeTags.trim() || "low quality, distorted, noise",
        projectId: track.project_id,
        audioWeight: advancedSettings.audioWeight,
        styleWeight: advancedSettings.styleWeight,
        weirdnessConstraint: advancedSettings.weirdnessConstraint,
        model: advancedSettings.model,
      };

      if (advancedSettings.vocalGender) {
        body.vocalGender = advancedSettings.vocalGender;
      }

      const { data, error } = await supabase.functions.invoke("suno-add-vocals", { body });

      if (error) throw error;

      // Extract task and track IDs from response
      const taskId = data?.taskId || data?.task?.id;
      const newTrackId = data?.trackId || data?.track?.id;

      if (taskId && newTrackId) {
        // Start tracking progress
        progress.startTracking(taskId, newTrackId);

        // Close main dialog, show progress dialog
        onOpenChange(false);
        setShowProgress(true);

        toast.success("Добавление вокала началось! 🎤", {
          description: "Следите за прогрессом в окне",
        });
      } else {
        // Fallback if no IDs returned (legacy behavior)
        toast.success("Добавление вокала началось! 🎤", {
          description: "Новый трек появится в библиотеке через 1-3 минуты",
        });
        onOpenChange(false);
      }
    } catch (error) {
      logger.error("Add vocals error", { error });
      showGenerationError(error);
      progress.setError(error instanceof Error ? error.message : "Ошибка добавления вокала");
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic2 className="w-5 h-5" />
            Добавить вокал
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info block */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <Mic2 className="w-4 h-4 inline mr-2" />
              Инструментальный трек: <span className="font-semibold">{track.title || "Без названия"}</span>
            </p>
          </div>

          {/* Alert about lyrics */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Введите текст песни, который AI будет петь. Используйте теги [Verse], [Chorus], [Bridge] для структуры.
            </AlertDescription>
          </Alert>

          {/* Lyrics editor with inline AI panel */}
          <div>
            <Label className="mb-2 block">Текст песни (Lyrics) *</Label>
            <InlineLyricsEditor value={lyrics} onChange={setLyrics} onStyleChange={handleStyleChange} minRows={10} />
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="style">Стиль вокала</Label>
            <Input
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="pop, powerful vocals, energetic"
              className="mt-2"
            />
          </div>

          {/* Negative tags */}
          <div>
            <Label htmlFor="negativeTags">Исключить</Label>
            <Input
              id="negativeTags"
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value)}
              placeholder="instrumental only, low quality"
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
              placeholder="Мой новый трек с вокалом"
              className="mt-2"
            />
          </div>

          {/* Advanced Settings - open by default */}
          <GenerationAdvancedSettings
            settings={advancedSettings}
            onChange={setAdvancedSettings}
            showVocalGender={true}
            vocalGenderLabel="Пол вокала"
            defaultOpen={true}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !track.audio_url || !lyrics.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                "Добавить вокал"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
