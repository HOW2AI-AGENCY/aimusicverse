/**
 * StudioArrangementDialog
 * Dialog for replacing instrumental using vocal stem
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Guitar, 
  Wand2, 
  Loader2,
  Music,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface StudioArrangementDialogProps {
  open: boolean;
  onClose: () => void;
  vocalTrack: StudioTrack;
  projectName: string;
  onSuccess: (taskId: string, title: string) => void;
}

const PRESET_STYLES = [
  { label: 'Поп', value: 'pop, modern production, catchy' },
  { label: 'Рок', value: 'rock, electric guitar, drums' },
  { label: 'Электронный', value: 'electronic, synth, EDM' },
  { label: 'R&B', value: 'r&b, soul, smooth' },
  { label: 'Хип-хоп', value: 'hip hop, trap, 808 bass' },
  { label: 'Акустик', value: 'acoustic, guitar, organic' },
  { label: 'Джаз', value: 'jazz, piano, swing' },
  { label: 'Лофи', value: 'lofi, chill, relaxed beats' },
];

export function StudioArrangementDialog({
  open,
  onClose,
  vocalTrack,
  projectName,
  onSuccess,
}: StudioArrangementDialogProps) {
  const [step, setStep] = useState<'config' | 'generating'>('config');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(`${projectName} (новая аранжировка)`);
  const [style, setStyle] = useState('');
  const [negativeTags, setNegativeTags] = useState('acapella, vocals only, karaoke, low quality');
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioWeight, setAudioWeight] = useState(0.75);
  const [styleWeight, setStyleWeight] = useState(0.6);
  const [weirdness, setWeirdness] = useState(0.3);

  const vocalAudioUrl = vocalTrack.audioUrl || vocalTrack.clips[0]?.audioUrl;

  const handleGenerate = useCallback(async () => {
    if (!vocalAudioUrl) {
      toast.error('Не найден вокальный трек');
      return;
    }

    if (!style.trim()) {
      toast.error('Укажите стиль для новой аранжировки');
      return;
    }

    setStep('generating');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Необходима авторизация');
        return;
      }

      const { data, error } = await supabase.functions.invoke('suno-add-instrumental', {
        body: {
          audioUrl: vocalAudioUrl,
          title: title.trim() || 'New Arrangement',
          style: style.trim(),
          negativeTags: negativeTags.trim(),
          audioWeight,
          styleWeight,
          weirdnessConstraint: weirdness,
          model: 'V4_5PLUS',
        },
      });

      if (error) throw error;

      if (data?.taskId) {
        toast.success('Генерация запущена', {
          description: 'Новая аранжировка будет готова через 1-2 минуты',
        });
        onSuccess(data.taskId, title);
        onClose();
      } else {
        throw new Error('Не получен taskId');
      }
    } catch (err) {
      console.error('Arrangement generation error:', err);
      toast.error('Ошибка генерации', {
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
      });
      setStep('config');
    } finally {
      setIsLoading(false);
    }
  }, [vocalAudioUrl, title, style, negativeTags, audioWeight, styleWeight, weirdness, onSuccess, onClose]);

  const selectPreset = (preset: string) => {
    setStyle((prev) => {
      if (prev.includes(preset)) return prev;
      return prev ? `${prev}, ${preset}` : preset;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Guitar className="w-5 h-5 text-green-400" />
            Замена инструментала
          </DialogTitle>
          <DialogDescription>
            Создать новую аранжировку, сохранив вокал из трека "{vocalTrack.name}"
          </DialogDescription>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название результата..."
              />
            </div>

            {/* Style presets */}
            <div className="space-y-2">
              <Label>Стиль аранжировки</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_STYLES.map((preset) => (
                  <Badge
                    key={preset.label}
                    variant={style.includes(preset.value) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all"
                    onClick={() => selectPreset(preset.value)}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="pop, modern, energetic..."
                className="mt-2 h-20"
              />
            </div>

            {/* Advanced settings toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sliders className="w-4 h-4" />
              Расширенные настройки
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                showAdvanced && "rotate-90"
              )} />
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-3 rounded-lg bg-muted/30 border">
                {/* Audio Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Следование вокалу</Label>
                    <span className="text-muted-foreground">{Math.round(audioWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[audioWeight]}
                    onValueChange={([v]) => setAudioWeight(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Выше = аранжировка точнее следует ритму и мелодии вокала
                  </p>
                </div>

                {/* Style Weight */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Сила стиля</Label>
                    <span className="text-muted-foreground">{Math.round(styleWeight * 100)}%</span>
                  </div>
                  <Slider
                    value={[styleWeight]}
                    onValueChange={([v]) => setStyleWeight(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </div>

                {/* Weirdness */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Креативность</Label>
                    <span className="text-muted-foreground">{Math.round(weirdness * 100)}%</span>
                  </div>
                  <Slider
                    value={[weirdness]}
                    onValueChange={([v]) => setWeirdness(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Выше = больше необычных и неожиданных элементов
                  </p>
                </div>

                {/* Negative tags */}
                <div className="space-y-2">
                  <Label>Исключить</Label>
                  <Input
                    value={negativeTags}
                    onChange={(e) => setNegativeTags(e.target.value)}
                    placeholder="acapella, low quality..."
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Отмена
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={!style.trim()}
                className="flex-1"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Сгенерировать
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Music className="w-8 h-8 text-green-400" />
              </div>
              <Loader2 className="w-20 h-20 absolute -top-2 -left-2 animate-spin text-primary/30" />
            </div>
            <div className="text-center">
              <p className="font-medium">Генерация аранжировки...</p>
              <p className="text-sm text-muted-foreground">Это займёт 1-2 минуты</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
