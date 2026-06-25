/**
 * AddVocalsDrawer - Add vocals to instrumental tracks from within studio
 * Integrated version of AddVocalsDialog for unified studio
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Mic2, Loader2, Sparkles, Check, AlertCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerationAdvancedSettings, GenerationSettings } from "@/components/common/GenerationAdvancedSettings";
import { InlineLyricsEditor } from "@/components/common/InlineLyricsEditor";
import { useAddVocalsProgress } from "@/hooks/generation/useAddVocalsProgress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { Track } from "@/types/track";

interface AddVocalsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  onSuccess?: (newTrackId: string) => void;
}

export function AddVocalsDrawer({ open, onOpenChange, track, onSuccess }: AddVocalsDrawerProps) {
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState(track.style || "pop, powerful vocals, professional singing");
  const [title, setTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("instrumental only, low quality, distorted");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"lyrics" | "settings">("lyrics");

  // Progress tracking
  const progress = useAddVocalsProgress();

  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({
    audioWeight: 0.7,
    styleWeight: 0.6,
    weirdnessConstraint: 0.3,
    model: "V4_5PLUS",
    vocalGender: "",
  });

  // Reset when track changes
  useEffect(() => {
    if (track) {
      setStyle(track.style || "pop, powerful vocals, professional singing");
      setTitle("");
      setLyrics("");
    }
  }, [track.id]);

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error("У трека отсутствует аудио файл");
      return;
    }

    if (!lyrics.trim()) {
      toast.error("Добавьте текст песни");
      return;
    }

    setLoading(true);
    progress.setSubmitting();

    try {
      const effectiveTitle = title.trim() || `${track.title || "Трек"} с вокалом`;
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

      const taskId = data?.taskId || data?.task?.id;
      const newTrackId = data?.trackId || data?.track?.id;

      if (taskId && newTrackId) {
        progress.startTracking(taskId, newTrackId);

        toast.success("Добавление вокала началось! 🎤", {
          description: "Следите за прогрессом",
        });
      } else {
        toast.success("Добавление вокала началось! 🎤", {
          description: "Новый трек появится в библиотеке через 1-3 минуты",
        });
        onOpenChange(false);
      }
    } catch (error) {
      logger.error("Add vocals error", { error });
      const errorMessage = error instanceof Error ? error.message : "Ошибка добавления вокала";
      toast.error(errorMessage);
      progress.setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle);
  };

  // Handle completion
  useEffect(() => {
    if (progress.isCompleted && progress.trackId) {
      onSuccess?.(progress.trackId);
      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        progress.reset();
      }, 2000);
    }
  }, [progress.isCompleted, progress.trackId, onSuccess, onOpenChange, progress]);

  const isProcessing = loading || progress.isActive || progress.status === "submitting";
  const showProgress = progress.isActive || progress.status === "submitting";

  return (
    <Sheet open={open} onOpenChange={(o) => !isProcessing && onOpenChange(o)}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-h-[85vh]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-primary" />
            Добавить вокал
          </SheetTitle>
          <SheetDescription>
            Создать вокальную партию для инструментала "{track.title || "Без названия"}"
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] sm:max-h-[calc(85vh-200px)]">
          {/* Success State */}
          <AnimatePresence>
            {progress.isCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Вокал добавлен!</p>
                  <p className="text-xs text-muted-foreground">Новый трек создан и добавлен в библиотеку</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {progress.isError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-sm">Ошибка</p>
                  <p className="text-xs text-muted-foreground">{progress.error || "Не удалось добавить вокал"}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress State */}
          <AnimatePresence>
            {showProgress && !progress.isCompleted && !progress.isError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    {progress.status === "submitting" ? "Отправка..." : "Генерация вокала..."}
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress.message || "Это может занять 1-3 минуты"}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content - hidden during processing */}
          {!showProgress && !progress.isCompleted && (
            <>
              {/* Track info */}
              <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
                {track.cover_url && <img src={track.cover_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{track.title || "Без названия"}</p>
                  <p className="text-xs text-muted-foreground">Инструментальный трек</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  <Mic2 className="w-3 h-3 mr-1" />+ Вокал
                </Badge>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "lyrics" | "settings")}>
                <TabsList className="w-full">
                  <TabsTrigger value="lyrics" className="flex-1">
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Текст песни
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Настройки
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lyrics" className="space-y-4 mt-4">
                  {/* Alert */}
                  <Alert>
                    <AlertDescription className="text-xs">
                      Введите текст песни с тегами секций: [Verse], [Chorus], [Bridge] и т.д.
                    </AlertDescription>
                  </Alert>

                  {/* Lyrics editor */}
                  <div>
                    <Label className="mb-2 block">Текст песни *</Label>
                    <InlineLyricsEditor
                      value={lyrics}
                      onChange={setLyrics}
                      onStyleChange={handleStyleChange}
                      minRows={8}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
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

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Название трека</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`${track.title || "Трек"} с вокалом`}
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

                  {/* Advanced Settings */}
                  <GenerationAdvancedSettings
                    settings={advancedSettings}
                    onChange={setAdvancedSettings}
                    showVocalGender={true}
                    vocalGenderLabel="Пол вокала"
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="flex-1">
            {progress.isCompleted ? "Закрыть" : "Отмена"}
          </Button>
          {!progress.isCompleted && (
            <Button onClick={handleSubmit} disabled={isProcessing || !lyrics.trim()} className="flex-1 gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Mic2 className="w-4 h-4" />
                  Добавить вокал
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
