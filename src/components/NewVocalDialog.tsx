import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mic, Music, FileText, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { TrackStem } from '@/hooks/useTrackStems';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NewVocalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  instrumentalStem?: TrackStem | null;
}

export const NewVocalDialog = ({ open, onOpenChange, track, instrumentalStem }: NewVocalDialogProps) => {
  const isMobile = useIsMobile();
  const [prompt, setPrompt] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(track.style || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTrackInfo, setShowTrackInfo] = useState(false);
  const [useLyrics, setUseLyrics] = useState(true);

  // Derive default values from track
  const defaultStyle = useMemo(() => track.style || 'pop, vocals', [track.style]);
  const trackLyrics = useMemo(() => track.lyrics || '', [track.lyrics]);
  const hasLyrics = trackLyrics.trim().length > 0;

  // Reset on open and pre-fill with track data
  useEffect(() => {
    if (open) {
      // If track has lyrics, pre-fill the prompt with them
      if (hasLyrics && useLyrics) {
        setPrompt(trackLyrics);
      } else {
        setPrompt('');
      }
      setStyle(defaultStyle);
      setTitle('');
      setCustomMode(hasLyrics); // Enable custom mode if we have lyrics
      setShowTrackInfo(false);
      setUseLyrics(true);
    }
  }, [open, hasLyrics, trackLyrics, defaultStyle]);

  const handleSubmit = async () => {
    if (!instrumentalStem?.audio_url) {
      toast.error('Инструментальный стем не найден');
      return;
    }

    if (customMode && !prompt) {
      toast.error('Пожалуйста, добавьте текст песни');
      return;
    }

    setLoading(true);
    try {
      const effectiveTitle = customMode && title ? title : `${track.title || 'Трек'} (новый вокал)`;
      const effectiveStyle = customMode && style ? style : track.style || 'pop, vocals';
      const effectivePrompt = prompt || 'Добавить профессиональный вокал к этому инструменталу';
      
      const { data, error } = await supabase.functions.invoke('suno-add-vocals', {
        body: {
          audioUrl: instrumentalStem.audio_url,
          prompt: effectivePrompt,
          customMode,
          style: effectiveStyle,
          title: effectiveTitle,
          negativeTags: '',
          projectId: track.project_id,
        },
      });

      if (error) throw error;

      toast.success('Создание нового вокала началось! 🎤', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('New vocal error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания вокала';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span>Используется инструментал из:</span>
          <span className="font-semibold truncate">{track.title || 'Без названия'}</span>
        </div>
      </div>

      {/* Track info & lyrics toggle */}
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
              <div className="p-2 bg-muted/30 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-medium">
                    <FileText className="w-3 h-3" />
                    Лирика из трека
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      if (!useLyrics) {
                        setPrompt(trackLyrics);
                        setUseLyrics(true);
                      } else {
                        setPrompt('');
                        setUseLyrics(false);
                      }
                    }}
                  >
                    {useLyrics ? 'Очистить' : 'Использовать'}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-muted-foreground max-h-20 overflow-y-auto">
                  {trackLyrics.slice(0, 300)}{trackLyrics.length > 300 ? '...' : ''}
                </pre>
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
        <Label className="text-sm font-medium">
          {customMode ? 'Текст песни' : 'Описание вокала'}
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            customMode
              ? '[Verse]\nТекст первого куплета...\n\n[Chorus]\nТекст припева...'
              : 'Энергичный рок вокал с мощным звучанием'
          }
          rows={customMode ? 6 : 3}
          className="mt-1.5 resize-none"
        />
      </div>

      {customMode && (
        <>
          <div>
            <Label className="text-sm font-medium">Стиль вокала</Label>
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="rock, powerful vocals, energetic"
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
        disabled={loading || !instrumentalStem?.audio_url}
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
            <Mic className="w-4 h-4 mr-2" />
            Создать вокал
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
              <Mic className="w-5 h-5 text-primary" />
              Новый вокал
            </DrawerTitle>
            <DrawerDescription>
              Создать новый вокал для существующего инструментала
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
            <Mic className="w-5 h-5 text-primary" />
            Новый вокал
          </DialogTitle>
          <DialogDescription>
            Создать новый вокал для существующего инструментала
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
