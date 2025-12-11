import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Music, Music2, Wand2, AlertCircle, ArrowRight, Check, Loader2 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { useTrackStems } from '@/hooks/useTrackStems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Track } from '@/types/track';

interface ArrangementReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  hasStems?: boolean;
  onComplete?: () => void;
}

type Step = 'intro' | 'separating' | 'configure' | 'generating';

export const ArrangementReplacementDialog = ({ 
  open, 
  onOpenChange, 
  track,
  hasStems: initialHasStems = false,
  onComplete,
}: ArrangementReplacementDialogProps) => {
  const isMobile = useIsMobile();
  const { separate, isSeparating } = useStemSeparation();
  const { data: stems, isLoading: stemsLoading, refetch: refetchStems } = useTrackStems(track.id);
  
  // Check if we have the vocal stem
  const vocalStem = stems?.find(s => 
    s.stem_type.toLowerCase().includes('vocal') || 
    s.stem_type.toLowerCase().includes('voice')
  );
  const hasVocalStem = !!vocalStem;
  
  const [step, setStep] = useState<Step>('intro');
  const [style, setStyle] = useState(track.style || '');
  const [tags, setTags] = useState(track.tags || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Update step when stems change
  useEffect(() => {
    if (open) {
      if (hasVocalStem) {
        setStep('configure');
      } else {
        setStep('intro');
      }
    }
  }, [open, hasVocalStem]);

  // Refetch stems when dialog opens
  useEffect(() => {
    if (open) {
      refetchStems();
    }
  }, [open, refetchStems]);

  const handleSeparateFirst = async () => {
    setStep('separating');
    try {
      await separate(track, 'simple');
      toast.success('Разделение запущено', {
        description: 'После завершения вы сможете заменить аранжировку'
      });
      onOpenChange(false);
    } catch {
      setStep('intro');
    }
  };

  const handleGenerateArrangement = async () => {
    if (!style.trim() && !tags.trim()) {
      toast.error('Введите стиль или теги');
      return;
    }

    if (!vocalStem?.audio_url) {
      toast.error('Не найден вокальный стем', {
        description: 'Сначала разделите трек на стемы'
      });
      setStep('intro');
      return;
    }

    setStep('generating');
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }, 1000);

      // Call suno-add-instrumental with the vocal stem URL
      const { data, error } = await supabase.functions.invoke('suno-add-instrumental', {
        body: {
          audioUrl: vocalStem.audio_url, // Key fix: pass vocal stem URL
          prompt: tags,
          customMode: true,
          style,
          title: track.title ? `${track.title} (новая аранжировка)` : undefined,
          projectId: track.project_id,
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setGenerationProgress(100);
      toast.success('Генерация аранжировки запущена', {
        description: 'Процесс займёт 1-3 минуты'
      });
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error generating arrangement', error);
      toast.error('Ошибка при генерации аранжировки', {
        description: error instanceof Error ? error.message : 'Попробуйте позже'
      });
      setStep('configure');
    } finally {
      setIsGenerating(false);
    }
  };

  const genreTags = [
    'Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 
    'Hip-Hop', 'R&B', 'Folk', 'Ambient', 'Synthwave'
  ];

  const moodTags = [
    'Энергичный', 'Меланхоличный', 'Эпичный', 
    'Минималистичный', 'Агрессивный', 'Романтичный'
  ];

  const renderStep = () => {
    if (stemsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (step) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Требуется разделение на стемы</p>
                <p className="text-muted-foreground mt-1">
                  Для замены аранжировки необходимо сначала извлечь вокал из трека.
                  Это займёт 1-3 минуты.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Извлечение вокала</p>
                  <p className="text-xs text-muted-foreground">Сохранение оригинального вокала</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Настройка стиля</p>
                  <p className="text-xs text-muted-foreground">Жанр и атмосфера новой аранжировки</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Генерация</p>
                  <p className="text-xs text-muted-foreground">Создание новой аранжировки</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSeparateFirst} 
              className="w-full gap-2"
              disabled={isSeparating}
            >
              {isSeparating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Music2 className="w-4 h-4" />
              )}
              Извлечь вокал
            </Button>
          </div>
        );

      case 'separating':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music2 className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
              </div>
              <div className="text-center">
                <p className="font-medium">Извлечение вокала...</p>
                <p className="text-sm text-muted-foreground">
                  Процесс займёт 1-3 минуты
                </p>
              </div>
            </div>
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            {vocalStem && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">
                  Вокальный стем готов
                </span>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="style">Стиль аранжировки</Label>
              <Textarea
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Опишите желаемый стиль аранжировки..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label>Жанр</Label>
              <div className="flex flex-wrap gap-2">
                {genreTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      if (tags.includes(tag)) {
                        setTags(tags.replace(tag, '').replace(/, ,/g, ',').trim());
                      } else {
                        setTags(tags ? `${tags}, ${tag}` : tag);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Настроение</Label>
              <div className="flex flex-wrap gap-2">
                {moodTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      if (tags.includes(tag)) {
                        setTags(tags.replace(tag, '').replace(/, ,/g, ',').trim());
                      } else {
                        setTags(tags ? `${tags}, ${tag}` : tag);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="tags">Теги</Label>
              <Textarea
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Дополнительные теги через запятую..."
                className="min-h-[60px] resize-none"
              />
            </div>

            <Button 
              onClick={handleGenerateArrangement} 
              className="w-full gap-2"
              disabled={(!style.trim() && !tags.trim()) || isGenerating}
            >
              <Wand2 className="w-4 h-4" />
              Сгенерировать аранжировку
            </Button>
          </div>
        );

      case 'generating':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">Генерация аранжировки...</p>
                <p className="text-sm text-muted-foreground">
                  Это займёт 1-3 минуты
                </p>
              </div>
            </div>
            
            <Progress value={generationProgress} className="w-full" />
            
            <div className="text-center text-sm text-muted-foreground">
              {generationProgress}% завершено
            </div>
          </div>
        );
    }
  };

  const content = renderStep();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Замена аранжировки
            </DrawerTitle>
            <DrawerDescription>
              {track.title || 'Трек'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Замена аранжировки
          </DialogTitle>
          <DialogDescription>
            {track.title || 'Трек'}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
