import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Track } from '@/hooks/useTracksOptimized';

interface AddVocalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddVocalsDialog = ({ open, onOpenChange, track }: AddVocalsDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(track.style || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!track.audio_url) {
      toast.error('У трека отсутствует аудио файл');
      return;
    }

    if (customMode && !prompt) {
      toast.error('Пожалуйста, добавьте текст песни');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-add-vocals', {
        body: {
          audioUrl: track.audio_url,
          prompt,
          customMode,
          style: customMode ? style : undefined,
          title: customMode ? title : track.title,
          projectId: track.project_id,
        },
      });

      if (error) throw error;

      toast.success('Добавление вокала началось! 🎤', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Add vocals error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка добавления вокала';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Добавить вокал
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <Music className="w-4 h-4 inline mr-2" />
              Будет использован инструментальный трек: <span className="font-semibold">{track.title || 'Без названия'}</span>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Продвинутый режим</Label>
            <Switch checked={customMode} onCheckedChange={setCustomMode} />
          </div>

          <div>
            <Label htmlFor="prompt">
              {customMode ? 'Текст песни' : 'Описание вокала'}
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                customMode
                  ? '[Verse]\nТекст первого куплета...\n\n[Chorus]\nТекст припева...'
                  : 'Энергичный рок вокал с мощным звучанием'
              }
              rows={6}
              className="mt-2 resize-none"
            />
          </div>

          {customMode && (
            <>
              <div>
                <Label htmlFor="style">Стиль вокала</Label>
                <Input
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="rock, powerful vocals, energetic"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="title">Название трека (опционально)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Мой новый трек"
                  className="mt-2"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !track.audio_url}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Добавить вокал'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
