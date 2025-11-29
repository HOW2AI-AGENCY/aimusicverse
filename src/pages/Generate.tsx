import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Generate() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');
  const [loading, setLoading] = useState(false);
  
  // Simple mode state
  const [description, setDescription] = useState('');
  
  // Custom mode state
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('');
  const [tags, setTags] = useState('');
  
  // Common state
  const [instrumental, setInstrumental] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleGenerate = async () => {
    const prompt = mode === 'simple' ? description : `${style} ${tags}`.trim();
    
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
          tags: mode === 'custom' ? tags : undefined,
          has_vocals: !instrumental,
        },
      });

      if (error) throw error;

      toast.success('Генерация началась!', {
        description: 'Ваш трек появится в библиотеке через несколько минут',
      });

      // Reset form
      setDescription('');
      setTitle('');
      setLyrics('');
      setStyle('');
      setTags('');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full glass-card border-primary/20">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Генератор музыки
            </h1>
            <p className="text-muted-foreground">Создайте уникальный трек с помощью AI</p>
          </div>
        </div>

        <Card className="glass-card border-primary/20 p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'custom')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="simple">Простой режим</TabsTrigger>
              <TabsTrigger value="custom">Профессиональный</TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4">
              <div>
                <Label htmlFor="description">Описание трека</Label>
                <Textarea
                  id="description"
                  placeholder="Опишите желаемый трек: жанр, настроение, инструменты..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div>
                <Label htmlFor="title">Название трека</Label>
                <Input
                  id="title"
                  placeholder="My Awesome Track"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="style">Стиль и жанр</Label>
                <Input
                  id="style"
                  placeholder="Synthwave, Electronic, Ambient..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="tags">Теги и настроение</Label>
                <Input
                  id="tags"
                  placeholder="dark, energetic, nostalgic..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-2"
                />
              </div>

              {!instrumental && (
                <div>
                  <Label htmlFor="lyrics">Текст песни (опционально)</Label>
                  <Textarea
                    id="lyrics"
                    placeholder="[Verse]&#10;Your lyrics here...&#10;&#10;[Chorus]&#10;More lyrics..."
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    rows={8}
                    className="mt-2 font-mono text-sm"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="instrumental"
                checked={instrumental}
                onCheckedChange={setInstrumental}
              />
              <Label htmlFor="instrumental" className="cursor-pointer">
                Инструментальная версия
              </Label>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Создать трек
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="glass-card border-primary/20 p-6">
          <h3 className="text-lg font-semibold mb-4">Советы по созданию</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Опишите желаемый жанр и настроение максимально подробно</li>
            <li>• Упомяните конкретные инструменты, если они важны</li>
            <li>• Укажите темп: медленный, средний или быстрый</li>
            <li>• В профессиональном режиме можно указать структуру: [Verse], [Chorus], [Bridge]</li>
            <li>• Генерация занимает 2-5 минут</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}