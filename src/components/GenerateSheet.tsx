import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Zap, Sliders } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GenerateSheet = ({ open, onOpenChange }: GenerateSheetProps) => {
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  
  // Simple mode state
  const [description, setDescription] = useState('');
  
  // Custom mode state
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  
  // Common state
  const [instrumental, setInstrumental] = useState(false);

  const handleGenerate = async () => {
    const prompt = mode === 'simple' ? description : style;
    
    if (!prompt) {
      toast.error('Пожалуйста, заполните описание музыки');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-music', {
        body: {
          prompt,
          title: mode === 'custom' ? title : undefined,
          lyrics: mode === 'custom' && !instrumental ? lyrics : undefined,
          style: mode === 'custom' ? style : undefined,
          has_vocals: !instrumental,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась!', {
        description: 'Ваш трек появится в библиотеке через несколько минут',
      });

      // Reset form and close
      setDescription('');
      setTitle('');
      setLyrics('');
      setStyle('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            MusicVerse
          </SheetTitle>
          <p className="text-sm text-muted-foreground">AI Music Generator</p>
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

            <div className="mt-4">
              <p className="text-sm text-center text-muted-foreground mb-4">
                {mode === 'simple' ? 'Быстрая генерация одним нажатием' : 'Расширенные настройки для профессионалов'}
              </p>
            </div>

            <TabsContent value="simple" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="description" className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Опишите вашу музыку
                </Label>
                <Textarea
                  id="description"
                  placeholder="pop"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="mt-2 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Опишите стиль, настроение, инструменты или атмосферу, которую вы хотите
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="instrumental-simple" className="cursor-pointer font-medium">
                    Инструментал
                  </Label>
                </div>
                <Switch
                  id="instrumental-simple"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Название (опционально)</Label>
                <Input
                  id="title"
                  placeholder="Автоматически, если пусто"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="style" className="text-base flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Описание стиля
                </Label>
                <Textarea
                  id="style"
                  placeholder="Опишите стиль, жанр, настроение... например, энергичная электроника с синт-лидами, 128 BPM"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={4}
                  className="mt-2 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="instrumental-custom" className="cursor-pointer font-medium">
                    С вокалом
                  </Label>
                </div>
                <Switch
                  id="instrumental-custom"
                  checked={!instrumental}
                  onCheckedChange={(checked) => setInstrumental(!checked)}
                />
              </div>

              {!instrumental && (
                <div>
                  <Label htmlFor="lyrics" className="text-base">
                    Лирика
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Используйте [VERSE], [CHORUS] и т.д. для структуры.
                    Добавляйте (guitar), (emotion: sad) для тегов.
                  </p>
                  <Textarea
                    id="lyrics"
                    placeholder="[VERSE]&#10;Потерянный в ритме ночи&#10;Танцуя под неоновым светом (synth)&#10;(energy: high)&#10;&#10;[CHORUS]&#10;Мы живы, мы свободны (vocal: powerful)&#10;Это то место, где мы должны быть"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={10}
                    className="mt-2 font-mono text-sm resize-none"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

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
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Использует 1 кредит с вашего баланса
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
