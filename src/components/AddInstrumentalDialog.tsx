import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Music, ChevronDown, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { logger } from '@/lib/logger';

interface AddInstrumentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddInstrumentalDialog = ({ open, onOpenChange, track }: AddInstrumentalDialogProps) => {
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(track.style || 'full band arrangement, professional backing track');
  const [title, setTitle] = useState('');
  const [negativeTags, setNegativeTags] = useState('acapella, vocals only, karaoke, low quality');
  const [loading, setLoading] = useState(false);
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioWeight, setAudioWeight] = useState(0.75);
  const [styleWeight, setStyleWeight] = useState(0.6);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.3);
  const [model, setModel] = useState<'V4_5PLUS' | 'V5'>('V4_5PLUS');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error('У трека отсутствует аудио файл');
      return;
    }

    if (!style.trim()) {
      toast.error('Укажите стиль инструментала');
      return;
    }

    setLoading(true);
    try {
      const effectiveTitle = title.trim() || `${track.title || 'Трек'} с инструменталом`;
      
      const body: Record<string, unknown> = {
        audioUrl: track.audio_url,
        customMode,
        style: style.trim(),
        title: effectiveTitle,
        negativeTags: negativeTags.trim() || 'low quality, distorted, noise',
        projectId: track.project_id,
        // Weights control how AI follows the input audio
        audioWeight,
        styleWeight,
        weirdnessConstraint,
        model,
      };

      // Only add vocalGender if specified
      if (vocalGender) {
        body.vocalGender = vocalGender;
      }

      const { data, error } = await supabase.functions.invoke('suno-add-instrumental', { body });

      if (error) throw error;

      toast.success('Добавление инструментала началось! 🎸', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Add instrumental error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления инструментала';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <Music className="w-4 h-4 inline mr-2" />
              Будет использован вокальный трек: <span className="font-semibold">{track.title || 'Без названия'}</span>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Продвинутый режим</Label>
            <Switch checked={customMode} onCheckedChange={setCustomMode} />
          </div>

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
            <p className="text-xs text-muted-foreground mt-1">
              Опишите желаемые инструменты и стиль аранжировки
            </p>
          </div>

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

          {customMode && (
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
          )}

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <span className="flex items-center gap-2 text-sm">
                  <Settings2 className="w-4 h-4" />
                  Расширенные настройки
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Audio Weight */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Следование аудио</Label>
                  <span className="text-sm text-muted-foreground">{audioWeight.toFixed(2)}</span>
                </div>
                <Slider
                  value={[audioWeight]}
                  onValueChange={([v]) => setAudioWeight(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  Выше = инструментал точнее следует ритму и мелодии вокала
                </p>
              </div>

              {/* Style Weight */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Следование стилю</Label>
                  <span className="text-sm text-muted-foreground">{styleWeight.toFixed(2)}</span>
                </div>
                <Slider
                  value={[styleWeight]}
                  onValueChange={([v]) => setStyleWeight(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  Выше = инструментал точнее соответствует указанному стилю
                </p>
              </div>

              {/* Weirdness */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Креативность</Label>
                  <span className="text-sm text-muted-foreground">{weirdnessConstraint.toFixed(2)}</span>
                </div>
                <Slider
                  value={[weirdnessConstraint]}
                  onValueChange={([v]) => setWeirdnessConstraint(v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  Выше = более экспериментальный и неожиданный результат
                </p>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label>Модель</Label>
                <Select value={model} onValueChange={(v) => setModel(v as 'V4_5PLUS' | 'V5')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V4_5PLUS">V4.5 Plus (рекомендуется)</SelectItem>
                    <SelectItem value="V5">V5 (новейшая)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vocal Gender */}
              <div className="space-y-2">
                <Label>Пол вокала (если есть)</Label>
                <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as 'm' | 'f' | '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Не указано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не указано</SelectItem>
                    <SelectItem value="m">Мужской</SelectItem>
                    <SelectItem value="f">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !track.audio_url || !style.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Добавить инструментал'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
