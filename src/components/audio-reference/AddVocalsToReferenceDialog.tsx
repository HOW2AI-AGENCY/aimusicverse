/**
 * AddVocalsToReferenceDialog - Add vocals or instrumental to reference audio
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Music, Mic2, Guitar, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReferenceAudio {
  id: string;
  file_name: string;
  file_url: string;
  has_vocals?: boolean | null;
  has_instrumentals?: boolean | null;
  genre?: string | null;
  mood?: string | null;
  style_description?: string | null;
}

interface AddVocalsToReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audio: ReferenceAudio;
}

type Mode = 'add_vocals' | 'add_instrumental';

export function AddVocalsToReferenceDialog({ open, onOpenChange, audio }: AddVocalsToReferenceDialogProps) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<Mode>('add_vocals');
  const [prompt, setPrompt] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(audio.style_description || audio.genre || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine default mode based on audio type
  useEffect(() => {
    if (open) {
      // If has vocals but no instrumentals -> add instrumental
      // If has instrumentals but no vocals -> add vocals
      if (audio.has_vocals && !audio.has_instrumentals) {
        setMode('add_instrumental');
      } else if (audio.has_instrumentals && !audio.has_vocals) {
        setMode('add_vocals');
      } else {
        setMode('add_vocals'); // default
      }
      setPrompt('');
      setStyle(audio.style_description || audio.genre || '');
      setTitle('');
      setCustomMode(false);
    }
  }, [open, audio]);

  const handleSubmit = async () => {
    if (!audio.file_url) {
      toast.error('URL аудио не найден');
      return;
    }

    if (customMode && !prompt) {
      toast.error('Пожалуйста, добавьте описание');
      return;
    }

    setLoading(true);
    try {
      const effectiveTitle = customMode && title 
        ? title 
        : `${audio.file_name} (${mode === 'add_vocals' ? 'с вокалом' : 'новая аранжировка'})`;
      const effectiveStyle = customMode && style ? style : audio.style_description || audio.genre || 'pop';
      const effectivePrompt = prompt || (mode === 'add_vocals' 
        ? 'Добавить профессиональный вокал к этому инструменталу'
        : 'Создать новую профессиональную аранжировку для этого вокала');

      const functionName = mode === 'add_vocals' ? 'suno-add-vocals' : 'suno-add-instrumental';
      
      // Default negativeTags based on mode
      const defaultNegativeTags = mode === 'add_vocals' 
        ? 'instrumental only, no vocals, karaoke, low quality'
        : 'acapella, vocals only, karaoke, low quality';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          audioUrl: audio.file_url,
          prompt: effectivePrompt,
          customMode,
          style: effectiveStyle,
          title: effectiveTitle,
          negativeTags: defaultNegativeTags,
          referenceAudioId: audio.id,
        },
      });

      if (error) throw error;

      const successMessage = mode === 'add_vocals' 
        ? 'Добавление вокала началось! 🎤' 
        : 'Создание новой аранжировки началось! 🎸';

      toast.success(successMessage, {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Add vocals/instrumental error', { error });
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обработки';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Audio info */}
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span>Аудио:</span>
          <span className="font-semibold truncate">{audio.file_name}</span>
        </div>
        {(audio.has_vocals !== null || audio.has_instrumentals !== null) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>Тип:</span>
            <span>
              {audio.has_vocals && audio.has_instrumentals 
                ? '🎤 Вокал + 🎸 Инструментал' 
                : audio.has_vocals 
                  ? '🎤 Вокал' 
                  : '🎸 Инструментал'}
            </span>
          </div>
        )}
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add_vocals" className="gap-2">
            <Mic2 className="w-4 h-4" />
            Добавить вокал
          </TabsTrigger>
          <TabsTrigger value="add_instrumental" className="gap-2">
            <Guitar className="w-4 h-4" />
            Новая аранжировка
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Advanced mode toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <Label className="text-sm">Продвинутый режим</Label>
        <Switch checked={customMode} onCheckedChange={setCustomMode} />
      </div>

      {/* Prompt */}
      <div>
        <Label className="text-sm font-medium">
          {mode === 'add_vocals' 
            ? (customMode ? 'Текст песни / Описание' : 'Описание вокала') 
            : 'Описание аранжировки'}
        </Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'add_vocals'
              ? (customMode 
                  ? '[Verse]\nТекст первого куплета...\n\n[Chorus]\nТекст припева...'
                  : 'Энергичный рок вокал с мощным звучанием')
              : 'Рок аранжировка с электрогитарами и мощными барабанами'
          }
          rows={customMode ? 6 : 3}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* Custom mode fields */}
      {customMode && (
        <>
          <div>
            <Label className="text-sm font-medium">Название (опционально)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название нового трека"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Стиль</Label>
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="pop, rock, electronic..."
              className="mt-1.5"
            />
          </div>
        </>
      )}

      {/* Submit button */}
      <Button 
        onClick={handleSubmit} 
        disabled={loading} 
        className="w-full gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Обработка...
          </>
        ) : (
          <>
            {mode === 'add_vocals' ? <Mic2 className="w-4 h-4" /> : <Guitar className="w-4 h-4" />}
            {mode === 'add_vocals' ? 'Добавить вокал' : 'Создать аранжировку'}
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              {mode === 'add_vocals' ? 'Добавить вокал' : 'Новая аранжировка'}
            </DrawerTitle>
            <DrawerDescription>
              Создайте новый трек на основе загруженного аудио
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="p-4 max-h-[70vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            {mode === 'add_vocals' ? 'Добавить вокал' : 'Новая аранжировка'}
          </DialogTitle>
          <DialogDescription>
            Создайте новый трек на основе загруженного аудио
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
