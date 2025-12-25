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
import { Loader2, Mic2, ChevronDown, Settings2, Sparkles, FileText, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { logger } from '@/lib/logger';
import { AILyricsAssistantDialog } from '@/components/generate-form/AILyricsAssistantDialog';
import { SavedLyricsSelector } from '@/components/generate-form/SavedLyricsSelector';
import { VoiceInputButton } from '@/components/ui/voice-input-button';

interface AddVocalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddVocalsDialog = ({ open, onOpenChange, track }: AddVocalsDialogProps) => {
  const [customMode, setCustomMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(track.style || 'pop, vocals, professional singing');
  const [title, setTitle] = useState('');
  const [negativeTags, setNegativeTags] = useState('instrumental only, low quality, distorted');
  const [loading, setLoading] = useState(false);
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioWeight, setAudioWeight] = useState(0.7);
  const [styleWeight, setStyleWeight] = useState(0.6);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.3);
  const [model, setModel] = useState<'V4_5PLUS' | 'V5'>('V4_5PLUS');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');

  // AI Assistant and Templates
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error('У трека отсутствует аудио файл');
      return;
    }

    const effectivePrompt = prompt.trim() || 'Добавить профессиональный вокал к этому инструменталу';
    
    if (customMode && !prompt.trim()) {
      toast.error('Добавьте текст песни или описание вокала');
      return;
    }

    setLoading(true);
    try {
      const effectiveTitle = title.trim() || track.title || 'Трек с вокалом';
      const effectiveStyle = style.trim() || 'pop, vocals';
      
      const body: Record<string, unknown> = {
        audioUrl: track.audio_url,
        prompt: effectivePrompt,
        customMode,
        style: effectiveStyle,
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

      const { data, error } = await supabase.functions.invoke('suno-add-vocals', { body });

      if (error) throw error;

      toast.success('Добавление вокала началось! 🎤', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Add vocals error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления вокала';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAILyricsGenerated = (lyrics: string) => {
    setPrompt(lyrics);
    setCustomMode(true);
    toast.success('Текст добавлен');
  };

  const handleTemplateSelect = (template: { lyrics: string; style?: string | null; genre?: string | null }) => {
    setPrompt(template.lyrics);
    if (template.style) {
      setStyle(template.style);
    }
    setCustomMode(true);
    toast.success('Шаблон применён');
  };

  const handleVoiceInput = (text: string) => {
    setPrompt(prev => prev ? `${prev}\n${text}` : text);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic2 className="w-5 h-5" />
              Добавить вокал
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <Mic2 className="w-4 h-4 inline mr-2" />
                Будет использован инструментальный трек: <span className="font-semibold">{track.title || 'Без названия'}</span>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Продвинутый режим (с текстом)</Label>
              <Switch checked={customMode} onCheckedChange={setCustomMode} />
            </div>

            {/* AI Tools Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAIAssistant(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Помощник
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowTemplates(true)}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Из шаблонов
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="prompt">
                  {customMode ? 'Текст песни *' : 'Описание вокала'}
                </Label>
                <VoiceInputButton 
                  onResult={handleVoiceInput}
                  context="lyrics"
                />
              </div>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  customMode
                    ? '[Verse]\nТекст первого куплета...\n\n[Chorus]\nТекст припева...'
                    : 'Энергичный рок вокал с мощным звучанием'
                }
                rows={customMode ? 10 : 4}
                className="mt-2 resize-none"
              />
              {customMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Используйте теги [Verse], [Chorus], [Bridge] для структуры песни
                </p>
              )}
            </div>

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

            {customMode && (
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
                    Выше = вокал точнее следует ритму и мелодии инструментала
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
                    Выше = вокал точнее соответствует указанному стилю
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
                  <Label>Пол вокала</Label>
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
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !track.audio_url || (customMode && !prompt.trim())}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  'Добавить вокал'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Lyrics Assistant Dialog */}
      <AILyricsAssistantDialog
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        onLyricsGenerated={handleAILyricsGenerated}
        existingLyrics={prompt}
      />

      {/* Saved Lyrics Selector */}
      <SavedLyricsSelector
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelect={handleTemplateSelect}
      />
    </>
  );
};
