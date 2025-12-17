/**
 * SFX Generator Panel - Generate sound effects via ElevenLabs
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Play, Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStudioProjectStore } from '@/stores/useStudioProjectStore';
import { cn } from '@/lib/utils';

interface SFXGeneratorPanelProps {
  onClose: () => void;
}

const sfxPresets = [
  { label: 'Удар', prompt: 'powerful impact hit, dramatic', emoji: '💥' },
  { label: 'Свуш', prompt: 'fast whoosh transition, cinematic', emoji: '💨' },
  { label: 'Рост', prompt: 'rising tension buildup, suspenseful', emoji: '📈' },
  { label: 'Падение', prompt: 'falling drop impact, bass heavy', emoji: '📉' },
  { label: 'Атмосфера', prompt: 'ambient atmosphere pad, ethereal', emoji: '🌫️' },
  { label: 'Чайм', prompt: 'magical chime bell, sparkle', emoji: '✨' },
  { label: 'Скрип', prompt: 'vinyl scratch, dj effect', emoji: '🎧' },
  { label: 'Эхо', prompt: 'deep echo reverb tail, spacious', emoji: '🔊' },
];

export function SFXGeneratorPanel({ onClose }: SFXGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(3);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => new Audio());
  
  const { addTrack, addClip, currentProject } = useStudioProjectStore();

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, duration }: { prompt: string; duration: number }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, duration }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(error.error || 'Failed to generate SFX');
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    },
    onSuccess: (url) => {
      setGeneratedUrl(url);
      toast.success('SFX сгенерирован!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Введите описание звукового эффекта');
      return;
    }
    generateMutation.mutate({ prompt, duration });
  };

  const handlePreview = () => {
    if (!generatedUrl) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = generatedUrl;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedUrl || !currentProject) return;
    
    // Add new SFX track
    const trackId = addTrack({
      name: `SFX: ${prompt.slice(0, 20)}`,
      type: 'sfx',
      volume: 1,
      pan: 0,
      muted: false,
      solo: false,
      color: 'hsl(38 92% 50%)',
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
    
    toast.success('SFX добавлен на таймлайн');
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
                  prompt === preset.prompt && "bg-primary text-primary-foreground"
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
          <Slider
            value={[duration]}
            min={0.5}
            max={22}
            step={0.5}
            onValueChange={([v]) => setDuration(v)}
          />
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generateMutation.isPending || !prompt.trim()}
        >
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePreview}
            >
              {isPlaying ? (
                <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? 'Играет...' : 'Прослушать'}
            </Button>
            
            <Button
              className="flex-1"
              onClick={handleAddToTimeline}
            >
              <Plus className="h-4 w-4 mr-2" />
              На таймлайн
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
