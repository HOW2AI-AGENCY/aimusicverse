import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2, Zap, Sliders, Coins, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId }: GenerateSheetProps) => {
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Simple mode state
  const [description, setDescription] = useState('');
  
  // Custom mode state
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  
  // Advanced settings
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState('V4_5ALL');
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  const [styleWeight, setStyleWeight] = useState([0.65]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([0.5]);

  // Fetch credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data } = await supabase.functions.invoke('suno-credits');
        if (data?.credits !== undefined) {
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    };

    if (open) {
      fetchCredits();
    }
  }, [open]);

  const handleGenerate = async () => {
    const prompt = mode === 'simple' ? description : (instrumental ? '' : lyrics);
    
    if (mode === 'simple' && !description) {
      toast.error('Пожалуйста, опишите музыку');
      return;
    }

    if (mode === 'custom' && !style) {
      toast.error('Пожалуйста, укажите стиль музыки');
      return;
    }

    if (mode === 'custom' && !instrumental && !lyrics) {
      toast.error('Пожалуйста, добавьте лирику или включите режим инструментала');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-music-generate', {
        body: {
          mode,
          prompt: mode === 'simple' ? description : prompt,
          title: mode === 'custom' ? title : undefined,
          style: mode === 'custom' ? style : undefined,
          instrumental,
          model,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender || undefined,
          styleWeight: styleWeight[0],
          weirdnessConstraint: weirdnessConstraint[0],
          projectId,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась! 🎵', {
        description: 'Ваш трек появится в библиотеке через 1-3 минуты',
      });

      // Reset form and close
      setDescription('');
      setTitle('');
      setLyrics('');
      setStyle('');
      setNegativeTags('');
      setVocalGender('');
      setStyleWeight([0.65]);
      setWeirdnessConstraint([0.5]);
      onOpenChange(false);
      
      // Refresh credits
      const { data: creditsData } = await supabase.functions.invoke('suno-credits');
      if (creditsData?.credits !== undefined) {
        setCredits(creditsData.credits);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      
      if (error.message?.includes('429') || error.message?.includes('credits')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI для продолжения',
        });
      } else {
        toast.error('Ошибка генерации', {
          description: error.message || 'Попробуйте еще раз',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const modelInfo = {
    V5: { name: 'V5', desc: 'Новейшая модель, быстрая генерация', emoji: '🚀' },
    V4_5PLUS: { name: 'V4.5+', desc: 'Богатый звук, до 8 мин', emoji: '💎' },
    V4_5ALL: { name: 'V4.5 All', desc: 'Лучшая структура, до 8 мин', emoji: '🎯' },
    V4_5: { name: 'V4.5', desc: 'Быстро, качественно, до 8 мин', emoji: '⚡' },
    V4: { name: 'V4', desc: 'Классика, до 4 мин', emoji: '🎵' },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                MusicVerse AI
              </SheetTitle>
              <p className="text-sm text-muted-foreground">Генератор музыки SunoAPI</p>
            </div>
            
            {credits !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-primary/20">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{credits}</span>
                <span className="text-xs text-muted-foreground">кредитов</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" className="gap-2">
                <Zap className="w-4 h-4" />
                Простой
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Sliders className="w-4 h-4" />
                Продвинутый
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="description" className="text-base flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" />
                  Опишите вашу музыку
                </Label>
                <Textarea
                  id="description"
                  placeholder="Энергичный электронный трек с мощным басом и синтезаторами"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Опишите стиль, настроение, инструменты. AI автоматически создаст лирику и структуру.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Название трека (опционально)</Label>
                <Input
                  id="title"
                  placeholder="Моя композиция"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="style" className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Стиль музыки *
                </Label>
                <Textarea
                  id="style"
                  placeholder="Электронная музыка с элементами транса, 128 BPM, синт-лиды"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={3}
                  className="mt-2 resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="instrumental-custom" className="cursor-pointer font-medium">
                    Инструментал (без вокала)
                  </Label>
                </div>
                <Switch
                  id="instrumental-custom"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
              </div>

              {!instrumental && (
                <div>
                  <Label htmlFor="lyrics" className="text-base">
                    Лирика *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Используйте [Verse], [Chorus], [Bridge] для структуры
                  </p>
                  <Textarea
                    id="lyrics"
                    placeholder="[Verse]&#10;В ритме ночи, мы танцуем&#10;Под неоновым светом&#10;&#10;[Chorus]&#10;Это наша свобода&#10;Здесь и сейчас"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={10}
                    className="mt-2 font-mono text-sm resize-none"
                    maxLength={5000}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border-t pt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-semibold hover:bg-transparent">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Расширенные настройки
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">

            {/* Model Selection */}
            <div>
              <Label htmlFor="model">Модель AI</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{info.emoji}</span>
                        <div>
                          <div className="font-medium">{info.name}</div>
                          <div className="text-xs text-muted-foreground">{info.desc}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vocal Gender */}
            {!instrumental && (
              <div>
                <Label htmlFor="vocal-gender">Пол вокала (опционально)</Label>
                <Select value={vocalGender || "auto"} onValueChange={(v) => setVocalGender(v === "auto" ? '' : v as 'm' | 'f')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Автоматически" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Автоматически</SelectItem>
                    <SelectItem value="m">Мужской</SelectItem>
                    <SelectItem value="f">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Style Weight */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Вес стиля</Label>
                <Badge variant="outline">{styleWeight[0].toFixed(2)}</Badge>
              </div>
              <Slider
                value={styleWeight}
                onValueChange={setStyleWeight}
                min={0}
                max={1}
                step={0.01}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Насколько точно следовать стилю
              </p>
            </div>

            {/* Creativity */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Креативность</Label>
                <Badge variant="outline">{weirdnessConstraint[0].toFixed(2)}</Badge>
              </div>
              <Slider
                value={weirdnessConstraint}
                onValueChange={setWeirdnessConstraint}
                min={0}
                max={1}
                step={0.01}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Уровень экспериментальности и уникальности
              </p>
            </div>

            {/* Negative Tags */}
            <div>
              <Label htmlFor="negative-tags">Исключить (negative tags)</Label>
              <Input
                id="negative-tags"
                placeholder="heavy metal, screaming, aggressive"
                value={negativeTags}
                onChange={(e) => setNegativeTags(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Стили и элементы, которые нужно избежать
              </p>
            </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
            className="w-full h-14 text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Создать трек
                <Badge variant="secondary" className="ml-2">1 кредит</Badge>
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Генерация обычно занимает 1-3 минуты
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};