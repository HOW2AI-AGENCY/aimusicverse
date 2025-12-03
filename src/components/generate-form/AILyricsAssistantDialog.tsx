import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Wand2, Tags, LayoutList, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AILyricsAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLyricsGenerated: (lyrics: string) => void;
  existingLyrics?: string;
}

const GENRES = [
  { value: 'pop', label: 'Поп' },
  { value: 'rock', label: 'Рок' },
  { value: 'hip-hop', label: 'Хип-хоп' },
  { value: 'electronic', label: 'Электроника' },
  { value: 'r&b', label: 'R&B' },
  { value: 'jazz', label: 'Джаз' },
  { value: 'folk', label: 'Фолк' },
  { value: 'ballad', label: 'Баллада' },
];

const MOODS = [
  { value: 'happy', label: 'Весёлое' },
  { value: 'sad', label: 'Грустное' },
  { value: 'energetic', label: 'Энергичное' },
  { value: 'romantic', label: 'Романтичное' },
  { value: 'melancholic', label: 'Меланхоличное' },
  { value: 'aggressive', label: 'Агрессивное' },
  { value: 'peaceful', label: 'Спокойное' },
  { value: 'inspiring', label: 'Вдохновляющее' },
];

const STRUCTURES = [
  { value: 'standard', label: 'Стандартная (Verse-Chorus-Verse-Chorus-Bridge-Chorus)' },
  { value: 'simple', label: 'Простая (Verse-Chorus-Verse-Chorus)' },
  { value: 'extended', label: 'Расширенная (Intro-Verse-Pre-Chorus-Chorus-Verse-Chorus-Bridge-Outro)' },
  { value: 'hip-hop', label: 'Хип-хоп (Intro-Verse-Hook-Verse-Hook-Bridge-Hook)' },
];

export const AILyricsAssistantDialog = ({
  open,
  onOpenChange,
  onLyricsGenerated,
  existingLyrics = '',
}: AILyricsAssistantDialogProps) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'improve' | 'tags'>('generate');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate tab state
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('inspiring');
  const [structure, setStructure] = useState('standard');
  const [language, setLanguage] = useState('ru');
  
  // Result state
  const [generatedLyrics, setGeneratedLyrics] = useState('');

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error('Укажите тему песни');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'generate',
          theme,
          genre,
          mood,
          structure,
          language,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        toast.success('Текст сгенерирован!');
      }
    } catch (error: any) {
      console.error('Generate lyrics error:', error);
      toast.error(error.message || 'Ошибка генерации');
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    const textToImprove = generatedLyrics || existingLyrics;
    if (!textToImprove.trim()) {
      toast.error('Нет текста для улучшения');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'improve',
          existingLyrics: textToImprove,
          language,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        toast.success('Текст улучшен!');
      }
    } catch (error: any) {
      console.error('Improve lyrics error:', error);
      toast.error(error.message || 'Ошибка улучшения');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTags = async () => {
    const textToTag = generatedLyrics || existingLyrics;
    if (!textToTag.trim()) {
      toast.error('Нет текста для разметки');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lyrics-assistant', {
        body: {
          action: 'add_tags',
          existingLyrics: textToTag,
        },
      });

      if (error) throw error;

      if (data?.lyrics) {
        setGeneratedLyrics(data.lyrics);
        toast.success('Теги добавлены!');
      }
    } catch (error: any) {
      console.error('Add tags error:', error);
      toast.error(error.message || 'Ошибка добавления тегов');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedLyrics) {
      await navigator.clipboard.writeText(generatedLyrics);
      setCopied(true);
      toast.success('Скопировано!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (generatedLyrics) {
      onLyricsGenerated(generatedLyrics);
      onOpenChange(false);
      toast.success('Текст применён!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Ассистент лирики
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="gap-1.5">
              <Wand2 className="w-4 h-4" />
              Создать
            </TabsTrigger>
            <TabsTrigger value="improve" className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              Улучшить
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-1.5">
              <Tags className="w-4 h-4" />
              Теги
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="generate" className="space-y-4 mt-0">
              <div>
                <Label>Тема песни *</Label>
                <Input
                  placeholder="О чём будет песня? Например: первая любовь, мечты о путешествиях..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Жанр</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Настроение</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Структура</Label>
                  <Select value={structure} onValueChange={setStructure}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Язык</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Сгенерировать текст
              </Button>
            </TabsContent>

            <TabsContent value="improve" className="space-y-4 mt-0">
              <p className="text-sm text-muted-foreground">
                AI улучшит ваш текст, сделает его более поэтичным и подходящим для пения, сохраняя общий смысл.
              </p>
              
              {(existingLyrics || generatedLyrics) ? (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Текст для улучшения:</p>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {(generatedLyrics || existingLyrics).slice(0, 200)}...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Сначала сгенерируйте или введите текст
                </p>
              )}

              <Button 
                onClick={handleImprove} 
                disabled={loading || (!existingLyrics && !generatedLyrics)} 
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Улучшить текст
              </Button>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4 mt-0">
              <p className="text-sm text-muted-foreground">
                AI автоматически добавит структурные теги Suno ([Verse], [Chorus], [Bridge] и др.) к вашему тексту.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">[Intro]</Badge>
                <Badge variant="outline">[Verse]</Badge>
                <Badge variant="outline">[Pre-Chorus]</Badge>
                <Badge variant="outline">[Chorus]</Badge>
                <Badge variant="outline">[Bridge]</Badge>
                <Badge variant="outline">[Outro]</Badge>
              </div>

              <Button 
                onClick={handleAddTags} 
                disabled={loading || (!existingLyrics && !generatedLyrics)} 
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Tags className="w-4 h-4 mr-2" />}
                Добавить теги
              </Button>
            </TabsContent>

            {/* Result Preview */}
            {generatedLyrics && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Результат</Label>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Textarea
                  value={generatedLyrics}
                  onChange={(e) => setGeneratedLyrics(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleApply} disabled={!generatedLyrics}>
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};