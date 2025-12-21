/**
 * ReferenceFromStemDialog - Use stem as reference for new generation
 * Phase 4: Unified studio refinement
 */

import { useState } from 'react';
import { Sparkles, Music2, Mic2, Drum, Guitar, Piano, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrackStem } from '@/hooks/useTrackStems';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { getStemLabel } from '@/lib/stemLabels';
import { cn } from '@/lib/utils';

interface ReferenceFromStemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stem: TrackStem | null;
  trackTitle: string;
  onReferenceCreated?: (referenceId: string) => void;
}

const stemIcons: Record<string, React.ComponentType<any>> = {
  vocals: Mic2,
  drums: Drum,
  bass: Guitar,
  guitar: Guitar,
  piano: Piano,
  other: Music2,
  instrumental: Music2
};

export function ReferenceFromStemDialog({ 
  open, 
  onOpenChange, 
  stem,
  trackTitle,
  onReferenceCreated 
}: ReferenceFromStemDialogProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [description, setDescription] = useState('');

  if (!stem) return null;

  const Icon = stemIcons[stem.stem_type.toLowerCase()] || Music2;

  const handleCreateReference = async () => {
    if (!user || !stem) return;

    setIsCreating(true);
    try {
      // Create reference_audio entry
      const { data, error } = await supabase
        .from('reference_audio')
        .insert({
          user_id: user.id,
          file_url: stem.audio_url,
          file_name: `${trackTitle}_${getStemLabel(stem.stem_type)}`,
          source: 'stem',
          has_vocals: stem.stem_type.toLowerCase() === 'vocals',
          has_instrumentals: stem.stem_type.toLowerCase() !== 'vocals',
          style_description: description || `${getStemLabel(stem.stem_type)} from "${trackTitle}"`,
          analysis_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Trigger analysis
      await supabase.functions.invoke('analyze-reference-audio', {
        body: {
          referenceId: data.id,
          audioUrl: stem.audio_url,
          analyzeStyle: true,
          detectBpm: true
        }
      });

      toast.success('Референс создан!', {
        description: 'Теперь можно использовать его при генерации'
      });

      onReferenceCreated?.(data.id);
      onOpenChange(false);

    } catch (error) {
      logger.error('Failed to create reference from stem', error);
      toast.error('Не удалось создать референс');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Использовать как референс
          </SheetTitle>
          <SheetDescription>
            Создай референс из стема для генерации похожих треков
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {/* Stem Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-primary/10"
            )}>
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{getStemLabel(stem.stem_type)}</h4>
              <p className="text-sm text-muted-foreground">{trackTitle}</p>
            </div>
            <Badge variant="secondary">
              {stem.stem_type.toLowerCase() === 'vocals' ? 'Вокал' : 'Инструментал'}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание стиля (опционально)</Label>
            <Textarea
              id="description"
              placeholder="Опиши что особенного в этом стеме..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              AI автоматически проанализирует аудио и дополнит описание
            </p>
          </div>

          {/* What will happen */}
          <div className="p-4 border rounded-xl space-y-2">
            <h4 className="text-sm font-medium">Что произойдёт:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Стем сохранится как референс-аудио</li>
              <li>• AI проанализирует BPM, тональность, стиль</li>
              <li>• Можно будет выбрать его при генерации нового трека</li>
              <li>• Новый трек унаследует характеристики стема</li>
            </ul>
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleCreateReference}
            disabled={isCreating}
            className="w-full h-12 gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создаю референс...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Создать референс
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
