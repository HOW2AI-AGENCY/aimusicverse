import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TrackStem } from '@/hooks/useTrackStems';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ReferenceManager } from '@/services/audio-reference';
import { getStemLabel } from '@/lib/stemLabels';
import { getStemColor as getDesignStemColor } from '@/lib/design-colors';

interface StemReferenceDialogProps {
  stems: TrackStem[];
  trackTitle: string;
  trackLyrics?: string | null;
  trackStyle?: string | null;
  trackPrompt?: string | null;
  trackTags?: string | null;
}

// Use centralized stem colors from design tokens
const getStemColorClass = (stemType: string): string => {
  return getDesignStemColor(stemType).combined;
};

export const StemReferenceDialog = ({ 
  stems, 
  trackTitle, 
  trackLyrics, 
  trackStyle, 
  trackPrompt,
  trackTags
}: StemReferenceDialogProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedStem, setSelectedStem] = useState<TrackStem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUseAsReference = async () => {
    if (!selectedStem) return;
    
    setIsLoading(true);
    try {
      // Use unified ReferenceManager
      ReferenceManager.createFromStem({
        audioUrl: selectedStem.audio_url,
        stemType: selectedStem.stem_type,
        trackTitle: trackTitle,
        lyrics: trackLyrics || undefined,
        style: trackStyle || undefined,
      });
      
      toast.success('Референс из студии загружен');
      setOpen(false);
      
      // Navigate to home with flag to open generate sheet
      navigate('/', { state: { openGenerate: true, fromStemReference: true } });
    } catch (error) {
      console.error('Error setting reference', error);
      toast.error('Ошибка при установке референса');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="w-4 h-4" />
          Использовать как референс
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Выберите стем для генерации</DialogTitle>
          <DialogDescription>
            Используйте отдельный стем как аудио-референс для создания нового трека
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-2 py-4">
          {stems.map((stem) => (
            <button
              key={stem.id}
              onClick={() => setSelectedStem(stem)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                getStemColorClass(stem.stem_type),
                selectedStem?.id === stem.id 
                  ? "ring-2 ring-primary border-primary" 
                  : "hover:bg-accent/50"
              )}
            >
              <Music className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium">{getStemLabel(stem.stem_type)}</p>
                <p className="text-xs text-muted-foreground">
                  {stem.separation_mode === 'detailed' ? 'Детальное разделение' : 'Простое разделение'}
                </p>
              </div>
              {selectedStem?.id === stem.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleUseAsReference}
            disabled={!selectedStem || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Создать трек
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
