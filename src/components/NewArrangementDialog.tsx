import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Music, Mic2, Volume2, FileText, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { TrackStem } from '@/hooks/useTrackStems';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NewArrangementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  vocalStem?: TrackStem | null;
}

export const NewArrangementDialog = ({ open, onOpenChange, track, vocalStem }: NewArrangementDialogProps) => {
  const isMobile = useIsMobile();
  const [prompt, setPrompt] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(track.style || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTrackInfo, setShowTrackInfo] = useState(false);

  // Derive default values from track
  const defaultStyle = useMemo(() => track.style || 'pop, instrumental', [track.style]);
  const trackLyrics = useMemo(() => track.lyrics || '', [track.lyrics]);
  const hasLyrics = trackLyrics.trim().length > 0;

  // Reset on open and pre-fill with track data
  useEffect(() => {
    if (open) {
      // Pre-fill prompt with style context
      const styleHint = track.style ? `Аранжировка в стиле: ${track.style}` : '';
      setPrompt(styleHint);
      setStyle(defaultStyle);
      setTitle('');
      setCustomMode(false);
      setShowTrackInfo(false);
    }
  }, [open, track.style, defaultStyle]);

  const handleSubmit = async () => {
    if (!vocalStem?.audio_url) {
      toast.error('Вокальный стем не найден');
      return;
    }

    if (customMode && !prompt) {
      toast.error('Пожалуйста, добавьте описание');
      return;
    }

    setLoading(true);
    try {
      const effectiveTitle = customMode && title ? title : `${track.title || 'Трек'} (новая аранжировка)`;
      const effectiveStyle = customMode && style ? style : track.style || 'pop, instrumental';
      const effectivePrompt = prompt || 'Создать новую профессиональную аранжировку для этого вокала';
      
      const { data, error } = await supabase.functions.invoke('suno-add-instrumental', {
        body: {
          audioUrl: vocalStem.audio_url,
          prompt: effectivePrompt,
          customMode,
          style: effectiveStyle,
          title: effectiveTitle,
          negativeTags: 'acapella, vocals only, karaoke, low quality',
          projectId: track.project_id,
          originalTrackId: track.id,
          // Critical weights for following the vocal
          audioWeight: 0.8,
          styleWeight: 0.55,
          weirdnessConstraint: 0.25,
          model: 'V4_5PLUS',
        },
      });

      if (error) throw error;

      toast.success('Создание новой аранжировки началось! 🎸', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('New arrangement error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания аранжировки';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Mic2 className="w-4 h-4 text-primary" />
          <span>Используется вокал из:</span>
          <span className="font-semibold truncate">{track.title || 'Без названия'}</span>
        </div>
      </div>

      {/* Track info collapsible */}
      {(track.style || hasLyrics) && (
        <Collapsible open={showTrackInfo} onOpenChange={setShowTrackInfo}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Информация из трека
              </span>
              <span className="text-xs">{showTrackInfo ? 'Скрыть' : 'Показать'}</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {track.style && (
              <div className="p-2 bg-muted/30 rounded text-xs">
                <span className="font-medium">Стиль:</span> {track.style}
              </div>
            )}
            {hasLyrics && (
              <div className="p-2 bg-muted/30 rounded text-xs max-h-24 overflow-y-auto">
                <div className="flex items-center gap-1 font-medium mb-1">
                  <FileText className="w-3 h-3" />
                  Лирика (передаётся автоматически)
                </div>
                <pre className="whitespace-pre-wrap text-muted-foreground">{trackLyrics.slice(0, 200)}{trackLyrics.length > 200 ? '...' : ''}</pre>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <Label className="text-sm">Продвинутый режим</Label>
        <Switch checked={customMode} onCheckedChange={setCustomMode} />
      </div>

      <div>
        <Label className="text-sm font-medium">Описание аранжировки</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Рок аранжировка с электрогитарами и мощными барабанами"
          rows={3}
          className="mt-1.5 resize-none"
        />
      </div>

      {customMode && (
        <>
          <div>
            <Label className="text-sm font-medium">Стиль</Label>
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="rock, electric guitars, powerful drums"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Название (опционально)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой новый трек"
              className="mt-1.5"
            />
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !vocalStem?.audio_url}
        className="w-full h-11"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Создание...
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 mr-2" />
            Создать аранжировку
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Новая аранжировка
            </DrawerTitle>
            <DrawerDescription>
              Создать новый инструментал для существующего вокала
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Новая аранжировка
          </DialogTitle>
          <DialogDescription>
            Создать новый инструментал для существующего вокала
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
