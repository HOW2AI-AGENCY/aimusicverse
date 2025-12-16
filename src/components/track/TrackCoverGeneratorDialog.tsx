import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrackCoverGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title?: string | null;
    style?: string | null;
    lyrics?: string | null;
    cover_url?: string | null;
  };
  onGenerated?: () => void;
}

export function TrackCoverGeneratorDialog({
  open,
  onOpenChange,
  track,
  onGenerated,
}: TrackCoverGeneratorDialogProps) {
  const defaultPrompt = `Обложка для трека "${track.title || 'Untitled'}"${track.style ? `. Стиль: ${track.style}` : ''}. Современный дизайн, абстрактное искусство, визуализация музыки.`;
  
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('generate-track-cover', {
        body: {
          trackId: track.id,
          title: track.title,
          style: track.style,
          lyrics: track.lyrics,
          userId: user.id,
          customPrompt: prompt,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Ошибка генерации');

      toast.success('Обложка сгенерирована! 🎨');
      onGenerated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Cover generation error:', error);
      toast.error(error.message || 'Ошибка генерации обложки');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Генератор обложки
          </DialogTitle>
          <DialogDescription>
            Настройте промпт для генерации уникальной обложки трека
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current cover preview */}
          {track.cover_url && (
            <div className="space-y-2">
              <Label>Текущая обложка</Label>
              <div className="aspect-square w-32 mx-auto rounded-lg overflow-hidden border">
                <img
                  src={track.cover_url}
                  alt="Current cover"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Prompt input */}
          <div className="space-y-2">
            <Label>Промпт для генерации</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите желаемую обложку..."
              rows={4}
              className="resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Совет: добавьте детали о цветах, стиле, настроении
            </p>
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <Label className="text-xs">Быстрые стили:</Label>
            <div className="flex flex-wrap gap-2">
              {[
                'Минимализм',
                'Неон',
                'Ретро',
                'Космос',
                'Природа',
                'Абстракция',
              ].map((style) => (
                <Button
                  key={style}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setPrompt((prev) => `${prev} Стиль: ${style.toLowerCase()}.`)}
                  disabled={isGenerating}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPrompt(defaultPrompt)}
              disabled={isGenerating}
              className="flex-1"
            >
              Сбросить
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Сгенерировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
