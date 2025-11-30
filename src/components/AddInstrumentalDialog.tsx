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

interface AddInstrumentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export const AddInstrumentalDialog = ({ open, onOpenChange, track }: AddInstrumentalDialogProps) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [style, setStyle] = useState(track.style || '');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Пожалуйста, выберите аудио файл');
        return;
      }
      setAudioFile(file);
      toast.success('Файл загружен');
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('Пожалуйста, выберите аудио файл');
      return;
    }

    if (customMode && !prompt) {
      toast.error('Пожалуйста, добавьте описание');
      return;
    }

    setLoading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(audioFile);
      });

      const { data, error } = await supabase.functions.invoke('suno-add-instrumental', {
        body: {
          audioFile: {
            name: audioFile.name,
            type: audioFile.type,
            data: fileData,
          },
          prompt,
          customMode,
          style: customMode ? style : undefined,
          title: customMode ? title : undefined,
          projectId: track.project_id,
        },
      });

      if (error) throw error;

      toast.success('Добавление инструментала началось! 🎸', {
        description: 'Новый трек появится в библиотеке через 1-3 минуты',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Add instrumental error:', error);
      toast.error(error.message || 'Ошибка добавления инструментала');
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
            Добавить инструментал
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Загрузить вокальный трек</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {audioFile ? audioFile.name : 'Выбрать аудио файл'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Поддерживаются форматы: MP3, WAV, M4A (макс. 8 минут)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Продвинутый режим</Label>
            <Switch checked={customMode} onCheckedChange={setCustomMode} />
          </div>

          <div>
            <Label htmlFor="prompt">Описание инструментала</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Рок инструментал с электрогитарами и мощными барабанами"
              rows={4}
              className="mt-2 resize-none"
            />
          </div>

          {customMode && (
            <>
              <div>
                <Label htmlFor="style">Стиль инструментала</Label>
                <Input
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="rock, electric guitars, powerful drums"
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
            <Button onClick={handleSubmit} disabled={loading || !audioFile}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Добавить инструментал'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
