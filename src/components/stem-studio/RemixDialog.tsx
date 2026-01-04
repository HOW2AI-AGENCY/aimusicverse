/**
 * Remix Dialog
 * 
 * Create a remix of the track in a new style
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Loader2, Music, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface RemixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Tables<'tracks'>;
}

const STYLE_PRESETS = [
  { label: 'Lo-Fi', value: 'lo-fi, chill, relaxed, mellow beats' },
  { label: 'EDM', value: 'edm, electronic, energetic, dance' },
  { label: 'Acoustic', value: 'acoustic, unplugged, intimate, organic' },
  { label: 'Jazz', value: 'jazz, smooth, sophisticated, swing' },
  { label: 'Rock', value: 'rock, powerful, electric guitar, drums' },
  { label: 'R&B', value: 'r&b, soulful, groove, smooth' },
  { label: 'Synthwave', value: 'synthwave, retro, 80s, neon' },
  { label: 'Orchestral', value: 'orchestral, cinematic, epic, strings' },
];

export function RemixDialog({ open, onOpenChange, track }: RemixDialogProps) {
  const [title, setTitle] = useState(`${track.title || 'Трек'} (ремикс)`);
  const [style, setStyle] = useState(track.style || '');
  const [prompt, setPrompt] = useState('');
  const [isInstrumental, setIsInstrumental] = useState(track.is_instrumental ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePresetClick = (preset: typeof STYLE_PRESETS[0]) => {
    setStyle(preset.value);
  };

  const handleSubmit = async () => {
    if (!track.suno_id) {
      toast.error('Нет данных для создания ремикса');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { data, error } = await supabase.functions.invoke('suno-remix', {
        body: {
          audioId: track.suno_id,
          prompt: prompt || `Ремикс в стиле: ${style}`,
          style: style,
          title: title,
          instrumental: isInstrumental,
          model: 'chirp-v4',
        }
      });

      if (error) throw error;

      toast.success('Создание ремикса запущено', {
        description: 'Процесс займёт 1-3 минуты'
      });
      
      onOpenChange(false);
    } catch (error) {
      logger.error('Error creating remix', error);
      toast.error('Ошибка при создании ремикса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-primary" />
            Создать ремикс
          </DialogTitle>
          <DialogDescription>
            AI создаст новую версию трека в выбранном стиле
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Original Track */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {track.cover_url ? (
              <img 
                src={track.cover_url} 
                alt={track.title || 'Cover'} 
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{track.title || 'Без названия'}</p>
              <p className="text-xs text-muted-foreground truncate">{track.style || 'Оригинал'}</p>
            </div>
          </div>

          {/* New Title */}
          <div className="space-y-2">
            <Label>Название ремикса</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
            />
          </div>

          {/* Style Presets */}
          <div className="space-y-2">
            <Label>Выберите стиль</Label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((preset) => (
                <Badge
                  key={preset.label}
                  variant={style === preset.value ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    style === preset.value && "bg-primary"
                  )}
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom Style */}
          <div className="space-y-2">
            <Label>Свой стиль (опционально)</Label>
            <Textarea
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Опишите желаемый стиль ремикса..."
              rows={2}
            />
          </div>

          {/* Additional Prompt */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Дополнительные указания
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Добавьте детали для AI: темп, настроение, инструменты..."
              rows={2}
            />
          </div>

          {/* Instrumental Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInstrumental}
              onChange={(e) => setIsInstrumental(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">Инструментальная версия (без вокала)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !style.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Создаём...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 mr-2" />
                Создать ремикс
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
