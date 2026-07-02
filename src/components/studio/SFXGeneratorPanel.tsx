/**
 * SFX Generator Panel - Generate sound effects via Replicate/fal.ai
 * Integrates with studio audio coordination
 */

import { useState, useCallback, useEffect, useId } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Play, Pause, Plus, Volume2 } from "@/lib/icons";
import { toast } from "sonner";
import { useStudioProjectStore } from "@/stores/useStudioProjectStore";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";
import { useGenerateSfx } from "@/hooks/studio/useGenerateSfx";
import { supabase } from "@/integrations/supabase/client";

interface SFXGeneratorPanelProps {
  onClose: () => void;
}

const sfxPresets = [
  { label: "Удар", prompt: "powerful impact hit, dramatic", emoji: "💥" },
  { label: "Свуш", prompt: "fast whoosh transition, cinematic", emoji: "💨" },
  { label: "Рост", prompt: "rising tension buildup, suspenseful", emoji: "📈" },
  { label: "Падение", prompt: "falling drop impact, bass heavy", emoji: "📉" },
  { label: "Атмосфера", prompt: "ambient atmosphere pad, ethereal", emoji: "🌫️" },
  { label: "Чайм", prompt: "magical chime bell, sparkle", emoji: "✨" },
  { label: "Скрип", prompt: "vinyl scratch, dj effect", emoji: "🎧" },
  { label: "Эхо", prompt: "deep echo reverb tail, spacious", emoji: "🔊" },
];

export function SFXGeneratorPanel({ onClose }: SFXGeneratorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(3);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const sourceId = useId();
  const fullSourceId = `sfx-generator-${sourceId}`;

  const { addTrack, addClip, currentProject } = useStudioProjectStore();
  const { pauseTrack } = usePlayerStore();

  // Пул-аудио с динамическим src.
  const { playUrl, pause, toggle, isPlaying } = usePreviewAudio({
    id: fullSourceId,
    src: generatedUrl ?? "",
    priority: AudioPriority.MEDIUM,
  });

  // Регистрация в useStudioAudio координаторе и пауза при старте глобального плейера
  // уже встроены в usePreviewAudio.

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, duration }: { prompt: string; duration: number }) => {
      // Call Replicate/fal.ai SFX edge function
      const { data, error } = await supabase.functions.invoke("generate-sfx", {
        body: { prompt, duration },
      });

      if (error) throw error;
      if (!data?.success || !data?.audioUrl) {
        throw new Error(data?.error || "Failed to generate SFX");
      }

      return data.audioUrl;
    },
    onSuccess: (url) => {
      setGeneratedUrl(url);
      toast.success("SFX сгенерирован!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Введите описание звукового эффекта");
      return;
    }
    generateMutation.mutate({ prompt, duration });
  };

  const handlePreview = async () => {
    if (!generatedUrl) return;

    if (isPlaying) {
      // Toggle off
      pause();
      return;
    }

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(fullSourceId);

    await playUrl(generatedUrl);
  };

  const handleAddToTimeline = () => {
    if (!generatedUrl || !currentProject) return;

    // Add new SFX track
    const trackId = addTrack({
      name: `SFX: ${prompt.slice(0, 20)}`,
      type: "sfx",
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: "hsl(38 92% 50%)",
    });

    // Add clip to the track
    addClip(trackId, {
      audioUrl: generatedUrl,
      name: prompt.slice(0, 30),
      startTime: currentProject.duration > 10 ? currentProject.duration / 2 : 0,
      duration,
      trimStart: 0,
      trimEnd: 0,
      fadeIn: 0.1,
      fadeOut: 0.1,
    });

    toast.success("SFX добавлен на таймлайн");
    onClose();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Генератор звуковых эффектов
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Быстрые пресеты</Label>
          <div className="flex flex-wrap gap-2">
            {sfxPresets.map((preset) => (
              <Badge
                key={preset.label}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors",
                  prompt === preset.prompt && "bg-primary text-primary-foreground",
                )}
                onClick={() => setPrompt(preset.prompt)}
              >
                {preset.emoji} {preset.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="sfx-prompt">Описание эффекта (англ.)</Label>
          <Input
            id="sfx-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="powerful bass drop with reverb..."
            className="text-sm"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Длительность</Label>
            <span className="text-sm text-muted-foreground">{duration}с</span>
          </div>
          <Slider value={[duration]} min={0.5} max={22} step={0.5} onValueChange={([v]) => setDuration(v)} />
        </div>

        {/* Generate Button */}
        <Button className="w-full" onClick={handleGenerate} disabled={generateMutation.isPending || !prompt.trim()}>
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Сгенерировать SFX
            </>
          )}
        </Button>

        {/* Preview & Add */}
        {generatedUrl && (
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" className="flex-1" onClick={handlePreview}>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? "Играет..." : "Прослушать"}
            </Button>

            <Button className="flex-1" onClick={handleAddToTimeline}>
              <Plus className="h-4 w-4 mr-2" />
              На таймлайн
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
