import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MicVocal, Music, Sparkles } from "@/lib/icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

interface AddVocalsToGuitarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioUrl: string;
  suggestedStyle?: string;
  suggestedTags?: string[];
}

const vocalStyles = [
  { label: "Мужской", value: "male vocals" },
  { label: "Женский", value: "female vocals" },
  { label: "Дуэт", value: "duet, male and female vocals" },
  { label: "Хор", value: "choir, harmony vocals" },
];

const moodPresets = [
  { label: "Романтичный", tags: "romantic, emotional, heartfelt" },
  { label: "Энергичный", tags: "energetic, powerful, dynamic" },
  { label: "Меланхоличный", tags: "melancholic, sad, atmospheric" },
  { label: "Весёлый", tags: "upbeat, happy, cheerful" },
];

export function AddVocalsToGuitarDialog({
  open,
  onOpenChange,
  audioUrl,
  suggestedStyle = "",
  suggestedTags = [],
}: AddVocalsToGuitarDialogProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // Form state
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState(suggestedStyle || "acoustic, guitar, vocals");
  const [vocalType, setVocalType] = useState("");
  const [mood, setMood] = useState("");

  const handleSubmit = async () => {
    if (!audioUrl) {
      toast.error("Аудио файл не найден");
      return;
    }

    if (customMode && !lyrics.trim()) {
      toast.error("Добавьте текст песни или описание");
      return;
    }

    setLoading(true);
    try {
      // Build prompt from lyrics or description
      const prompt = lyrics.trim() || "Добавить профессиональный вокал к этой гитарной записи";

      // Build style combining suggested tags, vocal type, and mood
      const styleParts = [style];
      if (vocalType) styleParts.push(vocalType);
      if (mood) styleParts.push(mood);
      const finalStyle = styleParts.filter(Boolean).join(", ");

      const effectiveTitle = title.trim() || `Гитарный трек с вокалом ${new Date().toLocaleDateString("ru-RU")}`;

      const { data, error } = await supabase.functions.invoke("suno-add-vocals", {
        body: {
          audioUrl,
          prompt,
          customMode,
          style: finalStyle,
          title: effectiveTitle,
          negativeTags: "",
        },
      });

      if (error) throw error;

      toast.success("Добавление вокала началось! 🎤", {
        description: "Трек появится в библиотеке через 1-3 минуты",
      });

      onOpenChange(false);

      // Reset form
      setLyrics("");
      setTitle("");
      setVocalType("");
      setMood("");
    } catch (error) {
      logger.error("Add vocals to guitar error", { error });
      const errorMessage = error instanceof Error ? error.message : "Ошибка добавления вокала";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-5 py-2">
      {/* Info Banner */}
      <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span className="font-medium">AI добавит вокал к вашей гитарной записи</span>
        </div>
        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {suggestedTags.slice(0, 5).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">Продвинутый режим</Label>
        <Switch checked={customMode} onCheckedChange={setCustomMode} />
      </div>

      {/* Vocal Type Selection */}
      <div>
        <Label className="text-sm mb-2 block">Тип вокала</Label>
        <div className="flex flex-wrap gap-2">
          {vocalStyles.map((vs) => (
            <Button
              key={vs.value}
              type="button"
              variant={vocalType === vs.value ? "default" : "outline"}
              size="sm"
              onClick={() => setVocalType(vocalType === vs.value ? "" : vs.value)}
              className="text-xs"
            >
              {vs.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mood Presets */}
      <div>
        <Label className="text-sm mb-2 block">Настроение</Label>
        <div className="flex flex-wrap gap-2">
          {moodPresets.map((mp) => (
            <Button
              key={mp.tags}
              type="button"
              variant={mood === mp.tags ? "default" : "outline"}
              size="sm"
              onClick={() => setMood(mood === mp.tags ? "" : mp.tags)}
              className="text-xs"
            >
              {mp.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Lyrics / Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="lyrics" className="text-sm">
            {customMode ? "Текст песни" : "Описание (опционально)"}
          </Label>
          <VoiceInputButton onResult={setLyrics} context="lyrics" appendMode currentValue={lyrics} size="sm" />
        </div>
        <Textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={
            customMode
              ? "[Куплет]\nТвои слова здесь...\n\n[Припев]\nПрипев песни..."
              : "Опишите желаемый вокал или оставьте пустым для автогенерации"
          }
          rows={customMode ? 6 : 3}
          className="resize-none"
        />
      </div>

      {/* Advanced Options */}
      {customMode && (
        <>
          <div>
            <Label htmlFor="title" className="text-sm">
              Название трека
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой гитарный трек"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="style" className="text-sm">
              Стиль
            </Label>
            <Input
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="acoustic, folk, emotional"
              className="mt-1.5"
            />
          </div>
        </>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Отмена
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1 gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Добавить вокал
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <MicVocal className="w-5 h-5 text-primary" />
              Добавить вокал к гитаре
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MicVocal className="w-5 h-5 text-primary" />
            Добавить вокал к гитаре
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
