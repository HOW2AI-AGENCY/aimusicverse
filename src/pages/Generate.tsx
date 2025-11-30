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
import { Music, Sparkles, Loader2, Zap, FileAudio, Disc, Brain, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UploadExtendDialog } from '@/components/UploadExtendDialog';
import { UploadCoverDialog } from '@/components/UploadCoverDialog';
import { savePromptToHistory } from '@/components/generate-form/PromptHistory';
import { LongPromptAssistant } from '@/components/suno/LongPromptAssistant';

export default function Generate() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'simple' | 'custom' | 'assistant'>('simple');
  const [loading, setLoading] = useState(false);
  const [boostLoading, setBoostLoading] = useState(false);
  const [uploadExtendOpen, setUploadExtendOpen] = useState(false);
  const [uploadCoverOpen, setUploadCoverOpen] = useState(false);
  const [generatingParts, setGeneratingParts] = useState<string[]>([]);
  
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

  const handleBoostStyle = async () => {
    const content = mode === 'simple' ? description : `${style} ${tags}`.trim();
    
    if (!content) {
      toast.error('Пожалуйста, заполните описание стиля');
      return;
    }

    setBoostLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-boost-style', {
        body: { content },
      });

      if (error) throw error;

      if (data?.boostedStyle) {
        if (mode === 'simple') {
          setDescription(data.boostedStyle);
        } else {
          setStyle(data.boostedStyle);
        }
        toast.success('Стиль улучшен! ✨', {
          description: 'Описание стиля было оптимизировано',
        });
      }
    } catch (error: any) {
      console.error('Boost error:', error);
      toast.error('Ошибка улучшения', {
        description: error.message || 'Попробуйте еще раз',
      });
    } finally {
      setBoostLoading(false);
    }
  };

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

      // Save to prompt history (skip for assistant mode)
      if (mode !== 'assistant') {
        savePromptToHistory({
          mode: mode as 'simple' | 'custom',
          description: mode === 'simple' ? description : undefined,
          title: mode === 'custom' ? title : undefined,
          style: mode === 'custom' ? style : undefined,
          lyrics: mode === 'custom' && !instrumental ? lyrics : undefined,
          model: 'V4_5ALL',
        });
      }

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

  const handleGenerateParts = async (parts: string[]) => {
    if (parts.length === 0) return;

    setGeneratingParts(parts);
    toast.success(`Начинаем генерацию ${parts.length} частей`, {
      description: 'Каждая часть будет обработана отдельно',
    });

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      toast.info(`Генерация части ${i + 1} из ${parts.length}`, {
        description: part.substring(0, 50) + '...',
      });

      try {
        const { error } = await supabase.functions.invoke('generate-lyrics', {
          body: {
            theme: part,
            style: '',
            mood: '',
          },
        });

        if (error) throw error;

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between requests
      } catch (error) {
        console.error(`Error generating part ${i + 1}:`, error);
        toast.error(`Ошибка генерации части ${i + 1}`, {
          description: error.message || 'Пропускаем эту часть',
        });
      }
    }

    setGeneratingParts([]);
    toast.success('Все части сгенерированы!', {
      description: 'Проверьте вашу библиотеку',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
            <div className="relative p-2.5 rounded-2xl glass-card border-primary/30">
              <Music className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              AI Music Generator
            </h1>
            <p className="text-xs text-muted-foreground">Создайте уникальный трек за минуты</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card border-primary/10 overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Mode Tabs - Compact */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'custom' | 'assistant')}>
              <TabsList className="grid w-full grid-cols-3 h-9 bg-secondary/50">
                <TabsTrigger value="simple" className="text-xs">Простой</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">Pro</TabsTrigger>
                <TabsTrigger value="assistant" className="text-xs gap-1">
                  <Brain className="w-3 h-3" />
                  AI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="simple" className="space-y-3 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="description" className="text-sm font-medium">Описание</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBoostStyle}
                      disabled={boostLoading || !description}
                      className="h-7 gap-1.5 px-2"
                    >
                      {boostLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      <span className="text-xs">Boost</span>
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Опишите стиль, жанр, настроение..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="resize-none text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Название</Label>
                    <Input
                      id="title"
                      placeholder="My Track"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags" className="text-sm font-medium">Теги</Label>
                    <Input
                      id="tags"
                      placeholder="dark, energetic..."
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="mt-1.5 h-9 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="style" className="text-sm font-medium">Стиль</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBoostStyle}
                      disabled={boostLoading || (!style && !tags)}
                      className="h-7 gap-1.5 px-2"
                    >
                      {boostLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      <span className="text-xs">Boost</span>
                    </Button>
                  </div>
                  <Input
                    id="style"
                    placeholder="Synthwave, Electronic..."
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {!instrumental && (
                  <div>
                    <Label htmlFor="lyrics" className="text-sm font-medium">Текст</Label>
                    <Textarea
                      id="lyrics"
                      placeholder="[Verse]&#10;Your lyrics...&#10;&#10;[Chorus]&#10;..."
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={6}
                      className="mt-1.5 resize-none font-mono text-xs"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assistant" className="mt-4">
                <LongPromptAssistant onGenerateParts={handleGenerateParts} />
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            {mode !== 'assistant' && (
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Switch
                    id="instrumental"
                    checked={instrumental}
                    onCheckedChange={setInstrumental}
                  />
                  <Label htmlFor="instrumental" className="text-xs cursor-pointer text-muted-foreground">
                    Инструментальная
                  </Label>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  size="sm"
                  className="gap-2 px-6 h-9"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-sm">Генерация...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">Создать</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setUploadExtendOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 h-10 border-primary/20"
          >
            <FileAudio className="w-4 h-4" />
            <span className="text-sm">Расширить аудио</span>
          </Button>
          <Button
            onClick={() => setUploadCoverOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 h-10 border-primary/20"
          >
            <Disc className="w-4 h-4" />
            <span className="text-sm">Создать кавер</span>
          </Button>
        </div>

        {/* Tips */}
        <Card className="glass-card border-primary/5 p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Советы
          </h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <li>• Укажите жанр, настроение и темп для лучших результатов</li>
            <li>• Используйте Boost для оптимизации описания стиля</li>
            <li>• В Pro-режиме доступна структура: [Verse], [Chorus], [Bridge]</li>
            <li>• Генерация занимает 2-5 минут</li>
          </ul>
        </Card>
      </div>

      <UploadExtendDialog 
        open={uploadExtendOpen}
        onOpenChange={setUploadExtendOpen}
      />
      <UploadCoverDialog 
        open={uploadCoverOpen}
        onOpenChange={setUploadCoverOpen}
      />
    </div>
  );
}
