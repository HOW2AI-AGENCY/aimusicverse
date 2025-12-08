import { useState, useCallback } from 'react';
import { Scissors, Wand2, Loader2, AlertTriangle, Music } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionSelector } from './SectionSelector';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { cn } from '@/lib/utils';

interface ReplaceSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackLyrics?: string | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function ReplaceSectionDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  trackTags,
  trackLyrics,
  duration,
  currentTime,
  onSeek,
}: ReplaceSectionDialogProps) {
  const [startTime, setStartTime] = useState(duration * 0.2);
  const [endTime, setEndTime] = useState(duration * 0.4);
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState(trackTags || '');

  const replaceMutation = useReplaceSectionMutation();

  const maxDuration = duration * 0.5;
  const sectionDuration = endTime - startTime;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  }, []);

  const handleReplace = async () => {
    if (!isValid) return;

    await replaceMutation.mutateAsync({
      trackId,
      prompt: prompt || undefined,
      tags: tags || undefined,
      infillStartS: Math.round(startTime * 10) / 10,
      infillEndS: Math.round(endTime * 10) / 10,
    });

    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick section presets based on track duration
  const presets = [
    { label: 'Интро', start: 0, end: Math.min(15, duration * 0.1) },
    { label: 'Куплет', start: duration * 0.1, end: Math.min(duration * 0.3, duration * 0.1 + maxDuration) },
    { label: 'Припев', start: duration * 0.35, end: Math.min(duration * 0.55, duration * 0.35 + maxDuration) },
    { label: 'Аутро', start: Math.max(0, duration - 15), end: duration },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Заменить секцию трека
          </DialogTitle>
          <DialogDescription>
            Выберите часть трека для замены и опишите, что хотите получить
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{trackTitle}</p>
              <p className="text-xs text-muted-foreground">
                Длительность: {formatTime(duration)}
              </p>
            </div>
          </div>

          {/* Section Presets */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Быстрый выбор секции
            </Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartTime(preset.start);
                    setEndTime(preset.end);
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Section Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Выберите секцию для замены
            </Label>
            <SectionSelector
              duration={duration}
              currentTime={currentTime}
              onSelectionChange={handleSelectionChange}
              onSeek={onSeek}
              initialStart={startTime}
              initialEnd={endTime}
            />
          </div>

          {/* Warning for long sections */}
          {!isValid && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Секция слишком длинная</p>
                <p className="text-muted-foreground text-xs">
                  Максимальная длительность секции — 50% от трека ({formatTime(maxDuration)})
                </p>
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Описание новой секции
              <span className="text-muted-foreground font-normal ml-1">(опционально)</span>
            </Label>
            <Textarea
              id="prompt"
              placeholder="Опишите, что должно быть в новой секции... Например: энергичный гитарный рифф, спокойное фортепианное соло..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Оставьте пустым, чтобы AI сгенерировал подходящую замену автоматически
            </p>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              Стиль музыки
            </Label>
            <Input
              id="tags"
              placeholder="rock, guitar, energetic..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            {trackTags && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Оригинал:</span>
                <Badge variant="secondary" className="text-xs truncate max-w-[300px]">
                  {trackTags}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={replaceMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleReplace}
            disabled={!isValid || replaceMutation.isPending}
            className="gap-2"
          >
            {replaceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Запуск...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Заменить секцию
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
