/**
 * AddInstrumentalDrawer
 * Drawer for adding AI-generated instrumental to a track
 * Phase 4 - Extend/Vocal Integration
 */

import { memo, useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Guitar, Music2, Wand2, Sparkles, Loader2, X, ChevronDown, Settings2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { logger } from "@/lib/logger";
import type { Track } from "@/types/track";

interface AddInstrumentalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  onSuccess?: (newTrackId: string) => void;
}

type InstrumentType = "guitar" | "piano" | "drums" | "bass" | "synth" | "strings" | "custom";

const INSTRUMENT_PRESETS: Record<InstrumentType, { label: string; icon: typeof Guitar; style: string }> = {
  guitar: { label: "Гитара", icon: Guitar, style: "acoustic guitar, fingerpicking" },
  piano: { label: "Пианино", icon: Music2, style: "piano, keys, melodic" },
  drums: { label: "Ударные", icon: Music2, style: "drums, percussion, rhythmic" },
  bass: { label: "Бас", icon: Music2, style: "bass, deep, groovy" },
  synth: { label: "Синтезатор", icon: Sparkles, style: "synth, electronic, ambient" },
  strings: { label: "Струнные", icon: Music2, style: "strings, orchestral, cinematic" },
  custom: { label: "Свой стиль", icon: Wand2, style: "" },
};

export const AddInstrumentalDrawer = memo(function AddInstrumentalDrawer({
  open,
  onOpenChange,
  track,
  onSuccess,
}: AddInstrumentalDrawerProps) {
  const haptic = useHapticFeedback();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"instrument" | "settings">("instrument");

  // Form state
  const [instrumentType, setInstrumentType] = useState<InstrumentType>("guitar");
  const [customStyle, setCustomStyle] = useState("");
  const [title, setTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");

  // Advanced settings
  const [audioWeight, setAudioWeight] = useState(0.7);
  const [styleWeight, setStyleWeight] = useState(0.6);

  // Telegram safe area
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;

  // Get effective style
  const effectiveStyle = instrumentType === "custom" ? customStyle : INSTRUMENT_PRESETS[instrumentType].style;

  // Handle instrument selection
  const handleInstrumentSelect = useCallback(
    (type: InstrumentType) => {
      haptic.tap();
      setInstrumentType(type);
      if (type !== "custom") {
        setCustomStyle("");
      }
    },
    [haptic],
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!effectiveStyle.trim()) {
      toast.error("Укажите стиль инструментала");
      return;
    }

    haptic.tap();
    setLoading(true);

    try {
      logger.info("[AddInstrumentalDrawer] Starting instrumental generation", {
        trackId: track.id,
        instrumentType,
        style: effectiveStyle,
      });

      const body = {
        track_id: track.id,
        audio_url: track.audio_url,
        style: effectiveStyle,
        title: title.trim() || `${track.title || "Трек"} + ${INSTRUMENT_PRESETS[instrumentType].label}`,
        negative_tags: negativeTags.trim() || undefined,
        audio_weight: audioWeight,
        style_weight: styleWeight,
        action: "add_instrumental",
      };

      // Use similar endpoint to add-vocals but for instrumental
      const { data, error } = await supabase.functions.invoke("suno-add-instrumental", { body });

      if (error) throw error;

      const newTrackId = data?.trackId || data?.track?.id;

      toast.success("Добавление инструментала началось! 🎸", {
        description: "Новый трек появится в библиотеке через 1-3 минуты",
      });

      if (newTrackId) {
        onSuccess?.(newTrackId);
      }

      onOpenChange(false);
    } catch (error) {
      logger.error("[AddInstrumentalDrawer] Generation failed", error);
      toast.error("Ошибка генерации", {
        description: error instanceof Error ? error.message : "Попробуйте позже",
      });
    } finally {
      setLoading(false);
    }
  }, [
    track,
    instrumentType,
    effectiveStyle,
    title,
    negativeTags,
    audioWeight,
    styleWeight,
    haptic,
    onSuccess,
    onOpenChange,
  ]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!loading) {
      haptic.tap();
      onOpenChange(false);
    }
  }, [loading, haptic, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl p-0 flex flex-col"
        style={{ paddingBottom: safeAreaBottom }}
      >
        <SheetHeader className="flex-shrink-0 px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Guitar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <SheetTitle className="text-left text-base">Добавить инструментал</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{track.title || "Трек"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="instrument" className="gap-1.5">
                  <Guitar className="w-3.5 h-3.5" />
                  Инструмент
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  Настройки
                </TabsTrigger>
              </TabsList>

              {/* Instrument selection */}
              <TabsContent value="instrument" className="space-y-4 mt-4">
                <div>
                  <Label className="mb-3 block">Тип инструмента</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(INSTRUMENT_PRESETS) as InstrumentType[]).map((type) => {
                      const preset = INSTRUMENT_PRESETS[type];
                      const isSelected = instrumentType === type;

                      return (
                        <motion.button
                          key={type}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-card/50 hover:border-border",
                          )}
                          onClick={() => handleInstrumentSelect(type)}
                          whileTap={{ scale: 0.95 }}
                        >
                          <preset.icon
                            className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")}
                          />
                          <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-foreground")}>
                            {preset.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom style input */}
                {instrumentType === "custom" && (
                  <div>
                    <Label htmlFor="custom-style">Свой стиль *</Label>
                    <Textarea
                      id="custom-style"
                      value={customStyle}
                      onChange={(e) => setCustomStyle(e.target.value)}
                      placeholder="Опишите желаемый инструментал: acoustic guitar solo, blues riff..."
                      className="mt-2 min-h-[100px]"
                    />
                  </div>
                )}

                {/* Style preview */}
                {instrumentType !== "custom" && (
                  <Alert>
                    <Music2 className="w-4 h-4" />
                    <AlertDescription className="text-xs">Стиль: {effectiveStyle}</AlertDescription>
                  </Alert>
                )}

                {/* Title */}
                <div>
                  <Label htmlFor="title">Название трека</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`${track.title || "Трек"} + ${INSTRUMENT_PRESETS[instrumentType].label}`}
                    className="mt-2"
                  />
                </div>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* Negative tags */}
                <div>
                  <Label htmlFor="negative">Исключить (негативные теги)</Label>
                  <Input
                    id="negative"
                    value={negativeTags}
                    onChange={(e) => setNegativeTags(e.target.value)}
                    placeholder="vocals, drums, noise"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Элементы, которых не должно быть в генерации</p>
                </div>

                {/* Audio weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Вес исходного аудио</Label>
                    <Badge variant="outline">{Math.round(audioWeight * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[audioWeight]}
                    onValueChange={([v]) => setAudioWeight(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Насколько результат будет похож на исходный трек</p>
                </div>

                {/* Style weight */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Вес стиля</Label>
                    <Badge variant="outline">{Math.round(styleWeight * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[styleWeight]}
                    onValueChange={([v]) => setStyleWeight(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Насколько сильно применять выбранный стиль</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Submit button */}
        <div className="flex-shrink-0 p-4 border-t border-border/50">
          <Button className="w-full h-12" onClick={handleSubmit} disabled={loading || !effectiveStyle.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Guitar className="w-4 h-4 mr-2" />
                Добавить инструментал
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

export type { AddInstrumentalDrawerProps };
