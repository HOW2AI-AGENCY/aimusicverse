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
  Mic, MicOff, Wand2, AlertCircle, ArrowRight, Check, Loader2 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStemSeparation } from '@/hooks/useStemSeparation';
import { useTrackStems } from '@/hooks/useTrackStems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Track } from '@/types/track';

interface VocalReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  hasStems?: boolean;
  onComplete?: () => void;
}

type Step = 'intro' | 'separating' | 'configure' | 'generating';

export const VocalReplacementDialog = ({ 
  open, 
  onOpenChange, 
  track,
  hasStems: initialHasStems = false,
  onComplete,
}: VocalReplacementDialogProps) => {
  const isMobile = useIsMobile();
  const { separate, isSeparating } = useStemSeparation();
  const { data: stems, isLoading: stemsLoading, refetch: refetchStems } = useTrackStems(track.id);
  
  // Check if we have the instrumental stem
  const instrumentalStem = stems?.find(s => 
    s.stem_type.toLowerCase().includes('instrumental') || 
    s.stem_type.toLowerCase().includes('accompaniment') ||
    s.stem_type.toLowerCase().includes('no_vocals') ||
    s.stem_type.toLowerCase() === 'other'
  );
  const hasInstrumentalStem = !!instrumentalStem;
  
  const [step, setStep] = useState<Step>('intro');
  const [lyrics, setLyrics] = useState(track.lyrics || '');
  const [style, setStyle] = useState(track.style || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Update step when stems change
  useEffect(() => {
    if (open) {
      if (hasInstrumentalStem) {
        setStep('configure');
      } else {
        setStep('intro');
      }
    }
  }, [open, hasInstrumentalStem]);

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
        description: 'После завершения вы сможете заменить вокал'
      });
      onOpenChange(false);
    } catch {
      setStep('intro');
    }
  };

  const handleGenerateVocal = async () => {
    if (!lyrics.trim()) {
      toast.error('Введите текст песни');
      return;
    }

    if (!instrumentalStem?.audio_url) {
      toast.error('Не найден инструментальный стем', {
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

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 5, 90));
      }, 1000);

      // Call suno-add-vocals with the instrumental stem URL
      const { data, error } = await supabase.functions.invoke('suno-add-vocals', {
        body: {
          audioUrl: instrumentalStem.audio_url, // Key fix: pass stem URL
          prompt: lyrics,
          customMode: true,
          style,
          title: track.title ? `${track.title} (новый вокал)` : undefined,
          projectId: track.project_id,
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setGenerationProgress(100);
      toast.success('Генерация нового вокала запущена', {
        description: 'Процесс займёт 1-3 минуты'
      });
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error generating vocal', error);
      toast.error('Ошибка при генерации вокала', {
        description: error instanceof Error ? error.message : 'Попробуйте позже'
      });
      setStep('configure');
    } finally {
      setIsGenerating(false);
    }
  };

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
                  Для замены вокала необходимо сначала разделить трек на вокал и инструментал.
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
                  <p className="text-sm font-medium">Разделение на стемы</p>
                  <p className="text-xs text-muted-foreground">Извлечение вокала и инструментала</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Настройка нового вокала</p>
                  <p className="text-xs text-muted-foreground">Текст и стиль исполнения</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Генерация</p>
                  <p className="text-xs text-muted-foreground">Создание нового вокала</p>
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
                <MicOff className="w-4 h-4" />
              )}
              Разделить на стемы
            </Button>
          </div>
        );

      case 'separating':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <MicOff className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping" />
              </div>
              <div className="text-center">
                <p className="font-medium">Разделение на стемы...</p>
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
            {instrumentalStem && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">
                  Инструментальный стем готов
                </span>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="lyrics">Текст песни</Label>
              <Textarea
                id="lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Введите текст для нового вокала..."
                className="min-h-[200px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Используйте теги [Verse], [Chorus], [Bridge] для структуры
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="style">Стиль вокала</Label>
              <Textarea
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="Опишите желаемый стиль вокала..."
                className="min-h-[80px] resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {['Мужской голос', 'Женский голос', 'Эмоциональный', 'Мелодичный', 'Рэп'].map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setStyle(prev => prev ? `${prev}, ${tag}` : tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerateVocal} 
              className="w-full gap-2"
              disabled={!lyrics.trim() || isGenerating}
            >
              <Wand2 className="w-4 h-4" />
              Сгенерировать вокал
            </Button>
          </div>
        );

      case 'generating':
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">Генерация вокала...</p>
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
              <Mic className="w-5 h-5" />
              Замена вокала
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
            <Mic className="w-5 h-5" />
            Замена вокала
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
